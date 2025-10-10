'use client';

import { fetchOrderFilters, fetchTotalStores, fetchUpdatedSalesSummary, fetchUpdatedSalesSummaryMonthly, MonthlySummaryData, OrderFiltersData, SalesSummaryData, TotalStoresData } from '@/app/api/distribusi/DistribusiSlice';
import ProtectedRoute from '@/app/components/auth/ProtectedRoute';
import PageContainer from '@/app/components/container/PageContainer';
import { DistribusiFilterValues } from '@/app/components/distribusi/DistribusiFilters';
import OrderTypeChart from '@/app/components/distribusi/OrderTypeChart';
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
  const [loading, setLoading] = useState(false);
  const [monthlyLoading, setMonthlyLoading] = useState(false);
  const [totalStoresLoading, setTotalStoresLoading] = useState(false);
  const [availableFilters, setAvailableFilters] = useState<OrderFiltersData | null>(null);
  const [filtersLoading, setFiltersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize filters with empty values to avoid hydration mismatch
  const [filters, setFilters] = useState<DistribusiFilterValues>({
    month: '',
    year: '',
    agent: '',
    area: '',
    segment: ''
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
          segment: currentFilters.segment || undefined,
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
          segment: currentFilters.segment || undefined,
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
          segment: currentFilters.segment || undefined,
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
      fetchFiltersCallback(filters.month, filters.year);
    }
  }, [filters.month, filters.year, filters.agent, filters.area, filters.segment, statusPayment, fetchSalesDataCallback, fetchTotalStoresCallback, fetchMonthlySummaryCallback, fetchFiltersCallback]);

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

  // Get profit goals for chart range (for monthly chart)
  const getProfitGoalsForChart = () => {
    if (!settings?.goal_profit) return {};
    
    // For users with restricted roles, use their mapped agent name, otherwise use selected agent or default to NATIONAL
    const agentKey = hasRestrictedRole ? getAgentNameFromRole(userRoleForFiltering!) : (filters.agent || 'NATIONAL');
    
    // Get goals for the selected agent, fallback to NATIONAL
    const agentGoals = settings.goal_profit[agentKey] || settings.goal_profit['NATIONAL'] || {};
    
    console.log('Profit goals for chart:', { agentKey, goals: agentGoals });
    return agentGoals;
  };

  // Get goal profits for all agents (for OrderTypeChart when grouping by agent)
  const getGoalProfitByAgent = () => {
    if (!filters.month || !filters.year) return {};
    
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthName = monthNames[parseInt(filters.month) - 1];
    const monthYear = `${monthName} ${filters.year}`;
    const staticMonthYear = `${monthName.toLowerCase()} ${filters.year}`;
    
    const goalProfitByAgent: { [agentName: string]: number } = {};
    
    // Get goal profits from settings first, then fallback to static data
    if (settings?.goal_profit) {
      Object.keys(settings.goal_profit).forEach(agentKey => {
        if (settings.goal_profit![agentKey] && settings.goal_profit![agentKey][monthYear]) {
          goalProfitByAgent[agentKey] = settings.goal_profit![agentKey][monthYear];
        }
      });
    }
    
    // Fallback to static goalProfit data for any missing agents
    Object.keys(goalProfit).forEach(agentKey => {
      if (!goalProfitByAgent[agentKey] && goalProfit[agentKey] && goalProfit[agentKey][staticMonthYear]) {
        goalProfitByAgent[agentKey] = goalProfit[agentKey][staticMonthYear];
      }
    });
    
    console.log('Goal profit by agent:', { monthYear, staticMonthYear, goalProfitByAgent });
    return goalProfitByAgent;
  };

  // Calculate days remaining until target date (excluding Sundays)
  const getDaysRemaining = () => {
    // Use configurable target date from settings, fallback to default
    const targetDateStr = settings?.target_date || '2025-10-03';
    const targetDate = new Date(targetDateStr);
    const today = new Date();
    
    // Reset time to start of day for accurate day calculation
    today.setHours(0, 0, 0, 0);
    targetDate.setHours(0, 0, 0, 0);
    
    // If target date has passed, return 0
    if (targetDate <= today) {
      return 0;
    }
    
    // Count working days (excluding Sundays) between today and target date
    let workingDays = 0;
    const currentDate = new Date(today);
    
    while (currentDate < targetDate) {
      // Check if current day is not Sunday (0 = Sunday)
      if (currentDate.getDay() !== 0) {
        workingDays++;
      }
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return workingDays;
  };

  // Calculate daily and weekly profit to goal
  const getDailyProfitToGoal = () => {
    const profitRemaining = (salesData?.total_profit || 0) - getGoalProfit();
    const daysRemaining = getDaysRemaining();
    
    // If goal is already met or exceeded, return 0
    if (profitRemaining >= 0) {
      return 0;
    }
    
    // Return positive number (absolute value) representing profit needed per day
    return daysRemaining > 0 ? Math.abs(profitRemaining) / daysRemaining : 0;
  };

  const getWeeklyProfitToGoal = () => {
    const profitRemaining = (salesData?.total_profit || 0) - getGoalProfit();
    const weeksRemaining = getDaysRemaining() / 7;
    
    // If goal is already met or exceeded, return 0
    if (profitRemaining >= 0) {
      return 0;
    }
    
    // Return positive number (absolute value) representing profit needed per week
    return weeksRemaining > 0 ? Math.abs(profitRemaining) / weeksRemaining : 0;
  };

  // Dynamic color calculation based on progress percentage
  const getProgressColor = (progressPercentage: number) => {
    if (progressPercentage >= 100) {
      return '#22c55e'; // Green for 100% and above
    } else if (progressPercentage >= 80) {
      return '#f59e0b'; // Orange for 80-99%
    } else if (progressPercentage >= 60) {
      return '#d97706'; // Dark orange for 60-79%
    } else if (progressPercentage >= 40) {
      return '#f87171'; // Light red for 40-59%
    } else if (progressPercentage >= 20) {
      return '#ef4444'; // Red for 20-39%
    } else {
      return '#dc2626'; // Dark red for 0-19%
    }
  };

  // Calculate progress percentage for profit to goal metrics
  const getProfitToGoalProgress = (currentValue: number, targetValue: number) => {
    if (targetValue === 0) return 100; // If no target, consider it 100%
    return Math.min(100, (currentValue / targetValue) * 100);
  };

  // Prepare currency summary tiles data
  const getCurrencySummaryTiles = () => {
    return [
      // First row - 6 tiles
      {
        title: 'Total Invoice',
        value: salesData?.total_invoice || 0,
        isCurrency: true,
        mdSize: 2.4,
        isLoading: loading && !salesData
      },
      {
        title: 'Total Profit',
        value: salesData?.total_profit || 0,
        isCurrency: true,
        mdSize: 2.4,
        isLoading: loading && !salesData
      },
      {
        title: 'Goal Profit',
        value: getGoalProfit(),
        isCurrency: true,
        mdSize: 2.4,
        isLoading: false
      },
      {
        title: 'Profit Remaining',
        value:  (salesData?.total_profit || 0) - getGoalProfit(),
        isCurrency: true,
        mdSize: 2.4,
        isLoading: loading && !salesData,
        color: ( (salesData?.total_profit || 0) - getGoalProfit()) >= 0 ? '#22c55e' : '#ef4444'
      },
      {
        title: 'Profit Progress',
        value: getGoalProfit() > 0 ? ((salesData?.total_profit || 0) / getGoalProfit()) * 100 : 0,
        isCurrency: false,
        unit: '%',
        mdSize: 2.4,
        isLoading: loading && !salesData,
        color: getProgressColor(getGoalProfit() > 0 ? ((salesData?.total_profit || 0) / getGoalProfit()) * 100 : 0)
      },
      
      // Second row - 6 tiles
      {
        title: 'Average Daily Profit',
        value: salesData?.average_profit_day || 0,
        isCurrency: true,
        mdSize: 2.4,
        isLoading: loading && !salesData
      },
      {
        title: 'Average Weekly Profit',
        value: salesData?.average_profit_week || 0,
        isCurrency: true,
        mdSize: 2.4,
        isLoading: loading && !salesData
      },
      {
        title: 'Daily Profit to Goal',
        value: getDailyProfitToGoal(),
        isCurrency: true,
        mdSize: 2.4,
        isLoading: loading && !salesData,
        color: getProgressColor(getGoalProfit() > 0 ? ((salesData?.total_profit || 0) / getGoalProfit()) * 100 : 0)
      },
      {
        title: 'Weekly Profit to Goal',
        value: getWeeklyProfitToGoal(),
        isCurrency: true,
        mdSize: 2.4,
        isLoading: loading && !salesData,
        color: getProgressColor(getGoalProfit() > 0 ? ((salesData?.total_profit || 0) / getGoalProfit()) * 100 : 0)
      },
      {
        title: 'Days Remaining',
        value: getDaysRemaining(),
        isCurrency: false,
        unit: ' days',
        mdSize: 2.4,
        isLoading: false,
        color: getDaysRemaining() <= 30 ? '#ef4444' : getDaysRemaining() <= 90 ? '#f59e0b' : '#22c55e'
      },
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
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
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
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
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
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
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
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
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

            {/* Segment Filter */}
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Segment</InputLabel>
                <Select
                  value={filters.segment}
                  label="Segment"
                  onChange={(e) => handleFiltersChange({ ...filters, segment: e.target.value })}
                >
                  <MenuItem value="">All Segments</MenuItem>
                  <MenuItem value="RESELLER">RESELLER</MenuItem>
                  <MenuItem value="HORECA">HORECA</MenuItem>
                  <MenuItem value="OTHER">OTHER</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Payment Status Filter */}
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
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
              segment: filters.segment,
              month: filters.month,
              year: filters.year,
              status_payment: statusPayment
            }}
            monthlyData={monthlySummaryData}
            profitGoals={getProfitGoalsForChart()}
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
              segment: filters.segment,
              month: filters.month,
              year: filters.year,
              status_payment: statusPayment
            }}
          />
        </Box>

        {/* Order Type Chart - Only for admin and distribusi roles */}
        {(roles.includes('admin') || roles.includes('distribusi')) && (
          <Box mb={3}>
            <OrderTypeChart 
              filters={{
                agent: hasRestrictedRole ? getAgentNameFromRole(userRoleForFiltering!) : filters.agent,
                area: filters.area,
                segment: filters.segment,
                month: filters.month,
                year: filters.year,
              }}
              goalProfit={getGoalProfit()}
              goalProfitByAgent={getGoalProfitByAgent()}
            />
          </Box>
        )}

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
