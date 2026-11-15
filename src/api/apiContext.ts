import { createContext, useContext } from 'react';
import type { ApiClient } from './client';

export const ApiContext = createContext<ApiClient | null>(null);

export function useApi(): ApiClient {
  const client = useContext(ApiContext);
  if (!client) throw new Error('useApi debe usarse dentro de <AppProviders>');
  return client;
}
