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
import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { ProductOrder } from '../../api/distribusi/ProductSlice';

type OrderDirection = 'asc' | 'desc';
type SortableField = keyof ProductOrder;

interface HeadCell {
  id: SortableField;
  label: string;
  numeric: boolean;
}

const headCells: HeadCell[] = [
  { id: 'order_code', label: 'Order Code', numeric: false },
  { id: 'reseller_name', label: 'Reseller Name', numeric: false },
  { id: 'store_name', label: 'Store Name', numeric: false },
  { id: 'segment', label: 'Segment', numeric: false },
  { id: 'area', label: 'Area', numeric: false },
  { id: 'status_order', label: 'Order Status', numeric: false },
  { id: 'status_payment', label: 'Payment Status', numeric: false },
  { id: 'payment_type', label: 'Payment Type', numeric: false },
  { id: 'order_date', label: 'Order Date', numeric: false },
  { id: 'payment_due_date', label: 'Due Date', numeric: false },
  { id: 'total_invoice', label: 'Total Invoice', numeric: true },
  { id: 'agent_name', label: 'Agent', numeric: false },
  { id: 'business_type', label: 'Business Type', numeric: false },
  { id: 'profit', label: 'Profit', numeric: true },
  { id: 'overdue_status', label: 'Overdue Status', numeric: false },
];

interface ProductOrdersTableProps {
  orders: ProductOrder[];
  loading?: boolean;
  onRefresh?: () => void;
  title?: string;
}

