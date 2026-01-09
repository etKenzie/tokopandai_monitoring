'use client';

import { getAgentNameFromRole } from '@/config/roles';
import { Download as DownloadIcon, Refresh as RefreshIcon, Search as SearchIcon } from '@mui/icons-material';
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
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  TextField,
  Typography
} from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { fetchOverdueSnapshotList, OverdueSnapshotListItem } from '../../api/distribusi/DistribusiSlice';
import OrderDetailModal from '../shared/OrderDetailModal';

type OrderDirection = 'asc' | 'desc';
type SortableField = keyof OverdueSnapshotListItem;

interface HeadCell {
  id: SortableField;
  label: string;
  numeric: boolean;
}

const headCells: HeadCell[] = [
  { id: 'order_code', label: 'Order Code', numeric: false },
  { id: 'reseller_name', label: 'Reseller Name', numeric: false },
  { id: 'store_name', label: 'Store Name', numeric: false },
  { id: 'agent_name', label: 'Agent', numeric: false },
  { id: 'status_payment', label: 'Payment Status', numeric: false },
  { id: 'overdue_status', label: 'Overdue Status', numeric: false },
  { id: 'payment_due_date', label: 'Due Date', numeric: false },
  { id: 'total_invoice', label: 'Total Invoice', numeric: true },
  { id: 'profit', label: 'Profit', numeric: true },
];

interface OverdueSnapshotListTableProps {
  selectedMonth: string; // Format: YYYY-MM
  selectedAgent?: string;
  hasRestrictedRole?: boolean;
  userRoleForFiltering?: string;
}

