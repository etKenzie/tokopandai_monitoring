"use client";
import RTL from "@/app/(DashboardLayout)/layout/shared/customizer/RTL";
import { AuthProvider } from '@/app/context/AuthContext';
import { CustomizerContext } from '@/app/context/customizerContext';
import { SettingsProvider } from '@/app/context/SettingsContext';
import "@/utils/i18n";
import { ThemeSettings } from "@/utils/theme/Theme";
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import React, { useContext } from "react";


const MyApp = ({ children }: { children: React.ReactNode }) => {
    const theme = ThemeSettings();
    const { activeDir } = useContext(CustomizerContext);

    return (
        <>
            <AppRouterCacheProvider options={{ enableCssLayer: true }}>
                <ThemeProvider theme={theme}>
                    <RTL direction={activeDir}>
                        <CssBaseline />
                        <AuthProvider>
                            <SettingsProvider>
                                {children}
                            </SettingsProvider>
                        </AuthProvider>
                    </RTL>
                </ThemeProvider>
            </AppRouterCacheProvider>
        </>
    );
};

export default MyApp;
