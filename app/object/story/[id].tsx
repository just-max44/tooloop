import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { DISCOVER_OBJECTS, getObjectStoryById, useBackendDataVersion } from '@/lib/backend/data';
import { getStoryContributionsByObjectId } from '@/stores/object-story-store';

export default function ObjectStoryScreen() {
  useBackendDataVersion();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const colorScheme = useColorScheme();
  const resolvedTheme = colorScheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[resolvedTheme];
  const mutedText = useThemeColor({}, 'mutedText');

  const objectItem = useMemo(
    () => DISCOVER_OBJECTS.find((discoverItem) => discoverItem.id === id),
    [id],
  );

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

  const openTrust = (userName: string, role: 'prêteur' | 'emprunteur') => {
    router.push({ pathname: '/trust', params: { userName, role } });
  };

  if (!objectItem || !objectStory) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <ThemedView style={styles.page}>
          <Card style={styles.card}>
            <ThemedText type="subtitle">Mini-story introuvable</ThemedText>
            <ThemedText style={{ color: mutedText }}>
              Cette mini-story n’est pas disponible pour le moment.
            </ThemedText>
            <Button label="Retour à l’objet" onPress={() => router.back()} />
          </Card>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedView style={styles.page}>
          <Card style={styles.card}>
            <ThemedText type="title">Mini-story complète</ThemedText>
            <ThemedText type="defaultSemiBold">{objectItem.title}</ThemedText>

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

          {storyContributions.length > 0 ? (
            <Card style={styles.card}>
              <ThemedText type="defaultSemiBold">Ajouts emprunteurs validés</ThemedText>
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
            </Card>
          ) : null}

          <Button label="Retour au détail objet" variant="secondary" onPress={() => router.push({ pathname: '/object/[id]', params: { id: objectItem.id } })} />
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
  card: {
    gap: Spacing.sm,
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
  borrowerContribCard: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.xs,
    flexDirection: 'row',
    gap: Spacing.xs,
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
});
