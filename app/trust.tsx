import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Radius } from '@/constants/theme';
import { NEIGHBORHOOD_PULSE, TRUST_COMMUNITY_SIGNALS, TRUST_PROFILE, TRUST_PROOFS } from '@/data/mock';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function TrustScreen() {
  const tint = useThemeColor({}, 'tint');
  const text = useThemeColor({}, 'text');
  const background = useThemeColor({}, 'background');
  const mutedText = useThemeColor({}, 'mutedText');
  const border = useThemeColor({}, 'border');
  const surface = useThemeColor({}, 'surface');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const onRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 650);
  };

  const progressPercent = Math.min(
    100,
    Math.round((TRUST_PROFILE.trustScore / TRUST_PROFILE.nextLevelAt) * 100),
  );

  const shareTrust = () => {
    Alert.alert(
      'Partage prêt',
      'Fonction de partage locale prête pour la prochaine étape produit.',
    );
  };

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
            <View style={styles.titleRow}>
              <View style={[styles.iconWrap, { backgroundColor: `${tint}22` }]}>
                <MaterialIcons name="verified-user" size={18} color={tint} />
              </View>
              <View style={styles.titleBlock}>
                <ThemedText type="title">Confiance locale</ThemedText>
                <ThemedText style={{ color: mutedText }}>
                  Ce qui te rend fiable dans ton quartier, au-delà des étoiles.
                </ThemedText>
              </View>
            </View>

            <View style={styles.scoreRow}>
              <View style={[styles.scoreCard, { borderColor: border, backgroundColor: surface }]}>
                <ThemedText type="subtitle">{TRUST_PROFILE.trustScore}%</ThemedText>
                <ThemedText style={{ color: mutedText, fontSize: 12 }}>Indice de confiance</ThemedText>
              </View>
              <View style={[styles.scoreCard, { borderColor: border, backgroundColor: surface }]}>
                <ThemedText type="subtitle">{TRUST_PROFILE.loopsValidated}</ThemedText>
                <ThemedText style={{ color: mutedText, fontSize: 12 }}>Prêts validés</ThemedText>
              </View>
              <View style={[styles.scoreCard, { borderColor: border, backgroundColor: surface }]}>
                <ThemedText type="subtitle">{TRUST_PROFILE.noIncidentMonths} mois</ThemedText>
                <ThemedText style={{ color: mutedText, fontSize: 12 }}>Sans incident</ThemedText>
              </View>
            </View>

            <View style={styles.levelRow}>
              <Badge label={TRUST_PROFILE.level} variant="primary" />
              <ThemedText style={{ color: mutedText, fontSize: 12 }}>
                Plus que {TRUST_PROFILE.nextLevelAt - TRUST_PROFILE.trustScore} points pour le niveau suivant.
              </ThemedText>
            </View>

            <View style={[styles.progressTrack, { backgroundColor: `${tint}22` }]}>
              <View style={[styles.progressFill, { width: `${progressPercent}%`, backgroundColor: tint }]} />
            </View>
          </Card>

          <Card style={styles.card}>
            <ThemedText type="subtitle">Preuves de fiabilité</ThemedText>
            <View style={styles.proofsWrap}>
              {TRUST_PROOFS.map((proof) => (
                <View key={proof.id} style={[styles.proofRow, { borderColor: border }]}>
                  <ThemedText type="defaultSemiBold">{proof.label}</ThemedText>
                  <ThemedText style={{ color: mutedText }}>{proof.value}</ThemedText>
                </View>
              ))}
            </View>
          </Card>

          <Card style={styles.card}>
            <ThemedText type="subtitle">Signaux communautaires</ThemedText>
            <View style={styles.signalsWrap}>
              {TRUST_COMMUNITY_SIGNALS.map((signal) => (
                <View key={signal.id} style={[styles.signalRow, { borderColor: border }]}>
                  <MaterialIcons name="forum" size={14} color={tint} />
                  <View style={styles.signalTextWrap}>
                    <ThemedText type="defaultSemiBold">{signal.title}</ThemedText>
                    <ThemedText style={{ color: mutedText, fontSize: 12 }}>{signal.subtitle}</ThemedText>
                  </View>
                </View>
              ))}
            </View>
          </Card>

          <Card style={styles.card}>
            <ThemedText type="subtitle">Impact quartier</ThemedText>
            <View style={styles.impactRow}>
              <ThemedText style={{ color: text }}>{NEIGHBORHOOD_PULSE.activeNeighbors} voisins actifs</ThemedText>
              <ThemedText style={{ color: text }}>{NEIGHBORHOOD_PULSE.loopsThisWeek} échanges cette semaine</ThemedText>
            </View>
            <Button label="Partager mon niveau de confiance" onPress={shareTrust} />
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
    gap: 12,
  },
  titleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  titleBlock: {
    flex: 1,
    gap: 2,
  },
  scoreRow: {
    flexDirection: 'row',
    gap: 8,
  },
  scoreCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    gap: 2,
  },
  levelRow: {
    gap: 6,
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
  proofsWrap: {
    gap: 8,
  },
  proofRow: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    gap: 2,
  },
  signalsWrap: {
    gap: 8,
  },
  signalRow: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  signalTextWrap: {
    flex: 1,
    gap: 1,
  },
  impactRow: {
    gap: 4,
  },
});
