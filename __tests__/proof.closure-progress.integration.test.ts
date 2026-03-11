jest.mock('@/lib/backend/data', () => {
  const actual = jest.requireActual('@/lib/backend/data');
  return {
    ...actual,
    persistLoanProofStateRemote: jest.fn().mockResolvedValue(undefined),
  };
});

describe('proof progress integration', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('tracks pickup/return validations for one loan', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const progressStore = require('@/stores/proof/progress-store');

    const loanId = 'loan-proof-1';

    expect(progressStore.getProofProgress(loanId)).toEqual({
      pickupValidated: false,
      returnValidated: false,
    });

    progressStore.setPickupValidated(loanId, true);
    expect(progressStore.getProofProgress(loanId)).toEqual({
      pickupValidated: true,
      returnValidated: false,
    });

    progressStore.setReturnValidated(loanId, true);
    expect(progressStore.getProofProgress(loanId)).toEqual({
      pickupValidated: true,
      returnValidated: true,
    });
  });

  it('keeps proof progress isolated per loan', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const progressStore = require('@/stores/proof/progress-store');

    const loanA = 'loan-proof-a';
    const loanB = 'loan-proof-b';

    progressStore.setPickupValidated(loanA, true);
    expect(progressStore.getProofProgress(loanA)).toEqual({
      pickupValidated: true,
      returnValidated: false,
    });

    expect(progressStore.getProofProgress(loanB)).toEqual({
      pickupValidated: false,
      returnValidated: false,
    });
  });
});