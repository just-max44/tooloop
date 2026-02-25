import { useSyncExternalStore } from 'react';

import { getSupabaseClient, isBackendConfigured } from '@/lib/backend/supabase';

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
  { id: 'courtesy', label: 'Échange agréable', weight: 15 },
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
  { id: 'r1', label: 'Étincelle de boucle', minRate: 0 },
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
    description: 'Maintenir un bon taux d’échange.',
    isHidden: false,
  },
];

const listeners = new Set<() => void>();
let dataVersion = 0;
let hydrationInFlight = false;

function emit() {
  dataVersion += 1;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return dataVersion;
}

export function useBackendDataVersion() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export let DISCOVER_OBJECTS: DiscoverObject[] = [];
export let PERSONALIZED_SUGGESTIONS: PersonalizedSuggestion[] = [];
export let INBOX_LOANS: LoanPreview[] = [];
export let PROFILE_STATS = { rating: 0, reviews: 0, objects: 0, loans: 0 };
export let PROFILE_USER: ProfileUser = { firstName: 'Utilisateur', lastName: 'Tooloop', photoUri: '' };
export let TRUST_PROFILE_PHOTOS: Record<string, string> = {};
export let MY_ITEMS: MyListing[] = [];
export let PAST_PUBLICATIONS: PastPublication[] = [];
export let TRUST_PROFILE = {
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
};
export let TRUST_PROOFS = [
  { id: 'proof-exchange-rate', label: 'Taux d’échange', value: '0%' },
  { id: 'proof-loops', label: 'Prêts validés', value: '0' },
  { id: 'proof-on-time', label: 'Retours à temps', value: '0%' },
];
export let TRUST_EXCHANGE_COMMENTS: TrustExchangeComment[] = [];
export let EXCHANGE_PASSES: ExchangePass[] = [];
export let EXCHANGE_CHAT_MESSAGES: ExchangeChatMessage[] = [];
export let OBJECT_STORIES: ObjectStory[] = [];
export let COLLECTIVE_CHALLENGES: CollectiveChallenge[] = [];
export let NEIGHBORHOOD_PULSE = {
  activeNeighbors: 0,
  loopsThisWeek: 0,
  co2SavedKgThisWeek: 0,
};

function toCategory(value: string | null | undefined): (typeof CATEGORIES)[number] {
  if (value && CATEGORIES.includes(value as (typeof CATEGORIES)[number])) {
    return value as (typeof CATEGORIES)[number];
  }
  return 'Autre';
}

function formatLabel(dateValue: string) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return 'récemment';
  }
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}

async function getCurrentUserContext() {
  if (!isBackendConfigured) {
    return null;
  }

  const client = getSupabaseClient();
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) {
    return null;
  }

  const metadata = data.user.user_metadata as Record<string, unknown> | undefined;
  const firstName = typeof metadata?.first_name === 'string' ? metadata.first_name.trim() : 'Utilisateur';
  const lastName = typeof metadata?.last_name === 'string' ? metadata.last_name.trim() : 'Tooloop';
  const avatarUrl = typeof metadata?.avatar_url === 'string' ? metadata.avatar_url : '';

  await client.from('users').upsert(
    {
      id: data.user.id,
      first_name: firstName || 'Utilisateur',
      last_name: lastName || 'Tooloop',
      avatar_url: avatarUrl || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );

  return {
    authUserId: data.user.id,
    firstName: firstName || 'Utilisateur',
    lastName: lastName || 'Tooloop',
    avatarUrl,
  };
}

