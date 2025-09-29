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
  DISTRIBUSI_DASHBOARD: [ROLES.ADMIN, "rully", "rifqi", "oki", "mardi", "distribusi"],
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

// Role to agent name mapping for API calls
const ROLE_TO_AGENT_MAP: Record<string, string> = {
  'rully': 'Rully juliandi',
  'oki': 'Oki irawan',
  'rifqi': 'Rifqi Cassidy',
  'mardi': 'Mardi'
};

// Helper function to get agent name from role
export function getAgentNameFromRole(role: string): string {
  return ROLE_TO_AGENT_MAP[role] || role;
}

// Helper function to get all restricted roles that should only see their own data
export function getRestrictedRoles(): string[] {
  return Object.keys(ROLE_TO_AGENT_MAP);
}