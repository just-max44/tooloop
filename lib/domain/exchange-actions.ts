export type FinalizeReturnReviewInput = {
  loanId: string;
  acknowledged: boolean;
  alreadyAccepted: boolean;
  returnConditionLabel: string;
  completeRemotely: (loanId: string) => Promise<void>;
  markBorrowerReturnAccepted: (loanId: string, accepted: boolean) => void;
  markReturnValidated: (loanId: string, validated: boolean) => void;
  notifyRemoteFailure: () => void;
  onCompleted: () => void;
};

export async function finalizeReturnReview(input: FinalizeReturnReviewInput): Promise<boolean> {
  if (!input.returnConditionLabel) {
    return false;
  }

  if (!input.acknowledged && !input.alreadyAccepted) {
    return false;
  }

  try {
    await input.completeRemotely(input.loanId);
  } catch {
    input.notifyRemoteFailure();
    return false;
  }

  input.markBorrowerReturnAccepted(input.loanId, true);
  input.markReturnValidated(input.loanId, true);
  input.onCompleted();
  return true;
}

export type SendChatMessageResilientInput = {
  loanId: string;
  text: string;
  sendRemotely: (loanId: string, text: string) => Promise<void>;
  restoreDraft: (text: string) => void;
  notifyRemoteFailure: () => void;
};

export async function sendChatMessageResilient(input: SendChatMessageResilientInput): Promise<boolean> {
  const normalized = input.text.trim();
  if (!normalized) {
    return false;
  }

  try {
    await input.sendRemotely(input.loanId, normalized);
    return true;
  } catch {
    input.restoreDraft(normalized);
    input.notifyRemoteFailure();
    return false;
  }
}