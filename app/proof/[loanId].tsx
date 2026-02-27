import { useFocusEffect } from '@react-navigation/native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Radius } from '@/constants/theme';
import { useProofBackToInbox } from '@/hooks/use-proof-back-to-inbox';
import { useThemeColor } from '@/hooks/use-theme-color';
import {
    getObjectByLoanObjectName,
    getObjectImageByLoanObjectName,
    INBOX_LOANS,
    PROFILE_USER,
    useBackendDataVersion,
} from '@/lib/backend/data';
import { showAppNotice } from '@/stores/app-notice-store';
import { addStoryContribution } from '@/stores/object-story-store';
import { getProofProgress } from '@/stores/proof/progress-store';
import {
    getPickupReturnDateLabel,
    getReturnConditionLabel,
    isBorrowerPickupAccepted,
    isBorrowerReturnAccepted,
} from '@/stores/proof/return-timing-store';

export default function ProofHomeScreen() {
  useBackendDataVersion();
  const router = useRouter();
  const { loanId } = useLocalSearchParams<{ loanId: string }>();
  useProofBackToInbox();

  const background = useThemeColor({}, 'background');
  const mutedText = useThemeColor({}, 'mutedText');
  const border = useThemeColor({}, 'border');
  const surface = useThemeColor({}, 'surface');
  const text = useThemeColor({}, 'text');
  const tint = useThemeColor({}, 'tint');
  const [, setRefreshKey] = useState(0);
  const [storyPhotoUri, setStoryPhotoUri] = useState<string | null>(null);
  const [storyComment, setStoryComment] = useState('');
  const [storySubmitted, setStorySubmitted] = useState(false);

  const loan = useMemo(() => INBOX_LOANS.find((item) => item.id === loanId), [loanId]);
  const proofProgress = loanId ? getProofProgress(loanId) : { pickupValidated: false, returnValidated: false };
  const borrowerAcceptedPickup = loanId ? isBorrowerPickupAccepted(loanId) : false;
  const borrowerAcceptedReturn = loanId ? isBorrowerReturnAccepted(loanId) : false;
  const pickupReturnDateLabel = loanId ? getPickupReturnDateLabel(loanId) : '';
  const returnConditionLabel = loanId ? getReturnConditionLabel(loanId) : '';
  const objectImageUri = loan ? getObjectImageByLoanObjectName(loan.objectName) : undefined;
  const objectItem = loan ? getObjectByLoanObjectName(loan.objectName) : undefined;
  const isBorrowerLoan = loan?.direction === 'incoming';
  const canContributeStory = isBorrowerLoan && proofProgress.pickupValidated && !borrowerAcceptedReturn;

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

  const pickStoryPhotoFromGallery = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      showAppNotice('Autorisation requise: active l’accès galerie pour ajouter une photo à la mini-story.', 'warning');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [4, 3],
      selectionLimit: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      setStoryPhotoUri(result.assets[0].uri);
      setStorySubmitted(false);
    }
  };

  const submitStoryContribution = () => {
    if (!canContributeStory || !objectItem) {
      return;
    }

    if (!storyPhotoUri) {
      showAppNotice('Photo requise: choisis une photo depuis la galerie pour enrichir la mini-story.', 'warning');
      return;
    }

    addStoryContribution({
      loanId,
      objectId: objectItem.id,
      photoUri: storyPhotoUri,
      comment: storyComment,
      authorName: `${PROFILE_USER.firstName} ${PROFILE_USER.lastName}`,
    });

    setStoryPhotoUri(null);
    setStoryComment('');
    setStorySubmitted(true);
    showAppNotice('Contribution envoyée au prêteur pour validation.', 'success');
  };

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
            {!borrowerAcceptedPickup ? (
              <>
                <ThemedText style={{ color: mutedText }}>
                  Confirme le départ du prêt avec une méthode au choix: QR ou code.
                </ThemedText>
                <Button
                  label="Ouvrir la remise"
                  onPress={() => router.push({ pathname: '/proof/pickup/[loanId]', params: { loanId } })}
                />
              </>
            ) : (
              <Button
                label="Remise déjà validée"
                variant="secondary"
                disabled
              />
            )}
            {borrowerAcceptedPickup ? (
              <>
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
              </>
            ) : (
              <ThemedText style={{ color: mutedText, fontSize: 12 }}>
                L’étape restera ouverte jusqu’à validation finale de l’emprunteur.
              </ThemedText>
            )}
          </Card>

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

          {isBorrowerLoan ? (
            <Card style={styles.card}>
              <ThemedText type="subtitle">Contribuer à la mini-story</ThemedText>
              {!canContributeStory ? (
                <ThemedText style={{ color: mutedText, fontSize: 12 }}>
                  {borrowerAcceptedReturn
                    ? 'Le prêt est terminé: l’ajout photo mini-story n’est plus disponible pour cet échange.'
                    : 'Disponible après validation de la remise objet.'}
                </ThemedText>
              ) : (
                <>
                  <ThemedText style={{ color: mutedText, fontSize: 12 }}>
                    Pendant le prêt, tu peux ajouter une photo depuis ta galerie avec un commentaire optionnel.
                  </ThemedText>

                  {storyPhotoUri ? (
                    <View style={[styles.storyPhotoPreviewWrap, { borderColor: border, backgroundColor: surface }]}>
                      <Image source={{ uri: storyPhotoUri }} style={styles.storyPhotoPreview} contentFit="cover" />
                    </View>
                  ) : null}

                  <View style={styles.storyPhotoActions}>
                    <Button label={storyPhotoUri ? 'Changer la photo' : 'Choisir une photo (galerie)'} variant="secondary" onPress={pickStoryPhotoFromGallery} />
                    {storyPhotoUri ? <Button label="Supprimer" variant="ghost" onPress={() => setStoryPhotoUri(null)} /> : null}
                  </View>

                  <TextInput
                    value={storyComment}
                    onChangeText={(nextValue) => {
                      setStoryComment(nextValue);
                      setStorySubmitted(false);
                    }}
                    placeholder="Commentaire (optionnel)"
                    placeholderTextColor={mutedText}
                    multiline
                    maxLength={180}
                    style={[styles.storyInput, styles.storyCommentInput, { borderColor: border, backgroundColor: surface, color: text }]}
                  />
                  <Button label="Ajouter à la mini-story" variant="secondary" onPress={submitStoryContribution} />

                  {storySubmitted ? (
                    <View style={[styles.storySuccess, { borderColor: `${tint}44`, backgroundColor: `${tint}12` }]}>
                      <ThemedText type="defaultSemiBold" style={{ color: tint }}>
                        Ajout envoyé au prêteur
                      </ThemedText>
                      <ThemedText style={{ color: mutedText, fontSize: 12 }}>
                        La contribution sera publiée après validation du prêteur au moment du retour.
                      </ThemedText>
                    </View>
                  ) : null}
                </>
              )}
            </Card>
          ) : null}

          {borrowerAcceptedReturn ? (
            <Card style={styles.card}>
              <ThemedText type="subtitle">Récapitulatif retour validé</ThemedText>
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
  storyInput: {
    borderWidth: 1,
    borderRadius: Radius.md,
    minHeight: 44,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  storyCommentInput: {
    minHeight: 82,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  storyPhotoPreviewWrap: {
    borderWidth: 1,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  storyPhotoPreview: {
    width: '100%',
    height: 160,
  },
  storyPhotoActions: {
    gap: 8,
  },
  storySuccess: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 2,
  },
});
