import { backendStore, resetBackendStore, useBackendStore } from '@/stores/backend-store';

import { apiRequest, getAccessToken } from '@/lib/backend/custom-api';
import { isBackendConfigured } from '@/lib/backend/provider';

export type LoanDirection = 'incoming' | 'outgoing';
export type LoanState = 'pending' | 'accepted' | 'completed' | 'refused';

export type LoanPreview = {
  id: string;
  objectName: string;
  otherUserName: string;
  direction: LoanDirection;
  state: LoanState;
  dueText: string;
};

export type FeedbackCriterion = {
  id: string;
  label: string;
  weight: number;
};

export type ExchangePass = {
  loanId: string;
  meetupLabel: string;
  locationLabel: string;
  codeSeed: string;
  verifierCode: string;
};

export type StoryMoment = {
  id: string;
  label: string;
  detail: string;
};

export type ObjectStory = {
  objectId: string;
  totalLoans: number;
  badges: string[];
  anecdote: string;
  moments: StoryMoment[];
  photoMemories: string[];
};

export type CollectiveChallenge = {
  id: string;
  title: string;
  progress: number;
  target: number;
  badge: string;
};

export type PersonalizedSuggestion = {
  id: string;
  objectId: string;
  reason: string;
};

export type ExchangeChatMessage = {
  id: string;
  loanId: string;
  sender: 'me' | 'other' | 'system';
  text: string;
  timeLabel: string;
};

export type LoanProofState = {
  pickupValidated: boolean;
  returnValidated: boolean;
  pickupReturnDateISO: string | null;
  returnHandbackDateISO: string | null;
  lenderCondition: 'conforme' | 'partiel' | 'abime' | null;
  borrowerPickupAccepted: boolean;
  borrowerReturnAccepted: boolean;
  pickupAcceptedAtISO: string | null;
  returnAcceptedAtISO: string | null;
};

export type TrustExchangeComment = {
  id: string;
  authorName: string;
  targetUserName?: string;
  loanObjectName: string;
  comment: string;
  timeLabel: string;
};

export type SuccessConditionType =
  | 'exchange_rate'
  | 'completed_loans'
  | 'on_time_return_rate'
  | 'story_contrib_approved'
  | 'active_weeks';

export type SuccessTag = {
  id: string;
  label: string;
  conditionType: SuccessConditionType;
  threshold: number;
  description: string;
  isHidden: boolean;
};

export type ProfileUser = {
  firstName: string;
  lastName: string;
  photoUri: string;
};

export const CATEGORIES = ['Bricolage', 'Jardin', 'Cuisine', 'Fête', 'Sport', 'Autre'] as const;

export type MyListing = {
  id: string;
  publicationMode: 'loan' | 'request';
  title: string;
  description: string;
  photoUri?: string;
  category: (typeof CATEGORIES)[number];
  targetPeriod?: string;
  requiresDeposit?: boolean;
  linkedObjectId?: string;
};

export type PastPublication = MyListing & {
  archivedAtLabel: string;
};

export const DISCOVER_FILTERS = ['Tout', ...CATEGORIES] as const;

export type DiscoverObject = {
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
  category: (typeof CATEGORIES)[number];
  trustScore: number;
  loopsCompleted: number;
  impactKgCo2: number;
};

export const FEEDBACK_CRITERIA: FeedbackCriterion[] = [
  { id: 'respect', label: 'Objet rendu en bon état', weight: 35 },
  { id: 'time', label: 'Respect des délais', weight: 30 },
  { id: 'communication', label: 'Communication claire', weight: 20 },
  { id: 'courtesy', label: 'Ã‰change agréable', weight: 15 },
];

export const FEEDBACK_IMPACT_LABELS = {
  high: 'Impact confiance élevé',
  medium: 'Impact confiance modéré',
  low: 'Impact confiance faible',
} as const;

export const LOCAL_AREA = {
  city: 'Paris',
  district: '11e arrondissement',
} as const;

