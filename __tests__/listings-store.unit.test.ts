import { addListing, getListingById, removeListing, updateListing } from '@/stores/listings-store';

const mockCreateListing = jest.fn();
const mockUpdateListingRemote = jest.fn();
const mockRemoveListingRemote = jest.fn();
const mockShowAppErrorNotice = jest.fn();

jest.mock('@/lib/backend/data', () => ({
  getMyItems: () => [
    {
      id: 'listing-1',
      publicationMode: 'loan',
      title: 'Perceuse',
      description: 'Perceuse sans fil',
      category: 'Bricolage',
    },
  ],
  createListing: (...args: unknown[]) => mockCreateListing(...args),
  updateListingRemote: (...args: unknown[]) => mockUpdateListingRemote(...args),
  removeListingRemote: (...args: unknown[]) => mockRemoveListingRemote(...args),
}));

jest.mock('@/stores/app-notice-store', () => ({
  showAppErrorNotice: (...args: unknown[]) => mockShowAppErrorNotice(...args),
}));

describe('listings-store', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns listing by id from store snapshot', () => {
    const listing = getListingById('listing-1');

    expect(listing?.title).toBe('Perceuse');
  });

  it('creates a listing successfully', async () => {
    const payload = {
      publicationMode: 'loan' as const,
      title: 'Scie sauteuse',
      description: 'Très bon état',
      category: 'Bricolage' as const,
    };

    mockCreateListing.mockResolvedValueOnce({ id: 'listing-2', ...payload });

    const result = await addListing(payload);

    expect(mockCreateListing).toHaveBeenCalledWith(payload);
    expect(result.id).toBe('listing-2');
    expect(mockShowAppErrorNotice).not.toHaveBeenCalled();
  });

  it('normalizes non-error create failures and notifies user', async () => {
    mockCreateListing.mockRejectedValueOnce('backend-down');

    await expect(
      addListing({
        publicationMode: 'loan',
        title: 'Visseuse',
        description: 'Batterie incluse',
        category: 'Bricolage',
      })
    ).rejects.toThrow('Impossible de créer la publication.');

    expect(mockShowAppErrorNotice).toHaveBeenCalledTimes(1);
    expect(mockShowAppErrorNotice).toHaveBeenCalledWith(expect.any(Error), 'Impossible de créer la publication.');
  });

  it('preserves error messages on update and sends notice', async () => {
    mockUpdateListingRemote.mockRejectedValueOnce(new Error('Conflit de version'));

    await expect(updateListing('listing-1', { title: 'Perceuse V2' })).rejects.toThrow('Conflit de version');

    expect(mockShowAppErrorNotice).toHaveBeenCalledWith(expect.any(Error), 'Impossible de mettre à jour la publication.');
  });

  it('preserves error messages on remove and sends notice', async () => {
    mockRemoveListingRemote.mockRejectedValueOnce(new Error('Suppression refusée'));

    await expect(removeListing('listing-1')).rejects.toThrow('Suppression refusée');

    expect(mockShowAppErrorNotice).toHaveBeenCalledWith(expect.any(Error), 'Impossible de supprimer la publication.');
  });
});
