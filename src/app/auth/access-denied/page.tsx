'use client';

import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import { Security, Lock } from '@mui/icons-material';
import PageContainer from '@/app/components/container/PageContainer';
import Logo from '@/app/(DashboardLayout)/layout/shared/logo/Logo';
import Image from 'next/image';

export default function AccessDeniedPage() {
  const { user, roles, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/auth/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <PageContainer title="Access Denied" description="Access denied page">
      <Grid container spacing={0} justifyContent="center" sx={{ height: '100vh' }}>
        <Grid
          sx={{
            position: 'relative',
            '&:before': {
              content: '""',
              background: 'radial-gradient(#d2f1df, #d3d7fa, #bad8f4)',
              backgroundSize: '400% 400%',
              animation: 'gradient 15s ease infinite',
              position: 'absolute',
              height: '100%',
              width: '100%',
              opacity: '0.3',
            },
          }}
          size={{
            xs: 12,
            sm: 12,
            lg: 7,
            xl: 8
          }}>
          <Box position="relative">
            <Box px={3}>
              <Logo />
            </Box>
            <Box
              alignItems="center"
              justifyContent="center"
              height={'calc(100vh - 75px)'}
              sx={{
                display: {
                  xs: 'none',
                  lg: 'flex',
                },
              }}
            >
              <Image
                src={"/images/backgrounds/login-bg.svg"}
                alt="bg" width={500} height={500}
                style={{
                  width: '100%',
                  maxWidth: '500px',
                  maxHeight: '500px',
                }}
              />
            </Box>
          </Box>
        </Grid>
        <Grid
          display="flex"
          justifyContent="center"
          alignItems="center"
          size={{
            xs: 12,
            sm: 12,
            lg: 5,
            xl: 4
          }}>
          <Box p={4}>
            <Paper 
              elevation={3} 
              sx={{ 
                p: 4, 
                textAlign: 'center',
                borderRadius: 2
              }}
            >
              <Lock sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
              
              <Typography variant="h4" fontWeight="700" mb={2} color="error.main">
                Access Denied
              </Typography>
              
              <Typography variant="body1" color="textSecondary" mb={3}>
                You don&apos;t have permission to access the dashboard.
              </Typography>

              <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="subtitle2" fontWeight="600" mb={1}>
                  Current User Information:
                </Typography>
                <Typography variant="body2" color="textSecondary" mb={1}>
                  Email: {user?.email}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Roles: {roles.length > 0 ? roles.join(', ') : 'None'}
                </Typography>
              </Box>

              <Typography variant="body2" color="textSecondary" mb={3}>
                This application requires <strong>admin</strong> role access.
                <br />
                Please contact your administrator to request access.
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleSignOut}
                  fullWidth
                >
                  Sign Out
                </Button>
                
                <Button
                  variant="outlined"
                  size="large"
                  component={Link}
                  href="/auth/login"
                  fullWidth
                >
                  Back to Login
                </Button>
              </Box>
            </Paper>
          </Box>
        </Grid>
      </Grid>
    </PageContainer>
  );
}
