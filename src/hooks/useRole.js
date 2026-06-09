import { useAuth } from './useAuth';
import { canAccess } from '../utils/rbac';

export function useRole(allowedRoles = []) {
  const auth = useAuth();
  return {
    ...auth,
    canAccess: canAccess(auth.user?.role, allowedRoles),
  };
}
