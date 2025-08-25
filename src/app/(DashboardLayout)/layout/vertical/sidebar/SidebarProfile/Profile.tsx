import { useAuth } from '@/app/context/AuthContext';
import { CustomizerContext } from "@/app/context/customizerContext";
import { createUrl } from '@/utils/basePath';
import { Avatar, Box, IconButton, Tooltip, Typography, useMediaQuery } from '@mui/material';
import { IconPower } from '@tabler/icons-react';
import { useContext } from 'react';

export const Profile = () => {
  const lgUp = useMediaQuery((theme: any) => theme.breakpoints.up('lg'));
  const { user, roles, signOut, loading } = useAuth();

  const { isSidebarHover, isCollapse } = useContext(CustomizerContext);
  const hideMenu = lgUp ? isCollapse == 'mini-sidebar' && !isSidebarHover : '';

  const handleSignOut = async () => {
    try {
      await signOut();
      // signOut function will handle the redirect
    } catch (error) {
      console.error('Error signing out:', error);
      // Force redirect even if there's an error
      window.location.href = createUrl('/auth/login');
    }
  };
  // Don't render if still loading
  if (loading) return null;

  return (
    <Box
      display={'flex'}
      alignItems="center"
      gap={2}
      sx={{ m: 3, p: 2, bgcolor: `${'secondary.light'}` }}
    >
      {!hideMenu ? (
        <>
          <Avatar 
            sx={{ 
              height: 40, 
              width: 40, 
              bgcolor: 'primary.main' 
            }}
          >
            {user?.email?.charAt(0).toUpperCase()}
          </Avatar>

          <Box>
            <Typography variant="h6" noWrap>
              {user?.email}
            </Typography>
            <Typography variant="caption">
              {roles.length > 0 ? roles[0] : 'No role'}
            </Typography>
          </Box>
          <Box sx={{ ml: 'auto' }}>
            <Tooltip title="Logout" placement="top">
              <IconButton
                color="primary"
                onClick={handleSignOut}
                aria-label="logout"
                size="small"
              >
                <IconPower size="20" />
              </IconButton>
            </Tooltip>
          </Box>
        </>
      ) : (
        ''
      )}
    </Box>
  );
};
