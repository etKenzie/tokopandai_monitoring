import { useAuth } from '@/app/context/AuthContext';
import { RoleCheckResult } from '@/utils/checkRoles';

/**
 * Hook-based role checker that automatically fetches user and roles from AuthContext
 * Use this in components to check roles without manually passing user and roles
 * @param requiredRoles - Array of required roles (any of these will grant access)
 * @param defaultRedirect - Default redirect path for users with access
 * @param accessDeniedPath - Path to redirect users without access
 * @returns RoleCheckResult with access status, redirect information, and user roles
 */
export function useCheckRoles(
  requiredRoles: readonly string[],
  defaultRedirect: string = '/',
  accessDeniedPath: string = '/auth/access-denied'
): RoleCheckResult {
  const { user, roles } = useAuth();

  // If no user, redirect to login
  if (!user) {
    return {
      hasAccess: false,
      redirectPath: '/auth/login',
      userRoles: [],
      message: 'Authentication required'
    };
  }

  // Check if user has any of the required roles
  const hasRequiredRole = requiredRoles.some(role => roles.includes(role));

  if (hasRequiredRole) {
    // User has access, redirect to default path
    return {
      hasAccess: true,
      redirectPath: defaultRedirect,
      userRoles: roles,
      message: 'Access granted'
    };
  } else {
    // User doesn't have required roles, redirect to access denied
    return {
      hasAccess: false,
      redirectPath: accessDeniedPath,
      userRoles: roles,
      message: `Access denied. Required roles: ${requiredRoles.join(', ')}. Your roles: ${roles.join(', ') || 'None'}`
    };
  }
}

/**
 * Hook for checking admin access specifically
 * @param defaultRedirect - Default redirect path for users with admin access
 * @param accessDeniedPath - Path to redirect users without admin access
 * @returns RoleCheckResult for admin access
 */
export function useCheckAdminAccess(
  defaultRedirect: string = '/kasbon',
  accessDeniedPath: string = '/auth/access-denied'
): RoleCheckResult {
  return useCheckRoles(['admin'], defaultRedirect, accessDeniedPath);
}


