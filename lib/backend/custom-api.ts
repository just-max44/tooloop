import { safeAuthStorage } from '@/services/safeAuthStorage';

const ACCESS_TOKEN_KEY = 'custom_access_token';
const REFRESH_TOKEN_KEY = 'custom_refresh_token';

const apiBaseUrl = process.env.EXPO_PUBLIC_CUSTOM_API_BASE_URL?.trim();

export const isCustomApiConfigured = Boolean(apiBaseUrl);

export async function getAccessToken() {
  return safeAuthStorage.getItem(ACCESS_TOKEN_KEY);
}

export async function setSessionTokens(accessToken: string, refreshToken: string) {
  await Promise.all([
    safeAuthStorage.setItem(ACCESS_TOKEN_KEY, accessToken),
    safeAuthStorage.setItem(REFRESH_TOKEN_KEY, refreshToken),
  ]);
}

export async function clearSessionTokens() {
  await Promise.all([
    safeAuthStorage.removeItem(ACCESS_TOKEN_KEY),
    safeAuthStorage.removeItem(REFRESH_TOKEN_KEY),
  ]);
}

async function refreshAccessToken() {
  const refreshToken = await safeAuthStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) {
    return null;
  }

  if (!apiBaseUrl) {
    throw new Error('Backend API custom non configuré: EXPO_PUBLIC_CUSTOM_API_BASE_URL manquant.');
  }

  const response = await fetch(`${apiBaseUrl}/v1/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    await clearSessionTokens();
    return null;
  }

  const json = (await response.json()) as {
    accessToken: string;
    refreshToken: string;
  };

  await setSessionTokens(json.accessToken, json.refreshToken);
  return json.accessToken;
}

const API_TIMEOUT_MS = 15_000;

function extractErrorMessage(text: string, status: number): string {
  try {
    const json = JSON.parse(text);
    if (typeof json.error === 'string') return json.error;
  } catch { /* not JSON */ }
  return text || `Erreur API (${status})`;
}

function toNetworkErrorMessage(error: unknown): string {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return 'Délai dépassé: le serveur met trop de temps à répondre.';
  }

  if (error instanceof TypeError) {
    return 'Serveur inaccessible: vérifie EXPO_PUBLIC_CUSTOM_API_BASE_URL et que le backend est démarré.';
  }

  if (error instanceof Error && /se connecter au serveur distant|network|fetch/i.test(error.message)) {
    return 'Serveur inaccessible: vérifie EXPO_PUBLIC_CUSTOM_API_BASE_URL et que le backend est démarré.';
  }

  return 'Connexion réseau impossible.';
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  retryOnUnauthorized = true
): Promise<T> {
  if (!apiBaseUrl) {
    throw new Error('Backend API custom non configuré: EXPO_PUBLIC_CUSTOM_API_BASE_URL manquant.');
  }

  const accessToken = await getAccessToken();
  const headers = new Headers(options.headers ?? {});
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
      let response: Response;
      try {
        response = await fetch(`${apiBaseUrl}${path}`, {
          ...options,
          headers,
          signal: controller.signal,
        });
      } catch (error) {
        throw new Error(toNetworkErrorMessage(error));
      }

    if (response.status === 401 && retryOnUnauthorized) {
      const nextAccessToken = await refreshAccessToken();
      if (nextAccessToken) {
        const retryHeaders = new Headers(options.headers ?? {});
        if (!retryHeaders.has('Content-Type') && options.body) {
          retryHeaders.set('Content-Type', 'application/json');
        }
        retryHeaders.set('Authorization', `Bearer ${nextAccessToken}`);

        const retryController = new AbortController();
        const retryTimeoutId = setTimeout(() => retryController.abort(), API_TIMEOUT_MS);

        try {
            let retryResponse: Response;
            try {
              retryResponse = await fetch(`${apiBaseUrl}${path}`, {
                ...options,
                headers: retryHeaders,
                signal: retryController.signal,
              });
            } catch (error) {
              throw new Error(toNetworkErrorMessage(error));
            }

          if (!retryResponse.ok) {
            const text = await retryResponse.text();
            throw new Error(extractErrorMessage(text, retryResponse.status));
          }

          if (retryResponse.status === 204) {
            return undefined as T;
          }

          return (await retryResponse.json()) as T;
        } finally {
          clearTimeout(retryTimeoutId);
        }
      }
    }

    if (!response.ok) {
      const text = await response.text();
      throw new Error(extractErrorMessage(text, response.status));
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timeoutId);
  }
}