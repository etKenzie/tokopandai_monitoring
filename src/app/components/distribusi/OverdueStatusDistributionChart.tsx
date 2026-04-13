'use client';

import type { Order } from '@/app/api/distribusi/DistribusiSlice';
import {
  colorForOverdueBucket,
  compareOverdueBuckets,
  resolveOverdueStatus,
} from '@/utils/overdueStatus';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Typography,
} from '@mui/material';
import dynamic from 'next/dynamic';
import { useCallback, useMemo, useState } from 'react';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

type MetricKey = 'profit' | 'invoice' | 'orders' | 'unique_stores';

const METRIC_OPTIONS: { value: MetricKey; label: string }[] = [
  { value: 'profit', label: 'Profit' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'orders', label: 'Orders' },
  { value: 'unique_stores', label: 'Unique stores' },
];

interface BucketStats {
  total_invoice: number;
  total_profit: number;
  order_count: number;
  unique_stores: number;
}

function emptyBucket(): BucketStats {
  return {
    total_invoice: 0,
    total_profit: 0,
    order_count: 0,
    unique_stores: 0,
  };
}

function aggregateByBucket(orders: Order[]): Map<string, BucketStats> {
  const map = new Map<string, BucketStats>();
  const storeIdsByBucket = new Map<string, Set<string>>();

  for (const o of orders) {
    const status = resolveOverdueStatus(o);
    if (!status) continue;

    if (!map.has(status)) {
      map.set(status, emptyBucket());
    }
    const row = map.get(status)!;
    row.total_invoice += Number(o.total_invoice) || 0;
    row.total_profit += Number(o.profit) || 0;
    row.order_count += 1;

    let stores = storeIdsByBucket.get(status);
    if (!stores) {
      stores = new Set();
      storeIdsByBucket.set(status, stores);
    }
    if (o.user_id) stores.add(o.user_id);
  }

  Array.from(map.keys()).forEach((key) => {
    const set = storeIdsByBucket.get(key);
    const row = map.get(key)!;
    row.unique_stores = set?.size ?? 0;
  });

  return map;
}

function metricValue(stats: BucketStats, key: MetricKey): number {
  switch (key) {
    case 'profit':
      return stats.total_profit;
    case 'invoice':
      return stats.total_invoice;
    case 'orders':
      return stats.order_count;
    case 'unique_stores':
      return stats.unique_stores;
    default:
      return 0;
  }
}

interface OverdueStatusDistributionChartProps {
  orders: Order[];
  loading?: boolean;
}

