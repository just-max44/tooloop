import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Radius } from '@/constants/theme';
import { getExchangePassByLoanId, INBOX_LOANS } from '@/data/mock';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getStepQrPayload, getStepVerifierCode, isExchangeQrPayload } from '@/stores/proof/pass-auth';
import {
    formatReturnDateLabel,
    getPickupReturnDateISO,
    isBorrowerPickupAccepted,
    setPickupReturnDateISO,
} from '@/stores/proof/return-timing-store';

type ValidationMethod = 'qr' | 'code';
type SimulatedRole = 'lender' | 'borrower';

function getDefaultReturnDate() {
  const nextDay = new Date();
  nextDay.setDate(nextDay.getDate() + 1);
  nextDay.setHours(12, 0, 0, 0);
  return nextDay;
}

function toISODate(dateValue: Date) {
  const normalized = new Date(dateValue);
  normalized.setHours(12, 0, 0, 0);
  return normalized.toISOString();
}

export default function PickupProofScreen() {
  const router = useRouter();
  const { loanId } = useLocalSearchParams<{ loanId: string }>();
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
  const [pickupChecked, setPickupChecked] = useState(false);
  const [methodSuccessMessage, setMethodSuccessMessage] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const lastScanRef = useRef<{ data: string; at: number }>({ data: '', at: 0 });

  const loan = useMemo(() => INBOX_LOANS.find((item) => item.id === loanId), [loanId]);
  const pass = useMemo(() => (loanId ? getExchangePassByLoanId(loanId) : undefined), [loanId]);
  const initialRole: SimulatedRole = loan?.direction === 'outgoing' ? 'lender' : 'borrower';
  const [simulatedRole, setSimulatedRole] = useState<SimulatedRole>(initialRole);
  const isBorrower = simulatedRole === 'borrower';
  const isLender = simulatedRole === 'lender';

  const [returnDateISO, setReturnDateISOState] = useState<string | null>(() =>
    loanId ? getPickupReturnDateISO(loanId) : null
  );
  const [dateDraft, setDateDraft] = useState<Date>(() =>
    returnDateISO ? new Date(returnDateISO) : getDefaultReturnDate()
  );

  const borrowerAccepted = loanId ? isBorrowerPickupAccepted(loanId) : false;
  const stepCode = useMemo(() => (pass ? getStepVerifierCode(pass.codeSeed, 'pickup') : ''), [pass]);
  const qrPayload = useMemo(() => (pass ? JSON.stringify(getStepQrPayload(pass, 'pickup')) : ''), [pass]);

  useFocusEffect(
    useCallback(() => {
      setRefreshKey((current) => current + 1);
      if (loanId) {
        const existingDateISO = getPickupReturnDateISO(loanId);
        setReturnDateISOState(existingDateISO);
        if (existingDateISO) {
          setDateDraft(new Date(existingDateISO));
        }
      }
      setSimulatedRole(loan?.direction === 'outgoing' ? 'lender' : 'borrower');
      setMethodValidated(false);
      setMethodSuccessMessage(null);
      setPickupChecked(false);
    }, [loan?.direction, loanId])
  );

  void refreshKey;

  if (!loan || !pass || !loanId) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: background }]} edges={['top']}>
        <ThemedView style={styles.container}>
          <Card style={styles.card}>
            <ThemedText type="subtitle">Validation prêt indisponible</ThemedText>
            <ThemedText style={{ color: mutedText }}>Cet échange n’est pas accessible.</ThemedText>
            <Button label="Retour Pass" onPress={() => router.push('/(tabs)/inbox')} />
          </Card>
        </ThemedView>
      </SafeAreaView>
    );
  }

  const hasReturnDate = !!returnDateISO;

  const ensureReturnDateExists = () => {
    if (hasReturnDate) {
      return true;
    }

    Alert.alert(
      'Date de retour requise',
      isLender
        ? 'Renseigne une date de retour avec le calendrier avant de continuer.'
        : 'Le prêteur doit d’abord renseigner la date de retour prévue.'
    );
    return false;
  };

  const onCalendarChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }

    if (event.type === 'dismissed' || !selectedDate) {
      return;
    }

    setDateDraft(selectedDate);
    const nextISODate = toISODate(selectedDate);
    setReturnDateISOState(nextISODate);
    setPickupReturnDateISO(loanId, nextISODate);
  };

  const openScanner = async () => {
    if (!ensureReturnDateExists()) {
      return;
    }

    if (!isBorrower) {
      return;
    }

    if (Platform.OS === 'web') {
      Alert.alert('Scan indisponible', 'Le scan caméra est disponible sur iOS et Android.');
      return;
    }

    if (!cameraPermission?.granted) {
      const permissionResponse = await requestCameraPermission();
      if (!permissionResponse.granted) {
        Alert.alert('Autorisation requise', 'Active l’accès caméra pour scanner le QR partenaire.');
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
      Alert.alert('QR invalide', 'Le QR scanné n’est pas un pass Tooloop valide.');
      setTimeout(() => setScannerLocked(false), 350);
      return;
    }

    if (!isExchangeQrPayload(parsedPayload)) {
      Alert.alert('QR invalide', 'Format de pass non reconnu.');
      setTimeout(() => setScannerLocked(false), 350);
      return;
    }

    if (
      parsedPayload.loanId !== pass.loanId ||
      parsedPayload.step !== 'pickup' ||
      parsedPayload.verifierCode !== stepCode
    ) {
      Alert.alert('QR non correspondant', 'Ce QR ne correspond pas à la validation du prêt.');
      setTimeout(() => setScannerLocked(false), 350);
      return;
    }

    setMethodValidated(true);
    setMethodSuccessMessage('QR partenaire confirmé. Tu peux passer au récapitulatif.');
    setIsScannerOpen(false);
  };

  const validateCode = () => {
    if (!ensureReturnDateExists()) {
      return;
    }

    if (!isBorrower) {
      return;
    }

    const normalized = partnerCode.trim().toUpperCase();
    if (!normalized) {
      Alert.alert('Code requis', 'Saisis le code partenaire pour continuer.');
      return;
    }

    if (normalized !== stepCode) {
      setMethodValidated(false);
      setMethodSuccessMessage(null);
      Alert.alert('Code invalide', 'Le code saisi ne correspond pas à cette étape de prêt.');
      return;
    }

    setMethodValidated(true);
    setMethodSuccessMessage('Code partenaire confirmé. Tu peux passer au récapitulatif.');
  };

  const continueToRecap = () => {
    if (!ensureReturnDateExists()) {
      return;
    }

    if (!isBorrower) {
      return;
    }

    if (!methodValidated || !pickupChecked) {
      Alert.alert('Étapes manquantes', 'Valide la méthode choisie puis confirme la remise de l’objet.');
      return;
    }

    router.push({ pathname: '/proof/pickup-review/[loanId]', params: { loanId, as: 'borrower' } });
  };

  const dateLabel = hasReturnDate && returnDateISO ? formatReturnDateLabel(returnDateISO) : 'Date non renseignée';

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
              <ThemedText type="title">Validation du prêt</ThemedText>
              <ThemedText style={{ color: mutedText }}>
                {loan.objectName} avec {loan.otherUserName}
              </ThemedText>
              <View style={styles.roleSwitchRow}>
                <Pressable
                  onPress={() => {
                    setSimulatedRole('lender');
                    setMethodValidated(false);
                    setMethodSuccessMessage(null);
                    setPickupChecked(false);
                  }}
                  style={[
                    styles.roleSwitchButton,
                    {
                      borderColor: simulatedRole === 'lender' ? tint : border,
                      backgroundColor: simulatedRole === 'lender' ? `${tint}18` : surface,
                    },
                  ]}>
                  <ThemedText type="defaultSemiBold" style={{ color: simulatedRole === 'lender' ? tint : text }}>
                    Mode test: Prêteur
                  </ThemedText>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setSimulatedRole('borrower');
                    setMethodValidated(false);
                    setMethodSuccessMessage(null);
                    setPickupChecked(false);
                  }}
                  style={[
                    styles.roleSwitchButton,
                    {
                      borderColor: simulatedRole === 'borrower' ? tint : border,
                      backgroundColor: simulatedRole === 'borrower' ? `${tint}18` : surface,
                    },
                  ]}>
                  <ThemedText type="defaultSemiBold" style={{ color: simulatedRole === 'borrower' ? tint : text }}>
                    Mode test: Emprunteur
                  </ThemedText>
                </Pressable>
              </View>
              <View style={styles.returnDateRow}>
                <ThemedText style={{ color: mutedText, fontSize: 12 }}>Date de retour prévue</ThemedText>
                <View style={[styles.returnDateDisplay, { borderColor: border, backgroundColor: surface }]}>
                  <ThemedText type="defaultSemiBold">{dateLabel}</ThemedText>
                </View>
                {isLender ? (
                  <Button
                    label="Choisir la date (calendrier)"
                    variant="secondary"
                    onPress={() => setShowDatePicker((current) => !current)}
                  />
                ) : (
                  <ThemedText style={{ color: mutedText, fontSize: 11 }}>
                    Date renseignée par le prêteur.
                  </ThemedText>
                )}
                {isBorrower && !hasReturnDate ? (
                  <View style={[styles.blockedHintWrap, { borderColor: border, backgroundColor: surface }]}>
                    <ThemedText type="defaultSemiBold" style={{ color: text, fontSize: 12 }}>
                      Action bloquée côté emprunteur
                    </ThemedText>
                    <ThemedText style={{ color: mutedText, fontSize: 12 }}>
                      Le prêteur doit d’abord choisir la date de retour. Tant qu’elle n’est pas définie, scan, saisie code et récap restent indisponibles.
                    </ThemedText>
                  </View>
                ) : null}
                {showDatePicker && isLender ? (
                  <DateTimePicker
                    value={dateDraft}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'inline' : 'default'}
                    minimumDate={new Date()}
                    onChange={onCalendarChange}
                  />
                ) : null}
              </View>
              <ThemedText style={{ color: mutedText, fontSize: 12 }}>
                {isBorrower
                  ? 'Choisis une méthode et vérifie les informations avant validation finale.'
                  : 'Partage ensuite le QR ou le code à l’emprunteur pour sa validation.'}
              </ThemedText>
            </Card>

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
                      ? 'Scanne le QR du prêteur pour ouvrir le récapitulatif.'
                      : 'Montre ce QR à l’emprunteur pour qu’il confirme la remise.'}
                  </ThemedText>
                  {isBorrower ? (
                    <>
                      <Button
                        label={isScannerOpen ? 'Fermer scan' : methodValidated ? 'Scanner à nouveau' : 'Scanner QR partenaire'}
                        variant="secondary"
                        disabled={!hasReturnDate}
                        onPress={isScannerOpen ? closeScanner : openScanner}
                      />
                      {!hasReturnDate ? (
                        <ThemedText style={{ color: mutedText, fontSize: 12 }}>
                          En attente: la date de retour doit être définie par le prêteur.
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
                      <ThemedText type="defaultSemiBold">Code prêt: {stepCode}</ThemedText>
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
                        editable={hasReturnDate}
                        style={[styles.codeInput, { borderColor: border, color: text, backgroundColor: surface }]}
                      />
                      <Button label="Valider le code" variant="secondary" disabled={!hasReturnDate} onPress={validateCode} />
                      {!hasReturnDate ? (
                        <ThemedText style={{ color: mutedText, fontSize: 12 }}>
                          En attente: la date de retour doit être définie par le prêteur.
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
                  onPress={() => setPickupChecked((value) => !value)}
                  accessibilityRole="checkbox"
                  accessibilityLabel="Remise objet effectuée"
                  accessibilityState={{ checked: pickupChecked }}>
                  <View style={styles.checkLeft}>
                    <MaterialIcons
                      name={pickupChecked ? 'check-circle' : 'radio-button-unchecked'}
                      size={18}
                      color={pickupChecked ? tint : mutedText}
                    />
                    <ThemedText>J’ai bien reçu l’objet</ThemedText>
                  </View>
                </Pressable>

                <Button
                  label="Voir le récapitulatif"
                  onPress={continueToRecap}
                  disabled={!methodValidated || !pickupChecked || !hasReturnDate}
                />
              </Card>
            ) : (
              <Card style={styles.card}>
                <ThemedText type="defaultSemiBold">Confirmation emprunteur</ThemedText>
                <ThemedText style={{ color: mutedText, fontSize: 12 }}>
                  {borrowerAccepted
                    ? '✅ L’emprunteur a confirmé le récapitulatif de remise.'
                    : 'En attente de la validation finale par l’emprunteur.'}
                </ThemedText>
                <Button
                  label={borrowerAccepted ? 'Accepté par l’emprunteur' : 'En attente de validation'}
                  variant="secondary"
                  disabled
                />
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
  roleSwitchRow: {
    flexDirection: 'row',
    gap: 8,
  },
  roleSwitchButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  returnDateRow: {
    gap: 8,
  },
  returnDateDisplay: {
    borderWidth: 1,
    borderRadius: Radius.md,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  blockedHintWrap: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 4,
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
  checkItem: {
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 44,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  checkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
