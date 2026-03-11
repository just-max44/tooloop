import { StyleSheet, View, type ViewProps, type ViewStyle } from 'react-native';

import { Radius, Shadows, Spacing } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';

type CardVariant = 'elevated' | 'outlined' | 'filled';

type CardProps = ViewProps & {
  variant?: CardVariant;
  padding?: 'none' | 'sm' | 'md' | 'lg';
};

const paddings: Record<NonNullable<CardProps['padding']>, number> = {
  none: 0,
  sm: Spacing.md,
  md: Spacing.lg,
  lg: Spacing.xl,
};

export function Card({ variant = 'elevated', padding = 'md', style, ...props }: CardProps) {
  const surface = useThemeColor({}, 'surface');
  const border = useThemeColor({}, 'border');
  const borderSubtle = useThemeColor({}, 'borderSubtle');
  const surfaceRaised = useThemeColor({}, 'surfaceRaised');

  const variantStyle: ViewStyle =
    variant === 'outlined'
      ? { borderWidth: 1, borderColor: border, backgroundColor: surfaceRaised }
      : variant === 'filled'
        ? { backgroundColor: surfaceRaised, borderWidth: 1, borderColor: borderSubtle }
        : { backgroundColor: surface, borderWidth: 1, borderColor: borderSubtle, ...Shadows.card };

  return (
    <View
      style={[styles.base, variantStyle, { padding: paddings[padding] }, style]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.md,
  },
});
