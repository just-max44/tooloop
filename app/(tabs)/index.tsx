import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { LayoutAnimation, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { SearchBar } from '@/components/ui/search-bar';
import { SectionHeader } from '@/components/ui/section-header';
import { getDerivedColors, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { CATEGORIES, refreshBackendData } from '@/lib/backend/data';
import { useBackendStore } from '@/stores/backend-store';

export default function HomeScreen() {
  const DISCOVER_OBJECTS = useBackendStore((s) => s.discoverObjects);
  const PERSONALIZED_SUGGESTIONS = useBackendStore((s) => s.personalizedSuggestions);
  const router = useRouter();
  const [isQuickMenuOpen, setIsQuickMenuOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const colorScheme = useColorScheme();
  const resolvedTheme = colorScheme === 'dark' ? 'dark' : 'light';
  const colors = getDerivedColors(resolvedTheme);

  const quickLinks = [
    { id: 'ql-community', icon: 'groups', label: 'Communaut\u00e9 locale', route: '/community' },
    { id: 'ql-trust', icon: 'verified-user', label: 'Confiance locale', route: '/trust' },
    { id: 'ql-post', icon: 'add-circle', label: 'Publier un objet', route: '/(tabs)/post' },
    { id: 'ql-profile', icon: 'person', label: 'Mon profil', route: '/(tabs)/profile' },
  ] as const;

  useFocusEffect(
    useCallback(() => {
      setIsQuickMenuOpen(false);
      void refreshBackendData();
    }, [])
  );

  const handleQuickLinkPress = (route: (typeof quickLinks)[number]['route']) => {
    if (route.startsWith('/(tabs)/')) {
      router.navigate(route);
      return;
    }
    router.push(route);
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshBackendData();
    } finally {
      setIsRefreshing(false);
    }
  };

  const suggestions = PERSONALIZED_SUGGESTIONS.map((suggestion) => ({
    ...suggestion,
    object: DISCOVER_OBJECTS.find((item) => item.id === suggestion.objectId),
  })).filter((item) => Boolean(item.object));

  const recentRequested = suggestions.slice(0, 3);
  const recentAvailable = DISCOVER_OBJECTS.slice(0, 3);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <ThemedView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.tint} colors={[colors.tint]} />}>
          <View style={styles.screenWrap}>
            <View style={styles.headerRow}>
              <View style={styles.brandRow}>
                <MaterialIcons name="handyman" size={26} color={colors.tint} />
                <ThemedText type="subtitle">Tooloop</ThemedText>
              </View>
              <Pressable
                onPress={() => {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  setIsQuickMenuOpen((value) => !value);
                }}
                accessibilityRole="button"
                accessibilityLabel="Ouvrir les raccourcis"
                accessibilityState={{ expanded: isQuickMenuOpen }}
                style={[styles.menuButton, { borderColor: colors.softBorder, backgroundColor: colors.softSurface }]}>
                <MaterialIcons name="menu" size={20} color={colors.text} />
              </Pressable>
            </View>

            {isQuickMenuOpen ? (
              <Card variant="outlined" style={styles.quickMenuCard}>
                {quickLinks.map((link) => (
                  <Pressable
                    key={link.id}
                    onPress={() => handleQuickLinkPress(link.route)}
                    accessibilityRole="button"
                    accessibilityLabel={`Aller \u00e0 ${link.label}`}
                    style={[styles.quickMenuItem, { borderColor: colors.softBorder, backgroundColor: colors.softSurface }]}>
                    <View style={[styles.quickMenuIcon, { backgroundColor: colors.tintMuted }]}>
                      <MaterialIcons name={link.icon} size={16} color={colors.tint} />
                    </View>
                    <ThemedText type="defaultSemiBold" style={styles.quickMenuLabel}>
                      {link.label}
                    </ThemedText>
                    <MaterialIcons name="chevron-right" size={18} color={colors.mutedText} />
                  </Pressable>
                ))}
              </Card>
            ) : null}

            <Card style={styles.actionCard}>
              <ThemedText type="label" style={{ color: colors.tint }}>
                Lancement rapide
              </ThemedText>
              <ThemedText type="heading">Quel objet cherches-tu aujourd’hui ?</ThemedText>
              <ThemedText type="caption" style={styles.actionHint}>
                Lance une recherche locale ou publie un objet en moins d’une minute.
              </ThemedText>
              <SearchBar placeholder="Ex: perceuse, escabeau, appareil \u00e0 raclette" />
              <Button
                label="Je cherche un objet"
                variant="primary"
                size="lg"
                onPress={() => router.push('/(tabs)/explore')}
                accessibilityLabel="Lancer la recherche d'objet"
              />
              <Button
                label="Mettre \u00e0 disposition"
                variant="ghost"
                onPress={() => router.push('/(tabs)/post')}
                accessibilityLabel="Publier un objet \u00e0 disposition"
              />
            </Card>

            <Card style={styles.activityCard}>
              <SectionHeader title="Activit\u00e9 pr\u00e8s de vous" subtitle="En direct autour de toi" icon="trending-up" />

              <View style={styles.activitySection}>
                <ThemedText type="defaultSemiBold">Demandes r\u00e9centes</ThemedText>
                <View style={styles.suggestionList}>
                  {recentRequested.length === 0 ? (
                    <EmptyState title="Aucune demande r\u00e9cente" description="Rien pour le moment, reviens bient\u00f4t." icon="inbox" />
                  ) : (
                    recentRequested.map((suggestionItem) => {
                      const objectItem = suggestionItem.object;
                      if (!objectItem) {
                        return null;
                      }

                      return (
                        <Pressable
                          key={suggestionItem.id}
                          onPress={() => router.push({ pathname: '/object/[id]', params: { id: objectItem.id } })}
                          style={[styles.suggestionRow, { borderColor: colors.softBorder, backgroundColor: colors.softSurface }]}
                          accessibilityRole="button"
                          accessibilityLabel={`Voir l'objet ${objectItem.title}`}>
                          <View style={styles.suggestionTextWrap}>
                            <ThemedText type="defaultSemiBold">{objectItem.title}</ThemedText>
                            <ThemedText type="caption">{suggestionItem.reason}</ThemedText>
                          </View>
                          <MaterialIcons name="chevron-right" size={18} color={colors.mutedText} />
                        </Pressable>
                      );
                    })
                  )}
                </View>
              </View>

              <View style={styles.activitySection}>
                <ThemedText type="defaultSemiBold">Objets disponibles maintenant</ThemedText>
                <View style={styles.suggestionList}>
                  {recentAvailable.length === 0 ? (
                    <EmptyState title="Aucun objet disponible" description="Reviens bient\u00f4t ou publie le tien." icon="inventory-2" />
                  ) : (
                    recentAvailable.map((objectItem) => (
                      <Pressable
                        key={objectItem.id}
                        onPress={() => router.push({ pathname: '/object/[id]', params: { id: objectItem.id } })}
                        style={[styles.suggestionRow, { borderColor: colors.softBorder, backgroundColor: colors.softSurface }]}
                        accessibilityRole="button"
                        accessibilityLabel={`Voir l'objet ${objectItem.title}`}>
                        <View style={styles.suggestionTextWrap}>
                          <ThemedText type="defaultSemiBold">{objectItem.title}</ThemedText>
                          <ThemedText type="caption">{objectItem.distanceKm} km \u00b7 {objectItem.ownerName}</ThemedText>
                        </View>
                        <MaterialIcons name="chevron-right" size={18} color={colors.mutedText} />
                      </Pressable>
                    ))
                  )}
                </View>
              </View>
            </Card>

            <SectionHeader title="Par cat\u00e9gorie" />
            <View style={styles.chipsWrap}>
              {CATEGORIES.map((category) => (
                <Chip
                  key={category}
                  label={category}
                  selected={false}
                  onPress={() => router.push('/(tabs)/explore')}
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickMenuCard: {
    gap: Spacing.sm,
  },
  quickMenuItem: {
    borderWidth: 1,
    borderRadius: Radius.sm,
    minHeight: 46,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  quickMenuIcon: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickMenuLabel: {
    flex: 1,
  },
  actionCard: {
    gap: Spacing.md,
    paddingVertical: Spacing.xl,
  },
  actionHint: {
    marginTop: -4,
  },
  activityCard: {
    gap: Spacing.lg,
  },
  activitySection: {
    gap: Spacing.sm,
  },
  suggestionList: {
    gap: Spacing.sm,
  },
  suggestionRow: {
    borderWidth: 1,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  suggestionTextWrap: {
    flex: 1,
    gap: Spacing.xs,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
});
