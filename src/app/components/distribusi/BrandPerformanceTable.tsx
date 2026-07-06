'use client';

import {
  ProductBrandRow,
  ProductBrandTotals,
  ProductPrincipalRow,
} from '@/app/api/distribusi/DistribusiSlice';
import { Download as DownloadIcon, Refresh as RefreshIcon, Search as SearchIcon } from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  TextField,
  Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import PrincipalOrdersModal from './PrincipalOrdersModal';

type ViewMode = 'brand' | 'principal';
type SortDirection = 'asc' | 'desc';

interface BrandPerformanceTableProps {
  viewMode: ViewMode;
  brandRows: ProductBrandRow[];
  principalRows: ProductPrincipalRow[];
  totals?: ProductBrandTotals | null;
  loading?: boolean;
  onRefresh?: () => void;
  title?: string;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

const formatNumber = (value: number) =>
  new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value);

const formatPercent = (value: number) =>
  new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

type PerformanceRow = ProductBrandRow | ProductPrincipalRow;

function getRowValue(row: PerformanceRow, key: string): unknown {
  return (row as unknown as Record<string, unknown>)[key];
}

const BrandPerformanceTable = ({
  viewMode,
  brandRows,
  principalRows,
  totals,
  loading = false,
  onRefresh,
  title = 'Principal Performance',
}: BrandPerformanceTableProps) => {
  const [orderBy, setOrderBy] = useState<string>('total_invoice');
  const [order, setOrder] = useState<SortDirection>('desc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [principalModalOpen, setPrincipalModalOpen] = useState(false);
  const [selectedPrincipal, setSelectedPrincipal] = useState<{
    id: string;
    name: string;
    brandName?: string;
  } | null>(null);

  const rows = viewMode === 'brand' ? brandRows : principalRows;

  const filteredRows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return rows;

    return rows.filter((row) => {
      if (viewMode === 'brand') {
        const brandRow = row as ProductBrandRow;
        return (
          brandRow.brand_name?.toLowerCase().includes(query) ||
          brandRow.principal_name?.toLowerCase().includes(query)
        );
      }
      const principalRow = row as ProductPrincipalRow;
      return principalRow.principal_name?.toLowerCase().includes(query);
    });
  }, [rows, searchQuery, viewMode]);

  const sortedRows = useMemo(() => {
    return [...filteredRows].sort((a, b) => {
      const aValue = getRowValue(a, orderBy);
      const bValue = getRowValue(b, orderBy);

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return order === 'asc' ? aValue - bValue : bValue - aValue;
      }

      const aText = String(aValue ?? '').toLowerCase();
      const bText = String(bValue ?? '').toLowerCase();
      if (order === 'asc') return aText.localeCompare(bText);
      return bText.localeCompare(aText);
    });
  }, [filteredRows, order, orderBy]);

  const paginatedRows = sortedRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleRequestSort = (property: string) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleExcelExport = () => {
    if (!sortedRows.length || typeof window === 'undefined') return;

    const data =
      viewMode === 'brand'
        ? (sortedRows as ProductBrandRow[]).map((row) => ({
            Principal: row.principal_name,
            Brand: row.brand_name,
            'Total Invoice': row.total_invoice,
            Profit: row.total_profit,
            'Margin %': row.margin_percentage,
            'Order Count': row.order_count,
            'Total Quantity': row.total_quantity,
            'Product Count': row.product_count,
            'Store Count': row.store_count,
          }))
        : (sortedRows as ProductPrincipalRow[]).map((row) => ({
            Principal: row.principal_name,
            'Total Invoice': row.total_invoice,
            Profit: row.total_profit,
            'Margin %': row.margin_percentage,
            'Order Count': row.order_count,
            'Total Quantity': row.total_quantity,
            'Product Count': row.product_count,
            'Brand Count': row.brand_count,
            'Store Count': row.store_count,
          }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, viewMode === 'brand' ? 'By Brand' : 'By Principal');
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${viewMode}-performance.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const brandHeadCells = [
    { id: 'principal_name', label: 'Principal', numeric: false },
    { id: 'brand_name', label: 'Brand', numeric: false },
    { id: 'total_invoice', label: 'Total Invoice', numeric: true },
    { id: 'total_profit', label: 'Profit', numeric: true },
    { id: 'margin_percentage', label: 'Margin %', numeric: true },
    { id: 'order_count', label: 'Orders', numeric: true },
    { id: 'total_quantity', label: 'Quantity', numeric: true },
    { id: 'product_count', label: 'Products', numeric: true },
    { id: 'store_count', label: 'Stores', numeric: true },
  ];

  const principalHeadCells = [
    { id: 'principal_name', label: 'Principal', numeric: false },
    { id: 'total_invoice', label: 'Total Invoice', numeric: true },
    { id: 'total_profit', label: 'Profit', numeric: true },
    { id: 'margin_percentage', label: 'Margin %', numeric: true },
    { id: 'order_count', label: 'Orders', numeric: true },
    { id: 'total_quantity', label: 'Quantity', numeric: true },
    { id: 'product_count', label: 'Products', numeric: true },
    { id: 'store_count', label: 'Stores', numeric: true },
    { id: 'brand_count', label: 'Brands', numeric: true },
  ];

  const headCells = viewMode === 'brand' ? brandHeadCells : principalHeadCells;

  const renderCellContent = (
    row: ProductBrandRow | ProductPrincipalRow,
    columnId: string
  ) => {
    const value = getRowValue(row, columnId);

    if (columnId === 'principal_name') {
      return (
        <Typography variant="body2" fontWeight="medium">
          {String(value ?? '—')}
        </Typography>
      );
    }

    if (columnId === 'brand_name') {
      return (
        <Chip
          label={String(value ?? '—')}
          size="small"
          variant="outlined"
          color="primary"
        />
      );
    }

    if (columnId === 'total_invoice' || columnId === 'total_profit') {
      return (
        <Typography variant="body2" fontWeight="medium">
          {formatCurrency(Number(value) || 0)}
        </Typography>
      );
    }

    if (columnId === 'margin_percentage') {
      return (
        <Typography variant="body2" fontWeight="medium" color="info.main">
          {formatPercent(Number(value) || 0)}%
        </Typography>
      );
    }

    if (
      columnId === 'order_count' ||
      columnId === 'total_quantity' ||
      columnId === 'product_count' ||
      columnId === 'store_count' ||
      columnId === 'brand_count'
    ) {
      return (
        <Typography variant="body2">
          {formatNumber(Number(value) || 0)}
        </Typography>
      );
    }

    return (
      <Typography variant="body2" color="textSecondary">
        {String(value ?? '—')}
      </Typography>
    );
  };

  const handleRowClick = (row: ProductBrandRow | ProductPrincipalRow) => {
    const principalId =
      viewMode === 'brand'
        ? (row as ProductBrandRow).principal_id
        : (row as ProductPrincipalRow).principal_id;
    const principalName =
      viewMode === 'brand'
        ? (row as ProductBrandRow).principal_name
        : (row as ProductPrincipalRow).principal_name;
    const brandName = viewMode === 'brand' ? (row as ProductBrandRow).brand_name : undefined;

    setSelectedPrincipal({ id: principalId, name: principalName, brandName });
    setPrincipalModalOpen(true);
  };

  const rowCount = viewMode === 'brand' ? brandRows.length : principalRows.length;

  return (
    <Card>
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
          }}
        >
          <Typography variant="h5" fontWeight="bold">
            {title}
          </Typography>
          <Box>
            {onRefresh && (
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={onRefresh}
                disabled={loading}
                sx={{ mr: 1 }}
              >
                Refresh
              </Button>
            )}
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExcelExport}
              disabled={!sortedRows.length || loading}
            >
              Export Excel
            </Button>
          </Box>
        </Box>

        {totals && (
          <Box mb={3} sx={{ display: 'flex', justifyContent: 'center', gap: 4, flexWrap: 'wrap' }}>
            <Box sx={{ textAlign: 'center', minWidth: '150px' }}>
              <Typography variant="h3" color="primary" fontWeight="bold" mb={1}>
                {formatNumber(rowCount)}
              </Typography>
              <Typography variant="h6" color="textSecondary" fontWeight="500">
                Total {viewMode === 'brand' ? 'Brands' : 'Principals'}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center', minWidth: '150px' }}>
              <Typography variant="h3" color="success.main" fontWeight="bold" mb={1}>
                {formatCurrency(totals.total_invoice)}
              </Typography>
              <Typography variant="h6" color="textSecondary" fontWeight="500">
                Total Invoice
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center', minWidth: '150px' }}>
              <Typography variant="h3" color="success.main" fontWeight="bold" mb={1}>
                {formatCurrency(totals.total_profit)}
              </Typography>
              <Typography variant="h6" color="textSecondary" fontWeight="500">
                Total Profit
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center', minWidth: '150px' }}>
              <Typography variant="h3" color="info.main" fontWeight="bold" mb={1}>
                {formatPercent(totals.margin_percentage)}%
              </Typography>
              <Typography variant="h6" color="textSecondary" fontWeight="500">
                Margin
              </Typography>
            </Box>
            {totals.store_count != null && (
              <Box sx={{ textAlign: 'center', minWidth: '150px' }}>
                <Typography variant="h3" color="primary" fontWeight="bold" mb={1}>
                  {formatNumber(totals.store_count)}
                </Typography>
                <Typography variant="h6" color="textSecondary" fontWeight="500">
                  Active Stores
                </Typography>
              </Box>
            )}
          </Box>
        )}

        <Box mb={3}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder={`Search ${viewMode === 'brand' ? 'principal or brand' : 'principal'}...`}
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
              ) : paginatedRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={headCells.length} align="center">
                    <Typography variant="body2" color="textSecondary">
                      No data for the selected filters.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRows.map((row) => {
                  const rowKey =
                    viewMode === 'brand'
                      ? (row as ProductBrandRow).brand_id
                      : (row as ProductPrincipalRow).principal_id;
                  return (
                    <TableRow
                      key={rowKey}
                      hover
                      onClick={() => handleRowClick(row)}
                      sx={{
                        cursor: 'pointer',
                        '&:hover': { backgroundColor: 'action.hover' },
                      }}
                    >
                      {headCells.map((headCell) => (
                        <TableCell key={headCell.id} align={headCell.numeric ? 'right' : 'left'}>
                          {renderCellContent(row, headCell.id)}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={sortedRows.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 25, 50, 100]}
        />
      </CardContent>

      <PrincipalOrdersModal
        open={principalModalOpen}
        onClose={() => {
          setPrincipalModalOpen(false);
          setSelectedPrincipal(null);
        }}
        principalId={selectedPrincipal?.id ?? null}
        principalName={selectedPrincipal?.name ?? null}
        brandName={selectedPrincipal?.brandName}
      />
    </Card>
  );
};

export default BrandPerformanceTable;
