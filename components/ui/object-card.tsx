import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Radius, Shadows, Spacing } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';

type ObjectCardProps = {
  title: string;
  description: string;
  imageUrl: string;
  distanceKm: number;
  ownerName: string;
  ownerAvatarUrl?: string;
  responseTime: string;
  isFree?: boolean;
  trustScore?: number;
  loopsCompleted?: number;
  onBorrowPress?: () => void;
  onPress?: () => void;
  onOwnerPress?: () => void;
};

export function ObjectCard({
  title,
  description,
  imageUrl,
  distanceKm,
  ownerName,
  ownerAvatarUrl,
  responseTime,
  isFree = false,
  trustScore,
  loopsCompleted,
  onBorrowPress,
  onPress,
  onOwnerPress,
}: ObjectCardProps) {
  const mutedText = useThemeColor({}, 'mutedText');
  const border = useThemeColor({}, 'border');
  const tint = useThemeColor({}, 'tint');
  const surface = useThemeColor({}, 'surface');

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Ouvrir ${title}`}
      disabled={!onPress}
      style={({ pressed }) => [styles.pressable, pressed && styles.pressablePressed]}>
      <Card padding="none" style={styles.card}>
        <View style={styles.imageWrap}>
          <Image source={{ uri: imageUrl }} style={styles.image} contentFit="cover" />
          <View style={[styles.distancePill, { backgroundColor: surface, ...Shadows.xs }]}>
            <MaterialIcons name="place" size={13} color={tint} />
            <ThemedText type="defaultSemiBold" style={styles.pillText}>
              {distanceKm.toFixed(1)} km
            </ThemedText>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.titleBlock}>
            <ThemedText type="subtitle" numberOfLines={1}>{title}</ThemedText>
            <ThemedText type="caption" numberOfLines={2}>{description}</ThemedText>
          </View>

          {(typeof trustScore === 'number' || typeof loopsCompleted === 'number') && (
            <View style={styles.signalRow}>
              {typeof trustScore === 'number' ? (
                <View style={[styles.signalChip, { backgroundColor: `${tint}0C` }]}>
                  <MaterialIcons name="verified-user" size={13} color={tint} />
                  <ThemedText style={[styles.signalText, { color: tint }]}>{trustScore}%</ThemedText>
                </View>
              ) : null}
              {typeof loopsCompleted === 'number' ? (
                <View style={[styles.signalChip, { backgroundColor: `${tint}0C` }]}>
                  <MaterialIcons name="sync" size={13} color={tint} />
                  <ThemedText style={[styles.signalText, { color: tint }]}>{loopsCompleted} prêts</ThemedText>
                </View>
              ) : null}
            </View>
          )}

          <View style={[styles.footer, { borderTopColor: border }]}>
            <Pressable
              onPress={(event) => {
                event.stopPropagation();
                onOwnerPress?.();
              }}
              accessibilityRole="button"
              accessibilityLabel={`Ouvrir la confiance de ${ownerName}`}
              style={styles.ownerRow}>
              <Avatar name={ownerName} uri={ownerAvatarUrl} size={34} />
              <View style={styles.ownerTextWrap}>
                <ThemedText type="defaultSemiBold" style={styles.ownerName}>{ownerName}</ThemedText>
                <ThemedText type="caption">Rép. {responseTime}</ThemedText>
              </View>
            </Pressable>
            <Button
              label={isFree ? 'Emprunter' : 'Demander'}
              size="sm"
              onPress={onBorrowPress}
            />
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    borderRadius: Radius.md,
  },
  pressablePressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  card: {
    overflow: 'hidden',
  },
  imageWrap: {
    height: 180,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  distancePill: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs + 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  pillText: {
    fontSize: 12,
    lineHeight: 16,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  titleBlock: {
    gap: Spacing.xs,
  },
  signalRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  signalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  signalText: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  ownerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  ownerTextWrap: {
    flex: 1,
    gap: 1,
  },
  ownerName: {
    fontSize: 14,
  },
});
