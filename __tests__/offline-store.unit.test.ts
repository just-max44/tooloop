import { clearOfflineData, loadOfflineData, saveOfflineData } from '@/lib/offline/offlineStore';

const mockGetItem = jest.fn();
const mockSetItem = jest.fn();
const mockRemoveItem = jest.fn();

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: (...args: unknown[]) => mockGetItem(...args),
    setItem: (...args: unknown[]) => mockSetItem(...args),
    removeItem: (...args: unknown[]) => mockRemoveItem(...args),
  },
}));

describe('offlineStore', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('saves JSON payload in AsyncStorage', async () => {
    mockSetItem.mockResolvedValueOnce(undefined);

    await saveOfflineData('DISCOVER_OBJECTS', { title: 'Perceuse', count: 2 });

    expect(mockSetItem).toHaveBeenCalledWith('DISCOVER_OBJECTS', '{"title":"Perceuse","count":2}');
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('loads typed JSON payload when valid', async () => {
    mockGetItem.mockResolvedValueOnce('{"category":"Bricolage","active":true}');

    const data = await loadOfflineData<{ category: string; active: boolean }>('DISCOVER_FILTER');

    expect(data).toEqual({ category: 'Bricolage', active: true });
  });

  it('returns null when no cached value exists', async () => {
    mockGetItem.mockResolvedValueOnce(null);

    const data = await loadOfflineData('MISSING_KEY');

    expect(data).toBeNull();
  });

  it('returns null and logs when cached JSON is malformed', async () => {
    mockGetItem.mockResolvedValueOnce('{invalid-json');

    const data = await loadOfflineData('BROKEN_KEY');

    expect(data).toBeNull();
    expect(consoleErrorSpy).toHaveBeenCalledWith('[Offline] load error', expect.any(Error));
  });

  it('logs save error without throwing', async () => {
    mockSetItem.mockRejectedValueOnce(new Error('disk-full'));

    await expect(saveOfflineData('DISCOVER_OBJECTS', { id: '1' })).resolves.toBeUndefined();

    expect(consoleErrorSpy).toHaveBeenCalledWith('[Offline] save error', expect.any(Error));
  });

  it('calls removeItem when clearing cache key', async () => {
    mockRemoveItem.mockResolvedValueOnce(undefined);

    await clearOfflineData('DISCOVER_OBJECTS');

    expect(mockRemoveItem).toHaveBeenCalledWith('DISCOVER_OBJECTS');
  });
});
