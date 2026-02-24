import { useFocusEffect } from '@react-navigation/native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Radius } from '@/constants/theme';
import { getExchangePassByLoanId, getObjectImageByLoanObjectName, INBOX_LOANS } from '@/data/mock';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getProofProgress } from '@/stores/proof/progress-store';
import {
    getPickupReturnDateLabel,
    getReturnConditionLabel,
    isBorrowerPickupAccepted,
    isBorrowerReturnAccepted,
} from '@/stores/proof/return-timing-store';

export default function ProofHomeScreen() {
  const router = useRouter();
  const { loanId } = useLocalSearchParams<{ loanId: string }>();

  const background = useThemeColor({}, 'background');
  const mutedText = useThemeColor({}, 'mutedText');
  const border = useThemeColor({}, 'border');
  const surface = useThemeColor({}, 'surface');
  const [, setRefreshKey] = useState(0);

  const loan = useMemo(() => INBOX_LOANS.find((item) => item.id === loanId), [loanId]);
  const pass = useMemo(() => (loanId ? getExchangePassByLoanId(loanId) : undefined), [loanId]);
  const proofProgress = loanId ? getProofProgress(loanId) : { pickupValidated: false, returnValidated: false };
  const borrowerAcceptedPickup = loanId ? isBorrowerPickupAccepted(loanId) : false;
  const borrowerAcceptedReturn = loanId ? isBorrowerReturnAccepted(loanId) : false;
  const pickupReturnDateLabel = loanId ? getPickupReturnDateLabel(loanId) : '';
  const returnConditionLabel = loanId ? getReturnConditionLabel(loanId) : '';
  const objectImageUri = loan ? getObjectImageByLoanObjectName(loan.objectName) : undefined;
  const pickupTimingLabel = useMemo(() => {
    if (!pass?.meetupLabel) {
      return null;
    }

    if (pass.meetupLabel.startsWith('Aujourd’hui')) {
      return `Remise prévue dans quelques heures (${pass.meetupLabel}).`;
    }

    if (pass.meetupLabel.startsWith('Demain')) {
      return `Remise prévue dans ~1 jour (${pass.meetupLabel}).`;
    }

    if (pass.meetupLabel.startsWith('Terminé')) {
      return 'Remise déjà effectuée.';
    }

    return `Remise prévue prochainement (${pass.meetupLabel}).`;
  }, [pass]);

  useFocusEffect(
    useCallback(() => {
      setRefreshKey((current) => current + 1);
    }, [])
  );

  if (!loan || !loanId) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: background }]} edges={['top']}>
        <ThemedView style={styles.container}>
          <Card style={styles.card}>
            <ThemedText type="subtitle">Pass indisponible</ThemedText>
            <ThemedText style={{ color: mutedText }}>Cet échange n’est pas accessible.</ThemedText>
            <Button label="Retour Échanges" onPress={() => router.push('/(tabs)/inbox')} />
          </Card>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: background }]} edges={['top']}>
      <ThemedView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Card style={styles.card}>
            <ThemedText type="title">Pass d’échange</ThemedText>
            <ThemedText style={{ color: mutedText }}>
              {loan.objectName} avec {loan.otherUserName}
            </ThemedText>
            {objectImageUri ? (
              <Image source={{ uri: objectImageUri }} style={styles.objectPhoto} contentFit="cover" />
            ) : (
              <View style={[styles.photoFallback, { borderColor: border, backgroundColor: surface }]}>
                <ThemedText style={{ color: mutedText, fontSize: 12 }}>Photo indisponible</ThemedText>
              </View>
            )}
          </Card>

          <Card style={styles.card}>
            <ThemedText type="subtitle">Validation remise objet</ThemedText>
            <ThemedText style={{ color: mutedText }}>
              Confirme le départ du prêt avec une méthode au choix: QR ou code.
            </ThemedText>
            {pickupTimingLabel ? <ThemedText style={{ color: mutedText, fontSize: 12 }}>{pickupTimingLabel}</ThemedText> : null}
            {pickupReturnDateLabel ? (
              <ThemedText style={{ color: mutedText, fontSize: 12 }}>Retour prévu le {pickupReturnDateLabel}</ThemedText>
            ) : null}
            <Button
              label={borrowerAcceptedPickup ? 'Remise déjà validée' : 'Ouvrir la remise'}
              disabled={borrowerAcceptedPickup}
              onPress={() => router.push({ pathname: '/proof/pickup/[loanId]', params: { loanId } })}
            />
            {borrowerAcceptedPickup ? (
              <ThemedText style={{ color: mutedText, fontSize: 12 }}>
                Cette étape est verrouillée car l’emprunteur a déjà validé le récapitulatif.
              </ThemedText>
            ) : null}
          </Card>

          {borrowerAcceptedPickup ? (
            <Card style={styles.card}>
              <ThemedText type="subtitle">Récapitulatif validé</ThemedText>
              {objectImageUri ? (
                <Image source={{ uri: objectImageUri }} style={styles.objectPhoto} contentFit="cover" />
              ) : (
                <View style={[styles.photoFallback, { borderColor: border, backgroundColor: surface }]}>
                  <ThemedText style={{ color: mutedText, fontSize: 12 }}>Photo indisponible</ThemedText>
                </View>
              )}
              <View style={styles.infoRow}>
                <ThemedText type="defaultSemiBold">Objet</ThemedText>
                <ThemedText>{loan.objectName}</ThemedText>
              </View>
              <View style={styles.infoRow}>
                <ThemedText type="defaultSemiBold">Prêteur</ThemedText>
                <ThemedText>{loan.direction === 'outgoing' ? 'Vous' : loan.otherUserName}</ThemedText>
              </View>
              <View style={styles.infoRow}>
                <ThemedText type="defaultSemiBold">Emprunteur</ThemedText>
                <ThemedText>{loan.direction === 'incoming' ? 'Vous' : loan.otherUserName}</ThemedText>
              </View>
              {pickupReturnDateLabel ? (
                <View style={styles.infoRow}>
                  <ThemedText type="defaultSemiBold">Date de retour</ThemedText>
                  <ThemedText>{pickupReturnDateLabel}</ThemedText>
                </View>
              ) : null}
              <Badge label="Validé par l’emprunteur" variant="primary" />
            </Card>
          ) : null}

          <Card style={styles.card}>
            <ThemedText type="subtitle">Validation retour objet</ThemedText>
            <ThemedText style={{ color: mutedText }}>
              Confirme la fin du prêt avec un nouveau QR ou un nouveau code.
            </ThemedText>
            {returnConditionLabel ? (
              <ThemedText style={{ color: mutedText, fontSize: 12 }}>État du retour: {returnConditionLabel}</ThemedText>
            ) : null}
            <Button
              label={borrowerAcceptedReturn ? 'Retour déjà validé' : !proofProgress.pickupValidated ? 'Remise à valider d’abord' : 'Ouvrir le retour'}
              variant="secondary"
              disabled={borrowerAcceptedReturn || !proofProgress.pickupValidated}
              onPress={() => router.push({ pathname: '/proof/return/[loanId]', params: { loanId } })}
            />
            {borrowerAcceptedReturn ? (
              <ThemedText style={{ color: mutedText, fontSize: 12 }}>
                Cette étape est verrouillée car l’emprunteur a déjà validé le récapitulatif du retour.
              </ThemedText>
            ) : !proofProgress.pickupValidated ? (
              <ThemedText style={{ color: mutedText, fontSize: 12 }}>
                La remise doit être validée avant d’ouvrir l’étape retour.
              </ThemedText>
            ) : null}
          </Card>

          {borrowerAcceptedReturn ? (
            <Card style={styles.card}>
              <ThemedText type="subtitle">Récapitulatif retour validé</ThemedText>
              {objectImageUri ? (
                <Image source={{ uri: objectImageUri }} style={styles.objectPhoto} contentFit="cover" />
              ) : (
                <View style={[styles.photoFallback, { borderColor: border, backgroundColor: surface }]}>
                  <ThemedText style={{ color: mutedText, fontSize: 12 }}>Photo indisponible</ThemedText>
                </View>
              )}
              <View style={styles.infoRow}>
                <ThemedText type="defaultSemiBold">Objet</ThemedText>
                <ThemedText>{loan.objectName}</ThemedText>
              </View>
              <View style={styles.infoRow}>
                <ThemedText type="defaultSemiBold">Prêteur</ThemedText>
                <ThemedText>{loan.direction === 'outgoing' ? 'Vous' : loan.otherUserName}</ThemedText>
              </View>
              <View style={styles.infoRow}>
                <ThemedText type="defaultSemiBold">Emprunteur</ThemedText>
                <ThemedText>{loan.direction === 'incoming' ? 'Vous' : loan.otherUserName}</ThemedText>
              </View>
              {returnConditionLabel ? (
                <View style={styles.infoRow}>
                  <ThemedText type="defaultSemiBold">État du retour</ThemedText>
                  <ThemedText>{returnConditionLabel}</ThemedText>
                </View>
              ) : null}
              <Badge label="Retour validé par l’emprunteur" variant="primary" />
            </Card>
          ) : null}

          {!borrowerAcceptedReturn ? (
            <View style={styles.noteWrap}>
              <ThemedText style={{ color: mutedText, fontSize: 12 }}>
                Dans chaque étape, vous choisissez une seule méthode de confirmation: QR ou code.
              </ThemedText>
            </View>
          ) : null}
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
    padding: 16,
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
  },
  content: {
    gap: 12,
    paddingBottom: 16,
  },
  card: {
    gap: 10,
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  noteWrap: {
    paddingHorizontal: 4,
  },
  objectPhoto: {
    width: '100%',
    height: 170,
    borderRadius: Radius.md,
  },
  photoFallback: {
    width: '100%',
    height: 120,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoRow: {
    gap: 3,
  },
});