export async function hydrateBackendData() {
  if (hydrationInFlight) {
    return;
  }

  hydrationInFlight = true;

  try {
    if (!isBackendConfigured) {
      emit();
      return;
    }

    const client = getSupabaseClient();
    const current = await getCurrentUserContext();
    if (!current) {
      emit();
      return;
    }

    PROFILE_USER = {
      firstName: current.firstName,
      lastName: current.lastName,
      photoUri: current.avatarUrl,
    };

    const [
      objectsResult,
      loansResult,
      passesResult,
      messagesResult,
      listingsResult,
      trustProfileResult,
      trustCommentsResult,
      storyRowsResult,
      storyMomentsResult,
      storyPhotosResult,
      successTagsResult,
      userSuccessesResult,
      feedbacksResult,
    ] = await Promise.all([
      client.from('objects').select('*').eq('is_active', true).order('created_at', { ascending: false }),
      client
        .from('loans')
        .select('*')
        .or(`lender_user_id.eq.${current.authUserId},borrower_user_id.eq.${current.authUserId}`)
        .order('created_at', { ascending: false }),
      client.from('exchange_passes').select('*'),
      client.from('exchange_messages').select('*').order('created_at', { ascending: true }),
      client
        .from('listings')
        .select('*')
        .eq('user_id', current.authUserId)
        .order('created_at', { ascending: false }),
      client.from('trust_profiles').select('*').eq('user_id', current.authUserId).maybeSingle(),
      client.from('trust_exchange_comments').select('*').order('created_at', { ascending: false }),
      client.from('object_stories').select('*'),
      client.from('object_story_moments').select('*').order('position', { ascending: true }),
      client.from('object_story_photos').select('*').order('position', { ascending: true }),
      client.from('success_tags').select('*'),
      client.from('user_successes').select('*').eq('user_id', current.authUserId),
      client.from('feedbacks').select('*').eq('target_user_id', current.authUserId),
    ]);

    const objectRows = objectsResult.data ?? [];
    const ownerIds = Array.from(new Set(objectRows.map((item) => item.owner_user_id).filter(Boolean)));
    const userRowsResult = ownerIds.length > 0
      ? await client.from('users').select('id, display_name, avatar_url').in('id', ownerIds)
      : { data: [] as { id: string; display_name: string; avatar_url: string | null }[] };

    const usersById = new Map<string, { display_name: string; avatar_url: string | null }>();
    (userRowsResult.data ?? []).forEach((userItem) => {
      usersById.set(userItem.id, { display_name: userItem.display_name, avatar_url: userItem.avatar_url });
    });

    DISCOVER_OBJECTS = objectRows.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      imageUrl: item.image_url ?? '',
      distanceKm: Number(item.distance_km ?? 0),
      ownerName: usersById.get(item.owner_user_id)?.display_name ?? 'Voisin',
      responseTime: item.response_time_label ?? '—',
      isPopular: Number(item.loops_completed_snapshot ?? 0) >= 10,
      isFree: Boolean(item.is_free),
      category: toCategory(item.category),
      trustScore: Number(item.trust_score_snapshot ?? 0),
      loopsCompleted: Number(item.loops_completed_snapshot ?? 0),
      impactKgCo2: Number(item.impact_kg_co2_snapshot ?? 0),
    }));

    PERSONALIZED_SUGGESTIONS = DISCOVER_OBJECTS.slice(0, 3).map((item, index) => ({
      id: `suggestion-${item.id}`,
      objectId: item.id,
      reason: index === 0 ? 'Très proche de chez toi' : index === 1 ? 'Souvent demandé cette semaine' : 'Bon score de confiance',
    }));

    const loansRows = loansResult.data ?? [];
    const loanUserIds = Array.from(
      new Set(loansRows.flatMap((loanItem) => [loanItem.lender_user_id, loanItem.borrower_user_id]).filter(Boolean))
    );

    const loanUsersResult = loanUserIds.length > 0
      ? await client.from('users').select('id, display_name').in('id', loanUserIds)
      : { data: [] as { id: string; display_name: string }[] };

    const loanUsersById = new Map<string, string>();
    (loanUsersResult.data ?? []).forEach((userItem) => {
      loanUsersById.set(userItem.id, userItem.display_name);
    });

    const objectsById = new Map(DISCOVER_OBJECTS.map((item) => [item.id, item]));

    INBOX_LOANS = loansRows.map((loanItem) => {
      const isIncoming = loanItem.borrower_user_id === current.authUserId;
      const otherUserId = isIncoming ? loanItem.lender_user_id : loanItem.borrower_user_id;
      return {
        id: loanItem.id,
        objectName: objectsById.get(loanItem.object_id)?.title ?? 'Objet',
        otherUserName: loanUsersById.get(otherUserId) ?? 'Voisin',
        direction: isIncoming ? 'incoming' : 'outgoing',
        state: loanItem.state,
        dueText: loanItem.due_text ?? 'Mise à jour récente',
      } satisfies LoanPreview;
    });

    EXCHANGE_PASSES = (passesResult.data ?? []).map((item) => ({
      loanId: item.loan_id,
      meetupLabel: item.meetup_label,
      locationLabel: item.location_label,
      codeSeed: item.code_seed,
      verifierCode: item.verifier_code,
    }));

    EXCHANGE_CHAT_MESSAGES = (messagesResult.data ?? []).map((item) => ({
      id: item.id,
      loanId: item.loan_id,
      sender: item.sender_kind,
      text: item.text,
      timeLabel: item.time_label ?? formatLabel(item.created_at),
    }));

    const listings = listingsResult.data ?? [];
    MY_ITEMS = listings
      .filter((item) => !item.archived_at)
      .map((item) => ({
        id: item.id,
        publicationMode: item.publication_mode,
        title: item.title,
        description: item.description,
        category: toCategory(item.category),
        targetPeriod: item.target_period ?? undefined,
        requiresDeposit: item.requires_deposit ?? undefined,
        linkedObjectId: item.object_id ?? undefined,
      }));

    PAST_PUBLICATIONS = listings
      .filter((item) => Boolean(item.archived_at))
      .map((item) => ({
        id: item.id,
        publicationMode: item.publication_mode,
        title: item.title,
        description: item.description,
        category: toCategory(item.category),
        targetPeriod: item.target_period ?? undefined,
        requiresDeposit: item.requires_deposit ?? undefined,
        linkedObjectId: item.object_id ?? undefined,
        archivedAtLabel: item.archived_at ? formatLabel(item.archived_at) : 'Archivée',
      }));

    const trust = trustProfileResult.data;
    if (trust) {
      TRUST_PROFILE = {
        level: trust.trust_score >= 80 ? 'Voisin fiable' : trust.trust_score >= 50 ? 'Voisin actif' : 'Nouveau membre',
        trustScore: trust.trust_score,
        nextLevelAt: 100,
        loopsValidated: trust.loops_validated,
        exchangeRate: trust.exchange_rate,
        activeWeeks: trust.active_weeks,
        storyContributionsApproved: trust.story_contributions_approved,
        noIncidentMonths: 0,
        onTimeReturnRate: trust.on_time_return_rate,
        responseRate: trust.response_rate,
      };
    }

    TRUST_PROOFS = [
      { id: 'proof-exchange-rate', label: 'Taux d’échange', value: `${TRUST_PROFILE.exchangeRate}%` },
      { id: 'proof-loops', label: 'Prêts validés', value: `${TRUST_PROFILE.loopsValidated}` },
      { id: 'proof-on-time', label: 'Retours à temps', value: `${TRUST_PROFILE.onTimeReturnRate}%` },
    ];

    TRUST_EXCHANGE_COMMENTS = (trustCommentsResult.data ?? []).map((item) => ({
      id: item.id,
      authorName: item.author_name_snapshot,
      targetUserName: item.target_name_snapshot ?? undefined,
      loanObjectName: item.loan_object_name_snapshot,
      comment: item.comment,
      timeLabel: item.time_label ?? formatLabel(item.created_at),
    }));

    PROFILE_STATS = {
      rating: 5,
      reviews: (feedbacksResult.data ?? []).length,
      objects: DISCOVER_OBJECTS.filter((item) => item.ownerName === `${PROFILE_USER.firstName} ${PROFILE_USER.lastName}`).length,
      loans: INBOX_LOANS.length,
    };

    TRUST_PROFILE_PHOTOS = {
      [`${PROFILE_USER.firstName} ${PROFILE_USER.lastName}`]: PROFILE_USER.photoUri,
    };
    DISCOVER_OBJECTS.forEach((item) => {
      const owner = usersById.get(objectRows.find((row) => row.id === item.id)?.owner_user_id ?? '');
      if (owner?.avatar_url) {
        TRUST_PROFILE_PHOTOS[item.ownerName] = owner.avatar_url;
      }
    });

    const storyRows = storyRowsResult.data ?? [];
    const storyMoments = storyMomentsResult.data ?? [];
    const storyPhotos = storyPhotosResult.data ?? [];

    OBJECT_STORIES = storyRows.map((storyRow) => {
      const moments = storyMoments
        .filter((item) => item.object_story_id === storyRow.id)
        .map((item) => ({ id: item.id, label: item.label, detail: item.detail }));
      const photos = storyPhotos
        .filter((item) => item.object_story_id === storyRow.id)
        .map((item) => item.photo_url);
      return {
        objectId: storyRow.object_id,
        totalLoans: storyRow.total_loans,
        badges: [],
        anecdote: storyRow.anecdote ?? '',
        moments,
        photoMemories: photos,
      };
    });

    const completedCount = INBOX_LOANS.filter((item) => item.state === 'completed').length;
    const thisWeekCount = INBOX_LOANS.filter((item) => item.state === 'accepted' || item.state === 'completed').length;
    NEIGHBORHOOD_PULSE = {
      activeNeighbors: loanUserIds.length,
      loopsThisWeek: thisWeekCount,
      co2SavedKgThisWeek: completedCount * 3,
    };

    COLLECTIVE_CHALLENGES = [
      {
        id: 'challenge-loops',
        title: 'Boucles validées du quartier',
        progress: Math.max(thisWeekCount, 0),
        target: 50,
        badge: 'Pulse local',
      },
      {
        id: 'challenge-impact',
        title: 'Impact CO2 cumulé',
        progress: Math.max(completedCount * 3, 0),
        target: 200,
        badge: 'Impact vert',
      },
    ];

    const successTags = (successTagsResult.data ?? []).map((item) => ({
      id: item.id,
      label: item.label,
      conditionType: item.condition_type,
      threshold: item.threshold,
      description: item.description,
      isHidden: item.is_hidden,
    })) as SuccessTag[];

    if (successTags.length > 0) {
      SUCCESS_TAGS.splice(0, SUCCESS_TAGS.length, ...successTags);
    }

    const userSuccesses = userSuccessesResult.data ?? [];
    SUCCESS_TAGS.forEach((tag) => {
      const match = userSuccesses.find((item) => item.success_tag_id === tag.id);
      if (!match) {
        return;
      }
      void match;
    });

    emit();
  } catch {
    emit();
  } finally {
    hydrationInFlight = false;
  }
}

