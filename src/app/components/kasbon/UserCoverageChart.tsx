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
import { fetchUserCoverageMonthly, UserCoverageMonthlyResponse } from '../../api/kasbon/KasbonSlice';

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface UserCoverageChartProps {
  filters: {
    employer: string;
    placement: string;
    project: string;
  };
}

type ChartType = 'employees' | 'requests' | 'penetration' | 'firstBorrow';

const UserCoverageChart = ({ filters }: UserCoverageChartProps) => {
  const [chartData, setChartData] = useState<UserCoverageMonthlyResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [chartType, setChartType] = useState<ChartType>('employees');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  // Initialize dates in useEffect to avoid hydration issues
  useEffect(() => {
    const newEndDate = new Date();
    newEndDate.setMonth(newEndDate.getMonth() + 1, 0); // End of current month
    
    const newStartDate = new Date();
    newStartDate.setMonth(newStartDate.getMonth() - 3);
    newStartDate.setDate(1); // Set to first day of the month
    
    setStartDate(newStartDate);
    setEndDate(newEndDate);
  }, []);

  const fetchChartData = async () => {
    if (!startDate || !endDate) return;
    
    setLoading(true);
    try {
      const response = await fetchUserCoverageMonthly({
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
      });
      setChartData(response);
    } catch (error) {
      console.error('Failed to fetch chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Reset date range when filters change
  useEffect(() => {
    const newEndDate = new Date();
    newEndDate.setMonth(newEndDate.getMonth() + 1, 0); // End of current month
    
    const newStartDate = new Date();
    newStartDate.setMonth(newStartDate.getMonth() - 3);
    newStartDate.setDate(1); // Set to first day of the month
    
    setStartDate(newStartDate);
    setEndDate(newEndDate);
  }, [filters.employer, filters.placement, filters.project]);

  // Fetch data when dates change
  useEffect(() => {
    fetchChartData();
  }, [startDate, endDate, filters]);

  const handleChartTypeChange = (event: SelectChangeEvent<ChartType>) => {
    setChartType(event.target.value as ChartType);
  };

  const formatValue = (value: number) => {
    if (chartType === 'penetration') {
      return `${(value * 100).toFixed(2)}%`;
    } else if (chartType === 'employees' || chartType === 'firstBorrow') {
      return value.toLocaleString('en-US');
    }
    return value.toLocaleString('en-US');
  };

  // Prepare chart data
  const prepareChartData = () => {
    if (!chartData?.monthly_data) return { categories: [], series: [] };

    const months = Object.keys(chartData.monthly_data).sort().reverse(); // Reverse to show recent months on right
    const categories = months;
    
    let series: any[] = [];

    if (chartType === 'employees') {
      series = [
        {
          name: 'Total Eligible Employees',
          data: months.map(month => chartData.monthly_data[month].total_eligible_employees)
        }
      ];
    } else if (chartType === 'requests') {
      series = [
        {
          name: 'Total Kasbon Requests',
          data: months.map(month => chartData.monthly_data[month].total_kasbon_requests)
        }
      ];
    } else if (chartType === 'firstBorrow') {
      series = [
        {
          name: 'Total First Borrow',
          data: months.map(month => chartData.monthly_data[month].total_first_borrow)
        }
      ];
    } else {
      series = [
        {
          name: 'Penetration Rate',
          data: months.map(month => chartData.monthly_data[month].penetration_rate)
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
    colors: ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'],
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
            User Coverage Monthly Trend
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <FormControl size="small">
              <InputLabel>Chart Type</InputLabel>
              <Select
                value={chartType}
                label="Chart Type"
                onChange={handleChartTypeChange}
              >
                <MenuItem value="employees">Eligible Employees</MenuItem>
                <MenuItem value="requests">Kasbon Requests</MenuItem>
                <MenuItem value="firstBorrow">First Borrow</MenuItem>
                <MenuItem value="penetration">Penetration Rate</MenuItem>
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

export default UserCoverageChart;