const OverdueStatusDistributionChart = ({
  orders,
  loading = false,
}: OverdueStatusDistributionChartProps) => {
  const [metric, setMetric] = useState<MetricKey>('invoice');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogBucket, setDialogBucket] = useState<string | null>(null);
  const [dialogFocusMetric, setDialogFocusMetric] = useState<MetricKey>('invoice');

  const byBucket = useMemo(() => aggregateByBucket(orders), [orders]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const o of orders) {
      const s = resolveOverdueStatus(o);
      if (s) set.add(s);
    }
    return Array.from(set).sort(compareOverdueBuckets);
  }, [orders]);

  const seriesValues = useMemo(
    () =>
      categories.map((c) => {
        const s = byBucket.get(c) ?? emptyBucket();
        return metricValue(s, metric);
      }),
    [byBucket, categories, metric]
  );

  const totalMetricSum = useMemo(
    () => seriesValues.reduce((a, b) => a + b, 0),
    [seriesValues]
  );

  const dialogStats = useMemo(() => {
    if (!dialogBucket) return null;
    return byBucket.get(dialogBucket) ?? emptyBucket();
  }, [byBucket, dialogBucket]);

  const formatCurrency = useCallback((value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }, []);

  const formatNumber = useCallback((value: number) => {
    return new Intl.NumberFormat('id-ID').format(value);
  }, []);

  const openBucketDialog = useCallback((bucket: string) => {
    setDialogBucket(bucket);
    setDialogFocusMetric(metric);
    setDialogOpen(true);
  }, [metric]);

  const chartOptions = useMemo(() => {
    const currencyMetric = metric === 'profit' || metric === 'invoice';
    const yFormatter = (value: number) =>
      currencyMetric ? formatCurrency(value) : formatNumber(value);

    return {
      chart: {
        type: 'bar' as const,
        height: 400,
        toolbar: {
          show: true,
          tools: {
            download: true,
            selection: false,
            zoom: false,
            zoomin: false,
            zoomout: false,
            pan: false,
            reset: false,
          },
        },
        events: {
          click: (_event: unknown, _chartContext: unknown, opts?: { dataPointIndex?: number }) => {
            const i = typeof opts?.dataPointIndex === 'number' ? opts.dataPointIndex : -1;
            if (i < 0 || i >= categories.length) return;
            openBucketDialog(categories[i]!);
          },
        },
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '55%',
          endingShape: 'rounded' as const,
          borderRadius: 4,
          distributed: true,
        },
      },
      dataLabels: { enabled: false },
      stroke: {
        show: true,
        width: 2,
        colors: ['transparent'],
      },
      xaxis: {
        categories,
        labels: {
          style: { fontSize: '12px' },
          rotate: -35,
          rotateAlways: false,
        },
      },
      yaxis: {
        title: {
          text:
            metric === 'profit'
              ? 'Profit (IDR)'
              : metric === 'invoice'
                ? 'Invoice (IDR)'
                : metric === 'orders'
                  ? 'Orders'
                  : 'Unique stores',
          style: { fontSize: '14px', fontWeight: 600 },
        },
        labels: { formatter: (value: number) => yFormatter(value) },
      },
      tooltip: {
        y: {
          formatter: (value: number | string) => {
            const n = typeof value === 'number' ? value : Number(value);
            const pct =
              totalMetricSum > 0 && Number.isFinite(n)
                ? (n / totalMetricSum) * 100
                : 0;
            const pctStr = `${pct.toFixed(1)}%`;
            return `${yFormatter(n)} (${pctStr} of total)`;
          },
          title: {
            formatter: () =>
              METRIC_OPTIONS.find((m) => m.value === metric)?.label + ': ',
          },
        },
      },
      colors: categories.map((c) => colorForOverdueBucket(c)),
      legend: { show: false },
      grid: { borderColor: '#f1f1f1' },
    };
  }, [
    categories,
    formatCurrency,
    formatNumber,
    metric,
    openBucketDialog,
    totalMetricSum,
  ]);

  const series = [{ name: METRIC_OPTIONS.find((m) => m.value === metric)?.label ?? '', data: seriesValues }];

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Distribution by overdue status
          </Typography>
          <Box display="flex" justifyContent="center" alignItems="center" height={400}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (!orders.length) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Distribution by overdue status
          </Typography>
          <Box display="flex" justifyContent="center" alignItems="center" height={320}>
            <Typography color="textSecondary">
              No overdue orders for the current filters. Adjust dates or agent to see the chart.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (categories.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Distribution by overdue status
          </Typography>
          <Box display="flex" justifyContent="center" alignItems="center" height={320}>
            <Typography color="textSecondary">
              No overdue status values on these orders. The list uses the overdue_status field from
              the API when present.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 2,
              mb: 2,
            }}
          >
            <Typography variant="h6">Distribution by overdue status</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', minHeight: 40, px: 1 }}>
                <Typography variant="body2" color="textSecondary" sx={{ mr: 1 }}>
                  Group by
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  Overdue status
                </Typography>
              </Box>
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel>Metrics</InputLabel>
                <Select
                  value={metric}
                  label="Metrics"
                  onChange={(e) => setMetric(e.target.value as MetricKey)}
                >
                  {METRIC_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>

          <Typography variant="body2" color="textSecondary" mb={2}>
            Reflects the same filtered rows as below (segment, area, agent, payment, overdue status,
            search). Buckets use overdue status from the API when set; otherwise a due-date fallback.
            Click a bar for invoice, profit, orders, and unique stores in that bucket.
          </Typography>

          <ReactApexChart options={chartOptions} series={series} type="bar" height={400} />

          <Box mt={2}>
            <Typography variant="subtitle2" gutterBottom>
              Summary
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Total orders: {formatNumber(orders.length)} | Total invoice:{' '}
              {formatCurrency(
                orders.reduce((s, o) => s + (Number(o.total_invoice) || 0), 0)
              )}{' '}
              | Total profit:{' '}
              {formatCurrency(orders.reduce((s, o) => s + (Number(o.profit) || 0), 0))}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Bucket: <strong>{dialogBucket}</strong>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Select a metric to highlight. All figures below are for this overdue bucket only.
          </Typography>

          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Metric</InputLabel>
            <Select
              value={dialogFocusMetric}
              label="Metric"
              onChange={(e) => setDialogFocusMetric(e.target.value as MetricKey)}
            >
              {METRIC_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {dialogStats && (
            <Grid container spacing={2}>
              {METRIC_OPTIONS.map((opt) => {
                const v =
                  opt.value === 'profit' || opt.value === 'invoice'
                    ? formatCurrency(metricValue(dialogStats, opt.value))
                    : formatNumber(metricValue(dialogStats, opt.value));
                const emphasized = dialogFocusMetric === opt.value;
                return (
                  <Grid size={{ xs: 12, sm: 6 }} key={opt.value}>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2,
                        borderWidth: emphasized ? 2 : 1,
                        borderColor: emphasized ? 'primary.main' : 'divider',
                      }}
                    >
                      <Typography variant="caption" color="textSecondary">
                        {opt.label}
                      </Typography>
                      <Typography variant={emphasized ? 'h5' : 'h6'} fontWeight={emphasized ? 700 : 500}>
                        {v}
                      </Typography>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default OverdueStatusDistributionChart;
