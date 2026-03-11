// Centralisation du safeAuthStorage
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const inMemoryStorage = new Map<string, string>();

export const safeAuthStorage = {
  async getItem(key: string) {
    if (Platform.OS === 'web') {
      try {
        return globalThis.localStorage?.getItem(key) ?? null;
      } catch {
        return inMemoryStorage.get(key) ?? null;
      }
    }

    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      // fallback AsyncStorage below
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
      await SecureStore.setItemAsync(key, value);
      return;
    } catch {
      // fallback AsyncStorage below
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
      await SecureStore.deleteItemAsync(key);
      return;
    } catch {
      // fallback AsyncStorage below
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
