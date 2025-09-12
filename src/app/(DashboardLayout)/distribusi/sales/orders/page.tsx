"use client";

import PageContainer from "@/app/components/container/PageContainer";
import SalesOrdersTable from "@/app/components/distribusi/SalesOrdersTable";
import { useAuth } from "@/app/context/AuthContext";
import { Box, FormControl, Grid, InputLabel, MenuItem, Select, Typography } from "@mui/material";
import { useState } from "react";

const SalesOrdersPage = () => {
  const { roles } = useAuth();
  
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
    month: getCurrentMonthYear(), // Set default month immediately
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

  const hasAccess = ["distribusi", "admin"].some(r => roles.includes(r));

  if (!hasAccess) {
    return (
      <PageContainer title="Sales Orders" description="View sales orders">
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          height="60vh"
        >
          <Typography variant="h5" color="error">
            You don't have access to this page.
          </Typography>
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Sales Orders" description="View sales orders">
      <Box sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        width: '100%',
        overflow: 'hidden'
      }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          mb: 3,
          width: '100%'
        }}>
          <Typography variant="h4">Sales Orders</Typography>
        </Box>

        {/* Month Filter */}
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Select Month</InputLabel>
                <Select
                  value={filters.month}
                  label="Select Month"
                  onChange={(e) => setFilters(prev => ({ ...prev, month: e.target.value }))}
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
          <SalesOrdersTable 
            filters={filters}
            title="Sales Orders"
          />
        </Box>
      </Box>
    </PageContainer>
  );
};

export default SalesOrdersPage;
