import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { DISCOVER_OBJECTS, getObjectStoryById } from '@/data/mock';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { estimateObjectPrice } from '@/lib/price-estimator';

const DURATIONS = [
  { label: '1 jour', value: '1j' },
  { label: '3 jours', value: '3j' },
  { label: '1 semaine', value: '1s' },
] as const;

export default function ObjectDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const colorScheme = useColorScheme();
  const resolvedTheme = colorScheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[resolvedTheme];

  const mutedText = useThemeColor({}, 'mutedText');
  const [selectedDuration, setSelectedDuration] = useState<(typeof DURATIONS)[number]['value']>('1j');
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const onRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 650);
  };

  const objectItem = useMemo(
    () => DISCOVER_OBJECTS.find((discoverItem) => discoverItem.id === id),
    [id],
  );

  const priceEstimate = useMemo(() => {
    if (!objectItem) {
      return null;
    }

    return estimateObjectPrice(objectItem);
  }, [objectItem]);

  const objectStory = useMemo(() => {
    if (!objectItem) {
      return null;
    }

    return getObjectStoryById(objectItem.id) ?? null;
  }, [objectItem]);

  if (!objectItem) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}> 
        <ThemedView style={styles.page}>
          <Card>
            <ThemedText type="subtitle">Objet introuvable</ThemedText>
            <ThemedText style={[styles.subtitle, { color: mutedText }]}> 
              Cet objet n’existe pas ou n’est plus disponible.
            </ThemedText>
            <Button label="Retour" onPress={() => router.back()} />
          </Card>
        </ThemedView>
      </SafeAreaView>
    );
  }

  const requestLoan = () => {
    setIsSendingRequest(true);
    setTimeout(() => {
      setIsSendingRequest(false);
      setRequestSubmitted(true);
    }, 520);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}> 
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.tint}
            colors={[colors.tint]}
          />
        }>
        <ThemedView style={styles.page}>
          <Card style={styles.heroCard}>
            <ThemedText type="title">{objectItem.title}</ThemedText>
            <ThemedText style={[styles.subtitle, { color: mutedText }]}>{objectItem.description}</ThemedText>

            <View style={styles.badgesRow}>
              {objectItem.isFree ? <Badge label="Gratuit" variant="primary" /> : <Badge label="Caution" variant="danger" />}
              <Badge label={`📍 À ${objectItem.distanceKm} km`} variant="primary" />
            </View>
          </Card>

          <Card>
            <ThemedText type="defaultSemiBold">Propriétaire</ThemedText>
            <View style={styles.ownerRow}>
              <Avatar name={objectItem.ownerName} size={44} />
              <View>
                <ThemedText type="defaultSemiBold">{objectItem.ownerName}</ThemedText>
                <ThemedText style={{ color: mutedText }}>Répond en {objectItem.responseTime}</ThemedText>
              </View>
            </View>
          </Card>

          {priceEstimate ? (
            <Card>
              <ThemedText type="defaultSemiBold">Économie estimée</ThemedText>
              <View style={styles.estimateRow}>
                <Badge label={`Fiabilité ${priceEstimate.confidence}`} variant="neutral" />
                <ThemedText style={{ color: mutedText, fontSize: 12 }}>
                  Basé sur {priceEstimate.sampleSize} références locales (sans API payante)
                </ThemedText>
              </View>
              <ThemedText type="subtitle">Jusqu’à {priceEstimate.estimatedNewPriceEur} € évités</ThemedText>
              <ThemedText style={{ color: mutedText }}>
                Fourchette achat neuf estimée: {priceEstimate.lowRangeEur} € – {priceEstimate.highRangeEur} €
              </ThemedText>
            </Card>
          ) : null}

          {objectStory ? (
            <Card>
              <ThemedText type="defaultSemiBold">Mini-story de l’objet</ThemedText>
              <ThemedText style={{ color: mutedText }}>
                {objectStory.totalLoans} prêts passés · {objectStory.anecdote}
              </ThemedText>

              <View style={styles.storyBadgeRow}>
                {objectStory.badges.map((storyBadge) => (
                  <Badge key={storyBadge} label={storyBadge} variant="neutral" />
                ))}
              </View>

              <View style={styles.storyMomentsWrap}>
                {objectStory.moments.map((moment) => (
                  <View key={moment.id} style={styles.storyMomentRow}>
                    <View style={[styles.storyDot, { backgroundColor: colors.tint }]} />
                    <View style={styles.storyMomentTextWrap}>
                      <ThemedText type="defaultSemiBold">{moment.label}</ThemedText>
                      <ThemedText style={{ color: mutedText, fontSize: 12 }}>{moment.detail}</ThemedText>
                    </View>
                  </View>
                ))}
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storyPhotosRow}>
                {objectStory.photoMemories.map((photoUri, index) => (
                  <Image key={`${photoUri}-${index}`} source={{ uri: photoUri }} style={styles.storyPhoto} contentFit="cover" />
                ))}
              </ScrollView>
            </Card>
          ) : null}

          <Card>
            <ThemedText type="defaultSemiBold">Durée souhaitée</ThemedText>
            <View style={styles.durationRow}>
              {DURATIONS.map((durationOption) => {
                const isActive = selectedDuration === durationOption.value;
                return (
                  <Pressable
                    key={durationOption.value}
                    onPress={() => setSelectedDuration(durationOption.value)}
                    style={[
                      styles.durationPill,
                      {
                        borderColor: isActive ? colors.tint : colors.border,
                        backgroundColor: isActive ? colors.surface : 'transparent',
                      },
                    ]}>
                    <ThemedText
                      type={isActive ? 'defaultSemiBold' : 'default'}
                      style={{ color: isActive ? colors.tint : colors.text }}>
                      {durationOption.label}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
            <ThemedText style={[styles.subtitle, { color: mutedText }]}> 
              Vous pouvez ajuster la durée ensuite en discutant avec le prêteur.
            </ThemedText>
          </Card>

          {!requestSubmitted ? (
            <Button label="Envoyer la demande" onPress={requestLoan} loading={isSendingRequest} />
          ) : (
            <Card style={styles.requestSentCard}>
              <ThemedText type="defaultSemiBold">✅ Demande envoyée</ThemedText>
              <ThemedText style={{ color: mutedText }}>
                Ta demande pour {objectItem.title} ({selectedDuration}) est en attente d’acceptation par {objectItem.ownerName}.
              </ThemedText>
              <ThemedText style={{ color: mutedText, fontSize: 12 }}>
                Tu pourras continuer l’échange après acceptation (chat + pass d’échange).
              </ThemedText>
              <Button label="Voir mes échanges" variant="secondary" onPress={() => router.push('/(tabs)/inbox')} />
            </Card>
          )}
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  page: {
    width: '100%',
    maxWidth: 920,
    alignSelf: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.md,
  },
  heroCard: {
    gap: Spacing.sm,
  },
  subtitle: {
    lineHeight: 20,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  ownerRow: {
    marginTop: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  estimateRow: {
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  storyBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  storyMomentsWrap: {
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  storyMomentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
  },
  storyDot: {
    width: 8,
    height: 8,
    borderRadius: Radius.full,
    marginTop: 6,
  },
  storyMomentTextWrap: {
    flex: 1,
    gap: 2,
  },
  storyPhotosRow: {
    marginTop: Spacing.sm,
    gap: Spacing.xs,
    paddingRight: Spacing.xs,
  },
  storyPhoto: {
    width: 110,
    height: 82,
    borderRadius: Radius.md,
  },
  durationRow: {
    marginTop: Spacing.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  durationPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderRadius: Radius.full,
  },
  requestSentCard: {
    gap: Spacing.xs,
  },
});
