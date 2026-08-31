"use client";

import {
  fetchPriceCompare,
  flattenPriceCompare,
  PriceChangeStatus,
  PriceCompareData,
  PriceCompareRow,
} from "@/app/api/wms/PurchasingSlice";
import ProtectedRoute from "@/app/components/auth/ProtectedRoute";
import PageContainer from "@/app/components/container/PageContainer";
import ProductPriceTrackingModal from "@/app/components/wms/ProductPriceTrackingModal";
import { getPageRoles } from "@/config/roles";
import {
  ArrowDownward,
  ArrowUpward,
  Download as DownloadIcon,
  FiberNew as FiberNewIcon,
  Refresh as RefreshIcon,
  Remove as RemoveIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  FormControl,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  TextField,
  Typography
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import * as XLSX from 'xlsx';

type SortDirection = 'asc' | 'desc';
type SortableField = keyof PriceCompareRow;
type StatusFilter = 'all' | PriceChangeStatus;

interface HeadCell {
  id: SortableField;
  label: string;
  numeric: boolean;
}

const STATUS_META: Record<
  PriceChangeStatus,
  { label: string; color: 'success' | 'error' | 'default' | 'info'; textColor: string }
> = {
  up: { label: 'Price Up', color: 'success', textColor: 'success.main' },
  down: { label: 'Price Down', color: 'error', textColor: 'error.main' },
  flat: { label: 'Flat', color: 'default', textColor: 'text.secondary' },
  new: { label: 'New', color: 'info', textColor: 'info.main' },
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** "2026-07" -> "July 2026" */
const monthLabel = (value: string): string => {
  const [year, month] = value.split('-');
  const index = parseInt(month, 10) - 1;
  return MONTH_NAMES[index] ? `${MONTH_NAMES[index]} ${year}` : value;
};

const generateMonthOptions = () => {
  const options: { value: string; label: string }[] = [];
  const now = new Date();

  for (let i = 0; i < 24; i += 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    options.push({ value, label: monthLabel(value) });
  }

  return options;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const formatNumber = (value: number) => Math.round(value).toLocaleString('id-ID');

const formatPercent = (value: number | null) => {
  if (value === null) return '—';
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
};

const PriceComparePage = () => {
  const monthOptions = useMemo(generateMonthOptions, []);

  const [data, setData] = useState<PriceCompareData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Empty until the effect runs, so server and client render the same markup.
  const [selectedMonthA, setSelectedMonthA] = useState('');
  const [selectedMonthB, setSelectedMonthB] = useState('');
  const [applied, setApplied] = useState<{ monthA: string; monthB: string } | null>(null);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [orderBy, setOrderBy] = useState<SortableField>('diffPct');
  const [order, setOrder] = useState<SortDirection>('desc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [selectedProduct, setSelectedProduct] = useState<PriceCompareRow | null>(null);

  useEffect(() => {
    const now = new Date();
    const current = new Date(now.getFullYear(), now.getMonth(), 1);
    const previous = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const toValue = (date: Date) =>
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    const monthA = toValue(previous);
    const monthB = toValue(current);

    setSelectedMonthA(monthA);
    setSelectedMonthB(monthB);
    setApplied({ monthA, monthB });
  }, []);

  const loadData = useCallback(async () => {
    if (!applied) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetchPriceCompare(applied.monthA, applied.monthB);
      setData(response.data ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch price comparison');
      setData(null);
      console.error('Failed to fetch price comparison:', err);
    } finally {
      setLoading(false);
    }
  }, [applied]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleApply = () => {
    if (!selectedMonthA || !selectedMonthB) return;
    setApplied({ monthA: selectedMonthA, monthB: selectedMonthB });
    setPage(0);
  };

  const clearAllFilters = () => {
    setStatusFilter('all');
    setSearchQuery('');
    setPage(0);
  };

  const allRows = useMemo(() => flattenPriceCompare(data), [data]);

  // Bucket totals for the summary cards. These sum unit prices, not spend, since
  // the compare endpoint has no quantities: for up/down it is the total of the
  // per-unit changes, and for flat/new the total of the month B prices.
  const bucketTotals = useMemo(() => {
    const totals: Record<PriceChangeStatus, number> = { up: 0, down: 0, flat: 0, new: 0 };

    allRows.forEach((row) => {
      if (row.status === 'up' || row.status === 'down') {
        totals[row.status] += row.diff ?? 0;
      } else {
        totals[row.status] += row.priceB || 0;
      }
    });

    return totals;
  }, [allRows]);

  const headCells: HeadCell[] = useMemo(
    () => [
      { id: 'productName', label: 'Product Name', numeric: false },
      { id: 'sku', label: 'SKU', numeric: false },
      { id: 'status', label: 'Status', numeric: false },
      { id: 'priceA', label: data ? monthLabel(data.monthA) : 'Month A', numeric: true },
      { id: 'priceB', label: data ? monthLabel(data.monthB) : 'Month B', numeric: true },
      { id: 'diff', label: 'Change', numeric: true },
      { id: 'diffPct', label: 'Change %', numeric: true },
    ],
    [data],
  );

  const filteredRows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return allRows.filter((row) => {
      if (statusFilter !== 'all' && row.status !== statusFilter) return false;
      if (!query) return true;
      return (
        row.productName.toLowerCase().includes(query) ||
        row.sku.toLowerCase().includes(query)
      );
    });
  }, [allRows, statusFilter, searchQuery]);

  const sortedRows = useMemo(() => {
    return [...filteredRows].sort((a, b) => {
      const aRaw = a[orderBy];
      const bRaw = b[orderBy];

      if (typeof aRaw === 'string' || typeof bRaw === 'string') {
        const result = String(aRaw ?? '').localeCompare(String(bRaw ?? ''));
        return order === 'asc' ? result : -result;
      }

      // Nulls (new products have no month A price) always sort last.
      if (aRaw === null && bRaw === null) return 0;
      if (aRaw === null) return 1;
      if (bRaw === null) return -1;

      return order === 'asc' ? Number(aRaw) - Number(bRaw) : Number(bRaw) - Number(aRaw);
    });
  }, [filteredRows, orderBy, order]);

  const paginatedRows = useMemo(
    () => sortedRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [sortedRows, page, rowsPerPage],
  );

  // Totals cover every filtered row, not just the current page.
  const tableTotals = useMemo(
    () =>
      filteredRows.reduce(
        (acc, row) => ({
          priceA: acc.priceA + (row.priceA ?? 0),
          priceB: acc.priceB + (row.priceB || 0),
          diff: acc.diff + (row.diff ?? 0),
        }),
        { priceA: 0, priceB: 0, diff: 0 },
      ),
    [filteredRows],
  );

  const handleRequestSort = (property: SortableField) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
    setPage(0);
  };

  const handleDownload = () => {
    const sheetData = sortedRows.map((row) => ({
      'Product Name': row.productName,
      SKU: row.sku,
      Status: STATUS_META[row.status].label,
      [data ? monthLabel(data.monthA) : 'Month A']: row.priceA ?? '',
      [data ? monthLabel(data.monthB) : 'Month B']: row.priceB,
      Change: row.diff ?? '',
      'Change %': row.diffPct ?? '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(sheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Price Compare');
    XLSX.writeFile(workbook, `price-compare-${applied?.monthA}-vs-${applied?.monthB}.xlsx`);
  };

  const summaryCards: {
    status: PriceChangeStatus;
    label: string;
    count: number;
    total: number;
    totalLabel: string;
    color: string;
    icon: React.ReactNode;
  }[] = [
    {
      status: 'up',
      label: 'Price Up',
      count: data?.summary.priceUp ?? 0,
      total: bucketTotals.up,
      totalLabel: 'Total increase',
      color: 'success.main',
      icon: <ArrowUpward sx={{ fontSize: 40, color: 'success.main' }} />,
    },
    {
      status: 'down',
      label: 'Price Down',
      count: data?.summary.priceDown ?? 0,
      total: bucketTotals.down,
      totalLabel: 'Total decrease',
      color: 'error.main',
      icon: <ArrowDownward sx={{ fontSize: 40, color: 'error.main' }} />,
    },
    {
      status: 'flat',
      label: 'Price Flat',
      count: data?.summary.priceFlat ?? 0,
      total: bucketTotals.flat,
      totalLabel: 'Total price',
      color: 'text.primary',
      icon: <RemoveIcon sx={{ fontSize: 40, color: 'text.secondary' }} />,
    },
    {
      status: 'new',
      label: 'New Product',
      count: data?.summary.newProduct ?? 0,
      total: bucketTotals.new,
      totalLabel: 'Total price',
      color: 'info.main',
      icon: <FiberNewIcon sx={{ fontSize: 40, color: 'info.main' }} />,
    },
  ];

  return (
    <PageContainer title="Price Compare" description="Compare purchase prices between two months">
      <Box>
        <Box mb={3}>
          <Typography variant="h3" fontWeight="bold" mb={1}>
            Price Compare
          </Typography>
          <Typography variant="body1" color="textSecondary">
            {data
              ? `Comparing ${monthLabel(data.monthA)} against ${monthLabel(data.monthB)}`
              : 'Compare buy prices between two months'}
          </Typography>
        </Box>

        {/* Month selection */}
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2} alignItems="flex-end">
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Month A</InputLabel>
                <Select
                  value={selectedMonthA}
                  label="Month A"
                  onChange={(e) => setSelectedMonthA(e.target.value)}
                >
                  {monthOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Month B</InputLabel>
                <Select
                  value={selectedMonthB}
                  label="Month B"
                  onChange={(e) => setSelectedMonthB(e.target.value)}
                >
                  {monthOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <Button
                variant="contained"
                fullWidth
                onClick={handleApply}
                disabled={loading || !selectedMonthA || !selectedMonthB}
              >
                Apply
              </Button>
            </Grid>
          </Grid>
        </Box>

        {/* Summary cards double as status filters */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {summaryCards.map((card) => {
            const active = statusFilter === card.status;
            return (
              <Grid key={card.status} size={{ xs: 12, sm: 6, md: 3 }}>
                <Card
                  onClick={() => {
                    setStatusFilter(active ? 'all' : card.status);
                    setPage(0);
                  }}
                  sx={(theme) => ({
                    cursor: 'pointer',
                    border: active ? '2px solid' : '1px solid',
                    borderColor: active
                      ? card.color
                      : theme.palette.mode === 'dark'
                        ? 'rgba(255,255,255,0.16)'
                        : 'rgba(0,0,0,0.12)',
                    boxShadow:
                      theme.palette.mode === 'dark' ? 'none' : '0 1px 4px rgba(0, 0, 0, 0.06)',
                  })}
                >
                  <CardContent>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                          {card.label}
                        </Typography>
                        <Typography variant="h4" fontWeight="bold" color={card.color} gutterBottom>
                          {formatNumber(card.count)}
                        </Typography>
                        <Typography
                          variant="h6"
                          fontWeight="bold"
                          color={card.color}
                          sx={{ wordBreak: 'break-word' }}
                        >
                          {formatCurrency(Math.abs(card.total))}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {card.totalLabel}
                        </Typography>
                      </Box>
                      {card.icon}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {/* Table */}
        <Card
          sx={(theme) => ({
            border: '1px solid',
            borderColor:
              theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.12)',
            boxShadow:
              theme.palette.mode === 'dark' ? 'none' : '0 1px 4px rgba(0, 0, 0, 0.06)',
          })}
        >
          <CardContent>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                mb: 3,
              }}
            >
              <Box>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={loadData}
                  disabled={loading}
                  sx={{ mr: 1 }}
                >
                  Refresh
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={handleDownload}
                  disabled={sortedRows.length === 0}
                  sx={{ mr: 1 }}
                >
                  Export Excel
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={clearAllFilters}
                  disabled={statusFilter === 'all' && !searchQuery}
                >
                  Clear Filters
                </Button>
              </Box>
            </Box>

            {/* Search and Filters */}
            <Box mb={3}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPage(0);
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={statusFilter}
                      label="Status"
                      onChange={(e) => {
                        setStatusFilter(e.target.value as StatusFilter);
                        setPage(0);
                      }}
                    >
                      <MenuItem value="all">All Changes</MenuItem>
                      <MenuItem value="up">Price Up</MenuItem>
                      <MenuItem value="down">Price Down</MenuItem>
                      <MenuItem value="flat">Price Flat</MenuItem>
                      <MenuItem value="new">New Product</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>

            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    {headCells.map((headCell) => (
                      <TableCell
                        key={headCell.id}
                        align={headCell.numeric ? 'right' : 'left'}
                        sortDirection={orderBy === headCell.id ? order : false}
                      >
                        <TableSortLabel
                          active={orderBy === headCell.id}
                          direction={orderBy === headCell.id ? order : 'asc'}
                          onClick={() => handleRequestSort(headCell.id)}
                        >
                          {headCell.label}
                        </TableSortLabel>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={headCells.length} align="center">
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  ) : error ? (
                    <TableRow>
                      <TableCell colSpan={headCells.length} align="center">
                        <Typography variant="body2" color="error">
                          {error}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : paginatedRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={headCells.length} align="center">
                        <Typography variant="body2" color="textSecondary">
                          No products found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedRows.map((row) => (
                      <TableRow
                        key={`${row.status}-${row.productId}`}
                        hover
                        onClick={() => setSelectedProduct(row)}
                        sx={{
                          cursor: 'pointer',
                          '&:hover': { backgroundColor: 'action.hover' },
                        }}
                      >
                        <TableCell>{row.productName}</TableCell>
                        <TableCell>
                          <Chip label={row.sku} size="small" variant="outlined" color="primary" />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={STATUS_META[row.status].label}
                            size="small"
                            color={STATUS_META[row.status].color}
                          />
                        </TableCell>
                        <TableCell align="right">
                          {row.priceA === null ? '—' : formatCurrency(row.priceA)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                          {formatCurrency(row.priceB)}
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{ fontWeight: 'bold', color: STATUS_META[row.status].textColor }}
                        >
                          {row.diff === null
                            ? '—'
                            : `${row.diff > 0 ? '+' : ''}${formatCurrency(row.diff)}`}
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{ color: STATUS_META[row.status].textColor }}
                        >
                          {formatPercent(row.diffPct)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
                {!loading && !error && filteredRows.length > 0 && (
                  <TableFooter>
                    <TableRow
                      sx={{
                        backgroundColor: 'action.hover',
                        '& td': {
                          fontWeight: 'bold',
                          fontSize: '0.875rem',
                          borderTop: '2px solid',
                          borderTopColor: 'divider',
                        },
                      }}
                    >
                      <TableCell colSpan={3}>
                        Total ({formatNumber(filteredRows.length)} products)
                      </TableCell>
                      <TableCell align="right">{formatCurrency(tableTotals.priceA)}</TableCell>
                      <TableCell align="right">{formatCurrency(tableTotals.priceB)}</TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          color: tableTotals.diff >= 0 ? 'success.main' : 'error.main',
                        }}
                      >
                        {tableTotals.diff > 0 ? '+' : ''}
                        {formatCurrency(tableTotals.diff)}
                      </TableCell>
                      <TableCell align="right">—</TableCell>
                    </TableRow>
                  </TableFooter>
                )}
              </Table>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={sortedRows.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
              />
            </TableContainer>
          </CardContent>
        </Card>

        <ProductPriceTrackingModal
          open={Boolean(selectedProduct)}
          onClose={() => setSelectedProduct(null)}
          productId={selectedProduct?.productId ?? null}
          productName={selectedProduct?.productName}
        />
      </Box>
    </PageContainer>
  );
};

export default function ProtectedPriceComparePage() {
  return (
    <ProtectedRoute requiredRoles={getPageRoles('WMS_SECTION')}>
      <PriceComparePage />
    </ProtectedRoute>
  );
}
