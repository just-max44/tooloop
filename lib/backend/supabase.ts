import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, type AppStateStatus, Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const inMemoryStorage = new Map<string, string>();

const safeAuthStorage = {
  async getItem(key: string) {
    if (Platform.OS === 'web') {
      try {
        return globalThis.localStorage?.getItem(key) ?? null;
      } catch {
        return inMemoryStorage.get(key) ?? null;
      }
    }

    try {
      return await AsyncStorage.getItem(key);
    } catch {
      return inMemoryStorage.get(key) ?? null;
    }
  },
  async setItem(key: string, value: string) {
    if (Platform.OS === 'web') {
      try {
        globalThis.localStorage?.setItem(key, value);
      } catch {
        inMemoryStorage.set(key, value);
      }
      return;
    }

    try {
      await AsyncStorage.setItem(key, value);
      return;
    } catch {
      inMemoryStorage.set(key, value);
    }

    inMemoryStorage.set(key, value);
  },
  async removeItem(key: string) {
    if (Platform.OS === 'web') {
      try {
        globalThis.localStorage?.removeItem(key);
      } catch {
        inMemoryStorage.delete(key);
      }
      return;
    }

    try {
      await AsyncStorage.removeItem(key);
      return;
    } catch {
      inMemoryStorage.delete(key);
    }

    inMemoryStorage.delete(key);
  },
};

export const isBackendConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isBackendConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        storage: safeAuthStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;

let authLifecycleInitialized = false;

export function initializeSupabaseAuthLifecycle() {
  if (!supabase || authLifecycleInitialized || Platform.OS === 'web') {
    return;
  }

  authLifecycleInitialized = true;

  const handleAppStateChange = (state: AppStateStatus) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
      return;
    }

    supabase.auth.stopAutoRefresh();
  };

  handleAppStateChange(AppState.currentState);
  AppState.addEventListener('change', handleAppStateChange);
}

export function getSupabaseClient() {
  if (!supabase) {
    throw new Error(
      'Backend non configuré: définis EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY dans .env (local) et dans EAS Environment Variables (build APK/AAB).'
    );
  }

  return supabase;
}
