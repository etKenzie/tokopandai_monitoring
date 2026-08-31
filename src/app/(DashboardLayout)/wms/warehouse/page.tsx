"use client";

import {
  fetchStockAllHub,
  fetchStockValue,
  flattenStock,
  StockProductRow,
  StockValueData,
  StockWarehouse,
} from "@/app/api/wms/WarehouseSlice";
import ProtectedRoute from "@/app/components/auth/ProtectedRoute";
import PageContainer from "@/app/components/container/PageContainer";
import CategoryStockBreakdown from "@/app/components/wms/CategoryStockBreakdown";
import HubSplitCards, { HubSplit } from "@/app/components/wms/HubSplitCards";
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
type SortableField = keyof StockProductRow;

interface HeadCell {
  id: SortableField;
  label: string;
  numeric: boolean;
}

const headCells: HeadCell[] = [
  { id: 'productName', label: 'Product Name', numeric: false },
  { id: 'sku', label: 'SKU', numeric: false },
  { id: 'categoryName', label: 'Category', numeric: false },
  { id: 'warehouseName', label: 'Warehouse', numeric: false },
  { id: 'totalQty', label: 'Qty', numeric: true },
  { id: 'totalValue', label: 'Stock Value', numeric: true },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const formatNumber = (value: number) => Math.round(value).toLocaleString('id-ID');

const WarehousePage = () => {
  const [warehouses, setWarehouses] = useState<StockWarehouse[]>([]);
  const [stockValue, setStockValue] = useState<StockValueData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [orderBy, setOrderBy] = useState<SortableField>('totalValue');
  const [order, setOrder] = useState<SortDirection>('desc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [selectedProduct, setSelectedProduct] = useState<StockProductRow | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [allHub, value] = await Promise.all([fetchStockAllHub(), fetchStockValue()]);
      setWarehouses(allHub.data ?? []);
      setStockValue(value.data ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch warehouse stock');
      setWarehouses([]);
      setStockValue(null);
      console.error('Failed to fetch warehouse stock:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const allRows = useMemo(() => flattenStock(warehouses), [warehouses]);

  // Value and qty come from stock-value, which is authoritative; the per-hub
  // product count only exists on stock-all-hub, so the two are merged by id.
  const hubSplits: HubSplit[] = useMemo(() => {
    const productCountByHub = new Map(
      warehouses.map((warehouse) => [warehouse.warehouseId, warehouse.totalProducts]),
    );

    return (stockValue?.byWarehouse ?? []).map((hub) => ({
      warehouseId: hub.warehouseId,
      warehouseName: hub.warehouseName,
      totalValue: hub.totalValue,
      totalQty: hub.totalQty,
      totalProducts: productCountByHub.get(hub.warehouseId) ?? 0,
    }));
  }, [stockValue, warehouses]);

  const overallTotals = useMemo(
    () => ({
      totalValue: stockValue?.summary.totalValue ?? 0,
      totalQty: stockValue?.summary.totalQty ?? 0,
      totalProducts: stockValue?.summary.totalProducts ?? 0,
    }),
    [stockValue],
  );

  const hasActiveFilter = Boolean(warehouseFilter || categoryFilter || searchQuery);

  const warehouseOptions = useMemo(
    () => warehouses.map((warehouse) => warehouse.warehouseName).sort((a, b) => a.localeCompare(b)),
    [warehouses],
  );

  const categoryOptions = useMemo(
    () =>
      Array.from(new Set(allRows.map((row) => row.categoryName))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [allRows],
  );

  const filteredRows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return allRows.filter((row) => {
      if (warehouseFilter && row.warehouseName !== warehouseFilter) return false;
      if (categoryFilter && row.categoryName !== categoryFilter) return false;
      if (!query) return true;
      return (
        row.productName.toLowerCase().includes(query) ||
        row.sku.toLowerCase().includes(query) ||
        row.categoryName.toLowerCase().includes(query) ||
        row.warehouseName.toLowerCase().includes(query)
      );
    });
  }, [allRows, warehouseFilter, categoryFilter, searchQuery]);

  // Totals cover every filtered row, not just the current page.
  const tableTotals = useMemo(
    () =>
      filteredRows.reduce(
        (acc, row) => ({
          qty: acc.qty + (row.totalQty || 0),
          value: acc.value + (row.totalValue || 0),
        }),
        { qty: 0, value: 0 },
      ),
    [filteredRows],
  );

  const distinctProducts = useMemo(
    () => new Set(filteredRows.map((row) => row.productId)).size,
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

  const handleRequestSort = (property: SortableField) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
    setPage(0);
  };

  const clearAllFilters = () => {
    setWarehouseFilter('');
    setCategoryFilter('');
    setSearchQuery('');
    setPage(0);
  };

  const handleDownload = () => {
    const sheetData = sortedRows.map((row) => ({
      'Product Name': row.productName,
      SKU: row.sku,
      Category: row.categoryName,
      Warehouse: row.warehouseName,
      'Warehouse Code': row.warehouseCode,
      Qty: row.totalQty,
      'Stock Value': Math.round(row.totalValue),
    }));

    const worksheet = XLSX.utils.json_to_sheet(sheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Stock All Hub');
    XLSX.writeFile(workbook, 'warehouse-stock-all-hub.xlsx');
  };

  return (
    <PageContainer title="Warehouse" description="WMS warehouse stock across all hubs">
      <Box>
        <Box mb={3}>
          <Typography variant="h3" fontWeight="bold" mb={1}>
            Warehouse
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Stock on hand across all hubs
          </Typography>
        </Box>

        {/* Summary by hub */}
        <Box sx={{ mb: 3 }}>
          <HubSplitCards hubs={hubSplits} totals={overallTotals} />
        </Box>

        {/* Category breakdown */}
        <Box sx={{ mb: 3 }}>
          <CategoryStockBreakdown
            categories={stockValue?.byCategory ?? []}
            activeCategory={categoryFilter}
            onCategoryClick={(categoryName) => {
              setCategoryFilter((current) => (current === categoryName ? '' : categoryName));
              setPage(0);
            }}
          />
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
                  disabled={!warehouseFilter && !categoryFilter && !searchQuery}
                >
                  Clear Filters
                </Button>
              </Box>
            </Box>

            {/* Summary Stats. Falls back to the authoritative stock-value totals
                when nothing is filtered, and to the row totals otherwise. */}
            <Box mb={3} sx={{ display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
              <Box sx={{ textAlign: 'center', minWidth: '200px' }}>
                <Typography variant="h3" color="primary" fontWeight="bold" mb={1}>
                  {formatCurrency(hasActiveFilter ? tableTotals.value : overallTotals.totalValue)}
                </Typography>
                <Typography variant="h6" color="textSecondary" fontWeight="500">
                  Total Stock Value
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center', minWidth: '200px' }}>
                <Typography variant="h3" color="secondary" fontWeight="bold" mb={1}>
                  {formatNumber(hasActiveFilter ? tableTotals.qty : overallTotals.totalQty)}
                </Typography>
                <Typography variant="h6" color="textSecondary" fontWeight="500">
                  Total Qty
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center', minWidth: '200px' }}>
                <Typography variant="h3" color="info.main" fontWeight="bold" mb={1}>
                  {formatNumber(hasActiveFilter ? distinctProducts : overallTotals.totalProducts)}
                </Typography>
                <Typography variant="h6" color="textSecondary" fontWeight="500">
                  Products
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center', minWidth: '200px' }}>
                <Typography variant="h3" color="success.main" fontWeight="bold" mb={1}>
                  {formatNumber(hubSplits.length || warehouses.length)}
                </Typography>
                <Typography variant="h6" color="textSecondary" fontWeight="500">
                  Hubs
                </Typography>
              </Box>
            </Box>
            {hasActiveFilter && (
              <Typography
                variant="body2"
                color="textSecondary"
                align="center"
                sx={{ mt: -2, mb: 3, fontStyle: 'italic' }}
              >
                Showing filtered totals
              </Typography>
            )}

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
                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Warehouse</InputLabel>
                    <Select
                      value={warehouseFilter}
                      label="Warehouse"
                      onChange={(e) => {
                        setWarehouseFilter(e.target.value);
                        setPage(0);
                      }}
                    >
                      <MenuItem value="">All Warehouses</MenuItem>
                      {warehouseOptions.map((warehouse) => (
                        <MenuItem key={warehouse} value={warehouse}>
                          {warehouse}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
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
                          No stock found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedRows.map((row) => (
                      <TableRow
                        key={`${row.warehouseId}-${row.categoryId ?? 'none'}-${row.productId}`}
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
                          <Chip label={row.categoryName} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={row.warehouseCode}
                            size="small"
                            variant="outlined"
                            color="secondary"
                            title={row.warehouseName}
                          />
                        </TableCell>
                        <TableCell align="right">{formatNumber(row.totalQty)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                          {formatCurrency(row.totalValue)}
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
                      <TableCell colSpan={4}>
                        Total ({formatNumber(filteredRows.length)} rows)
                      </TableCell>
                      <TableCell align="right">{formatNumber(tableTotals.qty)}</TableCell>
                      <TableCell align="right" sx={{ color: 'primary.main' }}>
                        {formatCurrency(tableTotals.value)}
                      </TableCell>
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

export default function ProtectedWarehousePage() {
  return (
    <ProtectedRoute requiredRoles={getPageRoles('WMS_SECTION')}>
      <WarehousePage />
    </ProtectedRoute>
  );
}
