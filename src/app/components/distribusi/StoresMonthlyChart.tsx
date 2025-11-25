'use client';

import { TotalStoresMonthlyResponse, fetchTotalStoresMonthly } from '@/app/api/distribusi/DistribusiSlice';
import {
    Box,
    Button,
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
import { useEffect, useState, useRef } from 'react';

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface StoresMonthlyChartProps {
  filters: {
    agent: string;
    area: string;
    segment?: string;
    month?: string;
    year?: string;
    status_payment?: string;
  };
  onViewAllStores?: () => void;
}

type ChartType = 'stores' | 'activation';

const StoresMonthlyChart = ({ filters, onViewAllStores }: StoresMonthlyChartProps) => {
  const [chartData, setChartData] = useState<TotalStoresMonthlyResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [chartType, setChartType] = useState<ChartType>('stores');
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
  }, [filters.month, filters.year, filters.agent, filters.area, filters.segment, filters.status_payment]);

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

  // Use ref to track the latest filters to avoid stale closures
  const filtersRef = useRef(filters);
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  // Use ref to track the latest month range to avoid stale closures
  const monthRangeRef = useRef({ startMonthYear, endMonthYear });
  useEffect(() => {
    monthRangeRef.current = { startMonthYear, endMonthYear };
  }, [startMonthYear, endMonthYear]);

  const fetchChartData = async (signal?: AbortSignal) => {
    // Get latest values from refs to avoid stale closures
    const currentFilters = filtersRef.current;
    const currentMonthRange = monthRangeRef.current;
    
    if (!currentMonthRange.startMonthYear || !currentMonthRange.endMonthYear) {
      console.log('Missing month/year values:', currentMonthRange);
      return;
    }
    
    console.log('Fetching stores chart data for range:', currentMonthRange);
    setLoading(true);
    try {
      console.log('API call parameters:', {
        start_month: currentMonthRange.startMonthYear,
        end_month: currentMonthRange.endMonthYear,
        agent_name: currentFilters.agent,
        area: currentFilters.area,
        segment: currentFilters.segment,
        status_payment: currentFilters.status_payment
      });

      const response = await fetchTotalStoresMonthly({
        start_month: currentMonthRange.startMonthYear,
        end_month: currentMonthRange.endMonthYear,
        agent_name: currentFilters.agent || undefined,
        area: currentFilters.area || undefined,
        segment: currentFilters.segment || undefined,
        status_payment: currentFilters.status_payment || undefined,
      }, signal);
      
      // Check if request was aborted before updating state
      if (signal?.aborted) {
        console.log('Request was aborted, ignoring response');
        return;
      }
      
      console.log('Stores chart data response:', response);
      setChartData(response);
    } catch (error: any) {
      // Ignore abort errors
      if (error?.name === 'AbortError' || signal?.aborted) {
        console.log('Request was aborted');
        return;
      }
      console.error('Failed to fetch stores chart data:', error);
    } finally {
      // Only update loading state if request wasn't aborted
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  // Use ref to track in-flight requests and prevent race conditions
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch data when month range or filters change with debouncing
  useEffect(() => {
    if (!startMonthYear || !endMonthYear) {
      return;
    }

    // Clear any existing debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Cancel any in-flight request
    if (abortControllerRef.current) {
      console.log('Cancelling previous request due to filter change');
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Debounce the fetch to avoid too many rapid requests
    debounceTimeoutRef.current = setTimeout(() => {
      console.log('Month range or filters changed, fetching new data:', { 
        startMonthYear, 
        endMonthYear,
        agent: filters.agent,
        area: filters.area,
        segment: filters.segment,
        status_payment: filters.status_payment
      });

      // Create new abort controller for this request
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      fetchChartData(abortController.signal).finally(() => {
        // Only clear the ref if this is still the current request
        if (abortControllerRef.current === abortController) {
          abortControllerRef.current = null;
        }
      });
    }, 300); // 300ms debounce delay

    // Cleanup function
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [startMonthYear, endMonthYear, filters.agent, filters.area, filters.segment, filters.status_payment]);

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
    if (type === 'activation') {
      return `${value.toFixed(1)}%`;
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

    if (chartType === 'stores') {
      series = [
        {
          name: 'Active Stores',
          data: sortedData.map(item => item.active_stores || 0)
        },
        {
          name: 'Total Stores',
          data: sortedData.map(item => item.total_stores || 0)
        }
      ];
    } else if (chartType === 'activation') {
      series = [
        {
          name: 'Activation Rate',
          data: sortedData.map(item => item.activation_rate || 0)
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6" sx={{ margin: 0 }}>
              Stores Monthly Trend
            </Typography>
            {onViewAllStores && (
              <Button
                variant="outlined"
                size="small"
                onClick={onViewAllStores}
              >
                View All Stores
              </Button>
            )}
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <FormControl size="small">
              <InputLabel>Chart Type</InputLabel>
              <Select
                value={chartType}
                label="Chart Type"
                onChange={handleChartTypeChange}
              >
                <MenuItem value="stores">Stores</MenuItem>
                <MenuItem value="activation">Activation Rate</MenuItem>
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

export default StoresMonthlyChart;
