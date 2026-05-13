import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './useAuth';
import { PremiumRouteLoader } from '../../components/AppEntryExperience';

export function ProtectedRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <PremiumRouteLoader label="Restoring your workspace..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export function PublicRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <PremiumRouteLoader label="Preparing your session..." />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
