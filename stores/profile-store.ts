import { useBackendStore, backendStore } from '@/stores/backend-store';

export function useProfile() {
  return useBackendStore((s) => s.profileUser);
}

export function updateProfilePhoto(photoUri: string) {
  const normalized = photoUri.trim();
  if (!normalized) {
    return;
  }

  backendStore.setState((s) => ({
    profileUser: { ...s.profileUser, photoUri: normalized },
  }));
}
