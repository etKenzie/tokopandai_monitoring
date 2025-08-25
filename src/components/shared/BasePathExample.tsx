'use client';

import { useCreateAssetUrl, useCreateUrl } from '@/hooks/useBasePath';
import { Box, Image, Link, Typography } from '@mui/material';

/**
 * Example component showing how to use base path utilities
 * This demonstrates how to handle images and links in both dev and production
 */
export const BasePathExample = () => {
  const createUrl = useCreateUrl();
  const createAssetUrl = useCreateAssetUrl();

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Base Path Examples
      </Typography>
      
      {/* Example 1: Navigation Links */}
      <Box mb={2}>
        <Typography variant="subtitle1" gutterBottom>
          Navigation Links:
        </Typography>
        <Link href={createUrl('/dashboard')} sx={{ mr: 2 }}>
          Dashboard
        </Link>
        <Link href={createUrl('/kasbon')} sx={{ mr: 2 }}>
          Kasbon
        </Link>
        <Link href={createUrl('/auth/login')}>
          Login
        </Link>
      </Box>

      {/* Example 2: Image Assets */}
      <Box mb={2}>
        <Typography variant="subtitle1" gutterBottom>
          Image Assets:
        </Typography>
        <Image
          src={createAssetUrl('/images/logos/light-logo.svg')}
          alt="Logo"
          width={200}
          height={50}
          style={{ marginRight: '10px' }}
        />
        <Image
          src={createAssetUrl('/images/profile/user-1.jpg')}
          alt="User Profile"
          width={50}
          height={50}
          style={{ borderRadius: '50%' }}
        />
      </Box>

      {/* Example 3: Programmatic Navigation */}
      <Box mb={2}>
        <Typography variant="subtitle1" gutterBottom>
          Programmatic Navigation:
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Use createUrl() for programmatic navigation:
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ fontFamily: 'monospace' }}>
          {`const dashboardUrl = createUrl('/dashboard');`}
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ fontFamily: 'monospace' }}>
          {`// Results in: ${createUrl('/dashboard')}`}
        </Typography>
      </Box>

      {/* Example 4: Asset URLs */}
      <Box>
        <Typography variant="subtitle1" gutterBottom>
          Asset URLs:
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Use createAssetUrl() for static assets:
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ fontFamily: 'monospace' }}>
          {`const logoUrl = createAssetUrl('/images/logos/light-logo.svg');`}
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ fontFamily: 'monospace' }}>
          {`// Results in: ${createAssetUrl('/images/logos/light-logo.svg')}`}
        </Typography>
      </Box>
    </Box>
  );
};
