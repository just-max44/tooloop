import { getAppNoticeSnapshot, hideAppNotice } from '@/stores/app-notice-store';
import { addListing } from '@/stores/listings-store';

const mockCreateListing = jest.fn();

jest.mock('@/lib/backend/data', () => ({
  MY_ITEMS: [],
  createListing: (input: unknown) => mockCreateListing(input),
  removeListingRemote: jest.fn(),
  updateListingRemote: jest.fn(),
  useBackendDataVersion: jest.fn(),
}));

describe('listings + app-notice integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    hideAppNotice();
  });

  it('does not show an error notice when listing creation succeeds', async () => {
    mockCreateListing.mockResolvedValueOnce({ id: 'listing-1' });

    await addListing({
      publicationMode: 'loan',
      title: 'Perceuse',
      description: 'Très bon état',
      category: 'Bricolage',
      photoUri: 'https://cdn/perceuse.jpg',
    });

    const notice = getAppNoticeSnapshot();
    expect(notice.visible).toBe(false);
  });

  it('shows a global error notice when listing creation fails', async () => {
    mockCreateListing.mockRejectedValueOnce(new Error('Conflit backend'));

    await expect(
      addListing({
        publicationMode: 'loan',
        title: 'Visseuse',
        description: 'Batterie incluse',
        category: 'Bricolage',
        photoUri: 'https://cdn/visseuse.jpg',
      })
    ).rejects.toThrow('Conflit backend');

    const notice = getAppNoticeSnapshot();
    expect(notice.visible).toBe(true);
    expect(notice.tone).toBe('error');
    expect(notice.message).toBe('Conflit backend');
  });
});
