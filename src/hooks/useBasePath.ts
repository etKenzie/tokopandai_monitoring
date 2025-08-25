'use client';

import { useEffect, useState } from 'react';

/**
 * React hook to get the current base path
 * Updates automatically when the component mounts
 */
export const useBasePath = (): string => {
  const [basePath, setBasePath] = useState<string>('');

  useEffect(() => {
    // Check if we're in production by looking at the current path
    const pathname = window.location.pathname;
    if (pathname.startsWith('/executive_dashboard')) {
      setBasePath('/executive_dashboard');
    } else {
      setBasePath('');
    }
  }, []);

  return basePath;
};

/**
 * Hook to create URLs with the correct base path
 */
export const useCreateUrl = () => {
  const basePath = useBasePath();
  
  return (path: string): string => {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${basePath}${cleanPath}`;
  };
};

/**
 * Hook to create asset URLs with the correct base path
 */
export const useCreateAssetUrl = () => {
  const basePath = useBasePath();
  
  return (assetPath: string): string => {
    const cleanPath = assetPath.startsWith('/') ? assetPath : `/${assetPath}`;
    return `${basePath}${cleanPath}`;
  };
};
