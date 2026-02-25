import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Radius } from '@/constants/theme';
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
      style={styles.pressable}>
      <Card style={styles.card}>
        <View style={styles.imageWrap}>
          <Image source={{ uri: imageUrl }} style={styles.image} contentFit="cover" />
          <View style={[styles.topLeftPill, { borderColor: tint, backgroundColor: surface }]}> 
            <ThemedText type="defaultSemiBold" style={styles.pillText}>
              📍 À {distanceKm.toFixed(1)} km
            </ThemedText>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.titleBlock}>
            <ThemedText type="subtitle">{title}</ThemedText>
            <ThemedText style={{ color: mutedText }}>{description}</ThemedText>
          </View>

          {(typeof trustScore === 'number' || typeof loopsCompleted === 'number') && (
            <View style={styles.signalRow}>
              {typeof trustScore === 'number' ? (
                <View style={styles.signalItem}>
                  <MaterialIcons name="verified-user" size={14} color={mutedText} />
                  <ThemedText style={[styles.signalText, { color: mutedText }]}>Confiance {trustScore}%</ThemedText>
                </View>
              ) : null}
              {typeof loopsCompleted === 'number' ? (
                <View style={styles.signalItem}>
                  <MaterialIcons name="sync" size={14} color={mutedText} />
                  <ThemedText style={[styles.signalText, { color: mutedText }]}>{loopsCompleted} prêts</ThemedText>
                </View>
              ) : null}
            </View>
          )}

          <View style={[styles.metaRow, { borderTopColor: border }]}>
            <View style={styles.ownerRow}>
              <Pressable
                onPress={(event) => {
                  event.stopPropagation();
                  onOwnerPress?.();
                }}
                accessibilityRole="button"
                accessibilityLabel={`Ouvrir la confiance de ${ownerName}`}>
                <Avatar name={ownerName} uri={ownerAvatarUrl} size={34} />
              </Pressable>
              <View>
                <ThemedText type="defaultSemiBold">{ownerName}</ThemedText>
                <ThemedText style={{ color: mutedText, fontSize: 12 }}>Réponse: {responseTime}</ThemedText>
              </View>
            </View>
            <Button label={isFree ? 'Emprunter' : 'Demander'} onPress={onBorrowPress} style={styles.actionButton} />
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    borderRadius: Radius.lg,
  },
  card: {
    padding: 0,
    overflow: 'hidden',
  },
  imageWrap: {
    height: 185,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  topLeftPill: {
    position: 'absolute',
    top: 12,
    left: 12,
    borderRadius: Radius.full,
    borderWidth: 2,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pillText: {
    fontSize: 13,
    lineHeight: 18,
  },
  content: {
    padding: 14,
    gap: 12,
  },
  titleBlock: {
    gap: 3,
  },
  signalRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  signalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  signalText: {
    fontSize: 12,
    lineHeight: 16,
  },
  metaRow: {
    borderTopWidth: 1,
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  ownerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  actionButton: {
    minHeight: 40,
    paddingHorizontal: 12,
  },
});
