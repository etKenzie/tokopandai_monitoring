'use client';

import { Box, Typography, CircularProgress, Paper, Button } from '@mui/material';
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { fetchKaryawan, fetchKasbonLoanFees, fetchKasbonSummary, fetchLoanDisbursement, fetchLoanRequests, fetchLoanRisk, fetchUserCoverage, fetchLoanPurpose, Karyawan, KasbonLoanFeesResponse, KasbonSummaryResponse, LoanDisbursementResponse, LoanRequestsResponse, LoanRiskResponse, UserCoverageResponse, LoanPurposeResponse } from '../../api/kasbon/KasbonSlice';
import PageContainer from '../../components/container/PageContainer';
import KaryawanOverdueTable from '../../components/kasbon/KaryawanOverdueTable';
import KasbonFilters, { KasbonFilterValues } from '../../components/kasbon/KasbonFilters';
import LoanDisbursementChart from '../../components/kasbon/LoanDisbursementChart';
import LoanFeesChart from '../../components/kasbon/LoanFeesChart';
import LoanPurposeChart from '../../components/kasbon/LoanPurposeChart';
import LoanRiskChart from '../../components/kasbon/LoanRiskChart';
import UserCoverageChart from '../../components/kasbon/UserCoverageChart';
import SummaryTiles from '../../components/shared/SummaryTiles';
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import RoleBasedContent from '../../components/auth/RoleBasedContent';
import { useCheckRoles } from '@/app/hooks/useCheckRoles';
import { getPageRoles } from '@/config/roles';

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

  const handleFiltersChange = useCallback((newFilters: KasbonFilterValues) => {
    console.log('Filters changed:', newFilters);
    setFilters(newFilters);
    // fetchSummaryData(newFilters);
    fetchLoanFeesData(newFilters);
    fetchLoanRiskData(newFilters);
    fetchUserCoverageData(newFilters);
    fetchLoanRequestsData(newFilters);
    fetchLoanDisbursementData(newFilters);
    fetchLoanPurposeData(newFilters);
  }, [fetchSummaryData, fetchLoanFeesData, fetchLoanRiskData, fetchUserCoverageData, fetchLoanRequestsData, fetchLoanDisbursementData, fetchLoanPurposeData]);

  useEffect(() => {
    fetchData();
  }, []); // Only run once on mount

  useEffect(() => {
    // Only fetch data if month and year are set (after initialization)
    if (filters.month && filters.year) {
      // fetchSummaryData(filters);
      fetchLoanFeesData(filters);
      fetchLoanRiskData(filters);
      fetchUserCoverageData(filters);
      fetchLoanRequestsData(filters);
      fetchLoanDisbursementData(filters);
      fetchLoanPurposeData(filters);
    }
  }, [filters.month, filters.year, filters.employer, filters.placement, filters.project]); // Run when any filter changes

  // Create summary tiles from the data
  const createSummaryTiles = () => {
    if (!summaryData) return [];

    return [
      { 
        title: "Total Eligible Employees", 
        value: summaryData.total_eligible_employees 
      },
      { 
        title: "Total Processed Requests", 
        value: summaryData.total_processed_kasbon_requests 
      },
      { 
        title: "Total Pending Requests", 
        value: summaryData.total_pending_kasbon_requests 
      },
      { 
        title: "Total First Borrow", 
        value: summaryData.total_first_borrow 
      },
      { 
        title: "Total Approved Requests", 
        value: summaryData.total_approved_requests 
      },
      { 
        title: "Total Rejected Requests", 
        value: summaryData.total_rejected_requests 
      },
      { 
        title: "Total Disbursed Amount", 
        value: summaryData.total_disbursed_amount, 
        isCurrency: true 
      },
      { 
        title: "Total Unique Requests", 
        value: summaryData.total_unique_requests 
      },
      { 
        title: "Average Disbursed Amount", 
        value: summaryData.average_disbursed_amount, 
        isCurrency: true 
      },
      { 
        title: "Approval Rate", 
        value: summaryData.approval_rate, 
        isCurrency: false 
      },
      { 
        title: "Average Approval Time", 
        value: summaryData.average_approval_time 
      },
      { 
        title: "Penetration Rate", 
        value: summaryData.penetration_rate, 
        isCurrency: false 
      },
    ];
  };

  // Create loan fees tiles from the data
  const createLoanFeesTiles = () => {
    if (!loanFeesData) return [];

    return [
      { 
        title: "Admin Fee Profit", 
        value: loanFeesData.admin_fee_profit,
        isCurrency: true 
      },
      { 
        title: "Total Expected Admin Fee", 
        value: loanFeesData.total_expected_admin_fee,
        isCurrency: true 
      },
      { 
        title: "Total Collected Admin Fee", 
        value: loanFeesData.total_collected_admin_fee,
        isCurrency: true 
      },
      { 
        title: "Total Unrecovered Kasbon", 
        value: loanFeesData.total_failed_payment,
        isCurrency: true 
      },
      { 
        title: "Expected Loans Count", 
        value: loanFeesData.expected_loans_count,
        isCurrency: false
      },
      
      { 
        title: "Collected Loans Count", 
        value: loanFeesData.collected_loans_count,
        isCurrency: false
      },
      
      
    ];
  };

  // Create user coverage tiles from the data
  const createUserCoverageTiles = () => {
    if (!userCoverageData) return [];

    return [
      { 
        title: "Total Eligible Employees", 
        value: userCoverageData.total_eligible_employees,
        isCurrency: false
      },
      { 
        title: "Total Kasbon Requests", 
        value: userCoverageData.total_kasbon_requests,
        isCurrency: false
      },
      { 
        title: "Penetration Rate", 
        value: userCoverageData.penetration_rate,
        isCurrency: false
      },
      { 
        title: "Total First Borrow", 
        value: userCoverageData.total_first_borrow,
        isCurrency: false
      },
    ];
  };

  // Create loan requests tiles from the data
  const createLoanRequestsTiles = () => {
    if (!loanRequestsData) return [];

    return [
      { 
        title: "Total Approved Requests", 
        value: loanRequestsData.total_approved_requests,
        isCurrency: false
      },
      { 
        title: "Total Rejected Requests", 
        value: loanRequestsData.total_rejected_requests,
        isCurrency: false
      },
      { 
        title: "Approval Rate", 
        value: loanRequestsData.approval_rate,
        isCurrency: false
      },
      { 
        title: "Average Approval Time", 
        value: loanRequestsData.average_approval_time,
        isCurrency: false
      },
    ];
  };

  // Create loan disbursement tiles from the data
  const createLoanDisbursementTiles = () => {
    if (!loanDisbursementData) return [];

    return [
      { 
        title: "Total Disbursed Amount", 
        value: loanDisbursementData.total_disbursed_amount,
        isCurrency: true
      },
      { 
        title: "Average Disbursed Amount", 
        value: loanDisbursementData.average_disbursed_amount,
        isCurrency: true
      },
    ];
  };

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

        {/* User Coverage Tiles */}
        <Box mb={3}>
          <Typography variant="h5" fontWeight="bold" mb={2}>
            User Coverage Summary
          </Typography>
          {userCoverageLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="200px">
              <CircularProgress />
            </Box>
          ) : userCoverageData ? (
            <SummaryTiles 
              tiles={createUserCoverageTiles()} 
              md={3} 
            />
          ) : (
            <Box display="flex" justifyContent="center" alignItems="center" height="200px">
              <Typography variant="body1" color="textSecondary">
                No data available
              </Typography>
            </Box>
          )}
        </Box>

                 {/* User Coverage Chart */}
         <Box mb={3}>
           {/* <Typography variant="h5" fontWeight="bold" mb={2}>
             User Coverage Chart
           </Typography> */}
           {userCoverageLoading ? (
             <Box display="flex" justifyContent="center" alignItems="center" height="300px">
               <CircularProgress />
             </Box>
           ) : userCoverageData ? (
             <UserCoverageChart 
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

        {/* Loan Fees Tiles */}
        <Box mb={3}>
          <Typography variant="h5" fontWeight="bold" mb={2}>
            Loan Fees Summary
          </Typography>
          {loanFeesLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="200px">
              <CircularProgress />
            </Box>
          ) : loanFeesData ? (
            <SummaryTiles 
              tiles={createLoanFeesTiles()} 
              md={4} 
            />
          ) : (
            <Box display="flex" justifyContent="center" alignItems="center" height="200px">
              <Typography variant="body1" color="textSecondary">
                No data available
              </Typography>
            </Box>
          )}
        </Box>

        

        {/* Loan Fees Chart */}
        <Box mb={3}>
          {/* <Typography variant="h5" fontWeight="bold" mb={2}>
            Loan Fees Chart
          </Typography> */}
          {loanFeesLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="300px">
              <CircularProgress />
            </Box>
          ) : loanFeesData ? (
            <LoanFeesChart 
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

        

         {/* Loan Disbursement Tiles */}
         <Box mb={3}>
           <Typography variant="h5" fontWeight="bold" mb={2}>
             Loan Disbursement Summary
           </Typography>
           {loanDisbursementLoading ? (
             <Box display="flex" justifyContent="center" alignItems="center" height="200px">
               <CircularProgress />
             </Box>
           ) : loanDisbursementData ? (
             <SummaryTiles 
               tiles={createLoanDisbursementTiles()} 
               md={6} 
             />
           ) : (
             <Box display="flex" justifyContent="center" alignItems="center" height="200px">
               <Typography variant="body1" color="textSecondary">
                 No data available
               </Typography>
             </Box>
           )}
         </Box>


         {/* Loan Disbursement Chart */}
         <Box mb={3}>
           {/* <Typography variant="h5" fontWeight="bold" mb={2}>
             Loan Disbursement Chart
           </Typography> */}
           {loanDisbursementLoading ? (
             <Box display="flex" justifyContent="center" alignItems="center" height="300px">
               <CircularProgress />
             </Box>
           ) : loanDisbursementData ? (
                         <LoanDisbursementChart 
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

         {/* Loan Requests Tiles */}
         <Box mb={3}>
           <Typography variant="h5" fontWeight="bold" mb={2}>
             Loan Requests Summary
           </Typography>
           {loanRequestsLoading ? (
             <Box display="flex" justifyContent="center" alignItems="center" height="200px">
               <CircularProgress />
             </Box>
           ) : loanRequestsData ? (
             <SummaryTiles 
               tiles={createLoanRequestsTiles()} 
               md={3} 
             />
           ) : (
             <Box display="flex" justifyContent="center" alignItems="center" height="200px">
               <Typography variant="body1" color="textSecondary">
                 No data available
               </Typography>
             </Box>
           )}
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

         

         
        {/* Summary Tiles
        {summaryData && (
          <Box mb={3}>
            <Typography variant="h5" fontWeight="bold" mb={2}>
              Kasbon Summary
            </Typography>
            <SummaryTiles 
              tiles={createSummaryTiles()} 
              md={4} 
            />
          </Box>
        )} */}

        {/* Karyawan Table Component */}
        {/* <KaryawanTable
          karyawan={karyawan}
          title="Employee Data"
          loading={loading}
          onRefresh={fetchData}
        /> */}

        {/* Loan Risk Tiles */}
        <Box mb={3}>
          <Typography variant="h5" fontWeight="bold" mb={2}>
            Loan Risk Summary
          </Typography>
          {loanRiskLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="200px">
              <CircularProgress />
            </Box>
          ) : loanRiskData ? (
            <SummaryTiles 
              tiles={[
                { 
                  title: "Total Unrecovered Kasbon", 
                  value: loanRiskData.total_unrecovered_kasbon,
                  isCurrency: true
                },
                { 
                  title: "Total Expected Repayment", 
                  value: loanRiskData.total_expected_repayment,
                  isCurrency: true
                },
                { 
                  title: "Unrecovered Kasbon Count", 
                  value: loanRiskData.unrecovered_kasbon_count,
                  isCurrency: false
                },
                { 
                  title: "Principal Recovery Rate", 
                  value: loanRiskData.kasbon_principal_recovery_rate,
                  isCurrency: false
                },
              ]}
              md={6}
            />
          ) : (
            <Box display="flex" justifyContent="center" alignItems="center" height="200px">
              <Typography variant="body1" color="textSecondary">
                No data available
              </Typography>
            </Box>
          )}
        </Box>

        {/* Loan Risk Chart */}
        <Box mb={3}>
          {/* <Typography variant="h5" fontWeight="bold" mb={2}>
            Loan Risk Chart
          </Typography> */}
          {loanRiskLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="300px">
              <CircularProgress />
            </Box>
          ) : loanRiskData ? (
            <LoanRiskChart
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

       

        {/* Karyawan Overdue Table Component */}
        <KaryawanOverdueTable
          filters={{
            employer: filters.employer,
            placement: filters.placement,
            project: filters.project,
            month: filters.month,
            year: filters.year
          }}
          title="Overdue Employees"
        />

       
        
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
