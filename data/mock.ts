export type LoanDirection = 'incoming' | 'outgoing';
export type LoanState = 'pending' | 'accepted' | 'completed';

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

export type CommunityZone = {
  id: string;
  label: string;
  objectIds: string[];
  popularObjectIds: string[];
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

export const CATEGORIES = [
  'Bricolage',
  'Jardin',
  'Cuisine',
  'Fête',
  'Sport',
  'Autre',
] as const;

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

export const DISCOVER_OBJECTS: DiscoverObject[] = [
  {
    id: 'obj-drill-bosch',
    title: 'Perceuse Bosch',
    description: 'Perceuse performante avec jeu de mèches inclus.',
    imageUrl:
      'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=1200&q=80',
    distanceKm: 0.5,
    ownerName: 'Sophie',
    responseTime: '< 1h',
    isPopular: true,
    isFree: true,
    category: 'Bricolage',
    trustScore: 98,
    loopsCompleted: 31,
    impactKgCo2: 14,
  },
  {
    id: 'obj-raclette-8',
    title: 'Appareil à raclette 8p',
    description: 'Parfait pour soirée conviviale, spatules incluses.',
    imageUrl:
      'https://images.unsplash.com/photo-1517244683847-7456b63c5969?auto=format&fit=crop&w=1200&q=80',
    distanceKm: 1.2,
    ownerName: 'Marc',
    responseTime: '2h',
    isPopular: false,
    isFree: true,
    category: 'Cuisine',
    trustScore: 94,
    loopsCompleted: 18,
    impactKgCo2: 9,
  },
  {
    id: 'obj-ladder-telescopic',
    title: 'Échelle télescopique',
    description: 'Très stable, hauteur jusqu’à 5 mètres.',
    imageUrl:
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80',
    distanceKm: 0.3,
    ownerName: 'Elena',
    responseTime: '5 min',
    isPopular: true,
    isFree: false,
    category: 'Bricolage',
    trustScore: 99,
    loopsCompleted: 44,
    impactKgCo2: 21,
  },
];

export const NEIGHBORHOOD_PULSE = {
  activeNeighbors: 42,
  loopsThisWeek: 67,
  co2SavedKgThisWeek: 183,
} as const;

export const LOCAL_AREA = {
  city: 'Paris',
  district: '11e arrondissement',
} as const;

export const INBOX_LOANS: LoanPreview[] = [
  {
    id: 'l1',
    objectName: 'Perceuse Bosch',
    otherUserName: 'Nina',
    direction: 'incoming',
    state: 'pending',
    dueText: 'Réponse attendue aujourd’hui',
  },
  {
    id: 'l2',
    objectName: 'Raclette 8 personnes',
    otherUserName: 'Marc',
    direction: 'incoming',
    state: 'accepted',
    dueText: 'Retour prévu dans 3 jours',
  },
  {
    id: 'l4',
    objectName: 'Projecteur portable',
    otherUserName: 'Chloé',
    direction: 'incoming',
    state: 'completed',
    dueText: 'Emprunt terminé avant-hier',
  },
  {
    id: 'l5',
    objectName: 'Kit visseuse 18V',
    otherUserName: 'Yassine',
    direction: 'outgoing',
    state: 'pending',
    dueText: 'En attente de confirmation',
  },
  {
    id: 'l6',
    objectName: 'Tente 2 places',
    otherUserName: 'Lina',
    direction: 'outgoing',
    state: 'accepted',
    dueText: 'Retour prévu lundi',
  },
  {
    id: 'l3',
    objectName: 'Échelle télescopique',
    otherUserName: 'Elena',
    direction: 'outgoing',
    state: 'completed',
    dueText: 'Prêt terminé hier',
  },
];

export const PROFILE_BADGES = ['Premier prêt validé', 'Voisin actif', 'Prêteur de confiance'] as const;

export const PROFILE_STATS = {
  rating: 4.8,
  reviews: 17,
  objects: 12,
  loans: 23,
};

export const MY_ITEMS = [
  { id: 'o1', name: 'Perceuse Bosch', category: 'Bricolage', available: true },
  { id: 'o2', name: 'Appareil à raclette', category: 'Cuisine', available: false },
  { id: 'o3', name: 'Kit jardinage', category: 'Jardin', available: true },
] as const;

export const TRUST_PROFILE = {
  level: 'Voisin fiable',
  trustScore: 96,
  nextLevelAt: 100,
  loopsValidated: 23,
  noIncidentMonths: 8,
  onTimeReturnRate: 94,
  responseRate: 92,
} as const;

export const TRUST_PROOFS = [
  { id: 'tp1', label: 'Identité vérifiée', value: 'Confirmée' },
  { id: 'tp2', label: 'Objets entretenus', value: 'Très bon état' },
  { id: 'tp3', label: 'Retours à temps', value: '94%' },
] as const;

export const TRUST_COMMUNITY_SIGNALS = [
  {
    id: 'cs1',
    title: 'Sophie t’a recommandé',
    subtitle: '“Objet récupéré nickel, retour exact.”',
  },
  {
    id: 'cs2',
    title: 'Marc a accepté 4 prêts de suite',
    subtitle: 'Temps de réponse moyen: 25 min',
  },
  {
    id: 'cs3',
    title: 'Quartier actif ce soir',
    subtitle: '11 échanges en cours autour de toi',
  },
] as const;

export const FEEDBACK_CRITERIA: FeedbackCriterion[] = [
  { id: 'on_time', label: 'Retour à l’heure', weight: 2 },
  { id: 'clean_item', label: 'Objet rendu propre', weight: 2 },
  { id: 'good_comms', label: 'Communication fluide', weight: 1 },
  { id: 'careful_use', label: 'Utilisation soignée', weight: 2 },
  { id: 'friendly_meet', label: 'Rencontre agréable', weight: 1 },
];

export const FEEDBACK_IMPACT_LABELS = {
  high: 'Excellent impact confiance',
  medium: 'Impact confiance positif',
  low: 'Impact confiance limité',
} as const;

export const EXCHANGE_PASSES: ExchangePass[] = [
  {
    loanId: 'l1',
    meetupLabel: 'Aujourd’hui, 19:10',
    locationLabel: 'Place du Marché · Entrée nord',
    codeSeed: 'TL-L1-AB91-19H10-MARCHE',
    verifierCode: 'AB91',
  },
  {
    loanId: 'l2',
    meetupLabel: 'Demain, 18:40',
    locationLabel: 'Bibliothèque de quartier · Hall',
    codeSeed: 'TL-L2-HK37-18H40-BIBLIO',
    verifierCode: 'HK37',
  },
  {
    loanId: 'l3',
    meetupLabel: 'Terminé · preuve archivée',
    locationLabel: 'Square central · Banc côté école',
    codeSeed: 'TL-L3-QT55-ARCHIVE-SQUARE',
    verifierCode: 'QT55',
  },
  {
    loanId: 'l4',
    meetupLabel: 'Terminé · preuve archivée',
    locationLabel: 'Mairie annexe · sortie principale',
    codeSeed: 'TL-L4-RP20-ARCHIVE-MAIRIE',
    verifierCode: 'RP20',
  },
  {
    loanId: 'l6',
    meetupLabel: 'Samedi, 10:30',
    locationLabel: 'Parc du centre · kiosque',
    codeSeed: 'TL-L6-XD73-10H30-PARC',
    verifierCode: 'XD73',
  },
];

export const EXCHANGE_CHAT_MESSAGES: ExchangeChatMessage[] = [
  {
    id: 'm-l1-1',
    loanId: 'l1',
    sender: 'other',
    text: 'Hello ! Je peux te répondre en fin de journée.',
    timeLabel: '18:02',
  },
  {
    id: 'm-l1-2',
    loanId: 'l1',
    sender: 'me',
    text: 'Parfait, je suis dispo après 19h.',
    timeLabel: '18:06',
  },
  {
    id: 'm-l2-1',
    loanId: 'l2',
    sender: 'system',
    text: 'Prêt accepté · pass d’échange disponible.',
    timeLabel: 'Aujourd’hui',
  },
  {
    id: 'm-l2-2',
    loanId: 'l2',
    sender: 'other',
    text: 'On se retrouve demain à 18h40 à la bibliothèque ?',
    timeLabel: '16:21',
  },
  {
    id: 'm-l2-3',
    loanId: 'l2',
    sender: 'me',
    text: 'Oui, entrée hall principal c’est parfait 👍',
    timeLabel: '16:24',
  },
  {
    id: 'm-l3-1',
    loanId: 'l3',
    sender: 'system',
    text: 'Prêt terminé · vous pouvez laisser une évaluation.',
    timeLabel: 'Hier',
  },
  {
    id: 'm-l3-2',
    loanId: 'l3',
    sender: 'other',
    text: 'Merci encore pour le prêt, tout est bien rendu.',
    timeLabel: 'Hier',
  },
];

export const OBJECT_STORIES: ObjectStory[] = [
  {
    objectId: 'obj-drill-bosch',
    totalLoans: 31,
    badges: ['Fiable', 'Entretien impeccable'],
    anecdote: 'Cette perceuse a aidé à monter 12 meubles et réparer 3 vélos dans le quartier.',
    moments: [
      { id: 'st1-m1', label: 'Premier prêt', detail: 'Mars 2025 · prêt à Lina pour une étagère' },
      { id: 'st1-m2', label: 'Badge acquis', detail: 'Objet populaire après 10 demandes' },
      { id: 'st1-m3', label: 'Impact', detail: '31 achats évités estimés' },
    ],
    photoMemories: [
      'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80',
    ],
  },
  {
    objectId: 'obj-raclette-8',
    totalLoans: 18,
    badges: ['Convivial', 'Favori des soirées'],
    anecdote: 'Cet appareil a lancé plus de soirées que n’importe quel autre objet Tooloop du quartier.',
    moments: [
      { id: 'st2-m1', label: 'Premier prêt', detail: 'Octobre 2025 · soirée voisins immeuble B' },
      { id: 'st2-m2', label: 'Pic usage', detail: 'Décembre · 5 prêts en 2 semaines' },
      { id: 'st2-m3', label: 'Communauté', detail: '4 recommandations positives' },
    ],
    photoMemories: [
      'https://images.unsplash.com/photo-1517244683847-7456b63c5969?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80',
    ],
  },
  {
    objectId: 'obj-ladder-telescopic',
    totalLoans: 44,
    badges: ['Très utile', 'Retours rapides'],
    anecdote: 'Elle a servi pour des travaux de jardin, de peinture et même des décorations de fête.',
    moments: [
      { id: 'st3-m1', label: 'Premier prêt', detail: 'Juin 2024 · taille de haie partagée' },
      { id: 'st3-m2', label: 'Record', detail: '44 prêts validés sans incident' },
      { id: 'st3-m3', label: 'Impact', detail: 'Top 1 des objets bricolage du quartier' },
    ],
    photoMemories: [
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=80',
    ],
  },
];

export const COMMUNITY_ZONES: CommunityZone[] = [
  {
    id: 'z1',
    label: 'Centre',
    objectIds: ['obj-drill-bosch', 'obj-raclette-8'],
    popularObjectIds: ['obj-drill-bosch'],
  },
  {
    id: 'z2',
    label: 'Nord',
    objectIds: ['obj-ladder-telescopic', 'obj-drill-bosch'],
    popularObjectIds: ['obj-ladder-telescopic'],
  },
  {
    id: 'z3',
    label: 'Sud',
    objectIds: ['obj-raclette-8'],
    popularObjectIds: [],
  },
];

export const COLLECTIVE_CHALLENGES: CollectiveChallenge[] = [
  {
    id: 'cc-50-week',
    title: '50 objets partagés cette semaine',
    progress: 37,
    target: 50,
    badge: 'Quartier solidaire',
  },
  {
    id: 'cc-co2',
    title: '200 actions d’entraide cette semaine',
    progress: 183,
    target: 200,
    badge: 'Impact vert',
  },
];

export const PERSONALIZED_SUGGESTIONS: PersonalizedSuggestion[] = [
  {
    id: 'ps-1',
    objectId: 'obj-drill-bosch',
    reason: 'Tu consultes souvent Bricolage et les prêts rapides.',
  },
  {
    id: 'ps-2',
    objectId: 'obj-raclette-8',
    reason: 'Objets cuisine populaires près de toi ce weekend.',
  },
  {
    id: 'ps-3',
    objectId: 'obj-ladder-telescopic',
    reason: 'Compatible avec tes recherches de travaux maison.',
  },
];

export function getExchangePassByLoanId(loanId: string) {
  return EXCHANGE_PASSES.find((item) => item.loanId === loanId);
}

export function getObjectStoryById(objectId: string) {
  return OBJECT_STORIES.find((story) => story.objectId === objectId);
}

export function getExchangeMessagesByLoanId(loanId: string) {
  return EXCHANGE_CHAT_MESSAGES.filter((message) => message.loanId === loanId);
}

export function getObjectImageByLoanObjectName(objectName: string) {
  const normalizedLoanName = objectName.toLowerCase();
  const exactMatch = DISCOVER_OBJECTS.find((item) => item.title.toLowerCase() === normalizedLoanName);
  if (exactMatch) {
    return exactMatch.imageUrl;
  }

  const partialMatch = DISCOVER_OBJECTS.find((item) => {
    const normalizedTitle = item.title.toLowerCase();
    return (
      normalizedLoanName.includes(normalizedTitle) ||
      normalizedTitle.includes(normalizedLoanName) ||
      normalizedLoanName.split(' ').some((word) => word.length > 3 && normalizedTitle.includes(word))
    );
  });

  return partialMatch?.imageUrl;
}
