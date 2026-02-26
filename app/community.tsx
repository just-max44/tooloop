import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Radius, Spacing } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { COLLECTIVE_CHALLENGES, DISCOVER_OBJECTS, LOCAL_AREA, useBackendDataVersion } from '@/lib/backend/data';

export default function CommunityScreen() {
  useBackendDataVersion();
  const router = useRouter();
  const background = useThemeColor({}, 'background');
  const border = useThemeColor({}, 'border');
  const mutedText = useThemeColor({}, 'mutedText');
  const surface = useThemeColor({}, 'surface');
  const tint = useThemeColor({}, 'tint');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const localityLabel = LOCAL_AREA.city;

  const onRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 650);
  };

  const localObjects = useMemo(() => DISCOVER_OBJECTS, []);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: background }]} edges={['top']}>
      <ThemedView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={tint} colors={[tint]} />
          }>
          <Card style={styles.card}>
            <ThemedText type="title">Activité locale</ThemedText>
            <ThemedText type="defaultSemiBold">{localityLabel}</ThemedText>
            <ThemedText style={{ color: mutedText }}>
              Suis les objets actifs près de toi et les défis collectifs du quartier.
            </ThemedText>
          </Card>

          <Card style={styles.card}>
            <ThemedText type="subtitle">Objets actifs près de toi</ThemedText>

            <View style={styles.zoneObjectList}>
              {localObjects.map((item) => {
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => router.push({ pathname: '/object/[id]', params: { id: item.id } })}
                    style={[styles.zoneObjectRow, { borderColor: border, backgroundColor: surface }]}
                    accessibilityRole="button"
                    accessibilityLabel={`Ouvrir ${item.title}`}>
                    <View style={styles.zoneObjectText}>
                      <ThemedText type="defaultSemiBold">{item.title}</ThemedText>
                      <ThemedText style={{ color: mutedText, fontSize: 12 }}>{item.distanceKm} km · {item.ownerName}</ThemedText>
                    </View>
                    <Badge label="Actif" variant="neutral" />
                  </Pressable>
                );
              })}
            </View>
          </Card>

          <Card style={styles.card}>
            <ThemedText type="subtitle">Badges & challenges collectifs</ThemedText>
            <View style={styles.challengeWrap}>
              {COLLECTIVE_CHALLENGES.map((challenge) => {
                const progressPercent = Math.min(100, Math.round((challenge.progress / challenge.target) * 100));
                return (
                  <View key={challenge.id} style={[styles.challengeCard, { borderColor: border }]}> 
                    <View style={styles.challengeHeader}>
                      <ThemedText type="defaultSemiBold">{challenge.title}</ThemedText>
                    </View>
                    <View style={[styles.progressTrack, { backgroundColor: `${tint}22` }]}>
                      <View style={[styles.progressFill, { width: `${progressPercent}%`, backgroundColor: tint }]} />
                    </View>
                    <ThemedText style={{ color: mutedText, fontSize: 12 }}>
                      {challenge.progress}/{challenge.target} · {progressPercent}%
                    </ThemedText>
                  </View>
                );
              })}
            </View>
          </Card>
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: 920,
    alignSelf: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
  },
  card: {
    gap: Spacing.sm,
  },
  zoneObjectList: {
    gap: Spacing.xs,
  },
  zoneObjectRow: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  zoneObjectText: {
    flex: 1,
    gap: 2,
  },
  challengeWrap: {
    gap: Spacing.sm,
  },
  challengeCard: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    gap: Spacing.xs,
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  progressTrack: {
    height: 8,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: Radius.full,
  },
});
