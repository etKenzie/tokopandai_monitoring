'use client';

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
import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { fetchFullOrders, fetchOrders, FullOrder, Order } from '../../api/distribusi/DistribusiSlice';
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
  { id: 'payment_due_date', label: 'Payment Due Date', numeric: false },
  { id: 'payment_date', label: 'Payment Date', numeric: false },
  { id: 'total_invoice', label: 'Total Invoice', numeric: true },
  { id: 'profit', label: 'Profit', numeric: true },
];

interface CashInOrdersTableProps {
  filters: {
    payment_month?: string;
    agent?: string;
    segment?: string;
    area?: string;
    statusPayment?: string;
  };
  title?: string;
  agentName?: string;
}

const CashInOrdersTable = ({ 
  filters,
  title = 'Cash-In Orders',
  agentName
}: CashInOrdersTableProps) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderBy, setOrderBy] = useState<SortableField>('payment_date');
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
  const [fullDownloadLoading, setFullDownloadLoading] = useState(false);

  const fetchOrdersData = async () => {
    // Only fetch data if payment_month is selected
    if (!filters.payment_month) {
      setOrders([]);
      setError('Please select a payment month to view orders');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Always filter for LUNAS and PARTIAL/SEBAGIAN payment statuses for cash-in orders
      // Note: API may use "PARTIAL" or "SEBAGIAN" - using "PARTIAL" as specified by user
      const response = await fetchOrders({
        sortTime: 'desc',
        payment: 'LUNAS, PARTIAL', // Always include both LUNAS and PARTIAL for cash-in orders
        payment_month: filters.payment_month,
        agent: agentName || filters.agent,
        segment: filters.segment,
        area: filters.area
      });
      
      // Check for duplicate order_ids in the source data
      const orderIds = response.data.map(order => order.order_id);
      const uniqueOrderIds = new Set(orderIds);
      if (orderIds.length !== uniqueOrderIds.size) {
        console.warn(`Found ${orderIds.length - uniqueOrderIds.size} duplicate orders in API response`);
      }
      
      setOrders(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Failed to fetch orders data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrdersData();
    // Reset pagination when filters change
    setPage(0);
  }, [filters.payment_month, filters.agent, filters.segment, filters.area, agentName]);

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

  const getOverdueStatusColor = (status: string | null) => {
    if (!status) return 'default';
    if (status.includes('Current')) return 'success';
    if (status.includes('B2W') || status.includes('14DPD')) return 'warning';
    if (status.includes('40DPD') || status.includes('60DPD')) return 'error';
    if (status.includes('90DPD')) return 'default';
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
    ];

    return searchableFields.some((field) =>
      field.includes(query.toLowerCase())
    );
  };

  const filteredOrders = orders.filter((o) => {
    // Only show LUNAS and PARTIAL/SEBAGIAN orders (already filtered by API, but ensure consistency)
    if (o.status_payment !== 'LUNAS' && o.status_payment !== 'PARTIAL' && o.status_payment !== 'SEBAGIAN') {
      return false;
    }
    
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

    if (orderBy === 'order_date' || orderBy === 'payment_due_date' || orderBy === 'payment_date') {
      // Handle null values for date fields - put nulls at the end
      const aIsNull = !aValue;
      const bIsNull = !bValue;
      
      if (aIsNull && bIsNull) return 0;
      if (aIsNull) return 1; // null values go to the end
      if (bIsNull) return -1; // null values go to the end
      
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

  const prepareDataForExport = (orders: Order[]) => {
    return orders.map((o) => ({
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
      'Payment Due Date': getPaymentDueDateDisplay(o.payment_due_date).label,
      'Payment Date': o.payment_date ? formatDate(o.payment_date) : 'No Payment Date',
      'Total Invoice': o.total_invoice,
      'Profit': o.profit,
      'Business Type': o.business_type,
      'Sub Business Type': o.sub_business_type,
      'Overdue Status': o.overdue_status,
    }));
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
      { wch: 15 }, // Payment Due Date
      { wch: 15 }, // Payment Date
      { wch: 15 }, // Total Invoice
      { wch: 15 }, // Profit
      { wch: 20 }, // Business Type
      { wch: 25 }, // Sub Business Type
      { wch: 15 }, // Overdue Status
    ];
    ws['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Cash-In Orders');

    // Generate Excel file
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    // Download file
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cash-in-orders.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const prepareDetailDataForExport = (fullOrders: FullOrder[]) => {
    const data: any[] = [];
    
    // Filter to only include LUNAS and PARTIAL/SEBAGIAN orders
    const filteredFullOrders = fullOrders.filter((order) => 
      order.status_payment === 'LUNAS' || order.status_payment === 'PARTIAL' || order.status_payment === 'SEBAGIAN'
    );
    
    filteredFullOrders.forEach((order) => {
      if (order.detail_order && order.detail_order.length > 0) {
        order.detail_order.forEach((detail) => {
          data.push({
            'Order Code': order.order_code,
            'User ID': order.user_id,
            'Order Item ID': detail.order_item_id,
            'Month': order.month,
            'Reseller Name': order.reseller_name,
            'Store Name': order.store_name,
            'Segment': order.segment,
            'Area': order.area,
            'Agent': order.agent_name,
            'Order Status': order.status_order,
            'Payment Status': order.status_payment,
            'Payment Type': order.payment_type,
            'Order Date': formatDate(order.order_date),
            'Payment Due Date': getPaymentDueDateDisplay(order.payment_due_date).label,
            'Payment Date': order.payment_date ? formatDate(order.payment_date) : 'No Payment Date',
            'Total Invoice': detail.total_invoice, // Use total_invoice from detail_order
            'Profit': detail.profit, // Use profit from detail_order
            'Business Type': order.business_type,
            'Sub Business Type': order.sub_business_type,
            'Phone Number': order.phone_number,
            'Reseller Code': order.reseller_code,
            'Product Name': detail.product_name,
            'SKU': detail.sku,
            'Brands': detail.brands,
            'Type Category': detail.type_category,
            'Sub Category': detail.sub_category,
            'Price': detail.price,
            'Order Quantity': detail.order_quantity,
            'Stock Product': detail.stock_product,
            'Variant': detail.variant,
            'Variant Value': detail.variant_value,
            'Buy Price': detail.buy_price,
            'Principle': detail.principle,
            'Hub': detail.hub,
            'Address': detail.alamat,
          });
        });
      } else {
        // If no detail_order, add the main order data
        data.push({
          'Order Code': order.order_code,
          'User ID': order.user_id,
          'Order Item ID': '',
          'Month': order.month,
          'Reseller Name': order.reseller_name,
          'Store Name': order.store_name,
          'Segment': order.segment,
          'Area': order.area,
          'Agent': order.agent_name,
          'Order Status': order.status_order,
          'Payment Status': order.status_payment,
          'Payment Type': order.payment_type,
          'Order Date': formatDate(order.order_date),
          'Payment Due Date': getPaymentDueDateDisplay(order.payment_due_date).label,
          'Payment Date': order.payment_date ? formatDate(order.payment_date) : 'No Payment Date',
          'Total Invoice': order.total_invoice,
          'Profit': order.profit,
          'Business Type': order.business_type,
          'Sub Business Type': order.sub_business_type,
          'Phone Number': order.phone_number,
          'Reseller Code': order.reseller_code,
          'Product Name': '',
          'SKU': '',
          'Brands': '',
          'Type Category': '',
          'Sub Category': '',
          'Price': '',
          'Order Quantity': '',
          'Stock Product': '',
          'Variant': '',
          'Variant Value': '',
          'Buy Price': '',
          'Principle': '',
          'Hub': '',
          'Address': '',
        });
      }
    });
    
    return data;
  };

  const handleDetailDownload = async () => {
    if (!filters.payment_month) {
      alert('Please select a payment month to download detail data');
      return;
    }

    // Only run on client side
    if (typeof window === 'undefined' || typeof document === 'undefined' || typeof Blob === 'undefined') return;

    try {
      setFullDownloadLoading(true);
      
      const response = await fetchFullOrders({
        sortTime: 'desc',
        payment_month: filters.payment_month,
        agent: agentName || filters.agent,
        segment: filters.segment,
        area: filters.area,
        status_payment: paymentStatusFilter || undefined
      });

      const data = prepareDetailDataForExport(response.data);
      
      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);

      // Set column widths
      const colWidths = [
        { wch: 15 }, // Order Code
        { wch: 15 }, // User ID
        { wch: 25 }, // Order Item ID
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
        { wch: 15 }, // Payment Due Date
        { wch: 15 }, // Payment Date
        { wch: 15 }, // Total Invoice
        { wch: 15 }, // Profit
        { wch: 20 }, // Business Type
        { wch: 25 }, // Sub Business Type
        { wch: 15 }, // Phone Number
        { wch: 25 }, // Reseller Code
        { wch: 30 }, // Product Name
        { wch: 15 }, // SKU
        { wch: 15 }, // Brands
        { wch: 20 }, // Type Category
        { wch: 20 }, // Sub Category
        { wch: 15 }, // Price
        { wch: 15 }, // Order Quantity
        { wch: 15 }, // Stock Product
        { wch: 15 }, // Variant
        { wch: 15 }, // Variant Value
        { wch: 15 }, // Buy Price
        { wch: 25 }, // Principle
        { wch: 15 }, // Hub
        { wch: 40 }, // Address
      ];
      ws['!cols'] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Cash-In Orders Detail');

      // Generate Excel file
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      // Download file
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cash-in-orders-detail-${filters.payment_month.replace(' ', '-').toLowerCase()}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download detail data:', error);
      alert('Failed to download detail data. Please try again.');
    } finally {
      setFullDownloadLoading(false);
    }
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

  const getPaymentDueDateDisplay = (dueDate: string | null) => {
    if (!dueDate) return { label: 'No Due Date', color: 'default' };
    
    return { 
      label: formatDate(dueDate), 
      color: 'default' 
    };
  };

  const getPaymentDateDisplay = (paymentDate: string | null) => {
    if (!paymentDate) return { label: 'No Payment Date', color: 'default' };
    
    return { 
      label: formatDate(paymentDate), 
      color: 'success' 
    };
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
              startIcon={fullDownloadLoading ? <CircularProgress size={16} /> : <DownloadIcon />}
              onClick={handleDetailDownload}
              disabled={!filters.payment_month || fullDownloadLoading}
              sx={{ mr: 1 }}
            >
              {fullDownloadLoading ? 'Downloading...' : 'Download Detail'}
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
              {!filters.payment_month ? '--' : formatCurrency(totalInvoice)}
            </Typography>
            <Typography variant="h6" color="textSecondary" fontWeight="500">
              Total Invoice Amount
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center', minWidth: '200px' }}>
            <Typography variant="h3" color="success.main" fontWeight="bold" mb={1}>
              {!filters.payment_month ? '--' : formatCurrency(totalProfit)}
            </Typography>
            <Typography variant="h6" color="textSecondary" fontWeight="500">
              Total Profit
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center', minWidth: '200px' }}>
            <Typography variant="h3" color="info.main" fontWeight="bold" mb={1}>
              {!filters.payment_month ? '--' : totalOrders}
            </Typography>
            <Typography variant="h6" color="textSecondary" fontWeight="500">
              Total Orders
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center', minWidth: '200px' }}>
            <Typography variant="h3" color="warning.main" fontWeight="bold" mb={1}>
              {!filters.payment_month ? '--' : (totalOrders > 0 ? formatCurrency(Math.round(totalInvoice / totalOrders)) : formatCurrency(0))}
            </Typography>
            <Typography variant="h6" color="textSecondary" fontWeight="500">
              Avg Order Value
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
                      {!filters.payment_month ? 'Please select a payment month to view orders' : 'No orders found'}
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
                      <TableCell>
                        {(() => {
                          const dueDateDisplay = getPaymentDueDateDisplay(row.payment_due_date);
                          return (
                            <Chip
                              label={dueDateDisplay.label}
                              color={dueDateDisplay.color as any}
                              size="small"
                            />
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const paymentDateDisplay = getPaymentDateDisplay(row.payment_date);
                          return (
                            <Chip
                              label={paymentDateDisplay.label}
                              color={paymentDateDisplay.color as any}
                              size="small"
                            />
                          );
                        })()}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        {formatCurrency(row.total_invoice)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                        {formatCurrency(row.profit)}
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

export default CashInOrdersTable;

