import { createMockClient } from '../mocks/mockClient';
import type { ApiClient, ClientSession } from './client';
import { API_BASE_URL, USE_MOCKS } from './config';
import { createHttpClient } from './httpClient';

/** Elige el cliente: en memoria (modo demo) o HTTP contra el backend. */
export function createApiClient(session: ClientSession): ApiClient {
  if (USE_MOCKS) return createMockClient({ ...session, latencyMs: 250 });
  return createHttpClient({ ...session, baseUrl: API_BASE_URL });
}