export const TRUST_RANKS_BY_EXCHANGE_RATE = [
  { id: 'r1', label: 'Ã‰tincelle de boucle', minRate: 0 },
  { id: 'r2', label: 'Pulse de quartier', minRate: 25 },
  { id: 'r3', label: 'Ancre locale', minRate: 50 },
  { id: 'r4', label: 'Moteur collectif', minRate: 75 },
  { id: 'r5', label: 'Constellation civique', minRate: 90 },
] as const;

export const TRUST_RANKS_BY_FINALIZED_EXCHANGES = [
  { id: 'f1', label: 'Atelier ouvert', minCount: 0 },
  { id: 'f2', label: 'Cadence stable', minCount: 5 },
  { id: 'f3', label: 'Circuit maîtrisé', minCount: 15 },
  { id: 'f4', label: 'Forge de confiance', minCount: 30 },
  { id: 'f5', label: 'Phare des échanges', minCount: 50 },
] as const;

export const SUCCESS_TAGS: SuccessTag[] = [
  {
    id: 's1',
    label: 'Premier prêt validé',
    conditionType: 'completed_loans',
    threshold: 1,
    description: 'Valider un premier échange complet.',
    isHidden: false,
  },
  {
    id: 's2',
    label: '3 prêts sans incident',
    conditionType: 'completed_loans',
    threshold: 3,
    description: 'Atteindre 3 échanges finalisés.',
    isHidden: false,
  },
  {
    id: 's3',
    label: 'Réactivité locale',
    conditionType: 'exchange_rate',
    threshold: 70,
    description: 'Maintenir un bon taux dâ€™échange.',
    isHidden: false,
  },
];

let hydrationInFlight = false;

/**
 * @deprecated Use useBackendStore(s => s.someField) instead.
 * Kept temporarily for backward compatibility during migration.
 */
export function useBackendDataVersion() {
  useBackendStore((s) => s);
}

// --- State is now in @/stores/backend-store.ts ---
// Backward-compatible getters (prefer useBackendStore selectors in components)
function gs() { return backendStore.getState(); }

export function getDiscoverObjects() { return gs().discoverObjects; }
export function getPersonalizedSuggestions() { return gs().personalizedSuggestions; }
export function getInboxLoans() { return gs().inboxLoans; }
export function getProfileStats() { return gs().profileStats; }
export function getProfileUser() { return gs().profileUser; }
export function getTrustProfilePhotos() { return gs().trustProfilePhotos; }
export function getMyItems() { return gs().myItems; }
export function getPastPublications() { return gs().pastPublications; }
export function getTrustProfile() { return gs().trustProfile; }
export function getTrustProofs() { return gs().trustProofs; }
export function getTrustExchangeComments_data() { return gs().trustExchangeComments; }
export function getExchangePasses() { return gs().exchangePasses; }
export function getExchangeChatMessagesAll() { return gs().exchangeChatMessages; }
export function getObjectStories_data() { return gs().objectStories; }
export function getCollectiveChallenges() { return gs().collectiveChallenges; }
export function getNeighborhoodPulse() { return gs().neighborhoodPulse; }
export function getLoanProofStateMap() { return gs().loanProofStateByLoanId; }

type BackendSnapshotPayload = {
  profileUser: ProfileUser;
  discoverObjects: DiscoverObject[];
  personalizedSuggestions: PersonalizedSuggestion[];
  inboxLoans: LoanPreview[];
  profileStats: { rating: number; reviews: number; objects: number; loans: number };
  trustProfilePhotos: Record<string, string>;
  myItems: MyListing[];
  pastPublications: PastPublication[];
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
  trustExchangeComments: TrustExchangeComment[];
  exchangePasses: ExchangePass[];
  exchangeChatMessages: ExchangeChatMessage[];
  loanProofStateByLoanId: Record<string, LoanProofState>;
  objectStories: ObjectStory[];
  collectiveChallenges: CollectiveChallenge[];
  neighborhoodPulse: { activeNeighbors: number; loopsThisWeek: number; co2SavedKgThisWeek: number };
  successTags: SuccessTag[];
  userSuccesses: string[];
};

