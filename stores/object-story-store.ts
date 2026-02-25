export type StoryContribution = {
  id: string;
  loanId: string;
  objectId: string;
  photoUri: string;
  comment?: string;
  authorName: string;
  createdAtLabel: string;
  reviewStatus: 'pending' | 'approved' | 'rejected';
};

const storyContributionsByObjectId: Record<string, StoryContribution[]> = {};

export function addStoryContribution(input: {
  loanId: string;
  objectId: string;
  photoUri: string;
  comment?: string;
  authorName: string;
}) {
  const normalizedPhotoUri = input.photoUri.trim();
  if (!normalizedPhotoUri) {
    return;
  }

  const contribution: StoryContribution = {
    id: `${input.objectId}-${Date.now()}`,
    loanId: input.loanId,
    objectId: input.objectId,
    photoUri: normalizedPhotoUri,
    comment: input.comment?.trim() || undefined,
    authorName: input.authorName,
    createdAtLabel: 'Maintenant',
    reviewStatus: 'pending',
  };

  const current = storyContributionsByObjectId[input.objectId] ?? [];
  storyContributionsByObjectId[input.objectId] = [contribution, ...current];
}

export function getStoryContributionsByObjectId(objectId: string) {
  return (storyContributionsByObjectId[objectId] ?? []).filter((item) => item.reviewStatus === 'approved');
}

export function getPendingStoryContributionsByLoanId(loanId: string) {
  return Object.values(storyContributionsByObjectId)
    .flat()
    .filter((item) => item.loanId === loanId && item.reviewStatus === 'pending');
}

export function approveStoryContribution(contributionId: string) {
  Object.keys(storyContributionsByObjectId).forEach((objectId) => {
    storyContributionsByObjectId[objectId] = (storyContributionsByObjectId[objectId] ?? []).map((item) =>
      item.id === contributionId ? { ...item, reviewStatus: 'approved' } : item
    );
  });
}

export function rejectStoryContribution(contributionId: string) {
  Object.keys(storyContributionsByObjectId).forEach((objectId) => {
    storyContributionsByObjectId[objectId] = (storyContributionsByObjectId[objectId] ?? []).map((item) =>
      item.id === contributionId ? { ...item, reviewStatus: 'rejected' } : item
    );
  });
}