const OverdueSnapshotListTable = ({ 
  selectedMonth,
  selectedAgent,
  hasRestrictedRole = false,
  userRoleForFiltering
}: OverdueSnapshotListTableProps) => {
  const [orders, setOrders] = useState<OverdueSnapshotListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderBy, setOrderBy] = useState<SortableField>('payment_due_date');
  const [order, setOrder] = useState<OrderDirection>('desc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [agentFilter, setAgentFilter] = useState<string>('');
  const [statusPaymentFilter, setStatusPaymentFilter] = useState<string>('');
  const [overdueStatusFilter, setOverdueStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedOrderCode, setSelectedOrderCode] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchOrdersData = async () => {
    if (!selectedMonth) return;
    
    setLoading(true);
    setError(null);
    try {
      // For users with restricted roles, use their mapped agent name instead of filter selection
      const agentName = hasRestrictedRole && userRoleForFiltering 
        ? getAgentNameFromRole(userRoleForFiltering) 
        : (selectedAgent || undefined);

      const response = await fetchOverdueSnapshotList({
        month: selectedMonth,
        agent: agentName
      });
      
      setOrders(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Failed to fetch overdue snapshot list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrdersData();
    setPage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, selectedAgent, hasRestrictedRole, userRoleForFiltering]);

  const handleRequestSort = (property: SortableField) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0);
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'LUNAS': return 'success';
      case 'BELUM LUNAS': return 'error';
      case 'SEBAGIAN': return 'warning';
      default: return 'default';
    }
  };

  const getOverdueStatusColor = (status: string) => {
    if (!status) return 'default';
    if (status.includes('DPD')) {
      const days = parseInt(status.replace('DPD', '').trim());
      if (days >= 30) return 'error';
      if (days >= 14) return 'warning';
      return 'info';
    }
    if (status === 'CURRENT') return 'success';
    if (status === 'B2W') return 'warning';
    return 'default';
  };

  const searchFields = (order: OverdueSnapshotListItem, query: string): boolean => {
    if (!query) return true;

    const searchableFields = [
      order.order_code?.toLowerCase() || '',
      order.reseller_name?.toLowerCase() || '',
      order.store_name?.toLowerCase() || '',
      order.agent_name?.toLowerCase() || '',
      order.status_payment?.toLowerCase() || '',
      order.overdue_status?.toLowerCase() || '',
    ];

    return searchableFields.some((field) =>
      field.includes(query.toLowerCase())
    );
  };

  const filteredOrders = orders.filter((o) => {
    // Apply filters
    if (agentFilter && o.agent_name !== agentFilter) return false;
    if (statusPaymentFilter && o.status_payment !== statusPaymentFilter) return false;
    if (overdueStatusFilter && o.overdue_status !== overdueStatusFilter) return false;

    // Search functionality
    if (searchQuery) {
      return searchFields(o, searchQuery);
    }

    return true;
  });

  // Reset page when local filters change
  useEffect(() => {
    setPage(0);
  }, [agentFilter, statusPaymentFilter, overdueStatusFilter, searchQuery]);

  const uniqueAgents = Array.from(new Set(orders.map((o) => o.agent_name))).filter(Boolean);
  const uniqueStatusPayments = Array.from(new Set(orders.map((o) => o.status_payment))).filter(Boolean);
  const uniqueOverdueStatuses = Array.from(new Set(orders.map((o) => o.overdue_status))).filter(Boolean).sort();

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    let aValue: any = a[orderBy];
    let bValue: any = b[orderBy];

    if (orderBy === 'total_invoice' || orderBy === 'profit') {
      aValue = Number(aValue);
      bValue = Number(bValue);
    }

    if (orderBy === 'payment_due_date' || orderBy === 'created_at') {
      aValue = aValue ? new Date(aValue).getTime() : 0;
      bValue = bValue ? new Date(bValue).getTime() : 0;
    }

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (order === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return bValue < aValue ? -1 : bValue > aValue ? 1 : 0;
    }
  });

  const totalInvoice = filteredOrders.reduce((sum, o) => sum + (Number(o.total_invoice) || 0), 0);
  const totalProfit = filteredOrders.reduce((sum, o) => sum + (Number(o.profit) || 0), 0);
  const totalOrders = filteredOrders.length;

  const prepareDataForExport = (orders: OverdueSnapshotListItem[]) => {
    // Add summary row at the beginning
    const summaryRow = {
      'Order Code': 'SUMMARY',
      'Reseller Name': '',
      'Store Name': '',
      'Agent': '',
      'Payment Status': '',
      'Overdue Status': '',
      'Due Date': '',
      'Total Invoice': totalInvoice,
      'Profit': totalProfit,
    };
    
    const orderData = orders.map((o) => ({
      'Order Code': o.order_code,
      'Reseller Name': o.reseller_name,
      'Store Name': o.store_name,
      'Agent': o.agent_name,
      'Payment Status': o.status_payment,
      'Overdue Status': o.overdue_status,
      'Due Date': formatDate(o.payment_due_date),
      'Total Invoice': o.total_invoice,
      'Profit': o.profit,
    }));
    
    return [summaryRow, ...orderData];
  };

  const handleExcelExport = () => {
    if (!orders.length) return;

    // Only run on client side
    if (typeof window === 'undefined' || typeof document === 'undefined' || typeof Blob === 'undefined') return;

    const data = prepareDataForExport(filteredOrders);
    
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);

    // Set column widths
    const colWidths = [
      { wch: 15 }, // Order Code
      { wch: 25 }, // Reseller Name
      { wch: 25 }, // Store Name
      { wch: 20 }, // Agent
      { wch: 15 }, // Payment Status
      { wch: 15 }, // Overdue Status
      { wch: 15 }, // Due Date
      { wch: 15 }, // Total Invoice
      { wch: 15 }, // Profit
    ];
    ws['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Overdue Snapshot List');

    // Generate Excel file
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    // Download file
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `overdue-snapshot-list-${selectedMonth}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const clearAllFilters = () => {
    setAgentFilter('');
    setStatusPaymentFilter('');
    setOverdueStatusFilter('');
    setSearchQuery('');
    setPage(0);
  };

  const handleRowClick = (orderCode: string) => {
    setSelectedOrderCode(orderCode);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedOrderCode(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!selectedMonth) {
    return null;
  }

  return (
    <Card sx={{ mt: 4 }}>
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
            Overdue Snapshot List
          </Typography>
          <Box>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchOrdersData}
              disabled={loading}
              sx={{ mr: 1 }}
            >
              Refresh
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExcelExport}
              disabled={filteredOrders.length === 0}
              sx={{ mr: 1 }}
            >
              Export Excel
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={clearAllFilters}
              disabled={!agentFilter && !statusPaymentFilter && !overdueStatusFilter && !searchQuery}
            >
              Clear Filters
            </Button>
          </Box>
        </Box>

        {/* Summary Stats */}
        <Box mb={3} sx={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
          <Box sx={{ textAlign: 'center', minWidth: '200px' }}>
            <Typography variant="h3" color="secondary" fontWeight="bold" mb={1}>
              {totalOrders}
            </Typography>
            <Typography variant="h6" color="textSecondary" fontWeight="500">
              Total Orders
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center', minWidth: '200px' }}>
            <Typography variant="h3" color="info.main" fontWeight="bold" mb={1}>
              {formatCurrency(totalInvoice)}
            </Typography>
            <Typography variant="h6" color="textSecondary" fontWeight="500">
              Total Invoice Amount
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center', minWidth: '200px' }}>
            <Typography variant="h3" color="success.main" fontWeight="bold" mb={1}>
              {formatCurrency(totalProfit)}
            </Typography>
            <Typography variant="h6" color="textSecondary" fontWeight="500">
              Total Profit Amount
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
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <FormControl fullWidth>
                <InputLabel>Payment Status</InputLabel>
                <Select
                  value={statusPaymentFilter}
                  label="Payment Status"
                  onChange={(e) => setStatusPaymentFilter(e.target.value)}
                >
                  <MenuItem value="">All Payment Statuses</MenuItem>
                  {uniqueStatusPayments.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <FormControl fullWidth>
                <InputLabel>Overdue Status</InputLabel>
                <Select
                  value={overdueStatusFilter}
                  label="Overdue Status"
                  onChange={(e) => {
                    setOverdueStatusFilter(e.target.value);
                    setPage(0);
                  }}
                >
                  <MenuItem value="">All Overdue Statuses</MenuItem>
                  {uniqueOverdueStatuses.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <FormControl fullWidth>
                <InputLabel>Agent</InputLabel>
                <Select
                  value={agentFilter}
                  label="Agent"
                  onChange={(e) => setAgentFilter(e.target.value)}
                  disabled={hasRestrictedRole}
                >
                  <MenuItem value="">All Agents</MenuItem>
                  {uniqueAgents.map((agent) => (
                    <MenuItem key={agent} value={agent}>
                      {agent}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>

        {/* Table */}
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
              ) : sortedOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={headCells.length} align="center">
                    <Typography variant="body2" color="textSecondary">
                      {'No orders found'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                sortedOrders
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((row) => (
                    <TableRow 
                      key={row.id} 
                      hover 
                      onClick={() => handleRowClick(row.order_code)}
                      sx={{ 
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        }
                      }}
                    >
                      <TableCell>{row.order_code}</TableCell>
                      <TableCell>{row.reseller_name}</TableCell>
                      <TableCell>{row.store_name}</TableCell>
                      <TableCell>{row.agent_name}</TableCell>
                      <TableCell>
                        <Chip
                          label={row.status_payment}
                          color={getPaymentStatusColor(row.status_payment) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {row.overdue_status ? (
                          <Chip
                            label={row.overdue_status}
                            color={getOverdueStatusColor(row.overdue_status) as any}
                            size="small"
                          />
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>{formatDate(row.payment_due_date)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        {formatCurrency(Number(row.total_invoice))}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                        {formatCurrency(Number(row.profit))}
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={filteredOrders.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </TableContainer>
      </CardContent>

      {/* Order Detail Modal */}
      <OrderDetailModal
        open={modalOpen}
        onClose={handleCloseModal}
        orderCode={selectedOrderCode}
      />
    </Card>
  );
};

export default OverdueSnapshotListTable;