void hydrateBackendData();

export async function refreshBackendData() {
  await hydrateBackendData();
}

export async function createListing(input: Omit<MyListing, 'id'>) {
  if (!isBackendConfigured) {
    return null;
  }

  const current = await getCurrentUserContext();
  if (!current) {
    return null;
  }

  const client = getSupabaseClient();
  const { data } = await client
    .from('listings')
    .insert({
      user_id: current.authUserId,
      object_id: input.linkedObjectId ?? null,
      publication_mode: input.publicationMode,
      title: input.title,
      description: input.description,
      category: input.category,
      target_period: input.targetPeriod ?? null,
      requires_deposit: input.requiresDeposit ?? null,
    })
    .select('*')
    .single();

  await refreshBackendData();
  return data;
}

export async function updateListingRemote(listingId: string, patch: Partial<Omit<MyListing, 'id'>>) {
  if (!isBackendConfigured) {
    return;
  }

  const client = getSupabaseClient();
  await client
    .from('listings')
    .update({
      object_id: patch.linkedObjectId ?? undefined,
      publication_mode: patch.publicationMode,
      title: patch.title,
      description: patch.description,
      category: patch.category,
      target_period: patch.targetPeriod,
      requires_deposit: patch.requiresDeposit,
      updated_at: new Date().toISOString(),
    })
    .eq('id', listingId);

  await refreshBackendData();
}

