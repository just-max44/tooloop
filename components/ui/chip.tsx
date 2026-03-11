import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';

type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
};

export function Chip({ label, selected = false, onPress, accessibilityLabel }: ChipProps) {
  const text = useThemeColor({}, 'text');
  const tint = useThemeColor({}, 'tint');
  const surfaceRaised = useThemeColor({}, 'surfaceRaised');
  const borderSubtle = useThemeColor({}, 'borderSubtle');

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? `${tint}16` : surfaceRaised,
          borderColor: selected ? tint : borderSubtle,
        },
        pressed && styles.pressed,
      ]}>
      <ThemedText
        type="defaultSemiBold"
        style={[styles.label, { color: selected ? tint : text }]}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 11,
    borderWidth: 1,
  },
  label: {
    fontSize: 13,
    lineHeight: 18,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
});
