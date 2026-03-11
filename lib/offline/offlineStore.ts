// lib/offline/offlineStore.ts
// Simple offline store for listings and objects

import AsyncStorage from '@react-native-async-storage/async-storage';

export type OfflineJsonPrimitive = string | number | boolean | null;
export type OfflineJsonValue = OfflineJsonPrimitive | OfflineJsonValue[] | { [key: string]: OfflineJsonValue };

function isOfflineJsonValue(value: unknown): value is OfflineJsonValue {
  if (value === null) {
    return true;
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return true;
  }

  if (Array.isArray(value)) {
    return value.every(isOfflineJsonValue);
  }

  if (typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).every(isOfflineJsonValue);
  }

  return false;
}

export async function saveOfflineData<T extends OfflineJsonValue>(key: string, data: T) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    // Fallback: log error
    console.error('[Offline] save error', err);
  }
}

export async function loadOfflineData<T extends OfflineJsonValue>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) {
      return null;
    }

    const parsed: unknown = JSON.parse(raw);
    return isOfflineJsonValue(parsed) ? (parsed as T) : null;
  } catch (err) {
    console.error('[Offline] load error', err);
    return null;
  }
}

export async function clearOfflineData(key: string) {
  try {
    await AsyncStorage.removeItem(key);
  } catch (err) {
    console.error('[Offline] clear error', err);
  }
}

// Usage example:
// await saveOfflineData('DISCOVER_OBJECTS', DISCOVER_OBJECTS);
// const cached = await loadOfflineData('DISCOVER_OBJECTS');
