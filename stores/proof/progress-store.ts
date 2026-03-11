import { getLoanProofState, persistLoanProofStateRemote, setLoanProofStateLocal } from '@/lib/backend/data';

type ProofProgress = {
  pickupValidated: boolean;
  returnValidated: boolean;
};

export function getProofProgress(loanId: string): ProofProgress {
  const state = getLoanProofState(loanId);
  return {
    pickupValidated: state.pickupValidated,
    returnValidated: state.returnValidated,
  };
}

export function setPickupValidated(loanId: string, value: boolean) {
  setLoanProofStateLocal(loanId, { pickupValidated: value });
  void persistLoanProofStateRemote(loanId, { pickupValidated: value });
}

export function setReturnValidated(loanId: string, value: boolean) {
  setLoanProofStateLocal(loanId, { returnValidated: value });
  void persistLoanProofStateRemote(loanId, { returnValidated: value });
}
