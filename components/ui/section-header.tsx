import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
};

export function SectionHeader({ title, subtitle, icon }: SectionHeaderProps) {
  const tint = useThemeColor({}, 'tint');
  const tintSubtle = useThemeColor({}, 'tintSubtle');

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        {icon ? (
          <View style={[styles.iconWrap, { backgroundColor: tintSubtle }]}>
            <MaterialIcons name={icon} size={16} color={tint} />
          </View>
        ) : null}
        <ThemedText type="subtitle">{title}</ThemedText>
      </View>
      {subtitle ? <ThemedText type="caption">{subtitle}</ThemedText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
