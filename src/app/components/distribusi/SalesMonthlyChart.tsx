'use client';

import { SalesSummaryMonthlyResponse, fetchSalesSummaryMonthly } from '@/app/api/distribusi/DistribusiSlice';
import {
  Box,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Typography
} from '@mui/material';
import dynamic from "next/dynamic";
import { useEffect, useState, useCallback, useMemo } from 'react';

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface SalesMonthlyChartProps {
  filters: {
    agent: string;
    area: string;
    month?: string;
    year?: string;
    status_payment?: string;
  };
  monthlyData?: any[];
}

type ChartType = 'amounts' | 'counts' | 'days' | 'margin' | 'avg_profit';

const SalesMonthlyChart = ({ filters, monthlyData }: SalesMonthlyChartProps) => {
  const [chartData, setChartData] = useState<SalesSummaryMonthlyResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [chartType, setChartType] = useState<ChartType>('amounts');
  const [startMonthYear, setStartMonthYear] = useState<string>('');
  const [endMonthYear, setEndMonthYear] = useState<string>('');
  const [isManuallySet, setIsManuallySet] = useState(false);

  // Generate month-year options (current month - 12 months back)
  const generateMonthYearOptions = () => {
    const options = [];
    const currentDate = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthName = date.toLocaleString('en-US', { month: 'long' });
      const year = date.getFullYear();
      const value = `${monthName} ${year}`;
      options.push({ value, label: value });
    }
    
    // Reverse the array so oldest months appear first (top) and newest months appear last (bottom)
    return options.reverse();
  };

  const monthYearOptions = generateMonthYearOptions();

  // Initialize month range in useEffect to avoid hydration issues
  useEffect(() => {
    updateMonthRange();
  }, []);

  // Update month range when filters change (but not when manually set)
  useEffect(() => {
    console.log('Filters changed, updating month range:', filters);
    // Only update if dates haven't been manually set
    if (!isManuallySet) {
      updateMonthRange();
    }
  }, [filters.month, filters.year, filters.agent, filters.area, filters.status_payment, isManuallySet]);

  const updateMonthRange = () => {
    console.log('Updating month range with filters:', filters);
    
    if (filters.month && filters.year) {
      // Use the selected month and year from filters
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const monthName = monthNames[parseInt(filters.month) - 1];
      const selectedMonthYear = `${monthName} ${filters.year}`;
      
      console.log('Selected month year:', selectedMonthYear);
      
      // End month: the selected month
      setEndMonthYear(selectedMonthYear);
      
      // Start month: 3 months before the selected month
      let startYearNum = parseInt(filters.year);
      let startMonthNum = parseInt(filters.month) - 3;
      
      if (startMonthNum < 1) {
        startYearNum = startYearNum - 1;
        startMonthNum = 12 + startMonthNum; // Convert negative to positive month
      }
      
      const startMonthName = monthNames[startMonthNum - 1];
      const startMonthYear = `${startMonthName} ${startYearNum}`;
      
      console.log('Calculated start month year:', startMonthYear);
      
      setStartMonthYear(startMonthYear);
    } else {
      // Fallback to current month logic
      const currentDate = new Date();
      const currentMonth = currentDate.toLocaleString('en-US', { month: 'long' });
      const currentYear = currentDate.getFullYear();
      const currentMonthYear = `${currentMonth} ${currentYear}`;
      
      console.log('Using current month year:', currentMonthYear);
      
      setEndMonthYear(currentMonthYear);
      
      // Start month: 3 months before current month
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 3, 1);
      const startMonth = startDate.toLocaleString('en-US', { month: 'long' });
      const startYear = startDate.getFullYear();
      const startMonthYear = `${startMonth} ${startYear}`;
      
      console.log('Using calculated start month year:', startMonthYear);
      
      setStartMonthYear(startMonthYear);
    }
  };

  const fetchChartData = useCallback(async () => {
    if (!startMonthYear || !endMonthYear) {
      console.log('Missing month/year values:', { startMonthYear, endMonthYear });
      return;
    }
    
    console.log('Fetching chart data for range:', { startMonthYear, endMonthYear });
    setLoading(true);
    try {
      console.log('API call parameters:', {
        start_month: startMonthYear,
        end_month: endMonthYear,
        agent_name: filters.agent,
        area: filters.area,
        status_payment: filters.status_payment
      });

      const response = await fetchSalesSummaryMonthly({
        start_month: startMonthYear,
        end_month: endMonthYear,
        agent_name: filters.agent || undefined,
        area: filters.area || undefined,
        status_payment: filters.status_payment || undefined,
      });
      
      console.log('Chart data response:', response);
      setChartData(response);
    } catch (error) {
      console.error('Failed to fetch chart data:', error);
    } finally {
      setLoading(false);
    }
  }, [startMonthYear, endMonthYear, filters.agent, filters.area, filters.status_payment]);

  // Fetch data when month range changes
  useEffect(() => {
    if (startMonthYear && endMonthYear) {
      console.log('Month range changed, fetching new data:', { startMonthYear, endMonthYear });
      fetchChartData();
    }
  }, [startMonthYear, endMonthYear]); // Remove fetchChartData to avoid circular dependency

  // Separate effect for filter changes that should trigger month range updates
  useEffect(() => {
    if (filters.agent || filters.area || filters.status_payment) {
      console.log('Filter changed, re-fetching data');
      fetchChartData();
    }
  }, [filters.agent, filters.area, filters.status_payment]); // Remove fetchChartData to avoid circular dependency

  const handleChartTypeChange = (event: SelectChangeEvent<ChartType>) => {
    setChartType(event.target.value as ChartType);
  };

  const handleStartMonthYearChange = (event: SelectChangeEvent<string>) => {
    console.log('Start month changed to:', event.target.value);
    setStartMonthYear(event.target.value);
    setIsManuallySet(true);
  };

  const handleEndMonthYearChange = (event: SelectChangeEvent<string>) => {
    console.log('End month changed to:', event.target.value);
    setEndMonthYear(event.target.value);
    setIsManuallySet(true);
  };


  const formatValue = (value: number, type: ChartType) => {
    if (type === 'amounts') {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    } else if (type === 'days') {
      return `${value.toFixed(1)} days`;
    } else if (type === 'margin') {
      return `${value.toFixed(1)}%`;
    }
    return value.toLocaleString('id-ID');
  };

  // Prepare chart data with proper validation
  const prepareChartData = () => {
    // If dates are manually set, use chartData (fetched data), otherwise use monthlyData from parent
    const dataToUse = isManuallySet ? chartData?.data : (monthlyData && monthlyData.length > 0 ? monthlyData : chartData?.data);
    
    if (!dataToUse || !Array.isArray(dataToUse) || dataToUse.length === 0) {
      console.log('No chart data available:', { monthlyData, chartData });
      return { categories: [], series: [] };
    }

    console.log('Processing chart data:', dataToUse);

    // Sort months chronologically (Month Year format like "June 2025")
    const sortedData = dataToUse.sort((a, b) => {
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
    
    const categories = sortedData.map(item => item.month);
    
    let series: any[] = [];

    if (chartType === 'amounts') {
      series = [
        {
          name: 'Total Invoice',
          data: sortedData.map(item => item.total_invoice || 0)
        },
        {
          name: 'Total Profit',
          data: sortedData.map(item => item.total_profit || 0)
        }
      ];
    } else if (chartType === 'counts') {
      series = [
        {
          name: 'Invoice Count',
          data: sortedData.map(item => item.invoice_count || 0)
        }
      ];
    } else if (chartType === 'days') {
      series = [
        {
          name: 'Average Payment Days',
          data: sortedData.map(item => item.avg_payment_days || 0)
        }
      ];
    } else if (chartType === 'margin') {
      series = [
        {
          name: 'Margin',
          data: sortedData.map(item => item.margin || 0)
        }
      ];
    } else if (chartType === 'avg_profit') {
      series = [
        {
          name: 'Average Daily Profit',
          data: sortedData.map(item => item.average_profit_day || 0)
        },
        {
          name: 'Average Weekly Profit',
          data: sortedData.map(item => item.average_profit_week || 0)
        }
      ];
    }

    console.log('Prepared chart data:', { categories, series });

    return {
      categories,
      series
    };
  };

  const chartDataConfig = useMemo(() => {
    console.log('Recalculating chart data config...', { chartData, monthlyData, chartType, isManuallySet });
    return prepareChartData();
  }, [chartData, monthlyData, chartType, isManuallySet]);

  // Only render chart if we have valid data
  const shouldRenderChart = chartDataConfig.categories.length > 0 && chartDataConfig.series.length > 0;

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
      categories: chartDataConfig.categories,
      labels: {
        style: {
          fontSize: '12px'
        }
      }
    },
    yaxis: {
      labels: {
        formatter: function(value: number) {
          return formatValue(value, chartType);
        }
      }
    },
    tooltip: {
      y: {
        formatter: function(value: number) {
          return formatValue(value, chartType);
        }
      }
    },
    colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
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
    <Card>
      <CardContent>
        
        {/* Controls */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
          <Typography variant="h6" sx={{ margin: 0 }}>
            Sales Monthly Trend
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <FormControl size="small">
              <InputLabel>Chart Type</InputLabel>
              <Select
                value={chartType}
                label="Chart Type"
                onChange={handleChartTypeChange}
              >
                <MenuItem value="amounts">Amounts</MenuItem>
                <MenuItem value="counts">Invoice Count</MenuItem>
                <MenuItem value="days">Payment Days</MenuItem>
                <MenuItem value="margin">Margin</MenuItem>
                <MenuItem value="avg_profit">Average Profit Trends</MenuItem>
              </Select>
            </FormControl>
            
            {/* Start Month Year */}
            <FormControl size="small">
              <InputLabel>Start Month</InputLabel>
              <Select
                value={startMonthYear}
                label="Start Month"
                onChange={handleStartMonthYearChange}
              >
                {monthYearOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* End Month Year */}
            <FormControl size="small">
              <InputLabel>End Month</InputLabel>
              <Select
                value={endMonthYear}
                label="End Month"
                onChange={handleEndMonthYearChange}
              >
                {monthYearOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

          </Box>
        </Box>

        {/* Chart */}
        <Box sx={{ height: 400, position: 'relative' }}>
          {loading ? (
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '100%' 
              }}
            >
              <Typography>Loading chart data...</Typography>
            </Box>
          ) : shouldRenderChart ? (
            <ReactApexChart
              key={`${startMonthYear}-${endMonthYear}-${chartType}`}
              options={chartOptions}
              series={chartDataConfig.series}
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
              <Typography color="textSecondary">No data available for the selected month range</Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default SalesMonthlyChart;
