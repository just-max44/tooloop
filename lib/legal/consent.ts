// lib/legal/consent.ts
// RGPD consent and privacy management

import AsyncStorage from '@react-native-async-storage/async-storage';

const CONSENT_KEY = 'tooloop.rgpd.consent';

export async function getConsentStatus(): Promise<boolean> {
  const value = await AsyncStorage.getItem(CONSENT_KEY);
  return value === '1';
}

export async function setConsentStatus(consent: boolean) {
  await AsyncStorage.setItem(CONSENT_KEY, consent ? '1' : '0');
}

export async function clearConsentStatus() {
  await AsyncStorage.removeItem(CONSENT_KEY);
}

// Usage example:
// await setConsentStatus(true);
// const consent = await getConsentStatus();
