"use client";
import Logo from '@/app/(DashboardLayout)/layout/shared/logo/Logo';
import PageContainer from '@/app/components/container/PageContainer';
import { useAuth } from '@/app/context/AuthContext';
import config from "@/app/context/config";
import { CustomizerContext } from "@/app/context/customizerContext";
import { createAssetUrl } from '@/utils/basePath';
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import { styled, useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React, { useContext, useEffect, useRef } from "react";
import { useSessionPersistence } from '../../hooks/useSessionPersistence';
import HorizontalHeader from "./layout/horizontal/header/Header";
import Navigation from "./layout/horizontal/navbar/Navigation";
import Customizer from "./layout/shared/customizer/Customizer";
import Header from "./layout/vertical/header/Header";
import Sidebar from "./layout/vertical/sidebar/Sidebar";

const MainWrapper = styled("div")(() => ({
  display: "flex",
  minHeight: "100vh",
  width: "100%",
}));

const PageWrapper = styled("div")(() => ({
  display: "flex",
  flexGrow: 1,
  paddingBottom: "60px",
  flexDirection: "column",
  zIndex: 1,
  width: "100%",
  backgroundColor: "transparent",
}));

interface Props {
  children: React.ReactNode;
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { activeLayout, isLayout, activeMode, isCollapse } = useContext(CustomizerContext);
  const { user, loading, roles } = useAuth();
  const router = useRouter();
  const MiniSidebarWidth = config.miniSidebarWidth;

  const theme = useTheme();
  
  // Ref to track if we've already redirected
  const hasRedirected = useRef(false);
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Use session persistence hook to prevent unnecessary auth reloads
  useSessionPersistence();

  // Handle authentication redirect with debouncing
  useEffect(() => {
    // Clear any existing timeout
    if (redirectTimeoutRef.current) {
      clearTimeout(redirectTimeoutRef.current);
    }

    // Only redirect if we're not loading and have no user, and haven't redirected yet
    if (!loading && !user && !hasRedirected.current) {
      // Add a longer delay to prevent rapid redirects during tab switches
      redirectTimeoutRef.current = setTimeout(() => {
        if (!loading && !user && !hasRedirected.current) {
          hasRedirected.current = true;
          router.push('/auth/login');
        }
      }, 3000); // 3 second delay to prevent tab switch issues
    }

    // Reset redirect flag if user is authenticated
    if (user) {
      hasRedirected.current = false;
    }

    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, [user, loading, router]);

  // Show loading only during initial auth check, not during tab switches
  if (loading && !user) {
    return (
      <PageContainer title="Loading" description="Loading user data">
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
                  src={createAssetUrl("/images/backgrounds/login-bg.svg")}
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
              <Typography variant="h3" fontWeight="700" mb={1}>
                {loading ? 'Checking Authentication...' : 'Loading User Data...'}
              </Typography>
              <Typography variant="subtitle1" color="textSecondary" mb={3}>
                {loading ? 'Verifying your credentials...' : 'Preparing your dashboard...'}
              </Typography>

              {/* Loading Spinner */}
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                <CircularProgress size={60} />
              </Box>

              <Typography variant="body2" color="textSecondary" sx={{ mb: 3, textAlign: 'center' }}>
                Page will refresh automatically if data doesn't load properly
              </Typography>

              {/* Manual Refresh Button */}
              {!loading && user && (!roles || roles.length === 0) && (
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={() => window.location.reload()}
                  sx={{ py: 1.5 }}
                >
                  Refresh Page
                </Button>
              )}
            </Box>
          </Grid>
        </Grid>
      </PageContainer>
    );
  }

  // Don't render layout if user is not authenticated
  if (!user) {
    return null;
  }

  // If user is authenticated but roles are still loading, show a minimal loading state
  if (user && (!roles || roles.length === 0)) {
    return (
      <PageContainer title="Loading" description="Loading user roles">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <CircularProgress size={40} />
        </Box>
      </PageContainer>
    );
  }

  return (
    <MainWrapper>
      {/* ------------------------------------------- */}
      {/* Sidebar */}
      {/* ------------------------------------------- */}
      {activeLayout === 'horizontal' ? "" : <Sidebar />}
      {/* ------------------------------------------- */}
      {/* Main Wrapper */}
      {/* ------------------------------------------- */}
      <PageWrapper
        className="page-wrapper"
        sx={{
          ...(isCollapse === "mini-sidebar" && {
            [theme.breakpoints.up("lg")]: {
              ml: `${MiniSidebarWidth}px`,
            },
          }),
        }}
      >
        {/* ------------------------------------------- */}
        {/* Header */}
        {/* ------------------------------------------- */}
        {activeLayout === 'horizontal' ? <HorizontalHeader /> : <Header />}

        {/* PageContent */}
        {activeLayout === 'horizontal' ? <Navigation /> : ""}
        <Container
          sx={{
            maxWidth: isLayout === "boxed" ? "lg" : "100%!important",
          }}
        >
          {/* ------------------------------------------- */}
          {/* PageContent */}
          {/* ------------------------------------------- */}

          <Box sx={{ minHeight: "calc(100vh - 170px)" }}>
            {/* <Outlet /> */}
            {children}
            {/* <Index /> */}
          </Box>

          {/* ------------------------------------------- */}
          {/* End Page */}
          {/* ------------------------------------------- */}
        </Container>
        <Customizer />
      </PageWrapper>
    </MainWrapper>
  );
}
