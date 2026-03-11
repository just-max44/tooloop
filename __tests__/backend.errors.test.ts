import { refreshBackendData } from '../lib/backend/data';

describe('Backend Error Handling', () => {
  it('should not throw when refreshing backend data', async () => {
    let error = null;
    try {
      await refreshBackendData();
    } catch (e) {
      error = e;
    }
    expect(error).toBeNull();
  });
});
