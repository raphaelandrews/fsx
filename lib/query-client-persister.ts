import { createStore, get, set, del } from 'idb-keyval';
import type { PersistedClient, Persister } from '@tanstack/react-query-persist-client';

const customStore = createStore('fsx-db', 'query-store');

export const indexedDBPersister: Persister = {
  persistClient: async (client: PersistedClient) => {
    try {
      await set('fsx-store', client, customStore);
    } catch (error) {
      console.error('Error persisting query cache:', error);
    }
  },
  restoreClient: async () => {
    try {
      const client = await get<PersistedClient>('fsx-store', customStore);
      return client || undefined;
    } catch (error) {
      console.error('Error restoring query cache:', error);
      return undefined;
    }
  },
  removeClient: async () => {
    try {
      await del('fsx-store', customStore);
    } catch (error) {
      console.error('Error removing query cache:', error);
    }
  },
};
