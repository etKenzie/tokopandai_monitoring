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
import { fetchOrders, Order } from '../../api/distribusi/DistribusiSlice';
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
  { id: 'reseller_name', label: 'Reseller Name', numeric: false },
  { id: 'store_name', label: 'Store Name', numeric: false },
  { id: 'segment', label: 'Segment', numeric: false },
  { id: 'area', label: 'Area', numeric: false },
  { id: 'agent_name', label: 'Agent', numeric: false },
  { id: 'overdue_status', label: 'Overdue Status', numeric: false },
  { id: 'status_payment', label: 'Payment Status', numeric: false },
  { id: 'payment_type', label: 'Payment Type', numeric: false },
  { id: 'order_date', label: 'Order Date', numeric: false },
  { id: 'payment_due_date', label: 'Payment Due Date', numeric: false },
  { id: 'total_invoice', label: 'Total Invoice', numeric: true },
];

interface DistribusiOverdueTableProps {
  filters: {
    month?: string;
    agent?: string;
    segment?: string;
    area?: string;
  };
  title?: string;
  agentName?: string;
}

const DistribusiOverdueTable = ({ 
  filters,
  title = 'Distribusi Overdue Orders',
  agentName
}: DistribusiOverdueTableProps) => {
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
  const [overdueStatusFilter, setOverdueStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedOrderCode, setSelectedOrderCode] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchOverdueData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchOrders({
        sortTime: 'desc',
        payment: 'BELUM LUNAS',
        month: filters.month,
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
      console.error('Failed to fetch overdue data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverdueData();
    // Reset pagination when filters change
    setPage(0);
  }, [filters.month, filters.agent, filters.segment, filters.area, agentName]);

  const handleRequestSort = (property: SortableField) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
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
      order.overdue_status?.toLowerCase() || '',
      order.status_payment?.toLowerCase() || '',
      order.payment_type?.toLowerCase() || '',
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
    if (overdueStatusFilter && o.overdue_status !== overdueStatusFilter) return false;

    // Search functionality
    if (searchQuery) {
      return searchFields(o, searchQuery);
    }

    return true;
  });

  // Remove duplicates based on order_id to prevent table errors
  const uniqueFilteredOrders = filteredOrders.filter((order, index, self) => 
    index === self.findIndex(o => o.order_id === order.order_id)
  );

  // Reset page when local filters change
  useEffect(() => {
    setPage(0);
  }, [segmentFilter, areaFilter, agentFilter, overdueStatusFilter, searchQuery]);

  // Ensure page doesn't exceed available data
  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(uniqueFilteredOrders.length / rowsPerPage) - 1);
    if (page > maxPage) {
      setPage(maxPage);
    }
  }, [uniqueFilteredOrders.length, rowsPerPage, page]);

  const uniqueSegments = Array.from(new Set(orders.map((o) => o.segment)));
  const uniqueAreas = Array.from(new Set(orders.map((o) => o.area)));
  const uniqueAgents = Array.from(new Set(orders.map((o) => o.agent_name)));
  const uniqueOverdueStatuses = Array.from(new Set(orders.map((o) => o.overdue_status)));

  const sortedOrders = [...uniqueFilteredOrders].sort((a, b) => {
    let aValue: any = a[orderBy];
    let bValue: any = b[orderBy];

    if (orderBy === 'total_invoice') {
      aValue = Number(aValue);
      bValue = Number(bValue);
    }

    if (orderBy === 'order_date' || orderBy === 'payment_due_date') {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    }

         // Special handling for overdue_status field
     if (orderBy === 'overdue_status') {
       const getOverduePriority = (status: string | null) => {
         if (!status) return 6; // null status gets lowest priority
         if (status.includes('CURRENT')) return 0;
         if (status.includes('B2W')) return 1;
         if (status.includes('14DPD')) return 2;
         if (status.includes('40DPD')) return 3;
         if (status.includes('60DPD')) return 4;
         if (status.includes('90DPD')) return 5;
         return 6; // for any other status
       };
       
       aValue = getOverduePriority(aValue);
       bValue = getOverduePriority(bValue);
     }

    // Handle string comparisons for other text fields
    if (typeof aValue === 'string' && typeof bValue === 'string' && orderBy !== 'overdue_status') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (order === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return bValue < aValue ? -1 : bValue > aValue ? 1 : 0;
    }
  });

  const totalInvoice = uniqueFilteredOrders.reduce((sum, o) => sum + Number(o.total_invoice) || 0, 0);
  const totalOrders = uniqueFilteredOrders.length;

  const prepareDataForExport = (orders: Order[]) => {
    return orders.map((o) => ({
      'Order Code': o.order_code,
      'Reseller Name': o.reseller_name,
      'Store Name': o.store_name,
      'Segment': o.segment,
      'Area': o.area,
      'Agent': o.agent_name,
      'Overdue Status': o.overdue_status,
      'Payment Status': o.status_payment,
      'Payment Type': o.payment_type,
      'Order Date': formatDate(o.order_date),
      'Payment Due Date': getPaymentDueDateDisplay(o.payment_due_date).label,
      'Total Invoice': o.total_invoice,
    }));
  };

  const handleExcelExport = () => {
    if (!orders.length) return;

    // Only run on client side
    if (typeof window === 'undefined' || typeof document === 'undefined' || typeof Blob === 'undefined') return;

    const data = prepareDataForExport(uniqueFilteredOrders);
    
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
      { wch: 20 }, // Agent
      { wch: 15 }, // Overdue Status
      { wch: 15 }, // Payment Status
      { wch: 15 }, // Payment Type
      { wch: 15 }, // Order Date
      { wch: 15 }, // Payment Due Date
      { wch: 15 }, // Total Invoice
    ];
    ws['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Distribusi Overdue Orders');

    // Generate Excel file
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    // Download file
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `distribusi-overdue-orders.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleRowClick = (orderCode: string) => {
    setSelectedOrderCode(orderCode);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedOrderCode(null);
  };

  const clearAllFilters = () => {
    setSegmentFilter('');
    setAreaFilter('');
    setAgentFilter('');
    setOverdueStatusFilter('');
    setSearchQuery('');
    setPage(0);
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
    
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { label: `${Math.abs(diffDays)} Days Overdue`, color: 'error' };
    } else if (diffDays === 0) {
      return { label: 'Due Today', color: 'warning' };
    } else if (diffDays <= 7) {
      return { label: `${diffDays} Days Remaining`, color: 'warning' };
    } else {
      return { label: `${diffDays} Days Remaining`, color: 'success' };
    }
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
               onClick={fetchOverdueData}
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
               disabled={!segmentFilter && !areaFilter && !agentFilter && !overdueStatusFilter && !searchQuery}
             >
               Clear Filters
             </Button>
           </Box>
         </Box>

        {/* Summary Stats */}
        <Box mb={3} sx={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
          <Box sx={{ textAlign: 'center', minWidth: '200px' }}>
            <Typography variant="h3" color="error" fontWeight="bold" mb={1}>
              {formatCurrency(totalInvoice)}
            </Typography>
            <Typography variant="h6" color="textSecondary" fontWeight="500">
              Total Invoice Amount
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center', minWidth: '200px' }}>
            <Typography variant="h3" color="primary" fontWeight="bold" mb={1}>
              {totalOrders}
            </Typography>
            <Typography variant="h6" color="textSecondary" fontWeight="500">
              Total Overdue Orders
            </Typography>
          </Box>
                      <Box sx={{ textAlign: 'center', minWidth: '200px' }}>
              <Typography variant="h3" color="warning.main" fontWeight="bold" mb={1}>
                {totalOrders > 0 ? formatCurrency(Math.round(totalInvoice / totalOrders)) : formatCurrency(0)}
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
                <InputLabel>Overdue Status</InputLabel>
                <Select
                  value={overdueStatusFilter}
                  label="Overdue Status"
                  onChange={(e) => setOverdueStatusFilter(e.target.value)}
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  {uniqueOverdueStatuses.map((status) => (
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
                      No overdue orders found
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
                          label={row.overdue_status}
                          color={getOverdueStatusColor(row.overdue_status) as any}
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
                      <TableCell align="right" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                        {formatCurrency(row.total_invoice)}
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
                     <TablePagination
             rowsPerPageOptions={[5, 10, 25, 50]}
             component="div"
             count={uniqueFilteredOrders.length}
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

export default DistribusiOverdueTable;
