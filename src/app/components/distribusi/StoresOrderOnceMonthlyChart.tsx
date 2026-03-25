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
  Switch,
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

const StoresOrderOnceMonthlyChart = ({ filters }: StoresOrderOnceMonthlyChartProps) => {
  const [chartData, setChartData] = useState<StoresOrderOnceMonthlyResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [startMonthYear, setStartMonthYear] = useState<string>('');
  const [endMonthYear, setEndMonthYear] = useState<string>('');
  /** false = stores & orders (two series); true = total invoice (one series) */
  const [showInvoice, setShowInvoice] = useState(false);

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
      console.error('Failed to fetch NOO monthly trend:', error);
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

  const handleStartMonthYearChange = (event: SelectChangeEvent<string>) => {
    setStartMonthYear(event.target.value);
  };

  const handleEndMonthYearChange = (event: SelectChangeEvent<string>) => {
    setEndMonthYear(event.target.value);
  };

  const formatCount = (value: number) => value.toLocaleString('id-ID');

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  const sortedRows = useMemo(() => {
    if (!chartData?.data?.length) return [];
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    return [...chartData.data].sort((a, b) => {
      const [monthA, yearA] = a.month.split(' ');
      const [monthB, yearB] = b.month.split(' ');
      if (!monthA || !yearA || !monthB || !yearB) return 0;
      const yearDiff = parseInt(yearA, 10) - parseInt(yearB, 10);
      if (yearDiff !== 0) return yearDiff;
      return monthNames.indexOf(monthA) - monthNames.indexOf(monthB);
    });
  }, [chartData]);

  const chartDataConfig = useMemo(() => {
    if (!sortedRows.length) return { categories: [] as string[], series: [] as { name: string; data: number[] }[] };

    const categories = sortedRows.map((item) => item.month);

    if (showInvoice) {
      return {
        categories,
        series: [
          {
            name: 'Total invoice',
            data: sortedRows.map((item) => item.total_invoice ?? 0),
          },
        ],
      };
    }

    return {
      categories,
      series: [
        { name: 'Total unique stores', data: sortedRows.map((item) => item.total_unique_stores ?? 0) },
        { name: 'Total orders', data: sortedRows.map((item) => item.total_orders ?? 0) },
      ],
    };
  }, [sortedRows, showInvoice]);

  const shouldRenderChart =
    chartDataConfig.categories.length > 0 && chartDataConfig.series.length > 0;

  const chartOptions = useMemo(
    () => ({
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
          formatter: (value: number) =>
            showInvoice ? formatCurrency(value) : formatCount(value),
        },
      },
      tooltip: {
        y: {
          formatter: (value: number) =>
            showInvoice ? formatCurrency(value) : formatCount(value),
        },
      },
      colors: showInvoice ? ['#F59E0B'] : ['#3B82F6', '#10B981'],
      grid: { borderColor: '#E5E7EB', strokeDashArray: 4 },
      markers: { size: 6, strokeColors: '#FFFFFF', strokeWidth: 2 },
      legend: { position: 'bottom' as const, horizontalAlign: 'center' as const },
    }),
    [chartDataConfig, showInvoice]
  );

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
            NOO Monthly trend
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color={showInvoice ? 'text.secondary' : 'text.primary'}>
                Stores &amp; orders
              </Typography>
              <Switch
                checked={showInvoice}
                onChange={(_, checked) => setShowInvoice(checked)}
                inputProps={{ 'aria-label': 'Toggle between stores/orders and invoice' }}
              />
              <Typography variant="body2" color={showInvoice ? 'text.primary' : 'text.secondary'}>
                Invoice
              </Typography>
            </Box>
            <FormControl size="small">
              <InputLabel>Start month</InputLabel>
              <Select
                value={startMonthYear}
                label="Start month"
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
              <InputLabel>End month</InputLabel>
              <Select
                value={endMonthYear}
                label="End month"
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
              key={`${startMonthYear}-${endMonthYear}-${showInvoice ? 'inv' : 'so'}`}
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
