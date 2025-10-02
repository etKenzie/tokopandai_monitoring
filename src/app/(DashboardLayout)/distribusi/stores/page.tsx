"use client";

import { Store, fetchStores } from "@/app/api/distribusi/StoreSlice";
import ProtectedRoute from "@/app/components/auth/ProtectedRoute";
import PageContainer from "@/app/components/container/PageContainer";
import StoreCategorySummary from "@/app/components/distribusi/StoreCategorySummary";
import StoresTable from "@/app/components/distribusi/StoresTable";
import { useAuth } from "@/app/context/AuthContext";
import { useCheckRoles } from "@/app/hooks/useCheckRoles";
import { getAgentNameFromRole, getPageRoles, getRestrictedRoles } from "@/config/roles";
import { Box, FormControl, Grid, InputLabel, MenuItem, Select, Typography } from "@mui/material";
import { useEffect, useState } from "react";

const StoresPage = () => {
  const { user, roles, refreshRoles } = useAuth();
  
  // Check access for allowed roles (configurable via roles config)
  const accessCheck = useCheckRoles(getPageRoles('DISTRIBUSI_DASHBOARD'));
  
  // Get restricted roles from config
  const restrictedRoles = getRestrictedRoles();
  
  // Check if current user has a restricted role
  const hasRestrictedRole = roles.some(role => restrictedRoles.includes(role));
  const userRoleForFiltering = roles.find(role => restrictedRoles.includes(role));
  
  // Log access check result for debugging
  console.log('Stores Access Check:', accessCheck);
  console.log('User roles:', roles);
  console.log('Has restricted role:', hasRestrictedRole);
  console.log('User role for filtering:', userRoleForFiltering);
  
  const [filters, setFilters] = useState({
    agent_name: '',
    areas: '',
    segment: '',
    user_status: 'Active',
    category: '',
    interval_months: 1
  });
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch stores data
  useEffect(() => {
    const fetchStoresData = async () => {
      setLoading(true);
      try {
        const response = await fetchStores({
          agent_name: hasRestrictedRole ? getAgentNameFromRole(userRoleForFiltering!) : filters.agent_name,
          areas: filters.areas,
          segment: filters.segment,
          user_status: filters.user_status,
          interval_months: filters.interval_months
        });
        setStores(response.data);
      } catch (error) {
        console.error('Failed to fetch stores:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStoresData();
  }, [filters.agent_name, filters.areas, filters.segment, filters.user_status, filters.interval_months, hasRestrictedRole, userRoleForFiltering]);

  return (
    <PageContainer title="Stores" description="View and manage stores">
      <Box>
        {/* Header */}
        <Box mb={3}>
          <Typography variant="h3" fontWeight="bold" mb={1}>
            Stores
          </Typography>
          <Typography variant="body1" color="textSecondary">
            View and manage store information and performance scores
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
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth>
                <InputLabel>User Status</InputLabel>
                <Select
                  value={filters.user_status}
                  label="User Status"
                  onChange={(e) => setFilters(prev => ({ ...prev, user_status: e.target.value }))}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {/* <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Time Interval</InputLabel>
                <Select
                  value={filters.interval_months}
                  label="Time Interval"
                  onChange={(e) => setFilters(prev => ({ ...prev, interval_months: Number(e.target.value) }))}
                >
                  <MenuItem value={1}>1 Month</MenuItem>
                  <MenuItem value={3}>3 Months</MenuItem>
                  <MenuItem value={6}>6 Months</MenuItem>
                  <MenuItem value={12}>12 Months</MenuItem>
                </Select>
              </FormControl>
            </Grid> */}
          </Grid>
        </Box>

        {/* Category Summary */}
        <StoreCategorySummary stores={stores} />

        <Box sx={{ 
          flex: 1,
          width: '100%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          gap: 3
        }}>
          <StoresTable 
            filters={filters}
            title="Stores"
            agentName={hasRestrictedRole ? getAgentNameFromRole(userRoleForFiltering!) : undefined}
          />
        </Box>
      </Box>
    </PageContainer>
  );
};

export default function ProtectedStoresPage() {
  return (
    <ProtectedRoute requiredRoles={getPageRoles('DISTRIBUSI_DASHBOARD')}>
      <StoresPage />
    </ProtectedRoute>
  );
}
