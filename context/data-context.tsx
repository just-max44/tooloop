import { hydrateBackendData } from '@/lib/backend/data';
import { backendStore, useBackendStore } from '@/stores/backend-store';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';

interface DataContextProps {
  version: number;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

let contextVersion = 0;
backendStore.subscribe(() => { contextVersion += 1; });

const DataContext = createContext<DataContextProps>({
  version: 0,
  isLoading: false,
  error: null,
  refresh: async () => {},
});

export const DataProvider = ({ children }: { children: ReactNode }) => {
  useBackendStore((s) => s);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await hydrateBackendData();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Erreur de synchronisation des données';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <DataContext.Provider value={{ version: contextVersion, isLoading, error, refresh }}>
      {children}
    </DataContext.Provider>
  );
};

export const useDataContext = () => useContext(DataContext);
