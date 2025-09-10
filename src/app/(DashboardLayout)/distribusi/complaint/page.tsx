"use client";

import PageContainer from "@/app/components/container/PageContainer";
import DistribusiComplaintTable from "@/app/components/distribusi/DistribusiComplaintTable";
import { useAuth } from "@/app/context/AuthContext";
import { Box, Typography } from "@mui/material";
import { useState } from "react";

const DistribusiComplaintPage = () => {
  const { roles } = useAuth();
  const [filters, setFilters] = useState({
    month: '',
    year: '',
    alasan: ''
  });

  const hasAccess = ["distribusi", "admin"].some(r => roles.includes(r));

  if (!hasAccess) {
    return (
      <PageContainer title="Distribusi Complaints" description="View product complaints">
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
    <PageContainer title="Distribusi Complaints" description="View product complaints">
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
          <Typography variant="h4">Product Complaints</Typography>
        </Box>

        <Box sx={{ 
          flex: 1,
          width: '100%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          gap: 3
        }}>
          <DistribusiComplaintTable 
            filters={filters}
            title="Product Complaints"
          />
        </Box>
      </Box>
    </PageContainer>
  );
};

export default DistribusiComplaintPage;
