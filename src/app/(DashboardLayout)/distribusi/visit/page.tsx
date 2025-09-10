"use client";

import PageContainer from "@/app/components/container/PageContainer";
import DistribusiVisitTable from "@/app/components/distribusi/DistribusiVisitTable";
import { useAuth } from "@/app/context/AuthContext";
import { Box, Typography } from "@mui/material";
import { useState } from "react";

const DistribusiVisitPage = () => {
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
      <PageContainer title="Distribusi Visits" description="View sales visits">
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
    <PageContainer title="Distribusi Visits" description="View sales visits">
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
          <Typography variant="h4">Sales Visits</Typography>
        </Box>

        <Box sx={{ 
          flex: 1,
          width: '100%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          gap: 3
        }}>
          <DistribusiVisitTable 
            filters={filters}
            title="Sales Visits"
          />
        </Box>
      </Box>
    </PageContainer>
  );
};

export default DistribusiVisitPage;
