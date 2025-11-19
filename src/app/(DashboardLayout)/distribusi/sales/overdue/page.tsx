"use client";

import ProtectedRoute from "@/app/components/auth/ProtectedRoute";
import PageContainer from "@/app/components/container/PageContainer";
import OverdueOrdersTable from "@/app/components/distribusi/OverdueOrdersTable";
import { useAuth } from "@/app/context/AuthContext";
import { useCheckRoles } from "@/app/hooks/useCheckRoles";
import { getAgentNameFromRole, getPageRoles, getRestrictedRoles } from "@/config/roles";
import { Box, FormControl, Grid, InputLabel, MenuItem, Select, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";

const OverduePage = () => {
  const { user, roles, refreshRoles } = useAuth();
  
  // Check access for allowed roles (configurable via roles config)
  const accessCheck = useCheckRoles(getPageRoles('DISTRIBUSI_DASHBOARD'));
  
  // Get restricted roles from config
  const restrictedRoles = getRestrictedRoles();
  
  // Check if current user has a restricted role
  const hasRestrictedRole = roles.some(role => restrictedRoles.includes(role));
  const userRoleForFiltering = roles.find(role => restrictedRoles.includes(role));
  
  // Log access check result for debugging
  console.log('Overdue Orders Access Check:', accessCheck);
  console.log('User roles:', roles);
  console.log('Has restricted role:', hasRestrictedRole);
  console.log('User role for filtering:', userRoleForFiltering);

  // Date range type: 'all' or 'custom'
  const [dateRangeType, setDateRangeType] = useState<'all' | 'custom'>('all');

  // Initialize filters with empty values to avoid hydration mismatch
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    agent: ''
  });

  // State for available agents (populated from orders)
  const [availableAgents, setAvailableAgents] = useState<string[]>([]);

  // Set initial date values when custom is selected
  useEffect(() => {
    if (dateRangeType === 'custom' && !filters.start_date && !filters.end_date) {
      const today = new Date();
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(today.getMonth() - 1);
      
      const formatDate = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      setFilters(prev => ({
        ...prev,
        start_date: formatDate(oneMonthAgo),
        end_date: formatDate(today)
      }));
    } else if (dateRangeType === 'all') {
      // Clear dates when switching to 'all'
      setFilters(prev => ({
        ...prev,
        start_date: '',
        end_date: ''
      }));
    }
  }, [dateRangeType]);

  return (
    <PageContainer title="Overdue Orders" description="View and manage overdue orders">
      <Box>
        {/* Header */}
        <Box mb={3}>
          <Typography variant="h3" fontWeight="bold" mb={1}>
            Overdue Orders
          </Typography>
          <Typography variant="body1" color="textSecondary">
            View and analyze overdue orders. Select "All" to view all overdue orders or "Custom" to filter by date range.
          </Typography>
          {hasRestrictedRole && (
            <Typography variant="body2" color="info.main" sx={{ mt: 1, fontStyle: 'italic' }}>
              Showing data for {getAgentNameFromRole(userRoleForFiltering!)} only
            </Typography>
          )}
        </Box>

        {/* Filters */}
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Date Range</InputLabel>
                <Select
                  value={dateRangeType}
                  label="Date Range"
                  onChange={(e) => setDateRangeType(e.target.value as 'all' | 'custom')}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="custom">Custom</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {dateRangeType === 'custom' && (
              <>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    label="Start Date"
                    value={filters.start_date}
                    onChange={(e) => setFilters(prev => ({ ...prev, start_date: e.target.value }))}
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    label="End Date"
                    value={filters.end_date}
                    onChange={(e) => setFilters(prev => ({ ...prev, end_date: e.target.value }))}
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </Grid>
              </>
            )}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Agent</InputLabel>
                <Select
                  value={filters.agent}
                  label="Agent"
                  onChange={(e) => setFilters(prev => ({ ...prev, agent: e.target.value }))}
                  disabled={hasRestrictedRole}
                >
                  <MenuItem value="">All Agents</MenuItem>
                  {availableAgents.map((agent) => (
                    <MenuItem key={agent} value={agent}>
                      {agent}
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
          <OverdueOrdersTable 
            filters={filters}
            title="Overdue Orders"
            hasRestrictedRole={hasRestrictedRole}
            userRoleForFiltering={userRoleForFiltering}
            onAgentsUpdate={setAvailableAgents}
          />
        </Box>
      </Box>
    </PageContainer>
  );
};

export default function ProtectedOverduePage() {
  return (
    <ProtectedRoute requiredRoles={getPageRoles('DISTRIBUSI_DASHBOARD')}>
      <OverduePage />
    </ProtectedRoute>
  );
}

