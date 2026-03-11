describe('object-story-store', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('ignores contribution when photoUri is empty after trim', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const store = require('@/stores/object-story-store');

    store.addStoryContribution({
      loanId: 'loan-1',
      objectId: 'object-1',
      photoUri: '   ',
      authorName: 'Alice',
    });

    expect(store.getPendingStoryContributionsByLoanId('loan-1')).toEqual([]);
  });

  it('stores contribution as pending with normalized fields', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const store = require('@/stores/object-story-store');

    store.addStoryContribution({
      loanId: 'loan-1',
      objectId: 'object-1',
      photoUri: '  https://cdn/pic.jpg  ',
      comment: '  Super utile  ',
      authorName: 'Alice',
    });

    const pending = store.getPendingStoryContributionsByLoanId('loan-1');

    expect(pending).toHaveLength(1);
    expect(pending[0].photoUri).toBe('https://cdn/pic.jpg');
    expect(pending[0].comment).toBe('Super utile');
    expect(pending[0].reviewStatus).toBe('pending');
    expect(pending[0].createdAtLabel).toBe('Maintenant');
  });

  it('returns approved contributions only for object feed', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const store = require('@/stores/object-story-store');

    store.addStoryContribution({
      loanId: 'loan-1',
      objectId: 'object-1',
      photoUri: 'https://cdn/pic-1.jpg',
      authorName: 'Alice',
    });

    const [contribution] = store.getPendingStoryContributionsByLoanId('loan-1');
    store.approveStoryContribution(contribution.id);

    const approved = store.getStoryContributionsByObjectId('object-1');
    const pending = store.getPendingStoryContributionsByLoanId('loan-1');

    expect(approved).toHaveLength(1);
    expect(approved[0].id).toBe(contribution.id);
    expect(approved[0].reviewStatus).toBe('approved');
    expect(pending).toEqual([]);
  });

  it('excludes rejected contributions from both pending and approved lists', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const store = require('@/stores/object-story-store');

    store.addStoryContribution({
      loanId: 'loan-2',
      objectId: 'object-2',
      photoUri: 'https://cdn/pic-2.jpg',
      authorName: 'Bob',
    });

    const [contribution] = store.getPendingStoryContributionsByLoanId('loan-2');
    store.rejectStoryContribution(contribution.id);

    expect(store.getPendingStoryContributionsByLoanId('loan-2')).toEqual([]);
    expect(store.getStoryContributionsByObjectId('object-2')).toEqual([]);
  });
});
