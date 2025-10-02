'use client';

import { StoreOrder } from '@/app/api/distribusi/StoreSlice';
import {
    Box,
    Card,
    CardContent,
    FormControl,
    Grid,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Typography
} from '@mui/material';
import dynamic from "next/dynamic";
import { useMemo, useState } from 'react';

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

type ChartType = 'totals' | 'margin';

interface StoreSummaryTabProps {
  storeOrders: StoreOrder[];
}

const StoreSummaryTab = ({ storeOrders }: StoreSummaryTabProps) => {
  const [chartType, setChartType] = useState<ChartType>('totals');

  const handleChartTypeChange = (event: any) => {
    setChartType(event.target.value as ChartType);
  };

  // Process data to get monthly summaries
  const monthlyData = useMemo(() => {
    const monthMap = new Map<string, {
      month: string;
      total_invoice: number;
      total_profit: number;
      total_owed: number;
      order_count: number;
      margin: number;
    }>();

    storeOrders.forEach(order => {
      const month = order.month;
      if (!monthMap.has(month)) {
        monthMap.set(month, {
          month,
          total_invoice: 0,
          total_profit: 0,
          total_owed: 0,
          order_count: 0,
          margin: 0
        });
      }

      const monthData = monthMap.get(month)!;
      monthData.total_invoice += Number(order.total_invoice) || 0;
      monthData.total_profit += Number(order.profit) || 0;
      monthData.order_count += 1;

      // Add to total_owed if payment status is "BELUM LUNAS"
      if (order.status_payment === "BELUM LUNAS") {
        monthData.total_owed += Number(order.total_invoice) || 0;
      }
    });

    return Array.from(monthMap.values()).map(item => ({
      ...item,
      margin: item.total_invoice > 0 ? (item.total_profit / item.total_invoice) * 100 : 0
    })).sort((a, b) => {
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
    const totals = storeOrders.reduce((totals, order) => {
      totals.total_invoice += Number(order.total_invoice) || 0;
      totals.total_profit += Number(order.profit) || 0;
      totals.order_count += 1;
      
      if (order.status_payment === "BELUM LUNAS") {
        totals.total_owed += Number(order.total_invoice) || 0;
      }
      
      return totals;
    }, {
      total_invoice: 0,
      total_profit: 0,
      total_owed: 0,
      order_count: 0
    });

    return {
      ...totals,
      margin: totals.total_invoice > 0 ? (totals.total_profit / totals.total_invoice) * 100 : 0
    };
  }, [storeOrders]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  // Prepare chart data
  const chartData = useMemo(() => {
    if (monthlyData.length === 0) {
      return { categories: [], series: [] };
    }

    const categories = monthlyData.map(item => item.month);
    let series: any[] = [];

    switch (chartType) {
      case 'totals':
        series = [
          {
            name: 'Total Invoice',
            data: monthlyData.map(item => item.total_invoice)
          },
          {
            name: 'Total Profit',
            data: monthlyData.map(item => item.total_profit)
          }
        ];
        break;
      case 'margin':
        series = [
          {
            name: 'Margin %',
            data: monthlyData.map(item => item.margin)
          }
        ];
        break;
    }

    return { categories, series };
  }, [monthlyData, chartType]);

  const chartOptions = useMemo(() => {
    const getYAxisConfig = () => {
      if (chartType === 'margin') {
        return {
          labels: {
            formatter: function(value: number) {
              return formatPercentage(value);
            }
          }
        };
      } else {
        return {
          labels: {
            formatter: function(value: number) {
              return formatCurrency(value);
            }
          }
        };
      }
    };

    const getTooltipConfig = () => {
      if (chartType === 'margin') {
        return {
          y: {
            formatter: function(value: number) {
              return formatPercentage(value);
            }
          }
        };
      } else {
        return {
          y: {
            formatter: function(value: number) {
              return formatCurrency(value);
            }
          }
        };
      }
    };

    const getColors = () => {
      switch (chartType) {
        case 'margin':
          return ['#F59E0B'];
        case 'totals':
        default:
          return ['#3B82F6', '#10B981'];
      }
    };

    return {
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
      yaxis: getYAxisConfig(),
      tooltip: getTooltipConfig(),
      colors: getColors(),
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
  }, [chartData.categories, chartType]);

  return (
    <Box>
      {/* Most Recent Month Section */}
      {mostRecentMonth && (
        <Box mb={4}>
          <Typography variant="h6" gutterBottom>
            Most Recent Month - {mostRecentMonth.month}
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="primary" fontWeight="bold">
                  {formatCurrency(mostRecentMonth.total_invoice)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Total Invoice
                </Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="success.main" fontWeight="bold">
                  {formatCurrency(mostRecentMonth.total_profit)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Total Profit
                </Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="error.main" fontWeight="bold">
                  {formatCurrency(mostRecentMonth.total_owed)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Total Owed
                </Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="info.main" fontWeight="bold">
                  {mostRecentMonth.order_count}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Order Count
                </Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="warning.main" fontWeight="bold">
                  {formatPercentage(mostRecentMonth.margin)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Margin
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
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="primary" fontWeight="bold">
                {formatCurrency(overallTotals.total_invoice)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Total Invoice
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="success.main" fontWeight="bold">
                {formatCurrency(overallTotals.total_profit)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Total Profit
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="error.main" fontWeight="bold">
                {formatCurrency(overallTotals.total_owed)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Total Owed
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="info.main" fontWeight="bold">
                {overallTotals.order_count}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Total Orders
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main" fontWeight="bold">
                {formatPercentage(overallTotals.margin)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Overall Margin
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* Monthly Trend Chart */}
      <Card>
        <CardContent>
          {/* Controls */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
            <Typography variant="h6" sx={{ margin: 0 }}>
              Monthly Trend
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <FormControl size="small">
                <InputLabel>Chart Type</InputLabel>
                <Select
                  value={chartType}
                  label="Chart Type"
                  onChange={handleChartTypeChange}
                >
                  <MenuItem value="totals">Totals</MenuItem>
                  <MenuItem value="margin">Margin</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>
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
