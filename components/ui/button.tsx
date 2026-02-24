import { ActivityIndicator, Pressable, StyleSheet, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Shadows } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  accessibilityLabel,
  style,
  textStyle,
}: ButtonProps) {
  const tint = useThemeColor({}, 'tint');
  const surface = useThemeColor({}, 'surface');
  const text = useThemeColor({}, 'text');
  const border = useThemeColor({}, 'border');

  const isInactive = disabled || loading;

  const containerStyle: StyleProp<ViewStyle> = [
    styles.base,
    variant === 'primary' && { backgroundColor: tint },
    variant === 'secondary' && { backgroundColor: surface, borderColor: border, borderWidth: 1 },
    variant === 'ghost' && { backgroundColor: 'transparent' },
    isInactive && styles.inactive,
    style,
  ];

  const textColor = variant === 'primary' ? '#FFFFFF' : text;

  return (
    <Pressable
      disabled={isInactive}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isInactive, busy: loading }}
      style={({ pressed }) => [containerStyle, pressed && styles.pressed]}>
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <ThemedText type="defaultSemiBold" style={[styles.label, { color: textColor }, textStyle]}>
          {label}
        </ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    ...Shadows.card,
  },
  label: {
    fontSize: 16,
    lineHeight: 20,
  },
  inactive: {
    opacity: 0.55,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
