import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Linking, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { ObjectCard } from '@/components/ui/object-card';
import { SearchBar } from '@/components/ui/search-bar';
import { getDerivedColors, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { DISCOVER_FILTERS, refreshBackendData } from '@/lib/backend/data';
import { t } from '@/lib/i18n/i18n';
import { useBackendStore } from '@/stores/backend-store';

const DISTANCE_FILTERS = [
  { label: t('explore.radiusAll'), value: null },
  { label: t('explore.radius5'), value: 5 },
  { label: t('explore.radius10'), value: 10 },
  { label: t('explore.radius20'), value: 20 },
] as const;

export default function TabTwoScreen() {
  const DISCOVER_OBJECTS = useBackendStore((s) => s.discoverObjects);
  const NEIGHBORHOOD_PULSE = useBackendStore((s) => s.neighborhoodPulse);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const resolvedTheme = colorScheme === 'dark' ? 'dark' : 'light';
  const colors = getDerivedColors(resolvedTheme);

  const [activeCategory, setActiveCategory] = useState<(typeof DISCOVER_FILTERS)[number]>('Tout');
  const [searchQuery, setSearchQuery] = useState('');
  const [locationPermission, setLocationPermission] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const [isLocationServiceEnabled, setIsLocationServiceEnabled] = useState<boolean | null>(null);
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastLocationLabel, setLastLocationLabel] = useState<string | null>(null);
  const [activeDistanceKm, setActiveDistanceKm] = useState<(typeof DISTANCE_FILTERS)[number]['value']>(null);

  const refreshLiveLocation = useCallback(async () => {
    const servicesEnabled = await Location.hasServicesEnabledAsync();
    setIsLocationServiceEnabled(servicesEnabled);

    if (!servicesEnabled) {
      setLastLocationLabel(null);
      return;
    }

    const currentPosition = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    setLastLocationLabel(
      `${currentPosition.coords.latitude.toFixed(4)}, ${currentPosition.coords.longitude.toFixed(4)}`
    );
  }, []);

  const syncLocationState = useCallback(async () => {
    const permission = await Location.getForegroundPermissionsAsync();
    setLocationPermission(permission.status === 'granted' ? 'granted' : 'denied');

    if (permission.status !== 'granted') {
      setIsLocationServiceEnabled(null);
      setLastLocationLabel(null);
      return;
    }

    await refreshLiveLocation();
  }, [refreshLiveLocation]);

  const requestLocationPermission = async () => {
    if (locationPermission === 'denied') {
      await Linking.openSettings();
      return;
    }

    setIsRequestingLocation(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      const granted = permission.status === 'granted';
      setLocationPermission(granted ? 'granted' : 'denied');

      if (!granted) {
        setIsLocationServiceEnabled(null);
        setLastLocationLabel(null);
        return;
      }

      if (Location.enableNetworkProviderAsync) {
        await Location.enableNetworkProviderAsync().catch(() => {});
      }

      await refreshLiveLocation();
    } finally {
      setIsRequestingLocation(false);
    }
  };

  useEffect(() => {
    syncLocationState().catch(() => {
      setLocationPermission('denied');
      setIsLocationServiceEnabled(null);
      setLastLocationLabel(null);
      setIsRequestingLocation(false);
    });
  }, [syncLocationState]);

  useFocusEffect(
    useCallback(() => {
      void refreshBackendData();
    }, [])
  );

  const onRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refreshBackendData(), syncLocationState()]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const sortedObjects = useMemo(() => {
    if (locationPermission !== 'granted') {
      return DISCOVER_OBJECTS;
    }

    return [...DISCOVER_OBJECTS].sort((first, second) => first.distanceKm - second.distanceKm);
  }, [DISCOVER_OBJECTS, locationPermission]);

  const filteredByCategory =
    activeCategory === 'Tout'
      ? sortedObjects
      : sortedObjects.filter((objectItem) => objectItem.category === activeCategory);
  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredBySearch = filteredByCategory.filter((objectItem) => {
    if (!normalizedSearch) {
      return true;
    }

    return (
      objectItem.title.toLowerCase().includes(normalizedSearch) ||
      objectItem.description.toLowerCase().includes(normalizedSearch) ||
      objectItem.ownerName.toLowerCase().includes(normalizedSearch)
    );
  });
  const filtered = activeDistanceKm === null
    ? filteredBySearch
    : filteredBySearch.filter((objectItem) => objectItem.distanceKm <= activeDistanceKm);
  const nearbyCount = filtered.filter((item) => item.distanceKm <= 1).length;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <ThemedView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.tint} colors={[colors.tint]} />}>
          <View style={styles.screenWrap}>
            <Card variant="filled" style={styles.searchHeroCard}>
              <View style={styles.headerBlock}>
                <ThemedText type="title">{t('explore.title')}</ThemedText>
                <ThemedText type="caption">{t('explore.subtitle')}</ThemedText>
              </View>

              <SearchBar
                placeholder={t("explore.searchPlaceholder")}
                value={searchQuery}
                onChangeText={setSearchQuery}
                accessibilityLabel={t("explore.searchAccessibility")}
              />
            </Card>

            <Pressable
              onPress={() => router.push('/community')}
              accessibilityRole="button"
              accessibilityLabel={t("explore.openCommunity")}
              style={styles.pulsePressable}>
              <Card variant="outlined" style={styles.pulseCard}>
                <View style={styles.pulseHeader}>
                  <View style={[styles.pulseIconWrap, { backgroundColor: colors.tintMuted }]}>
                    <MaterialIcons name="location-on" size={14} color={colors.tint} />
                  </View>
                  <View style={styles.pulseTextWrap}>
                    <ThemedText type="defaultSemiBold" style={{ fontSize: 14 }}>{t('explore.pulse')}</ThemedText>
                    <ThemedText type="caption">
                      {t('explore.pulseStats', { nearbyCount: String(nearbyCount), loopsThisWeek: String(NEIGHBORHOOD_PULSE.loopsThisWeek) })}
                    </ThemedText>
                    <ThemedText type="caption" style={{ fontSize: 11 }}>
                      {locationPermission === 'granted' && isLocationServiceEnabled
                        ? t('explore.locationActive', { label: lastLocationLabel ?? t('explore.locationActiveDefault') })
                        : locationPermission === 'granted'
                          ? t('explore.locationServiceDisabled')
                          : t('explore.locationInactive')}
                    </ThemedText>
                  </View>
                </View>
              </Card>
            </Pressable>

            {(locationPermission !== 'granted' || !isLocationServiceEnabled) ? (
              <Pressable
                onPress={requestLocationPermission}
                accessibilityRole="button"
                accessibilityLabel={t("explore.enableLocation")}
                style={[styles.locationButton, { borderColor: colors.softBorder, backgroundColor: colors.softSurface }]}
                disabled={isRequestingLocation}>
                <MaterialIcons name="my-location" size={14} color={colors.tint} />
                <ThemedText type="defaultSemiBold" style={{ color: colors.tint, fontSize: 12 }}>
                  {isRequestingLocation
                    ? t("explore.enablingLocation")
                    : locationPermission === 'denied'
                      ? t("explore.openLocationSettings")
                      : t("explore.enableLocation")}
                </ThemedText>
              </Pressable>
            ) : null}

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
              {DISCOVER_FILTERS.map((category) => (
                <Chip
                  key={category}
                  label={category}
                  selected={category === activeCategory}
                  onPress={() => setActiveCategory(category)}
                />
              ))}
            </ScrollView>

            <View style={styles.distanceBlock}>
              <ThemedText type="defaultSemiBold" style={{ fontSize: 13 }}>
                {t('explore.radius')}
              </ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
                {DISTANCE_FILTERS.map((distanceFilter) => (
                  <Chip
                    key={distanceFilter.label}
                    label={distanceFilter.label}
                    selected={distanceFilter.value === activeDistanceKm}
                    onPress={() => setActiveDistanceKm(distanceFilter.value)}
                  />
                ))}
              </ScrollView>
            </View>

            <View style={styles.listWrap}>
              {filtered.length === 0 ? (
                <EmptyState
                  title={t('explore.noOffers')}
                  description={t('explore.noOffersHint')}
                  icon="search-off"
                />
              ) : null}
              {filtered.map((objectItem) => (
                <ObjectCard
                  key={objectItem.id}
                  title={objectItem.title}
                  description={objectItem.description}
                  imageUrl={objectItem.imageUrl}
                  distanceKm={objectItem.distanceKm}
                  ownerName={objectItem.ownerName}
                  responseTime={objectItem.responseTime}
                  isFree={objectItem.isFree}
                  trustScore={objectItem.trustScore}
                  loopsCompleted={objectItem.loopsCompleted}
                  onOwnerPress={() =>
                    router.push({
                      pathname: '/trust',
                      params: { userName: objectItem.ownerName, role: 'pr\u00eateur' },
                    })
                  }
                  onPress={() => router.push({ pathname: '/object/[id]', params: { id: objectItem.id } })}
                  onBorrowPress={() => router.push({ pathname: '/object/[id]', params: { id: objectItem.id } })}
                />
              ))}
            </View>
          </View>
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
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: 120,
  },
  screenWrap: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    gap: Spacing.lg,
  },
  headerBlock: {
    gap: Spacing.xs,
  },
  searchHeroCard: {
    gap: Spacing.md,
  },
  distanceBlock: {
    gap: Spacing.sm,
  },
  chipsRow: {
    gap: Spacing.sm,
    paddingRight: Spacing.sm,
  },
  pulseCard: {
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  locationButton: {
    borderWidth: 1,
    borderRadius: Radius.md,
    minHeight: 42,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  pulsePressable: {
    borderRadius: Radius.lg,
  },
  pulseHeader: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  pulseIconWrap: {
    width: 24,
    height: 24,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  pulseTextWrap: {
    flex: 1,
    gap: Spacing.xs,
  },
  listWrap: {
    gap: Spacing.md,
  },
});
