import { useEffect, useState } from 'react';

import type { Provider, Session } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import { getSupabaseClient, isBackendConfigured } from '@/lib/backend/supabase';

WebBrowser.maybeCompleteAuthSession();

function getOAuthRedirectUrl() {
  const envRedirect = process.env.EXPO_PUBLIC_SUPABASE_REDIRECT_TO?.trim();
  if (envRedirect) {
    return envRedirect;
  }

  const redirectUrl = Linking.createURL('auth/callback');

  if (Constants.appOwnership === 'expo') {
    return redirectUrl.replace('/--/--/', '/--/');
  }

  return redirectUrl;
}

function parseHashParams(url: string) {
  const hash = url.split('#')[1] ?? '';
  return new URLSearchParams(hash);
}

function getPasswordResetRedirectUrl() {
  const envRedirect = process.env.EXPO_PUBLIC_PASSWORD_RESET_REDIRECT_TO?.trim();
  if (envRedirect) {
    return envRedirect;
  }

  return Linking.createURL('login');
}

function getDeleteAccountFunctionName() {
  return process.env.EXPO_PUBLIC_DELETE_ACCOUNT_FUNCTION_NAME?.trim() || 'delete-account';
}

export type PrivateLocationPreference = {
  city: string;
  postalCode: string;
};

function normalizePrivateLocationValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

export function useAuthSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isBackendConfigured) {
      setSession(null);
      setIsLoading(false);
      return;
    }

    const client = getSupabaseClient();

    let isMounted = true;

    client.auth
      .getSession()
      .then(({ data }) => {
        if (isMounted) {
          setSession(data.session);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return {
    session,
    isLoading,
    isBackendConfigured,
  };
}

export async function signInWithOAuthProvider(provider: Provider) {
  const client = getSupabaseClient();
  const redirectTo = getOAuthRedirectUrl();

  const { data, error } = await client.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error) {
    throw error;
  }

  if (!data?.url) {
    throw new Error('URL OAuth introuvable.');
  }

  const oauthUrl = new URL(data.url);
  oauthUrl.searchParams.set('redirect_to', redirectTo);

  const authResult = await WebBrowser.openAuthSessionAsync(oauthUrl.toString(), redirectTo);

  if (authResult.type !== 'success' || !authResult.url) {
    throw new Error('Connexion annulée.');
  }

  const parsed = Linking.parse(authResult.url);
  const code = typeof parsed.queryParams?.code === 'string' ? parsed.queryParams.code : null;

  if (code) {
    const { error: exchangeError } = await client.auth.exchangeCodeForSession(code);
    if (exchangeError) {
      throw exchangeError;
    }
    return;
  }

  const hashParams = parseHashParams(authResult.url);
  const accessToken = hashParams.get('access_token');
  const refreshToken = hashParams.get('refresh_token');

  if (accessToken && refreshToken) {
    const { error: sessionError } = await client.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (sessionError) {
      throw sessionError;
    }

    return;
  }

  throw new Error('Réponse OAuth invalide.');
}

export async function signOutSession() {
  const client = getSupabaseClient();
  const { error } = await client.auth.signOut();
  if (error) {
    throw error;
  }
}

export async function signInWithEmailPassword(email: string, password: string) {
  const client = getSupabaseClient();
  const { error } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }
}

export async function signUpWithEmailPassword(email: string, password: string, firstName: string, lastName: string) {
  const client = getSupabaseClient();
  const { error } = await client.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`,
      },
    },
  });

  if (error) {
    throw error;
  }
}

export async function signInWithGoogleIdToken(idToken: string) {
  const client = getSupabaseClient();
  const { error } = await client.auth.signInWithIdToken({
    provider: 'google',
    token: idToken,
  });

  if (error) {
    throw error;
  }
}

export async function sendPasswordResetEmail(email: string) {
  const client = getSupabaseClient();
  const redirectTo = getPasswordResetRedirectUrl();
  const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo });

  if (error) {
    throw error;
  }
}

export async function changePasswordWithCurrentPassword(currentPassword: string, newPassword: string) {
  const client = getSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser();

  if (userError) {
    throw userError;
  }

  const email = user?.email;
  if (!email) {
    throw new Error('Email de compte introuvable.');
  }

  const { error: verifyError } = await client.auth.signInWithPassword({
    email,
    password: currentPassword,
  });

  if (verifyError) {
    throw new Error('Ancien mot de passe incorrect.');
  }

  const { error: updateError } = await client.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    throw updateError;
  }
}

export async function deleteCurrentAccount() {
  const client = getSupabaseClient();
  const functionName = getDeleteAccountFunctionName();

  const { error } = await client.functions.invoke(functionName, {
    body: {},
  });

  if (error) {
    throw error;
  }

  await client.auth.signOut().catch(() => {});
}

export async function getPrivateLocationPreference() {
  const client = getSupabaseClient();
  const {
    data: { user },
    error,
  } = await client.auth.getUser();

  if (error) {
    throw error;
  }

  if (!user) {
    return null;
  }

  const metadata = user.user_metadata as Record<string, unknown> | undefined;
  const city = normalizePrivateLocationValue(metadata?.private_city);
  const postalCode = normalizePrivateLocationValue(metadata?.private_postal_code);

  if (!city && !postalCode) {
    return null;
  }

  return { city, postalCode } satisfies PrivateLocationPreference;
}

export async function updatePrivateLocationPreference(input: PrivateLocationPreference) {
  const city = input.city.trim();
  const postalCode = input.postalCode.trim();

  if (!city || !postalCode) {
    throw new Error('Ville et code postal requis.');
  }

  const client = getSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error('Session utilisateur introuvable.');
  }

  const metadata = (user.user_metadata as Record<string, unknown> | undefined) ?? {};

  const { error: updateError } = await client.auth.updateUser({
    data: {
      ...metadata,
      private_city: city,
      private_postal_code: postalCode,
      private_location_updated_at: new Date().toISOString(),
    },
  });

  if (updateError) {
    throw updateError;
  }
}

export async function updateProfilePhotoPreference(photoUri: string) {
  const normalizedPhotoUri = photoUri.trim();
  if (!normalizedPhotoUri) {
    throw new Error('Photo de profil invalide.');
  }

  const client = getSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error('Session utilisateur introuvable.');
  }

  const metadata = (user.user_metadata as Record<string, unknown> | undefined) ?? {};

  const { error: updateError } = await client.auth.updateUser({
    data: {
      ...metadata,
      avatar_url: normalizedPhotoUri,
      profile_photo_updated_at: new Date().toISOString(),
    },
  });

  if (updateError) {
    throw updateError;
  }

  await client
    .from('users')
    .upsert(
      {
        id: user.id,
        avatar_url: normalizedPhotoUri,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );
}
