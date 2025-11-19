'use client';

import { getAgentNameFromRole } from '@/config/roles';
import { Download as DownloadIcon, Info as InfoIcon, Refresh as RefreshIcon, Search as SearchIcon } from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { fetchOverdueOrders, Order } from '../../api/distribusi/DistribusiSlice';
import OrderDetailModal from '../shared/OrderDetailModal';

type OrderDirection = 'asc' | 'desc';
type SortableField = keyof Order;

interface HeadCell {
  id: SortableField;
  label: string;
  numeric: boolean;
}

const headCells: HeadCell[] = [
  { id: 'order_code', label: 'Order Code', numeric: false },
  { id: 'month', label: 'Month', numeric: false },
  { id: 'reseller_name', label: 'Reseller Name', numeric: false },
  { id: 'store_name', label: 'Store Name', numeric: false },
  { id: 'segment', label: 'Segment', numeric: false },
  { id: 'area', label: 'Area', numeric: false },
  { id: 'agent_name', label: 'Agent', numeric: false },
  { id: 'status_order', label: 'Order Status', numeric: false },
  { id: 'status_payment', label: 'Payment Status', numeric: false },
  { id: 'payment_type', label: 'Payment Type', numeric: false },
  { id: 'order_date', label: 'Order Date', numeric: false },
  { id: 'faktur_date', label: 'Faktur Date', numeric: false },
  { id: 'payment_due_date', label: 'Due Date', numeric: false },
  { id: 'overdue_status', label: 'Overdue Status', numeric: false },
  { id: 'total_invoice', label: 'Total Invoice', numeric: true },
  { id: 'profit', label: 'Profit', numeric: true },
  { id: 'business_type', label: 'Business Type', numeric: false },
  { id: 'sub_business_type', label: 'Sub Business Type', numeric: false },
];

interface OverdueOrdersTableProps {
  filters: {
    start_date?: string;
    end_date?: string;
    agent?: string;
  };
  title?: string;
  // Role-based filtering props
  hasRestrictedRole?: boolean;
  userRoleForFiltering?: string;
  // Callback to update available agents in parent
  onAgentsUpdate?: (agents: string[]) => void;
}

