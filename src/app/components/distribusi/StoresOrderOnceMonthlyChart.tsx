'use client';

import {
  StoresOrderOnceMonthlyResponse,
  fetchStoresOrderOnceMonthly,
} from '@/app/api/distribusi/DistribusiSlice';
import {
  Box,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Typography,
} from '@mui/material';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useState } from 'react';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface StoresOrderOnceMonthlyChartProps {
  filters: {
    month?: string;
    year?: string;
  };
}

type ChartType = 'counts' | 'invoice';

const StoresOrderOnceMonthlyChart = ({ filters }: StoresOrderOnceMonthlyChartProps) => {
  const [chartData, setChartData] = useState<StoresOrderOnceMonthlyResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [chartType, setChartType] = useState<ChartType>('counts');
  const [startMonthYear, setStartMonthYear] = useState<string>('');
  const [endMonthYear, setEndMonthYear] = useState<string>('');

  const generateMonthYearOptions = () => {
    const options = [];
    const currentDate = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthName = date.toLocaleString('en-US', { month: 'long' });
      const year = date.getFullYear();
      options.push({ value: `${monthName} ${year}`, label: `${monthName} ${year}` });
    }
    return options.reverse();
  };

  const monthYearOptions = generateMonthYearOptions();

  const updateMonthRange = useCallback(() => {
    if (filters.month && filters.year) {
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December',
      ];
      const monthName = monthNames[parseInt(filters.month) - 1];
      const selectedMonthYear = `${monthName} ${filters.year}`;
      setEndMonthYear(selectedMonthYear);
      let startYearNum = parseInt(filters.year);
      let startMonthNum = parseInt(filters.month) - 3;
      if (startMonthNum < 1) {
        startYearNum -= 1;
        startMonthNum = 12 + startMonthNum;
      }
      setStartMonthYear(`${monthNames[startMonthNum - 1]} ${startYearNum}`);
    } else {
      const currentDate = new Date();
      const currentMonth = currentDate.toLocaleString('en-US', { month: 'long' });
      const currentYear = currentDate.getFullYear();
      setEndMonthYear(`${currentMonth} ${currentYear}`);
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 3, 1);
      setStartMonthYear(
        `${startDate.toLocaleString('en-US', { month: 'long' })} ${startDate.getFullYear()}`
      );
    }
  }, [filters.month, filters.year]);

  useEffect(() => {
    updateMonthRange();
  }, [updateMonthRange]);

  useEffect(() => {
    if (filters.month || filters.year) {
      updateMonthRange();
    }
  }, [filters.month, filters.year, updateMonthRange]);

  const fetchChartData = useCallback(async () => {
    if (!startMonthYear || !endMonthYear) return;
    setLoading(true);
    try {
      const response = await fetchStoresOrderOnceMonthly({
        start_month: startMonthYear,
        end_month: endMonthYear,
      });
      setChartData(response);
    } catch (error) {
      console.error('Failed to fetch stores order once monthly:', error);
      setChartData(null);
    } finally {
      setLoading(false);
    }
  }, [startMonthYear, endMonthYear]);

  useEffect(() => {
    if (startMonthYear && endMonthYear) {
      fetchChartData();
    }
  }, [startMonthYear, endMonthYear, fetchChartData]);

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
    if (type === 'invoice') {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    }
    return value.toLocaleString('id-ID');
  };

  const prepareChartData = () => {
    if (!chartData?.data?.length) return { categories: [], series: [] };

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    const sortedData = [...chartData.data].sort((a, b) => {
      const [monthA, yearA] = a.month.split(' ');
      const [monthB, yearB] = b.month.split(' ');
      if (!monthA || !yearA || !monthB || !yearB) return 0;
      const yearDiff = parseInt(yearA) - parseInt(yearB);
      if (yearDiff !== 0) return yearDiff;
      return monthNames.indexOf(monthA) - monthNames.indexOf(monthB);
    });

    const categories = sortedData.map((item) => item.month);

    const series =
      chartType === 'counts'
        ? [
            { name: 'Unique Stores', data: sortedData.map((item) => item.unique_stores ?? 0) },
            { name: 'Total Orders', data: sortedData.map((item) => item.total_orders ?? 0) },
          ]
        : [{ name: 'Total Invoice', data: sortedData.map((item) => item.total_invoice ?? 0) }];

    return { categories, series };
  };

  const chartDataConfig = useMemo(() => prepareChartData(), [chartData, chartType]);
  const shouldRenderChart =
    chartDataConfig.categories.length > 0 && chartDataConfig.series.length > 0;

  const chartOptions = {
    chart: {
      type: 'line' as const,
      height: 350,
      toolbar: { show: false },
    },
    stroke: { curve: 'smooth' as const, width: 3 },
    xaxis: {
      categories: chartDataConfig.categories,
      labels: { style: { fontSize: '12px' } },
    },
    yaxis: {
      labels: {
        formatter: (value: number) => formatValue(value, chartType),
      },
    },
    tooltip: {
      y: {
        formatter: (value: number) => formatValue(value, chartType),
      },
    },
    colors: ['#3B82F6', '#10B981', '#F59E0B'],
    grid: { borderColor: '#E5E7EB', strokeDashArray: 4 },
    markers: { size: 6, strokeColors: '#FFFFFF', strokeWidth: 2 },
    legend: { position: 'bottom' as const, horizontalAlign: 'center' as const },
  };

  return (
    <Card>
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
            mb: 3,
          }}
        >
          <Typography variant="h6" sx={{ margin: 0 }}>
            Stores Order Once Monthly Trend
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <FormControl size="small">
              <InputLabel>Chart Type</InputLabel>
              <Select
                value={chartType}
                label="Chart Type"
                onChange={handleChartTypeChange}
              >
                <MenuItem value="counts">Stores &amp; Orders</MenuItem>
                <MenuItem value="invoice">Total Invoice</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small">
              <InputLabel>Start Month</InputLabel>
              <Select
                value={startMonthYear}
                label="Start Month"
                onChange={handleStartMonthYearChange}
              >
                {monthYearOptions.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small">
              <InputLabel>End Month</InputLabel>
              <Select
                value={endMonthYear}
                label="End Month"
                onChange={handleEndMonthYearChange}
              >
                {monthYearOptions.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>

        <Box sx={{ height: 400, position: 'relative' }}>
          {loading ? (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
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
                height: '100%',
              }}
            >
              <Typography color="textSecondary">
                No data available for the selected month range
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default StoresOrderOnceMonthlyChart;
