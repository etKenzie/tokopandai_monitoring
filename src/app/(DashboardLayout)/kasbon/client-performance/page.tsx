'use client';

import { useAuth } from '@/app/context/AuthContext';
import { useCheckRoles } from '@/app/hooks/useCheckRoles';
import { getPageRoles } from '@/config/roles';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { fetchKaryawan, fetchKasbonLoanFees, fetchKasbonSummary, fetchLoanDisbursement, fetchLoanPurpose, fetchLoanRequests, fetchLoanRisk, fetchUserCoverage, fetchCoverageUtilization, fetchRepaymentRisk, Karyawan, KasbonLoanFeesResponse, KasbonSummaryResponse, LoanDisbursementResponse, LoanPurposeResponse, LoanRequestsResponse, LoanRiskResponse, UserCoverageResponse, CoverageUtilizationResponse, RepaymentRiskResponse } from '../../../api/kasbon/KasbonSlice';
import ProtectedRoute from '../../../components/auth/ProtectedRoute';
import PageContainer from '../../../components/container/PageContainer';
import KasbonFilters, { KasbonFilterValues } from '../../../components/kasbon/KasbonFilters';
import LoanDisbursementChart from '../../../components/kasbon/LoanDisbursementChart';
import LoanPurposeChart from '../../../components/kasbon/LoanPurposeChart';
import LoanRiskChart from '../../../components/kasbon/LoanRiskChart';
import UserCoverageChart from '../../../components/kasbon/UserCoverageChart';
import UserCoverageUtilizationSummary from '../../../components/kasbon/UserCoverageUtilizationSummary';
import CoverageUtilizationChart from '../../../components/kasbon/CoverageUtilizationChart';
import RepaymentRiskSummary from '../../../components/kasbon/RepaymentRiskSummary';
import RepaymentRiskChart from '../../../components/kasbon/RepaymentRiskChart';
import SummaryTiles from '../../../components/shared/SummaryTiles';

