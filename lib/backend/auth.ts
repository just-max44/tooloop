import {
    customChangePasswordWithCurrentPassword,
    customDeleteCurrentAccount,
    customGetPrivateLocationPreference,
    customSendPasswordResetEmail,
    customSignInWithEmailPassword,
    customSignInWithGoogleIdToken,
    customSignInWithOAuthProvider,
    customSignOutSession,
    customSignUpWithEmailPassword,
    customUpdatePrivateLocationPreference,
    customUpdateProfilePhotoPreference,
    useCustomAuthSession,
} from '@/lib/backend/auth-custom';

export type PrivateLocationPreference = {
  city: string;
  postalCode: string;
};

export function useAuthSession() {
  return useCustomAuthSession() as {
    session: { user: { id: string; email?: string; user_metadata?: Record<string, unknown> } } | null;
    isLoading: boolean;
    isBackendConfigured: boolean;
  };
}

export async function signInWithOAuthProvider(provider: string) {
  await customSignInWithOAuthProvider(provider);
}

export async function signOutSession() {
  await customSignOutSession();
}

export async function signInWithEmailPassword(email: string, password: string) {
  await customSignInWithEmailPassword(email, password);
}

export async function signUpWithEmailPassword(email: string, password: string, firstName: string, lastName: string) {
  await customSignUpWithEmailPassword(email, password, firstName, lastName);
}

export async function signInWithGoogleIdToken(idToken: string) {
  await customSignInWithGoogleIdToken(idToken);
}

export async function sendPasswordResetEmail(email: string) {
  await customSendPasswordResetEmail(email);
}

export async function changePasswordWithCurrentPassword(currentPassword: string, newPassword: string) {
  await customChangePasswordWithCurrentPassword(currentPassword, newPassword);
}

export async function deleteCurrentAccount() {
  await customDeleteCurrentAccount();
}

export async function getPrivateLocationPreference() {
  return customGetPrivateLocationPreference();
}

export async function updatePrivateLocationPreference(input: PrivateLocationPreference) {
  await customUpdatePrivateLocationPreference(input);
}

export async function updateProfilePhotoPreference(photoUri: string) {
  await customUpdateProfilePhotoPreference(photoUri);
}
