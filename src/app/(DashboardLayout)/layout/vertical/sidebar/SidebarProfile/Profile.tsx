import { Box, Avatar, Typography, IconButton, Tooltip, useMediaQuery } from '@mui/material';
import { IconPower } from '@tabler/icons-react';
import { CustomizerContext } from "@/app/context/customizerContext";
import { useAuth } from '@/app/context/AuthContext';
import { useContext } from 'react';

export const Profile = () => {
  const lgUp = useMediaQuery((theme: any) => theme.breakpoints.up('lg'));
  const { user, roles, signOut } = useAuth();

  const { isSidebarHover, isCollapse } = useContext(CustomizerContext);
  const hideMenu = lgUp ? isCollapse == 'mini-sidebar' && !isSidebarHover : '';

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
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
