import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { DISCOVER_OBJECTS, getObjectImageByLoanObjectName, getObjectStoryById, useBackendDataVersion } from '@/lib/backend/data';
import { estimateObjectPrice } from '@/lib/price-estimator';
import { getListingById } from '@/stores/listings-store';
import { getStoryContributionsByObjectId } from '@/stores/object-story-store';

const DURATIONS = [
  { label: '1 jour', value: '1j' },
  { label: '3 jours', value: '3j' },
  { label: '1 semaine', value: '1s' },
] as const;

export default function ObjectDetailScreen() {
  useBackendDataVersion();
  const router = useRouter();
  const { id, listingId } = useLocalSearchParams<{ id: string; listingId?: string }>();

  const colorScheme = useColorScheme();
  const resolvedTheme = colorScheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[resolvedTheme];

  const text = useThemeColor({}, 'text');
  const mutedText = useThemeColor({}, 'mutedText');
  const [selectedDuration, setSelectedDuration] = useState<string>('1j');
  const [customDuration, setCustomDuration] = useState('');
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasHeroImageError, setHasHeroImageError] = useState(false);

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

  const fallbackListing = useMemo(() => {
    if (typeof listingId === 'string' && listingId.length > 0) {
      return getListingById(listingId);
    }

    if (typeof id === 'string' && id.length > 0) {
      return getListingById(id);
    }

    return undefined;
  }, [id, listingId]);

  const displayItem = useMemo(() => {
    if (objectItem) {
      return {
        title: objectItem.title,
        description: objectItem.description,
        imageUrl: objectItem.imageUrl,
        distanceKm: objectItem.distanceKm,
        ownerName: objectItem.ownerName,
        responseTime: objectItem.responseTime,
        isFree: objectItem.isFree,
      };
    }

    if (!fallbackListing) {
      return null;
    }

    const matchedImage = getObjectImageByLoanObjectName(fallbackListing.title) ?? DISCOVER_OBJECTS[0]?.imageUrl ?? '';

    return {
      title: fallbackListing.title,
      description: fallbackListing.description,
      imageUrl: matchedImage,
      distanceKm: 1.0,
      ownerName: 'Membre Tooloop',
      responseTime: 'quelques heures',
      isFree: !fallbackListing.requiresDeposit,
    };
  }, [fallbackListing, objectItem]);

  const heroImageUri = displayItem?.imageUrl?.trim() ?? '';

  useEffect(() => {
    setHasHeroImageError(false);
  }, [heroImageUri]);

  const heroImageSource = heroImageUri && !hasHeroImageError
    ? { uri: heroImageUri }
    : require('../../assets/images/icon.png');

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

  const storyContributions = useMemo(() => {
    if (!objectItem) {
      return [];
    }

    return getStoryContributionsByObjectId(objectItem.id);
  }, [objectItem]);

  const keyStoryMoments = useMemo(() => {
    if (!objectStory) {
      return [];
    }

    const prioritized = objectStory.moments.filter((moment) =>
      /(record|premier|impact)/i.test(moment.label),
    );

    return (prioritized.length > 0 ? prioritized : objectStory.moments).slice(0, 3);
  }, [objectStory]);

  const storyPreviewPhotos = useMemo(() => {
    if (!objectStory) {
      return [];
    }

    const sourcePhotos = objectStory.photoMemories.length > 0 ? objectStory.photoMemories : [objectItem?.imageUrl ?? ''];
    const cleaned = sourcePhotos.filter(Boolean);
    if (cleaned.length === 0) {
      return [];
    }

    if (cleaned.length >= 3) {
      return cleaned.slice(0, 3);
    }

    if (cleaned.length === 2) {
      return [cleaned[0], cleaned[1], cleaned[0]];
    }

    return [cleaned[0], cleaned[0], cleaned[0]];
  }, [objectItem?.imageUrl, objectStory]);

  const selectedDurationLabel = useMemo(() => {
    if (selectedDuration === 'other') {
      return customDuration.trim() || 'durée personnalisée';
    }

    return DURATIONS.find((durationOption) => durationOption.value === selectedDuration)?.label ?? selectedDuration;
  }, [customDuration, selectedDuration]);

  const openTrust = (userName: string, role: 'prêteur' | 'emprunteur') => {
    router.push({ pathname: '/trust', params: { userName, role } });
  };

  if (!displayItem) {
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
            <View style={styles.heroImageWrap}>
              <Image
                source={heroImageSource}
                style={styles.heroImage}
                contentFit="cover"
                onError={() => setHasHeroImageError(true)}
              />
            </View>
            <ThemedText type="title">{displayItem.title}</ThemedText>
            <ThemedText style={[styles.subtitle, { color: mutedText }]}>{displayItem.description}</ThemedText>

            <View style={styles.badgesRow}>
              {displayItem.isFree ? <Badge label="Gratuit" variant="primary" /> : <Badge label="Caution" variant="danger" />}
              <Badge label={`📍 À ${displayItem.distanceKm} km`} variant="primary" />
            </View>
          </Card>

          <Card>
            <ThemedText type="defaultSemiBold">Propriétaire</ThemedText>
            <View style={styles.ownerRow}>
              <Pressable
                onPress={() => (objectItem ? openTrust(displayItem.ownerName, 'prêteur') : null)}
                accessibilityRole="button"
                accessibilityLabel={`Ouvrir la confiance de ${displayItem.ownerName}`}>
                <Avatar name={displayItem.ownerName} size={44} />
              </Pressable>
              <View>
                <ThemedText type="defaultSemiBold">{displayItem.ownerName}</ThemedText>
                <ThemedText style={{ color: mutedText }}>Répond en {displayItem.responseTime}</ThemedText>
                {objectItem ? <ThemedText style={{ color: colors.tint, fontSize: 12 }}>Voir la confiance locale</ThemedText> : null}
              </View>
            </View>
          </Card>

          <Card>
            <ThemedText type="defaultSemiBold">Demande de prêt</ThemedText>
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
              <Pressable
                onPress={() => setSelectedDuration('other')}
                style={[
                  styles.durationPill,
                  {
                    borderColor: selectedDuration === 'other' ? colors.tint : colors.border,
                    backgroundColor: selectedDuration === 'other' ? colors.surface : 'transparent',
                  },
                ]}>
                <ThemedText
                  type={selectedDuration === 'other' ? 'defaultSemiBold' : 'default'}
                  style={{ color: selectedDuration === 'other' ? colors.tint : colors.text }}>
                  Autre
                </ThemedText>
              </Pressable>
            </View>
            {selectedDuration === 'other' ? (
              <View style={styles.customDurationWrap}>
                <ThemedText type="defaultSemiBold">Nombre de jours (libre)</ThemedText>
                <TextInput
                  value={customDuration}
                  onChangeText={setCustomDuration}
                  placeholder="Ex: 10 jours"
                  placeholderTextColor={mutedText}
                  style={[styles.customDurationInput, { color: text, borderColor: colors.border, backgroundColor: colors.surface }]}
                />
              </View>
            ) : null}
            <ThemedText style={[styles.subtitle, { color: mutedText }]}> 
              Vous pouvez ajuster la durée ensuite en discutant avec le prêteur.
            </ThemedText>

            {!requestSubmitted ? (
              <Button label="Envoyer la demande" onPress={requestLoan} loading={isSendingRequest} />
            ) : (
              <View style={styles.requestSentCard}>
                <ThemedText type="defaultSemiBold">✅ Demande envoyée</ThemedText>
                <ThemedText style={{ color: mutedText }}>
                  Ta demande pour {displayItem.title} ({selectedDurationLabel}) est en attente d’acceptation par {displayItem.ownerName}.
                </ThemedText>
                <ThemedText style={{ color: mutedText, fontSize: 12 }}>
                  Tu pourras continuer l’échange après acceptation (chat + pass d’échange).
                </ThemedText>
                <Button label="Voir mes échanges" variant="secondary" onPress={() => router.push('/(tabs)/inbox')} />
              </View>
            )}
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
              <View style={styles.storyMomentsWrap}>
                {keyStoryMoments.map((moment) => (
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
                {storyPreviewPhotos.map((photoUri, index) => (
                  <Image key={`${photoUri}-${index}`} source={{ uri: photoUri }} style={styles.storyPhoto} contentFit="cover" />
                ))}
              </ScrollView>
              <Button
                label="Voir toute la mini-story"
                variant="secondary"
                onPress={() => router.push({ pathname: '/object/story/[id]', params: { id: objectItem.id } })}
              />

              {storyContributions.length > 0 ? (
                <View style={styles.borrowerContribWrap}>
                  <ThemedText type="defaultSemiBold">Ajouts emprunteurs</ThemedText>
                  {storyContributions.map((contribution) => (
                    <View key={contribution.id} style={[styles.borrowerContribCard, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                      <Image source={{ uri: contribution.photoUri }} style={styles.storyPhoto} contentFit="cover" />
                      <View style={styles.borrowerContribTextWrap}>
                        <View style={styles.borrowerHeaderRow}>
                          <Pressable
                            onPress={() => openTrust(contribution.authorName, 'emprunteur')}
                            accessibilityRole="button"
                            accessibilityLabel={`Ouvrir la confiance de ${contribution.authorName}`}>
                            <Avatar name={contribution.authorName} size={24} />
                          </Pressable>
                          <ThemedText type="defaultSemiBold">{contribution.authorName}</ThemedText>
                        </View>
                        {contribution.comment ? (
                          <ThemedText style={{ color: mutedText, fontSize: 12 }}>{contribution.comment}</ThemedText>
                        ) : null}
                        <ThemedText style={{ color: mutedText, fontSize: 11 }}>{contribution.createdAtLabel}</ThemedText>
                      </View>
                    </View>
                  ))}
                </View>
              ) : null}
            </Card>
          ) : null}
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
    gap: Spacing.lg,
  },
  heroCard: {
    gap: Spacing.md,
  },
  heroImageWrap: {
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: 210,
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
    gap: Spacing.sm,
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
  borrowerContribWrap: {
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  borrowerContribCard: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  borrowerContribTextWrap: {
    flex: 1,
    gap: 2,
  },
  borrowerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  durationRow: {
    marginTop: Spacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  customDurationWrap: {
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  customDurationInput: {
    minHeight: 46,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    fontSize: 15,
  },
  durationPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderRadius: Radius.full,
  },
  requestSentCard: {
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
});
