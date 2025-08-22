/**
 * Application Role Configuration
 * Centralized place to define and manage roles across the application
 */

// Available roles in the system
export const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  MANAGER: 'manager',
  ANALYST: 'analyst',
  VIEWER: 'viewer',
} as const;

// Role definitions for different pages/features
export const PAGE_ROLES = {
  // Dashboard pages
  KASBON_DASHBOARD: [ROLES.ADMIN],
  ANALYTICS_DASHBOARD: [ROLES.ANALYST, ROLES.ADMIN],
  
  // Admin pages
  ADMIN_PANEL: [ROLES.ADMIN],
  USER_MANAGEMENT: [ROLES.ADMIN, ROLES.MANAGER],
  
  // General access
  PUBLIC_PAGES: [], // No roles required, just authentication
  AUTHENTICATED_ONLY: [], // No specific roles, just authenticated
} as const;

// Helper function to get roles for a specific page
export function getPageRoles(pageKey: keyof typeof PAGE_ROLES): readonly string[] {
  return PAGE_ROLES[pageKey];
}

// Helper function to check if a role is valid
export function isValidRole(role: string): boolean {
  return Object.values(ROLES).includes(role as any);
}

// Helper function to get all available roles
export function getAllRoles(): string[] {
  return Object.values(ROLES);
}
