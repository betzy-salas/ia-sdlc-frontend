import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { ApiClient } from '../api/client';
import { AppProviders } from '../app/AppProviders';
import { AppRoutes } from '../app/AppRoutes';
import { tokenStore } from '../auth/tokenStore';
import { createMockClient } from '../mocks/mockClient';

export function createTestClient(): ApiClient {
  return createMockClient({
    getToken: () => tokenStore.get(),
    onUnauthorized: () => tokenStore.set(null),
  });
}

/** Deja la sesión iniciada con un usuario de los datos de ejemplo. */
export function signInAs(userId: string): void {
  tokenStore.set(`mock-token-${userId}`);
}

/** Monta la app completa sobre el cliente en memoria. */
export function renderApp({ route = '/', client = createTestClient() }: { route?: string; client?: ApiClient } = {}) {
  return {
    client,
    ...render(
      <MemoryRouter initialEntries={[route]}>
        <AppProviders client={client}>
          <AppRoutes />
        </AppProviders>
      </MemoryRouter>,
    ),
  };
}
