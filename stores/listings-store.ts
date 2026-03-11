import {
  createListing,
  getMyItems,
  removeListingRemote,
  updateListingRemote,
  type MyListing,
} from '@/lib/backend/data';
import { useBackendStore } from '@/stores/backend-store';
import { showAppErrorNotice } from '@/stores/app-notice-store';

type ListingMutationAction = 'create' | 'update' | 'remove';

const LISTING_MUTATION_FALLBACK_MESSAGE: Record<ListingMutationAction, string> = {
  create: 'Impossible de créer la publication.',
  update: 'Impossible de mettre à jour la publication.',
  remove: 'Impossible de supprimer la publication.',
};

function toListingStoreError(error: unknown, action: ListingMutationAction): Error {
  if (error instanceof Error) {
    return error;
  }

  return new Error(LISTING_MUTATION_FALLBACK_MESSAGE[action]);
}

async function runListingMutation<T>(action: ListingMutationAction, mutation: () => Promise<T>): Promise<T> {
  try {
    return await mutation();
  } catch (error) {
    const normalizedError = toListingStoreError(error, action);
    showAppErrorNotice(normalizedError, LISTING_MUTATION_FALLBACK_MESSAGE[action]);
    throw normalizedError;
  }
}

export function useListings() {
  return useBackendStore((s) => s.myItems);
}

export function getListingById(listingId: string) {
  return getMyItems().find((item) => item.id === listingId);
}

export async function addListing(input: Omit<MyListing, 'id'>) {
  return runListingMutation('create', () => createListing(input));
}

export async function updateListing(listingId: string, patch: Partial<Omit<MyListing, 'id'>>) {
  await runListingMutation('update', () => updateListingRemote(listingId, patch));
}

export async function removeListing(listingId: string) {
  await runListingMutation('remove', () => removeListingRemote(listingId));
}
