import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { PageSpinner } from './ui/States';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: string[];
  redirect?: string;
}

export function ProtectedRoute({ children, roles, redirect = '/login' }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageSpinner label="Checking your session" />;

  if (!user) {
    return <Navigate to={redirect} state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
