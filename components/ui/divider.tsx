import { StyleSheet, View, type ViewProps } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';

type DividerProps = ViewProps & {
  spacing?: number;
};

export function Divider({ spacing = Spacing.lg, style, ...rest }: DividerProps) {
  const border = useThemeColor({}, 'border');

  return (
    <View
      style={[styles.base, { backgroundColor: border, marginVertical: spacing }, style]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
  },
});
