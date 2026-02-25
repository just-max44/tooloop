import {
    MY_ITEMS,
    createListing,
    removeListingRemote,
    updateListingRemote,
    useBackendDataVersion,
    type MyListing,
} from '@/lib/backend/data';

export function useListings() {
  useBackendDataVersion();
  return MY_ITEMS;
}

export function getListingById(listingId: string) {
  return MY_ITEMS.find((item) => item.id === listingId);
}

export async function addListing(input: Omit<MyListing, 'id'>) {
  return createListing(input);
}

export async function updateListing(listingId: string, patch: Partial<Omit<MyListing, 'id'>>) {
  await updateListingRemote(listingId, patch);
}

export async function removeListing(listingId: string) {
  await removeListingRemote(listingId);
}
