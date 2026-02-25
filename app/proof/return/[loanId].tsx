import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Radius } from '@/constants/theme';
import { useProofBackToInbox } from '@/hooks/use-proof-back-to-inbox';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getExchangePassByLoanId, INBOX_LOANS, PROFILE_USER, useBackendDataVersion } from '@/lib/backend/data';
import { showAppNotice } from '@/stores/app-notice-store';
import { upsertTrustExchangeComment } from '@/stores/feedback-store';
import {
    approveStoryContribution,
    getPendingStoryContributionsByLoanId,
    rejectStoryContribution,
} from '@/stores/object-story-store';
import { getStepQrPayload, getStepVerifierCode, isExchangeQrPayload } from '@/stores/proof/pass-auth';
import {
    getReturnCondition,
    getReturnConditionLabel,
    isBorrowerReturnAccepted,
    setReturnCondition,
} from '@/stores/proof/return-timing-store';

type ValidationMethod = 'qr' | 'code';
type ReturnCondition = 'conforme' | 'partiel' | 'abime';

export default function ReturnProofScreen() {
  useBackendDataVersion();
  const router = useRouter();
  const { loanId } = useLocalSearchParams<{ loanId: string }>();
  useProofBackToInbox();
  const insets = useSafeAreaInsets();

  const border = useThemeColor({}, 'border');
  const background = useThemeColor({}, 'background');
  const surface = useThemeColor({}, 'surface');
  const mutedText = useThemeColor({}, 'mutedText');
  const text = useThemeColor({}, 'text');
  const tint = useThemeColor({}, 'tint');

  const [method, setMethod] = useState<ValidationMethod>('qr');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerLocked, setScannerLocked] = useState(false);
  const [methodValidated, setMethodValidated] = useState(false);
  const [partnerCode, setPartnerCode] = useState('');
  const [returnChecked, setReturnChecked] = useState(false);
  const [lenderComment, setLenderComment] = useState('');
  const [lenderCommentSaved, setLenderCommentSaved] = useState(false);
  const [methodSuccessMessage, setMethodSuccessMessage] = useState<string | null>(null);
  const [continueHint, setContinueHint] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const lastScanRef = useRef<{ data: string; at: number }>({ data: '', at: 0 });

  const loan = useMemo(() => INBOX_LOANS.find((item) => item.id === loanId), [loanId]);
  const pass = useMemo(() => (loanId ? getExchangePassByLoanId(loanId) : undefined), [loanId]);
  const isBorrower = loan?.direction === 'incoming';
  const isLender = loan?.direction === 'outgoing';

  const [returnCondition, setReturnConditionState] = useState<ReturnCondition | null>(() =>
    loanId ? getReturnCondition(loanId) : null
  );

  const borrowerAccepted = loanId ? isBorrowerReturnAccepted(loanId) : false;
  const pendingStoryContributions = loanId ? getPendingStoryContributionsByLoanId(loanId) : [];
  const stepCode = useMemo(() => (pass ? getStepVerifierCode(pass.codeSeed, 'return') : ''), [pass]);
  const qrPayload = useMemo(() => (pass ? JSON.stringify(getStepQrPayload(pass, 'return')) : ''), [pass]);

  useFocusEffect(
    useCallback(() => {
      setRefreshKey((current) => current + 1);
      if (loanId) {
        setReturnConditionState(getReturnCondition(loanId));
      }
      setMethodValidated(false);
      setMethodSuccessMessage(null);
      setReturnChecked(false);
      setContinueHint(null);
    }, [loanId])
  );

  void refreshKey;

  if (!loan || !pass || !loanId) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: background }]} edges={['top']}>
        <ThemedView style={styles.container}>
          <Card style={styles.card}>
            <ThemedText type="subtitle">Validation retour indisponible</ThemedText>
            <ThemedText style={{ color: mutedText }}>Cet échange n’est pas accessible.</ThemedText>
            <Button label="Retour Échanges" onPress={() => router.push('/(tabs)/inbox')} />
          </Card>
        </ThemedView>
      </SafeAreaView>
    );
  }

  if (borrowerAccepted) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: background }]} edges={['top']}>
        <ThemedView style={styles.container}>
          <Card style={styles.card}>
            <ThemedText type="subtitle">Retour déjà validé</ThemedText>
            <ThemedText style={{ color: mutedText }}>
              Cette étape est verrouillée. Le formulaire de retour n’est plus accessible.
            </ThemedText>
            <Button
              label="Retour au pass d’échange"
              onPress={() => router.replace({ pathname: '/proof/[loanId]', params: { loanId } })}
            />
          </Card>
        </ThemedView>
      </SafeAreaView>
    );
  }

  const hasReturnCondition = !!returnCondition;

  const ensureReturnConditionExists = () => {
    if (hasReturnCondition) {
      return true;
    }

    showAppNotice(
      isLender
        ? 'État requis: renseigne l’état du retour (conforme, partiel ou abîmé).'
        : 'Le prêteur doit d’abord renseigner l’état du retour.',
      'warning'
    );
    return false;
  };

  const updateReturnCondition = (nextCondition: ReturnCondition) => {
    if (!isLender) {
      return;
    }

    setReturnConditionState(nextCondition);
    setReturnCondition(loanId, nextCondition);
  };

  const openScanner = async () => {
    if (!ensureReturnConditionExists()) {
      return;
    }

    if (!isBorrower) {
      return;
    }

    if (Platform.OS === 'web') {
      showAppNotice('Scan indisponible: le scan caméra est disponible sur iOS et Android.', 'warning');
      return;
    }

    if (!cameraPermission?.granted) {
      const permissionResponse = await requestCameraPermission();
      if (!permissionResponse.granted) {
        showAppNotice('Autorisation caméra requise pour scanner le QR partenaire.', 'warning');
        return;
      }
    }

    setScannerLocked(false);
    setIsScannerOpen(true);
  };

  const closeScanner = () => {
    setIsScannerOpen(false);
    setScannerLocked(false);
  };

  const handleQrScanned = ({ data }: BarcodeScanningResult) => {
    if (scannerLocked || !isBorrower) {
      return;
    }

    const now = Date.now();
    const isRapidDuplicate = lastScanRef.current.data === data && now - lastScanRef.current.at < 1200;
    if (isRapidDuplicate) {
      return;
    }

    lastScanRef.current = { data, at: now };
    setScannerLocked(true);

    let parsedPayload: unknown;
    try {
      parsedPayload = JSON.parse(data);
    } catch {
      showAppNotice('QR invalide: le QR scanné n’est pas un pass Tooloop valide.', 'error');
      setTimeout(() => setScannerLocked(false), 350);
      return;
    }

    if (!isExchangeQrPayload(parsedPayload)) {
      showAppNotice('QR invalide: format de pass non reconnu.', 'error');
      setTimeout(() => setScannerLocked(false), 350);
      return;
    }

    if (
      parsedPayload.loanId !== pass.loanId ||
      parsedPayload.step !== 'return' ||
      parsedPayload.verifierCode !== stepCode
    ) {
      showAppNotice('QR non correspondant: ce QR ne correspond pas à la validation du retour.', 'error');
      setTimeout(() => setScannerLocked(false), 350);
      return;
    }

    setMethodValidated(true);
    setMethodSuccessMessage('QR partenaire confirmé. Tu peux passer au récapitulatif du retour.');
    setIsScannerOpen(false);
  };

  const validateCode = () => {
    if (!ensureReturnConditionExists()) {
      return;
    }

    if (!isBorrower) {
      return;
    }

    const normalized = partnerCode.trim().toUpperCase();
    if (!normalized) {
      showAppNotice('Code requis: saisis le code partenaire pour continuer.', 'warning');
      return;
    }

    if (normalized !== stepCode) {
      setMethodValidated(false);
      setMethodSuccessMessage(null);
      showAppNotice('Code invalide: le code saisi ne correspond pas à cette étape de retour.', 'error');
      return;
    }

    setMethodValidated(true);
    setMethodSuccessMessage('Code partenaire confirmé. Tu peux passer au récapitulatif du retour.');
  };

  const continueToRecap = () => {
    if (!ensureReturnConditionExists()) {
      return;
    }

    if (!isBorrower) {
      return;
    }

    if (!methodValidated || !returnChecked) {
      setContinueHint('Valide la méthode choisie puis confirme le retour de l’objet pour continuer.');
      return;
    }

    setContinueHint(null);
    router.push({ pathname: '/proof/return-review/[loanId]', params: { loanId, as: 'borrower' } });
  };

  const saveLenderComment = () => {
    const normalized = lenderComment.trim();
    if (!normalized) {
      showAppNotice('Commentaire requis: ajoute un commentaire avant de l’enregistrer.', 'warning');
      return;
    }

    upsertTrustExchangeComment({
      sourceKey: `lender-return-${loanId}`,
      authorName: PROFILE_USER.firstName,
      targetUserName: loan.otherUserName,
      loanObjectName: loan.objectName,
      comment: normalized,
      timeLabel: 'Maintenant',
    });

    setLenderCommentSaved(true);
    showAppNotice('Commentaire enregistré pour le profil confiance.', 'success');
  };

  const conditionLabel = returnCondition ? getReturnConditionLabel(loanId) : 'État non renseigné';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: background }]} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
        <ThemedView style={styles.container}>
          <ScrollView
            contentContainerStyle={[styles.content, { paddingBottom: Math.max(24, insets.bottom + 12) }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            automaticallyAdjustKeyboardInsets
            contentInsetAdjustmentBehavior="always">
            <Card style={styles.card}>
              <ThemedText type="title">Validation du retour</ThemedText>
              <ThemedText style={{ color: mutedText }}>
                {loan.objectName} avec {loan.otherUserName}
              </ThemedText>
              <View style={styles.conditionRow}>
                <ThemedText style={{ color: mutedText, fontSize: 12 }}>État de l’objet au retour</ThemedText>
                {isLender ? (
                  <View style={styles.conditionOptionsRow}>
                    {(
                      [
                        { value: 'conforme', label: 'Conforme' },
                        { value: 'partiel', label: 'Partiel' },
                        { value: 'abime', label: 'Abîmé' },
                      ] as const
                    ).map((option) => (
                      <Pressable
                        key={option.value}
                        onPress={() => updateReturnCondition(option.value)}
                        style={[
                          styles.conditionOption,
                          {
                            borderColor: returnCondition === option.value ? tint : border,
                            backgroundColor: returnCondition === option.value ? `${tint}18` : surface,
                          },
                        ]}>
                        <ThemedText
                          type="defaultSemiBold"
                          style={{ color: returnCondition === option.value ? tint : text, fontSize: 12 }}>
                          {option.label}
                        </ThemedText>
                      </Pressable>
                    ))}
                  </View>
                ) : (
                  <View style={[styles.conditionDisplay, { borderColor: border, backgroundColor: surface }]}>
                    <ThemedText type="defaultSemiBold">{conditionLabel}</ThemedText>
                  </View>
                )}
              </View>

              <ThemedText style={{ color: mutedText, fontSize: 12 }}>
                {isBorrower
                  ? 'Choisis une méthode et vérifie les informations avant validation finale.'
                  : 'Partage ensuite le QR ou le code à l’emprunteur pour sa validation.'}
              </ThemedText>
              {isBorrower && methodValidated ? (
                <View style={[styles.successInline, { borderColor: `${tint}66`, backgroundColor: `${tint}16` }]}>
                  <MaterialIcons name="check-circle" size={16} color={tint} />
                  <ThemedText style={{ color: text, fontSize: 13 }}>
                    Méthode validée. Coche “J’ai bien rendu l’objet” pour continuer.
                  </ThemedText>
                </View>
              ) : null}
            </Card>

            {isLender ? (
              <Card style={styles.card}>
                <ThemedText type="subtitle">Mini-story en attente de validation</ThemedText>
                {pendingStoryContributions.length === 0 ? (
                  <ThemedText style={{ color: mutedText, fontSize: 12 }}>
                    Aucune contribution photo en attente pour cet échange.
                  </ThemedText>
                ) : (
                  pendingStoryContributions.map((contribution) => (
                    <View key={contribution.id} style={[styles.storyReviewCard, { borderColor: border, backgroundColor: surface }]}>
                      <View style={[styles.storyReviewPhotoWrap, { borderColor: border }]}>
                        <Image source={{ uri: contribution.photoUri }} style={styles.storyReviewPhoto} contentFit="cover" />
                      </View>
                      <View style={styles.storyReviewContentWrap}>
                        <ThemedText type="defaultSemiBold">{contribution.authorName}</ThemedText>
                        {contribution.comment ? (
                          <ThemedText style={{ color: mutedText, fontSize: 12 }}>{contribution.comment}</ThemedText>
                        ) : (
                          <ThemedText style={{ color: mutedText, fontSize: 12 }}>Pas de commentaire</ThemedText>
                        )}
                        <View style={styles.storyReviewActionsRow}>
                          <Button
                            label="Valider"
                            variant="secondary"
                            style={styles.storyActionButton}
                            onPress={() => {
                              approveStoryContribution(contribution.id);
                              setRefreshKey((current) => current + 1);
                            }}
                          />
                          <Button
                            label="Refuser"
                            variant="secondary"
                            style={styles.storyActionButton}
                            onPress={() => {
                              rejectStoryContribution(contribution.id);
                              setRefreshKey((current) => current + 1);
                            }}
                          />
                        </View>
                      </View>
                    </View>
                  ))
                )}
              </Card>
            ) : null}

            <Card style={styles.card}>
              <View style={styles.methodRow}>
                <Pressable
                  onPress={() => setMethod('qr')}
                  style={[
                    styles.methodButton,
                    {
                      borderColor: method === 'qr' ? tint : border,
                      backgroundColor: method === 'qr' ? `${tint}18` : surface,
                    },
                  ]}>
                  <ThemedText type="defaultSemiBold" style={{ color: method === 'qr' ? tint : text }}>
                    QR
                  </ThemedText>
                </Pressable>
                <Pressable
                  onPress={() => setMethod('code')}
                  style={[
                    styles.methodButton,
                    {
                      borderColor: method === 'code' ? tint : border,
                      backgroundColor: method === 'code' ? `${tint}18` : surface,
                    },
                  ]}>
                  <ThemedText type="defaultSemiBold" style={{ color: method === 'code' ? tint : text }}>
                    Code
                  </ThemedText>
                </Pressable>
              </View>

              {method === 'qr' ? (
                <>
                  {isLender ? (
                    <View style={[styles.qrWrap, { borderColor: border, backgroundColor: surface }]}>
                      <QRCode value={qrPayload} size={196} color={text} backgroundColor={surface} />
                    </View>
                  ) : null}
                  <ThemedText style={{ color: mutedText, fontSize: 12 }}>
                    {isBorrower
                      ? 'Scanne le QR du prêteur pour ouvrir le récapitulatif du retour.'
                      : 'Montre ce QR à l’emprunteur pour qu’il confirme le retour.'}
                  </ThemedText>
                  {isBorrower ? (
                    <>
                      <Button
                        label={isScannerOpen ? 'Fermer scan' : methodValidated ? 'Scanner à nouveau' : 'Scanner QR partenaire'}
                        variant="secondary"
                        disabled={!hasReturnCondition}
                        onPress={isScannerOpen ? closeScanner : openScanner}
                      />
                      {!hasReturnCondition ? (
                        <ThemedText style={{ color: mutedText, fontSize: 12 }}>
                          En attente: l’état du retour doit être renseigné par le prêteur.
                        </ThemedText>
                      ) : null}
                      {isScannerOpen ? (
                        <View style={[styles.scannerWrap, { borderColor: border }]}>
                          <CameraView
                            style={styles.scannerPreview}
                            facing="back"
                            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                            onBarcodeScanned={handleQrScanned}
                          />
                        </View>
                      ) : null}
                    </>
                  ) : null}
                </>
              ) : (
                <>
                  {isLender ? (
                    <View style={styles.codeDisplayRow}>
                      <MaterialIcons name="password" size={15} color={tint} />
                      <ThemedText type="defaultSemiBold">Code retour: {stepCode}</ThemedText>
                    </View>
                  ) : null}
                  <ThemedText style={{ color: mutedText, fontSize: 12 }}>
                    {isBorrower
                      ? 'Saisis le code transmis par le prêteur.'
                      : 'Transmets ce code à l’emprunteur pour sa validation.'}
                  </ThemedText>
                  {isBorrower ? (
                    <>
                      <TextInput
                        value={partnerCode}
                        onChangeText={(nextValue) => {
                          setPartnerCode(nextValue.replace(/[^a-zA-Z0-9]/g, '').toUpperCase());
                          setMethodValidated(false);
                        }}
                        placeholder="Code partenaire"
                        placeholderTextColor={mutedText}
                        autoCapitalize="characters"
                        autoCorrect={false}
                        maxLength={8}
                        editable={hasReturnCondition}
                        style={[styles.codeInput, { borderColor: border, color: text, backgroundColor: surface }]}
                      />
                      <Button label="Valider le code" variant="secondary" disabled={!hasReturnCondition} onPress={validateCode} />
                      {!hasReturnCondition ? (
                        <ThemedText style={{ color: mutedText, fontSize: 12 }}>
                          En attente: l’état du retour doit être renseigné par le prêteur.
                        </ThemedText>
                      ) : null}
                    </>
                  ) : null}
                </>
              )}

              {isBorrower ? (
                <>
                  <View style={styles.validationRow}>
                    <MaterialIcons
                      name={methodValidated ? 'check-circle' : 'radio-button-unchecked'}
                      size={16}
                      color={methodValidated ? tint : mutedText}
                    />
                    <ThemedText style={{ color: mutedText, fontSize: 12 }}>
                      {methodValidated
                        ? `Méthode ${method === 'qr' ? 'QR' : 'code'} validée`
                        : `Méthode ${method === 'qr' ? 'QR' : 'code'} en attente`}
                    </ThemedText>
                  </View>

                  {methodSuccessMessage ? (
                    <View style={[styles.successInline, { borderColor: `${tint}66`, backgroundColor: `${tint}16` }]}>
                      <MaterialIcons name="check-circle" size={16} color={tint} />
                      <ThemedText style={{ color: text, fontSize: 13 }}>{methodSuccessMessage}</ThemedText>
                    </View>
                  ) : null}
                </>
              ) : null}
            </Card>

            {isBorrower ? (
              <Card style={styles.card}>
                <Pressable
                  style={[styles.checkItem, { borderColor: border, backgroundColor: surface }]}
                  onPress={() => {
                    setReturnChecked((value) => !value);
                    setContinueHint(null);
                  }}
                  accessibilityRole="checkbox"
                  accessibilityLabel="Retour objet effectué"
                  accessibilityState={{ checked: returnChecked }}>
                  <View style={styles.checkLeft}>
                    <MaterialIcons
                      name={returnChecked ? 'check-circle' : 'radio-button-unchecked'}
                      size={18}
                      color={returnChecked ? tint : mutedText}
                    />
                    <ThemedText>J’ai bien rendu l’objet</ThemedText>
                  </View>
                </Pressable>

                <Button
                  label="Continuer vers le récapitulatif"
                  onPress={continueToRecap}
                  disabled={!hasReturnCondition}
                />

                {continueHint ? (
                  <View style={[styles.warningInline, { borderColor: border, backgroundColor: surface }]}>
                    <MaterialIcons name="info-outline" size={16} color={mutedText} />
                    <ThemedText style={{ color: mutedText, fontSize: 12 }}>{continueHint}</ThemedText>
                  </View>
                ) : null}
              </Card>
            ) : (
              <Card style={styles.card}>
                <ThemedText type="defaultSemiBold">Confirmation emprunteur</ThemedText>
                <ThemedText style={{ color: mutedText, fontSize: 12 }}>
                  {borrowerAccepted
                    ? '✅ L’emprunteur a confirmé le récapitulatif du retour.'
                    : 'En attente de la validation finale par l’emprunteur.'}
                </ThemedText>
                <Button
                  label={borrowerAccepted ? 'Accepté par l’emprunteur' : 'En attente de validation'}
                  variant="secondary"
                  disabled
                />

                <View style={styles.lenderCommentWrap}>
                  <ThemedText type="defaultSemiBold">Commentaire du prêteur</ThemedText>
                  <TextInput
                    value={lenderComment}
                    onChangeText={(nextValue) => {
                      setLenderComment(nextValue);
                      if (lenderCommentSaved) {
                        setLenderCommentSaved(false);
                      }
                    }}
                    placeholder="Ex: retour dans les temps, objet rendu propre"
                    placeholderTextColor={mutedText}
                    multiline
                    style={[styles.lenderCommentInput, { borderColor: border, color: text, backgroundColor: surface }]}
                  />
                  <Button label="Enregistrer le commentaire" variant="secondary" onPress={saveLenderComment} />
                  {lenderCommentSaved ? (
                    <ThemedText style={{ color: mutedText, fontSize: 12 }}>
                      Commentaire ajouté à la confiance locale.
                    </ThemedText>
                  ) : null}
                </View>
              </Card>
            )}
          </ScrollView>
        </ThemedView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardContainer: {
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
  conditionRow: {
    gap: 8,
  },
  conditionOptionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  conditionOption: {
    flex: 1,
    minHeight: 40,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  conditionDisplay: {
    borderWidth: 1,
    borderRadius: Radius.md,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  methodRow: {
    flexDirection: 'row',
    gap: 8,
  },
  methodButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrWrap: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerWrap: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  scannerPreview: {
    width: '100%',
    minHeight: 280,
  },
  codeDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  codeInput: {
    borderWidth: 1,
    borderRadius: Radius.md,
    minHeight: 44,
    paddingHorizontal: 12,
    fontSize: 15,
  },
  validationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  successInline: {
    borderWidth: 1,
    borderRadius: Radius.md,
    minHeight: 40,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  warningInline: {
    borderWidth: 1,
    borderRadius: Radius.md,
    minHeight: 40,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  storyReviewCard: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: 8,
    flexDirection: 'row',
    gap: 8,
  },
  storyReviewPhotoWrap: {
    width: 84,
    height: 84,
    borderRadius: Radius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  storyReviewPhoto: {
    width: '100%',
    height: '100%',
  },
  storyReviewContentWrap: {
    flex: 1,
    gap: 4,
  },
  storyReviewActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  storyActionButton: {
    flex: 1,
    minHeight: 36,
  },
  lenderCommentWrap: {
    gap: 8,
    marginTop: 4,
  },
  lenderCommentInput: {
    borderWidth: 1,
    borderRadius: Radius.md,
    minHeight: 92,
    textAlignVertical: 'top',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
});
