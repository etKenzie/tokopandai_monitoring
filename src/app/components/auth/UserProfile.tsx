'use client';

import { useAuth } from '@/app/context/AuthContext';
import { useSettings } from '@/app/context/SettingsContext';
import { createUrl } from '@/utils/basePath';
import {
  AccountCircle,
  Close,
  Email,
  ExpandMore,
  Logout,
  Person,
  Security,
  Settings,
} from '@mui/icons-material';
import {
  Avatar,
  Box,
  Chip,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Modal,
  Paper,
  Typography,
} from '@mui/material';
import Link from 'next/link';
import { useState } from 'react';

export default function UserProfile() {
  const { user, roles, signOut, loading } = useAuth();
  const { isAdmin } = useSettings();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSignOut = async () => {
    try {
      handleMenuClose();
      await signOut();
      // signOut function will handle the redirect
    } catch (error) {
      console.error('Error signing out:', error);
      // Force redirect even if there's an error
      window.location.href = createUrl('/auth/login');
    }
  };

  const handleProfileClick = () => {
    setModalOpen(true);
    handleMenuClose();
  };

  const handleModalClose = () => {
    setModalOpen(false);
  };

  if (!user || loading) return null;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {/* User Info */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Avatar sx={{ bgcolor: 'primary.main' }}>
          {user.email?.charAt(0).toUpperCase()}
        </Avatar>
        
        <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
          <Typography variant="body2" fontWeight="medium" noWrap>
            {user.email}
          </Typography>
          
          {/* Display First Role Only */}
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {roles.length > 0 ? (
              <Chip
                label={roles[0]}
                size="small"
                color="primary"
                variant="outlined"
                icon={<Security />}
                sx={{ 
                  fontSize: '0.7rem',
                  height: 20,
                  '& .MuiChip-label': { px: 1 }
                }}
              />
            ) : (
              <Typography variant="caption" color="textSecondary">
                No roles assigned
              </Typography>
            )}
          </Box>
        </Box>
      </Box>

      {/* Menu Button */}
      <IconButton
        onClick={handleMenuOpen}
        size="small"
        sx={{ ml: 1 }}
      >
        <ExpandMore />
      </IconButton>

      {/* Dropdown Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            minWidth: 200,
            mt: 1,
          },
        }}
      >
        <MenuItem onClick={handleProfileClick}>
          <ListItemIcon>
            <AccountCircle fontSize="small" />
          </ListItemIcon>
          <ListItemText>Profile</ListItemText>
        </MenuItem>
        
        {isAdmin && (
          <MenuItem component={Link} href="/admin/settings" onClick={handleMenuClose}>
            <ListItemIcon>
              <Settings fontSize="small" />
            </ListItemIcon>
            <ListItemText>Admin Settings</ListItemText>
          </MenuItem>
        )}
        
        <Divider />
        
        <MenuItem onClick={handleSignOut}>
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          <ListItemText>Sign Out</ListItemText>
        </MenuItem>
      </Menu>

      {/* Profile Modal */}
      <Modal
        open={modalOpen}
        onClose={handleModalClose}
        aria-labelledby="profile-modal-title"
        aria-describedby="profile-modal-description"
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400,
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: 24,
            p: 0,
          }}
        >
          <Paper sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" fontWeight="bold">
                User Profile
              </Typography>
              <IconButton onClick={handleModalClose} size="small">
                <Close />
              </IconButton>
            </Box>

            {/* User Info */}
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Avatar 
                sx={{ 
                  width: 80, 
                  height: 80, 
                  bgcolor: 'primary.main',
                  fontSize: '2rem',
                  mx: 'auto',
                  mb: 2
                }}
              >
                {user.email?.charAt(0).toUpperCase()}
              </Avatar>
            </Box>

            {/* User Details */}
            <List>
              <ListItem sx={{ px: 0 }}>
                <ListItemIcon>
                  <Email color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Email"
                  secondary={user.email}
                />
              </ListItem>
              
              <ListItem sx={{ px: 0 }}>
                <ListItemIcon>
                  <Person color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="User ID"
                  secondary={user.id}
                />
              </ListItem>
              
              <ListItem sx={{ px: 0 }}>
                <ListItemIcon>
                  <Security color="primary" />
                </ListItemIcon>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                    Roles
                  </Typography>
                  {roles.length > 0 ? (
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {roles.map((role, index) => (
                        <Chip
                          key={index}
                          label={role}
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ fontSize: '0.75rem' }}
                        />
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="textSecondary">
                      No roles assigned
                    </Typography>
                  )}
                </Box>
              </ListItem>
            </List>
          </Paper>
        </Box>
      </Modal>
    </Box>
  );
}
