"use client";

import { StoreMonthly, fetchStoreMonthly } from "@/app/api/distribusi/StoreSlice";
import ProtectedRoute from "@/app/components/auth/ProtectedRoute";
import PageContainer from "@/app/components/container/PageContainer";
import StoreMonthlyTable from "@/app/components/distribusi/StoreMonthlyTable";
import { useAuth } from "@/app/context/AuthContext";
import { useCheckRoles } from "@/app/hooks/useCheckRoles";
import { getPageRoles } from "@/config/roles";
import { Box, FormControl, Grid, InputLabel, MenuItem, Select, Typography } from "@mui/material";
import { useCallback, useEffect, useState } from "react";

const StoresMonthlyPage = () => {
  const { user, roles, refreshRoles } = useAuth();
  
  // Check access for allowed roles (configurable via roles config)
  const accessCheck = useCheckRoles(getPageRoles('DISTRIBUSI_DASHBOARD'));
  
  // Log access check result for debugging
  console.log('Stores Monthly Access Check:', accessCheck);
  console.log('User roles:', roles);
  
  const [stores, setStores] = useState<StoreMonthly[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('');

  // Generate month options for the last 12 months
  const generateMonthOptions = () => {
    const options = [];
    const currentDate = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthName = date.toLocaleString('en-US', { month: 'long' });
      const year = date.getFullYear();
      const value = `${monthName} ${year}`;
      
      options.push({
        value,
        label: value
      });
    }
    
    return options;
  };

  const monthOptions = generateMonthOptions();

  // Set initial month to current month
  useEffect(() => {
    const currentDate = new Date();
    const currentMonth = currentDate.toLocaleString('en-US', { month: 'long' });
    const currentYear = currentDate.getFullYear();
    setSelectedMonth(`${currentMonth} ${currentYear}`);
  }, []);

  // Fetch stores monthly data
  const fetchStoresData = useCallback(async () => {
    if (!selectedMonth) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await fetchStoreMonthly(selectedMonth);
      setStores(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch store monthly data');
      console.error('Failed to fetch store monthly data:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    fetchStoresData();
  }, [fetchStoresData]);

  const handleMonthChange = (event: any) => {
    setSelectedMonth(event.target.value);
  };

  return (
    <PageContainer title="Stores Monthly" description="View store monthly performance">
      <Box>
        {/* Header */}
        <Box mb={3}>
          <Typography variant="h3" fontWeight="bold" mb={1}>
            Stores Monthly
          </Typography>
          <Typography variant="body1" color="textSecondary">
            View store performance metrics for a specific month
          </Typography>
        </Box>

        {/* Month Filter */}
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Select Month</InputLabel>
                <Select
                  value={selectedMonth}
                  label="Select Month"
                  onChange={handleMonthChange}
                >
                  {monthOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>

        {/* Error Display */}
        {error && (
          <Box mb={3}>
            <Typography variant="body1" color="error">
              {error}
            </Typography>
          </Box>
        )}

        <Box sx={{ 
          flex: 1,
          width: '100%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          gap: 3
        }}>
          <StoreMonthlyTable 
            stores={stores}
            loading={loading}
            onRefresh={fetchStoresData}
            title={`Store Performance - ${selectedMonth}`}
          />
        </Box>
      </Box>
    </PageContainer>
  );
};

export default function ProtectedStoresMonthlyPage() {
  return (
    <ProtectedRoute requiredRoles={getPageRoles('DISTRIBUSI_DASHBOARD')}>
      <StoresMonthlyPage />
    </ProtectedRoute>
  );
}
