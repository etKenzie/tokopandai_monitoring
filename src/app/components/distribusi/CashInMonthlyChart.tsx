'use client';

import { CashInMonthlyResponse, fetchCashInMonthlyData } from '@/app/api/distribusi/DistribusiSlice';
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
import { useEffect, useState } from 'react';

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface CashInMonthlyChartProps {
  filters: {
    agent: string;
    area: string;
    month?: string;
    year?: string;
  };
}

type ChartType = 'amounts' | 'counts' | 'days';

const CashInMonthlyChart = ({ filters }: CashInMonthlyChartProps) => {
  const [chartData, setChartData] = useState<CashInMonthlyResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [chartType, setChartType] = useState<ChartType>('amounts');
  const [startMonthYear, setStartMonthYear] = useState<string>('');
  const [endMonthYear, setEndMonthYear] = useState<string>('');

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

  // Update month range when filters change
  useEffect(() => {
    console.log('Filters changed, updating month range:', filters);
    updateMonthRange();
  }, [filters.month, filters.year, filters.agent, filters.area]);

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

  const fetchChartData = async () => {
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
        agent: filters.agent,
        area: filters.area
      });

      const response = await fetchCashInMonthlyData({
        start_month: startMonthYear,
        end_month: endMonthYear,
        agent: filters.agent || undefined,
        area: filters.area || undefined,
      });
      
      console.log('Chart data response:', response);
      setChartData(response);
    } catch (error) {
      console.error('Failed to fetch chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when month range changes - with better dependency management
  useEffect(() => {
    if (startMonthYear && endMonthYear) {
      console.log('Month range changed, fetching new data:', { startMonthYear, endMonthYear });
      fetchChartData();
    }
  }, [startMonthYear, endMonthYear]); // Remove filters from dependency to prevent unnecessary re-fetches

  // Separate effect for filter changes that should trigger month range updates
  useEffect(() => {
    if (filters.agent || filters.area) {
      console.log('Agent/Area filter changed, re-fetching data');
      fetchChartData();
    }
  }, [filters.agent, filters.area]);

  const handleChartTypeChange = (event: SelectChangeEvent<ChartType>) => {
    setChartType(event.target.value as ChartType);
  };

  const handleStartMonthYearChange = (event: SelectChangeEvent<string>) => {
    setStartMonthYear(event.target.value);
  };

  const handleEndMonthYearChange = (event: SelectChangeEvent<string>) => {
    setEndMonthYear(event.target.value);
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
    }
    return value.toLocaleString('id-ID');
  };

  // Prepare chart data with proper validation
  const prepareChartData = () => {
    if (!chartData?.data || !Array.isArray(chartData.data) || chartData.data.length === 0) {
      console.log('No chart data available:', chartData);
      return { categories: [], series: [] };
    }

    console.log('Processing chart data:', chartData.data);

    // Sort months chronologically (Month Year format like "June 2025")
    const sortedData = chartData.data.sort((a, b) => {
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
          data: sortedData.map(item => item.paid?.paid_total_invoice || 0)
        },
        {
          name: 'Total Profit',
          data: sortedData.map(item => item.paid?.paid_total_profit || 0)
        }
      ];
    } else if (chartType === 'counts') {
      series = [
        {
          name: 'Invoice Count',
          data: sortedData.map(item => item.paid?.paid_invoice_count || 0)
        }
      ];
    } else {
      series = [
        {
          name: 'Average Payment Days',
          data: sortedData.map(item => item.paid?.paid_avg_payment_days || 0)
        }
      ];
    }

    console.log('Prepared chart data:', { categories, series });

    return {
      categories,
      series
    };
  };

  const chartDataConfig = prepareChartData();

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
    colors: ['#3B82F6', '#10B981', '#F59E0B'],
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
            Cash-In Monthly Trend
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

export default CashInMonthlyChart;
