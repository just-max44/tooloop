import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Radius } from '@/constants/theme';
import { useProofBackToInbox } from '@/hooks/use-proof-back-to-inbox';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getObjectImageByLoanObjectName, INBOX_LOANS, useBackendDataVersion } from '@/lib/backend/data';
import { setPickupValidated } from '@/stores/proof/progress-store';
import {
    getPickupReturnDateLabel,
    isBorrowerPickupAccepted,
    setBorrowerPickupAccepted,
} from '@/stores/proof/return-timing-store';

export default function PickupReviewScreen() {
  useBackendDataVersion();
  const router = useRouter();
  const { loanId, as } = useLocalSearchParams<{ loanId: string; as?: string }>();
  useProofBackToInbox();

  const background = useThemeColor({}, 'background');
  const mutedText = useThemeColor({}, 'mutedText');
  const border = useThemeColor({}, 'border');
  const surface = useThemeColor({}, 'surface');
  const tint = useThemeColor({}, 'tint');

  const [acknowledged, setAcknowledged] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const loan = useMemo(() => INBOX_LOANS.find((item) => item.id === loanId), [loanId]);
  const isBorrower = as === 'borrower' || loan?.direction === 'incoming';
  const alreadyAccepted = loanId ? isBorrowerPickupAccepted(loanId) : false;
  const returnDateLabel = loanId ? getPickupReturnDateLabel(loanId) : '';
  const objectImageUri = loan ? getObjectImageByLoanObjectName(loan.objectName) : undefined;
  const lenderLabel = loan ? (isBorrower ? loan.otherUserName : 'Vous') : '';
  const borrowerLabel = loan ? (isBorrower ? 'Vous' : loan.otherUserName) : '';

  if (!loan || !loanId || !isBorrower) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: background }]} edges={['top']}>
        <ThemedView style={styles.container}>
          <Card style={styles.card}>
            <ThemedText type="subtitle">Récapitulatif indisponible</ThemedText>
            <ThemedText style={{ color: mutedText }}>
              Cette étape est réservée à l’emprunteur après validation QR/code.
            </ThemedText>
            <Button label="Retour Pass" onPress={() => router.push({ pathname: '/proof/[loanId]', params: { loanId } })} />
          </Card>
        </ThemedView>
      </SafeAreaView>
    );
  }

  const submitAcceptance = () => {
    if (!returnDateLabel) {
      return;
    }

    if (!acknowledged && !alreadyAccepted) {
      return;
    }

    setBorrowerPickupAccepted(loanId, true);
    setPickupValidated(loanId, true);
    setSubmitted(true);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: background }]} edges={['top']}>
      <ThemedView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Card style={styles.card}>
            <ThemedText type="title">Récapitulatif de remise</ThemedText>
            <ThemedText style={{ color: mutedText, fontSize: 12 }}>
              Vérifie les informations du prêteur avant validation finale.
            </ThemedText>
          </Card>

          <Card style={styles.card}>
            {objectImageUri ? (
              <Image source={{ uri: objectImageUri }} style={styles.objectPhoto} contentFit="cover" />
            ) : (
              <View style={[styles.photoFallback, { borderColor: border, backgroundColor: surface }]}>
                <MaterialIcons name="image" size={22} color={mutedText} />
                <ThemedText style={{ color: mutedText, fontSize: 12 }}>Photo indisponible</ThemedText>
              </View>
            )}

            <View style={styles.infoRow}>
              <ThemedText type="defaultSemiBold">Objet</ThemedText>
              <ThemedText>{loan.objectName}</ThemedText>
            </View>
            <View style={styles.infoRow}>
              <ThemedText type="defaultSemiBold">Prêteur</ThemedText>
              <ThemedText>{lenderLabel}</ThemedText>
            </View>
            <View style={styles.infoRow}>
              <ThemedText type="defaultSemiBold">Emprunteur</ThemedText>
              <ThemedText>{borrowerLabel}</ThemedText>
            </View>
            <View style={styles.infoRow}>
              <ThemedText type="defaultSemiBold">Date de retour</ThemedText>
              <ThemedText>{returnDateLabel || 'Non renseignée'}</ThemedText>
            </View>
          </Card>

          {!alreadyAccepted ? (
            <Card style={styles.card}>
              <Pressable
                style={[styles.checkItem, { borderColor: border, backgroundColor: surface }]}
                onPress={() => setAcknowledged((value) => !value)}
                accessibilityRole="checkbox"
                accessibilityLabel="Confirmer la prise de connaissance"
                accessibilityState={{ checked: acknowledged }}>
                <View style={styles.checkLeft}>
                  <MaterialIcons
                    name={acknowledged ? 'check-circle' : 'radio-button-unchecked'}
                    size={18}
                    color={acknowledged ? tint : mutedText}
                  />
                  <ThemedText>Je confirme avoir pris connaissance de ces informations.</ThemedText>
                </View>
              </Pressable>

              <Button
                label="Valider la remise"
                onPress={submitAcceptance}
                disabled={!acknowledged || !returnDateLabel}
              />
            </Card>
          ) : null}

          {alreadyAccepted || submitted ? (
            <Card style={styles.card}>
              <View style={[styles.successBox, { borderColor: `${tint}66`, backgroundColor: `${tint}16` }]}>
                <ThemedText type="defaultSemiBold">✅ Remise acceptée</ThemedText>
                <ThemedText style={{ color: mutedText, fontSize: 12 }}>
                  Le prêteur reçoit maintenant la confirmation dans son pass d’échange.
                </ThemedText>
                <Button
                  label="Retour au pass d’échange"
                  onPress={() => router.push({ pathname: '/proof/[loanId]', params: { loanId } })}
                />
              </View>
            </Card>
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
  objectPhoto: {
    width: '100%',
    height: 180,
    borderRadius: Radius.md,
  },
  photoFallback: {
    width: '100%',
    height: 140,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  infoRow: {
    gap: 3,
  },
  checkItem: {
    borderWidth: 1,
    borderRadius: Radius.md,
    minHeight: 44,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  checkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  successBox: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: 10,
    gap: 8,
  },
});
