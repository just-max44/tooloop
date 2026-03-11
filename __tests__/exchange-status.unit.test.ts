import {
    canAcceptOrRefuseAsLender,
    canAccessFeedbackScreen,
    canOpenChat,
    canOpenFeedback,
    getChatBlockedReason,
    getExchangeStatusBadge,
    getPrimaryAction,
    isLoanVisibleInFilter,
} from '@/lib/domain/exchange-status';

describe('exchange status matrix', () => {
  it('maps status badge consistently', () => {
    expect(getExchangeStatusBadge('pending')).toEqual({ label: 'Réservé', variant: 'neutral' });
    expect(getExchangeStatusBadge('accepted')).toEqual({ label: 'En cours', variant: 'primary' });
    expect(getExchangeStatusBadge('completed')).toEqual({ label: 'Terminé', variant: 'primary' });
    expect(getExchangeStatusBadge('refused')).toEqual({ label: 'Refusé', variant: 'danger' });
  });

  it('applies inbox filter visibility rules', () => {
    expect(isLoanVisibleInFilter('pending', 'incoming', 'incoming')).toBe(true);
    expect(isLoanVisibleInFilter('accepted', 'incoming', 'incoming')).toBe(true);
    expect(isLoanVisibleInFilter('completed', 'incoming', 'incoming')).toBe(false);
    expect(isLoanVisibleInFilter('refused', 'incoming', 'incoming')).toBe(false);

    expect(isLoanVisibleInFilter('completed', 'incoming', 'completed')).toBe(true);
    expect(isLoanVisibleInFilter('refused', 'incoming', 'completed')).toBe(true);
  });

  it('enables actions from one deterministic matrix', () => {
    expect(canAcceptOrRefuseAsLender('pending', 'outgoing')).toBe(true);
    expect(canAcceptOrRefuseAsLender('pending', 'incoming')).toBe(false);
    expect(canOpenChat('accepted')).toBe(true);
    expect(canOpenChat('completed')).toBe(true);
    expect(canOpenChat('refused')).toBe(false);
    expect(canOpenFeedback('completed', false)).toBe(true);
    expect(canOpenFeedback('completed', true)).toBe(false);
    expect(canAccessFeedbackScreen('completed')).toBe(true);
    expect(canAccessFeedbackScreen('accepted')).toBe(false);
  });

  it('selects primary action and blocked reason', () => {
    expect(getPrimaryAction('completed', false)).toBe('feedback');
    expect(getPrimaryAction('completed', true)).toBe('chat');
    expect(getPrimaryAction('accepted', false)).toBe('chat');
    expect(getPrimaryAction('pending', false)).toBe('none');
    expect(getPrimaryAction('refused', false)).toBe('none');
    expect(getChatBlockedReason('refused')).toBe('Cette demande a été refusée.');
    expect(getChatBlockedReason('pending')).toBe('Le chat est disponible uniquement après acceptation de la demande.');
  });
});
