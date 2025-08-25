'use client';

import { useAuth } from '@/app/context/AuthContext';
import { useCheckRoles } from '@/app/hooks/useCheckRoles';
import { getPageRoles } from '@/config/roles';
import { Box, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import ProtectedRoute from '../../../components/auth/ProtectedRoute';
import PageContainer from '../../../components/container/PageContainer';
import KaryawanOverdueTable from '../../../components/kasbon/KaryawanOverdueTable';
import KasbonFilters, { KasbonFilterValues } from '../../../components/kasbon/KasbonFilters';

const NonPerformingList = () => {
  const { user, roles, refreshRoles } = useAuth();
  
  // Check access for allowed roles (configurable via roles config)
  const accessCheck = useCheckRoles(getPageRoles('KASBON_DASHBOARD'));
  
  // Log access check result for debugging
  console.log('Non-Performing List Access Check:', accessCheck);
  
  // Initialize filters with empty values to avoid hydration mismatch
  const [filters, setFilters] = useState<KasbonFilterValues>({
    month: '',
    year: '',
    employer: '',
    placement: '',
    project: ''
  });

  // Set initial date values in useEffect to avoid hydration issues
  useEffect(() => {
    const currentDate = new Date();
    const currentMonth = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const currentYear = currentDate.getFullYear().toString();
    
    setFilters(prev => ({
      ...prev,
      month: currentMonth,
      year: currentYear
    }));
  }, []);

  const handleFiltersChange = (newFilters: KasbonFilterValues) => {
    console.log('Filters changed:', newFilters);
    setFilters(newFilters);
  };

  return (
    <PageContainer title="Non-Performing Client List" description="View and manage non-performing clients">
      <Box>
        {/* Header */}
        <Box mb={3}>
          <Typography variant="h3" fontWeight="bold" mb={1}>
            Non-Performing Client List
          </Typography>
          <Typography variant="body1" color="textSecondary">
            View and manage employees with overdue kasbon payments
          </Typography>
        </Box>

        {/* Filters */}
        <Box mb={3}>
          <KasbonFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
          />
        </Box>

        {/* Non-Performing Clients Table */}
        <KaryawanOverdueTable
          filters={{
            employer: filters.employer,
            placement: filters.placement,
            project: filters.project,
            month: filters.month,
            year: filters.year
          }}
          title="Non-Performing Clients"
        />
      </Box>
    </PageContainer>
  );
};

export default function ProtectedNonPerformingList() {
  return (
    <ProtectedRoute requiredRoles={getPageRoles('KASBON_DASHBOARD')}>
      <NonPerformingList />
    </ProtectedRoute>
  );
}
