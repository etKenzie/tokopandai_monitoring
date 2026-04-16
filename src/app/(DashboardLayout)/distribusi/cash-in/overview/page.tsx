'use client';

import { CashInData, fetchCashInData } from '@/app/api/distribusi/DistribusiSlice';
import ProtectedRoute from '@/app/components/auth/ProtectedRoute';
import PageContainer from '@/app/components/container/PageContainer';
import CashInMonthlyChart from '@/app/components/distribusi/CashInMonthlyChart';
import DistribusiFilters, { DistribusiFilterValues } from '@/app/components/distribusi/DistribusiFilters';
import UnpaidOverviewChart from '@/app/components/distribusi/UnpaidOverviewChart';
import SummaryTiles from '@/app/components/shared/SummaryTiles';
import { useAuth } from '@/app/context/AuthContext';
import { useCheckRoles } from '@/app/hooks/useCheckRoles';
import { getAgentNameFromRole, getPageRoles, getRestrictedRoles } from '@/config/roles';
import { Box, CircularProgress, FormControlLabel, Switch, Typography } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

interface GoalFromApi {
  id: number;
  scope: string;
  goal_type: string;
  target_value: number;
  period_type?: string;
  period?: string;
  agent_name: string | null;
}

const CashInOverview = () => {
  const { user, roles, refreshRoles } = useAuth();
  
  // Check access for allowed roles (configurable via roles config)
  const accessCheck = useCheckRoles(getPageRoles('CASH_IN_SECTION'));
  
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
  const [showPercentage, setShowPercentage] = useState(false);
  // Goals from API (same source as sales/overview, goal_type cash-in)
  const [goalsFromApi, setGoalsFromApi] = useState<GoalFromApi[]>([]);
  
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

  // Fetch cash-in goals from API (same place as sales/overview, goal_type cash-in)
  useEffect(() => {
    if (!API_BASE || !filters.month || !filters.year) {
      setGoalsFromApi([]);
      return;
    }
    const monthNum = parseInt(filters.month, 10);
    const year = filters.year;
    let cancelled = false;
    (async () => {
      try {
        const params = new URLSearchParams({
          goal_type: 'cash-in',
          month: String(monthNum),
          year,
        });
        const res = await fetch(`${API_BASE}/api/goals?${params.toString()}`);
        const json = await res.json();
        if (cancelled) return;
        if (json?.data?.goals) setGoalsFromApi(json.data.goals);
        else setGoalsFromApi([]);
      } catch {
        if (!cancelled) setGoalsFromApi([]);
      }
    })();
    return () => { cancelled = true; };
  }, [filters.month, filters.year]);

  // Get goal cash-in for selected agent/month from API (same lookup pattern as sales/overview)
  const getGoalCashInValue = () => {
    if (!filters.month || !filters.year) return 0;
    const agentKey = hasRestrictedRole ? getAgentNameFromRole(userRoleForFiltering!) : (filters.agent || 'NATIONAL');
    const monthGoals = goalsFromApi.filter(g => (g.period_type || 'month') === 'month');
    if (agentKey === 'NATIONAL' || !agentKey) {
      const national = monthGoals.find(g => g.scope === 'national');
      return national?.target_value ?? 0;
    }
    const agentGoal = monthGoals.find(g => g.scope === 'agent' && (g.agent_name || '').toLowerCase() === agentKey.toLowerCase());
    if (agentGoal) return agentGoal.target_value;
    const national = monthGoals.find(g => g.scope === 'national');
    return national?.target_value ?? 0;
  };

  // Helper function to get progress color based on percentage
  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return '#22c55e'; // Green
    if (percentage >= 80) return '#f59e0b'; // Yellow
    if (percentage >= 60) return '#f97316'; // Orange
    return '#ef4444'; // Red
  };

  // Prepare summary tiles data (4 per row: Total Paid, Goal, Payment Count, Remaining, Progress, COD, TOP)
  const getSummaryTiles = () => {
    if (!cashInData) return [];

    const totalPaid = cashInData.total_paid;
    const goalCashIn = getGoalCashInValue();
    const cashInProgress = goalCashIn > 0 ? (totalPaid / goalCashIn) * 100 : 0;
    const cashInRemaining = totalPaid - goalCashIn;
    const toPercent = (value: number) => (totalPaid > 0 ? (value / totalPaid) * 100 : 0);

    return [
      {
        title: 'Total Paid',
        value: totalPaid,
        isCurrency: true,
        mdSize: 6,
        fontSize: '1.5rem',
        isLoading: loading && !cashInData
      },
      {
        title: 'Goal Cash-In',
        value: goalCashIn,
        isCurrency: true,
        isLoading: false
      },
      {
        title: 'Payment Count',
        value: cashInData.payment_count,
        isCurrency: false,
        isLoading: loading && !cashInData
      },
      {
        title: 'Cash-In Remaining',
        value: cashInRemaining,
        isCurrency: true,
        isLoading: loading && !cashInData,
        color: cashInRemaining <= 0 ? '#ef4444' :'#22c55e'
      },
      {
        title: 'Cash-In Progress',
        value: cashInProgress,
        isCurrency: false,
        unit: '%',
        isLoading: loading && !cashInData,
        color: getProgressColor(cashInProgress)
      },
      {
        title: 'COD Total',
        value: showPercentage ? toPercent(cashInData.cod_total) : cashInData.cod_total,
        isCurrency: !showPercentage,
        unit: showPercentage ? '%' : undefined,
        isLoading: loading && !cashInData
      },
      {
        title: 'TOP Total',
        value: showPercentage ? toPercent(cashInData.top_total) : cashInData.top_total,
        isCurrency: !showPercentage,
        unit: showPercentage ? '%' : undefined,
        isLoading: loading && !cashInData
      }
    ];
  };

  // Payment breakdown tiles: row 1 Full/Partial, row 2 Overdue/On Time/Current/Previous
  const getPaymentBreakdownTiles = () => {
    if (!cashInData) return [];
    const totalPaid = cashInData.total_paid;
    const toPercent = (value: number) => (totalPaid > 0 ? (value / totalPaid) * 100 : 0);
    return [
      {
        title: 'Full Payment Total',
        value: showPercentage ? toPercent(cashInData.full_payment_total) : cashInData.full_payment_total,
        isCurrency: !showPercentage,
        unit: showPercentage ? '%' : undefined,
        mdSize: 6,
        isLoading: loading && !cashInData
      },
      {
        title: 'Partial Payment Total',
        value: showPercentage ? toPercent(cashInData.partial_payment_total) : cashInData.partial_payment_total,
        isCurrency: !showPercentage,
        unit: showPercentage ? '%' : undefined,
        mdSize: 6,
        isLoading: loading && !cashInData
      },
      {
        title: 'Overdue Payment Total',
        value: showPercentage ? toPercent(cashInData.overdue_payment_total) : cashInData.overdue_payment_total,
        isCurrency: !showPercentage,
        unit: showPercentage ? '%' : undefined,
        isLoading: loading && !cashInData
      },
      {
        title: 'On Time Total',
        value: showPercentage ? toPercent(cashInData.on_time_total) : cashInData.on_time_total,
        isCurrency: !showPercentage,
        unit: showPercentage ? '%' : undefined,
        isLoading: loading && !cashInData
      },
      {
        title: 'Current Month Cash',
        value: showPercentage ? toPercent(cashInData.current_month_cash) : cashInData.current_month_cash,
        isCurrency: !showPercentage,
        unit: showPercentage ? '%' : undefined,
        isLoading: loading && !cashInData
      },
      {
        title: 'Previous Months Cash',
        value: showPercentage ? toPercent(cashInData.previous_months_cash) : cashInData.previous_months_cash,
        isCurrency: !showPercentage,
        unit: showPercentage ? '%' : undefined,
        isLoading: loading && !cashInData
      }
    ];
  };

  return (
    <PageContainer title="Cash-In Overview" description="Monitor cash-in performance and metrics">
      <Box>
        {/* Header */}
        <Box
          mb={3}
          display="flex"
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', md: 'center' }}
          flexDirection={{ xs: 'column', md: 'row' }}
          gap={2}
        >
          <Box>
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
          <FormControlLabel
            control={
              <Switch
                checked={showPercentage}
                onChange={(_, checked) => setShowPercentage(checked)}
                color="primary"
              />
            }
            label={showPercentage ? 'Percentage Mode' : 'Cash Mode'}
            sx={{ mr: 0 }}
          />
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
            <SummaryTiles tiles={getSummaryTiles()} md={3} />
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

        {/* Payment breakdown: Full/Partial row, then Overdue/On Time/Current/Previous row */}
        {cashInData && (
          <Box mb={3}>
            <SummaryTiles tiles={getPaymentBreakdownTiles()} md={3} />
          </Box>
        )}

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
    <ProtectedRoute requiredRoles={getPageRoles('CASH_IN_SECTION')}>
      <CashInOverview />
    </ProtectedRoute>
  );
}


