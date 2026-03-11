import { type Response, Router } from 'express';
import { z } from 'zod';

import { db } from '../db.js';
import { authRequired, type AuthenticatedRequest } from '../middleware/auth.js';

const querySchema = z.object({
  topic: z.string().trim().min(1),
  sinceId: z.string().optional(),
});

const postSchema = z.object({
  topic: z.string().trim().min(1),
  payload: z.record(z.string(), z.unknown()),
});

export const eventsRouter = Router();

eventsRouter.get('/', authRequired, async (req: AuthenticatedRequest, res: Response) => {
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid query', details: parsed.error.flatten() });
    return;
  }

  const sinceId = Number(parsed.data.sinceId ?? '0');
  const topic = parsed.data.topic;

  const result = await db.query(
    `
      select id, topic, payload, created_at
      from app_events
      where topic = $1 and id > $2
      order by id asc
      limit 100
    `,
    [topic, Number.isFinite(sinceId) ? sinceId : 0]
  );

  res.json({
    events: result.rows,
    lastId: result.rows.at(-1)?.id ?? sinceId,
  });
});

eventsRouter.post('/', authRequired, async (req: AuthenticatedRequest, res: Response) => {
  const parsed = postSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
    return;
  }

  const result = await db.query(
    'insert into app_events (topic, payload) values ($1, $2::jsonb) returning id, topic, payload, created_at',
    [parsed.data.topic, JSON.stringify(parsed.data.payload)]
  );

  res.status(201).json(result.rows[0]);
});