type SnapshotShape = {
  profileUser: { firstName: string; lastName: string; photoUri: string };
  discoverObjects: {
    id: string;
    title: string;
    description: string;
    imageUrl: string;
    distanceKm: number;
    ownerUserId?: string;
    ownerName: string;
    responseTime: string;
    isPopular: boolean;
    isFree: boolean;
    category: 'Bricolage' | 'Jardin' | 'Cuisine' | 'Fête' | 'Sport' | 'Autre';
    trustScore: number;
    loopsCompleted: number;
    impactKgCo2: number;
  }[];
  personalizedSuggestions: { id: string; objectId: string; reason: string }[];
  inboxLoans: { id: string; objectName: string; otherUserName: string; direction: 'incoming' | 'outgoing'; state: 'pending' | 'accepted' | 'completed' | 'refused'; dueText: string }[];
  profileStats: { rating: number; reviews: number; objects: number; loans: number };
  trustProfilePhotos: Record<string, string>;
  myItems: unknown[];
  pastPublications: unknown[];
  trustProfile: {
    level: string;
    trustScore: number;
    nextLevelAt: number;
    loopsValidated: number;
    exchangeRate: number;
    activeWeeks: number;
    storyContributionsApproved: number;
    noIncidentMonths: number;
    onTimeReturnRate: number;
    responseRate: number;
  };
  trustProofs: { id: string; label: string; value: string }[];
  trustExchangeComments: unknown[];
  exchangePasses: unknown[];
  exchangeChatMessages: unknown[];
  loanProofStateByLoanId: Record<string, unknown>;
  objectStories: unknown[];
  collectiveChallenges: unknown[];
  neighborhoodPulse: { activeNeighbors: number; loopsThisWeek: number; co2SavedKgThisWeek: number };
  successTags: { id: string; label: string; conditionType: 'exchange_rate' | 'completed_loans' | 'on_time_return_rate' | 'story_contrib_approved' | 'active_weeks'; threshold: number; description: string; isHidden: boolean }[];
  userSuccesses: string[];
};

function makeSnapshot(discoverObjects: SnapshotShape['discoverObjects']): SnapshotShape {
  return {
    profileUser: { firstName: 'Marc', lastName: 'Martin', photoUri: '' },
    discoverObjects,
    personalizedSuggestions: [],
    inboxLoans: [],
    profileStats: { rating: 5, reviews: 0, objects: 0, loans: 0 },
    trustProfilePhotos: {},
    myItems: [],
    pastPublications: [],
    trustProfile: {
      level: 'Voisin fiable',
      trustScore: 0,
      nextLevelAt: 100,
      loopsValidated: 0,
      exchangeRate: 0,
      activeWeeks: 0,
      storyContributionsApproved: 0,
      noIncidentMonths: 0,
      onTimeReturnRate: 0,
      responseRate: 0,
    },
    trustProofs: [],
    trustExchangeComments: [],
    exchangePasses: [],
    exchangeChatMessages: [],
    loanProofStateByLoanId: {},
    objectStories: [],
    collectiveChallenges: [],
    neighborhoodPulse: { activeNeighbors: 0, loopsThisWeek: 0, co2SavedKgThisWeek: 0 },
    successTags: [],
    userSuccesses: [],
  };
}

describe('listings visibility integration (custom backend)', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env.EXPO_PUBLIC_BACKEND_PROVIDER = 'custom';
    process.env.EXPO_PUBLIC_CUSTOM_API_BASE_URL = 'https://api.test.local';
  });

  it('shows Paul listing in Marc discover feed after publication refresh', async () => {
    const apiRequestMock = jest.fn();

    apiRequestMock.mockResolvedValueOnce({ id: 'listing-paul-1' });
    apiRequestMock.mockResolvedValueOnce(
      makeSnapshot([
        {
          id: 'listing-paul-1',
          title: 'Perceuse Bosch',
          description: 'Disponible ce week-end',
          imageUrl: 'https://cdn.example/perceuse.jpg',
          distanceKm: 1.2,
          ownerUserId: 'user-paul',
          ownerName: 'Paul',
          responseTime: 'Réponse rapide',
          isPopular: false,
          isFree: true,
          category: 'Bricolage',
          trustScore: 0,
          loopsCompleted: 0,
          impactKgCo2: 0,
        },
      ])
    );

    jest.doMock('@/lib/backend/custom-api', () => ({
      apiRequest: (...args: unknown[]) => apiRequestMock(...args),
      getAccessToken: jest.fn(async () => 'test-access-token'),
    }));

    const backendData = await import('../lib/backend/data');

    await new Promise((resolve) => setTimeout(resolve, 0));

    await backendData.createListing({
      publicationMode: 'loan',
      title: 'Perceuse Bosch',
      description: 'Disponible ce week-end',
      category: 'Bricolage',
      photoUri: 'https://cdn.example/perceuse.jpg',
      requiresDeposit: false,
    });

    expect(apiRequestMock).toHaveBeenCalledWith('/v1/data/listings', expect.objectContaining({ method: 'POST' }));
    expect(apiRequestMock).toHaveBeenCalledWith('/v1/data/snapshot');

    expect(
      backendData.getDiscoverObjects().some(
        (item: { id: string; ownerName: string; title: string }) => item.id === 'listing-paul-1' && item.ownerName === 'Paul' && item.title === 'Perceuse Bosch'
      )
    ).toBe(true);
  });
});