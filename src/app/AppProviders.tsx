import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { ApiContext } from '../api/apiContext';
import type { ApiClient } from '../api/client';
import { createApiClient } from '../api/createApiClient';
import { AuthProvider } from '../auth/AuthProvider';
import { tokenStore } from '../auth/tokenStore';
import { createQueryClient } from './queryClient';

interface AppProvidersProps {
  children: ReactNode;
  /** Cliente alterno (pruebas). Por defecto se elige según VITE_USE_MOCKS. */
  client?: ApiClient;
  queryClient?: QueryClient;
}

function createDefaultClient(): ApiClient {
  return createApiClient({
    getToken: () => tokenStore.get(),
    // Un 401 cierra la sesión: se borra el token y AuthProvider lleva a /login.
    onUnauthorized: () => tokenStore.set(null),
  });
}

export function AppProviders({ children, client, queryClient }: AppProvidersProps) {
  const [api] = useState(() => client ?? createDefaultClient());
  const [queries] = useState(() => queryClient ?? createQueryClient());
  return (
    <QueryClientProvider client={queries}>
      <ApiContext.Provider value={api}>
        <AuthProvider>{children}</AuthProvider>
      </ApiContext.Provider>
    </QueryClientProvider>
  );
}
