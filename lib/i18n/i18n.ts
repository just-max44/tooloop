// lib/i18n/i18n.ts
// Simple internationalization setup

import { I18n } from 'i18n-js';

import fr from './translations/fr.json';
import en from './translations/en.json';

const i18n = new I18n({ fr, en });
i18n.defaultLocale = 'fr';
i18n.locale = 'fr';
i18n.enableFallback = true;

export function t(key: string, params?: Record<string, string | number>) {
  return i18n.t(key, params);
}

export function setLocale(locale: 'fr' | 'en') {
  i18n.locale = locale;
}

export function getLocale(): string {
  return i18n.locale;
}
// setLocale('en')
