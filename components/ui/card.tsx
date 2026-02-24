import { StyleSheet, View, type ViewProps } from 'react-native';

import { Radius, Shadows } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';

export function Card({ style, ...props }: ViewProps) {
  const surface = useThemeColor({}, 'surface');
  const border = useThemeColor({}, 'border');

  return <View style={[styles.base, { backgroundColor: surface, borderColor: border }, style]} {...props} />;
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: 16,
    ...Shadows.card,
  },
});
