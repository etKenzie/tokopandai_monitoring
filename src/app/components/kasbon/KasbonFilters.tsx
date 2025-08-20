'use client';

import {
    FormControl,
    Grid,
    InputLabel,
    MenuItem,
    Select,
    SelectChangeEvent
} from '@mui/material';
import { useEffect, useState } from 'react';
import type { KasbonFilters as KasbonFiltersType } from '../../api/kasbon/KasbonSlice';
import { fetchKasbonFilters } from '../../api/kasbon/KasbonSlice';

export interface KasbonFilterValues {
  month: string;
  year: string;
  employer: string;
  placement: string;
  project: string;
}

interface KasbonFiltersProps {
  filters: KasbonFilterValues;
  onFiltersChange: (filters: KasbonFilterValues) => void;
}

const KasbonFilters = ({ filters, onFiltersChange }: KasbonFiltersProps) => {
  const [availableFilters, setAvailableFilters] = useState<KasbonFiltersType | null>(null);
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

  const fetchFilters = async (employer?: string, placement?: string) => {
    setLoading(true);
    try {
      const response = await fetchKasbonFilters(employer, placement);
      setAvailableFilters(response.filters);
    } catch (error) {
      console.error('Failed to fetch filters:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchFilters();
  }, []);

  // Refetch filters when employer or placement changes
  useEffect(() => {
    if (filters.employer || filters.placement) {
      fetchFilters(filters.employer || undefined, filters.placement || undefined);
    }
  }, [filters.employer, filters.placement]);

  const handleFilterChange = (field: keyof KasbonFilterValues) => (
    event: SelectChangeEvent<string>
  ) => {
    const newFilters = { ...filters, [field]: event.target.value };
    onFiltersChange(newFilters);
  };

  return (
    <Grid container spacing={2}>
      {/* Month Filter */}
      <Grid size={{ xs: 12, sm: 6, md: 2 }}>
        <FormControl fullWidth size="small">
          <InputLabel>Month</InputLabel>
          <Select
            value={filters.month}
            label="Month"
            onChange={handleFilterChange('month')}
            disabled={loading}
          >
            {months.map((month) => (
              <MenuItem key={month.value} value={month.value}>
                {month.label}
              </MenuItem>
            ))}
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
            onChange={handleFilterChange('year')}
            disabled={loading}
          >
            {years.map((year) => (
              <MenuItem key={year} value={year}>
                {year}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      {/* Employer Filter */}
      <Grid size={{ xs: 12, sm: 6, md: 2 }}>
        <FormControl fullWidth size="small">
          <InputLabel>Employer</InputLabel>
          <Select
            value={filters.employer}
            label="Employer"
            onChange={handleFilterChange('employer')}
            disabled={loading}
          >
            <MenuItem value="">All Employers</MenuItem>
            {availableFilters?.employers.map((employer) => (
              <MenuItem key={employer} value={employer}>
                {employer}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      {/* Placement Filter */}
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <FormControl fullWidth size="small">
          <InputLabel>Placement</InputLabel>
          <Select
            value={filters.placement}
            label="Placement"
            onChange={handleFilterChange('placement')}
            disabled={loading}
          >
            <MenuItem value="">All Placements</MenuItem>
            {availableFilters?.placements.map((placement) => (
              <MenuItem key={placement} value={placement}>
                {placement}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      {/* Project Filter */}
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <FormControl fullWidth size="small">
          <InputLabel>Project</InputLabel>
          <Select
            value={filters.project}
            label="Project"
            onChange={handleFilterChange('project')}
            disabled={loading}
          >
            <MenuItem value="">All Projects</MenuItem>
            {availableFilters?.projects.map((project) => (
              <MenuItem key={project} value={project}>
                {project}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
    </Grid>
  );
};

export default KasbonFilters;
