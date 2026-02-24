import type { LoanState } from '@/data/mock';

const closedExchangeByLoanId: Record<string, boolean> = {};
const acceptedExchangeByLoanId: Record<string, boolean> = {};
const refusedExchangeByLoanId: Record<string, boolean> = {};

export function closeExchange(loanId: string) {
  closedExchangeByLoanId[loanId] = true;
}

export function isExchangeClosed(loanId: string) {
  return !!closedExchangeByLoanId[loanId];
}

export function acceptExchange(loanId: string) {
  refusedExchangeByLoanId[loanId] = false;
  acceptedExchangeByLoanId[loanId] = true;
}

export function isExchangeAccepted(loanId: string) {
  return !!acceptedExchangeByLoanId[loanId];
}

export function refuseExchange(loanId: string) {
  acceptedExchangeByLoanId[loanId] = false;
  refusedExchangeByLoanId[loanId] = true;
  closedExchangeByLoanId[loanId] = true;
}

export function isExchangeRefused(loanId: string) {
  return !!refusedExchangeByLoanId[loanId];
}

export function getEffectiveLoanState(loanId: string, initialState: LoanState): LoanState {
  if (isExchangeClosed(loanId)) {
    return 'completed';
  }

  if (initialState === 'pending' && isExchangeAccepted(loanId)) {
    return 'accepted';
  }

  return initialState;
}
