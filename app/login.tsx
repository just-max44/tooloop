import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LEGAL_ROUTES } from '@/constants/legal';
import { Radius } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { signInWithEmailPassword, signUpWithEmailPassword, useAuthSession } from '@/lib/backend/auth';
import { showAppNotice } from '@/stores/app-notice-store';

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
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

  const background = useThemeColor({}, 'background');
  const surface = useThemeColor({}, 'surface');
  const mutedText = useThemeColor({}, 'mutedText');
  const text = useThemeColor({}, 'text');
  const tint = useThemeColor({}, 'tint');
  const border = useThemeColor({}, 'border');
  const danger = useThemeColor({}, 'danger');

  const { session, isLoading, isBackendConfigured } = useAuthSession();
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

  const connectWithEmail = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();

    if (!normalizedEmail || !normalizedPassword) {
      showAppNotice('Saisis ton email et ton mot de passe.', 'warning');
      return;
    }

    setIsEmailSignInLoading(true);
    try {
      await signInWithEmailPassword(normalizedEmail, normalizedPassword);
      showAppNotice('Connexion email réussie.', 'success');
      router.replace('/(tabs)');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Connexion email impossible.';
      showAppNotice(message, 'error');
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
      showAppNotice('Saisis nom, prénom, email et mot de passe pour créer le compte.', 'warning');
      return;
    }

    if (normalizedPassword !== normalizedConfirmPassword) {
      showAppNotice('La confirmation du mot de passe ne correspond pas.', 'warning');
      return;
    }

    setIsEmailSignUpLoading(true);
    try {
      await signUpWithEmailPassword(normalizedEmail, normalizedPassword, normalizedFirstName, normalizedLastName);
      showAppNotice('Compte créé. Tu peux te connecter avec email/mot de passe.', 'success');
      setAuthMode('signin');
      setPassword('');
      setConfirmPassword('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Création de compte impossible.';
      showAppNotice(message, 'error');
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
            <Card style={styles.card}>
              <View style={[styles.logoCircle, { backgroundColor: `${tint}22` }]}>
                <MaterialIcons name="handyman" size={30} color={tint} />
              </View>

              <ThemedText type="title">{authMode === 'signin' ? 'Connexion Tooloop' : 'Créer un compte'}</ThemedText>
              <ThemedText style={{ color: mutedText }}>
                {authMode === 'signin'
                  ? 'Connecte-toi pour publier, échanger et valider tes prêts avec ton compte.'
                  : 'Crée ton compte pour démarrer les échanges sur Tooloop.'}
              </ThemedText>

              {!isBackendConfigured ? (
                <View style={[styles.warningBox, { borderColor: danger, backgroundColor: `${danger}18` }]}>
                  <ThemedText type="defaultSemiBold" style={{ color: danger }}>
                    Backend non configuré
                  </ThemedText>
                  <ThemedText style={{ color: mutedText, fontSize: 12 }}>
                    Ajoute EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY dans .env puis redémarre Expo.
                  </ThemedText>
                </View>
              ) : null}

              <View style={[styles.emailAuthWrap, { borderColor: border, backgroundColor: surface }]}>
                <ThemedText type="defaultSemiBold">
                  {authMode === 'signin' ? 'Connexion' : 'Inscription'}
                </ThemedText>

                {authMode === 'signup' ? (
                  <>
                    <TextInput
                      value={firstName}
                      onChangeText={setFirstName}
                      placeholder="Prénom"
                      placeholderTextColor={mutedText}
                      autoCapitalize="words"
                      autoCorrect={false}
                      style={[styles.input, { borderColor: border, backgroundColor: surface, color: text }]}
                    />
                    <TextInput
                      value={lastName}
                      onChangeText={setLastName}
                      placeholder="Nom"
                      placeholderTextColor={mutedText}
                      autoCapitalize="words"
                      autoCorrect={false}
                      style={[styles.input, { borderColor: border, backgroundColor: surface, color: text }]}
                    />
                  </>
                ) : null}

                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Email"
                  placeholderTextColor={mutedText}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={[styles.input, { borderColor: border, backgroundColor: surface, color: text }]}
                />

                <View style={[styles.passwordRow, { borderColor: border, backgroundColor: surface }]}>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Mot de passe"
                    placeholderTextColor={mutedText}
                    secureTextEntry={!isPasswordVisible}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={[styles.passwordInput, { color: text }]}
                  />
                  <Pressable
                    onPress={() => setIsPasswordVisible((current) => !current)}
                    accessibilityRole="button"
                    accessibilityLabel={isPasswordVisible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    style={styles.eyeButton}>
                    <MaterialIcons name={isPasswordVisible ? 'visibility-off' : 'visibility'} size={20} color={mutedText} />
                  </Pressable>
                </View>

                {authMode === 'signup' && passwordStrengthLabel ? (
                  <View style={styles.passwordStrengthWrap}>
                    <ThemedText style={{ color: mutedText, fontSize: 12 }}>
                      Force du mot de passe: {passwordStrengthLabel}
                    </ThemedText>
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
                                  : `${border}88`,
                            },
                          ]}
                        />
                      ))}
                    </View>
                  </View>
                ) : null}

                {authMode === 'signup' ? (
                  <View style={[styles.passwordRow, { borderColor: border, backgroundColor: surface }]}>
                    <TextInput
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="Confirmer le mot de passe"
                      placeholderTextColor={mutedText}
                      secureTextEntry={!isConfirmPasswordVisible}
                      autoCapitalize="none"
                      autoCorrect={false}
                      style={[styles.passwordInput, { color: text }]}
                    />
                    <Pressable
                      onPress={() => setIsConfirmPasswordVisible((current) => !current)}
                      accessibilityRole="button"
                      accessibilityLabel={isConfirmPasswordVisible ? 'Masquer la confirmation mot de passe' : 'Afficher la confirmation mot de passe'}
                      style={styles.eyeButton}>
                      <MaterialIcons
                        name={isConfirmPasswordVisible ? 'visibility-off' : 'visibility'}
                        size={20}
                        color={mutedText}
                      />
                    </Pressable>
                  </View>
                ) : null}

                {authMode === 'signin' ? (
                  <>
                    <Button
                      label="Se connecter"
                      variant="secondary"
                      loading={isEmailSignInLoading}
                      disabled={!isBackendConfigured || isEmailSignUpLoading}
                      onPress={connectWithEmail}
                    />
                    <Pressable
                      onPress={() => setAuthMode('signup')}
                      disabled={isEmailSignInLoading || isEmailSignUpLoading}
                      accessibilityRole="button"
                      accessibilityLabel="Ouvrir la création de compte"
                      style={styles.switchAuthModeButton}>
                      <ThemedText type="link">Créer un compte</ThemedText>
                    </Pressable>
                  </>
                ) : (
                  <>
                    <Button
                      label="Créer mon compte"
                      variant="secondary"
                      loading={isEmailSignUpLoading}
                      disabled={!isBackendConfigured || isEmailSignInLoading}
                      onPress={createEmailAccount}
                    />
                    <Pressable
                      onPress={() => setAuthMode('signin')}
                      disabled={isEmailSignInLoading || isEmailSignUpLoading}
                      accessibilityRole="button"
                      accessibilityLabel="Revenir à la connexion"
                      style={styles.switchAuthModeButton}>
                      <ThemedText type="link">J’ai déjà un compte</ThemedText>
                    </Pressable>
                  </>
                )}
              </View>

              <View style={[styles.infoBox, { borderColor: border, backgroundColor: `${tint}10` }]}>
                <ThemedText style={{ color: mutedText, fontSize: 12 }}>
                  En continuant, tu acceptes les termes d’utilisation et la politique de confidentialité.
                </ThemedText>
                <ThemedText style={{ color: mutedText, fontSize: 12 }}>
                  Tu restes connecté sur cet appareil jusqu’à déconnexion manuelle.
                </ThemedText>
                <View style={styles.legalLinksRow}>
                  <Pressable
                    onPress={() => router.push(LEGAL_ROUTES.terms as never)}
                    accessibilityRole="button"
                    accessibilityLabel="Voir les termes d’utilisation">
                    <ThemedText type="link">Voir les termes d’utilisation</ThemedText>
                  </Pressable>
                  <Pressable
                    onPress={() => router.push(LEGAL_ROUTES.privacyPolicy as never)}
                    accessibilityRole="button"
                    accessibilityLabel="Voir la politique de confidentialité">
                    <ThemedText type="link">Politique de confidentialité</ThemedText>
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
    padding: 16,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 520,
    gap: 12,
  },
  logoCircle: {
    width: 56,
    height: 56,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  warningBox: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 3,
  },
  infoBox: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 6,
  },
  legalLinksRow: {
    gap: 4,
  },
  emailAuthWrap: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    minHeight: 44,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  passwordRow: {
    borderWidth: 1,
    borderRadius: Radius.md,
    minHeight: 44,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  passwordInput: {
    flex: 1,
    minHeight: 44,
    fontSize: 14,
  },
  eyeButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passwordStrengthWrap: {
    gap: 4,
  },
  strengthBarsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  strengthBar: {
    flex: 1,
    height: 5,
    borderRadius: Radius.full,
  },
  switchAuthModeButton: {
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