export async function removeListingRemote(listingId: string) {
  if (!isBackendConfigured) {
    return;
  }

  const client = getSupabaseClient();
  await client.from('listings').delete().eq('id', listingId);
  await refreshBackendData();
}

export function getExchangePassByLoanId(loanId: string) {
  return EXCHANGE_PASSES.find((item) => item.loanId === loanId);
}

export function getObjectStoryById(objectId: string) {
  return OBJECT_STORIES.find((item) => item.objectId === objectId);
}

export function getExchangeMessagesByLoanId(loanId: string) {
  return EXCHANGE_CHAT_MESSAGES.filter((item) => item.loanId === loanId);
}

export function getObjectImageByLoanObjectName(objectName: string) {
  return DISCOVER_OBJECTS.find((item) => item.title.trim().toLowerCase() === objectName.trim().toLowerCase())?.imageUrl;
}

export function getObjectByLoanObjectName(objectName: string) {
  return DISCOVER_OBJECTS.find((item) => item.title.trim().toLowerCase() === objectName.trim().toLowerCase());
}

export function getProfilePhotoUriByName(userName: string) {
  return TRUST_PROFILE_PHOTOS[userName] ?? PROFILE_USER.photoUri;
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

export function getSuccessTagsStatus(profile = TRUST_PROFILE) {
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
