'use client';

import { StoreOrder } from '@/app/api/distribusi/StoreSlice';
import {
    Box,
    Card,
    CardContent,
    Grid,
    Paper,
    Typography
} from '@mui/material';
import dynamic from "next/dynamic";
import { useMemo } from 'react';

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface StoreSummaryTabProps {
  storeOrders: StoreOrder[];
}

const StoreSummaryTab = ({ storeOrders }: StoreSummaryTabProps) => {
  // Process data to get monthly summaries
  const monthlyData = useMemo(() => {
    const monthMap = new Map<string, {
      month: string;
      total_invoice: number;
      total_profit: number;
      total_owed: number;
      order_count: number;
    }>();

    storeOrders.forEach(order => {
      const month = order.month;
      if (!monthMap.has(month)) {
        monthMap.set(month, {
          month,
          total_invoice: 0,
          total_profit: 0,
          total_owed: 0,
          order_count: 0
        });
      }

      const monthData = monthMap.get(month)!;
      monthData.total_invoice += order.total_invoice;
      monthData.total_profit += order.profit;
      monthData.order_count += 1;

      // Add to total_owed if payment status is "BELUM LUNAS"
      if (order.status_payment === "BELUM LUNAS") {
        monthData.total_owed += order.total_invoice;
      }
    });

    return Array.from(monthMap.values()).sort((a, b) => {
      // Sort by month chronologically
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      
      const [monthA, yearA] = a.month.split(' ');
      const [monthB, yearB] = b.month.split(' ');
      
      if (!monthA || !yearA || !monthB || !yearB) return 0;
      
      const yearDiff = parseInt(yearA) - parseInt(yearB);
      if (yearDiff !== 0) return yearDiff;
      
      const monthIndexA = monthNames.indexOf(monthA);
      const monthIndexB = monthNames.indexOf(monthB);
      
      return monthIndexA - monthIndexB;
    });
  }, [storeOrders]);

  // Get most recent month data
  const mostRecentMonth = monthlyData[monthlyData.length - 1];

  // Calculate overall totals
  const overallTotals = useMemo(() => {
    return storeOrders.reduce((totals, order) => {
      totals.total_invoice += order.total_invoice;
      totals.total_profit += order.profit;
      totals.order_count += 1;
      
      if (order.status_payment === "BELUM LUNAS") {
        totals.total_owed += order.total_invoice;
      }
      
      return totals;
    }, {
      total_invoice: 0,
      total_profit: 0,
      total_owed: 0,
      order_count: 0
    });
  }, [storeOrders]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Prepare chart data
  const chartData = useMemo(() => {
    if (monthlyData.length === 0) {
      return { categories: [], series: [] };
    }

    const categories = monthlyData.map(item => item.month);
    const series = [
      {
        name: 'Total Invoice',
        data: monthlyData.map(item => item.total_invoice)
      },
      {
        name: 'Total Profit',
        data: monthlyData.map(item => item.total_profit)
      }
    ];

    return { categories, series };
  }, [monthlyData]);

  const chartOptions = {
    chart: {
      type: 'line' as const,
      height: 350,
      toolbar: {
        show: false
      }
    },
    stroke: {
      curve: 'smooth' as const,
      width: 3
    },
    xaxis: {
      categories: chartData.categories,
      labels: {
        style: {
          fontSize: '12px'
        }
      }
    },
    yaxis: {
      labels: {
        formatter: function(value: number) {
          return formatCurrency(value);
        }
      }
    },
    tooltip: {
      y: {
        formatter: function(value: number) {
          return formatCurrency(value);
        }
      }
    },
    colors: ['#3B82F6', '#10B981'],
    grid: {
      borderColor: '#E5E7EB',
      strokeDashArray: 4
    },
    markers: {
      size: 6,
      strokeColors: '#FFFFFF',
      strokeWidth: 2
    },
    legend: {
      position: 'bottom' as const,
      horizontalAlign: 'center' as const
    }
  };

  return (
    <Box>
      {/* Most Recent Month Section */}
      {mostRecentMonth && (
        <Box mb={4}>
          <Typography variant="h6" gutterBottom>
            Most Recent Month - {mostRecentMonth.month}
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="primary" fontWeight="bold">
                  {formatCurrency(mostRecentMonth.total_invoice)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Total Invoice
                </Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="success.main" fontWeight="bold">
                  {formatCurrency(mostRecentMonth.total_profit)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Total Profit
                </Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="error.main" fontWeight="bold">
                  {formatCurrency(mostRecentMonth.total_owed)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Total Owed
                </Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="info.main" fontWeight="bold">
                  {mostRecentMonth.order_count}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Order Count
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Overall Section */}
      <Box mb={4}>
        <Typography variant="h6" gutterBottom>
          Overall Summary
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="primary" fontWeight="bold">
                {formatCurrency(overallTotals.total_invoice)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Total Invoice
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="success.main" fontWeight="bold">
                {formatCurrency(overallTotals.total_profit)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Total Profit
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="error.main" fontWeight="bold">
                {formatCurrency(overallTotals.total_owed)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Total Owed
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="info.main" fontWeight="bold">
                {overallTotals.order_count}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Total Orders
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* Monthly Trend Chart */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Monthly Trend
          </Typography>
          <Box sx={{ height: 400, position: 'relative' }}>
            {chartData.categories.length > 0 ? (
              <ReactApexChart
                options={chartOptions}
                series={chartData.series}
                type="line"
                height={350}
              />
            ) : (
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  height: '100%' 
                }}
              >
                <Typography color="textSecondary">No data available for chart</Typography>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default StoreSummaryTab;
