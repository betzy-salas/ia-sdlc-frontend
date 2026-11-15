import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '../api/ApiError';

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 15_000,
        refetchOnWindowFocus: false,
        // Solo se reintentan fallos de red o del servidor; un 4xx es una respuesta válida del back.
        retry: (failureCount, error) =>
          failureCount < 1 && !(error instanceof ApiError && error.status >= 400 && error.status < 500),
      },
      mutations: { retry: false },
    },
  });
}
