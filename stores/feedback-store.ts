import { TRUST_EXCHANGE_COMMENTS, type TrustExchangeComment } from '@/lib/backend/data';

const feedbackSubmittedByLoanId: Record<string, boolean> = {};
const trustCommentsBySourceKey: Record<string, TrustExchangeComment> = {};

export function markFeedbackSubmitted(loanId: string) {
  feedbackSubmittedByLoanId[loanId] = true;
}

export function isFeedbackSubmitted(loanId: string) {
  return !!feedbackSubmittedByLoanId[loanId];
}

export function upsertTrustExchangeComment(input: {
  sourceKey: string;
  authorName: string;
  targetUserName?: string;
  loanObjectName: string;
  comment: string;
  timeLabel?: string;
}) {
  const normalizedComment = input.comment.trim();
  if (!normalizedComment) {
    return;
  }

  trustCommentsBySourceKey[input.sourceKey] = {
    id: input.sourceKey,
    authorName: input.authorName,
    targetUserName: input.targetUserName,
    loanObjectName: input.loanObjectName,
    comment: normalizedComment,
    timeLabel: input.timeLabel ?? 'Maintenant',
  };
}

export function getTrustExchangeComments(targetUserName?: string) {
  const merged = [...Object.values(trustCommentsBySourceKey), ...TRUST_EXCHANGE_COMMENTS];
  if (!targetUserName?.trim()) {
    return merged;
  }

  const normalizedTarget = targetUserName.trim().toLowerCase();
  return merged.filter((item) => item.targetUserName?.trim().toLowerCase() === normalizedTarget);
}
