import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Radius, Spacing } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';

type EmptyStateProps = {
  icon?: keyof typeof MaterialIcons.glyphMap;
  title: string;
  description?: string;
};

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  const mutedText = useThemeColor({}, 'mutedText');
  const tint = useThemeColor({}, 'tint');

  return (
    <Card style={styles.card}>
      {icon ? (
        <View style={[styles.iconWrap, { backgroundColor: `${tint}10` }]}>
          <MaterialIcons name={icon} size={24} color={tint} />
        </View>
      ) : null}
      <ThemedText type="defaultSemiBold" style={styles.title}>
        {title}
      </ThemedText>
      {description ? (
        <ThemedText type="caption" style={{ color: mutedText, textAlign: 'center' }}>
          {description}
        </ThemedText>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  title: {
    textAlign: 'center',
  },
});
