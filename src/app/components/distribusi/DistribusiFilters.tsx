'use client';

import { fetchOrderFilters, OrderFiltersData } from '@/app/api/distribusi/DistribusiSlice';
import {
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent
} from '@mui/material';
import { useEffect, useState } from 'react';

export interface DistribusiFilterValues {
  month: string;
  year: string;
  agent: string;
  area: string;
  segment: string;
  business_type: string;
}

interface DistribusiFiltersProps {
  filters: DistribusiFilterValues;
  onFiltersChange: (filters: DistribusiFilterValues) => void;
  // Role-based filtering props
  hasRestrictedRole?: boolean;
}

const DistribusiFilters = ({ filters, onFiltersChange, hasRestrictedRole = false }: DistribusiFiltersProps) => {
  const [availableFilters, setAvailableFilters] = useState<OrderFiltersData | null>(null);
  const [loading, setLoading] = useState(false);

  // Generate month options (01-12)
  const months = Array.from({ length: 12 }, (_, i) => {
    const monthNum = (i + 1).toString().padStart(2, '0');
    const monthName = new Date(2024, i).toLocaleString('en-US', { month: 'long' });
    return { value: monthNum, label: monthName };
  });

  // Generate year options (current year - 5 years back)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => (currentYear - i).toString());

  const fetchFilters = async (month?: string, year?: string) => {
    setLoading(true);
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
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (filters.month && filters.year) {
      fetchFilters(filters.month, filters.year);
    }
  }, []);

  // Refetch filters when month or year changes
  useEffect(() => {
    if (filters.month && filters.year) {
      fetchFilters(filters.month, filters.year);
    }
  }, [filters.month, filters.year]);

  const handleFilterChange = (field: keyof DistribusiFilterValues) => (
    event: SelectChangeEvent<string>
  ) => {
    const newFilters = { ...filters, [field]: event.target.value };
    console.log('Filter changed in DistribusiFilters:', field, 'to', event.target.value);
    console.log('New filters:', newFilters);
    onFiltersChange(newFilters);
  };

  return (
    <Grid container spacing={2}>
      {/* Row 1: Month + Year only */}
      <Grid size={{ xs: 12, sm: 6 }}>
        <FormControl fullWidth size="small">
          <InputLabel>Month</InputLabel>
          <Select
            value={filters.month}
            label="Month"
            onChange={handleFilterChange('month')}
          >
            {months.map((month) => (
              <MenuItem key={month.value} value={month.value}>
                {month.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <FormControl fullWidth size="small">
          <InputLabel>Year</InputLabel>
          <Select
            value={filters.year}
            label="Year"
            onChange={handleFilterChange('year')}
          >
            {years.map((year) => (
              <MenuItem key={year} value={year}>
                {year}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      {/* Row 2+: Agent, Area, Segment, Business Type */}
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <FormControl fullWidth size="small">
          <InputLabel>Agent</InputLabel>
          <Select
            value={filters.agent}
            label="Agent"
            onChange={handleFilterChange('agent')}
            disabled={loading || hasRestrictedRole}
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

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <FormControl fullWidth size="small">
          <InputLabel>Area</InputLabel>
          <Select
            value={filters.area}
            label="Area"
            onChange={handleFilterChange('area')}
            disabled={loading}
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

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <FormControl fullWidth size="small">
          <InputLabel>Segment</InputLabel>
          <Select
            value={filters.segment}
            label="Segment"
            onChange={handleFilterChange('segment')}
            disabled={loading}
          >
            <MenuItem value="">All Segments</MenuItem>
            <MenuItem value="RESELLER">RESELLER</MenuItem>
            <MenuItem value="HORECA">HORECA</MenuItem>
            <MenuItem value="OTHER">OTHER</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <FormControl fullWidth size="small">
          <InputLabel>Business Type</InputLabel>
          <Select
            value={filters.business_type}
            label="Business Type"
            onChange={handleFilterChange('business_type')}
            disabled={loading}
          >
            <MenuItem value="">All Business Types</MenuItem>
            <MenuItem value="Hotel">Hotel</MenuItem>
            <MenuItem value="Resto">Resto</MenuItem>
            <MenuItem value="Catering">Catering</MenuItem>
            <MenuItem value="Retail Tradisional">Retail Tradisional</MenuItem>
          </Select>
        </FormControl>
      </Grid>
    </Grid>
  );
};

export default DistribusiFilters;
