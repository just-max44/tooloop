import { apiRequest, getAccessToken } from '@/lib/backend/custom-api';

type EventItem = {
  id: number;
  topic: string;
  payload: Record<string, unknown>;
  created_at: string;
};

type PollingResult = {
  events: EventItem[];
  lastId: number;
};

export function subscribeToTopic(topic: string, onEvent: (event: EventItem) => void) {
  const baseUrl = process.env.EXPO_PUBLIC_CUSTOM_API_BASE_URL?.trim();
  if (!baseUrl) {
    return () => {};
  }

  let sinceId = 0;
  let isStopped = false;
  let socket: WebSocket | null = null;
  let pollTimer: ReturnType<typeof setInterval> | null = null;

  const stopPolling = () => {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  };

  const startPolling = () => {
    if (pollTimer) {
      return;
    }

    pollTimer = setInterval(() => {
      if (isStopped) {
        return;
      }

      apiRequest<PollingResult>(`/v1/events?topic=${encodeURIComponent(topic)}&sinceId=${sinceId}`)
        .then((payload) => {
          payload.events.forEach((item) => onEvent(item));
          sinceId = payload.lastId;
        })
        .catch(() => {});
    }, 10000);
  };

  void (async () => {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      startPolling();
      return;
    }

    const wsUrl = baseUrl.replace(/^http/, 'ws').replace(/\/$/, '') + `/ws?token=${encodeURIComponent(accessToken)}`;
    socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      stopPolling();
      socket?.send(JSON.stringify({ action: 'subscribe', topic, sinceId }));
    };

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(String(event.data)) as {
          type: string;
          items?: EventItem[];
          lastId?: number;
        };

        if (payload.type !== 'events') {
          return;
        }

        payload.items?.forEach((item) => onEvent(item));
        sinceId = payload.lastId ?? sinceId;
      } catch {
        // ignore malformed payload
      }
    };

    socket.onerror = () => {
      startPolling();
    };

    socket.onclose = () => {
      if (!isStopped) {
        startPolling();
      }
    };
  })();

  return () => {
    isStopped = true;
    stopPolling();
    socket?.close();
  };
}