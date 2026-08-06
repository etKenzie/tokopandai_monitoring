'use client';

import { SalesSummaryMonthlyResponse, fetchSalesSummaryMonthly } from '@/app/api/distribusi/DistribusiSlice';
import {
  Box,
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
import { useCallback, useEffect, useMemo, useState } from 'react';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface SalesMonthlyChartProps {
  filters: {
    agent: string;
    area: string;
    segment?: string;
    business_type?: string;
    month?: string;
    year?: string;
    status_payment?: string;
  };
  monthlyData?: any[];
  profitGoals?: Record<string, number>;
}

type ChartType = 'amounts' | 'counts' | 'days' | 'margin' | 'avg_profit';

const SERIES_COLORS: Record<string, string> = {
  'Total Invoice': '#2563EB',
  'Total Profit': '#16A34A',
  'Profit Goal': '#DC2626',
  'Invoice Count': '#2563EB',
  'Average Payment Days': '#D97706',
  Margin: '#D97706',
  'Average Daily Profit': '#16A34A',
  'Average Weekly Profit': '#2563EB',
};

const SalesMonthlyChart = ({ filters, monthlyData, profitGoals }: SalesMonthlyChartProps) => {
  const theme = useTheme();
  const [chartData, setChartData] = useState<SalesSummaryMonthlyResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [chartType, setChartType] = useState<ChartType>('amounts');
  const [startMonthYear, setStartMonthYear] = useState<string>('');
  const [endMonthYear, setEndMonthYear] = useState<string>('');
  const [isManuallySet, setIsManuallySet] = useState(false);
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
    if (
      filters.month ||
      filters.year ||
      filters.agent ||
      filters.area ||
      filters.segment ||
      filters.business_type ||
      filters.status_payment
    ) {
      setIsManuallySet(false);
    }
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
      const selectedMonthYear = `${monthName} ${filters.year}`;

      setEndMonthYear(selectedMonthYear);

      let startYearNum = parseInt(filters.year);
      let startMonthNum = parseInt(filters.month) - 3;

      if (startMonthNum < 1) {
        startYearNum = startYearNum - 1;
        startMonthNum = 12 + startMonthNum;
      }

      const startMonthName = monthNames[startMonthNum - 1];
      setStartMonthYear(`${startMonthName} ${startYearNum}`);
    } else {
      const currentDate = new Date();
      const currentMonth = currentDate.toLocaleString('en-US', { month: 'long' });
      const currentYear = currentDate.getFullYear();
      setEndMonthYear(`${currentMonth} ${currentYear}`);

      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 3, 1);
      const startMonth = startDate.toLocaleString('en-US', { month: 'long' });
      const startYear = startDate.getFullYear();
      setStartMonthYear(`${startMonth} ${startYear}`);
    }
  };

  const fetchChartData = useCallback(async () => {
    if (!startMonthYear || !endMonthYear) return;

    setLoading(true);
    try {
      const response = await fetchSalesSummaryMonthly({
        start_month: startMonthYear,
        end_month: endMonthYear,
        agent_name: filters.agent || undefined,
        area: filters.area || undefined,
        segment: filters.segment || undefined,
        business_type: filters.business_type || undefined,
        status_payment: filters.status_payment || undefined,
      });
      setChartData(response);
    } catch (error) {
      console.error('Failed to fetch chart data:', error);
    } finally {
      setLoading(false);
    }
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
    if (startMonthYear && endMonthYear) {
      fetchChartData();
    }
  }, [startMonthYear, endMonthYear]);

  useEffect(() => {
    if (
      filters.agent ||
      filters.area ||
      filters.segment ||
      filters.business_type ||
      filters.status_payment
    ) {
      fetchChartData();
    }
  }, [
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
    setIsManuallySet(true);
  };

  const handleEndMonthYearChange = (event: SelectChangeEvent<string>) => {
    setEndMonthYear(event.target.value);
    setIsManuallySet(true);
  };

  const formatValue = (value: number, type: ChartType) => {
    if (type === 'amounts' || type === 'avg_profit') {
      return `IDR ${Number(value).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
    }
    if (type === 'days') {
      return `${value.toFixed(1)} days`;
    }
    if (type === 'margin') {
      return `${value.toFixed(1)}%`;
    }
    return value.toLocaleString('en-US');
  };

  const prepareChartData = () => {
    const dataToUse = isManuallySet
      ? chartData?.data
      : monthlyData && monthlyData.length > 0
        ? monthlyData
        : chartData?.data;

    if (!dataToUse || !Array.isArray(dataToUse) || dataToUse.length === 0) {
      return { categories: [], series: [] as Array<{ name: string; data: number[]; type?: string }> };
    }

    const sortedData = [...dataToUse].sort((a, b) => {
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
    let series: Array<{ name: string; data: number[]; type?: string }> = [];

    if (chartType === 'amounts') {
      series = [
        { name: 'Total Invoice', data: sortedData.map((item) => item.total_invoice || 0) },
        { name: 'Total Profit', data: sortedData.map((item) => item.total_profit || 0) },
      ];
      if (profitGoals) {
        series.push({
          name: 'Profit Goal',
          data: sortedData.map((item) => profitGoals[item.month] || 0),
          type: 'line',
        });
      }
    } else if (chartType === 'counts') {
      series = [
        { name: 'Invoice Count', data: sortedData.map((item) => item.invoice_count || 0) },
      ];
    } else if (chartType === 'days') {
      series = [
        {
          name: 'Average Payment Days',
          data: sortedData.map((item) => item.avg_payment_days || 0),
        },
      ];
    } else if (chartType === 'margin') {
      series = [{ name: 'Margin', data: sortedData.map((item) => item.margin || 0) }];
    } else if (chartType === 'avg_profit') {
      series = [
        {
          name: 'Average Daily Profit',
          data: sortedData.map((item) => item.average_profit_day || 0),
        },
        {
          name: 'Average Weekly Profit',
          data: sortedData.map((item) => item.average_profit_week || 0),
        },
      ];
    }

    return { categories, series };
  };

  const chartDataConfig = useMemo(
    () => prepareChartData(),
    [chartData, monthlyData, chartType, isManuallySet, profitGoals],
  );

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

  const chartTypeLabel =
    chartType === 'amounts'
      ? 'Invoice and profit amounts'
      : chartType === 'counts'
        ? 'Invoice counts'
        : chartType === 'days'
          ? 'Average payment days'
          : chartType === 'margin'
            ? 'Margin percentage'
            : 'Average daily and weekly profit';

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
              Sales Monthly Trend
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              {chartTypeLabel}
              {startMonthYear && endMonthYear ? ` · ${startMonthYear} – ${endMonthYear}` : ''}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Chart Type</InputLabel>
              <Select value={chartType} label="Chart Type" onChange={handleChartTypeChange}>
                <MenuItem value="amounts">Amounts</MenuItem>
                <MenuItem value="counts">Invoice Count</MenuItem>
                <MenuItem value="days">Payment Days</MenuItem>
                <MenuItem value="margin">Margin</MenuItem>
                <MenuItem value="avg_profit">Average Profit Trends</MenuItem>
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

export default SalesMonthlyChart;