const ProductOrdersTable = ({ 
  orders, 
  loading = false, 
  onRefresh,
  title = 'Product Orders'
}: ProductOrdersTableProps) => {
  const [orderBy, setOrderBy] = useState<SortableField>('order_date');
  const [order, setOrder] = useState<OrderDirection>('desc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [segmentFilter, setSegmentFilter] = useState<string>('');
  const [areaFilter, setAreaFilter] = useState<string>('');
  const [statusOrderFilter, setStatusOrderFilter] = useState<string>('');
  const [statusPaymentFilter, setStatusPaymentFilter] = useState<string>('');
  const [agentFilter, setAgentFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

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

  const getStatusOrderColor = (status: string) => {
    switch (status) {
      case 'PACKAGED': return 'success';
      case 'SHIPPED': return 'info';
      case 'DELIVERED': return 'success';
      case 'CANCELLED': return 'error';
      case 'PENDING': return 'warning';
      default: return 'default';
    }
  };

  const getStatusPaymentColor = (status: string) => {
    switch (status) {
      case 'LUNAS': return 'success';
      case 'BELUM LUNAS': return 'error';
      case 'PARTIAL': return 'warning';
      default: return 'default';
    }
  };

  const getOverdueStatusColor = (status: string) => {
    switch (status) {
      case 'Current': return 'success';
      case 'Overdue': return 'error';
      case 'Due Soon': return 'warning';
      default: return 'default';
    }
  };

  const searchFields = (order: ProductOrder, query: string): boolean => {
    if (!query) return true;

    const searchableFields = [
      order.order_code?.toLowerCase() || '',
      order.reseller_name?.toLowerCase() || '',
      order.store_name?.toLowerCase() || '',
      order.segment?.toLowerCase() || '',
      order.area?.toLowerCase() || '',
      order.agent_name?.toLowerCase() || '',
      order.business_type?.toLowerCase() || '',
    ];

    return searchableFields.some((field) =>
      field.includes(query.toLowerCase())
    );
  };

  const filteredOrders = orders.filter((order) => {
    // Apply filters
    if (segmentFilter && order.segment !== segmentFilter) return false;
    if (areaFilter && order.area !== areaFilter) return false;
    if (statusOrderFilter && order.status_order !== statusOrderFilter) return false;
    if (statusPaymentFilter && order.status_payment !== statusPaymentFilter) return false;
    if (agentFilter && order.agent_name !== agentFilter) return false;

    // Search functionality
    if (searchQuery) {
      return searchFields(order, searchQuery);
    }

    return true;
  });

  // Reset page when local filters change
  useEffect(() => {
    setPage(0);
  }, [segmentFilter, areaFilter, statusOrderFilter, statusPaymentFilter, agentFilter, searchQuery]);

  const uniqueSegments = Array.from(new Set(orders.map((o) => o.segment)));
  const uniqueAreas = Array.from(new Set(orders.map((o) => o.area)));
  const uniqueStatusOrders = Array.from(new Set(orders.map((o) => o.status_order)));
  const uniqueStatusPayments = Array.from(new Set(orders.map((o) => o.status_payment)));
  const uniqueAgents = Array.from(new Set(orders.map((o) => o.agent_name)));

  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numAmount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    let aValue: any = a[orderBy];
    let bValue: any = b[orderBy];

    // Handle numeric fields
    if (orderBy === 'total_invoice' || orderBy === 'profit') {
      aValue = typeof aValue === 'string' ? parseFloat(aValue) : Number(aValue);
      bValue = typeof bValue === 'string' ? parseFloat(bValue) : Number(bValue);
    }

    // Handle date fields
    if (orderBy === 'order_date' || orderBy === 'payment_due_date') {
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

  const totalValue = filteredOrders.reduce((sum, order) => sum + (typeof order.total_invoice === 'string' ? parseFloat(order.total_invoice) : order.total_invoice), 0);
  const totalProfit = filteredOrders.reduce((sum, order) => sum + order.profit, 0);
  const totalOrders = filteredOrders.length;
  const paidOrders = filteredOrders.filter(o => o.status_payment === 'LUNAS').length;

  const prepareDataForExport = (orders: ProductOrder[]) => {
    return orders.map((o) => ({
      'Order Code': o.order_code,
      'Reseller Name': o.reseller_name,
      'Store Name': o.store_name,
      'Segment': o.segment,
      'Area': o.area,
      'Order Status': o.status_order,
      'Payment Status': o.status_payment,
      'Payment Type': o.payment_type,
      'Order Date': formatDate(o.order_date),
      'Due Date': formatDate(o.payment_due_date),
      'Total Invoice': o.total_invoice,
      'Agent': o.agent_name,
      'Business Type': o.business_type,
      'Profit': o.profit,
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
      { wch: 25 }, // Reseller Name
      { wch: 25 }, // Store Name
      { wch: 15 }, // Segment
      { wch: 15 }, // Area
      { wch: 15 }, // Order Status
      { wch: 15 }, // Payment Status
      { wch: 15 }, // Payment Type
      { wch: 15 }, // Order Date
      { wch: 15 }, // Due Date
      { wch: 15 }, // Total Invoice
      { wch: 20 }, // Agent
      { wch: 20 }, // Business Type
      { wch: 15 }, // Profit
      { wch: 15 }, // Overdue Status
    ];
    ws['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Product Orders');

    // Generate Excel file
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    // Download file
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `product-orders.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const clearAllFilters = () => {
    setSegmentFilter('');
    setAreaFilter('');
    setStatusOrderFilter('');
    setStatusPaymentFilter('');
    setAgentFilter('');
    setSearchQuery('');
    setPage(0);
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
              disabled={filteredOrders.length === 0}
              sx={{ mr: 1 }}
            >
              Export Excel
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={clearAllFilters}
              disabled={!segmentFilter && !areaFilter && !statusOrderFilter && !statusPaymentFilter && !agentFilter && !searchQuery}
            >
              Clear Filters
            </Button>
          </Box>
        </Box>

        {/* Summary Stats */}
        <Box mb={3} sx={{ display: 'flex', justifyContent: 'center', gap: 4 }}>
          <Box sx={{ textAlign: 'center', minWidth: '150px' }}>
            <Typography variant="h3" color="primary" fontWeight="bold" mb={1}>
              {totalOrders}
            </Typography>
            <Typography variant="h6" color="textSecondary" fontWeight="500">
              Total Orders
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center', minWidth: '150px' }}>
            <Typography variant="h3" color="success.main" fontWeight="bold" mb={1}>
              {formatCurrency(totalValue)}
            </Typography>
            <Typography variant="h6" color="textSecondary" fontWeight="500">
              Total Value
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center', minWidth: '150px' }}>
            <Typography variant="h3" color="info.main" fontWeight="bold" mb={1}>
              {formatCurrency(totalProfit)}
            </Typography>
            <Typography variant="h6" color="textSecondary" fontWeight="500">
              Total Profit
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center', minWidth: '150px' }}>
            <Typography variant="h3" color="warning.main" fontWeight="bold" mb={1}>
              {paidOrders}
            </Typography>
            <Typography variant="h6" color="textSecondary" fontWeight="500">
              Paid Orders
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
            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
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
            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
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
            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
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
            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
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
            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
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
          </Grid>
        </Box>

        {/* Orders Table */}
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
              ) : sortedOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={headCells.length} align="center">
                    <Typography variant="body2" color="textSecondary">
                      No orders found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                sortedOrders
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((order) => (
                    <TableRow key={order.order_id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {order.order_code}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {order.reseller_name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {order.store_name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={order.segment}
                          size="small"
                          variant="outlined"
                          color="primary"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={order.area}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={order.status_order}
                          color={getStatusOrderColor(order.status_order) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={order.status_payment}
                          color={getStatusPaymentColor(order.status_payment) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {order.payment_type}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(order.order_date)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(order.payment_due_date)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="medium">
                          {formatCurrency(order.total_invoice)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {order.agent_name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {order.business_type}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography 
                          variant="body2" 
                          fontWeight="medium"
                          color={order.profit >= 0 ? 'success.main' : 'error.main'}
                        >
                          {formatCurrency(order.profit)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={order.overdue_status}
                          color={getOverdueStatusColor(order.overdue_status) as any}
                          size="small"
                        />
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
    </Card>
  );
};

export default ProductOrdersTable;
