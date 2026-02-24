const feedbackSubmittedByLoanId: Record<string, boolean> = {};

export function markFeedbackSubmitted(loanId: string) {
  feedbackSubmittedByLoanId[loanId] = true;
}

export function isFeedbackSubmitted(loanId: string) {
  return !!feedbackSubmittedByLoanId[loanId];
}
