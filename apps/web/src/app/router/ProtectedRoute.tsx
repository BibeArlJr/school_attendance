import { Navigate, Outlet } from 'react-router-dom';
import { ROUTES } from './routes';
import { useAuthStore } from '@/features/auth/store/authStore';

export function ProtectedRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  return <Outlet />;
}
