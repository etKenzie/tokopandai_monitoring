import { Box, Typography } from '@mui/material';
import React from 'react';
import { RepaymentRiskResponse } from '../../api/kasbon/KasbonSlice';
import SummaryTiles from '../shared/SummaryTiles';

interface RepaymentRiskSummaryProps {
  repaymentRiskData: RepaymentRiskResponse | null;
  isLoading: boolean;
}

const RepaymentRiskSummary: React.FC<RepaymentRiskSummaryProps> = ({
  repaymentRiskData,
  isLoading
}) => {
  // if (isLoading) {
  //   return (
  //     <Box display="flex" justifyContent="center" alignItems="center" height="200px">
  //       <CircularProgress />
  //     </Box>
  //   );
  // }

  if (!repaymentRiskData) {
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
        title: "Total Expected Repayment", 
        value: repaymentRiskData?.total_expected_repayment || 0,
        isCurrency: true,
        isLoading: isLoading
      },
      { 
        title: "Total Kasbon Principal Collected", 
        value: repaymentRiskData?.total_kasbon_principal_collected || 0,
        isCurrency: true,
        isLoading: isLoading
      },
      { 
        title: "Total Admin Fee Collected", 
        value: repaymentRiskData?.total_admin_fee_collected || 0,
        isCurrency: true,
        isLoading: isLoading
      },
      { 
        title: "Total Unrecovered Repayment", 
        value: repaymentRiskData?.total_unrecovered_repayment || 0,
        isCurrency: true,
        isLoading: isLoading
      },
      { 
        title: "Total Unrecovered Kasbon Principal", 
        value: repaymentRiskData?.total_unrecovered_kasbon_principal || 0,
        isCurrency: true,
        isLoading: isLoading
      },
      { 
        title: "Total Unrecovered Admin Fee", 
        value: repaymentRiskData?.total_unrecovered_admin_fee || 0,
        isCurrency: true,
        isLoading: isLoading
      },
      { 
        title: "Repayment Recovery Rate", 
        value: repaymentRiskData?.repayment_recovery_rate || 0,
        isCurrency: false,
        isLoading: isLoading
      },
      { 
        title: "Delinquencies Rate", 
        value: repaymentRiskData?.delinquencies_rate || 0,
        isCurrency: false,
        isLoading: isLoading
      },
      { 
        title: "Admin Fee Profit", 
        value: repaymentRiskData?.admin_fee_profit || 0,
        isCurrency: true,
        isLoading: isLoading
      },
    ];
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" mb={2}>
        Repayment Risk Summary
      </Typography>
      <SummaryTiles 
        tiles={createTiles()} 
        md={4} 
      />
    </Box>
  );
};

export default RepaymentRiskSummary;
