import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useApi } from '../api/apiContext';
import type { LoginRequest, RegisterRequest, User } from '../api/types';
import { AuthContext, type AuthContextValue, type AuthStatus } from './authContext';
import { tokenStore } from './tokenStore';

interface AuthState {
  status: AuthStatus;
  user: User | null;
}

const ANONYMOUS: AuthState = { status: 'anonymous', user: null };

export function AuthProvider({ children }: { children: ReactNode }) {
  const api = useApi();
  const queryClient = useQueryClient();
  const [state, setState] = useState<AuthState>(() =>
    tokenStore.get() ? { status: 'loading', user: null } : ANONYMOUS,
  );

  // Con un token guardado se recupera el usuario; si el token ya no sirve, el 401 lo borra.
  useEffect(() => {
    if (!tokenStore.get()) return;
    let cancelled = false;
    api.me().then(
      (user) => {
        if (!cancelled) setState({ status: 'authenticated', user });
      },
      () => {
        if (!cancelled) tokenStore.set(null);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [api]);

  // Cualquier borrado del token (cerrar sesión o un 401) deja la app sin sesión ni datos en caché.
  useEffect(
    () =>
      tokenStore.subscribe((token) => {
        if (token === null) {
          setState(ANONYMOUS);
          queryClient.clear();
        }
      }),
    [queryClient],
  );

  const login = useCallback(
    async (body: LoginRequest) => {
      const { token, user } = await api.login(body);
      tokenStore.set(token);
      setState({ status: 'authenticated', user });
    },
    [api],
  );

  const register = useCallback(
    async (body: RegisterRequest) => {
      const { token, user } = await api.register(body);
      tokenStore.set(token);
      setState({ status: 'authenticated', user });
    },
    [api],
  );

  const logout = useCallback(() => tokenStore.set(null), []);

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, login, register, logout }),
    [state, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
