import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { LayoutAnimation, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SearchBar } from '@/components/ui/search-bar';
import { Colors, Radius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { DISCOVER_OBJECTS, PERSONALIZED_SUGGESTIONS, refreshBackendData, useBackendDataVersion } from '@/lib/backend/data';

export default function HomeScreen() {
  useBackendDataVersion();
  const router = useRouter();
  const [isQuickMenuOpen, setIsQuickMenuOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const colorScheme = useColorScheme();
  const resolvedTheme = colorScheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[resolvedTheme];
  const mutedText = useThemeColor({}, 'mutedText');

  const quickLinks = [
    { id: 'ql-community', icon: 'groups', label: 'Communauté locale', route: '/community' },
    { id: 'ql-trust', icon: 'verified-user', label: 'Confiance locale', route: '/trust' },
    { id: 'ql-post', icon: 'add-circle', label: 'Publier un objet', route: '/(tabs)/post' },
    { id: 'ql-profile', icon: 'person', label: 'Mon profil', route: '/(tabs)/profile' },
  ] as const;

  useFocusEffect(() => {
    setIsQuickMenuOpen(false);
  });

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

  const steps = [
    {
      icon: 'add-a-photo',
      title: 'Publier un objet',
      description: 'Prends une photo et ajoute une description en quelques secondes.',
    },
    {
      icon: 'handshake',
      title: 'Emprunter localement',
      description: 'Trouve ce dont tu as besoin près de chez toi sans acheter.',
    },
    {
      icon: 'groups',
      title: 'Créer du lien',
      description: 'Renforce la confiance dans ton quartier avec des échanges utiles.',
    },
  ] as const;

  const suggestions = PERSONALIZED_SUGGESTIONS.map((suggestion) => ({
    ...suggestion,
    object: DISCOVER_OBJECTS.find((item) => item.id === suggestion.objectId),
  })).filter((item) => Boolean(item.object));

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
            accessibilityLabel="Ouvrir le menu de raccourcis"
            accessibilityState={{ expanded: isQuickMenuOpen }}
            style={[styles.menuButton, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <MaterialIcons name="menu" size={20} color={colors.text} />
          </Pressable>
        </View>

        {isQuickMenuOpen ? (
          <Card style={[styles.quickMenuCard, { borderColor: colors.border }]}> 
            {quickLinks.map((link) => (
              <Pressable
                key={link.id}
                onPress={() => handleQuickLinkPress(link.route)}
                accessibilityRole="button"
                accessibilityLabel={`Ouvrir ${link.label}`}
                style={[styles.quickMenuItem, { borderColor: colors.border, backgroundColor: colors.surface }]}> 
                <View style={[styles.quickMenuIcon, { backgroundColor: `${colors.tint}22` }]}>
                  <MaterialIcons name={link.icon} size={16} color={colors.tint} />
                </View>
                <ThemedText type="defaultSemiBold" style={styles.quickMenuLabel}>
                  {link.label}
                </ThemedText>
                <MaterialIcons name="chevron-right" size={18} color={mutedText} />
              </Pressable>
            ))}
          </Card>
        ) : null}

        <View style={styles.heroCard}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1581579185169-8a6fbf96ed4f?auto=format&fit=crop&w=1200&q=80' }}
            style={styles.heroImage}
            contentFit="cover"
          />
          <View style={styles.heroOverlay}>
            <ThemedText style={styles.heroTitle}>Partage local, confiance réelle.</ThemedText>
            <ThemedText style={styles.heroSubtitle}>
              Emprunte et prête des objets entre voisins, simplement.
            </ThemedText>
            <Button
              label="Commencer à partager"
              onPress={() => router.push('/(tabs)/post')}
              accessibilityLabel="Ouvrir l'écran poster un objet"
            />
          </View>
        </View>

        <SearchBar placeholder="Que cherches-tu ? (ex: perceuse)" />

        <Card style={styles.suggestionsCard}>
          <View style={styles.suggestionHeader}>
            <ThemedText type="subtitle">Suggestions personnalisées</ThemedText>
          </View>
          <View style={styles.suggestionList}>
            {suggestions.length === 0 ? (
              <Card style={[styles.emptySuggestionsCard, { borderColor: colors.border }]}>
                <ThemedText type="defaultSemiBold">Pas encore de suggestions personnalisées</ThemedText>
                <ThemedText style={{ color: mutedText, fontSize: 12 }}>
                  En attendant, découvre les offres disponibles autour de toi.
                </ThemedText>
                <Button label="Voir les offres" onPress={() => router.push('/(tabs)/explore')} />
              </Card>
            ) : (
              suggestions.map((suggestionItem) => {
                const objectItem = suggestionItem.object;
                if (!objectItem) {
                  return null;
                }

                return (
                  <Pressable
                    key={suggestionItem.id}
                    onPress={() => router.push({ pathname: '/object/[id]', params: { id: objectItem.id } })}
                    style={[styles.suggestionRow, { borderColor: colors.border, backgroundColor: colors.surface }]}
                    accessibilityRole="button"
                    accessibilityLabel={`Ouvrir ${objectItem.title}`}>
                    <View style={styles.suggestionTextWrap}>
                      <ThemedText type="defaultSemiBold">{objectItem.title}</ThemedText>
                      <ThemedText style={{ color: mutedText, fontSize: 12 }}>{suggestionItem.reason}</ThemedText>
                    </View>
                    <MaterialIcons name="chevron-right" size={18} color={mutedText} />
                  </Pressable>
                );
              })
            )}
          </View>
        </Card>

        <View style={styles.sectionHeader}>
          <ThemedText type="subtitle">Comment ça marche</ThemedText>
          <ThemedText style={{ color: mutedText }}>3 étapes pour lancer ton premier échange.</ThemedText>
        </View>

        <View style={styles.stepsContainer}>
          {steps.map((step) => (
            <Card key={step.title} style={styles.stepCard}>
              <View style={[styles.stepIconCircle, { backgroundColor: `${colors.tint}22` }]}>
                <MaterialIcons name={step.icon} size={22} color={colors.tint} />
              </View>
              <View style={styles.stepTextContainer}>
                <ThemedText type="defaultSemiBold">{step.title}</ThemedText>
                <ThemedText style={{ color: mutedText }}>{step.description}</ThemedText>
              </View>
            </Card>
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
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: 8,
    gap: 8,
  },
  quickMenuItem: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
  heroCard: {
    borderRadius: 28,
    overflow: 'hidden',
    minHeight: 280,
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
  },
  heroOverlay: {
    minHeight: 280,
    justifyContent: 'flex-end',
    padding: 16,
    gap: 10,
    backgroundColor: 'rgba(0,0,0,0.42)',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.92)',
  },
  sectionHeader: {
    gap: 4,
    marginTop: 6,
  },
  stepsContainer: {
    gap: 12,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepIconCircle: {
    width: 46,
    height: 46,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTextContainer: {
    flex: 1,
    gap: 2,
  },
  suggestionsCard: {
    gap: 10,
  },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  suggestionList: {
    gap: 8,
  },
  suggestionRow: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  suggestionTextWrap: {
    flex: 1,
    gap: 2,
  },
  emptySuggestionsCard: {
    borderWidth: 1,
    gap: 8,
  },
});
