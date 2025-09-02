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
import { fetchUnpaidOverview, UnpaidOverviewResponse } from '../../api/distribusi/DistribusiSlice';

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface UnpaidOverviewChartProps {
  filters: {
    agent: string;
    area: string;
  };
}

const UnpaidOverviewChart = ({ filters }: UnpaidOverviewChartProps) => {
  const [chartData, setChartData] = useState<UnpaidOverviewResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchChartData = async () => {
    setLoading(true);
    try {
      const response = await fetchUnpaidOverview({
        agent: filters.agent || undefined,
        area: filters.area || undefined,
      });
      setChartData(response);
    } catch (error) {
      console.error('Failed to fetch unpaid overview data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when filters change
  useEffect(() => {
    fetchChartData();
  }, [filters.agent, filters.area]);

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
      categories: chartData?.data ? Object.keys(chartData.data) : [],
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
    colors: ['#FF6B6B', '#4ECDC4'],
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
      data: chartData?.data ? Object.values(chartData.data).map(item => item.total_invoice) : [],
    },
    {
      name: 'Total Count',
      data: chartData?.data ? Object.values(chartData.data).map(item => item.count) : [],
    },
  ];

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Unpaid Overview Distribution
          </Typography>
          <Box display="flex" justifyContent="center" alignItems="center" height={400}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (!chartData || !chartData.data || Object.keys(chartData.data).length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Unpaid Overview Distribution
          </Typography>
          <Box display="flex" justifyContent="center" alignItems="center" height={400}>
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
          Unpaid Overview Distribution
        </Typography>
        <Typography variant="body2" color="textSecondary" mb={3}>
          Distribution of unpaid orders by overdue status showing total amount and count
        </Typography>
        
        <Box>
          <ReactApexChart
            options={chartOptions}
            series={series}
            type="bar"
            height={400}
          />
        </Box>
        
        <Box mt={3}>
          <Typography variant="subtitle2" gutterBottom>
            Summary:
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Total overdue categories: {Object.keys(chartData.data).length} | 
            Total amount: {formatCurrency(Object.values(chartData.data).reduce((sum, item) => sum + item.total_invoice, 0))} | 
            Total count: {formatNumber(Object.values(chartData.data).reduce((sum, item) => sum + item.count, 0))}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default UnpaidOverviewChart;
