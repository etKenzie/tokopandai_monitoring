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

type TrendView = 'all' | 'segment' | 'business_type';
type MetricView = 'unique_stores' | 'total_orders' | 'total_invoice';

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
  const [trendView, setTrendView] = useState<TrendView>('all');
  const [metricView, setMetricView] = useState<MetricView>('total_orders');

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

  const getMonthOrderValue = useCallback((monthYear: string) => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    const [month, year] = monthYear.split(' ');
    if (!month || !year) return Number.MAX_SAFE_INTEGER;
    const monthIndex = monthNames.indexOf(month);
    if (monthIndex < 0) return Number.MAX_SAFE_INTEGER;
    return parseInt(year, 10) * 100 + monthIndex;
  }, []);

  const sortedRows = useMemo(() => {
    const sourceRows =
      trendView === 'segment'
        ? chartData?.trend_by_segment
        : trendView === 'business_type'
          ? chartData?.trend_by_business_type
          : chartData?.data;

    if (!sourceRows?.length) return [];

    return [...sourceRows].sort((a, b) => {
      const monthOrderDiff = getMonthOrderValue(a.month) - getMonthOrderValue(b.month);
      if (monthOrderDiff !== 0) return monthOrderDiff;

      if (trendView === 'segment') {
        return (a.segment ?? '').localeCompare(b.segment ?? '');
      }
      if (trendView === 'business_type') {
        return (a.business_type ?? '').localeCompare(b.business_type ?? '');
      }
      return 0;
    });
  }, [chartData, getMonthOrderValue, trendView]);

  const chartDataConfig = useMemo(() => {
    if (!sortedRows.length) return { categories: [] as string[], series: [] as { name: string; data: number[] }[] };

    const metricLabel =
      metricView === 'unique_stores'
        ? 'Unique stores'
        : metricView === 'total_orders'
          ? 'Total orders'
          : 'Total invoice';
    const getMetricValue = (item: (typeof sortedRows)[number]) => {
      if (metricView === 'unique_stores') {
        return item.unique_stores ?? item.total_unique_stores ?? 0;
      }
      if (metricView === 'total_orders') {
        return item.total_orders ?? 0;
      }
      return item.total_invoice ?? 0;
    };

    if (trendView === 'all') {
      return {
        categories: sortedRows.map((item) => item.month),
        series: [
          {
            name: metricLabel,
            data: sortedRows.map((item) => getMetricValue(item)),
          },
        ],
      };
    }

    const months = Array.from(new Set(sortedRows.map((item) => item.month))).sort(
      (a, b) => getMonthOrderValue(a) - getMonthOrderValue(b)
    );
    const groupingKey = trendView === 'segment' ? 'segment' : 'business_type';
    const grouped = new Map<string, Map<string, number>>();

    sortedRows.forEach((item) => {
      const groupName = (item[groupingKey] ?? 'Unknown').toString();
      if (!grouped.has(groupName)) {
        grouped.set(groupName, new Map<string, number>());
      }
      grouped.get(groupName)!.set(item.month, getMetricValue(item));
    });

    return {
      categories: months,
      series: Array.from(grouped.entries()).map(([name, monthToValue]) => ({
        name,
        data: months.map((month) => monthToValue.get(month) ?? 0),
      })),
    };
  }, [sortedRows, metricView, trendView, getMonthOrderValue]);

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
            metricView === 'total_invoice' ? formatCurrency(value) : formatCount(value),
        },
      },
      tooltip: {
        y: {
          formatter: (value: number) =>
            metricView === 'total_invoice' ? formatCurrency(value) : formatCount(value),
        },
      },
      colors: ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6'],
      grid: { borderColor: '#E5E7EB', strokeDashArray: 4 },
      markers: { size: 6, strokeColors: '#FFFFFF', strokeWidth: 2 },
      legend: { position: 'bottom' as const, horizontalAlign: 'center' as const },
    }),
    [chartDataConfig, metricView]
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
            <FormControl size="small">
              <InputLabel>View by</InputLabel>
              <Select
                value={trendView}
                label="View by"
                onChange={(event: SelectChangeEvent<string>) =>
                  setTrendView(event.target.value as TrendView)
                }
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="segment">Segment</MenuItem>
                <MenuItem value="business_type">Business type</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small">
              <InputLabel>Metric</InputLabel>
              <Select
                value={metricView}
                label="Metric"
                onChange={(event: SelectChangeEvent<string>) =>
                  setMetricView(event.target.value as MetricView)
                }
              >
                <MenuItem value="unique_stores">Unique stores</MenuItem>
                <MenuItem value="total_orders">Total orders</MenuItem>
                <MenuItem value="total_invoice">Total invoice</MenuItem>
              </Select>
            </FormControl>
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
              key={`${startMonthYear}-${endMonthYear}-${trendView}-${metricView}`}
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