const KasbonDashboard = () => {
  const { user, roles, refreshRoles } = useAuth();
  
  // Check access for allowed roles (configurable via roles config)
  const accessCheck = useCheckRoles(getPageRoles('KASBON_DASHBOARD'));
  
  // Log access check result for debugging
  console.log('Kasbon Dashboard Access Check:', accessCheck);
  
  const [karyawan, setKaryawan] = useState<Karyawan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [summaryData, setSummaryData] = useState<KasbonSummaryResponse | null>(null);
  const [loanFeesData, setLoanFeesData] = useState<KasbonLoanFeesResponse | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [loanFeesLoading, setLoanFeesLoading] = useState(false);
  const [loanRiskData, setLoanRiskData] = useState<LoanRiskResponse | null>(null);
  const [loanRiskLoading, setLoanRiskLoading] = useState(false);
  const [userCoverageData, setUserCoverageData] = useState<UserCoverageResponse | null>(null);
  const [userCoverageLoading, setUserCoverageLoading] = useState(false);
  const [loanRequestsData, setLoanRequestsData] = useState<LoanRequestsResponse | null>(null);
  const [loanRequestsLoading, setLoanRequestsLoading] = useState(false);
  const [loanDisbursementData, setLoanDisbursementData] = useState<LoanDisbursementResponse | null>(null);
  const [loanDisbursementLoading, setLoanDisbursementLoading] = useState(false);
  const [coverageUtilizationData, setCoverageUtilizationData] = useState<CoverageUtilizationResponse | null>(null);
  const [coverageUtilizationLoading, setCoverageUtilizationLoading] = useState(false);
  const [repaymentRiskData, setRepaymentRiskData] = useState<RepaymentRiskResponse | null>(null);
  const [repaymentRiskLoading, setRepaymentRiskLoading] = useState(false);
  const [loanPurposeData, setLoanPurposeData] = useState<LoanPurposeResponse | null>(null);
  const [loanPurposeLoading, setLoanPurposeLoading] = useState(false);
  
  // Initialize filters with empty values to avoid hydration mismatch
  const [filters, setFilters] = useState<KasbonFilterValues>({
    month: '',
    year: '',
    employer: '',
    placement: '',
    project: ''
  });

  // Set initial date values in useEffect to avoid hydration issues
  useEffect(() => {
    const currentDate = new Date();
    const currentMonth = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const currentYear = currentDate.getFullYear().toString();
    
    setFilters(prev => ({
      ...prev,
      month: currentMonth,
      year: currentYear
    }));
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchKaryawan();
      setKaryawan(response.results);
      setTotalCount(response.count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchSummaryData = useCallback(async (currentFilters: KasbonFilterValues) => {
    console.log('Fetching summary data with filters:', currentFilters);
    setSummaryLoading(true);
    try {
      // Only fetch summary if we have month and year (required)
      if (currentFilters.month && currentFilters.year) {
        const response = await fetchKasbonSummary({
          employer: currentFilters.employer || undefined,
          sourced_to: currentFilters.placement || undefined,
          project: currentFilters.project || undefined,
          month: currentFilters.month,
          year: currentFilters.year,
        });
        console.log('Summary data response:', response);
        setSummaryData(response);
      } else {
        setSummaryData(null);
      }
    } catch (err) {
      console.error('Failed to fetch summary data:', err);
      setSummaryData(null);
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  const fetchLoanFeesData = useCallback(async (currentFilters: KasbonFilterValues) => {
    setLoanFeesLoading(true);
    try {
      // Only fetch loan fees if we have month and year (required)
      if (currentFilters.month && currentFilters.year) {
        const response = await fetchKasbonLoanFees({
          sourced_to: currentFilters.placement || undefined,
          project: currentFilters.project || undefined,
          month: currentFilters.month,
          year: currentFilters.year,
        });
        setLoanFeesData(response);
      } else {
        setLoanFeesData(null);
      }
    } catch (err) {
      console.error('Failed to fetch loan fees data:', err);
      setLoanFeesData(null);
    } finally {
      setLoanFeesLoading(false);
    }
  }, []);

  const fetchLoanRiskData = async (currentFilters: KasbonFilterValues) => {
    setLoanRiskLoading(true);
    try {
      // Only fetch loan risk if we have month and year (required)
      if (currentFilters.month && currentFilters.year) {
        const response = await fetchLoanRisk({
          employer: currentFilters.employer || undefined,
          sourced_to: currentFilters.placement || undefined,
          project: currentFilters.project || undefined,
          month: currentFilters.month,
          year: currentFilters.year,
        });
        setLoanRiskData(response);
      } else {
        setLoanRiskData(null);
      }
    } catch (err) {
      console.error('Failed to fetch loan risk data:', err);
      setLoanRiskData(null);
    } finally {
      setLoanRiskLoading(false);
    }
  };

  const fetchUserCoverageData = useCallback(async (currentFilters: KasbonFilterValues) => {
    setUserCoverageLoading(true);
    try {
      // Only fetch user coverage if we have month and year (required)
      if (currentFilters.month && currentFilters.year) {
        const response = await fetchUserCoverage({
          employer: currentFilters.employer || undefined,
          sourced_to: currentFilters.placement || undefined,
          project: currentFilters.project || undefined,
          month: currentFilters.month,
          year: currentFilters.year,
        });
        setUserCoverageData(response);
      } else {
        setUserCoverageData(null);
      }
    } catch (err) {
      console.error('Failed to fetch user coverage data:', err);
      setUserCoverageData(null);
    } finally {
      setUserCoverageLoading(false);
    }
  }, []);

  const fetchLoanRequestsData = useCallback(async (currentFilters: KasbonFilterValues) => {
    setLoanRequestsLoading(true);
    try {
      // Only fetch loan requests if we have month and year (required)
      if (currentFilters.month && currentFilters.year) {
        const response = await fetchLoanRequests({
          employer: currentFilters.employer || undefined,
          sourced_to: currentFilters.placement || undefined,
          project: currentFilters.project || undefined,
          month: currentFilters.month,
          year: currentFilters.year,
        });
        setLoanRequestsData(response);
      } else {
        setLoanRequestsData(null);
      }
    } catch (err) {
      console.error('Failed to fetch loan requests data:', err);
      setLoanRequestsData(null);
    } finally {
      setLoanRequestsLoading(false);
    }
  }, []);

  const fetchLoanDisbursementData = useCallback(async (currentFilters: KasbonFilterValues) => {
    setLoanDisbursementLoading(true);
    try {
      // Only fetch loan disbursement if we have month and year (required)
      if (currentFilters.month && currentFilters.year) {
        const response = await fetchLoanDisbursement({
          employer: currentFilters.employer || undefined,
          project: currentFilters.project || undefined,
          month: currentFilters.month,
          year: currentFilters.year,
        });
        setLoanDisbursementData(response);
      } else {
        setLoanDisbursementData(null);
      }
    } catch (err) {
      console.error('Failed to fetch loan disbursement data:', err);
      setLoanDisbursementData(null);
    } finally {
      setLoanDisbursementLoading(false);
    }
  }, []);

  const fetchLoanPurposeData = useCallback(async (currentFilters: KasbonFilterValues) => {
    setLoanPurposeLoading(true);
    try {
      // Only fetch loan purpose if we have month and year (required)
      if (currentFilters.month && currentFilters.year) {
        const response = await fetchLoanPurpose({
          employer: currentFilters.employer || undefined,
          sourced_to: currentFilters.placement || undefined,
          project: currentFilters.project || undefined,
          month: currentFilters.month,
          year: currentFilters.year,
        });
        setLoanPurposeData(response);
      } else {
        setLoanPurposeData(null);
      }
    } catch (err) {
      console.error('Failed to fetch loan purpose data:', err);
      setLoanPurposeData(null);
    } finally {
      setLoanPurposeLoading(false);
    }
  }, []);

  const fetchCoverageUtilizationData = useCallback(async (currentFilters: KasbonFilterValues) => {
    setCoverageUtilizationLoading(true);
    try {
      // Only fetch coverage utilization if we have month and year (required)
      if (currentFilters.month && currentFilters.year) {
        const response = await fetchCoverageUtilization({
          employer: currentFilters.employer || undefined,
          sourced_to: currentFilters.placement || undefined,
          project: currentFilters.project || undefined,
          month: currentFilters.month,
          year: currentFilters.year,
        });
        setCoverageUtilizationData(response);
      } else {
        setCoverageUtilizationData(null);
      }
    } catch (err) {
      console.error('Failed to fetch coverage utilization data:', err);
      setCoverageUtilizationData(null);
    } finally {
      setCoverageUtilizationLoading(false);
    }
  }, []);

  const fetchRepaymentRiskData = useCallback(async (currentFilters: KasbonFilterValues) => {
    setRepaymentRiskLoading(true);
    try {
      // Only fetch repayment risk if we have month and year (required)
      if (currentFilters.month && currentFilters.year) {
        const response = await fetchRepaymentRisk({
          employer: currentFilters.employer || undefined,
          sourced_to: currentFilters.placement || undefined,
          project: currentFilters.project || undefined,
          month: currentFilters.month,
          year: currentFilters.year,
        });
        setRepaymentRiskData(response);
      } else {
        setRepaymentRiskData(null);
      }
    } catch (err) {
      console.error('Failed to fetch repayment risk data:', err);
      setRepaymentRiskData(null);
    } finally {
      setRepaymentRiskLoading(false);
    }
  }, []);

  const handleFiltersChange = useCallback((newFilters: KasbonFilterValues) => {
    console.log('Filters changed:', newFilters);
    setFilters(newFilters);
    // fetchSummaryData(newFilters);
    // fetchLoanFeesData(newFilters);
    // fetchLoanRiskData(newFilters);
    // fetchUserCoverageData(newFilters);
    // fetchLoanRequestsData(newFilters);
    // fetchLoanDisbursementData(newFilters);
    fetchLoanPurposeData(newFilters);
    fetchCoverageUtilizationData(newFilters);
    fetchRepaymentRiskData(newFilters);
  }, [fetchCoverageUtilizationData, fetchRepaymentRiskData]);


  useEffect(() => {
    // Only fetch data if month and year are set (after initialization)
    if (filters.month && filters.year) {
      // fetchSummaryData(filters);
      // fetchLoanFeesData(filters);
      // fetchLoanRiskData(filters);
      // fetchUserCoverageData(filters);
      // fetchLoanRequestsData(filters);
      // fetchLoanDisbursementData(filters);
      fetchLoanPurposeData(filters);
      fetchCoverageUtilizationData(filters);
      fetchRepaymentRiskData(filters);
    }
  }, [filters.month, filters.year, filters.employer, filters.placement, filters.project]); // Run when any filter changes


  return (
    <PageContainer title="Kasbon Dashboard" description="Manage kasbon data for employees">
      <Box>
        {/* Header */}
        <Box mb={3}>
          <Typography variant="h3" fontWeight="bold" mb={1}>
            Kasbon Dashboard
          </Typography>
         
        </Box>

        {/* Filters */}
        <Box mb={3}>
          <KasbonFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
          />
        </Box>

        {/* User Coverage and Utilization Summary */}
        <Box mb={3}>
          <UserCoverageUtilizationSummary
            coverageUtilizationData={coverageUtilizationData}
            isLoading={coverageUtilizationLoading}
          />
        </Box>

        {/* Coverage Utilization Chart */}
        <Box mb={3}>
          <CoverageUtilizationChart 
            filters={{
              employer: filters.employer,
              placement: filters.placement,
              project: filters.project,
              month: filters.month,
              year: filters.year
            }}
          />
        </Box>

        

          {/* Loan Purpose Chart */}
        <Box mb={3}>
           {/* <Typography variant="h5" fontWeight="bold" mb={2}>
             Loan Purpose Chart
           </Typography> */}
           {loanPurposeLoading ? (
             <Box display="flex" justifyContent="center" alignItems="center" height="300px">
               <CircularProgress />
             </Box>
           ) : loanPurposeData ? (
             <LoanPurposeChart
               filters={{
                 employer: filters.employer,
                 placement: filters.placement,
                 project: filters.project,
                 month: filters.month,
                 year: filters.year
               }}
             />
           ) : (
             <Box display="flex" justifyContent="center" alignItems="center" height="300px">
               <Typography variant="body1" color="textSecondary">
                 No data available
               </Typography>
             </Box>
           )}
         </Box>

         {/* Repayment Risk Summary */}
         <Box mb={3}>
           <RepaymentRiskSummary
             repaymentRiskData={repaymentRiskData}
             isLoading={repaymentRiskLoading}
           />
         </Box>

         {/* Repayment Risk Chart */}
         <Box mb={3}>
           <RepaymentRiskChart 
             filters={{
               employer: filters.employer,
               placement: filters.placement,
               project: filters.project,
               month: filters.month,
               year: filters.year
             }}
           />
         </Box>
      </Box>
    </PageContainer>
  );
};

export default function ProtectedKasbonDashboard() {
  return (
    <ProtectedRoute requiredRoles={getPageRoles('KASBON_DASHBOARD')}>
      <KasbonDashboard />
    </ProtectedRoute>
  );
}
