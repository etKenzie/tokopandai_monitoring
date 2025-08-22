import { User } from '@supabase/supabase-js';

export interface RoleCheckResult {
  hasAccess: boolean;
  redirectPath: string;
  userRoles: string[];
  message?: string;
}

/**
 * Check if a user has the required roles and determine redirect path
 * This function automatically fetches user roles from the AuthContext
 * @param requiredRoles - Array of required roles (any of these will grant access)
 * @param defaultRedirect - Default redirect path for users with access
 * @param accessDeniedPath - Path to redirect users without access
 * @returns RoleCheckResult with access status, redirect information, and user roles
 */
export function checkRoles(
  requiredRoles: string[],
  defaultRedirect: string = '/',
  accessDeniedPath: string = '/auth/access-denied'
): RoleCheckResult {
  // We'll need to get user and roles from a hook, so this function will be used differently
  // This is a template function that will be called from within components
  throw new Error('checkRoles should be called from within a component using useAuth hook');
}

/**
 * Check if user has admin access specifically for kasbon dashboard
 * @param user - The authenticated user object
 * @param userRoles - Array of user's assigned roles
 * @returns RoleCheckResult for admin access
 */
export function checkAdminAccess(
  user: User | null,
  userRoles: string[]
): RoleCheckResult {
  return checkRolesWithUser(
    user,
    userRoles,
    ['admin'],
    '/kasbon',
    '/auth/access-denied'
  );
}

/**
 * Check if user has any authenticated access (no specific role required)
 * @param user - The authenticated user object
 * @param userRoles - Array of user's assigned roles
 * @param defaultRedirect - Default redirect path for authenticated users
 * @returns RoleCheckResult for general authenticated access
 */
export function checkAuthenticatedAccess(
  user: User | null,
  userRoles: string[],
  defaultRedirect: string = '/'
): RoleCheckResult {
  if (!user) {
    return {
      hasAccess: false,
      redirectPath: '/auth/login',
      userRoles: [],
      message: 'Authentication required'
    };
  }

  // Automatically redirect authenticated users
  return {
    hasAccess: true,
    redirectPath: defaultRedirect,
    userRoles: userRoles,
    message: 'Access granted - redirecting'
  };
}

/**
 * Internal function that does the actual role checking
 * @param user - The authenticated user object
 * @param userRoles - Array of user's assigned roles
 * @param requiredRoles - Array of required roles (any of these will grant access)
 * @param defaultRedirect - Default redirect path for users with access
 * @param accessDeniedPath - Path to redirect users without access
 * @returns RoleCheckResult with access status, redirect information, and user roles
 */
function checkRolesWithUser(
  user: User | null,
  userRoles: string[],
  requiredRoles: string[],
  defaultRedirect: string = '/',
  accessDeniedPath: string = '/auth/access-denied'
): RoleCheckResult {
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
  const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));

  if (hasRequiredRole) {
    // User has access, redirect to default path
    return {
      hasAccess: true,
      redirectPath: defaultRedirect,
      userRoles: userRoles,
      message: 'Access granted'
    };
  } else {
    // User doesn't have required roles, redirect to access denied
    return {
      hasAccess: false,
      redirectPath: accessDeniedPath,
      userRoles: userRoles,
      message: `Access denied. Required roles: ${requiredRoles.join(', ')}. Your roles: ${userRoles.join(', ') || 'None'}`
    };
  }
}

/**
 * Hook-based role checker that automatically fetches user and roles from AuthContext
 * Use this in components to check roles without manually passing user and roles
 * @param requiredRoles - Array of required roles (any of these will grant access)
 * @param defaultRedirect - Default redirect path for users with access
 * @param accessDeniedPath - Path to redirect users without access
 * @returns RoleCheckResult with access status, redirect information, and user roles
 */
export function useCheckRoles(
  requiredRoles: string[],
  defaultRedirect: string = '/',
  accessDeniedPath: string = '/auth/access-denied'
): RoleCheckResult {
  // This will be implemented in a separate hook file
  throw new Error('useCheckRoles should be imported from @/hooks/useCheckRoles');
}
