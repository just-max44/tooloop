import { hydrateBackendData } from '../lib/backend/data';

describe('Backend Integration', () => {
  it('should hydrate backend data without throwing', async () => {
    let error = null;
    try {
      await hydrateBackendData();
    } catch (e) {
      error = e;
    }
    expect(error).toBeNull();
  });
});
