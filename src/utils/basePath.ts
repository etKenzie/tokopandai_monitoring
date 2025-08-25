/**
 * Utility functions for handling base paths in development and production
 */

// Get the base path for the current environment
export const getBasePath = (): string => {
  if (typeof window !== 'undefined') {
    // Client-side: check if we're in production by looking at the current path
    const pathname = window.location.pathname;
    if (pathname.startsWith('/executive_dashboard')) {
      return '/executive_dashboard';
    }
  }
  
  // Server-side or development: use environment check
  return process.env.NODE_ENV === 'production' ? '/executive_dashboard' : '';
};

// Create a full URL with the correct base path
export const createUrl = (path: string): string => {
  const basePath = getBasePath();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${basePath}${cleanPath}`;
};

// Create a full asset URL with the correct base path
export const createAssetUrl = (assetPath: string): string => {
  const basePath = getBasePath();
  const cleanPath = assetPath.startsWith('/') ? assetPath : `/${assetPath}`;
  return `${basePath}${cleanPath}`;
};

// Check if we're in production environment
export const isProduction = (): boolean => {
  return process.env.NODE_ENV === 'production';
};

// Get the current base path for use in components
export const useBasePath = (): string => {
  if (typeof window !== 'undefined') {
    // Client-side: check current path
    const pathname = window.location.pathname;
    if (pathname.startsWith('/executive_dashboard')) {
      return '/executive_dashboard';
    }
  }
  return '';
};
