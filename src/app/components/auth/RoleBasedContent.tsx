'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { Box, Typography, Chip, Paper } from '@mui/material';
import { Security } from '@mui/icons-material';

interface RoleBasedContentProps {
  children: ReactNode;
  requiredRoles: readonly string[];
  fallback?: ReactNode;
  showRoles?: boolean;
}

export default function RoleBasedContent({ 
  children, 
  requiredRoles, 
  fallback,
  showRoles = true 
}: RoleBasedContentProps) {
  const { roles } = useAuth();

  const hasRequiredRole = requiredRoles.some(role => roles.includes(role));

  if (!hasRequiredRole) {
    return fallback || (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="error" gutterBottom>
          Access Restricted
        </Typography>
        <Typography variant="body2" color="textSecondary" paragraph>
          This content requires one of the following roles:
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap', mb: 2 }}>
          {requiredRoles.map((role) => (
            <Chip
              key={role}
              label={role}
              color="primary"
              variant="outlined"
              icon={<Security />}
              size="small"
            />
          ))}
        </Box>
        <Typography variant="body2" color="textSecondary">
          Your current roles: {roles.length > 0 ? roles.join(', ') : 'None'}
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      {showRoles && (
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" color="textSecondary">
            Access granted with roles:
          </Typography>
          {requiredRoles.map((role) => (
            <Chip
              key={role}
              label={role}
              color="success"
              variant="outlined"
              icon={<Security />}
              size="small"
            />
          ))}
        </Box>
      )}
      {children}
    </Box>
  );
}
