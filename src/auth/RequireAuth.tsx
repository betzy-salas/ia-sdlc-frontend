import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { LoadingState } from '../components/States';
import { useAuth } from './authContext';

/** Sin sesión, cualquier ruta lleva a /login. */
export function RequireAuth() {
  const { status } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <LoadingState label="Recuperando tu sesión…" />;
  if (status === 'anonymous') return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}
