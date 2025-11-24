'use client';

import {
    Box,
    Card,
    CardContent,
    CircularProgress,
    Typography
} from '@mui/material';
import dynamic from "next/dynamic";
import { useEffect, useState, useMemo } from 'react';
import { fetchProductSummary, ProductSummaryData } from '@/app/api/distribusi/DistribusiSlice';

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface SubCategoryAggregatedData {
  sub_category: string;
  total_invoice: number;
  total_profit: number;
  product_count: number;
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
  const [products, setProducts] = useState<ProductSummaryData[]>([]);
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

      const response = await fetchProductSummary({
        month: formattedMonth,
        agent: filters.agent,
        area: filters.area,
        segment: filters.segment,
      });
      
      console.log('SubCategoryChart: API Response:', response);
      
      if (response.code === 200) {
        console.log('SubCategoryChart: Products received:', response.data);
        setProducts(response.data || []);
      } else {
        console.error('Failed to fetch product data:', response.message);
        setProducts([]);
      }
    } catch (error) {
      console.error('Failed to fetch product data:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Aggregate products by sub_category
  const chartData = useMemo(() => {
    if (!products || products.length === 0) return [];

    const aggregated = products.reduce((acc, product) => {
      const subCategory = product.sub_category || 'Unknown';
      
      if (!acc[subCategory]) {
        acc[subCategory] = {
          sub_category: subCategory,
          total_invoice: 0,
          total_profit: 0,
          product_count: 0,
        };
      }
      
      // Calculate totals from product or variants
      const productInvoice = product.total_invoice || 
        (product.variants?.reduce((sum, v) => sum + (v.total_invoice || 0), 0) || 0);
      const productProfit = product.profit || 0;
      
      acc[subCategory].total_invoice += productInvoice;
      acc[subCategory].total_profit += productProfit;
      acc[subCategory].product_count += 1;
      
      return acc;
    }, {} as Record<string, SubCategoryAggregatedData>);

    // Convert to array and sort by total_invoice descending
    return Object.values(aggregated).sort((a, b) => b.total_invoice - a.total_invoice);
  }, [products]);

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
      categories: chartData.map(item => item.sub_category),
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
          Distribution of products by sub category showing total invoice and total profit
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
            Total products: {formatNumber(chartData.reduce((sum, item) => sum + item.product_count, 0))}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default SubCategoryChart;

