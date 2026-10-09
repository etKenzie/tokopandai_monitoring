'use client';

import {
  fetchOrderFilters,
  fetchProductBrand,
  OrderFiltersData,
  ProductBrandData,
} from '@/app/api/distribusi/DistribusiSlice';
import ProtectedRoute from '@/app/components/auth/ProtectedRoute';
import PageContainer from '@/app/components/container/PageContainer';
import BrandPerformanceTable from '@/app/components/distribusi/BrandPerformanceTable';
import SearchableSelect, { withAllOption } from '@/app/components/shared/SearchableSelect';
import { useAuth } from '@/app/context/AuthContext';
import { useCheckRoles } from '@/app/hooks/useCheckRoles';
import { getAgentNameFromRole, getPageRoles, getRestrictedRoles } from '@/config/roles';
import {
  Box,
  Button,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';

interface PrincipalFilters {
  month: string;
  year: string;
  area: string;
  segment: string;
  agent: string;
  business_type: string;
  sub_business_type: string;
}

const formatMonthForApi = (month: string, year: string) => {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const monthName = monthNames[parseInt(month, 10) - 1];
  return `${monthName} ${year}`;
};

const PrincipalPage = () => {
  const { roles } = useAuth();
  const accessCheck = useCheckRoles(getPageRoles('DISTRIBUSI_DASHBOARD'));
  const restrictedRoles = getRestrictedRoles();
  const hasRestrictedRole = roles.some((role) => restrictedRoles.includes(role));
  const userRoleForFiltering = roles.find((role) => restrictedRoles.includes(role));

  console.log('Principal Page Access Check:', accessCheck);

  const [principalData, setPrincipalData] = useState<ProductBrandData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableFilters, setAvailableFilters] = useState<OrderFiltersData | null>(null);
  const [filtersLoading, setFiltersLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'brand' | 'principal'>('principal');

  const [filters, setFilters] = useState<PrincipalFilters>({
    month: '',
    year: '',
    area: '',
    segment: '',
    agent: '',
    business_type: '',
    sub_business_type: '',
  });

  const [appliedFilters, setAppliedFilters] = useState<PrincipalFilters>({
    month: '',
    year: '',
    area: '',
    segment: '',
    agent: '',
    business_type: '',
    sub_business_type: '',
  });

  useEffect(() => {
    const currentDate = new Date();
    const initialFilters: PrincipalFilters = {
      month: (currentDate.getMonth() + 1).toString().padStart(2, '0'),
      year: currentDate.getFullYear().toString(),
      area: '',
      segment: '',
      agent: '',
      business_type: '',
      sub_business_type: '',
    };
    setFilters(initialFilters);
    setAppliedFilters(initialFilters);
  }, []);

  const fetchPrincipalData = useCallback(async (currentFilters: PrincipalFilters) => {
    if (!currentFilters.month || !currentFilters.year) return;

    setLoading(true);
    setError(null);
    try {
      const agentName = hasRestrictedRole
        ? getAgentNameFromRole(userRoleForFiltering!)
        : currentFilters.agent || undefined;

      const response = await fetchProductBrand({
        month: formatMonthForApi(currentFilters.month, currentFilters.year),
        agent_name: agentName,
        area: currentFilters.area || undefined,
        segment: currentFilters.segment || undefined,
        business_type: currentFilters.business_type || undefined,
        sub_business_type: currentFilters.sub_business_type || undefined,
      });

      if (response?.data) {
        setPrincipalData(response.data);
      } else {
        setPrincipalData(null);
        setError(response?.message || 'Failed to load principal performance data.');
      }
    } catch (err) {
      console.error('Failed to fetch principal performance data:', err);
      setPrincipalData(null);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [hasRestrictedRole, userRoleForFiltering]);

  const fetchFiltersCallback = useCallback(async (month: string, year: string) => {
    setFiltersLoading(true);
    try {
      if (month && year) {
        const response = await fetchOrderFilters({
          month: formatMonthForApi(month, year),
        });
        setAvailableFilters(response.data);
      } else {
        setAvailableFilters(null);
      }
    } catch (fetchError) {
      console.error('Failed to fetch filters:', fetchError);
      setAvailableFilters(null);
    } finally {
      setFiltersLoading(false);
    }
  }, []);

  const handleFiltersChange = useCallback((newFilters: PrincipalFilters) => {
    setFilters(newFilters);
  }, []);

  const handleApplyFilters = useCallback(() => {
    setAppliedFilters(filters);
    setPrincipalData(null);
    setError(null);
  }, [filters]);

  const filtersMatchApplied =
    filters.month === appliedFilters.month &&
    filters.year === appliedFilters.year &&
    filters.area === appliedFilters.area &&
    filters.segment === appliedFilters.segment &&
    filters.agent === appliedFilters.agent &&
    filters.business_type === appliedFilters.business_type &&
    filters.sub_business_type === appliedFilters.sub_business_type;

  useEffect(() => {
    if (appliedFilters.month && appliedFilters.year) {
      fetchPrincipalData(appliedFilters);
      fetchFiltersCallback(appliedFilters.month, appliedFilters.year);
    }
  }, [
    appliedFilters.month,
    appliedFilters.year,
    appliedFilters.area,
    appliedFilters.segment,
    appliedFilters.agent,
    appliedFilters.business_type,
    appliedFilters.sub_business_type,
    fetchPrincipalData,
    fetchFiltersCallback,
  ]);

  return (
    <PageContainer title="Principal Performance" description="Compare invoices and profit by principal and brand">
      <Box>
        <Box mb={3}>
          <Typography variant="h3" fontWeight="bold" mb={1}>
            Principal Performance
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Compare invoices, profit, and margin by principal and brand for the selected period
          </Typography>
          {hasRestrictedRole && (
            <Typography variant="body2" color="info.main" sx={{ mt: 1, fontStyle: 'italic' }}>
              Showing data for {getAgentNameFromRole(userRoleForFiltering!)} only
            </Typography>
          )}
        </Box>

        <Box mb={3}>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid size={{ xs: 12, sm: 4 }}>
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

            <Grid size={{ xs: 12, sm: 4 }}>
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

            <Grid size={{ xs: 12, sm: 4 }}>
              <Button
                variant="contained"
                fullWidth
                onClick={handleApplyFilters}
                disabled={!filters.month || !filters.year || filtersMatchApplied}
                sx={{ height: '40px' }}
              >
                Apply Filters
              </Button>
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <SearchableSelect
                label="Area"
                value={filters.area}
                options={[
                  { value: '', label: 'All Areas' },
                  { value: 'JAKARTA', label: 'JAKARTA' },
                  { value: 'BANDUNG', label: 'BANDUNG' },
                  { value: 'SURABAYA', label: 'SURABAYA' },
                  { value: 'MEDAN', label: 'MEDAN' },
                  { value: 'SEMARANG', label: 'SEMARANG' },
                  { value: 'MAKASSAR', label: 'MAKASSAR' },
                  { value: 'PALEMBANG', label: 'PALEMBANG' },
                  { value: 'TANGERANG', label: 'TANGERANG' },
                  { value: 'DEPOK', label: 'DEPOK' },
                  { value: 'BEKASI', label: 'BEKASI' },
                ]}
                onChange={(area) => handleFiltersChange({ ...filters, area })}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <SearchableSelect
                label="Segment"
                value={filters.segment}
                options={[
                  { value: '', label: 'All Segments' },
                  { value: 'RESELLER', label: 'RESELLER' },
                  { value: 'HORECA', label: 'HORECA' },
                  { value: 'OTHER', label: 'OTHER' },
                ]}
                onChange={(segment) => handleFiltersChange({ ...filters, segment })}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <SearchableSelect
                label="Agent"
                value={filters.agent}
                disabled={hasRestrictedRole || filtersLoading}
                options={withAllOption('All Agents', availableFilters?.agents)}
                onChange={(agent) => handleFiltersChange({ ...filters, agent })}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <SearchableSelect
                label="Business Type"
                value={filters.business_type}
                options={[
                  { value: '', label: 'All Business Types' },
                  { value: 'Hotel', label: 'Hotel' },
                  { value: 'Resto', label: 'Resto' },
                  { value: 'Catering', label: 'Catering' },
                  { value: 'Retail Tradisional', label: 'Retail Tradisional' },
                ]}
                onChange={(business_type) => handleFiltersChange({ ...filters, business_type })}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <SearchableSelect
                label="Sub Business Type"
                value={filters.sub_business_type}
                options={[
                  { value: '', label: 'All Sub Business Types' },
                  { value: 'Warung', label: 'Warung' },
                  { value: 'Mini Market', label: 'Mini Market' },
                  { value: 'Supermarket', label: 'Supermarket' },
                  { value: 'Fine Dining', label: 'Fine Dining' },
                  { value: 'Casual Dining', label: 'Casual Dining' },
                ]}
                onChange={(sub_business_type) => handleFiltersChange({ ...filters, sub_business_type })}
              />
            </Grid>
          </Grid>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={viewMode === 'principal'}
                onChange={(e) => setViewMode(e.target.checked ? 'principal' : 'brand')}
                color="primary"
              />
            }
            label={viewMode === 'principal' ? 'By Principal' : 'By Brand'}
          />
        </Box>

        {error ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="200px">
            <Typography variant="body1" color="error">
              {error}
            </Typography>
          </Box>
        ) : (
          <BrandPerformanceTable
            viewMode={viewMode}
            brandRows={principalData?.by_brand ?? []}
            principalRows={principalData?.by_principal ?? []}
            totals={principalData?.totals}
            loading={loading}
            onRefresh={() => fetchPrincipalData(appliedFilters)}
            title={viewMode === 'principal' ? 'Principal Performance' : 'Brand Breakdown'}
          />
        )}
      </Box>
    </PageContainer>
  );
};

export default function ProtectedPrincipalPage() {
  return (
    <ProtectedRoute requiredRoles={getPageRoles('DISTRIBUSI_DASHBOARD')}>
      <PrincipalPage />
    </ProtectedRoute>
  );
}
