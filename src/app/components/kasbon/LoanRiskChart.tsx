'use client';

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
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dynamic from "next/dynamic";
import { useEffect, useState } from 'react';
import { fetchLoanRiskMonthly, LoanRiskMonthlyResponse } from '../../api/kasbon/KasbonSlice';
const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface LoanRiskChartProps {
  filters: {
    employer: string;
    placement: string;
    project: string;
    month?: string;
    year?: string;
  };
}

type ChartType = 'amounts' | 'counts' | 'rates';

const LoanRiskChart = ({ filters }: LoanRiskChartProps) => {
  const [chartData, setChartData] = useState<LoanRiskMonthlyResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [chartType, setChartType] = useState<ChartType>('amounts');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  // Initialize dates in useEffect to avoid hydration issues
  useEffect(() => {
    updateDateRange();
  }, []);

  // Update date range when filters change
  useEffect(() => {
    updateDateRange();
  }, [filters.month, filters.year, filters.employer, filters.placement, filters.project]);

  const updateDateRange = () => {
    let newEndDate: Date;
    let newStartDate: Date;

    if (filters.month && filters.year) {
      // Use the selected month and year from filters
      const selectedYear = parseInt(filters.year);
      const selectedMonth = parseInt(filters.month) - 1; // Month is 0-indexed
      
      // End date: end of the selected month
      newEndDate = new Date(selectedYear, selectedMonth + 1, 0);
      
      // Start date: 3 months before the selected month, start of that month
      // Handle year boundary correctly
      let startYear = selectedYear;
      let startMonth = selectedMonth - 3;
      
      if (startMonth < 0) {
        startYear = selectedYear - 1;
        startMonth = 12 + startMonth; // Convert negative to positive month
      }
      
      newStartDate = new Date(startYear, startMonth, 1);
    } else {
      // Fallback to current month logic
      newEndDate = new Date();
      newEndDate.setMonth(newEndDate.getMonth() + 1, 0); // End of current month
      
      newStartDate = new Date();
      newStartDate.setMonth(newStartDate.getMonth() - 3);
      newStartDate.setDate(1); // Set to first day of the month
    }
    
    setStartDate(newStartDate);
    setEndDate(newEndDate);
  };

  const fetchChartData = async () => {
    if (!startDate || !endDate) return;
    
    setLoading(true);
    try {
      // Format dates as YYYY-MM-DD without timezone issues
      const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const response = await fetchLoanRiskMonthly({
        employer: filters.employer || undefined,
        sourced_to: filters.placement || undefined,
        project: filters.project || undefined,
        start_date: formatDate(startDate),
        end_date: formatDate(endDate),
      });
      setChartData(response);
    } catch (error) {
      console.error('Failed to fetch chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when dates change
  useEffect(() => {
    fetchChartData();
  }, [startDate, endDate, filters]);

  const handleChartTypeChange = (event: SelectChangeEvent<ChartType>) => {
    setChartType(event.target.value as ChartType);
  };

  const formatValue = (value: number) => {
    if (chartType === 'amounts') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    } else if (chartType === 'rates') {
      return `${(value * 100).toFixed(2)}%`;
    }
    return value.toLocaleString('en-US');
  };

  // Prepare chart data
  const prepareChartData = () => {
    if (!chartData?.monthly_data) return { categories: [], series: [] };

    // Sort months chronologically (Month Year format like "January 2025")
    const months = Object.keys(chartData.monthly_data).sort((a, b) => {
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      
      const [monthA, yearA] = a.split(' ');
      const [monthB, yearB] = b.split(' ');
      
      const yearDiff = parseInt(yearA) - parseInt(yearB);
      if (yearDiff !== 0) return yearDiff;
      
      const monthIndexA = monthNames.indexOf(monthA);
      const monthIndexB = monthNames.indexOf(monthB);
      
      return monthIndexA - monthIndexB;
    });
    
    const categories = months;
    
    let series: any[] = [];

    if (chartType === 'amounts') {
      series = [
        {
          name: 'Total Unrecovered Kasbon',
          data: months.map(month => chartData.monthly_data[month].total_unrecovered_kasbon)
        },
        {
          name: 'Total Expected Repayment',
          data: months.map(month => chartData.monthly_data[month].total_expected_repayment)
        }
      ];
    } else if (chartType === 'counts') {
      series = [
        {
          name: 'Unrecovered Kasbon Count',
          data: months.map(month => chartData.monthly_data[month].unrecovered_kasbon_count)
        }
      ];
    } else {
      series = [
        {
          name: 'Principal Recovery Rate',
          data: months.map(month => chartData.monthly_data[month].kasbon_principal_recovery_rate)
        }
      ];
    }

    return {
      categories,
      series
    };
  };

  const chartDataConfig = prepareChartData();

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
          return formatValue(value);
        }
      }
    },
    tooltip: {
      y: {
        formatter: function(value: number) {
          return formatValue(value);
        }
      }
    },
    colors: ['#EF4444', '#10B981', '#3B82F6'],
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
            Loan Risk Monthly Trend
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
                <MenuItem value="counts">Counts</MenuItem>
                <MenuItem value="rates">Recovery Rates</MenuItem>
              </Select>
            </FormControl>
            
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                slotProps={{ textField: { size: 'small' } }}
              />
            </LocalizationProvider>
            
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                slotProps={{ textField: { size: 'small' } }}
              />
            </LocalizationProvider>
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
          ) : chartData?.monthly_data && Object.keys(chartData.monthly_data).length > 0 ? (
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
              <Typography color="textSecondary">No data available for the selected date range</Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default LoanRiskChart;
