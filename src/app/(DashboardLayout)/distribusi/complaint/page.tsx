"use client";

import PageContainer from "@/app/components/container/PageContainer";
import DistribusiComplaintTable from "@/app/components/distribusi/DistribusiComplaintTable";
import ProtectedRoute from "@/app/components/auth/ProtectedRoute";
import { useAuth } from "@/app/context/AuthContext";
import { getAgentNameFromRole, getPageRoles, getRestrictedRoles } from '@/config/roles';
import { Box, Typography } from "@mui/material";
import { useState } from "react";

const DistribusiComplaintPage = () => {
  const { roles } = useAuth();
  const [filters, setFilters] = useState({
    month: '',
    year: '',
    alasan: ''
  });

  // Get restricted roles from config
  const restrictedRoles = getRestrictedRoles();
  
  // Check if current user has a restricted role
  const hasRestrictedRole = roles.some(role => restrictedRoles.includes(role));
  const userRoleForFiltering = roles.find(role => restrictedRoles.includes(role));

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
            filters={{
              ...filters,
              agent: hasRestrictedRole ? getAgentNameFromRole(userRoleForFiltering!) : undefined
            }}
            title="Product Complaints"
          />
        </Box>
      </Box>
    </PageContainer>
  );
};

export default function ProtectedDistribusiComplaintPage() {
  return (
    <ProtectedRoute requiredRoles={getPageRoles('DISTRIBUSI_DASHBOARD')}>
      <DistribusiComplaintPage />
    </ProtectedRoute>
  );
}
