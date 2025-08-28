import { Box, Typography } from '@mui/material';
import React from 'react';
import { CoverageUtilizationResponse } from '../../api/kasbon/KasbonSlice';
import SummaryTiles from '../shared/SummaryTiles';

interface UserCoverageUtilizationSummaryProps {
  coverageUtilizationData: CoverageUtilizationResponse | null;
  isLoading: boolean;
}

const UserCoverageUtilizationSummary: React.FC<UserCoverageUtilizationSummaryProps> = ({
  coverageUtilizationData,
  isLoading
}) => {
  // if (isLoading) {
  //   return (
  //     <Box display="flex" justifyContent="center" alignItems="center" height="200px">
  //       <CircularProgress />
  //     </Box>
  //   );
  // }

  if (!coverageUtilizationData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="200px">
        <Typography variant="body1" color="textSecondary">
          No data available
        </Typography>
      </Box>
    );
  }

  // Create tiles data structure for SummaryTiles component
  const createTiles = () => {
    return [
      { 
        title: "Total Eligible Employees", 
        value: coverageUtilizationData?.total_eligible_employees || 0,
        isCurrency: false,
        isLoading: isLoading
      },
      { 
        title: "Total Loan Requests", 
        value: coverageUtilizationData?.total_loan_requests || 0,
        isCurrency: false,
        isLoading: isLoading
      },
      { 
        title: "Penetration Rate", 
        value: coverageUtilizationData?.penetration_rate || 0,
        isCurrency: false,
        isLoading: isLoading
      },
      { 
        title: "Total Approved Requests", 
        value: coverageUtilizationData?.total_approved_requests || 0,
        isCurrency: false,
        isLoading: isLoading
      },
      { 
        title: "Total Rejected Requests", 
        value: coverageUtilizationData?.total_rejected_requests || 0,
        isCurrency: false,
        isLoading: isLoading
      },
      { 
        title: "Approval Rate", 
        value: coverageUtilizationData?.approval_rate || 0,
        isCurrency: false,
        isLoading: isLoading
      },
      { 
        title: "Total New Borrowers", 
        value: coverageUtilizationData?.total_new_borrowers || 0,
        isCurrency: false,
        isLoading: isLoading
      },
      { 
        title: "Average Approval Days", 
        value: coverageUtilizationData?.average_approval_time || 0,
        isCurrency: false,
        isLoading: isLoading,
        // unit: "Days"
      },
      { 
        title: "Total Disbursed Amount", 
        value: coverageUtilizationData?.total_disbursed_amount || 0,
        isCurrency: true,
        mdSize: 4,
        isLoading: isLoading
      },
      { 
        title: "Average Disbursed Amount", 
        value: coverageUtilizationData?.average_disbursed_amount || 0,
        isCurrency: true,
        mdSize: 4,
        isLoading: isLoading
      },
    ];
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" mb={2}>
        User Coverage and Utilization Summary
      </Typography>
      <SummaryTiles 
        tiles={createTiles()} 
        md={2} 
      />
    </Box>
  );
};

export default UserCoverageUtilizationSummary;
