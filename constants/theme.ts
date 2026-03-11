/**
 * Design tokens for Tooloop.
 * 8px grid system · Modern, Stripe/Linear-inspired visual language.
 */

import { Platform } from 'react-native';

const tintColorLight = '#2E6A55';
const tintColorDark = '#86B8A5';

export const Radius = {
  xs: 8,
  sm: 14,
  md: 18,
  lg: 24,
  xl: 30,
  full: 999,
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 40,
} as const;

export const Shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: '#1B1914',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  card: {
    shadowColor: '#1B1914',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  md: {
    shadowColor: '#1B1914',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 6,
  },
  lg: {
    shadowColor: '#1B1914',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.18,
    shadowRadius: 30,
    elevation: 10,
  },
} as const;

export const Colors = {
  light: {
    text: '#1F2522',
    background: '#F4F1EA',
    surface: '#FFFCF7',
    surfaceRaised: '#F7F2EA',
    mutedText: '#66706B',
    border: '#DCD3C5',
    borderSubtle: '#EAE3D8',
    success: '#2E6A55',
    warning: '#B67A2D',
    danger: '#B35F58',
    tint: tintColorLight,
    tintSubtle: `${tintColorLight}14`,
    tintMuted: `${tintColorLight}22`,
    icon: '#66706B',
    tabIconDefault: '#9D978C',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#EEF4F0',
    background: '#191B19',
    surface: '#212723',
    surfaceRaised: '#2A312C',
    mutedText: '#A5B0AA',
    border: '#3B4640',
    borderSubtle: '#303A34',
    success: '#86B8A5',
    warning: '#D7A86C',
    danger: '#DE8E86',
    tint: tintColorDark,
    tintSubtle: `${tintColorDark}14`,
    tintMuted: `${tintColorDark}22`,
    icon: '#A5B0AA',
    tabIconDefault: '#7F8B84',
    tabIconSelected: tintColorDark,
  },
};

/** Pre-computed derived colors used across screens. */
export function getDerivedColors(theme: 'light' | 'dark') {
  const c = Colors[theme];
  return {
    ...c,
    softSurface: `${c.surface}F2`,
    softBorder: `${c.border}AA`,
    selectedTintBg: c.tintSubtle,
    dangerBg: `${c.danger}10`,
    dangerBorder: `${c.danger}55`,
    warningBg: `${c.warning}12`,
    warningBorder: `${c.warning}55`,
    tintBorder: `${c.tint}55`,
    tintBg: `${c.tint}12`,
  } as const;
}

export const Fonts = Platform.select({
  ios: {
    sans: 'Avenir Next',
    serif: 'Iowan Old Style',
    rounded: 'Avenir Next',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'sans-serif',
    serif: 'serif',
    rounded: 'sans-serif',
    mono: 'monospace',
  },
  web: {
    sans: "'Avenir Next', 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif",
    serif: "'Iowan Old Style', 'Palatino Linotype', 'Times New Roman', serif",
    rounded: "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
