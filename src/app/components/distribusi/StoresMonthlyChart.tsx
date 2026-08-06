'use client';

import { TotalStoresMonthlyResponse, fetchTotalStoresMonthly } from '@/app/api/distribusi/DistribusiSlice';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface StoresMonthlyChartProps {
  filters: {
    agent: string;
    area: string;
    segment?: string;
    business_type?: string;
    month?: string;
    year?: string;
    status_payment?: string;
  };
  onViewAllStores?: () => void;
}

type ChartType = 'stores' | 'activation';

const SERIES_COLORS: Record<string, string> = {
  'Active Stores': '#16A34A',
  'Total Stores': '#2563EB',
  'Activation Rate': '#D97706',
};

const StoresMonthlyChart = ({ filters, onViewAllStores }: StoresMonthlyChartProps) => {
  const theme = useTheme();
  const [chartData, setChartData] = useState<TotalStoresMonthlyResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [chartType, setChartType] = useState<ChartType>('stores');
  const [startMonthYear, setStartMonthYear] = useState<string>('');
  const [endMonthYear, setEndMonthYear] = useState<string>('');
  const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(() => new Set());

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

    return options.reverse();
  };

  const monthYearOptions = generateMonthYearOptions();

  useEffect(() => {
    updateMonthRange();
  }, []);

  useEffect(() => {
    updateMonthRange();
  }, [
    filters.month,
    filters.year,
    filters.agent,
    filters.area,
    filters.segment,
    filters.business_type,
    filters.status_payment,
  ]);

  const updateMonthRange = () => {
    if (filters.month && filters.year) {
      const monthNames = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ];
      const monthName = monthNames[parseInt(filters.month) - 1];
      setEndMonthYear(`${monthName} ${filters.year}`);

      let startYearNum = parseInt(filters.year);
      let startMonthNum = parseInt(filters.month) - 3;

      if (startMonthNum < 1) {
        startYearNum = startYearNum - 1;
        startMonthNum = 12 + startMonthNum;
      }

      setStartMonthYear(`${monthNames[startMonthNum - 1]} ${startYearNum}`);
    } else {
      const currentDate = new Date();
      const currentMonth = currentDate.toLocaleString('en-US', { month: 'long' });
      const currentYear = currentDate.getFullYear();
      setEndMonthYear(`${currentMonth} ${currentYear}`);

      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 3, 1);
      const startMonth = startDate.toLocaleString('en-US', { month: 'long' });
      setStartMonthYear(`${startMonth} ${startDate.getFullYear()}`);
    }
  };

  const filtersRef = useRef(filters);
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  const monthRangeRef = useRef({ startMonthYear, endMonthYear });
  useEffect(() => {
    monthRangeRef.current = { startMonthYear, endMonthYear };
  }, [startMonthYear, endMonthYear]);

  const fetchChartData = async (signal?: AbortSignal) => {
    const currentFilters = filtersRef.current;
    const currentMonthRange = monthRangeRef.current;

    if (!currentMonthRange.startMonthYear || !currentMonthRange.endMonthYear) return;

    setLoading(true);
    try {
      const response = await fetchTotalStoresMonthly(
        {
          start_month: currentMonthRange.startMonthYear,
          end_month: currentMonthRange.endMonthYear,
          agent_name: currentFilters.agent || undefined,
          area: currentFilters.area || undefined,
          segment: currentFilters.segment || undefined,
          business_type: currentFilters.business_type || undefined,
          status_payment: currentFilters.status_payment || undefined,
        },
        signal,
      );

      if (signal?.aborted) return;
      setChartData(response);
    } catch (error: any) {
      if (error?.name === 'AbortError' || signal?.aborted) return;
      console.error('Failed to fetch stores chart data:', error);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  };

  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!startMonthYear || !endMonthYear) return;

    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    debounceTimeoutRef.current = setTimeout(() => {
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      fetchChartData(abortController.signal).finally(() => {
        if (abortControllerRef.current === abortController) {
          abortControllerRef.current = null;
        }
      });
    }, 300);

    return () => {
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [
    startMonthYear,
    endMonthYear,
    filters.agent,
    filters.area,
    filters.segment,
    filters.business_type,
    filters.status_payment,
  ]);

  useEffect(() => {
    setHiddenSeries(new Set());
  }, [chartType]);

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
    if (type === 'activation') return `${value.toFixed(1)}%`;
    return value.toLocaleString('en-US');
  };

  const prepareChartData = () => {
    if (!chartData?.data || !Array.isArray(chartData.data) || chartData.data.length === 0) {
      return { categories: [], series: [] as Array<{ name: string; data: number[] }> };
    }

    const sortedData = [...chartData.data].sort((a, b) => {
      const monthNames = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ];

      const [monthA, yearA] = a.month.split(' ');
      const [monthB, yearB] = b.month.split(' ');
      if (!monthA || !yearA || !monthB || !yearB) return 0;

      const yearDiff = parseInt(yearA) - parseInt(yearB);
      if (yearDiff !== 0) return yearDiff;
      return monthNames.indexOf(monthA) - monthNames.indexOf(monthB);
    });

    const categories = sortedData.map((item) => item.month);
    let series: Array<{ name: string; data: number[] }> = [];

    if (chartType === 'stores') {
      series = [
        { name: 'Active Stores', data: sortedData.map((item) => item.active_stores || 0) },
        { name: 'Total Stores', data: sortedData.map((item) => item.total_stores || 0) },
      ];
    } else {
      series = [
        {
          name: 'Activation Rate',
          data: sortedData.map((item) => item.activation_rate || 0),
        },
      ];
    }

    return { categories, series };
  };

  const chartDataConfig = useMemo(() => prepareChartData(), [chartData, chartType]);
  const legendItems = chartDataConfig.series.map((s) => ({
    name: s.name,
    color: SERIES_COLORS[s.name] || '#2563EB',
  }));
  const visibleSeries = chartDataConfig.series.filter((s) => !hiddenSeries.has(s.name));
  const colors = visibleSeries.map((s) => SERIES_COLORS[s.name] || '#2563EB');
  const shouldRenderChart =
    chartDataConfig.categories.length > 0 && visibleSeries.length > 0;

  const toggleSeries = useCallback(
    (name: string) => {
      setHiddenSeries((prev) => {
        const isHidden = prev.has(name);
        if (!isHidden) {
          const visibleCount = chartDataConfig.series.filter((item) => !prev.has(item.name))
            .length;
          if (visibleCount <= 1) return prev;
        }
        const next = new Set(prev);
        if (isHidden) next.delete(name);
        else next.add(name);
        return next;
      });
    },
    [chartDataConfig.series],
  );

  const chartOptions: ApexCharts.ApexOptions = useMemo(
    () => ({
      chart: {
        type: 'line',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        foreColor: theme.palette.mode === 'dark' ? '#adb0bb' : '#5e5873',
        toolbar: { show: false },
        zoom: { enabled: false },
        animations: { enabled: false },
      },
      colors,
      stroke: {
        curve: 'smooth',
        width: 2.5,
      },
      markers: {
        size: 3.5,
        hover: { sizeOffset: 2 },
      },
      dataLabels: { enabled: false },
      legend: { show: false },
      grid: {
        borderColor: theme.palette.divider,
        strokeDashArray: 4,
      },
      xaxis: {
        categories: chartDataConfig.categories,
        labels: { style: { fontSize: '12px' } },
      },
      yaxis: {
        labels: {
          formatter: (value: number) => formatValue(value, chartType),
          style: { fontSize: '12px' },
        },
      },
      tooltip: {
        shared: true,
        intersect: false,
        followCursor: true,
        y: {
          formatter: (value: number) => formatValue(value, chartType),
        },
      },
      noData: {
        text: 'No data for this range',
      },
    }),
    [theme, colors, chartDataConfig.categories, chartType],
  );

  return (
    <Card
      sx={(t) => ({
        border: '1px solid',
        borderColor: t.palette.mode === 'dark' ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.12)',
        boxShadow: t.palette.mode === 'dark' ? 'none' : '0 1px 4px rgba(0, 0, 0, 0.06)',
      })}
    >
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2,
            mb: 1.5,
          }}
        >
          <Box>
            <Typography
              variant="subtitle1"
              fontWeight={700}
              sx={{
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                color: 'text.primary',
              }}
            >
              Stores Monthly Trend
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              {chartType === 'stores' ? 'Active and total stores' : 'Activation rate'}
              {startMonthYear && endMonthYear ? ` · ${startMonthYear} – ${endMonthYear}` : ''}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            {onViewAllStores && (
              <Button variant="outlined" size="small" onClick={onViewAllStores}>
                View All Stores
              </Button>
            )}
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Chart Type</InputLabel>
              <Select value={chartType} label="Chart Type" onChange={handleChartTypeChange}>
                <MenuItem value="stores">Stores</MenuItem>
                <MenuItem value="activation">Activation Rate</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 150 }}>
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
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>End Month</InputLabel>
              <Select value={endMonthYear} label="End Month" onChange={handleEndMonthYearChange}>
                {monthYearOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" height={360}>
            <CircularProgress />
          </Box>
        ) : shouldRenderChart ? (
          <ReactApexChart
            key={`${startMonthYear}-${endMonthYear}-${chartType}-${visibleSeries
              .map((s) => s.name)
              .join('-')}`}
            options={chartOptions}
            series={visibleSeries}
            type="line"
            height={360}
          />
        ) : (
          <Box display="flex" justifyContent="center" alignItems="center" height={360}>
            <Typography color="text.secondary">
              No data available for the selected month range
            </Typography>
          </Box>
        )}

        {legendItems.length > 0 && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: 2,
              mt: 1,
            }}
          >
            {legendItems.map((item) => {
              const isHidden = hiddenSeries.has(item.name);
              return (
                <Box
                  key={item.name}
                  component="button"
                  type="button"
                  onClick={() => toggleSeries(item.name)}
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.75,
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    opacity: isHidden ? 0.4 : 1,
                    p: 0.25,
                    color: 'text.secondary',
                    fontFamily: 'inherit',
                  }}
                >
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      bgcolor: item.color,
                      flexShrink: 0,
                    }}
                  />
                  <Typography
                    variant="body2"
                    fontWeight={600}
                    sx={{ textDecoration: isHidden ? 'line-through' : 'none' }}
                  >
                    {item.name}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default StoresMonthlyChart;
