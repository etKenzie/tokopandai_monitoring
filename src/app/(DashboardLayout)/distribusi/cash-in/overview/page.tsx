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
import { getPageRoles } from '@/config/roles';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';

const CashInOverview = () => {
  const { user, roles, refreshRoles } = useAuth();
  
  // Check access for allowed roles (configurable via roles config)
  const accessCheck = useCheckRoles(getPageRoles('DISTRIBUSI_DASHBOARD'));
  
  // Log access check result for debugging
  console.log('Cash-In Overview Access Check:', accessCheck);
  
  const [cashInData, setCashInData] = useState<CashInData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize filters with empty values to avoid hydration mismatch
  const [filters, setFilters] = useState<DistribusiFilterValues>({
    month: '',
    year: '',
    agent: '',
    area: ''
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
        
        const response = await fetchCashInData({
          month: formattedMonth,
          agent: currentFilters.agent || undefined,
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
  }, []);

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

  // Prepare summary tiles data
  const getSummaryTiles = () => {
    if (!cashInData) return [];

    return [
      {
        title: 'Total Paid Invoice',
        value: cashInData.paid.paid_total_invoice,
        isCurrency: true,
        mdSize: 3
      },
      {
        title: 'Paid Invoice Count',
        value: cashInData.paid.paid_invoice_count,
        isCurrency: false,
        mdSize: 3
      },
      {
        title: 'Total Paid Profit',
        value: cashInData.paid.paid_total_profit,
        isCurrency: true,
        mdSize: 3
      },
      {
        title: 'Avg Payment Days (Paid)',
        value: cashInData.paid.paid_avg_payment_days,
        isCurrency: false,
        unit: ' Days',
        mdSize: 3
      },
      {
        title: 'Total Unpaid Invoice',
        value: cashInData.unpaid.unpaid_total_invoice,
        isCurrency: true,
        mdSize: 3
      },
      {
        title: 'Unpaid Invoice Count',
        value: cashInData.unpaid.unpaid_invoice_count,
        isCurrency: false,
        mdSize: 3
      },
      {
        title: 'Total Unpaid Profit',
        value: cashInData.unpaid.unpaid_total_profit,
        isCurrency: true,
        mdSize: 3
      },
      {
        title: 'Avg Payment Days (Unpaid)',
        value: cashInData.unpaid.unpaid_avg_payment_days,
        isCurrency: false,
        unit: ' Days',
        mdSize: 3
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
        </Box>

        {/* Filters */}
        <Box mb={3}>
          <DistribusiFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
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
              agent: filters.agent,
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
              agent: filters.agent,
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


