'use client';

import { Box, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { fetchKaryawan, fetchKasbonLoanFees, fetchKasbonSummary, Karyawan, KasbonLoanFeesResponse, KasbonSummaryResponse } from '../../api/kasbon/KasbonSlice';
import PageContainer from '../../components/container/PageContainer';
import KaryawanTable from '../../components/kasbon/KaryawanTable';
import KasbonFilters, { KasbonFilterValues } from '../../components/kasbon/KasbonFilters';
import LoanFeesChart from '../../components/kasbon/LoanFeesChart';
import SummaryTiles from '../../components/shared/SummaryTiles';

const KasbonDashboard = () => {
  const [karyawan, setKaryawan] = useState<Karyawan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [summaryData, setSummaryData] = useState<KasbonSummaryResponse | null>(null);
  const [loanFeesData, setLoanFeesData] = useState<KasbonLoanFeesResponse | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [loanFeesLoading, setLoanFeesLoading] = useState(false);
  
  // Get current month and year
  const currentDate = new Date();
  const currentMonth = (currentDate.getMonth() + 1).toString().padStart(2, '0');
  const currentYear = currentDate.getFullYear().toString();
  
  const [filters, setFilters] = useState<KasbonFilterValues>({
    month: currentMonth,
    year: currentYear,
    employer: '',
    placement: '',
    project: ''
  });

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

  const fetchSummaryData = async (currentFilters: KasbonFilterValues) => {
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
  };

  const fetchLoanFeesData = async (currentFilters: KasbonFilterValues) => {
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
  };

  const handleFiltersChange = (newFilters: KasbonFilterValues) => {
    setFilters(newFilters);
    fetchSummaryData(newFilters);
    fetchLoanFeesData(newFilters);
  };

  useEffect(() => {
    fetchData();
    // Fetch initial summary and loan fees data with default month and year
    fetchSummaryData(filters);
    fetchLoanFeesData(filters);
  }, []);

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
        title: "Total Expected Admin Fee", 
        value: loanFeesData.total_expected_admin_fee,
        isCurrency: true 
      },
      { 
        title: "Expected Loans Count", 
        value: loanFeesData.expected_loans_count 
      },
      { 
        title: "Total Collected Admin Fee", 
        value: loanFeesData.total_collected_admin_fee,
        isCurrency: true 
      },
      { 
        title: "Collected Loans Count", 
        value: loanFeesData.collected_loans_count 
      },
      { 
        title: "Total Failed Payment", 
        value: loanFeesData.total_failed_payment,
        isCurrency: true 
      },
      { 
        title: "Admin Fee Profit", 
        value: loanFeesData.admin_fee_profit,
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

        

        {/* Loan Fees Tiles */}
        {loanFeesData && (
          <Box mb={3}>
            <Typography variant="h5" fontWeight="bold" mb={2}>
              Loan Fees Summary
            </Typography>
            <SummaryTiles 
              tiles={createLoanFeesTiles()} 
              md={4} 
            />
          </Box>
        )}

        {/* Loan Fees Chart */}
        <Box mb={3}>
          <LoanFeesChart 
            filters={{
              employer: filters.employer,
              placement: filters.placement,
              project: filters.project
            }}
          />
        </Box>

        {/* Summary Tiles */}
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
        )}

        {/* Karyawan Table Component */}
        <KaryawanTable
          karyawan={karyawan}
          title="Employee Data"
          loading={loading}
          onRefresh={fetchData}
        />
      </Box>
    </PageContainer>
  );
};

export default KasbonDashboard;
