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
              <FormControl fullWidth size="small">
                <InputLabel>Area</InputLabel>
                <Select
                  value={filters.area}
                  label="Area"
                  onChange={(e) => handleFiltersChange({ ...filters, area: e.target.value })}
                >
                  <MenuItem value="">All Areas</MenuItem>
                  <MenuItem value="JAKARTA">JAKARTA</MenuItem>
                  <MenuItem value="BANDUNG">BANDUNG</MenuItem>
                  <MenuItem value="SURABAYA">SURABAYA</MenuItem>
                  <MenuItem value="MEDAN">MEDAN</MenuItem>
                  <MenuItem value="SEMARANG">SEMARANG</MenuItem>
                  <MenuItem value="MAKASSAR">MAKASSAR</MenuItem>
                  <MenuItem value="PALEMBANG">PALEMBANG</MenuItem>
                  <MenuItem value="TANGERANG">TANGERANG</MenuItem>
                  <MenuItem value="DEPOK">DEPOK</MenuItem>
                  <MenuItem value="BEKASI">BEKASI</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
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

            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Agent</InputLabel>
                <Select
                  value={filters.agent}
                  label="Agent"
                  onChange={(e) => handleFiltersChange({ ...filters, agent: e.target.value })}
                  disabled={hasRestrictedRole || filtersLoading}
                >
                  <MenuItem value="">All Agents</MenuItem>
                  {availableFilters?.agents?.map((agent) => (
                    <MenuItem key={agent} value={agent}>
                      {agent}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Business Type</InputLabel>
                <Select
                  value={filters.business_type}
                  label="Business Type"
                  onChange={(e) => handleFiltersChange({ ...filters, business_type: e.target.value })}
                >
                  <MenuItem value="">All Business Types</MenuItem>
                  <MenuItem value="Hotel">Hotel</MenuItem>
                  <MenuItem value="Resto">Resto</MenuItem>
                  <MenuItem value="Catering">Catering</MenuItem>
                  <MenuItem value="Retail Tradisional">Retail Tradisional</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Sub Business Type</InputLabel>
                <Select
                  value={filters.sub_business_type}
                  label="Sub Business Type"
                  onChange={(e) => handleFiltersChange({ ...filters, sub_business_type: e.target.value })}
                >
                  <MenuItem value="">All Sub Business Types</MenuItem>
                  <MenuItem value="Warung">Warung</MenuItem>
                  <MenuItem value="Mini Market">Mini Market</MenuItem>
                  <MenuItem value="Supermarket">Supermarket</MenuItem>
                  <MenuItem value="Fine Dining">Fine Dining</MenuItem>
                  <MenuItem value="Casual Dining">Casual Dining</MenuItem>
                </Select>
              </FormControl>
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
