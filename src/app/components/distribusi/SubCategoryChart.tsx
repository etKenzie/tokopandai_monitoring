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

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface SubCategoryData {
  type_name: string;
  total_orders: number;
  active_stores: number;
  total_invoice: number;
  total_profit: number;
  margin: number;
  avg_order_value: number;
  paid_invoice: number;
  unpaid_invoice: number;
}

interface SubCategoryResponse {
  code: number;
  status: string;
  message: string;
  data: SubCategoryData[];
}

interface SubCategoryChartProps {
  filters: {
    month: string;
    year: string;
    agent?: string;
    area?: string;
    segment?: string;
  };
}

const SubCategoryChart = ({ filters }: SubCategoryChartProps) => {
  const [chartData, setChartData] = useState<SubCategoryData[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchChartData = async () => {
    if (!filters.month || !filters.year) {
      console.log('SubCategoryChart: Missing month or year filters', { month: filters.month, year: filters.year });
      return;
    }
    
    setLoading(true);
    try {
      // Format month for API (e.g., "08" -> "August 2025")
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const monthIndex = parseInt(filters.month, 10) - 1;
      const monthName = monthNames[monthIndex];
      const formattedMonth = `${monthName} ${filters.year}`;

      const params = new URLSearchParams({
        month: formattedMonth,
        group_by: 'sub_business_type'
      });

      // Add optional filters if provided
      if (filters.agent) {
        params.append('agent_name', filters.agent);
      }
      if (filters.area) {
        params.append('area', filters.area);
      }
      if (filters.segment) {
        params.append('segment', filters.segment);
      }

      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/order/type?${params.toString()}`;
      console.log('SubCategoryChart: Fetching data from:', apiUrl);
      console.log('SubCategoryChart: Filters:', filters);

      const response = await fetch(apiUrl);
      const result: SubCategoryResponse = await response.json();
      
      console.log('SubCategoryChart: API Response:', result);
      
      if (result.code === 200) {
        console.log('SubCategoryChart: Data received:', result.data);
        setChartData(result.data);
      } else {
        console.error('Failed to fetch sub category data:', result.message);
        setChartData([]);
      }
    } catch (error) {
      console.error('Failed to fetch sub category data:', error);
      setChartData([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when filters change
  useEffect(() => {
    fetchChartData();
  }, [filters.month, filters.year, filters.agent, filters.area, filters.segment]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  // Prepare chart data for total profit and total invoice
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
      categories: chartData.map(item => item.type_name),
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
        title: { text: 'Total Invoice (IDR)', style: { fontSize: '14px', fontWeight: 600 } },
        labels: { formatter: (value: number) => formatCurrency(value) }
      },
      {
        opposite: true,
        title: { text: 'Total Profit (IDR)', style: { fontSize: '14px', fontWeight: 600 } },
        labels: { formatter: (value: number) => formatCurrency(value) }
      }
    ],
    tooltip: {
      y: [
        { formatter: (value: number) => formatCurrency(value), title: { formatter: () => 'Total Invoice: ' } },
        { formatter: (value: number) => formatCurrency(value), title: { formatter: () => 'Total Profit: ' } }
      ]
    },
    colors: ['#3B82F6', '#10B981'],
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
    { name: 'Total Invoice', data: chartData.map(item => item.total_invoice) },
    { name: 'Total Profit', data: chartData.map(item => item.total_profit) }
  ];

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Sub Category Distribution
          </Typography>
          <Box display="flex" justifyContent="center" alignItems="center" height={400}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (!chartData || chartData.length === 0) {
    console.log('SubCategoryChart: No data available', { 
      chartData, 
      chartDataLength: chartData?.length, 
      loading, 
      filters
    });
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Sub Category Distribution
          </Typography>
          <Box display="flex" justifyContent="center" alignItems="center" height={400}>
            <Typography color="textSecondary">
              No data available for sub categories in {filters.month}/{filters.year}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Sub Category Distribution
        </Typography>
        
        <Typography variant="body2" color="textSecondary" mb={3}>
          Distribution of orders by sub business type showing total invoice and total profit
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
            Total sub categories: {chartData.length} | 
            Total invoice: {formatCurrency(chartData.reduce((sum, item) => sum + Number(item.total_invoice) || 0, 0))} | 
            Total profit: {formatCurrency(chartData.reduce((sum, item) => sum + Number(item.total_profit) || 0, 0))} | 
            Total orders: {formatNumber(chartData.reduce((sum, item) => sum + item.total_orders, 0))} |
            Total active stores: {formatNumber(chartData.reduce((sum, item) => sum + item.active_stores, 0))}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default SubCategoryChart;

