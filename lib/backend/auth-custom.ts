import { useEffect, useState } from 'react';

import {
    apiRequest,
    clearSessionTokens,
    isCustomApiConfigured,
    setSessionTokens,
} from '@/lib/backend/custom-api';

type CustomUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  privateCity?: string | null;
  privatePostalCode?: string | null;
};

type CustomSession = {
  user: {
    id: string;
    email?: string;
    user_metadata?: Record<string, unknown>;
  };
};

type AuthPayload = {
  user: CustomUser;
  accessToken: string;
  refreshToken: string;
};

const authChangeListeners = new Set<() => void>();

function notifyAuthChanged() {
  authChangeListeners.forEach((listener) => listener());
}

function subscribeAuthChanges(listener: () => void) {
  authChangeListeners.add(listener);
  return () => authChangeListeners.delete(listener);
}

function toSessionFromUser(user: CustomUser): CustomSession {
  return {
    user: {
      id: user.id,
      email: user.email,
      user_metadata: {
        first_name: user.firstName,
        last_name: user.lastName,
        avatar_url: user.avatarUrl ?? '',
        private_city: user.privateCity ?? '',
        private_postal_code: user.privatePostalCode ?? '',
      },
    },
  };
}

export function useCustomAuthSession() {
  const [session, setSession] = useState<CustomSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isCustomApiConfigured) {
      setSession(null);
      setIsLoading(false);
      return;
    }

    let mounted = true;

    const refreshFromApi = async () => {
      try {
        const payload = await apiRequest<{ user: CustomUser }>('/v1/auth/me');
        if (mounted) {
          setSession(toSessionFromUser(payload.user));
        }
      } catch {
        await clearSessionTokens();
        if (mounted) {
          setSession(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    void refreshFromApi();

    const unsubscribe = subscribeAuthChanges(() => {
      if (!mounted) {
        return;
      }
      setIsLoading(true);
      void refreshFromApi();
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  return {
    session,
    isLoading,
    isBackendConfigured: isCustomApiConfigured,
  };
}

async function persistSession(payload: AuthPayload) {
  await setSessionTokens(payload.accessToken, payload.refreshToken);
  notifyAuthChanged();
  return toSessionFromUser(payload.user);
}

export async function customSignInWithEmailPassword(email: string, password: string) {
  const payload = await apiRequest<AuthPayload>('/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  await persistSession(payload);
}

export async function customSignUpWithEmailPassword(email: string, password: string, firstName: string, lastName: string) {
  const payload = await apiRequest<AuthPayload>('/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, firstName, lastName }),
  });

  await persistSession(payload);
}

export async function customSignOutSession() {
  await apiRequest('/v1/auth/logout', { method: 'POST' }).catch(() => {});
  await clearSessionTokens();
  notifyAuthChanged();
}

export async function customGetPrivateLocationPreference() {
  const payload = await apiRequest<{ user: CustomUser }>('/v1/auth/me');
  const city = payload.user.privateCity?.trim() ?? '';
  const postalCode = payload.user.privatePostalCode?.trim() ?? '';
  if (!city && !postalCode) {
    return null;
  }

  return { city, postalCode };
}

export async function customUpdatePrivateLocationPreference(input: { city: string; postalCode: string }) {
  await apiRequest('/v1/auth/me/private-location', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function customUpdateProfilePhotoPreference(photoUri: string) {
  await apiRequest('/v1/auth/me/avatar', {
    method: 'PATCH',
    body: JSON.stringify({ photoUri }),
  });
}

export async function customDeleteCurrentAccount() {
  throw new Error('Suppression de compte custom non implémentée côté backend.');
}

export async function customChangePasswordWithCurrentPassword(_currentPassword: string, _newPassword: string) {
  throw new Error('Changement de mot de passe custom non implémenté côté backend.');
}

export async function customSendPasswordResetEmail(_email: string) {
  throw new Error('Reset password custom non implémenté côté backend.');
}

export async function customSignInWithOAuthProvider(_provider: string) {
  throw new Error('OAuth non implémenté dans le backend custom.');
}

export async function customSignInWithGoogleIdToken(_idToken: string) {
  throw new Error('Google ID token non implémenté dans le backend custom.');
}