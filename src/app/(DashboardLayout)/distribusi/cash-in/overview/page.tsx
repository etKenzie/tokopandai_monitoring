'use client';

import { CashInData, fetchCashInData } from '@/app/api/distribusi/DistribusiSlice';
import ProtectedRoute from '@/app/components/auth/ProtectedRoute';
import PageContainer from '@/app/components/container/PageContainer';
import CashInMonthlyChart from '@/app/components/distribusi/CashInMonthlyChart';
import DistribusiFilters, { DistribusiFilterValues } from '@/app/components/distribusi/DistribusiFilters';
import UnpaidOverviewChart from '@/app/components/distribusi/UnpaidOverviewChart';
import SummaryTiles from '@/app/components/shared/SummaryTiles';
import { useAuth } from '@/app/context/AuthContext';
import { useSettings } from '@/app/context/SettingsContext';
import { useCheckRoles } from '@/app/hooks/useCheckRoles';
import { getAgentNameFromRole, getPageRoles, getRestrictedRoles } from '@/config/roles';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';

const CashInOverview = () => {
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
  console.log('Cash-In Overview Access Check:', accessCheck);
  console.log('User roles:', roles);
  console.log('Has restricted role:', hasRestrictedRole);
  console.log('User role for filtering:', userRoleForFiltering);
  
  const [cashInData, setCashInData] = useState<CashInData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize filters with empty values to avoid hydration mismatch
  const [filters, setFilters] = useState<DistribusiFilterValues>({
    month: '',
    year: '',
    agent: '',
    area: '',
    segment: ''
  });

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

  const fetchCashInDataCallback = useCallback(async (currentFilters: DistribusiFilterValues) => {
    console.log('Fetching cash-in data with filters:', currentFilters);
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
        
        const response = await fetchCashInData({
          month: formattedMonth,
          agent: agentName,
          area: currentFilters.area || undefined,
        });
        console.log('Cash-in data response:', response);
        setCashInData(response.data);
      } else {
        setCashInData(null);
      }
    } catch (err) {
      console.error('Failed to fetch cash-in data:', err);
      setCashInData(null);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [hasRestrictedRole, userRoleForFiltering]);

  const handleFiltersChange = useCallback((newFilters: DistribusiFilterValues) => {
    console.log('Filters changed:', newFilters);
    setFilters(newFilters);
  }, []);

  useEffect(() => {
    // Only fetch data if month and year are set (after initialization)
    if (filters.month && filters.year) {
      fetchCashInDataCallback(filters);
    }
  }, [filters.month, filters.year, filters.agent, filters.area, fetchCashInDataCallback]);

  // Get goal cash-in based on selected agent and month
  const getGoalCashIn = () => {
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
    if (settings?.goal_cash_in) {
      if (settings.goal_cash_in[agentKey] && settings.goal_cash_in[agentKey][monthYear]) {
        console.log('Found goal cash-in in settings for agent:', { agentKey, monthYear, value: settings.goal_cash_in[agentKey][monthYear] });
        return settings.goal_cash_in[agentKey][monthYear];
      }
      
      // Fallback to NATIONAL if agent not found in settings
      if (settings.goal_cash_in['NATIONAL'] && settings.goal_cash_in['NATIONAL'][monthYear]) {
        console.log('Using NATIONAL goal cash-in from settings:', { monthYear, value: settings.goal_cash_in['NATIONAL'][monthYear] });
        return settings.goal_cash_in['NATIONAL'][monthYear];
      }
    }
    
    // Fallback to static goalCashIn data if settings not available
    // Convert to lowercase for static data lookup
    const staticMonthYear = `${monthName.toLowerCase()} ${filters.year}`;
    const staticAgentKey = agentKey.toLowerCase();
    
    // Static fallback data (simplified version of goalCashIn)
    const staticGoalCashIn: Record<string, Record<string, number>> = {
      'national': {
        'january 2025': 200000000,
        'february 2025': 210000000,
        'march 2025': 220000000,
        'april 2025': 215000000,
        'may 2025': 225000000,
        'june 2025': 240000000,
        'july 2025': 230000000,
        'august 2025': 250000000,
        'september 2025': 280000000,
        'october 2025': 290000000,
        'november 2025': 310000000,
        'december 2025': 330000000,
      },
      'oki irawan': {
        'january 2025': 70000000,
        'february 2025': 75000000,
        'march 2025': 80000000,
        'april 2025': 78000000,
        'may 2025': 82000000,
        'june 2025': 85000000,
        'july 2025': 80000000,
        'august 2025': 90000000,
        'september 2025': 100000000,
        'october 2025': 95000000,
        'november 2025': 98000000,
        'december 2025': 105000000,
      },
      'rully juliandi': {
        'january 2025': 60000000,
        'february 2025': 65000000,
        'march 2025': 70000000,
        'april 2025': 68000000,
        'may 2025': 72000000,
        'june 2025': 75000000,
        'july 2025': 70000000,
        'august 2025': 80000000,
        'september 2025': 90000000,
        'october 2025': 85000000,
        'november 2025': 88000000,
        'december 2025': 95000000,
      },
      'mardi': {
        'january 2025': 25000000,
        'february 2025': 25000000,
        'march 2025': 25000000,
        'april 2025': 25000000,
        'may 2025': 25000000,
        'june 2025': 22000000,
        'july 2025': 10000000,
        'august 2025': 10000000,
        'september 2025': 12000000,
        'october 2025': 10000000,
        'november 2025': 10000000,
        'december 2025': 10000000,
      },
      'rifqi cassidy': {
        'august 2025': 25000000,
        'september 2025': 25000000,
        'october 2025': 50000000,
        'november 2025': 60000000,
        'december 2025': 70000000,
      },
      'others': {
        'january 2025': 15000000,
        'february 2025': 15000000,
        'march 2025': 12000000,
        'april 2025': 8000000,
        'may 2025': 10000000,
        'june 2025': 10000000,
        'july 2025': 10000000,
        'august 2025': 5000000,
        'september 2025': 4000000,
        'october 2025': 5000000,
        'november 2025': 5000000,
        'december 2025': 5000000,
      },
      'channel': {
        'january 2025': 15000000,
        'february 2025': 15000000,
        'march 2025': 12000000,
        'april 2025': 8000000,
        'may 2025': 10000000,
        'june 2025': 10000000,
        'july 2025': 10000000,
        'august 2025': 6000000,
        'september 2025': 6000000,
        'october 2025': 6000000,
        'november 2025': 6000000,
        'december 2025': 6000000,
      },
    };
    
    if (staticGoalCashIn[staticAgentKey] && staticGoalCashIn[staticAgentKey][staticMonthYear]) {
      console.log('Using static goal cash-in data:', { staticAgentKey, staticMonthYear, value: staticGoalCashIn[staticAgentKey][staticMonthYear] });
      return staticGoalCashIn[staticAgentKey][staticMonthYear];
    }
    
    // Final fallback to NATIONAL
    if (staticGoalCashIn['national'] && staticGoalCashIn['national'][staticMonthYear]) {
      console.log('Using NATIONAL static goal cash-in data:', { staticMonthYear, value: staticGoalCashIn['national'][staticMonthYear] });
      return staticGoalCashIn['national'][staticMonthYear];
    }
    
    return 0;
  };

  // Helper function to get progress color based on percentage
  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return '#22c55e'; // Green
    if (percentage >= 80) return '#f59e0b'; // Yellow
    if (percentage >= 60) return '#f97316'; // Orange
    return '#ef4444'; // Red
  };

  // Prepare summary tiles data
  const getSummaryTiles = () => {
    if (!cashInData) return [];

    const totalPaidInvoice = cashInData.paid.paid_total_invoice;
    const goalCashIn = getGoalCashIn();
    const cashInProgress = goalCashIn > 0 ? (totalPaidInvoice / goalCashIn) * 100 : 0;
    const cashInRemaining = totalPaidInvoice - goalCashIn;

    return [
      {
        title: 'Total Paid Invoice',
        value: totalPaidInvoice,
        isCurrency: true,
        mdSize: 2.4,
        isLoading: loading && !cashInData
      },
      {
        title: 'Goal Cash-In',
        value: goalCashIn,
        isCurrency: true,
        mdSize: 2.4,
        isLoading: false
      },
      {
        title: 'Paid Invoice Count',
        value: cashInData.paid.paid_invoice_count,
        isCurrency: false,
        mdSize: 2.4,
        isLoading: loading && !cashInData
      },
      {
        title: 'Cash-In Remaining',
        value: cashInRemaining,
        isCurrency: true,
        mdSize: 2.4,
        isLoading: loading && !cashInData,
        color: cashInRemaining <= 0 ? '#ef4444' :'#22c55e'  // Green if goal achieved (remaining <= 0), red if still need more
      },
      {
        title: 'Cash-In Progress',
        value: cashInProgress,
        isCurrency: false,
        unit: '%',
        mdSize: 2.4,
        isLoading: loading && !cashInData,
        color: getProgressColor(cashInProgress)
      },
      
      {
        title: 'Total Paid Profit',
        value: cashInData.paid.paid_total_profit,
        isCurrency: true,
        mdSize: 2.4,
        isLoading: loading && !cashInData
      },
      {
        title: 'Avg Payment Days (Paid)',
        value: cashInData.paid.paid_avg_payment_days,
        isCurrency: false,
        unit: ' Days',
        mdSize: 2.4,
        isLoading: loading && !cashInData
      },
      {
        title: 'Total Unpaid Invoice',
        value: cashInData.unpaid.unpaid_total_invoice,
        isCurrency: true,
        mdSize: 2.4,
        isLoading: loading && !cashInData
      },
      {
        title: 'Unpaid Invoice Count',
        value: cashInData.unpaid.unpaid_invoice_count,
        isCurrency: false,
        mdSize: 2.4,
        isLoading: loading && !cashInData
      },
      {
        title: 'Total Unpaid Profit',
        value: cashInData.unpaid.unpaid_total_profit,
        isCurrency: true,
        mdSize: 2.4,
        isLoading: loading && !cashInData
      }
    ];
  };

  return (
    <PageContainer title="Cash-In Overview" description="Monitor cash-in performance and metrics">
      <Box>
        {/* Header */}
        <Box mb={3}>
          <Typography variant="h3" fontWeight="bold" mb={1}>
            Cash-In Overview
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Monitor cash-in performance, invoice status, and payment metrics
          </Typography>
          {hasRestrictedRole && (
            <Typography variant="body2" color="info.main" sx={{ mt: 1, fontStyle: 'italic' }}>
              Showing data for {getAgentNameFromRole(userRoleForFiltering!)} only
            </Typography>
          )}
        </Box>

        {/* Filters */}
        <Box mb={3}>
          <DistribusiFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            hasRestrictedRole={hasRestrictedRole}
          />
        </Box>

        {/* Summary Tiles */}
        <Box mb={3}>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="200px">
              <CircularProgress />
            </Box>
          ) : cashInData ? (
            <SummaryTiles tiles={getSummaryTiles()} />
          ) : error ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="200px">
              <Typography variant="body1" color="error">
                {error}
              </Typography>
            </Box>
          ) : (
            <Box display="flex" justifyContent="center" alignItems="center" height="200px">
              <Typography variant="body1" color="textSecondary">
                No data available. Please select month and year filters.
              </Typography>
            </Box>
          )}
        </Box>

        {/* Cash In Monthly Chart */}
        <Box mb={3}>
          <CashInMonthlyChart 
            filters={{
              agent: hasRestrictedRole ? getAgentNameFromRole(userRoleForFiltering!) : filters.agent,
              area: filters.area,
              month: filters.month,
              year: filters.year
            }}
          />
        </Box>

        {/* Unpaid Overview Summary */}
        {/* <Box mb={3}>
          <Typography variant="h5" fontWeight="bold" mb={2}>
            Unpaid Overview
          </Typography>
          <Typography variant="body1" color="textSecondary" mb={3}>
            Monitor unpaid invoices by overdue status
          </Typography>
        </Box> */}

        {/* Unpaid Overview Chart */}
        <Box mb={3}>
          <UnpaidOverviewChart 
            filters={{
              agent: hasRestrictedRole ? getAgentNameFromRole(userRoleForFiltering!) : filters.agent,
              area: filters.area
            }}
          />
        </Box>
      </Box>
    </PageContainer>
  );
};

export default function ProtectedCashInOverview() {
  return (
    <ProtectedRoute requiredRoles={getPageRoles('DISTRIBUSI_DASHBOARD')}>
      <CashInOverview />
    </ProtectedRoute>
  );
}


