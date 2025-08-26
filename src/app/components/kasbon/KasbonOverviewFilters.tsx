'use client';

import { Box, FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import React from 'react';

export interface KasbonOverviewFilterValues {
  month: string;
  year: string;
}

interface KasbonOverviewFiltersProps {
  filters: KasbonOverviewFilterValues;
  onFiltersChange: (filters: KasbonOverviewFilterValues) => void;
}

const KasbonOverviewFilters = ({ filters, onFiltersChange }: KasbonOverviewFiltersProps) => {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  const handleMonthChange = (month: string) => {
    onFiltersChange({ ...filters, month });
  };

  const handleYearChange = (year: string) => {
    onFiltersChange({ ...filters, year });
  };

  return (
    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
      <FormControl sx={{ minWidth: 120 }}>
        <InputLabel>Month</InputLabel>
        <Select
          value={filters.month}
          label="Month"
          onChange={(e) => handleMonthChange(e.target.value)}
        >
          {months.map((month) => (
            <MenuItem key={month.value} value={month.value}>
              {month.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl sx={{ minWidth: 120 }}>
        <InputLabel>Year</InputLabel>
        <Select
          value={filters.year}
          label="Year"
          onChange={(e) => handleYearChange(e.target.value)}
        >
          {years.map((year) => (
            <MenuItem key={year} value={year.toString()}>
              {year}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default KasbonOverviewFilters;
