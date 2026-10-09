'use client';

import { fetchCashInFilters, OrderFiltersData } from '@/app/api/distribusi/DistribusiSlice';
import SearchableSelect, { withAllOption } from '@/app/components/shared/SearchableSelect';
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
        
        const response = await fetchCashInFilters({
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

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <SearchableSelect
          label="Agent"
          value={filters.agent}
          disabled={loading || hasRestrictedRole}
          options={withAllOption('All Agents', availableFilters?.agents)}
          onChange={(agent) => onFiltersChange({ ...filters, agent })}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <SearchableSelect
          label="Area"
          value={filters.area}
          disabled={loading}
          options={withAllOption('All Areas', availableFilters?.areas)}
          onChange={(area) => onFiltersChange({ ...filters, area })}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <SearchableSelect
          label="Segment"
          value={filters.segment}
          disabled={loading}
          options={[
            { value: '', label: 'All Segments' },
            { value: 'RESELLER', label: 'RESELLER' },
            { value: 'HORECA', label: 'HORECA' },
            { value: 'OTHER', label: 'OTHER' },
          ]}
          onChange={(segment) => onFiltersChange({ ...filters, segment })}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <SearchableSelect
          label="Business Type"
          value={filters.business_type}
          disabled={loading}
          options={[
            { value: '', label: 'All Business Types' },
            { value: 'Hotel', label: 'Hotel' },
            { value: 'Resto', label: 'Resto' },
            { value: 'Catering', label: 'Catering' },
            { value: 'Retail Tradisional', label: 'Retail Tradisional' },
          ]}
          onChange={(business_type) => onFiltersChange({ ...filters, business_type })}
        />
      </Grid>
    </Grid>
  );
};

export default DistribusiFilters;
