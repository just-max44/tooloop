import { ActivityIndicator, Pressable, StyleSheet, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Shadows, Spacing } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

const sizeStyles: Record<ButtonSize, { minHeight: number; paddingHorizontal: number; fontSize: number }> = {
  sm: { minHeight: 36, paddingHorizontal: Spacing.md, fontSize: 13 },
  md: { minHeight: 46, paddingHorizontal: Spacing.lg, fontSize: 15 },
  lg: { minHeight: 52, paddingHorizontal: Spacing.xl, fontSize: 16 },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  accessibilityLabel,
  accessibilityHint,
  style,
  textStyle,
}: ButtonProps) {
  const tint = useThemeColor({}, 'tint');
  const surfaceRaised = useThemeColor({}, 'surfaceRaised');
  const text = useThemeColor({}, 'text');
  const border = useThemeColor({}, 'border');
  const danger = useThemeColor({}, 'danger');

  const isInactive = disabled || loading;
  const sizeSpec = sizeStyles[size];

  const containerStyle: StyleProp<ViewStyle> = [
    styles.base,
    { minHeight: sizeSpec.minHeight, paddingHorizontal: sizeSpec.paddingHorizontal },
    variant === 'primary' && { backgroundColor: tint, borderColor: tint, borderWidth: 1, ...Shadows.card },
    variant === 'secondary' && { backgroundColor: surfaceRaised, borderColor: border, borderWidth: 1 },
    variant === 'ghost' && { backgroundColor: `${tint}12`, borderColor: `${tint}2A`, borderWidth: 1 },
    variant === 'danger' && { backgroundColor: `${danger}12`, borderColor: `${danger}44`, borderWidth: 1 },
    isInactive && styles.inactive,
    style,
  ];

  const textColor =
    variant === 'primary'
      ? '#FFFFFF'
      : variant === 'danger'
        ? danger
        : text;

  return (
    <Pressable
      disabled={isInactive}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isInactive, busy: loading }}
      style={({ pressed }) => [containerStyle, pressed && styles.pressed]}>
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <ThemedText
          type="defaultSemiBold"
          style={[styles.label, { color: textColor, fontSize: sizeSpec.fontSize }, textStyle]}>
          {label}
        </ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    lineHeight: 20,
  },
  inactive: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
});
