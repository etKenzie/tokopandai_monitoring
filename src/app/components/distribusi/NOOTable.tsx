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
import { NOOOrder, fetchNOOData } from '../../api/distribusi/DistribusiSlice';
import OrderDetailModal from '../shared/OrderDetailModal';

type OrderDirection = 'asc' | 'desc';
type SortableField = keyof NOOOrder;

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
  { id: 'total_invoice', label: 'Total Invoice', numeric: true },
  { id: 'profit', label: 'Profit', numeric: true },
  { id: 'business_type', label: 'Business Type', numeric: false },
  { id: 'sub_business_type', label: 'Sub Business Type', numeric: false },
];

interface NOOTableProps {
  filters: {
    month?: string;
    year?: string;
    agent?: string;
    area?: string;
    statusPayment?: string;
  };
  title?: string;
  // Role-based filtering props
  hasRestrictedRole?: boolean;
  userRoleForFiltering?: string;
}

const NOOTable = ({ 
  filters,
  title = 'Number of Orders (NOO)',
  hasRestrictedRole = false,
  userRoleForFiltering
}: NOOTableProps) => {
  const [orders, setOrders] = useState<NOOOrder[]>([]);
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

  const fetchNOOOrdersData = async () => {
    // Clear existing data immediately when fetching new data
    setOrders([]);
    setError(null);
    
    // Only fetch data if month is selected
    if (!filters.month || !filters.year) {
      setError('Please select a month and year to view NOO orders');
      return;
    }

    setLoading(true);
    try {
      // Format month for API (e.g., "08" -> "August 2025")
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const monthIndex = parseInt(filters.month, 10) - 1;
      const monthName = monthNames[monthIndex];
      const formattedMonth = `${monthName} ${filters.year}`;
      
      console.log('NOOTable Month formatting:', {
        originalMonth: filters.month,
        monthIndex: monthIndex,
        monthName: monthName,
        formattedMonth: formattedMonth,
        year: filters.year
      });
      
      // For users with restricted roles, use their mapped agent name instead of filter selection
      const agentName = hasRestrictedRole && userRoleForFiltering 
        ? getAgentNameFromRole(userRoleForFiltering) 
        : filters.agent;

      const response = await fetchNOOData({
        sortTime: 'desc',
        month: formattedMonth,
        agent: agentName,
        area: filters.area,
        status_payment: filters.statusPayment
      });
      
      setOrders(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Failed to fetch NOO orders data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Clear data when month or year changes
  useEffect(() => {
    setOrders([]);
    setError(null);
    setPage(0);
    // Clear local filters when month/year changes
    setSegmentFilter('');
    setAreaFilter('');
    setAgentFilter('');
    setStatusOrderFilter('');
    setPaymentStatusFilter('');
    setSearchQuery('');
  }, [filters.month, filters.year]);

  useEffect(() => {
    fetchNOOOrdersData();
    // Reset pagination when filters change
    setPage(0);
  }, [filters.month, filters.year, filters.agent, filters.area, filters.statusPayment, paymentStatusFilter]);

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

  const searchFields = (order: NOOOrder, query: string): boolean => {
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

    if (orderBy === 'total_invoice' || orderBy === 'total_pembayaran' || orderBy === 'profit') {
      aValue = Number(aValue);
      bValue = Number(bValue);
    }

    if (orderBy === 'order_date') {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    }

    // Handle string comparisons for other text fields
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

  const totalInvoice = filteredOrders.reduce((sum, o) => sum + Number(o.total_invoice) || 0, 0);
  const totalProfit = filteredOrders.reduce((sum, o) => sum + Number(o.profit) || 0, 0);
  const totalOrders = filteredOrders.length;
  
  // Calculate unique stores (NOO) based on user_id
  const uniqueStores = new Set(filteredOrders.map(o => o.user_id));
  const nooCount = uniqueStores.size;

  // Calculate NOO details by business type
  const getNOODetails = () => {
    interface StoreDetail {
      storeName: string;
      resellerName: string;
      agentName: string;
      businessType: string;
      subBusinessType: string;
      totalInvoice: number;
      totalProfit: number;
      orderCount: number;
    }

    interface BusinessTypeGroup {
      stores: StoreDetail[];
      totalInvoice: number;
      totalProfit: number;
      totalStores: number;
    }

    const storeDetails = new Map<string, StoreDetail>();
    
    filteredOrders.forEach(order => {
      const storeId = order.user_id;
      if (!storeDetails.has(storeId)) {
        storeDetails.set(storeId, {
          storeName: order.store_name,
          resellerName: order.reseller_name,
          agentName: order.agent_name,
          businessType: order.business_type,
          subBusinessType: order.sub_business_type,
          totalInvoice: 0,
          totalProfit: 0,
          orderCount: 0
        });
      }
      
      const store = storeDetails.get(storeId)!;
      store.totalInvoice += Number(order.total_invoice) || 0;
      store.totalProfit += Number(order.profit) || 0;
      store.orderCount += 1;
    });

    // Group by business type
    const businessTypeGroups = new Map<string, BusinessTypeGroup>();
    
    storeDetails.forEach(store => {
      const businessType = store.businessType;
      if (!businessTypeGroups.has(businessType)) {
        businessTypeGroups.set(businessType, {
          stores: [],
          totalInvoice: 0,
          totalProfit: 0,
          totalStores: 0
        });
      }
      
      const group = businessTypeGroups.get(businessType)!;
      group.stores.push(store);
      group.totalInvoice += store.totalInvoice;
      group.totalProfit += store.totalProfit;
      group.totalStores += 1;
    });

    return Array.from(businessTypeGroups.entries()).map(([businessType, data]) => ({
      businessType,
      ...data
    }));
  };

  const prepareDataForExport = (orders: NOOOrder[]) => {
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
      'Total Invoice': totalInvoice,
      'Total Payment': totalProfit,
      'Business Type': `NOO: ${nooCount} | Total Orders: ${totalOrders}`,
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
      { wch: 15 }, // Total Invoice
      { wch: 15 }, // Profit
      { wch: 20 }, // Business Type
      { wch: 25 }, // Sub Business Type
    ];
    ws['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'NOO Orders');

    // Generate Excel file
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    // Download file
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `noo-orders.xlsx`;
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

  const formatDate = (dateString: string) => {
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
              onClick={fetchNOOOrdersData}
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
              Details
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
              {!filters.month ? '--' : nooCount}
            </Typography>
            <Typography variant="h6" color="textSecondary" fontWeight="500">
              NOO (Unique Stores)
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center', minWidth: '200px' }}>
            <Typography variant="h3" color="secondary" fontWeight="bold" mb={1}>
              {!filters.month ? '--' : totalOrders}
            </Typography>
            <Typography variant="h6" color="textSecondary" fontWeight="500">
              Total Orders
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center', minWidth: '200px' }}>
            <Typography variant="h3" color="info.main" fontWeight="bold" mb={1}>
              {!filters.month ? '--' : formatCurrency(totalInvoice)}
            </Typography>
            <Typography variant="h6" color="textSecondary" fontWeight="500">
              Total Invoice Amount
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center', minWidth: '200px' }}>
            <Typography variant="h3" color="success.main" fontWeight="bold" mb={1}>
              {!filters.month ? '--' : formatCurrency(totalProfit)}
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
                placeholder="Search NOO orders..."
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
                      {!filters.month ? 'Please select a month to view NOO orders' : 'No NOO orders found'}
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
                      <TableCell align="right" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        {formatCurrency(row.total_invoice)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                        {formatCurrency(row.profit)}
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

      {/* NOO Details Modal */}
      <Dialog
        open={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          NOO Details by Business Type
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {getNOODetails().map((group, index) => (
              <Accordion key={index} defaultExpanded>
                <AccordionSummary>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', pr: 2 }}>
                    <Typography variant="h6" fontWeight="bold">
                      {group.businessType}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 4 }}>
                      <Typography variant="body2" color="textSecondary">
                        Stores: {group.totalStores}
                      </Typography>
                      <Typography variant="body2" color="primary.main" fontWeight="bold">
                        Invoice: {formatCurrency(group.totalInvoice)}
                      </Typography>
                      <Typography variant="body2" color="success.main" fontWeight="bold">
                        Profit: {formatCurrency(group.totalProfit)}
                      </Typography>
                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Store Name</TableCell>
                          <TableCell>Agent</TableCell>
                          <TableCell>Sub Business Type</TableCell>
                          <TableCell align="right">Orders</TableCell>
                          <TableCell align="right">Total Invoice</TableCell>
                          <TableCell align="right">Total Profit</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {group.stores.map((store, storeIndex) => (
                          <TableRow key={storeIndex}>
                            <TableCell>
                              <Typography variant="body2" fontWeight="medium">
                                {store.storeName}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {store.agentName}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={store.subBusinessType}
                                size="small"
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2">
                                {store.orderCount}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" fontWeight="bold" color="primary.main">
                                {formatCurrency(store.totalInvoice)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" fontWeight="bold" color="success.main">
                                {formatCurrency(store.totalProfit)}
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

export default NOOTable;
