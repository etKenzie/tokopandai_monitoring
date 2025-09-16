'use client';

import { fetchNOOData, fetchOrderFilters, fetchTotalStores, fetchUpdatedSalesSummary, fetchUpdatedSalesSummaryMonthly, MonthlySummaryData, NOOOrder, OrderFiltersData, SalesSummaryData, TotalStoresData } from '@/app/api/distribusi/DistribusiSlice';
import ProtectedRoute from '@/app/components/auth/ProtectedRoute';
import PageContainer from '@/app/components/container/PageContainer';
import { DistribusiFilterValues } from '@/app/components/distribusi/DistribusiFilters';
import NOOTable from '@/app/components/distribusi/NOOTable';
import SalesMonthlyChart from '@/app/components/distribusi/SalesMonthlyChart';
import StoresMonthlyChart from '@/app/components/distribusi/StoresMonthlyChart';
import SummaryTiles from '@/app/components/shared/SummaryTiles';
import { useAuth } from '@/app/context/AuthContext';
import { useSettings } from '@/app/context/SettingsContext';
import { useCheckRoles } from '@/app/hooks/useCheckRoles';
import { getAgentNameFromRole, getPageRoles, getRestrictedRoles } from '@/config/roles';
import { Box, FormControl, Grid, InputLabel, MenuItem, Select, SelectChangeEvent, Typography } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { goalProfit } from '../../goalProfit';

