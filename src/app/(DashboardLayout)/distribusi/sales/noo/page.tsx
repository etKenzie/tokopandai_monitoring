"use client";

import ProtectedRoute from "@/app/components/auth/ProtectedRoute";
import PageContainer from "@/app/components/container/PageContainer";
import NOOTable from "@/app/components/distribusi/NOOTable";
import { useAuth } from "@/app/context/AuthContext";
import { useCheckRoles } from "@/app/hooks/useCheckRoles";
import { getAgentNameFromRole, getPageRoles, getRestrictedRoles } from "@/config/roles";
import { Box, FormControl, Grid, InputLabel, MenuItem, Select, Typography } from "@mui/material";
import { useEffect, useState } from "react";

const NOOPage = () => {
  const { user, roles, refreshRoles } = useAuth();
  
  // Check access for allowed roles (configurable via roles config)
  const accessCheck = useCheckRoles(getPageRoles('DISTRIBUSI_DASHBOARD'));
  
  // Get restricted roles from config
  const restrictedRoles = getRestrictedRoles();
  
  // Check if current user has a restricted role
  const hasRestrictedRole = roles.some(role => restrictedRoles.includes(role));
  const userRoleForFiltering = roles.find(role => restrictedRoles.includes(role));
  
  // Log access check result for debugging
  console.log('NOO Access Check:', accessCheck);
  console.log('User roles:', roles);
  console.log('Has restricted role:', hasRestrictedRole);
  console.log('User role for filtering:', userRoleForFiltering);

  // Initialize filters with empty values to avoid hydration mismatch
  const [filters, setFilters] = useState({
    month: '',
    year: '',
    agent: '',
    area: '',
    statusPayment: ''
  });

  // Set initial date values in useEffect to avoid hydration issues
  useEffect(() => {
    const currentDate = new Date();
    const currentMonth = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const currentYear = currentDate.getFullYear().toString();
    
    setFilters(prev => ({
      ...prev,
      month: currentMonth,
      year: currentYear
    }));
  }, []);

  return (
    <PageContainer title="New Ordering Outlet (NOO)" description="View new customers">
      <Box>
        {/* Header */}
        <Box mb={3}>
          <Typography variant="h3" fontWeight="bold" mb={1}>
            New Ordering Outlet (NOO)
          </Typography>
          <Typography variant="body1" color="textSecondary">
            View and analyze the new customers this month
          </Typography>
          {hasRestrictedRole && (
            <Typography variant="body2" color="info.main" sx={{ mt: 1, fontStyle: 'italic' }}>
              Showing data for {getAgentNameFromRole(userRoleForFiltering!)} only
            </Typography>
          )}
        </Box>

        {/* Filters */}
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Month</InputLabel>
                <Select
                  value={filters.month}
                  label="Month"
                  onChange={(e) => setFilters(prev => ({ ...prev, month: e.target.value }))}
                >
                  {Array.from({ length: 12 }, (_, i) => {
                    const month = (i + 1).toString().padStart(2, '0');
                    const monthNames = [
                      'January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'
                    ];
                    return (
                      <MenuItem key={month} value={month}>
                        {monthNames[i]}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Year</InputLabel>
                <Select
                  value={filters.year}
                  label="Year"
                  onChange={(e) => setFilters(prev => ({ ...prev, year: e.target.value }))}
                >
                  {Array.from({ length: 6 }, (_, i) => {
                    const year = (new Date().getFullYear() - i).toString();
                    return (
                      <MenuItem key={year} value={year}>
                        {year}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Payment Status</InputLabel>
                <Select
                  value={filters.statusPayment}
                  label="Payment Status"
                  onChange={(e) => setFilters(prev => ({ ...prev, statusPayment: e.target.value }))}
                >
                  <MenuItem value="">All Status</MenuItem>
                  <MenuItem value="LUNAS">LUNAS</MenuItem>
                  <MenuItem value="BELUM LUNAS">BELUM LUNAS</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>

        <Box sx={{ 
          flex: 1,
          width: '100%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          gap: 3
        }}>
          <NOOTable 
            filters={filters}
            title="Number of Orders (NOO)"
            hasRestrictedRole={hasRestrictedRole}
            userRoleForFiltering={userRoleForFiltering}
          />
        </Box>
      </Box>
    </PageContainer>
  );
};

export default function ProtectedNOOPage() {
  return (
    <ProtectedRoute requiredRoles={getPageRoles('DISTRIBUSI_DASHBOARD')}>
      <NOOPage />
    </ProtectedRoute>
  );
}