function applySnapshot(payload: BackendSnapshotPayload) {
  backendStore.setState({
    profileUser: payload.profileUser,
    discoverObjects: payload.discoverObjects,
    personalizedSuggestions: payload.personalizedSuggestions,
    inboxLoans: payload.inboxLoans,
    profileStats: payload.profileStats,
    trustProfilePhotos: payload.trustProfilePhotos,
    myItems: payload.myItems,
    pastPublications: payload.pastPublications,
    trustProfile: payload.trustProfile,
    trustProofs: payload.trustProofs,
    trustExchangeComments: payload.trustExchangeComments,
    exchangePasses: payload.exchangePasses,
    exchangeChatMessages: payload.exchangeChatMessages,
    loanProofStateByLoanId: payload.loanProofStateByLoanId ?? {},
    objectStories: payload.objectStories,
    collectiveChallenges: payload.collectiveChallenges,
    neighborhoodPulse: payload.neighborhoodPulse,
  });

  if (payload.successTags.length > 0) {
    SUCCESS_TAGS.splice(0, SUCCESS_TAGS.length, ...payload.successTags);
  }
}

function resetBackendSnapshots() {
  resetBackendStore();
}

export async function hydrateBackendData() {
  if (hydrationInFlight) {
    return;
  }

  hydrationInFlight = true;

  try {
    if (!isBackendConfigured) {
      resetBackendSnapshots();
      return;
    }

    const token = await getAccessToken();
    if (!token) {
      resetBackendSnapshots();
      return;
    }

    const payload = await apiRequest<BackendSnapshotPayload>('/v1/data/snapshot');
    applySnapshot(payload);
  } catch (error) {
    console.error('[hydrateBackendData] silent failure:', error);
  } finally {
    hydrationInFlight = false;
  }
}

export async function refreshBackendData() {
  await hydrateBackendData();
}

const BACKEND_NOT_CONFIGURED_MESSAGE = 'Backend non configuré. Vérifie les variables backend.';

function requireConfiguredBackend() {
  if (!isBackendConfigured) {
    throw new Error(BACKEND_NOT_CONFIGURED_MESSAGE);
  }
}

export async function createListing(input: Omit<MyListing, 'id'>) {
  requireConfiguredBackend();
  const payload = await apiRequest<{ id: string }>('/v1/data/listings', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  await refreshBackendData();
  return payload;
}

export async function updateListingRemote(listingId: string, patch: Partial<Omit<MyListing, 'id'>>) {
  requireConfiguredBackend();
  await apiRequest(`/v1/data/listings/${listingId}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
  await refreshBackendData();
}

export async function removeListingRemote(listingId: string) {
  requireConfiguredBackend();
  await apiRequest(`/v1/data/listings/${listingId}`, {
    method: 'DELETE',
  });
  await refreshBackendData();
}

export async function requestLoanRemote(input: {
  objectId: string;
  lenderUserId: string;
  dueText: string;
}) {
  requireConfiguredBackend();
  const payload = await apiRequest<{ id: string }>('/v1/data/loans', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  await refreshBackendData();
  return payload;
}

export async function setLoanStateRemote(loanId: string, state: LoanState) {
  requireConfiguredBackend();
  await apiRequest(`/v1/data/loans/${loanId}/state`, {
    method: 'PATCH',
    body: JSON.stringify({ state }),
  });
  await refreshBackendData();
}

export async function sendExchangeMessageRemote(loanId: string, text: string) {
  const normalized = text.trim();
  if (!normalized) {
    return;
  }

  requireConfiguredBackend();
  await apiRequest(`/v1/data/loans/${loanId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ text: normalized }),
  });
  await refreshBackendData();
}

export function getExchangePassByLoanId(loanId: string) {
  return gs().exchangePasses.find((item) => item.loanId === loanId);
}

export function getObjectStoryById(objectId: string) {
  return gs().objectStories.find((item) => item.objectId === objectId);
}

