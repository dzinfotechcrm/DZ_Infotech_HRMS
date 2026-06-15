import { Navigate, useLocation } from 'react-router-dom';
import Spinner from '../ui/Spinner';
import { useAuth } from '../../hooks/useAuth';
import { canAccess } from '../../utils/rbac';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, loading, accessDenied } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (accessDenied) {
    return <Navigate to="/access-denied" replace />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles.length && !canAccess(user.role, allowedRoles)) {
    return <Navigate to="/access-denied" replace />;
  }

  return children;
}
