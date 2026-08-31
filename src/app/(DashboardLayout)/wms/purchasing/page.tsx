"use client";

import {
  CompanyNominal,
  fetchNominalByCompany,
  fetchProductPerformance,
  flattenProductPerformance,
  PurchasingCategoryPerformance,
  PurchasingProductRow,
} from "@/app/api/wms/PurchasingSlice";
import ProtectedRoute from "@/app/components/auth/ProtectedRoute";
import PageContainer from "@/app/components/container/PageContainer";
import CompanySplitCards from "@/app/components/wms/CompanySplitCards";
import ProductPriceTrackingModal from "@/app/components/wms/ProductPriceTrackingModal";
import { getPageRoles } from "@/config/roles";
import {
  Download as DownloadIcon,
  Refresh as RefreshIcon,
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
type SortableField = keyof PurchasingProductRow;

interface HeadCell {
  id: SortableField;
  label: string;
  numeric: boolean;
}

const headCells: HeadCell[] = [
  { id: 'productName', label: 'Product Name', numeric: false },
  { id: 'sku', label: 'SKU', numeric: false },
  { id: 'categoryName', label: 'Category', numeric: false },
  { id: 'totalQtyOrdered', label: 'Qty Ordered', numeric: true },
  { id: 'totalQtyReceived', label: 'Qty Received', numeric: true },
  { id: 'totalNominal', label: 'Total Nominal', numeric: true },
  { id: 'avgBuyPrice', label: 'Avg Buy Price', numeric: true },
  { id: 'lastBuyPrice', label: 'Last Buy Price', numeric: true },
  { id: 'orderCount', label: 'Orders', numeric: true },
];

const formatDateParam = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const formatNumber = (value: number) =>
  new Intl.NumberFormat('id-ID').format(Math.round(value));

const PurchasingPage = () => {
  const [categories, setCategories] = useState<PurchasingCategoryPerformance[]>([]);
  const [companies, setCompanies] = useState<Record<string, CompanyNominal>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Empty until the effect below runs, so server and client render the same markup.
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [appliedRange, setAppliedRange] = useState<{ startDate: string; endDate: string } | null>(null);

  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [orderBy, setOrderBy] = useState<SortableField>('totalNominal');
  const [order, setOrder] = useState<SortDirection>('desc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [selectedProduct, setSelectedProduct] = useState<PurchasingProductRow | null>(null);

  useEffect(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const start = formatDateParam(firstDay);
    const end = formatDateParam(lastDay);

    setStartDate(start);
    setEndDate(end);
    setAppliedRange({ startDate: start, endDate: end });
  }, []);

  const loadData = useCallback(async () => {
    if (!appliedRange) return;

    setLoading(true);
    setError(null);
    try {
      const [performance, byCompany] = await Promise.all([
        fetchProductPerformance(appliedRange),
        fetchNominalByCompany(appliedRange),
      ]);
      setCategories(performance.data ?? []);
      setCompanies(byCompany.data ?? {});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch purchasing data');
      setCategories([]);
      setCompanies({});
      console.error('Failed to fetch purchasing data:', err);
    } finally {
      setLoading(false);
    }
  }, [appliedRange]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleApply = () => {
    if (!startDate || !endDate) return;
    setAppliedRange({ startDate, endDate });
    setPage(0);
  };

  const allRows = useMemo(() => flattenProductPerformance(categories), [categories]);

  const categoryOptions = useMemo(
    () =>
      categories
        .map((category) => category.categoryName)
        .sort((a, b) => a.localeCompare(b)),
    [categories],
  );

  const filteredRows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return allRows.filter((row) => {
      if (categoryFilter && row.categoryName !== categoryFilter) return false;
      if (!query) return true;
      return (
        row.productName.toLowerCase().includes(query) ||
        row.sku.toLowerCase().includes(query) ||
        row.categoryName.toLowerCase().includes(query)
      );
    });
  }, [allRows, categoryFilter, searchQuery]);

  // Totals cover every filtered row, not just the current page, so they reflect
  // the active category and search rather than what happens to be visible.
  const tableTotals = useMemo(
    () =>
      filteredRows.reduce(
        (acc, row) => ({
          qtyOrdered: acc.qtyOrdered + (row.totalQtyOrdered || 0),
          qtyReceived: acc.qtyReceived + (row.totalQtyReceived || 0),
          nominal: acc.nominal + (row.totalNominal || 0),
          orders: acc.orders + (row.orderCount || 0),
        }),
        { qtyOrdered: 0, qtyReceived: 0, nominal: 0, orders: 0 },
      ),
    [filteredRows],
  );

  const sortedRows = useMemo(() => {
    return [...filteredRows].sort((a, b) => {
      const aValue = a[orderBy] ?? 0;
      const bValue = b[orderBy] ?? 0;

      if (typeof aValue === 'string' || typeof bValue === 'string') {
        const result = String(aValue).localeCompare(String(bValue));
        return order === 'asc' ? result : -result;
      }

      return order === 'asc'
        ? Number(aValue) - Number(bValue)
        : Number(bValue) - Number(aValue);
    });
  }, [filteredRows, orderBy, order]);

  const paginatedRows = useMemo(
    () => sortedRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [sortedRows, page, rowsPerPage],
  );

  const clearAllFilters = () => {
    setCategoryFilter('');
    setSearchQuery('');
    setPage(0);
  };

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
      Category: row.categoryName,
      'Qty Ordered': row.totalQtyOrdered,
      'Qty Received': row.totalQtyReceived,
      'Total Nominal': Math.round(row.totalNominal),
      'Avg Buy Price': Math.round(row.avgBuyPrice),
      'Last Buy Price': Math.round(row.lastBuyPrice),
      Orders: row.orderCount,
    }));

    const worksheet = XLSX.utils.json_to_sheet(sheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Product Performance');
    XLSX.writeFile(
      workbook,
      `purchasing-product-performance-${appliedRange?.startDate}-to-${appliedRange?.endDate}.xlsx`,
    );
  };

  return (
    <PageContainer title="Purchasing" description="WMS purchasing product performance">
      <Box>
        <Box mb={3}>
          <Typography variant="h3" fontWeight="bold" mb={1}>
            Purchasing
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Product performance pembelian by kategori
          </Typography>
        </Box>

        {/* Date range */}
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2} alignItems="flex-end">
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                fullWidth
                type="date"
                label="Start Date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                fullWidth
                type="date"
                label="End Date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <Button
                variant="contained"
                fullWidth
                onClick={handleApply}
                disabled={loading || !startDate || !endDate}
              >
                Apply
              </Button>
            </Grid>
          </Grid>
        </Box>

        {/* Summary by buyer company */}
        <Box sx={{ mb: 3 }}>
          <CompanySplitCards companies={companies} />
        </Box>

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
                  disabled={!categoryFilter && !searchQuery}
                >
                  Clear Filters
                </Button>
              </Box>
            </Box>

            {/* Summary Stats */}
            <Box mb={3} sx={{ display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
              <Box sx={{ textAlign: 'center', minWidth: '200px' }}>
                <Typography variant="h3" color="primary" fontWeight="bold" mb={1}>
                  {formatCurrency(tableTotals.nominal)}
                </Typography>
                <Typography variant="h6" color="textSecondary" fontWeight="500">
                  Total Nominal
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center', minWidth: '200px' }}>
                <Typography variant="h3" color="secondary" fontWeight="bold" mb={1}>
                  {formatNumber(tableTotals.orders)}
                </Typography>
                <Typography variant="h6" color="textSecondary" fontWeight="500">
                  Total Orders
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center', minWidth: '200px' }}>
                <Typography variant="h3" color="info.main" fontWeight="bold" mb={1}>
                  {formatNumber(tableTotals.qtyOrdered)}
                </Typography>
                <Typography variant="h6" color="textSecondary" fontWeight="500">
                  Qty Ordered
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center', minWidth: '200px' }}>
                <Typography variant="h3" color="success.main" fontWeight="bold" mb={1}>
                  {formatNumber(tableTotals.qtyReceived)}
                </Typography>
                <Typography variant="h6" color="textSecondary" fontWeight="500">
                  Qty Received
                </Typography>
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
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={categoryFilter}
                      label="Category"
                      onChange={(e) => {
                        setCategoryFilter(e.target.value);
                        setPage(0);
                      }}
                    >
                      <MenuItem value="">All Categories</MenuItem>
                      {categoryOptions.map((category) => (
                        <MenuItem key={category} value={category}>
                          {category}
                        </MenuItem>
                      ))}
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
                        key={`${row.categoryId ?? 'none'}-${row.productId}`}
                        hover
                        onClick={() => setSelectedProduct(row)}
                        sx={{
                          cursor: 'pointer',
                          '&:hover': {
                            backgroundColor: 'action.hover',
                          },
                        }}
                      >
                        <TableCell>{row.productName}</TableCell>
                        <TableCell>
                          <Chip label={row.sku} size="small" variant="outlined" color="primary" />
                        </TableCell>
                        <TableCell>
                          <Chip label={row.categoryName} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell align="right">{formatNumber(row.totalQtyOrdered)}</TableCell>
                        <TableCell align="right">{formatNumber(row.totalQtyReceived)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                          {formatCurrency(row.totalNominal)}
                        </TableCell>
                        <TableCell align="right">{formatCurrency(row.avgBuyPrice)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                          {formatCurrency(row.lastBuyPrice)}
                        </TableCell>
                        <TableCell align="right">{formatNumber(row.orderCount)}</TableCell>
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
                        {categoryFilter || searchQuery
                          ? `Total (${formatNumber(filteredRows.length)} filtered products)`
                          : `Total (${formatNumber(filteredRows.length)} products)`}
                      </TableCell>
                      <TableCell align="right">{formatNumber(tableTotals.qtyOrdered)}</TableCell>
                      <TableCell align="right">{formatNumber(tableTotals.qtyReceived)}</TableCell>
                      <TableCell align="right" sx={{ color: 'primary.main' }}>
                        {formatCurrency(tableTotals.nominal)}
                      </TableCell>
                      <TableCell align="right">—</TableCell>
                      <TableCell align="right">—</TableCell>
                      <TableCell align="right">{formatNumber(tableTotals.orders)}</TableCell>
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

export default function ProtectedPurchasingPage() {
  return (
    <ProtectedRoute requiredRoles={getPageRoles('WMS_SECTION')}>
      <PurchasingPage />
    </ProtectedRoute>
  );
}
