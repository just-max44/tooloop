import { StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { normalizeTextNode } from '@/lib/i18n/text-normalize';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link' | 'caption' | 'label' | 'heading';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  children,
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
  const linkColor = useThemeColor({ light: lightColor, dark: darkColor }, 'tint');
  const mutedColor = useThemeColor({}, 'mutedText');

  return (
    <Text
      style={[
        { color },
        styles[type],
        type === 'link' && { color: linkColor },
        type === 'caption' && { color: mutedColor },
        style,
      ]}
      {...rest}>
      {normalizeTextNode(children)}
    </Text>
  );
}

const styles = StyleSheet.create({
  default: {
    fontFamily: Fonts?.sans,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0.12,
  },
  defaultSemiBold: {
    fontFamily: Fonts?.sans,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
    letterSpacing: 0.08,
  },
  heading: {
    fontFamily: Fonts?.serif,
    fontSize: 29,
    fontWeight: '700',
    lineHeight: 36,
    letterSpacing: -0.6,
  },
  title: {
    fontFamily: Fonts?.serif,
    fontSize: 34,
    fontWeight: '700',
    lineHeight: 42,
    letterSpacing: -0.8,
  },
  subtitle: {
    fontFamily: Fonts?.sans,
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
    letterSpacing: -0.1,
  },
  caption: {
    fontFamily: Fonts?.sans,
    fontSize: 13,
    lineHeight: 19,
    letterSpacing: 0.2,
  },
  label: {
    fontFamily: Fonts?.sans,
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 16,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  link: {
    fontFamily: Fonts?.sans,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
  },
});
