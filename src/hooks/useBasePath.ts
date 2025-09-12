'use client';


/**
 * React hook to get the current base path
 * Updates automatically when the component mounts
 */
export const useBasePath = (): string => {
  // Always return empty string for root deployment
  return '';
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