const OverdueOrdersTable = ({ 
  filters,
  title = 'Overdue Orders',
  hasRestrictedRole = false,
  userRoleForFiltering,
  onAgentsUpdate
}: OverdueOrdersTableProps) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderBy, setOrderBy] = useState<SortableField>('order_date');
  const [order, setOrder] = useState<OrderDirection>('desc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [segmentFilter, setSegmentFilter] = useState<string>('');
  const [areaFilter, setAreaFilter] = useState<string>('');
  const [agentFilter, setAgentFilter] = useState<string>('');
  const [statusOrderFilter, setStatusOrderFilter] = useState<string>('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedOrderCode, setSelectedOrderCode] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  const fetchOverdueOrdersData = async () => {
    // Clear existing data immediately when fetching new data
    setOrders([]);
    setError(null);
    
    // Only fetch data if dates are selected
    if (!filters.start_date || !filters.end_date) {
      setError('Please select start date and end date to view overdue orders');
      return;
    }

    setLoading(true);
    try {
      // For users with restricted roles, use their mapped agent name instead of filter selection
      const agentName = hasRestrictedRole && userRoleForFiltering 
        ? getAgentNameFromRole(userRoleForFiltering) 
        : filters.agent;

      const response = await fetchOverdueOrders({
        start_date: filters.start_date,
        end_date: filters.end_date,
        sortTime: 'desc',
        agent: agentName
      });
      
      setOrders(response.data);
      
      // Update available agents in parent component
      if (onAgentsUpdate) {
        const uniqueAgents = Array.from(new Set(response.data.map((o: Order) => o.agent_name).filter(Boolean))) as string[];
        onAgentsUpdate(uniqueAgents.sort());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Failed to fetch overdue orders data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Clear data when dates change
  useEffect(() => {
    setOrders([]);
    setError(null);
    setPage(0);
    // Clear local filters when dates change
    setSegmentFilter('');
    setAreaFilter('');
    setAgentFilter('');
    setStatusOrderFilter('');
    setPaymentStatusFilter('');
    setSearchQuery('');
  }, [filters.start_date, filters.end_date]);

  useEffect(() => {
    fetchOverdueOrdersData();
    // Reset pagination when filters change
    setPage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.start_date, filters.end_date, filters.agent, hasRestrictedRole, userRoleForFiltering]);

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

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'PACKAGED': return 'success';
      case 'PROCESS DELIVERY': return 'warning';
      case 'DELIVERED': return 'info';
      case 'CANCELLED': return 'error';
      default: return 'default';
    }
  };

  // Calculate overdue status based on faktur_date (or order_date if faktur_date is null) and payment_due_date
  const calculateOverdueStatus = (order: Order): string => {
    if (!order.payment_due_date) return '';
    
    // Use faktur_date if available, otherwise fall back to order_date
    const referenceDate = order.faktur_date || order.order_date;
    if (!referenceDate) return '';
    
    const reference = new Date(referenceDate);
    const dueDate = new Date(order.payment_due_date);
    
    // Reset time to start of day for accurate day calculation
    reference.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    
    // Calculate difference in days
    const diffTime = dueDate.getTime() - reference.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Determine overdue status based on days past due
    if (diffDays >= 0) {
      return 'CURRENT';
    } else {
      const daysPastDue = Math.abs(diffDays);
      if (daysPastDue < 14) {
        return 'B2W';
      } else if (daysPastDue < 40) {
        return '14DPD';
      } else if (daysPastDue < 60) {
        return '40DPD';
      } else if (daysPastDue < 90) {
        return '60DPD';
      } else {
        return '90DPD';
      }
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

  const searchFields = (order: Order, query: string): boolean => {
    if (!query) return true;

    const searchableFields = [
      order.order_code?.toLowerCase() || '',
      order.reseller_name?.toLowerCase() || '',
      order.store_name?.toLowerCase() || '',
      order.segment?.toLowerCase() || '',
      order.area?.toLowerCase() || '',
      order.agent_name?.toLowerCase() || '',
      order.status_order?.toLowerCase() || '',
      order.status_payment?.toLowerCase() || '',
      order.payment_type?.toLowerCase() || '',
      order.business_type?.toLowerCase() || '',
      order.sub_business_type?.toLowerCase() || '',
      calculateOverdueStatus(order).toLowerCase(),
    ];

    return searchableFields.some((field) =>
      field.includes(query.toLowerCase())
    );
  };

  const filteredOrders = orders.filter((o) => {
    // Apply filters
    if (segmentFilter && o.segment !== segmentFilter) return false;
    if (areaFilter && o.area !== areaFilter) return false;
    if (agentFilter && o.agent_name !== agentFilter) return false;
    if (statusOrderFilter && o.status_order !== statusOrderFilter) return false;
    if (paymentStatusFilter && o.status_payment !== paymentStatusFilter) return false;

    // Search functionality
    if (searchQuery) {
      return searchFields(o, searchQuery);
    }

    return true;
  });

  // Reset page when local filters change
  useEffect(() => {
    setPage(0);
  }, [segmentFilter, areaFilter, agentFilter, statusOrderFilter, paymentStatusFilter, searchQuery]);

  const uniqueSegments = Array.from(new Set(orders.map((o) => o.segment)));
  const uniqueAreas = Array.from(new Set(orders.map((o) => o.area)));
  const uniqueAgents = Array.from(new Set(orders.map((o) => o.agent_name)));
  const uniqueStatusOrders = Array.from(new Set(orders.map((o) => o.status_order)));
  const uniquePaymentStatuses = Array.from(new Set(orders.map((o) => o.status_payment)));

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    let aValue: any = a[orderBy];
    let bValue: any = b[orderBy];

    if (orderBy === 'total_invoice' || orderBy === 'profit') {
      aValue = Number(aValue);
      bValue = Number(bValue);
    }

    if (orderBy === 'order_date' || orderBy === 'faktur_date' || orderBy === 'payment_due_date') {
      aValue = aValue ? new Date(aValue).getTime() : 0;
      bValue = bValue ? new Date(bValue).getTime() : 0;
    }

    // Special handling for overdue_status field - use calculated value
    if (orderBy === 'overdue_status') {
      const getOverduePriority = (status: string) => {
        if (!status) return 6; // null status gets lowest priority
        if (status === 'CURRENT') return 0;
        if (status === 'B2W') return 1;
        if (status.includes('14DPD')) return 2;
        if (status.includes('40DPD')) return 3;
        if (status.includes('60DPD')) return 4;
        if (status.includes('90DPD')) return 5;
        return 6; // for any other status
      };
      
      aValue = getOverduePriority(calculateOverdueStatus(a));
      bValue = getOverduePriority(calculateOverdueStatus(b));
    } else if (typeof aValue === 'string' && typeof bValue === 'string') {
      // Handle string comparisons for other text fields
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
  
  // Calculate unique stores based on user_id
  const uniqueStores = new Set(filteredOrders.map(o => o.user_id));
  const storeCount = uniqueStores.size;

  // Calculate store details grouped by store
  const getStoreDetails = () => {
    interface StoreDetail {
      userId: string;
      storeName: string;
      resellerName: string;
      agentName: string;
      businessType: string;
      subBusinessType: string;
      segment: string;
      area: string;
      totalInvoice: number;
      totalProfit: number;
      orderCount: number;
      overdueStatuses: string[];
    }

    const storeDetails = new Map<string, StoreDetail>();
    
    filteredOrders.forEach(order => {
      const storeId = order.user_id;
      if (!storeDetails.has(storeId)) {
        storeDetails.set(storeId, {
          userId: storeId,
          storeName: order.store_name,
          resellerName: order.reseller_name,
          agentName: order.agent_name,
          businessType: order.business_type,
          subBusinessType: order.sub_business_type,
          segment: order.segment,
          area: order.area,
          totalInvoice: 0,
          totalProfit: 0,
          orderCount: 0,
          overdueStatuses: []
        });
      }
      
      const store = storeDetails.get(storeId)!;
      store.totalInvoice += Number(order.total_invoice) || 0;
      store.totalProfit += Number(order.profit) || 0;
      store.orderCount += 1;
      const overdueStatus = calculateOverdueStatus(order);
      if (overdueStatus && !store.overdueStatuses.includes(overdueStatus)) {
        store.overdueStatuses.push(overdueStatus);
      }
    });

    // Sort by total invoice descending
    return Array.from(storeDetails.values()).sort((a, b) => b.totalInvoice - a.totalInvoice);
  };

  const prepareDataForExport = (orders: Order[]) => {
    // Add summary row at the beginning
    const summaryRow = {
      'Order Code': 'SUMMARY',
      'Month': '',
      'Reseller Name': '',
      'Store Name': '',
      'Segment': '',
      'Area': '',
      'Agent': '',
      'Order Status': '',
      'Payment Status': '',
      'Payment Type': '',
      'Order Date': '',
      'Faktur Date': '',
      'Due Date': '',
      'Overdue Status': '',
      'Total Invoice': totalInvoice,
      'Profit': totalProfit,
      'Business Type': `Stores: ${storeCount} | Total Orders: ${totalOrders}`,
      'Sub Business Type': '',
    };
    
    const orderData = orders.map((o) => ({
      'Order Code': o.order_code,
      'Month': o.month,
      'Reseller Name': o.reseller_name,
      'Store Name': o.store_name,
      'Segment': o.segment,
      'Area': o.area,
      'Agent': o.agent_name,
      'Order Status': o.status_order,
      'Payment Status': o.status_payment,
      'Payment Type': o.payment_type,
      'Order Date': formatDate(o.order_date),
      'Faktur Date': o.faktur_date ? formatDate(o.faktur_date) : '',
      'Due Date': o.payment_due_date ? formatDate(o.payment_due_date) : '',
      'Overdue Status': calculateOverdueStatus(o) || '',
      'Total Invoice': o.total_invoice,
      'Profit': o.profit,
      'Business Type': o.business_type,
      'Sub Business Type': o.sub_business_type,
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
      { wch: 15 }, // Month
      { wch: 25 }, // Reseller Name
      { wch: 25 }, // Store Name
      { wch: 15 }, // Segment
      { wch: 15 }, // Area
      { wch: 20 }, // Agent
      { wch: 15 }, // Order Status
      { wch: 15 }, // Payment Status
      { wch: 15 }, // Payment Type
      { wch: 15 }, // Order Date
      { wch: 15 }, // Faktur Date
      { wch: 15 }, // Due Date
      { wch: 15 }, // Overdue Status
      { wch: 15 }, // Total Invoice
      { wch: 15 }, // Profit
      { wch: 20 }, // Business Type
      { wch: 25 }, // Sub Business Type
    ];
    ws['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Overdue Orders');

    // Generate Excel file
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    // Download file
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `overdue-orders.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const clearAllFilters = () => {
    setSegmentFilter('');
    setAreaFilter('');
    setAgentFilter('');
    setStatusOrderFilter('');
    setPaymentStatusFilter('');
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

  return (
    <Card>
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
              onClick={fetchOverdueOrdersData}
              disabled={loading}
              sx={{ mr: 1 }}
            >
              Refresh
            </Button>
            <Button
              variant="outlined"
              startIcon={<InfoIcon />}
              onClick={() => setDetailsModalOpen(true)}
              disabled={filteredOrders.length === 0}
              sx={{ mr: 1 }}
            >
              Overview
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
              disabled={!segmentFilter && !areaFilter && !agentFilter && !statusOrderFilter && !paymentStatusFilter && !searchQuery}
            >
              Clear Filters
            </Button>
          </Box>
        </Box>

        {/* Summary Stats */}
        <Box mb={3} sx={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
          <Box sx={{ textAlign: 'center', minWidth: '200px' }}>
            <Typography variant="h3" color="primary" fontWeight="bold" mb={1}>
              {!filters.start_date || !filters.end_date ? '--' : storeCount}
            </Typography>
            <Typography variant="h6" color="textSecondary" fontWeight="500">
              Unique Stores
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center', minWidth: '200px' }}>
            <Typography variant="h3" color="secondary" fontWeight="bold" mb={1}>
              {!filters.start_date || !filters.end_date ? '--' : totalOrders}
            </Typography>
            <Typography variant="h6" color="textSecondary" fontWeight="500">
              Total Orders
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center', minWidth: '200px' }}>
            <Typography variant="h3" color="info.main" fontWeight="bold" mb={1}>
              {!filters.start_date || !filters.end_date ? '--' : formatCurrency(totalInvoice)}
            </Typography>
            <Typography variant="h6" color="textSecondary" fontWeight="500">
              Total Invoice Amount
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center', minWidth: '200px' }}>
            <Typography variant="h3" color="success.main" fontWeight="bold" mb={1}>
              {!filters.start_date || !filters.end_date ? '--' : formatCurrency(totalProfit)}
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
                placeholder="Search overdue orders..."
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
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Order Status</InputLabel>
                <Select
                  value={statusOrderFilter}
                  label="Order Status"
                  onChange={(e) => setStatusOrderFilter(e.target.value)}
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  {uniqueStatusOrders.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Payment Status</InputLabel>
                <Select
                  value={paymentStatusFilter}
                  label="Payment Status"
                  onChange={(e) => setPaymentStatusFilter(e.target.value)}
                >
                  <MenuItem value="">All Payment Statuses</MenuItem>
                  {uniquePaymentStatuses.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Segment</InputLabel>
                <Select
                  value={segmentFilter}
                  label="Segment"
                  onChange={(e) => setSegmentFilter(e.target.value)}
                >
                  <MenuItem value="">All Segments</MenuItem>
                  {uniqueSegments.map((segment) => (
                    <MenuItem key={segment} value={segment}>
                      {segment}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Area</InputLabel>
                <Select
                  value={areaFilter}
                  label="Area"
                  onChange={(e) => setAreaFilter(e.target.value)}
                >
                  <MenuItem value="">All Areas</MenuItem>
                  {uniqueAreas.map((area) => (
                    <MenuItem key={area} value={area}>
                      {area}
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
                      {!filters.start_date || !filters.end_date ? 'Please select start date and end date to view overdue orders' : 'No overdue orders found'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                sortedOrders
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((row) => (
                    <TableRow 
                      key={row.order_id} 
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
                      <TableCell>
                        <Chip
                          label={row.month}
                          size="small"
                          variant="outlined"
                          color="primary"
                        />
                      </TableCell>
                      <TableCell>{row.reseller_name}</TableCell>
                      <TableCell>{row.store_name}</TableCell>
                      <TableCell>
                        <Chip
                          label={row.segment}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={row.area}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{row.agent_name}</TableCell>
                      <TableCell>
                        <Chip
                          label={row.status_order}
                          color={getOrderStatusColor(row.status_order) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={row.status_payment}
                          color={getPaymentStatusColor(row.status_payment) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{row.payment_type}</TableCell>
                      <TableCell>{formatDate(row.order_date)}</TableCell>
                      <TableCell>{row.faktur_date ? formatDate(row.faktur_date) : '-'}</TableCell>
                      <TableCell>{formatDate(row.payment_due_date)}</TableCell>
                      <TableCell>
                        {(() => {
                          const overdueStatus = calculateOverdueStatus(row);
                          return overdueStatus ? (
                            <Chip
                              label={overdueStatus}
                              color={getOverdueStatusColor(overdueStatus) as any}
                              size="small"
                            />
                          ) : (
                            '-'
                          );
                        })()}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        {formatCurrency(Number(row.total_invoice))}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                        {formatCurrency(Number(row.profit))}
                      </TableCell>
                      <TableCell>{row.business_type}</TableCell>
                      <TableCell>{row.sub_business_type}</TableCell>
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

      {/* Store Details Modal */}
      <Dialog
        open={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Overdue Orders by Store
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {getStoreDetails().map((store, index) => (
              <Accordion key={index} defaultExpanded>
                <AccordionSummary>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', pr: 2 }}>
                    <Box>
                      <Typography variant="h6" fontWeight="bold">
                        {store.storeName}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {store.resellerName} • {store.segment} • {store.area}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <Typography variant="body2" color="textSecondary">
                        Orders: {store.orderCount}
                      </Typography>
                      <Typography variant="body2" color="primary.main" fontWeight="bold">
                        Invoice: {formatCurrency(store.totalInvoice)}
                      </Typography>
                      <Typography variant="body2" color="success.main" fontWeight="bold">
                        Profit: {formatCurrency(store.totalProfit)}
                      </Typography>
                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      <strong>Agent:</strong> {store.agentName || '-'} • <strong>Business Type:</strong> {store.businessType} • <strong>Sub Type:</strong> {store.subBusinessType}
                    </Typography>
                    {store.overdueStatuses.length > 0 && (
                      <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Typography variant="body2" color="textSecondary">
                          <strong>Overdue Statuses:</strong>
                        </Typography>
                        {store.overdueStatuses.map((status, idx) => (
                          <Chip
                            key={idx}
                            label={status}
                            color={getOverdueStatusColor(status) as any}
                            size="small"
                          />
                        ))}
                      </Box>
                    )}
                  </Box>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Order Code</TableCell>
                          <TableCell>Order Date</TableCell>
                          <TableCell>Faktur Date</TableCell>
                          <TableCell>Due Date</TableCell>
                          <TableCell>Overdue Status</TableCell>
                          <TableCell align="right">Total Invoice</TableCell>
                          <TableCell align="right">Profit</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredOrders
                          .filter(o => o.user_id === store.userId)
                          .map((order) => (
                            <TableRow key={order.order_id}>
                              <TableCell>
                                <Typography variant="body2" fontWeight="medium">
                                  {order.order_code}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">
                                  {formatDate(order.order_date)}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">
                                  {order.faktur_date ? formatDate(order.faktur_date) : '-'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">
                                  {formatDate(order.payment_due_date)}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                {(() => {
                                  const overdueStatus = calculateOverdueStatus(order);
                                  return overdueStatus ? (
                                    <Chip
                                      label={overdueStatus}
                                      color={getOverdueStatusColor(overdueStatus) as any}
                                      size="small"
                                    />
                                  ) : (
                                    '-'
                                  );
                                })()}
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body2" fontWeight="bold" color="primary.main">
                                  {formatCurrency(Number(order.total_invoice))}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body2" fontWeight="bold" color="success.main">
                                  {formatCurrency(Number(order.profit))}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsModalOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default OverdueOrdersTable;

