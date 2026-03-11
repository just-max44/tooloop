import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';

type BadgeVariant = 'primary' | 'neutral' | 'danger' | 'success' | 'warning';

type BadgeProps = {
  label: string;
  variant?: BadgeVariant;
};

export function Badge({ label, variant = 'neutral' }: BadgeProps) {
  const tint = useThemeColor({}, 'tint');
  const mutedText = useThemeColor({}, 'mutedText');
  const border = useThemeColor({}, 'border');
  const danger = useThemeColor({}, 'danger');
  const success = useThemeColor({}, 'success');
  const warning = useThemeColor({}, 'warning');

  const config: Record<BadgeVariant, { bg: string; fg: string; borderColor: string }> = {
    primary: { bg: `${tint}16`, fg: tint, borderColor: `${tint}30` },
    success: { bg: `${success}16`, fg: success, borderColor: `${success}30` },
    warning: { bg: `${warning}16`, fg: warning, borderColor: `${warning}30` },
    danger: { bg: `${danger}16`, fg: danger, borderColor: `${danger}30` },
    neutral: { bg: 'transparent', fg: mutedText, borderColor: border },
  };

  const { bg, fg, borderColor } = config[variant];

  return (
    <View style={[styles.base, { backgroundColor: bg, borderColor }]}>
      <ThemedText type="defaultSemiBold" style={[styles.text, { color: fg }]}>
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    borderRadius: Radius.full,
    borderWidth: 1,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 3,
  },
  text: {
    fontSize: 12,
    lineHeight: 16,
  },
});
