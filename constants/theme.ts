/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#4F7C6A';
const tintColorDark = '#8FB7A6';

export const Radius = {
  sm: 12,
  md: 16,
  lg: 20,
  full: 999,
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const Shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
} as const;

export const Colors = {
  light: {
    text: '#2C3330',
    background: '#F9F7F2',
    surface: '#FFFFFF',
    mutedText: '#717A76',
    border: '#E7E9E7',
    success: '#4F7C6A',
    warning: '#C58E44',
    danger: '#C96A62',
    tint: tintColorLight,
    icon: '#717A76',
    tabIconDefault: '#9AA39F',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#E8EEE9',
    background: '#171B19',
    surface: '#232927',
    mutedText: '#A2ABA7',
    border: '#313735',
    success: '#8FB7A6',
    warning: '#D6A86B',
    danger: '#D88A84',
    tint: tintColorDark,
    icon: '#A2ABA7',
    tabIconDefault: '#78817D',
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
