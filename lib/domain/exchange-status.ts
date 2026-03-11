import type { LoanDirection, LoanState } from '@/lib/backend/data';

export type ExchangeFilter = LoanDirection | 'completed';
export type ExchangePrimaryAction = 'feedback' | 'chat' | 'proof' | 'none';

export function isLoanVisibleInFilter(state: LoanState, direction: LoanDirection, filter: ExchangeFilter) {
  if (filter === 'completed') {
    return state === 'completed' || state === 'refused';
  }

  return direction === filter && state !== 'completed' && state !== 'refused';
}

export function getExchangeStatusBadge(state: LoanState) {
  if (state === 'refused') {
    return { label: 'Refusé', variant: 'danger' as const };
  }

  if (state === 'completed') {
    return { label: 'Terminé', variant: 'primary' as const };
  }

  if (state === 'accepted') {
    return { label: 'En cours', variant: 'primary' as const };
  }

  return { label: 'Réservé', variant: 'neutral' as const };
}

export function getRoleLabel(direction: LoanDirection) {
  return direction === 'incoming' ? 'Tu l’empruntes' : 'Tu le prêtes';
}

export function canAcceptOrRefuseAsLender(state: LoanState, direction: LoanDirection) {
  return state === 'pending' && direction === 'outgoing';
}

export function canOpenChat(state: LoanState) {
  return state === 'accepted' || state === 'completed';
}

export function canOpenFeedback(state: LoanState, feedbackSubmitted: boolean) {
  return state === 'completed' && !feedbackSubmitted;
}

export function getPrimaryAction(state: LoanState, feedbackSubmitted: boolean): ExchangePrimaryAction {
  if (state === 'pending' || state === 'refused') {
    return 'none';
  }

  if (canOpenFeedback(state, feedbackSubmitted)) {
    return 'feedback';
  }

  if (canOpenChat(state)) {
    return 'chat';
  }

  return 'proof';
}

export function getChatBlockedReason(state: LoanState) {
  if (state === 'refused') {
    return 'Cette demande a été refusée.';
  }

  return 'Le chat est disponible uniquement après acceptation de la demande.';
}

export function canAccessFeedbackScreen(state: LoanState) {
  return state === 'completed';
}
