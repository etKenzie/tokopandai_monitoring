'use client';

import { ProductOrder } from '@/app/api/distribusi/ProductSlice';
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

type ChartType = 'totals' | 'margin' | 'price';

interface ProductSummaryTabProps {
  productOrders: ProductOrder[];
  product?: {
    average_buy_price: number;
    total_quantity: number;
  } | null;
}

const ProductSummaryTab = ({ productOrders, product }: ProductSummaryTabProps) => {
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
      total_quantity: number;
      total_buy_price: number; // Sum of (quantity * buy_price) for weighted average
      total_sale_price: number; // Sum of (quantity * sale_price) for weighted average
      average_buy_price: number;
      average_sale_price: number;
      // Variant-specific data
      variants: Map<string, {
        total_quantity: number;
        total_buy_price: number;
        total_sale_price: number;
        average_buy_price: number;
        average_sale_price: number;
      }>;
    }>();

    // Helper function to normalize month format to "Month Year" (e.g., "June 2025")
    const normalizeMonth = (monthStr: string, orderDate?: string): string => {
      // If month is already in "Month Year" format, return as is
      if (monthStr && monthStr.includes(' ') && /^\w+\s+\d{4}$/.test(monthStr.trim())) {
        return monthStr.trim();
      }
      
      // Try to extract from order_date if available
      if (orderDate) {
        try {
          const date = new Date(orderDate);
          if (!isNaN(date.getTime())) {
            const monthName = date.toLocaleString('en-US', { month: 'long' });
            const year = date.getFullYear();
            return `${monthName} ${year}`;
          }
        } catch (e) {
          console.warn('Failed to parse order_date:', orderDate, e);
        }
      }
      
      // Fallback: use the month string as is, or "Other" if empty
      return monthStr && monthStr.trim() ? monthStr.trim() : 'Other';
    };

    productOrders.forEach(order => {
      // Normalize month format to ensure consistency
      const month = normalizeMonth(order.month || '', order.order_date);
      
      if (!monthMap.has(month)) {
        monthMap.set(month, {
          month,
          total_invoice: 0,
          total_profit: 0,
          total_owed: 0,
          order_count: 0,
          margin: 0,
          total_quantity: 0,
          total_buy_price: 0,
          total_sale_price: 0,
          average_buy_price: 0,
          average_sale_price: 0,
          variants: new Map()
        });
      }

      const monthData = monthMap.get(month)!;
      // Use total_invoice (item-level) for product aggregation, not order_total_invoice
      const itemInvoice = Number(order.total_invoice) || 0;
      const itemProfit = Number(order.profit) || 0;
      const itemQuantity = Number(order.order_quantity) || 0;
      const itemBuyPrice = Number(order.buy_price) || 0;
      const itemPrice = Number(order.price) || 0; // This is the sale price
      
      monthData.total_invoice += itemInvoice;
      monthData.total_profit += itemProfit;
      monthData.total_quantity += itemQuantity;
      
      // Calculate weighted buy and sale prices
      if (itemQuantity > 0) {
        monthData.total_buy_price += itemBuyPrice * itemQuantity;
        monthData.total_sale_price += itemPrice * itemQuantity;
      }
      
      // Track variant-specific data
      if (order.variant_name) {
        if (!monthData.variants.has(order.variant_name)) {
          monthData.variants.set(order.variant_name, {
            total_quantity: 0,
            total_buy_price: 0,
            total_sale_price: 0,
            average_buy_price: 0,
            average_sale_price: 0
          });
        }
        const variantData = monthData.variants.get(order.variant_name)!;
        variantData.total_quantity += itemQuantity;
        if (itemQuantity > 0) {
          variantData.total_buy_price += itemBuyPrice * itemQuantity;
          variantData.total_sale_price += itemPrice * itemQuantity;
        }
      }
      
      monthData.order_count += 1;

      // Add to total_owed if payment status is "BELUM LUNAS"
      if (order.status_payment === "BELUM LUNAS") {
        monthData.total_owed += itemInvoice;
      }
    });

    return Array.from(monthMap.values()).map(item => {
      // Calculate weighted averages
      const avgBuyPrice = item.total_quantity > 0 ? item.total_buy_price / item.total_quantity : 0;
      const avgSalePrice = item.total_quantity > 0 ? item.total_sale_price / item.total_quantity : 0;
      
      // Calculate variant averages
      const variantData: Record<string, { average_buy_price: number; average_sale_price: number }> = {};
      item.variants.forEach((variant, variantName) => {
        variantData[variantName] = {
          average_buy_price: variant.total_quantity > 0 ? variant.total_buy_price / variant.total_quantity : 0,
          average_sale_price: variant.total_quantity > 0 ? variant.total_sale_price / variant.total_quantity : 0
        };
      });
      
      return {
        ...item,
        margin: item.total_invoice > 0 ? (item.total_profit / item.total_invoice) * 100 : 0,
        average_buy_price: avgBuyPrice,
        average_sale_price: avgSalePrice,
        variantData
      };
    }).sort((a: any, b: any) => {
      // Sort by month chronologically
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      
      // Handle "Other" case - put it at the beginning (most left)
      if (a.month === 'Other') return -1;
      if (b.month === 'Other') return 1;
      
      const [monthA, yearA] = a.month.split(' ');
      const [monthB, yearB] = b.month.split(' ');
      
      if (!monthA || !yearA || !monthB || !yearB) return 0;
      
      const yearDiff = parseInt(yearA) - parseInt(yearB);
      if (yearDiff !== 0) return yearDiff;
      
      const monthIndexA = monthNames.indexOf(monthA);
      const monthIndexB = monthNames.indexOf(monthB);
      
      return monthIndexA - monthIndexB;
    });
  }, [productOrders, product]);

  // Get most recent month data (exclude "Other")
  const mostRecentMonth = monthlyData.filter(item => item.month !== 'Other')[monthlyData.filter(item => item.month !== 'Other').length - 1];

  // Calculate overall totals
  const overallTotals = useMemo(() => {
    let totalQuantity = 0;
    let totalBuyPrice = 0;
    let totalSalePrice = 0;
    
    const totals = productOrders.reduce((totals, order) => {
      // Use item-level totals (total_invoice, profit) for product aggregation
      const itemInvoice = Number(order.total_invoice) || 0;
      const itemProfit = Number(order.profit) || 0;
      const itemQuantity = Number(order.order_quantity) || 0;
      const itemBuyPrice = Number(order.buy_price) || 0;
      const itemPrice = Number(order.price) || 0;
      
      totals.total_invoice += itemInvoice;
      totals.total_profit += itemProfit;
      totals.order_count += 1;
      
      if (itemQuantity > 0) {
        totalQuantity += itemQuantity;
        totalBuyPrice += itemBuyPrice * itemQuantity;
        totalSalePrice += itemPrice * itemQuantity;
      }
      
      if (order.status_payment === "BELUM LUNAS") {
        totals.total_owed += itemInvoice;
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
      margin: totals.total_invoice > 0 ? (totals.total_profit / totals.total_invoice) * 100 : 0,
      average_buy_price: totalQuantity > 0 ? totalBuyPrice / totalQuantity : 0,
      average_sale_price: totalQuantity > 0 ? totalSalePrice / totalQuantity : 0
    };
  }, [productOrders]);

  const formatCurrency = (amount: number) => {
    // Handle NaN, null, undefined
    const value = Number(amount) || 0;
    if (isNaN(value) || !isFinite(value)) {
      return 'IDR 0';
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
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
            data: monthlyData.map(item => item.total_invoice || 0)
          },
          {
            name: 'Total Profit',
            data: monthlyData.map(item => item.total_profit || 0)
          }
        ];
        break;
      case 'margin':
        series = [
          {
            name: 'Margin %',
            data: monthlyData.map(item => item.margin || 0)
          }
        ];
        break;
      case 'price':
        // Get all unique variants
        const allVariants = new Set<string>();
        monthlyData.forEach(item => {
          if (item.variantData) {
            Object.keys(item.variantData).forEach(variant => allVariants.add(variant));
          }
        });
        const variantList = Array.from(allVariants).sort();
        
        // Create series for each variant's buy and sale price
        series = [];
        variantList.forEach(variant => {
          series.push({
            name: `${variant} Buy Price`,
            data: monthlyData.map(item => {
              const variantData = item.variantData?.[variant];
              return variantData?.average_buy_price || 0;
            })
          });
          series.push({
            name: `${variant} Sale Price`,
            data: monthlyData.map(item => {
              const variantData = item.variantData?.[variant];
              return variantData?.average_sale_price || 0;
            })
          });
        });
        
        // If no variants, show overall averages
        if (series.length === 0) {
          series = [
            {
              name: 'Average Buy Price',
              data: monthlyData.map(item => item.average_buy_price || 0)
            },
            {
              name: 'Average Sale Price',
              data: monthlyData.map(item => item.average_sale_price || 0)
            }
          ];
        }
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
        case 'price':
          // Generate colors for variants: each variant gets its own color family
          // PACK: Blue shades, CARTON: Green shades, GRAM: Orange/Purple shades
          const variantColorMap: Record<string, { buy: string; sale: string }> = {
            'PACK': { buy: '#3B82F6', sale: '#60A5FA' },      // Blue shades
            'CARTON': { buy: '#10B981', sale: '#34D399' },   // Green shades
            'GRAM': { buy: '#F59E0B', sale: '#FBBF24' },      // Orange/Yellow shades
          };
          
          const colors: string[] = [];
          chartData.series.forEach(series => {
            const seriesName = series.name as string;
            // Extract variant name from series name (e.g., "PACK Buy Price" -> "PACK")
            const variantMatch = seriesName.match(/^(PACK|CARTON|GRAM)/);
            if (variantMatch) {
              const variantName = variantMatch[1];
              const colorScheme = variantColorMap[variantName];
              if (colorScheme) {
                if (seriesName.includes('Buy Price')) {
                  colors.push(colorScheme.buy);
                } else if (seriesName.includes('Sale Price')) {
                  colors.push(colorScheme.sale);
                } else {
                  colors.push(colorScheme.buy); // Default to buy color
                }
              } else {
                colors.push('#6B7280'); // Gray for unknown variants
              }
            } else {
              // Fallback for non-variant series
              colors.push('#3B82F6');
            }
          });
          
          return colors.length > 0 ? colors : ['#3B82F6', '#10B981'];
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
                  {mostRecentMonth.order_count || 0}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Order Count
                </Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="warning.main" fontWeight="bold">
                  {formatPercentage(mostRecentMonth.margin || 0)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Margin
                </Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="secondary.main" fontWeight="bold">
                  {formatCurrency(mostRecentMonth.average_buy_price || 0)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Avg Buy Price
                </Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="secondary.main" fontWeight="bold">
                  {formatCurrency(mostRecentMonth.average_sale_price || 0)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Avg Sale Price
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
                {formatPercentage(overallTotals.margin || 0)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Overall Margin
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="secondary.main" fontWeight="bold">
                {formatCurrency(overallTotals.average_buy_price || 0)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Avg Buy Price
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="secondary.main" fontWeight="bold">
                {formatCurrency(overallTotals.average_sale_price || 0)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Avg Sale Price
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
                  <MenuItem value="price">Price</MenuItem>
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

export default ProductSummaryTab;
