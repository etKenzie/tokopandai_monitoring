'use client';

import {
    Box,
    Card,
    CardContent,
    CircularProgress,
    Typography
} from '@mui/material';
import dynamic from "next/dynamic";
import { useEffect, useState } from 'react';
import { fetchLoanPurpose, LoanPurposeResponse } from '../../api/kasbon/KasbonSlice';

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface LoanPurposeChartProps {
  filters: {
    employer: string;
    placement: string;
    project: string;
    month: string;
    year: string;
  };
}

const LoanPurposeChart = ({ filters }: LoanPurposeChartProps) => {
  const [chartData, setChartData] = useState<LoanPurposeResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchChartData = async () => {
    if (!filters.month || !filters.year) return;
    
    setLoading(true);
    try {
      const response = await fetchLoanPurpose({
        employer: filters.employer || undefined,
        sourced_to: filters.placement || undefined,
        project: filters.project || undefined,
        month: filters.month,
        year: filters.year,
      });
      setChartData(response);
    } catch (error) {
      console.error('Failed to fetch loan purpose data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when filters change
  useEffect(() => {
    fetchChartData();
  }, [filters]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('id-ID').format(value);
  };

  // Prepare chart data
  const chartOptions = {
    chart: {
      type: 'bar' as const,
      height: 400,
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: false,
          zoom: false,
          zoomin: false,
          zoomout: false,
          pan: false,
          reset: false,
        },
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
        endingShape: 'rounded',
        borderRadius: 4,
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 2,
      colors: ['transparent'],
    },
    xaxis: {
      categories: chartData?.results.map(item => item.purpose_name) || [],
      labels: {
        style: {
          fontSize: '12px',
        },
        rotate: -45,
        rotateAlways: false,
      },
    },
    yaxis: [
      {
        title: {
          text: 'Total Amount (IDR)',
          style: {
            fontSize: '14px',
            fontWeight: 600,
          },
        },
        labels: {
          formatter: function(value: number) {
            return formatCurrency(value);
          },
        },
      },
      {
        opposite: true,
        title: {
          text: 'Total Count',
          style: {
            fontSize: '14px',
            fontWeight: 600,
          },
        },
        labels: {
          formatter: function(value: number) {
            return formatNumber(value);
          },
        },
      },
    ],
    tooltip: {
      y: [
        {
          formatter: function(value: number) {
            return formatCurrency(value);
          },
          title: {
            formatter: function() {
              return 'Total Amount: ';
            },
          },
        },
        {
          formatter: function(value: number) {
            return formatNumber(value);
          },
          title: {
            formatter: function() {
              return 'Total Count: ';
            },
          },
        },
      ],
    },
    colors: ['#5D87FF', '#49BEFF'],
    legend: {
      position: 'top' as const,
      horizontalAlign: 'center' as const,
      fontSize: '14px',
      fontWeight: 600,
    },
    grid: {
      borderColor: '#f1f1f1',
    },
  };

  const series = [
    {
      name: 'Total Amount',
      data: chartData?.results.map(item => item.total_amount) || [],
    },
    {
      name: 'Total Count',
      data: chartData?.results.map(item => item.total_count) || [],
    },
  ];

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Loan Purpose Distribution
          </Typography>
          <Box display="flex" justifyContent="center" alignItems="center" height="400px">
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (!chartData || !chartData.results || chartData.results.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Loan Purpose Distribution
          </Typography>
          <Box display="flex" justifyContent="center" alignItems="center" height="400px">
            <Typography color="textSecondary">No data available</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Loan Purpose Distribution
        </Typography>
        <Typography variant="body2" color="textSecondary" mb={3}>
          Distribution of loan purposes by total amount and count for {filters.month}/{filters.year}
        </Typography>
        
        <Box>
          <ReactApexChart
            options={chartOptions}
            series={series}
            type="bar"
            height={400}
          />
        </Box>
        
        {/* <Box mt={3}>
          <Typography variant="subtitle2" gutterBottom>
            Summary:
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Total purposes: {chartData.count} | 
            Total amount: {formatCurrency(chartData.results.reduce((sum, item) => sum + item.total_amount, 0))} | 
            Total count: {formatNumber(chartData.results.reduce((sum, item) => sum + item.total_count, 0))}
          </Typography>
        </Box> */}
      </CardContent>
    </Card>
  );
};

export default LoanPurposeChart;
