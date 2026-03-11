import { createStore, useStore } from 'zustand';

import type {
  CollectiveChallenge,
  DiscoverObject,
  ExchangeChatMessage,
  ExchangePass,
  LoanPreview,
  LoanProofState,
  MyListing,
  ObjectStory,
  PastPublication,
  PersonalizedSuggestion,
  ProfileUser,
  TrustExchangeComment,
} from '@/lib/backend/data';

export interface BackendState {
  discoverObjects: DiscoverObject[];
  personalizedSuggestions: PersonalizedSuggestion[];
  inboxLoans: LoanPreview[];
  profileStats: { rating: number; reviews: number; objects: number; loans: number };
  profileUser: ProfileUser;
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
  objectStories: ObjectStory[];
  collectiveChallenges: CollectiveChallenge[];
  neighborhoodPulse: {
    activeNeighbors: number;
    loopsThisWeek: number;
    co2SavedKgThisWeek: number;
  };
  loanProofStateByLoanId: Record<string, LoanProofState>;
}

const INITIAL_STATE: BackendState = {
  discoverObjects: [],
  personalizedSuggestions: [],
  inboxLoans: [],
  profileStats: { rating: 0, reviews: 0, objects: 0, loans: 0 },
  profileUser: { firstName: 'Utilisateur', lastName: 'Tooloop', photoUri: '' },
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
  trustProofs: [
    { id: 'proof-exchange-rate', label: "Taux d\u2019\u00e9change", value: '0%' },
    { id: 'proof-loops', label: 'Pr\u00eats valid\u00e9s', value: '0' },
    { id: 'proof-on-time', label: 'Retours \u00e0 temps', value: '0%' },
  ],
  trustExchangeComments: [],
  exchangePasses: [],
  exchangeChatMessages: [],
  objectStories: [],
  collectiveChallenges: [],
  neighborhoodPulse: {
    activeNeighbors: 0,
    loopsThisWeek: 0,
    co2SavedKgThisWeek: 0,
  },
  loanProofStateByLoanId: {},
};

export const backendStore = createStore<BackendState>()(() => ({ ...INITIAL_STATE }));

export function resetBackendStore() {
  backendStore.setState({ ...INITIAL_STATE });
}

export function useBackendStore<T>(selector: (state: BackendState) => T): T {
  return useStore(backendStore, selector);
}
