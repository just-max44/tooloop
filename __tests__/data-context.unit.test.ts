let capturedContextValue: {
  version: number;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
} | null = null;

const mockHydrateBackendData = jest.fn();

const mockSetIsLoading = jest.fn();
const mockSetError = jest.fn();

jest.mock('@/lib/backend/data', () => ({
  hydrateBackendData: () => mockHydrateBackendData(),
}));

jest.mock('@/stores/backend-store', () => ({
  backendStore: {
    subscribe: jest.fn((cb: () => void) => cb),
  },
  useBackendStore: jest.fn(() => ({})),
}));

jest.mock('react', () => {
  const createContext = () => ({
    Provider: ({ value, children }: { value: typeof capturedContextValue; children: unknown }) => {
      capturedContextValue = value;
      return children;
    },
  });

  return {
    __esModule: true,
    default: {
      createElement: () => null,
      Fragment: 'Fragment',
    },
    createContext,
    useContext: () => capturedContextValue,
    useCallback: (callback: unknown) => callback,
    useEffect: (effect: () => void) => effect(),
    useState: jest.fn((initialValue: unknown) => {
      if (typeof initialValue === 'boolean') {
        return [false, mockSetIsLoading];
      }

      return [null, mockSetError];
    }),
  };
});

jest.mock('react/jsx-runtime', () => ({
  jsx: (type: unknown, props: Record<string, unknown>) => {
    if (typeof type === 'function') {
      return type(props);
    }

    return null;
  },
  jsxs: (type: unknown, props: Record<string, unknown>) => {
    if (typeof type === 'function') {
      return type(props);
    }

    return null;
  },
  Fragment: 'Fragment',
}));

describe('data-context', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedContextValue = null;
  });

  it('hydrates backend data on provider mount', () => {
    mockHydrateBackendData.mockResolvedValue(undefined);

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { DataProvider } = require('@/context/data-context');
    DataProvider({ children: null });

    expect(mockHydrateBackendData).toHaveBeenCalledTimes(1);
    expect(capturedContextValue?.version).toBe(0);
  });

  it('sets fallback error message when refresh fails with non-error value', async () => {
    mockHydrateBackendData
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce('network-down');

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { DataProvider } = require('@/context/data-context');
    DataProvider({ children: null });

    await capturedContextValue?.refresh();

    expect(mockSetIsLoading).toHaveBeenCalledWith(true);
    expect(mockSetError).toHaveBeenCalledWith(null);
    expect(mockSetError).toHaveBeenCalledWith('Erreur de synchronisation des données');
    expect(mockSetIsLoading).toHaveBeenCalledWith(false);
  });

  it('sets explicit error message when refresh fails with Error', async () => {
    mockHydrateBackendData
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('Supabase unavailable'));

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { DataProvider } = require('@/context/data-context');
    DataProvider({ children: null });

    await capturedContextValue?.refresh();

    expect(mockSetError).toHaveBeenCalledWith('Supabase unavailable');
  });
});