const SalesOverview = () => {
  const { user, roles, refreshRoles } = useAuth();
  const { settings } = useSettings();
  
  // Check access for allowed roles (configurable via roles config)
  const accessCheck = useCheckRoles(getPageRoles('DISTRIBUSI_DASHBOARD'));
  
  // Get restricted roles from config
  const restrictedRoles = getRestrictedRoles();
  
  // Check if current user has a restricted role
  const hasRestrictedRole = roles.some(role => restrictedRoles.includes(role));
  const userRoleForFiltering = roles.find(role => restrictedRoles.includes(role));
  
  // Log access check result for debugging
  console.log('Sales Overview Access Check:', accessCheck);
  console.log('User roles:', roles);
  console.log('Has restricted role:', hasRestrictedRole);
  console.log('User role for filtering:', userRoleForFiltering);
  
  const [salesData, setSalesData] = useState<SalesSummaryData | null>(null);
  const [monthlySummaryData, setMonthlySummaryData] = useState<MonthlySummaryData[]>([]);
  const [totalStoresData, setTotalStoresData] = useState<TotalStoresData | null>(null);
  const [nooData, setNOOData] = useState<NOOOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [monthlyLoading, setMonthlyLoading] = useState(false);
  const [totalStoresLoading, setTotalStoresLoading] = useState(false);
  const [nooLoading, setNOOLoading] = useState(false);
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
        
        // For users with restricted roles, use their mapped agent name instead of filter selection
        const agentName = hasRestrictedRole ? getAgentNameFromRole(userRoleForFiltering!) : (currentFilters.agent || undefined);
        
        const response = await fetchUpdatedSalesSummary({
          month: formattedMonth,
          agent_name: agentName,
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
  }, [hasRestrictedRole, userRoleForFiltering]);

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
        
        // For users with restricted roles, use their mapped agent name instead of filter selection
        const agentName = hasRestrictedRole ? getAgentNameFromRole(userRoleForFiltering!) : (currentFilters.agent || undefined);
        
        const response = await fetchTotalStores({
          month: formattedMonth,
          agent_name: agentName,
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
  }, [hasRestrictedRole, userRoleForFiltering]);

  const fetchMonthlySummaryCallback = useCallback(async (currentFilters: DistribusiFilterValues, paymentStatus: string) => {
    console.log('Fetching monthly summary data with filters:', currentFilters, 'payment status:', paymentStatus);
    setMonthlyLoading(true);
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
        
        // Get the last 3 months for the monthly trend
        const currentDate = new Date(parseInt(currentFilters.year), parseInt(currentFilters.month) - 1);
        const startDate = new Date(currentDate);
        startDate.setMonth(startDate.getMonth() - 2);
        
        const startMonth = `${monthNames[startDate.getMonth()]} ${startDate.getFullYear()}`;

        // For users with restricted roles, use their mapped agent name instead of filter selection
        const agentName = hasRestrictedRole ? getAgentNameFromRole(userRoleForFiltering!) : (currentFilters.agent || undefined);
        
        const response = await fetchUpdatedSalesSummaryMonthly({
          start_month: startMonth,
          end_month: formattedMonth,
          agent_name: agentName,
          area: currentFilters.area || undefined,
          status_payment: paymentStatus || undefined,
        });
        console.log('Monthly summary data response:', response);
        setMonthlySummaryData(response.data);
      } else {
        setMonthlySummaryData([]);
      }
    } catch (err) {
      console.error('Failed to fetch monthly summary data:', err);
      setMonthlySummaryData([]);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setMonthlyLoading(false);
    }
  }, [hasRestrictedRole, userRoleForFiltering]);

  const fetchNOOCallback = useCallback(async (currentFilters: DistribusiFilterValues, paymentStatus: string) => {
    console.log('=== fetchNOOCallback called ===');
    console.log('Fetching NOO data with filters:', currentFilters, 'payment status:', paymentStatus);
    setNOOLoading(true);
    try {
      // Only fetch data if we have month and year (required)
      if (currentFilters.month && currentFilters.year) {
        // Format month for API (e.g., "08" -> "August 2025")
        const monthNames = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ];
        const monthIndex = parseInt(currentFilters.month, 10) - 1;
        const monthName = monthNames[monthIndex];
        const formattedMonth = `${monthName} ${currentFilters.year}`;
        
        console.log('NOO Month formatting:', {
          originalMonth: currentFilters.month,
          monthIndex: monthIndex,
          monthName: monthName,
          formattedMonth: formattedMonth,
          year: currentFilters.year
        });
        
        // For users with restricted roles, use their mapped agent name instead of filter selection
        const agentName = hasRestrictedRole ? getAgentNameFromRole(userRoleForFiltering!) : (currentFilters.agent || undefined);
        
        const response = await fetchNOOData({
          month: formattedMonth,
          agent: agentName,
          area: currentFilters.area || undefined,
          status_payment: paymentStatus || undefined,
        });
        console.log('NOO data response:', response);
        setNOOData(response.data);
      } else {
        setNOOData([]);
      }
    } catch (err) {
      console.error('Failed to fetch NOO data:', err);
      setNOOData([]);
    } finally {
      setNOOLoading(false);
    }
  }, [hasRestrictedRole, userRoleForFiltering]);

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
      fetchMonthlySummaryCallback(filters, statusPayment);
      fetchNOOCallback(filters, statusPayment);
      fetchFiltersCallback(filters.month, filters.year);
    }
  }, [filters.month, filters.year, filters.agent, filters.area, statusPayment, fetchSalesDataCallback, fetchTotalStoresCallback, fetchMonthlySummaryCallback, fetchNOOCallback, fetchFiltersCallback]);

  // Get goal profit based on selected agent and month
  const getGoalProfit = () => {
    if (!filters.month || !filters.year) return 0;
    
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthName = monthNames[parseInt(filters.month) - 1];
    const monthYear = `${monthName} ${filters.year}`;
    
    // For users with restricted roles, use their mapped agent name, otherwise use selected agent or default to NATIONAL
    const agentKey = hasRestrictedRole ? getAgentNameFromRole(userRoleForFiltering!) : (filters.agent || 'NATIONAL');
    
    // First try to get from configurable settings
    if (settings?.goal_profit) {
      if (settings.goal_profit[agentKey] && settings.goal_profit[agentKey][monthYear]) {
        console.log('Found goal profit in settings for agent:', { agentKey, monthYear, value: settings.goal_profit[agentKey][monthYear] });
        return settings.goal_profit[agentKey][monthYear];
      }
      
      // Fallback to NATIONAL if agent not found in settings
      if (settings.goal_profit['NATIONAL'] && settings.goal_profit['NATIONAL'][monthYear]) {
        console.log('Using NATIONAL goal profit from settings:', { monthYear, value: settings.goal_profit['NATIONAL'][monthYear] });
        return settings.goal_profit['NATIONAL'][monthYear];
      }
    }
    
    // Fallback to static goalProfit data if settings not available
    // Convert to lowercase for static data lookup
    const staticMonthYear = `${monthName.toLowerCase()} ${filters.year}`;
    console.log('Goal Profit Lookup (fallback to static):', { agentKey, monthYear: staticMonthYear, availableAgents: Object.keys(goalProfit) });
    
    // Check if agent exists in goalProfit data
    if (goalProfit[agentKey] && goalProfit[agentKey][staticMonthYear]) {
      console.log('Found goal profit for agent (static):', { agentKey, monthYear: staticMonthYear, value: goalProfit[agentKey][staticMonthYear] });
      return goalProfit[agentKey][staticMonthYear];
    }
    
    // Fallback to NATIONAL if agent not found
    if (goalProfit['NATIONAL'] && goalProfit['NATIONAL'][staticMonthYear]) {
      console.log('Using NATIONAL goal profit (static):', { monthYear: staticMonthYear, value: goalProfit['NATIONAL'][staticMonthYear] });
      return goalProfit['NATIONAL'][staticMonthYear];
    }
    
    console.log('No goal profit found for:', { agentKey, monthYear });
    return 0;
  };

  // Calculate days remaining until target date
  const getDaysRemaining = () => {
    // Use configurable target date from settings, fallback to default
    const targetDateStr = settings?.target_date || '2025-10-03';
    const targetDate = new Date(targetDateStr);
    const today = new Date();
    
    // Reset time to start of day for accurate day calculation
    today.setHours(0, 0, 0, 0);
    targetDate.setHours(0, 0, 0, 0);
    
    const timeDiff = targetDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    return Math.max(0, daysDiff); // Return 0 if target date has passed
  };

  // Prepare currency summary tiles data
  const getCurrencySummaryTiles = () => {
    return [
      // First row - 4 tiles
      {
        title: 'Total Invoice',
        value: salesData?.total_invoice || 0,
        isCurrency: true,
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
        title: 'Goal Profit',
        value: getGoalProfit(),
        isCurrency: true,
        mdSize: 3,
        isLoading: false
      },
      {
        title: 'Profit Remaining',
        value:  (salesData?.total_profit || 0) - getGoalProfit(),
        isCurrency: true,
        mdSize: 3,
        isLoading: loading && !salesData,
        color: ( (salesData?.total_profit || 0) - getGoalProfit()) >= 0 ? 'success.main' : 'error.main'
      },
      // Second row - 4 tiles
      {
        title: 'Average Daily Profit',
        value: salesData?.average_profit_day || 0,
        isCurrency: true,
        mdSize: 3,
        isLoading: loading && !salesData
      },
      {
        title: 'Average Weekly Profit',
        value: salesData?.average_profit_week || 0,
        isCurrency: true,
        mdSize: 3,
        isLoading: loading && !salesData
      },
      {
        title: 'Days Remaining',
        value: getDaysRemaining(),
        isCurrency: false,
        unit: ' days',
        mdSize: 3,
        isLoading: false,
        color: getDaysRemaining() <= 30 ? 'error.main' : getDaysRemaining() <= 90 ? 'warning.main' : 'success.main'
      },
      {
        title: 'Profit Progress',
        value: getGoalProfit() > 0 ? ((salesData?.total_profit || 0) / getGoalProfit()) * 100 : 0,
        isCurrency: false,
        unit: '%',
        mdSize: 3,
        isLoading: loading && !salesData,
        color: getGoalProfit() > 0 ? ((salesData?.total_profit || 0) / getGoalProfit()) >= 1 ? 'success.main' : 'warning.main' : 'text.primary'
      }
    ];
  };

  // Prepare non-currency summary tiles data
  const getNonCurrencySummaryTiles = () => {
    return [
      {
        title: 'Invoice Count',
        value: salesData?.invoice_count || 0,
        isCurrency: false,
        mdSize: 2.4,
        isLoading: loading && !salesData
      },
      {
        title: 'Active Stores',
        value: totalStoresData?.active_stores || 0,
        isCurrency: false,
        mdSize: 2.4,
        isLoading: totalStoresLoading && !totalStoresData
      },
      {
        title: 'Total Stores',
        value: totalStoresData?.total_stores || 0,
        isCurrency: false,
        mdSize: 2.4,
        isLoading: totalStoresLoading && !totalStoresData
      },
      {
        title: 'Activation Rate',
        value: totalStoresData?.activation_rate || 0,
        isCurrency: false,
        unit: '%',
        mdSize: 2.4,
        isLoading: totalStoresLoading && !totalStoresData
      },
      {
        title: 'Margin',
        value: salesData?.margin || 0,
        isCurrency: false,
        unit: '%',
        mdSize: 2.4,
        isLoading: loading && !salesData
      },
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
          {hasRestrictedRole && (
            <Typography variant="body2" color="info.main" sx={{ mt: 1, fontStyle: 'italic' }}>
              Showing data for {getAgentNameFromRole(userRoleForFiltering!)} only
            </Typography>
          )}
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
                  disabled={filtersLoading || hasRestrictedRole}
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

        {/* Currency Summary Tiles */}
        <Box mb={3}>
          {error ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="200px">
              <Typography variant="body1" color="error">
                {error}
              </Typography>
            </Box>
          ) : (
            <SummaryTiles tiles={getCurrencySummaryTiles()} />
          )}
        </Box>

        {/* Monthly Sales Chart */}
        <Box mb={3}>
          <SalesMonthlyChart 
            filters={{
              agent: hasRestrictedRole ? getAgentNameFromRole(userRoleForFiltering!) : filters.agent,
              area: filters.area,
              month: filters.month,
              year: filters.year,
              status_payment: statusPayment
            }}
            monthlyData={monthlySummaryData}
          />
        </Box>

        {/* Non-Currency Metrics */}
        <Box mb={3}>
          {/* <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
            Performance Metrics
          </Typography> */}
          {error ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="200px">
              <Typography variant="body1" color="error">
                {error}
              </Typography>
            </Box>
          ) : (
            <SummaryTiles tiles={getNonCurrencySummaryTiles()} />
          )}
        </Box>

        {/* Monthly Stores Chart */}
        <Box mb={3}>
          <StoresMonthlyChart 
            filters={{
              agent: hasRestrictedRole ? getAgentNameFromRole(userRoleForFiltering!) : filters.agent,
              area: filters.area,
              month: filters.month,
              year: filters.year,
              status_payment: statusPayment
            }}
          />
        </Box>

        {/* NOO Table */}
        <Box mb={3}>
          <NOOTable 
            filters={{
              agent: filters.agent,
              area: filters.area,
              month: filters.month,
              year: filters.year,
              statusPayment: statusPayment
            }}
            title="Number of Orders (NOO)"
            hasRestrictedRole={hasRestrictedRole}
            userRoleForFiltering={userRoleForFiltering}
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
