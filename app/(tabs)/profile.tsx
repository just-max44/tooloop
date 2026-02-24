import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ExternalLink } from '@/components/external-link';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { LEGAL_URLS } from '@/constants/legal';
import { MY_ITEMS, PROFILE_BADGES, PROFILE_STATS, TRUST_PROFILE } from '@/data/mock';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function ProfileScreen() {
  const router = useRouter();
  const background = useThemeColor({}, 'background');
  const surface = useThemeColor({}, 'surface');
  const border = useThemeColor({}, 'border');
  const mutedText = useThemeColor({}, 'mutedText');

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: background }]} edges={['top']}>
      <ThemedView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Card style={styles.card}>
            <ThemedText type="title">Profil</ThemedText>
            <ThemedText style={[styles.subtitle, { color: mutedText }]}>Ton espace de confiance et de suivi.</ThemedText>

            <View style={styles.statsRow}>
              <View style={[styles.statItem, { backgroundColor: surface, borderColor: border }]}>
                <ThemedText type="defaultSemiBold">{PROFILE_STATS.rating.toFixed(1)} ⭐</ThemedText>
                <ThemedText style={{ color: mutedText, fontSize: 12 }}>{PROFILE_STATS.reviews} avis</ThemedText>
              </View>
              <View style={[styles.statItem, { backgroundColor: surface, borderColor: border }]}>
                <ThemedText type="defaultSemiBold">{PROFILE_STATS.objects}</ThemedText>
                <ThemedText style={{ color: mutedText, fontSize: 12 }}>Objets postés</ThemedText>
              </View>
              <View style={[styles.statItem, { backgroundColor: surface, borderColor: border }]}>
                <ThemedText type="defaultSemiBold">{PROFILE_STATS.loans}</ThemedText>
                <ThemedText style={{ color: mutedText, fontSize: 12 }}>Prêts total</ThemedText>
              </View>
            </View>

            <View style={styles.badgesWrap}>
              {PROFILE_BADGES.map((badge) => (
                <Badge key={badge} label={badge} variant="neutral" />
              ))}
            </View>

            <View style={[styles.trustRow, { borderColor: border, backgroundColor: surface }]}> 
              <View style={styles.trustTextWrap}>
                <ThemedText type="defaultSemiBold">Confiance locale: {TRUST_PROFILE.trustScore}%</ThemedText>
                <ThemedText style={{ color: mutedText, fontSize: 12 }}>{TRUST_PROFILE.level}</ThemedText>
              </View>
              <Pressable
                onPress={() => router.push('/trust')}
                accessibilityRole="button"
                accessibilityLabel="Ouvrir la page Confiance locale">
                <ThemedText type="link">Voir détail</ThemedText>
              </Pressable>
            </View>
          </Card>

          <Card style={styles.card}>
            <ThemedText type="subtitle">Mes objets</ThemedText>
            {MY_ITEMS.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <View style={styles.itemTextWrap}>
                  <ThemedText type="defaultSemiBold">{item.name}</ThemedText>
                  <ThemedText style={{ color: mutedText, fontSize: 12 }}>{item.category}</ThemedText>
                </View>
                <Badge label={item.available ? 'Disponible' : 'Indisponible'} variant={item.available ? 'primary' : 'neutral'} />
              </View>
            ))}
          </Card>

          <Card style={styles.card}>
            <ThemedText type="subtitle">Légal</ThemedText>
            <ExternalLink href={LEGAL_URLS.privacyPolicy}>
              <ThemedText type="link">Politique de confidentialité</ThemedText>
            </ExternalLink>
            <ExternalLink href={LEGAL_URLS.terms}>
              <ThemedText type="link">Conditions générales d’utilisation</ThemedText>
            </ExternalLink>
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
    padding: 16,
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    gap: 12,
  },
  card: {
    gap: 10,
    width: '100%',
  },
  subtitle: {
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statItem: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    gap: 2,
  },
  badgesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  itemTextWrap: {
    flex: 1,
    gap: 2,
  },
  trustRow: {
    marginTop: 4,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  trustTextWrap: {
    flex: 1,
    gap: 1,
  },
});
