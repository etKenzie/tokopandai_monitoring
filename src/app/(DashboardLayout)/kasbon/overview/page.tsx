'use client';

import { useAuth } from '@/app/context/AuthContext';
import { useCheckRoles } from '@/app/hooks/useCheckRoles';
import { getPageRoles } from '@/config/roles';
import { Box, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import ProtectedRoute from '../../../components/auth/ProtectedRoute';
import PageContainer from '../../../components/container/PageContainer';
import KasbonOverviewFilters, { KasbonOverviewFilterValues } from '../../../components/kasbon/KasbonOverviewFilters';
import ClientSummaryTable from '../../../components/kasbon/ClientSummaryTable';
import ClientPenetrationTable from '../../../components/kasbon/ClientPenetrationTable';
import ClientDelinquencyTable from '../../../components/kasbon/ClientDelinquencyTable';
import { fetchClientSummary, ClientSummary } from '../../../api/kasbon/KasbonSlice';

const Overview = () => {
  const { user, roles, refreshRoles } = useAuth();
  
  // Check access for allowed roles (configurable via roles config)
  const accessCheck = useCheckRoles(getPageRoles('KASBON_DASHBOARD'));
  
  // Log access check result for debugging
  console.log('Kasbon Overview Access Check:', accessCheck);
  
  // Initialize filters with empty values to avoid hydration mismatch
  const [filters, setFilters] = useState<KasbonOverviewFilterValues>({
    month: '',
    year: ''
  });

  const [clientSummaryData, setClientSummaryData] = useState<ClientSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set initial date values in useEffect to avoid hydration issues
  useEffect(() => {
    const currentDate = new Date();
    const currentMonth = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const currentYear = currentDate.getFullYear().toString();
    
    setFilters({
      month: currentMonth,
      year: currentYear
    });
  }, []);

  const handleFiltersChange = (newFilters: KasbonOverviewFilterValues) => {
    console.log('Filters changed:', newFilters);
    setFilters(newFilters);
  };

  const fetchClientSummaryData = async () => {
    if (!filters.month || !filters.year) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await fetchClientSummary({
        month: filters.month,
        year: filters.year
      });
      
      setClientSummaryData(response.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Failed to fetch client summary data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (filters.month && filters.year) {
      fetchClientSummaryData();
    }
  }, [filters.month, filters.year]);

  return (
    <PageContainer title="Kasbon Overview" description="Overview of kasbon performance across clients">
      <Box>
        {/* Header */}
        <Box mb={3}>
          <Typography variant="h3" fontWeight="bold" mb={1}>
            Kasbon Overview
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Performance overview and client comparison for kasbon services
          </Typography>
        </Box>

        {/* Filters */}
        <Box mb={3}>
          <KasbonOverviewFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
          />
        </Box>

        {/* Client Summary Tables */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* First Row: Total Disbursement and Total Requests */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, alignItems: 'stretch' }}>
            {/* Clients by Total Disbursement */}
            <ClientSummaryTable
              data={clientSummaryData}
              loading={loading}
              error={error}
              title="Clients by Total Disbursement"
              sortBy="total_disbursement"
              displayField="total_disbursement"
              displayFieldLabel="Total Disbursement"
              formatValue={(value: number) => new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(value)}
            />

            {/* Clients by Total Requests */}
            <ClientSummaryTable
              data={clientSummaryData}
              loading={loading}
              error={error}
              title="Clients by Total Requests"
              sortBy="total_requests"
              displayField="total_requests"
              displayFieldLabel="Total Requests"
              formatValue={(value: number) => value.toLocaleString()}
            />
          </Box>

          {/* Middle Row: Penetration Rate */}
          <ClientPenetrationTable
            data={clientSummaryData}
            loading={loading}
            error={error}
          />

          {/* Third Row: Highest Net Admin Fee and Highest Delinquency */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, alignItems: 'stretch' }}>
            {/* Clients by Highest Net Admin Fee */}
            <ClientSummaryTable
              data={clientSummaryData}
              loading={loading}
              error={error}
              title="Clients by Highest Net Admin Fee"
              sortBy="admin_fee_profit"
              displayField="admin_fee_profit"
              displayFieldLabel="Net Admin Fee"
              formatValue={(value: number) => new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(value)}
            />

            {/* Clients by Highest Delinquency */}
            <ClientDelinquencyTable
              data={clientSummaryData}
              loading={loading}
              error={error}
            />
          </Box>
        </Box>
      </Box>
    </PageContainer>
  );
};

export default function ProtectedOverview() {
  return (
    <ProtectedRoute requiredRoles={getPageRoles('KASBON_DASHBOARD')}>
      <Overview />
    </ProtectedRoute>
  );
}
