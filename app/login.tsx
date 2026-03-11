import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { LEGAL_ROUTES } from '@/constants/legal';
import { Radius, Spacing } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { signInWithEmailPassword, signUpWithEmailPassword, useAuthSession } from '@/lib/backend/auth';
import { refreshBackendData } from '@/lib/backend/data';
import { showAppNotice } from '@/stores/app-notice-store';

const ERROR_MESSAGES: Record<string, string> = {
  'Invalid payload': 'Email incorrect ou mot de passe trop court (min 8 car.).',
  'Email already registered': 'Cet email est pris. Essaie de te connecter.',
  'Invalid credentials': 'Email ou mot de passe incorrect.',
  'Unauthorized': 'Session expir\u00e9e, reconnecte-toi.',
  'Trop de tentatives, r\u00e9essayez dans 15 minutes.': 'Trop de tentatives, r\u00e9essaie dans 15 minutes.',
};

function friendlyError(raw: string, fallback: string): string {
  return ERROR_MESSAGES[raw] ?? fallback;
}

export default function LoginScreen() {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [isEmailSignInLoading, setIsEmailSignInLoading] = useState(false);
  const [isEmailSignUpLoading, setIsEmailSignUpLoading] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [backendStatus, setBackendStatus] = useState<'idle' | 'checking' | 'ok' | 'down'>('idle');

  const background = useThemeColor({}, 'background');
  const surfaceRaised = useThemeColor({}, 'surfaceRaised');
  const tint = useThemeColor({}, 'tint');
  const border = useThemeColor({}, 'border');
  const danger = useThemeColor({}, 'danger');
  const text = useThemeColor({}, 'text');

  const { session, isLoading, isBackendConfigured } = useAuthSession();
  const backendUrl = process.env.EXPO_PUBLIC_CUSTOM_API_BASE_URL?.trim() ?? '';
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);
  const passwordStrengthScore = [password.length >= 8, hasLowercase, hasUppercase, hasDigit, hasSymbol].filter(Boolean)
    .length;
  const passwordStrengthLabel =
    password.length === 0
      ? null
      : passwordStrengthScore <= 2
        ? 'Faible'
        : passwordStrengthScore <= 4
          ? 'Moyen'
          : 'Fort';

  useEffect(() => {
    if (!isLoading && session) {
      router.replace('/(tabs)');
    }
  }, [isLoading, router, session]);

  useEffect(() => {
    if (!isBackendConfigured || !backendUrl) {
      setBackendStatus('idle');
      return;
    }

    let cancelled = false;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const run = async () => {
      setBackendStatus('checking');
      try {
        const response = await fetch(`${backendUrl}/health`, { signal: controller.signal });
        if (!cancelled) {
          setBackendStatus(response.ok ? 'ok' : 'down');
        }
      } catch {
        if (!cancelled) {
          setBackendStatus('down');
        }
      } finally {
        clearTimeout(timeoutId);
      }
    };

    void run();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [backendUrl, isBackendConfigured]);

  const connectWithEmail = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();

    if (!normalizedEmail || !normalizedPassword) {
      showAppNotice('Saisis ton email et ton mot de passe.', 'warning');
      return;
    }

    if (backendStatus === 'down') {
      showAppNotice('Serveur inaccessible. Vérifie ton URL API et démarre le backend.', 'error');
      return;
    }

    setIsEmailSignInLoading(true);
    try {
      await signInWithEmailPassword(normalizedEmail, normalizedPassword);
      await refreshBackendData().catch(() => {});
      showAppNotice('Connexion r\u00e9ussie.', 'success');
      router.replace('/(tabs)');
    } catch (error) {
      const raw = error instanceof Error ? error.message : '';
      showAppNotice(friendlyError(raw, 'Connexion impossible.'), 'error');
    } finally {
      setIsEmailSignInLoading(false);
    }
  };

  const createEmailAccount = async () => {
    const normalizedFirstName = firstName.trim();
    const normalizedLastName = lastName.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();
    const normalizedConfirmPassword = confirmPassword.trim();

    if (!normalizedFirstName || !normalizedLastName || !normalizedEmail || !normalizedPassword || !normalizedConfirmPassword) {
      showAppNotice('Remplis tous les champs pour cr\u00e9er ton compte.', 'warning');
      return;
    }

    if (normalizedPassword !== normalizedConfirmPassword) {
      showAppNotice('La confirmation du mot de passe ne correspond pas.', 'warning');
      return;
    }

    if (backendStatus === 'down') {
      showAppNotice('Serveur inaccessible. Vérifie ton URL API et démarre le backend.', 'error');
      return;
    }

    setIsEmailSignUpLoading(true);
    try {
      await signUpWithEmailPassword(normalizedEmail, normalizedPassword, normalizedFirstName, normalizedLastName);
      showAppNotice('Compte cr\u00e9\u00e9 ! Tu peux te connecter.', 'success');
      setAuthMode('signin');
      setPassword('');
      setConfirmPassword('');
    } catch (error) {
      const raw = error instanceof Error ? error.message : '';
      showAppNotice(friendlyError(raw, 'Cr\u00e9ation de compte impossible.'), 'error');
    } finally {
      setIsEmailSignUpLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: background }]} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardWrap}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
        <ThemedView style={styles.container}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <View style={[styles.introPanel, { backgroundColor: surfaceRaised, borderColor: `${border}AA` }]}>
              <View style={styles.introTopRow}>
                <View style={[styles.logoCircle, { backgroundColor: `${tint}1A` }]}>
                  <MaterialIcons name="handyman" size={28} color={tint} />
                </View>
                <ThemedText type="label" style={{ color: tint }}>
                  Tooloop
                </ThemedText>
              </View>

              <ThemedText type="title" style={styles.introTitle}>
                Prête. Emprunte. Boucle locale.
              </ThemedText>

              <ThemedText type="caption" style={styles.introCaption}>
                Une expérience plus simple pour partager des objets entre voisins en toute confiance.
              </ThemedText>

              <View style={styles.introBadgesRow}>
                <View style={[styles.introBadge, { backgroundColor: `${tint}12`, borderColor: `${tint}36` }]}>
                  <MaterialIcons name="verified-user" size={14} color={tint} />
                  <ThemedText type="caption" style={{ color: text }}>
                    Profil fiable
                  </ThemedText>
                </View>
                <View style={[styles.introBadge, { backgroundColor: `${tint}12`, borderColor: `${tint}36` }]}>
                  <MaterialIcons name="sync" size={14} color={tint} />
                  <ThemedText type="caption" style={{ color: text }}>
                    Parcours guidé
                  </ThemedText>
                </View>
              </View>
            </View>

            <Card style={styles.card}>

              <View style={styles.headerBlock}>
                <ThemedText type="title" style={styles.centered}>
                  {authMode === 'signin' ? 'Connexion' : 'Cr\u00e9er un compte'}
                </ThemedText>
                <ThemedText type="caption" style={styles.centered}>
                  {authMode === 'signin'
                    ? 'Connecte-toi pour publier, \u00e9changer et valider tes pr\u00eats.'
                    : 'Cr\u00e9e ton compte pour d\u00e9marrer sur Tooloop.'}
                </ThemedText>
              </View>

              {!isBackendConfigured ? (
                <View style={[styles.warningBox, { borderColor: `${danger}55`, backgroundColor: `${danger}10` }]}>
                  <ThemedText type="defaultSemiBold" style={{ color: danger }}>
                    Backend non configuré
                  </ThemedText>
                  <ThemedText type="caption">
                    Ajoute EXPO_PUBLIC_CUSTOM_API_BASE_URL dans `.env` puis redémarre l’app.
                  </ThemedText>
                </View>
              ) : null}

              {isBackendConfigured && backendStatus === 'down' ? (
                <View style={[styles.warningBox, { borderColor: `${danger}55`, backgroundColor: `${danger}10` }]}>
                  <ThemedText type="defaultSemiBold" style={{ color: danger }}>
                    Backend inaccessible
                  </ThemedText>
                  <ThemedText type="caption">
                    Impossible de joindre {backendUrl || 'l\'API configurée'}. Vérifie que le serveur est lancé et accessible depuis ton appareil.
                  </ThemedText>
                </View>
              ) : null}

              <View style={styles.formWrap}>
                {authMode === 'signup' ? (
                  <View style={styles.nameRow}>
                    <View style={styles.nameField}>
                      <Input
                        value={firstName}
                        onChangeText={setFirstName}
                        placeholder="Pr\u00e9nom"
                        icon="person-outline"
                        autoCapitalize="words"
                        autoCorrect={false}
                      />
                    </View>
                    <View style={styles.nameField}>
                      <Input
                        value={lastName}
                        onChangeText={setLastName}
                        placeholder="Nom"
                        autoCapitalize="words"
                        autoCorrect={false}
                      />
                    </View>
                  </View>
                ) : null}

                <Input
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Email"
                  icon="mail-outline"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <Input
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Mot de passe"
                  icon="lock-outline"
                  isPassword
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                {authMode === 'signup' && passwordStrengthLabel ? (
                  <View style={styles.passwordStrengthWrap}>
                    <ThemedText type="caption">Force : {passwordStrengthLabel}</ThemedText>
                    <View style={styles.strengthBarsRow}>
                      {[1, 2, 3].map((step) => (
                        <View
                          key={step}
                          style={[
                            styles.strengthBar,
                            {
                              backgroundColor:
                                (passwordStrengthLabel === 'Faible' && step <= 1) ||
                                (passwordStrengthLabel === 'Moyen' && step <= 2) ||
                                (passwordStrengthLabel === 'Fort' && step <= 3)
                                  ? tint
                                  : `${border}55`,
                            },
                          ]}
                        />
                      ))}
                    </View>
                  </View>
                ) : null}

                {authMode === 'signup' ? (
                  <Input
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Confirmer le mot de passe"
                    icon="lock-outline"
                    isPassword
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                ) : null}

                {authMode === 'signin' ? (
                  <>
                    <Button
                      label="Se connecter"
                      variant="primary"
                      size="lg"
                      loading={isEmailSignInLoading}
                      disabled={!isBackendConfigured || isEmailSignUpLoading}
                      onPress={connectWithEmail}
                    />
                    <Pressable
                      onPress={() => setAuthMode('signup')}
                      disabled={isEmailSignInLoading || isEmailSignUpLoading}
                      accessibilityRole="button"
                      accessibilityLabel="Ouvrir la cr\u00e9ation de compte"
                      style={styles.switchAuthModeButton}>
                      <ThemedText type="link">Cr\u00e9er un compte</ThemedText>
                    </Pressable>
                  </>
                ) : (
                  <>
                    <Button
                      label="Cr\u00e9er mon compte"
                      variant="primary"
                      size="lg"
                      loading={isEmailSignUpLoading}
                      disabled={!isBackendConfigured || isEmailSignInLoading}
                      onPress={createEmailAccount}
                    />
                    <Pressable
                      onPress={() => setAuthMode('signin')}
                      disabled={isEmailSignInLoading || isEmailSignUpLoading}
                      accessibilityRole="button"
                      accessibilityLabel="Revenir \u00e0 la connexion"
                      style={styles.switchAuthModeButton}>
                      <ThemedText type="link">J’ai d\u00e9j\u00e0 un compte</ThemedText>
                    </Pressable>
                  </>
                )}
              </View>

              <View style={[styles.infoBox, { borderColor: `${border}88`, backgroundColor: `${tint}08` }]}>
                <ThemedText type="caption" style={styles.centered}>
                  En continuant, tu acceptes nos conditions.
                </ThemedText>
                <View style={styles.legalLinksRow}>
                  <Pressable
                    onPress={() => router.push(LEGAL_ROUTES.terms as never)}
                    accessibilityRole="button"
                    accessibilityLabel="Voir les termes">
                    <ThemedText type="link" style={styles.legalLink}>Termes</ThemedText>
                  </Pressable>
                  <ThemedText type="caption"> &middot; </ThemedText>
                  <Pressable
                    onPress={() => router.push(LEGAL_ROUTES.privacyPolicy as never)}
                    accessibilityRole="button"
                    accessibilityLabel="Voir la confidentialit\u00e9">
                    <ThemedText type="link" style={styles.legalLink}>Confidentialit\u00e9</ThemedText>
                  </Pressable>
                </View>
              </View>
            </Card>
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
  keyboardWrap: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: Spacing.lg,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
    paddingVertical: Spacing.lg,
    width: '100%',
  },
  introPanel: {
    width: '100%',
    maxWidth: 480,
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  introTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  card: {
    width: '100%',
    maxWidth: 480,
    gap: Spacing.lg,
  },
  logoCircle: {
    width: 52,
    height: 52,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  introTitle: {
    fontSize: 31,
    lineHeight: 38,
  },
  introCaption: {
    fontSize: 14,
    lineHeight: 20,
  },
  introBadgesRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
    marginTop: Spacing.xs,
  },
  introBadge: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerBlock: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  centered: {
    textAlign: 'center',
  },
  warningBox: {
    borderWidth: 1,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  formWrap: {
    gap: Spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  nameField: {
    flex: 1,
  },
  passwordStrengthWrap: {
    gap: Spacing.xs,
  },
  strengthBarsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: Radius.full,
  },
  switchAuthModeButton: {
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBox: {
    borderWidth: 1,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
    alignItems: 'center',
  },
  legalLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legalLink: {
    fontSize: 13,
  },
});
