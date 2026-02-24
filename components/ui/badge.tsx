import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';

type BadgeVariant = 'primary' | 'neutral' | 'danger';

type BadgeProps = {
  label: string;
  variant?: BadgeVariant;
};

export function Badge({ label, variant = 'neutral' }: BadgeProps) {
  const tint = useThemeColor({}, 'tint');
  const mutedText = useThemeColor({}, 'mutedText');
  const border = useThemeColor({}, 'border');
  const danger = useThemeColor({}, 'danger');

  const backgroundColor =
    variant === 'primary' ? tint : variant === 'danger' ? danger : 'transparent';
  const textColor = variant === 'neutral' ? mutedText : '#FFFFFF';

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor,
          borderColor: variant === 'neutral' ? border : 'transparent',
          borderWidth: variant === 'neutral' ? 1 : 0,
        },
      ]}>
      <ThemedText type="defaultSemiBold" style={[styles.text, { color: textColor }]}>
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  text: {
    fontSize: 12,
    lineHeight: 16,
  },
});
