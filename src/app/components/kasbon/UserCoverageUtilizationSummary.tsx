import { Box, CircularProgress, Typography } from '@mui/material';
import React from 'react';
import SummaryTiles from '../shared/SummaryTiles';

interface UserCoverageUtilizationSummaryProps {
  userCoverageData: any;
  loanRequestsData: any;
  loanDisbursementData: any;
  isLoading: boolean;
}

const UserCoverageUtilizationSummary: React.FC<UserCoverageUtilizationSummaryProps> = ({
  userCoverageData,
  loanRequestsData,
  loanDisbursementData,
  isLoading
}) => {
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (!userCoverageData || !loanRequestsData || !loanDisbursementData) {
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
        value: userCoverageData.total_eligible_employees || 0,
        isCurrency: false
      },
      { 
        title: "Total Loan Request", 
        value: userCoverageData.total_kasbon_requests || 0,
        isCurrency: false
      },
      { 
        title: "Penetration Rate", 
        value: userCoverageData.penetration_rate || 0,
        isCurrency: false
      },
      { 
        title: "Total Approved Requests", 
        value: loanRequestsData.total_approved_requests || 0,
        isCurrency: false
      },
      { 
        title: "Total Rejected Requests", 
        value: loanRequestsData.total_rejected_requests || 0,
        isCurrency: false
      },
      { 
        title: "Approval Rate", 
        value: loanRequestsData.approval_rate || 0,
        isCurrency: false
      },
      { 
        title: "Total New Borrowers", 
        value: userCoverageData.total_first_borrow || 0,
        isCurrency: false
      },
      { 
        title: "Average Approval Time", 
        value: loanRequestsData.average_approval_time || 0,
        isCurrency: false
      },
      { 
        title: "Total Disbursed Amount", 
        value: loanDisbursementData.total_disbursed_amount || 0,
        isCurrency: true,
        mdSize: 4
      },
      { 
        title: "Average Disbursed Amount", 
        value: loanDisbursementData.average_disbursed_amount || 0,
        isCurrency: true,
        mdSize: 4
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
