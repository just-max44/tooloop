import type { Server as HttpServer } from 'node:http';
import { URL } from 'node:url';

import { WebSocket, WebSocketServer } from 'ws';

import { verifyAccessToken } from '../auth.js';
import { db } from '../db.js';

type TopicState = {
  topic: string;
  sinceId: number;
};

const POLL_INTERVAL_MS = 2_000;
const HEARTBEAT_INTERVAL_MS = 30_000;

export function attachRealtimeServer(server: HttpServer) {
  const wss = new WebSocketServer({ server, path: '/ws' });
  const clientTopics = new Map<WebSocket, TopicState>();
  const alive = new WeakSet<WebSocket>();

  wss.on('connection', (socket, req) => {
    // Authenticate via ?token=JWT query param
    const url = new URL(req.url ?? '', `http://${req.headers.host ?? 'localhost'}`);
    const token = url.searchParams.get('token');

    if (!token) {
      socket.close(4001, 'Missing token');
      return;
    }

    try {
      verifyAccessToken(token);
    } catch {
      socket.close(4003, 'Invalid token');
      return;
    }

    alive.add(socket);

    socket.on('pong', () => {
      alive.add(socket);
    });

    socket.on('message', (raw) => {
      try {
        const parsed = JSON.parse(String(raw)) as { action?: string; topic?: string; sinceId?: number };

        if (parsed.action !== 'subscribe' || !parsed.topic) {
          return;
        }

        clientTopics.set(socket, {
          topic: parsed.topic,
          sinceId: Number.isFinite(parsed.sinceId) ? Number(parsed.sinceId) : 0,
        });
      } catch {
        // ignore malformed WS payload
      }
    });

    socket.on('close', () => {
      clientTopics.delete(socket);
    });

    socket.on('error', () => {
      clientTopics.delete(socket);
    });
  });

  // Heartbeat: ping all clients and terminate stale ones
  const heartbeat = setInterval(() => {
    for (const socket of wss.clients) {
      if (!alive.has(socket)) {
        clientTopics.delete(socket);
        socket.terminate();
        continue;
      }

      alive.delete(socket);
      socket.ping();
    }
  }, HEARTBEAT_INTERVAL_MS);

  // Poll for new events and dispatch to subscribers
  const timer = setInterval(async () => {
    for (const [socket, state] of clientTopics.entries()) {
      if (socket.readyState !== socket.OPEN) {
        clientTopics.delete(socket);
        continue;
      }

      try {
        const result = await db.query(
          `
            select id, topic, payload, created_at
            from app_events
            where topic = $1 and id > $2
            order by id asc
            limit 50
          `,
          [state.topic, state.sinceId]
        );

        if (!result.rowCount) {
          continue;
        }

        state.sinceId = Number(result.rows.at(-1)?.id ?? state.sinceId);
        socket.send(
          JSON.stringify({
            type: 'events',
            topic: state.topic,
            items: result.rows,
            lastId: state.sinceId,
          })
        );
      } catch {
        // Avoid crashing the polling loop on transient DB errors
      }
    }
  }, POLL_INTERVAL_MS);

  wss.on('close', () => {
    clearInterval(timer);
    clearInterval(heartbeat);
  });
}