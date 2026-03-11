import { finalizeReturnReview, sendChatMessageResilient } from '@/lib/domain/exchange-actions';

describe('exchange actions', () => {
  it('does not update local return flags when remote completion fails', async () => {
    const completeRemotely = jest.fn().mockRejectedValue(new Error('network failure'));
    const markBorrowerReturnAccepted = jest.fn();
    const markReturnValidated = jest.fn();
    const notifyRemoteFailure = jest.fn();
    const onCompleted = jest.fn();

    const result = await finalizeReturnReview({
      loanId: 'loan-1',
      acknowledged: true,
      alreadyAccepted: false,
      returnConditionLabel: 'Conforme',
      completeRemotely,
      markBorrowerReturnAccepted,
      markReturnValidated,
      notifyRemoteFailure,
      onCompleted,
    });

    expect(result).toBe(false);
    expect(completeRemotely).toHaveBeenCalledWith('loan-1');
    expect(markBorrowerReturnAccepted).not.toHaveBeenCalled();
    expect(markReturnValidated).not.toHaveBeenCalled();
    expect(onCompleted).not.toHaveBeenCalled();
    expect(notifyRemoteFailure).toHaveBeenCalledTimes(1);
  });

  it('restores draft and notifies user when chat send fails', async () => {
    const sendRemotely = jest.fn().mockRejectedValue(new Error('timeout'));
    const restoreDraft = jest.fn();
    const notifyRemoteFailure = jest.fn();

    const result = await sendChatMessageResilient({
      loanId: 'loan-2',
      text: '  hello  ',
      sendRemotely,
      restoreDraft,
      notifyRemoteFailure,
    });

    expect(result).toBe(false);
    expect(sendRemotely).toHaveBeenCalledWith('loan-2', 'hello');
    expect(restoreDraft).toHaveBeenCalledWith('hello');
    expect(notifyRemoteFailure).toHaveBeenCalledTimes(1);
  });
});