'use client';

import {
  fetchPriceTracking,
  PriceHistoryEntry,
  ProductPriceTracking,
} from '@/app/api/wms/PurchasingSlice';
import { formatDateUtc } from '@/utils/formatDate';
import { Close as CloseIcon } from '@mui/icons-material';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useState } from 'react';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

type RangePreset = '3m' | '6m' | '1y';

const RANGE_LABELS: Record<RangePreset, string> = {
  '3m': '3 Months',
  '6m': '6 Months',
  '1y': '1 Year',
};

const escapeHtml = (value: string): string =>
  value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      default: return '&#39;';
    }
  });

interface ProductPriceTrackingModalProps {
  open: boolean;
  onClose: () => void;
  productId: string | null;
  productName?: string;
  sku?: string;
  unitCode?: string;
}

const formatDateParam = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getRangeDates = (preset: RangePreset): { startDate: string; endDate: string } => {
  const end = new Date();
  const start = new Date(end);
  if (preset === '3m') start.setMonth(start.getMonth() - 3);
  if (preset === '6m') start.setMonth(start.getMonth() - 6);
  if (preset === '1y') start.setFullYear(start.getFullYear() - 1);
  return { startDate: formatDateParam(start), endDate: formatDateParam(end) };
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const formatNumber = (value: number) => Math.round(value).toLocaleString('id-ID');

const ProductPriceTrackingModal = ({
  open,
  onClose,
  productId,
  productName,
  sku,
  unitCode,
}: ProductPriceTrackingModalProps) => {
  const [preset, setPreset] = useState<RangePreset>('6m');
  const [product, setProduct] = useState<ProductPriceTracking | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const loadData = useCallback(async () => {
    if (!open || !productId) return;

    setLoading(true);
    setError(null);
    try {
      const { startDate, endDate } = getRangeDates(preset);
      const response = await fetchPriceTracking({ startDate, endDate, productId });
      setProduct(response.data?.[0] ?? null);
      setPage(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch price tracking');
      setProduct(null);
      console.error('Failed to fetch price tracking:', err);
    } finally {
      setLoading(false);
    }
  }, [open, productId, preset]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!open) {
      setProduct(null);
      setError(null);
      setPage(0);
    }
  }, [open]);

  const history = useMemo(() => {
    const entries = product?.history ?? [];
    return [...entries].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
  }, [product]);

  const historyNewestFirst = useMemo(() => [...history].reverse(), [history]);

  const displaySku = product?.sku ?? sku;
  const displayUnitCode = product?.unitCode ?? unitCode;

  const stats = useMemo(() => {
    if (history.length === 0) return null;

    const prices = history.map((entry) => entry.unitPrice);
    const totalQty = history.reduce((sum, entry) => sum + (entry.qty || 0), 0);
    const spend = history.reduce(
      (sum, entry) => sum + (entry.unitPrice || 0) * (entry.qty || 0),
      0,
    );

    return {
      latest: history[history.length - 1].unitPrice,
      lowest: Math.min(...prices),
      highest: Math.max(...prices),
      // Weighted by quantity so large POs count more than small top-up buys.
      weightedAvg: totalQty > 0 ? spend / totalQty : 0,
      spend,
      totalQty,
      poCount: history.length,
      supplierCount: new Set(history.map((entry) => entry.supplierId)).size,
    };
  }, [history]);

  // A single line for the product: every purchase is the same item regardless of
  // supplier, so the trend is one price over time. Supplier is shown in the tooltip.
  const series = useMemo(
    () => [
      {
        name: 'Unit Price',
        data: history.map((entry) => ({
          x: new Date(entry.date).getTime(),
          y: entry.unitPrice,
        })),
      },
    ],
    [history],
  );

  const chartOptions = useMemo(
    () => ({
      chart: {
        type: 'line' as const,
        height: 360,
        toolbar: { show: false },
        zoom: { enabled: false },
      },
      stroke: { curve: 'straight' as const, width: 3 },
      xaxis: {
        type: 'datetime' as const,
        labels: { style: { fontSize: '12px' }, datetimeUTC: true },
      },
      yaxis: {
        labels: { formatter: (value: number) => formatCurrency(value) },
      },
      tooltip: {
        custom: ({ dataPointIndex }: { dataPointIndex: number }) => {
          const entry = history[dataPointIndex];
          if (!entry) return '';
          return `
            <div style="padding:8px 12px;font-size:12px;line-height:1.6">
              <div style="font-weight:700">${formatCurrency(entry.unitPrice)}</div>
              <div>${formatDateUtc(entry.date)}</div>
              <div>${escapeHtml(entry.supplierName?.trim() || 'Unknown supplier')}</div>
              <div style="opacity:0.7">${escapeHtml(entry.poNumber)} • Qty ${formatNumber(entry.qty)}${displayUnitCode ? ` ${escapeHtml(displayUnitCode)}` : ''}</div>
            </div>
          `;
        },
      },
      colors: ['#3B82F6'],
      grid: { borderColor: '#E5E7EB', strokeDashArray: 4 },
      markers: { size: 5, strokeColors: '#FFFFFF', strokeWidth: 2 },
      legend: { show: false },
    }),
    [history, displayUnitCode],
  );

  const renderStat = (label: string, value: string, color?: string) => (
    <Grid key={label} size={{ xs: 6, sm: 3 }}>
      <Box sx={{ textAlign: 'center' }}>
        <Typography
          variant="h5"
          fontWeight="bold"
          color={color}
          mb={0.5}
          sx={{ wordBreak: 'break-word' }}
        >
          {value}
        </Typography>
        <Typography variant="body2" color="textSecondary" fontWeight={500}>
          {label}
        </Typography>
      </Box>
    </Grid>
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={2}>
          <Box>
            <Typography variant="h5" component="div">
              {product?.productName ?? productName ?? 'Product'}
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1} alignItems="center" mt={1}>
              {displaySku && (
                <Chip label={`SKU: ${displaySku}`} size="small" variant="outlined" color="primary" />
              )}
              {displayUnitCode && (
                <Chip label={`Unit: ${displayUnitCode}`} size="small" variant="outlined" />
              )}
              {product?.categoryName && (
                <Chip label={product.categoryName} size="small" variant="outlined" color="secondary" />
              )}
            </Box>
          </Box>
          <Button onClick={onClose} startIcon={<CloseIcon />} variant="outlined" size="small">
            Close
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ mb: 3 }}>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={preset}
            onChange={(_, value) => value && setPreset(value as RangePreset)}
          >
            {(Object.keys(RANGE_LABELS) as RangePreset[]).map((key) => (
              <ToggleButton key={key} value={key}>
                {RANGE_LABELS[key]}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error" sx={{ py: 4 }} align="center">
            {error}
          </Typography>
        ) : history.length === 0 ? (
          <Typography color="textSecondary" sx={{ py: 6 }} align="center">
            No purchase history in this period
          </Typography>
        ) : (
          <>
            {stats && (
              <Grid container spacing={3} rowSpacing={3} sx={{ mb: 3 }}>
                {renderStat('Latest Price', formatCurrency(stats.latest), 'primary.main')}
                {renderStat('Lowest', formatCurrency(stats.lowest), 'success.main')}
                {renderStat('Highest', formatCurrency(stats.highest), 'error.main')}
                {renderStat('Avg (by qty)', formatCurrency(stats.weightedAvg), 'info.main')}
                {renderStat('Total Spend', formatCurrency(stats.spend))}
                {renderStat('Total Qty', displayUnitCode ? `${formatNumber(stats.totalQty)} ${displayUnitCode}` : formatNumber(stats.totalQty))}
                {renderStat('POs', formatNumber(stats.poCount))}
                {renderStat('Suppliers', formatNumber(stats.supplierCount))}
              </Grid>
            )}

            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" mb={1}>
                Price Trend
              </Typography>
              <ReactApexChart
                options={chartOptions}
                series={series}
                type="line"
                height={360}
              />
            </Box>

            <Typography variant="h6" mb={1}>
              Purchase History
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>PO Number</TableCell>
                    <TableCell>Supplier</TableCell>
                    <TableCell align="right">Unit Price</TableCell>
                    <TableCell align="right">
                      Qty{displayUnitCode ? ` (${displayUnitCode})` : ''}
                    </TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {historyNewestFirst
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((entry: PriceHistoryEntry) => (
                    <TableRow key={`${entry.poNumber}-${entry.date}`} hover>
                      <TableCell>{formatDateUtc(entry.date)}</TableCell>
                      <TableCell>
                        <Chip
                          label={entry.poNumber}
                          size="small"
                          variant="outlined"
                          color="primary"
                        />
                      </TableCell>
                      <TableCell>{entry.supplierName?.trim() || '-'}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        {formatCurrency(entry.unitPrice)}
                      </TableCell>
                      <TableCell align="right">
                        {formatNumber(entry.qty)}
                        {displayUnitCode ? ` ${displayUnitCode}` : ''}
                      </TableCell>
                      <TableCell align="right">
                        {formatCurrency((entry.unitPrice || 0) * (entry.qty || 0))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={historyNewestFirst.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
              />
            </TableContainer>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProductPriceTrackingModal;
