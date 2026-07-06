'use client';

import { PrincipalOrder } from '@/app/api/distribusi/DistribusiSlice';
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
import { useMemo, useState } from 'react';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

type ChartType = 'totals' | 'counts' | 'margin';

interface PrincipalMonthlyTrendChartProps {
  orders: PrincipalOrder[];
  startDate?: string;
  endDate?: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function sortMonthsChronologically(a: string, b: string): number {
  if (a === 'Other') return -1;
  if (b === 'Other') return 1;
  const [monthA, yearA] = a.split(' ');
  const [monthB, yearB] = b.split(' ');
  if (!monthA || !yearA || !monthB || !yearB) return 0;
  const yearDiff = parseInt(yearA, 10) - parseInt(yearB, 10);
  if (yearDiff !== 0) return yearDiff;
  return MONTH_NAMES.indexOf(monthA) - MONTH_NAMES.indexOf(monthB);
}

function listMonthsInRange(startDate: string, endDate: string): string[] {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const months: string[] = [];
  const cur = new Date(start.getFullYear(), start.getMonth(), 1);
  const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);
  while (cur <= endMonth) {
    months.push(`${MONTH_NAMES[cur.getMonth()]} ${cur.getFullYear()}`);
    cur.setMonth(cur.getMonth() + 1);
  }
  return months;
}

const PrincipalMonthlyTrendChart = ({
  orders,
  startDate,
  endDate,
}: PrincipalMonthlyTrendChartProps) => {
  const [chartType, setChartType] = useState<ChartType>('totals');

  const monthlyData = useMemo(() => {
    const monthKeys =
      startDate && endDate
        ? listMonthsInRange(startDate, endDate)
        : Array.from(new Set(orders.map((o) => o.month))).sort(sortMonthsChronologically);
    const monthMap = new Map<
      string,
      {
        month: string;
        principal_invoice: number;
        principal_profit: number;
        order_count: number;
        store_ids: Set<string>;
        margin: number;
      }
    >();

    monthKeys.forEach((month) => {
      monthMap.set(month, {
        month,
        principal_invoice: 0,
        principal_profit: 0,
        order_count: 0,
        store_ids: new Set(),
        margin: 0,
      });
    });

    orders.forEach((order) => {
      const month = order.month;
      if (!monthMap.has(month)) {
        monthMap.set(month, {
          month,
          principal_invoice: 0,
          principal_profit: 0,
          order_count: 0,
          store_ids: new Set(),
          margin: 0,
        });
      }
      const row = monthMap.get(month)!;
      row.principal_invoice += order.principal_total_invoice || 0;
      row.principal_profit += order.principal_total_profit || 0;
      row.order_count += 1;
      row.store_ids.add(order.user_id);
    });

    return Array.from(monthMap.values())
      .map((item) => ({
        month: item.month,
        principal_invoice: item.principal_invoice,
        principal_profit: item.principal_profit,
        order_count: item.order_count,
        unique_stores: item.store_ids.size,
        margin:
          item.principal_invoice > 0
            ? (item.principal_profit / item.principal_invoice) * 100
            : 0,
      }))
      .sort((a, b) => sortMonthsChronologically(a.month, b.month));
  }, [orders, startDate, endDate]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  const formatPercentage = (value: number) => `${value.toFixed(2)}%`;

  const chartData = useMemo(() => {
    if (monthlyData.length === 0) {
      return { categories: [], series: [] as { name: string; data: number[] }[] };
    }

    const categories = monthlyData.map((item) => item.month);
    let series: { name: string; data: number[] }[] = [];

    switch (chartType) {
      case 'totals':
        series = [
          { name: 'Principal Invoice', data: monthlyData.map((item) => item.principal_invoice) },
          { name: 'Principal Profit', data: monthlyData.map((item) => item.principal_profit) },
        ];
        break;
      case 'counts':
        series = [
          { name: 'Orders', data: monthlyData.map((item) => item.order_count) },
          { name: 'Unique Stores', data: monthlyData.map((item) => item.unique_stores) },
        ];
        break;
      case 'margin':
        series = [{ name: 'Margin %', data: monthlyData.map((item) => item.margin) }];
        break;
    }

    return { categories, series };
  }, [monthlyData, chartType]);

  const chartOptions = useMemo(() => {
    const isMargin = chartType === 'margin';
    const isCounts = chartType === 'counts';

    const valueFormatter = (value: number) => {
      if (isMargin) return formatPercentage(value);
      if (isCounts) return String(Math.round(value));
      return formatCurrency(value);
    };

    const colors =
      chartType === 'margin'
        ? ['#F59E0B']
        : chartType === 'counts'
          ? ['#3B82F6', '#8B5CF6']
          : ['#3B82F6', '#10B981'];

    return {
      chart: {
        type: 'line' as const,
        height: 350,
        toolbar: { show: false },
      },
      stroke: {
        curve: 'smooth' as const,
        width: 3,
      },
      xaxis: {
        categories: chartData.categories,
        labels: { style: { fontSize: '12px' } },
      },
      yaxis: {
        labels: {
          formatter: valueFormatter,
        },
      },
      tooltip: {
        y: {
          formatter: valueFormatter,
        },
      },
      colors,
      grid: {
        borderColor: '#E5E7EB',
        strokeDashArray: 4,
      },
      markers: {
        size: 6,
        strokeColors: '#FFFFFF',
        strokeWidth: 2,
      },
      legend: {
        position: 'bottom' as const,
        horizontalAlign: 'center' as const,
      },
    };
  }, [chartData.categories, chartType]);

  const handleChartTypeChange = (event: SelectChangeEvent<ChartType>) => {
    setChartType(event.target.value as ChartType);
  };

  const hasAnyData = monthlyData.some(
    (m) => m.order_count > 0 || m.principal_invoice > 0
  );

  return (
    <Card sx={{ mb: 3 }}>
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
          <Typography variant="h6" sx={{ m: 0 }}>
            Monthly Trend
          </Typography>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Chart Type</InputLabel>
            <Select value={chartType} label="Chart Type" onChange={handleChartTypeChange}>
              <MenuItem value="totals">Invoice &amp; Profit</MenuItem>
              <MenuItem value="counts">Orders &amp; Stores</MenuItem>
              <MenuItem value="margin">Margin</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Box sx={{ height: 400, position: 'relative' }}>
          {chartData.categories.length > 0 && hasAnyData ? (
            <ReactApexChart
              options={chartOptions}
              series={chartData.series}
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
              <Typography color="textSecondary">No data available for chart</Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default PrincipalMonthlyTrendChart;
