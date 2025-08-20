'use client';

import {
    Box,
    Card,
    CardContent,
    FormControl,
    Grid,
    InputLabel,
    MenuItem,
    Select,
    SelectChangeEvent,
    Typography
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { useEffect, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import { fetchKasbonLoanFeesMonthly, KasbonLoanFeesMonthlyResponse } from '../../api/kasbon/KasbonSlice';

interface LoanFeesChartProps {
  filters: {
    employer: string;
    placement: string;
    project: string;
  };
}

type ChartType = 'fees' | 'count';

const LoanFeesChart = ({ filters }: LoanFeesChartProps) => {
  const [chartData, setChartData] = useState<KasbonLoanFeesMonthlyResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [chartType, setChartType] = useState<ChartType>('fees');
  const [startDate, setStartDate] = useState<Date | null>(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 3);
    date.setDate(1); // Set to first day of the month
    return date;
  });
  const [endDate, setEndDate] = useState<Date | null>(() => {
    const date = new Date();
    date.setMonth(date.getMonth() + 1, 0); // End of current month
    return date;
  });

  const fetchChartData = async () => {
    if (!startDate || !endDate) return;
    
    setLoading(true);
    try {
      const response = await fetchKasbonLoanFeesMonthly({
        employer: filters.employer || undefined,
        sourced_to: filters.placement || undefined,
        project: filters.project || undefined,
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
    if (chartType === 'fees') {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    }
    return value.toLocaleString('id-ID');
  };

  // Prepare chart data
  const prepareChartData = () => {
    if (!chartData?.monthly_data) return { categories: [], series: [] };

    const months = Object.keys(chartData.monthly_data).sort().reverse(); // Reverse to show recent months on right
    const categories = months;
    
    let series: any[] = [];

    if (chartType === 'fees') {
      series = [
        {
          name: 'Expected Admin Fee',
          data: months.map(month => chartData.monthly_data[month].total_expected_admin_fee)
        },
        {
          name: 'Collected Admin Fee',
          data: months.map(month => chartData.monthly_data[month].total_collected_admin_fee)
        },
        {
          name: 'Failed Payment',
          data: months.map(month => chartData.monthly_data[month].total_failed_payment)
        },
        {
          name: 'Admin Fee Profit',
          data: months.map(month => chartData.monthly_data[month].admin_fee_profit)
        }
      ];
    } else {
      series = [
        {
          name: 'Expected Loans Count',
          data: months.map(month => chartData.monthly_data[month].expected_loans_count)
        },
        {
          name: 'Collected Loans Count',
          data: months.map(month => chartData.monthly_data[month].collected_loans_count)
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
    colors: ['#3B82F6', '#10B981', '#EF4444', '#F59E0B'],
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
        <Typography variant="h6" gutterBottom>
          Loan Fees Monthly Trend
        </Typography>
        
        {/* Controls */}
        <Grid container spacing={2} mb={3}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Chart Type</InputLabel>
              <Select
                value={chartType}
                label="Chart Type"
                onChange={handleChartTypeChange}
              >
                <MenuItem value="fees">Fees Amount</MenuItem>
                <MenuItem value="count">Loan Count</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </LocalizationProvider>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </LocalizationProvider>
          </Grid>
        </Grid>

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

export default LoanFeesChart;
