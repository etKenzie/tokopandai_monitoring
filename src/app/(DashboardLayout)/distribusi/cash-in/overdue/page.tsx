"use client";

import PageContainer from "@/app/components/container/PageContainer";
import DistribusiOverdueTable from "@/app/components/distribusi/DistribusiOverdueTable";
import { useAuth } from "@/app/context/AuthContext";
import { Box, Typography } from "@mui/material";
import { useState } from "react";

const DistribusiOverduePage = () => {
  const { roles } = useAuth();
  const [filters, setFilters] = useState({
    month: '',
    agent: '',
    segment: '',
    area: ''
  });

  const hasAccess = ["distribusi", "admin"].some(r => roles.includes(r));

  if (!hasAccess) {
    return (
      <PageContainer title="Distribusi Overdue" description="View overdue distribusi orders">
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
    <PageContainer title="Distribusi Overdue" description="View overdue distribusi orders">
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
          <Typography variant="h4">Distribusi Overdue Orders</Typography>
        </Box>

        <Box sx={{ 
          flex: 1,
          width: '100%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          gap: 3
        }}>
          <DistribusiOverdueTable 
            filters={filters}
            title="Overdue Orders"
          />
        </Box>
      </Box>
    </PageContainer>
  );
};

export default DistribusiOverduePage;
