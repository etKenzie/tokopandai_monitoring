"use client";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import { styled, useTheme } from "@mui/material/styles";
import React, { useState, useContext, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import Header from "./layout/vertical/header/Header";
import Sidebar from "./layout/vertical/sidebar/Sidebar";
import Customizer from "./layout/shared/customizer/Customizer";
import Navigation from "./layout/horizontal/navbar/Navigation";
import HorizontalHeader from "./layout/horizontal/header/Header";
import { CustomizerContext } from "@/app/context/customizerContext";
import config from "@/app/context/config";

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
  const { user, loading } = useAuth();
  const router = useRouter();
  const MiniSidebarWidth = config.miniSidebarWidth;

  const theme = useTheme();

  // Handle authentication redirect
  useEffect(() => {
    if (!loading && !user) {
      // User is not authenticated, redirect to login
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <Container>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            gap: 2,
          }}
        >
          <div>Checking authentication...</div>
          <div style={{ fontSize: '0.9rem', color: '#666' }}>
            If this takes too long, try refreshing the page
          </div>
        </Box>
      </Container>
    );
  }

  // Don't render layout if user is not authenticated
  if (!user) {
    return null;
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
