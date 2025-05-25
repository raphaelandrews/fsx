import { createStore, get, set, del } from 'idb-keyval';
import type { PersistedClient, Persister } from '@tanstack/react-query-persist-client';

const customStore = createStore('tanstack-query-db', 'query-store');

export const indexedDBPersister: Persister = {
  persistClient: async (client: PersistedClient) => {
    try {
      await set('tanstack-query-cache', client, customStore);
    } catch (error) {
      console.error('Error persisting query cache:', error);
    }
  },
  restoreClient: async () => {
    try {
      const client = await get<PersistedClient>('tanstack-query-cache', customStore);
      return client || undefined;
    } catch (error) {
      console.error('Error restoring query cache:', error);
      return undefined;
    }
  },
  removeClient: async () => {
    try {
      await del('tanstack-query-cache', customStore);
    } catch (error) {
      console.error('Error removing query cache:', error);
    }
  },
};