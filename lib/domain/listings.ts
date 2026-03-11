import type { MyListing } from '@/lib/backend/data';

export type ListingDraft = Omit<MyListing, 'id'>;
export type ListingPatch = Partial<ListingDraft>;

export type ListingValidationIssue = {
  field: keyof ListingDraft | 'root';
  message: string;
};

export type ListingValidationResult =
  | { ok: true; issues: [] }
  | { ok: false; issues: ListingValidationIssue[] };

export function validateListingDraft(input: ListingDraft): ListingValidationResult {
  const issues: ListingValidationIssue[] = [];

  if (input.title.trim().length === 0) {
    issues.push({ field: 'title', message: 'Le titre est requis.' });
  }

  if (input.description.trim().length === 0) {
    issues.push({ field: 'description', message: 'La description est requise.' });
  }

  if (input.publicationMode === 'loan' && (!input.photoUri || input.photoUri.trim().length === 0)) {
    issues.push({ field: 'photoUri', message: 'La photo est obligatoire pour un prêt.' });
  }

  if (input.publicationMode === 'request' && (!input.targetPeriod || input.targetPeriod.trim().length === 0)) {
    issues.push({ field: 'targetPeriod', message: 'La période souhaitée est requise pour une recherche.' });
  }

  if (issues.length > 0) {
    return { ok: false, issues };
  }

  return { ok: true, issues: [] };
}

export function normalizeListingDraft(input: ListingDraft): ListingDraft {
  return {
    ...input,
    title: input.title.trim(),
    description: input.description.trim(),
    photoUri: input.photoUri?.trim() || undefined,
    targetPeriod: input.targetPeriod?.trim() || undefined,
  };
}

export function normalizeListingPatch(patch: ListingPatch): ListingPatch {
  return {
    ...patch,
    title: patch.title?.trim(),
    description: patch.description?.trim(),
    photoUri: patch.photoUri?.trim() || undefined,
    targetPeriod: patch.targetPeriod?.trim() || undefined,
  };
}
