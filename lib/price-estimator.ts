import type { DiscoverObject } from '@/lib/backend/data';

type EstimateConfidence = 'faible' | 'moyenne' | 'élevée';

export type PriceEstimate = {
  estimatedNewPriceEur: number;
  lowRangeEur: number;
  highRangeEur: number;
  confidence: EstimateConfidence;
  sampleSize: number;
};

type CategoryKey = DiscoverObject['category'];

const CATEGORY_BENCHMARKS: Record<CategoryKey, number[]> = {
  Bricolage: [55, 69, 79, 89, 99, 119, 139, 159],
  Jardin: [25, 35, 45, 59, 75, 89, 109, 129],
  Cuisine: [39, 49, 59, 69, 79, 95, 115, 139],
  'Fête': [19, 29, 39, 49, 65, 79, 95, 119],
  Sport: [29, 45, 59, 79, 99, 129, 159, 199],
  Autre: [29, 45, 59, 79, 99, 119, 149, 189],
};

const KEYWORD_MULTIPLIERS: { pattern: RegExp; multiplier: number }[] = [
  { pattern: /bosch|makita|dewalt|festool/i, multiplier: 1.2 },
  { pattern: /pro|professionnel|premium/i, multiplier: 1.15 },
  { pattern: /t[ée]lescopique|grande|xl|8p|8 personnes/i, multiplier: 1.1 },
  { pattern: /compact|mini|simple/i, multiplier: 0.92 },
  { pattern: /ancien|us[ée]|occasion/i, multiplier: 0.85 },
];

function median(values: number[]) {
  const sorted = [...values].sort((first, second) => first - second);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }

  return sorted[middle];
}

function percentile(values: number[], ratio: number) {
  const sorted = [...values].sort((first, second) => first - second);
  const index = Math.max(0, Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * ratio)));
  return sorted[index];
}

function roundToNearestFive(amount: number) {
  return Math.max(5, Math.round(amount / 5) * 5);
}

function getKeywordMultiplier(title: string, description: string) {
  const text = `${title} ${description}`;
  const matches = KEYWORD_MULTIPLIERS.filter((rule) => rule.pattern.test(text));

  if (matches.length === 0) {
    return { multiplier: 1, matchCount: 0 };
  }

  const avg = matches.reduce((acc, current) => acc + current.multiplier, 0) / matches.length;
  const bounded = Math.max(0.8, Math.min(1.3, avg));
  return { multiplier: bounded, matchCount: matches.length };
}

function getConfidence(sampleSize: number, spreadRatio: number, keywordMatchCount: number): EstimateConfidence {
  if (sampleSize >= 8 && spreadRatio <= 0.5 && keywordMatchCount >= 1) {
    return 'élevée';
  }

  if (sampleSize >= 6 && spreadRatio <= 0.75) {
    return 'moyenne';
  }

  return 'faible';
}

export function estimateObjectPrice(objectItem: Pick<DiscoverObject, 'title' | 'description' | 'category'>): PriceEstimate {
  const references = CATEGORY_BENCHMARKS[objectItem.category] ?? CATEGORY_BENCHMARKS.Autre;

  const baseMedian = median(references);
  const p25 = percentile(references, 0.25);
  const p75 = percentile(references, 0.75);
  const spreadRatio = baseMedian > 0 ? (p75 - p25) / baseMedian : 1;

  const { multiplier, matchCount } = getKeywordMultiplier(objectItem.title, objectItem.description);

  const estimated = roundToNearestFive(baseMedian * multiplier);
  const lowRange = roundToNearestFive(p25 * multiplier);
  const highRange = roundToNearestFive(p75 * multiplier);

  return {
    estimatedNewPriceEur: estimated,
    lowRangeEur: Math.min(lowRange, estimated),
    highRangeEur: Math.max(highRange, estimated),
    confidence: getConfidence(references.length, spreadRatio, matchCount),
    sampleSize: references.length,
  };
}
