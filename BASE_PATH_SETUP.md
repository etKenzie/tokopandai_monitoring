# Base Path Configuration

This document explains how the base path system works for handling different environments (development vs production).

## Overview

The application automatically handles base paths:
- **Development**: No base path (e.g., `http://localhost:3000/dashboard`)
- **Production**: `/executive_dashboard` base path (e.g., `https://yourdomain.com/executive_dashboard/dashboard`)

## Configuration Files

### 1. Next.js Config (`next.config.mjs`)
```javascript
const nextConfig = { 
  reactStrictMode: false, 
  images: { unoptimized: true },
  // Dynamic base path configuration
  basePath: process.env.NODE_ENV === 'production' ? '/executive_dashboard' : '',
  // Asset prefix for production
  assetPrefix: process.env.NODE_ENV === 'production' ? '/executive_dashboard' : '',
  // Trailing slash for consistency
  trailingSlash: false,
};
```

### 2. Utility Functions (`src/utils/basePath.ts`)
- `getBasePath()`: Get current base path
- `createUrl(path)`: Create full URL with base path
- `createAssetUrl(assetPath)`: Create asset URL with base path
- `isProduction()`: Check if in production environment

### 3. React Hooks (`src/hooks/useBasePath.ts`)
- `useBasePath()`: React hook for base path
- `useCreateUrl()`: Hook to create URLs
- `useCreateAssetUrl()`: Hook to create asset URLs

## Usage Examples

### Navigation Links
```tsx
import { createUrl } from '@/utils/basePath';
import { useCreateUrl } from '@/hooks/useBasePath';

// In components
const createUrl = useCreateUrl();

// Navigation
<Link href={createUrl('/dashboard')}>Dashboard</Link>
<Link href={createUrl('/kasbon')}>Kasbon</Link>
<Link href={createUrl('/auth/login')}>Login</Link>
```

### Image Assets
```tsx
import { createAssetUrl } from '@/utils/basePath';
import { useCreateAssetUrl } from '@/hooks/useBasePath';

// In components
const createAssetUrl = useCreateAssetUrl();

// Images
<Image 
  src={createAssetUrl('/images/logos/light-logo.svg')} 
  alt="Logo" 
/>
```

### Programmatic Navigation
```tsx
import { createUrl } from '@/utils/basePath';
import { useRouter } from 'next/navigation';

const router = useRouter();

// Redirect with base path
router.push(createUrl('/auth/login'));

// Window location redirect
window.location.href = createUrl('/auth/login');
```

### Authentication Redirects
```tsx
// In AuthContext
window.location.href = createUrl('/auth/login');

// In layout components
router.push(createUrl('/auth/login'));
```

## Environment Behavior

### Development (`npm run dev`)
- Base path: `""` (empty)
- URLs: `http://localhost:3000/dashboard`
- Assets: `http://localhost:3000/images/logo.svg`

### Production (`npm run build && npm start`)
- Base path: `/executive_dashboard`
- URLs: `https://yourdomain.com/executive_dashboard/dashboard`
- Assets: `https://yourdomain.com/executive_dashboard/images/logo.svg`

## Best Practices

1. **Always use utility functions** for URLs and assets
2. **Don't hardcode paths** - use `createUrl()` and `createAssetUrl()`
3. **Test in both environments** to ensure paths work correctly
4. **Use React hooks** in components for dynamic base path detection

## Migration Guide

### Before (Hardcoded paths)
```tsx
<Link href="/dashboard">Dashboard</Link>
<Image src="/images/logo.svg" alt="Logo" />
router.push('/auth/login');
```

### After (Dynamic base paths)
```tsx
<Link href={createUrl('/dashboard')}>Dashboard</Link>
<Image src={createAssetUrl('/images/logo.svg')} alt="Logo" />
router.push(createUrl('/auth/login'));
```

## Troubleshooting

### Images not loading in production
- Ensure you're using `createAssetUrl()` for all image paths
- Check that the base path is correctly set in `next.config.mjs`

### Navigation not working in production
- Use `createUrl()` for all navigation links
- Ensure Next.js `basePath` is configured correctly

### Authentication redirects failing
- Update all redirect URLs to use `createUrl()`
- Check AuthContext and layout components

## Testing

To test the base path system:

1. **Development**: Run `npm run dev` and verify paths work without base path
2. **Production**: Run `npm run build && npm start` and verify paths include `/executive_dashboard`
3. **Manual testing**: Check navigation, images, and authentication redirects in both environments
