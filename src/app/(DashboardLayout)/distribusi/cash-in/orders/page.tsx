"use client";

import ProtectedRoute from "@/app/components/auth/ProtectedRoute";
import PageContainer from "@/app/components/container/PageContainer";
import CashInOrdersTable from "@/app/components/distribusi/CashInOrdersTable";
import { useAuth } from "@/app/context/AuthContext";
import { useCheckRoles } from "@/app/hooks/useCheckRoles";
import { getAgentNameFromRole, getPageRoles, getRestrictedRoles } from "@/config/roles";
import { Box, FormControl, Grid, InputLabel, MenuItem, Select, Typography } from "@mui/material";
import { useState } from "react";

const CashInOrdersPage = () => {
  const { user, roles, refreshRoles } = useAuth();
  
  // Check access for allowed roles (configurable via roles config)
  const accessCheck = useCheckRoles(getPageRoles('DISTRIBUSI_DASHBOARD'));
  
  // Get restricted roles from config
  const restrictedRoles = getRestrictedRoles();
  
  // Check if current user has a restricted role
  const hasRestrictedRole = roles.some(role => restrictedRoles.includes(role));
  const userRoleForFiltering = roles.find(role => restrictedRoles.includes(role));
  
  // Log access check result for debugging
  console.log('Cash-In Orders Access Check:', accessCheck);
  console.log('User roles:', roles);
  console.log('Has restricted role:', hasRestrictedRole);
  console.log('User role for filtering:', userRoleForFiltering);
  
  // Get current month and year for default value
  const getCurrentMonthYear = () => {
    const currentDate = new Date();
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const currentMonth = monthNames[currentDate.getMonth()];
    const currentYear = currentDate.getFullYear();
    return `${currentMonth} ${currentYear}`;
  };

  const [filters, setFilters] = useState({
    payment_month: getCurrentMonthYear(), // Set default payment month immediately
    agent: '',
    segment: '',
    area: '',
    statusPayment: ''
  });

  // Generate month options for the last 12 months
  const generateMonthOptions = () => {
    const options = [];
    const currentDate = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const monthName = monthNames[date.getMonth()];
      const year = date.getFullYear();
      const value = `${monthName} ${year}`;
      options.push({ value, label: value });
    }
    
    return options;
  };

  const monthOptions = generateMonthOptions();

  return (
    <PageContainer title="Cash-In Orders" description="View cash-in orders by payment month">
      <Box>
        {/* Header */}
        <Box mb={3}>
          <Typography variant="h3" fontWeight="bold" mb={1}>
            Cash-In Orders
          </Typography>
          <Typography variant="body1" color="textSecondary">
            View and manage orders by payment month
          </Typography>
          {hasRestrictedRole && (
            <Typography variant="body2" color="info.main" sx={{ mt: 1, fontStyle: 'italic' }}>
              Showing data for {getAgentNameFromRole(userRoleForFiltering!)} only
            </Typography>
          )}
        </Box>

        {/* Payment Month Filter */}
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Select Payment Month</InputLabel>
                <Select
                  value={filters.payment_month}
                  label="Select Payment Month"
                  onChange={(e) => setFilters(prev => ({ ...prev, payment_month: e.target.value }))}
                >
                  {monthOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>

        <Box sx={{ 
          flex: 1,
          width: '100%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          gap: 3
        }}>
          <CashInOrdersTable 
            filters={filters}
            title="Cash-In Orders"
            agentName={hasRestrictedRole ? getAgentNameFromRole(userRoleForFiltering!) : undefined}
          />
        </Box>
      </Box>
    </PageContainer>
  );
};

export default function ProtectedCashInOrdersPage() {
  return (
    <ProtectedRoute requiredRoles={getPageRoles('DISTRIBUSI_DASHBOARD')}>
      <CashInOrdersPage />
    </ProtectedRoute>
  );
}

