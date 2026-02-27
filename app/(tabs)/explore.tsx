import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Linking, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { ObjectCard } from '@/components/ui/object-card';
import { SearchBar } from '@/components/ui/search-bar';
import { Colors, Radius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { DISCOVER_FILTERS, DISCOVER_OBJECTS, NEIGHBORHOOD_PULSE, refreshBackendData, useBackendDataVersion } from '@/lib/backend/data';

const DISTANCE_FILTERS = [
  { label: 'Tous', value: null },
  { label: '5 km', value: 5 },
  { label: '10 km', value: 10 },
  { label: '20 km', value: 20 },
] as const;

export default function TabTwoScreen() {
  useBackendDataVersion();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const resolvedTheme = colorScheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[resolvedTheme];
  const mutedText = useThemeColor({}, 'mutedText');

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
  }, [locationPermission]);

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
        <View style={styles.headerBlock}>
          <ThemedText type="title">Découvrir</ThemedText>
          <ThemedText style={{ color: mutedText }}>Trouve des objets disponibles autour de toi.</ThemedText>
        </View>

        <SearchBar
          placeholder="Rechercher un objet"
          value={searchQuery}
          onChangeText={setSearchQuery}
          accessibilityLabel="Rechercher un objet"
        />

        <Pressable
          onPress={() => router.push('/community')}
          accessibilityRole="button"
          accessibilityLabel="Ouvrir la carte et les challenges du quartier"
          style={styles.pulsePressable}>
        <Card style={styles.pulseCard}>
          <View style={styles.pulseHeader}>
            <View style={[styles.pulseIconWrap, { backgroundColor: `${colors.tint}22` }]}>
              <MaterialIcons name="location-on" size={14} color={colors.tint} />
            </View>
            <View style={styles.pulseTextWrap}>
              <ThemedText type="defaultSemiBold" style={{ fontSize: 14 }}>Pulse quartier</ThemedText>
              <ThemedText style={{ color: mutedText, fontSize: 12 }}>
                {nearbyCount} objets proches · {NEIGHBORHOOD_PULSE.loopsThisWeek} échanges cette semaine
              </ThemedText>
              <ThemedText style={{ color: mutedText, fontSize: 11 }}>
                {locationPermission === 'granted' && isLocationServiceEnabled
                  ? `Position active (${lastLocationLabel ?? 'GPS détecté'}). Résultats triés par proximité.`
                  : locationPermission === 'granted'
                    ? 'Permission accordée mais GPS du téléphone inactif.'
                    : 'Position inactive: active-la pour améliorer la recherche autour de toi.'}
              </ThemedText>
            </View>
          </View>
        </Card>
        </Pressable>
        {(locationPermission !== 'granted' || !isLocationServiceEnabled) ? (
          <Pressable
            onPress={requestLocationPermission}
            accessibilityRole="button"
            accessibilityLabel="Activer la position"
            style={[styles.locationButton, { borderColor: colors.border, backgroundColor: colors.surface }]}
            disabled={isRequestingLocation}>
            <MaterialIcons name="my-location" size={14} color={colors.tint} />
            <ThemedText type="defaultSemiBold" style={{ color: colors.tint, fontSize: 12 }}>
              {isRequestingLocation
                ? 'Activation en cours...'
                : locationPermission === 'denied'
                  ? 'Ouvrir les réglages localisation'
                  : 'Activer ma position'}
            </ThemedText>
          </Pressable>
        ) : null}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          {DISCOVER_FILTERS.map((category) => {
            const active = category === activeCategory;
            return (
              <Pressable
                key={category}
                onPress={() => setActiveCategory(category)}
                accessibilityRole="button"
                accessibilityLabel={`Filtrer par ${category}`}
                accessibilityState={{ selected: active }}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active ? colors.tint : colors.surface,
                    borderColor: active ? colors.tint : colors.border,
                  },
                ]}>
                <ThemedText
                  type="defaultSemiBold"
                  style={{ color: active ? '#FFFFFF' : colors.text, fontSize: 13, lineHeight: 18 }}>
                  {category}
                </ThemedText>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.distanceBlock}>
          <ThemedText type="defaultSemiBold" style={{ fontSize: 13 }}>
            Rayon
          </ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
            {DISTANCE_FILTERS.map((distanceFilter) => {
              const active = distanceFilter.value === activeDistanceKm;
              return (
                <Pressable
                  key={distanceFilter.label}
                  onPress={() => setActiveDistanceKm(distanceFilter.value)}
                  accessibilityRole="button"
                  accessibilityLabel={`Filtrer dans un rayon de ${distanceFilter.label}`}
                  accessibilityState={{ selected: active }}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: active ? colors.tint : colors.surface,
                      borderColor: active ? colors.tint : colors.border,
                    },
                  ]}>
                  <ThemedText
                    type="defaultSemiBold"
                    style={{ color: active ? '#FFFFFF' : colors.text, fontSize: 13, lineHeight: 18 }}>
                    {distanceFilter.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.listWrap}>
          {filtered.length === 0 ? (
            <Card style={[styles.emptyStateCard, { borderColor: colors.border }]}>
              <ThemedText type="defaultSemiBold">Aucune offre trouvée</ThemedText>
              <ThemedText style={{ color: mutedText, fontSize: 12 }}>
                Ajuste les filtres ou ta recherche pour afficher des objets proches.
              </ThemedText>
            </Card>
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
                  params: { userName: objectItem.ownerName, role: 'prêteur' },
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
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  screenWrap: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    gap: 14,
  },
  headerBlock: {
    gap: 4,
  },
  distanceBlock: {
    gap: 6,
  },
  chipsRow: {
    gap: 8,
    paddingRight: 8,
  },
  chip: {
    borderRadius: Radius.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
  },
  pulseCard: {
    gap: 6,
    paddingVertical: 12,
  },
  locationButton: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: Radius.md,
    minHeight: 34,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  pulsePressable: {
    borderRadius: Radius.lg,
    opacity: 0.92,
  },
  pulseHeader: {
    flexDirection: 'row',
    gap: 8,
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
    gap: 2,
  },
  listWrap: {
    gap: 12,
  },
  emptyStateCard: {
    borderWidth: 1,
  },
});
