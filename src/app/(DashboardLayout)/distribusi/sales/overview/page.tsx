'use client';

import { OrderFiltersData, SalesSummaryData, TotalStoresData, fetchOrderFilters, fetchSalesSummary, fetchTotalStores } from '@/app/api/distribusi/DistribusiSlice';
import ProtectedRoute from '@/app/components/auth/ProtectedRoute';
import PageContainer from '@/app/components/container/PageContainer';
import { DistribusiFilterValues } from '@/app/components/distribusi/DistribusiFilters';
import SalesMonthlyChart from '@/app/components/distribusi/SalesMonthlyChart';
import StoresMonthlyChart from '@/app/components/distribusi/StoresMonthlyChart';
import SummaryTiles from '@/app/components/shared/SummaryTiles';
import { useAuth } from '@/app/context/AuthContext';
import { useCheckRoles } from '@/app/hooks/useCheckRoles';
import { getPageRoles } from '@/config/roles';
import { Box, FormControl, Grid, InputLabel, MenuItem, Select, SelectChangeEvent, Typography } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';

const SalesOverview = () => {
  const { user, roles, refreshRoles } = useAuth();
  
  // Check access for allowed roles (configurable via roles config)
  const accessCheck = useCheckRoles(getPageRoles('DISTRIBUSI_DASHBOARD'));
  
  // Log access check result for debugging
  console.log('Sales Overview Access Check:', accessCheck);
  
  const [salesData, setSalesData] = useState<SalesSummaryData | null>(null);
  const [totalStoresData, setTotalStoresData] = useState<TotalStoresData | null>(null);
  const [loading, setLoading] = useState(false);
  const [totalStoresLoading, setTotalStoresLoading] = useState(false);
  const [availableFilters, setAvailableFilters] = useState<OrderFiltersData | null>(null);
  const [filtersLoading, setFiltersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize filters with empty values to avoid hydration mismatch
  const [filters, setFilters] = useState<DistribusiFilterValues>({
    month: '',
    year: '',
    agent: '',
    area: ''
  });

  // Additional filter for status_payment
  const [statusPayment, setStatusPayment] = useState<string>('');

  // Set initial date values in useEffect to avoid hydration issues
  useEffect(() => {
    const currentDate = new Date();
    const currentMonth = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const currentYear = currentDate.getFullYear().toString();
    
    setFilters((prev: DistribusiFilterValues) => ({
      ...prev,
      month: currentMonth,
      year: currentYear
    }));
  }, []);

  const fetchSalesDataCallback = useCallback(async (currentFilters: DistribusiFilterValues, paymentStatus: string) => {
    console.log('Fetching sales data with filters:', currentFilters, 'payment status:', paymentStatus);
    setLoading(true);
    try {
      // Only fetch data if we have month and year (required)
      if (currentFilters.month && currentFilters.year) {
        // Format month for API (e.g., "08" -> "August 2025")
        const monthNames = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ];
        const monthName = monthNames[parseInt(currentFilters.month) - 1];
        const formattedMonth = `${monthName} ${currentFilters.year}`;
        
        const response = await fetchSalesSummary({
          month: formattedMonth,
          agent_name: currentFilters.agent || undefined,
          area: currentFilters.area || undefined,
          status_payment: paymentStatus || undefined,
        });
        console.log('Sales data response:', response);
        setSalesData(response.data);
      } else {
        setSalesData(null);
      }
    } catch (err) {
      console.error('Failed to fetch sales data:', err);
      setSalesData(null);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTotalStoresCallback = useCallback(async (currentFilters: DistribusiFilterValues, paymentStatus: string) => {
    console.log('Fetching total stores data with filters:', currentFilters, 'payment status:', paymentStatus);
    setTotalStoresLoading(true);
    try {
      // Only fetch data if we have month and year (required)
      if (currentFilters.month && currentFilters.year) {
        // Format month for API (e.g., "08" -> "August 2025")
        const monthNames = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ];
        const monthName = monthNames[parseInt(currentFilters.month) - 1];
        const formattedMonth = `${monthName} ${currentFilters.year}`;
        
        const response = await fetchTotalStores({
          month: formattedMonth,
          agent_name: currentFilters.agent || undefined,
          area: currentFilters.area || undefined,
          status_payment: paymentStatus || undefined,
        });
        console.log('Total stores data response:', response);
        setTotalStoresData(response.data);
      } else {
        setTotalStoresData(null);
      }
    } catch (err) {
      console.error('Failed to fetch total stores data:', err);
      setTotalStoresData(null);
    } finally {
      setTotalStoresLoading(false);
    }
  }, []);

  const fetchFiltersCallback = useCallback(async (month: string, year: string) => {
    setFiltersLoading(true);
    try {
      if (month && year) {
        // Format month for API (e.g., "08" -> "August 2025")
        const monthNames = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ];
        const monthName = monthNames[parseInt(month) - 1];
        const formattedMonth = `${monthName} ${year}`;
        
        const response = await fetchOrderFilters({
          month: formattedMonth,
        });
        setAvailableFilters(response.data);
      } else {
        setAvailableFilters(null);
      }
    } catch (error) {
      console.error('Failed to fetch filters:', error);
      setAvailableFilters(null);
    } finally {
      setFiltersLoading(false);
    }
  }, []);

  const handleFiltersChange = useCallback((newFilters: DistribusiFilterValues) => {
    console.log('Filters changed:', newFilters);
    setFilters(newFilters);
    // Reset data to show loading state when filters change
    setSalesData(null);
    setTotalStoresData(null);
  }, []);

  const handleStatusPaymentChange = useCallback((event: SelectChangeEvent<string>) => {
    const newStatus = event.target.value;
    console.log('Status payment changed:', newStatus);
    setStatusPayment(newStatus);
    // Reset data to show loading state when status payment changes
    setSalesData(null);
    setTotalStoresData(null);
  }, []);

  useEffect(() => {
    // Only fetch data if month and year are set (after initialization)
    if (filters.month && filters.year) {
      fetchSalesDataCallback(filters, statusPayment);
      fetchTotalStoresCallback(filters, statusPayment);
      fetchFiltersCallback(filters.month, filters.year);
    }
  }, [filters.month, filters.year, filters.agent, filters.area, statusPayment, fetchSalesDataCallback, fetchTotalStoresCallback, fetchFiltersCallback]);

  // Prepare summary tiles data with individual loading states
  const getSummaryTiles = () => {
    return [
      {
        title: 'Total Invoice',
        value: salesData?.total_invoice || 0,
        isCurrency: true,
        mdSize: 3,
        isLoading: loading && !salesData
      },
      {
        title: 'Invoice Count',
        value: salesData?.invoice_count || 0,
        isCurrency: false,
        mdSize: 3,
        isLoading: loading && !salesData
      },
      {
        title: 'Total Profit',
        value: salesData?.total_profit || 0,
        isCurrency: true,
        mdSize: 3,
        isLoading: loading && !salesData
      },
      {
        title: 'Average Payment Days',
        value: salesData?.avg_payment_days || 0,
        isCurrency: false,
        unit: ' Days',
        mdSize: 3,
        isLoading: loading && !salesData
      },
      {
        title: 'Active Stores',
        value: totalStoresData?.active_stores || 0,
        isCurrency: false,
        mdSize: 3,
        isLoading: totalStoresLoading && !totalStoresData
      },
      {
        title: 'Total Stores',
        value: totalStoresData?.total_stores || 0,
        isCurrency: false,
        mdSize: 3,
        isLoading: totalStoresLoading && !totalStoresData
      },
      {
        title: 'Activation Rate',
        value: totalStoresData?.activation_rate || 0,
        isCurrency: false,
        unit: '%',
        mdSize: 3,
        isLoading: totalStoresLoading && !totalStoresData
      },
      {
        title: 'Margin',
        value: salesData?.margin || 0,
        isCurrency: true,
        unit: '%',
        mdSize: 3,
        isLoading: loading && !salesData
      }
    ];
  };

  return (
    <PageContainer title="Sales Overview" description="Monitor sales performance and metrics">
      <Box>
        {/* Header */}
        <Box mb={3}>
          <Typography variant="h3" fontWeight="bold" mb={1}>
            Sales Overview
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Monitor sales performance, invoice metrics, and store statistics
          </Typography>
        </Box>

        {/* Filters */}
        <Box mb={3}>
          <Grid container spacing={2}>
            {/* Month Filter */}
            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Month</InputLabel>
                <Select
                  value={filters.month}
                  label="Month"
                  onChange={(e) => handleFiltersChange({ ...filters, month: e.target.value })}
                >
                  {Array.from({ length: 12 }, (_, i) => {
                    const monthNum = (i + 1).toString().padStart(2, '0');
                    const monthName = new Date(2024, i).toLocaleString('en-US', { month: 'long' });
                    return (
                      <MenuItem key={monthNum} value={monthNum}>
                        {monthName}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Grid>

            {/* Year Filter */}
            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Year</InputLabel>
                <Select
                  value={filters.year}
                  label="Year"
                  onChange={(e) => handleFiltersChange({ ...filters, year: e.target.value })}
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

            {/* Agent Filter */}
            <Grid size={{ xs: 12, sm: 6, md: 2.4  }}>
              <FormControl fullWidth size="small">
                <InputLabel>Agent</InputLabel>
                <Select
                  value={filters.agent}
                  label="Agent"
                  onChange={(e) => handleFiltersChange({ ...filters, agent: e.target.value })}
                  disabled={filtersLoading}
                >
                  <MenuItem value="">All Agents</MenuItem>
                  {availableFilters?.agents.map((agent) => (
                    <MenuItem key={agent} value={agent}>
                      {agent}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Area Filter */}
            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Area</InputLabel>
                <Select
                  value={filters.area}
                  label="Area"
                  onChange={(e) => handleFiltersChange({ ...filters, area: e.target.value })}
                  disabled={filtersLoading}
                >
                  <MenuItem value="">All Areas</MenuItem>
                  {availableFilters?.areas.map((area) => (
                    <MenuItem key={area} value={area}>
                      {area}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Payment Status Filter */}
            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Payment Status</InputLabel>
                <Select
                  value={statusPayment}
                  label="Payment Status"
                  onChange={handleStatusPaymentChange}
                >
                  <MenuItem value="">All Status</MenuItem>
                  <MenuItem value="LUNAS">LUNAS</MenuItem>
                  <MenuItem value="BELUM LUNAS">BELUM LUNAS</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>

        {/* Summary Tiles */}
        <Box mb={3}>
          {error ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="200px">
              <Typography variant="body1" color="error">
                {error}
              </Typography>
            </Box>
          ) : (
            <SummaryTiles tiles={getSummaryTiles()} />
          )}
        </Box>

        {/* Monthly Sales Chart */}
        <Box mb={3}>
          <SalesMonthlyChart 
            filters={{
              agent: filters.agent,
              area: filters.area,
              month: filters.month,
              year: filters.year,
              status_payment: statusPayment
            }}
          />
        </Box>

        {/* Monthly Stores Chart */}
        <Box mb={3}>
          <StoresMonthlyChart 
            filters={{
              agent: filters.agent,
              area: filters.area,
              month: filters.month,
              year: filters.year,
              status_payment: statusPayment
            }}
          />
        </Box>
      </Box>
    </PageContainer>
  );
};

export default function ProtectedSalesOverview() {
  return (
    <ProtectedRoute requiredRoles={getPageRoles('DISTRIBUSI_DASHBOARD')}>
      <SalesOverview />
    </ProtectedRoute>
  );
}
