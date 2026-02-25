import { PROFILE_USER, useBackendDataVersion } from '@/lib/backend/data';

export function useProfile() {
  useBackendDataVersion();
  return {
    firstName: PROFILE_USER.firstName,
    lastName: PROFILE_USER.lastName,
    photoUri: PROFILE_USER.photoUri,
  };
}

export function updateProfilePhoto(photoUri: string) {
  const normalized = photoUri.trim();
  if (!normalized) {
    return;
  }

  PROFILE_USER.photoUri = normalized;
}