function getDefaultLoanProofState(): LoanProofState {
  return {
    pickupValidated: false,
    returnValidated: false,
    pickupReturnDateISO: null,
    returnHandbackDateISO: null,
    lenderCondition: null,
    borrowerPickupAccepted: false,
    borrowerReturnAccepted: false,
    pickupAcceptedAtISO: null,
    returnAcceptedAtISO: null,
  };
}

export function getLoanProofState(loanId: string): LoanProofState {
  const map = gs().loanProofStateByLoanId;
  if (!map[loanId]) {
    const def = getDefaultLoanProofState();
    backendStore.setState((s) => ({
      loanProofStateByLoanId: { ...s.loanProofStateByLoanId, [loanId]: def },
    }));
    return def;
  }

  return map[loanId];
}

export function setLoanProofStateLocal(loanId: string, patch: Partial<LoanProofState>) {
  const current = getLoanProofState(loanId);
  backendStore.setState((s) => ({
    loanProofStateByLoanId: {
      ...s.loanProofStateByLoanId,
      [loanId]: { ...current, ...patch },
    },
  }));
}

export async function persistLoanProofStateRemote(loanId: string, patch: Partial<LoanProofState>) {
  requireConfiguredBackend();
  await apiRequest(`/v1/data/loans/${loanId}/proof-state`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
  await refreshBackendData();
}

export function getExchangeMessagesByLoanId(loanId: string) {
  return gs().exchangeChatMessages.filter((item) => item.loanId === loanId);
}

export async function loadOlderMessages(loanId: string, beforeId?: string): Promise<{ messages: ExchangeChatMessage[]; hasMore: boolean }> {
  requireConfiguredBackend();
  const params = new URLSearchParams({ limit: '50' });
  if (beforeId) {
    params.set('before', beforeId);
  }
  const result = await apiRequest<{ messages: ExchangeChatMessage[]; hasMore: boolean }>(
    `/v1/data/loans/${loanId}/messages?${params.toString()}`
  );
  return result;
}

export function getObjectImageByLoanObjectName(objectName: string) {
  return gs().discoverObjects.find((item) => item.title.trim().toLowerCase() === objectName.trim().toLowerCase())?.imageUrl;
}

export function getObjectByLoanObjectName(objectName: string) {
  return gs().discoverObjects.find((item) => item.title.trim().toLowerCase() === objectName.trim().toLowerCase());
}

export function getProfilePhotoUriByName(userName: string) {
  return gs().trustProfilePhotos[userName] ?? gs().profileUser.photoUri;
}

export function getTrustRankByExchangeRate(exchangeRate: number) {
  return [...TRUST_RANKS_BY_EXCHANGE_RATE]
    .sort((a, b) => b.minRate - a.minRate)
    .find((item) => exchangeRate >= item.minRate);
}

export function getTrustRankByFinalizedExchanges(finalizedExchanges: number) {
  return [...TRUST_RANKS_BY_FINALIZED_EXCHANGES]
    .sort((a, b) => b.minCount - a.minCount)
    .find((item) => finalizedExchanges >= item.minCount);
}

export function getSuccessTagsStatus(profile = gs().trustProfile) {
  return SUCCESS_TAGS.map((tag) => {
    let progressPercent = 0;

    if (tag.conditionType === 'exchange_rate') {
      progressPercent = Math.min(100, Math.round((profile.exchangeRate / tag.threshold) * 100));
    } else if (tag.conditionType === 'completed_loans') {
      progressPercent = Math.min(100, Math.round((profile.loopsValidated / tag.threshold) * 100));
    } else if (tag.conditionType === 'on_time_return_rate') {
      progressPercent = Math.min(100, Math.round((profile.onTimeReturnRate / tag.threshold) * 100));
    } else if (tag.conditionType === 'story_contrib_approved') {
      progressPercent = Math.min(100, Math.round((profile.storyContributionsApproved / tag.threshold) * 100));
    } else if (tag.conditionType === 'active_weeks') {
      progressPercent = Math.min(100, Math.round((profile.activeWeeks / tag.threshold) * 100));
    }

    return {
      ...tag,
      unlocked: progressPercent >= 100,
      progressPercent,
    };
  });
}
