type ProofProgress = {
  pickupValidated: boolean;
  returnValidated: boolean;
};

const progressByLoanId: Record<string, ProofProgress> = {};

function getOrCreateProgress(loanId: string): ProofProgress {
  if (!progressByLoanId[loanId]) {
    progressByLoanId[loanId] = {
      pickupValidated: false,
      returnValidated: false,
    };
  }

  return progressByLoanId[loanId];
}

export function getProofProgress(loanId: string): ProofProgress {
  return getOrCreateProgress(loanId);
}

export function setPickupValidated(loanId: string, value: boolean) {
  const current = getOrCreateProgress(loanId);
  progressByLoanId[loanId] = {
    ...current,
    pickupValidated: value,
  };
}

export function setReturnValidated(loanId: string, value: boolean) {
  const current = getOrCreateProgress(loanId);
  progressByLoanId[loanId] = {
    ...current,
    returnValidated: value,
  };
}
