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
import { fetchCashInList, CashInListItem } from '../../api/distribusi/DistribusiSlice';
import OrderDetailModal from '../shared/OrderDetailModal';

type OrderDirection = 'asc' | 'desc';
type SortableField = keyof CashInListItem;

interface HeadCell {
  id: SortableField;
  label: string;
  numeric: boolean;
}

const headCells: HeadCell[] = [
  { id: 'order_code', label: 'Order Code', numeric: false },
  { id: 'store_name', label: 'Store Name', numeric: false },
  { id: 'segment', label: 'Segment', numeric: false },
  { id: 'area', label: 'Area', numeric: false },
  { id: 'agent_name', label: 'Agent', numeric: false },
  { id: 'type', label: 'Payment Type', numeric: false },
  { id: 'repayment_type', label: 'Repayment Type', numeric: false },
  { id: 'payment_date', label: 'Payment Date', numeric: false },
  { id: 'total_paid', label: 'Total Paid', numeric: true },
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
  const [orders, setOrders] = useState<CashInListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderBy, setOrderBy] = useState<SortableField>('payment_date');
  const [order, setOrder] = useState<OrderDirection>('desc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [segmentFilter, setSegmentFilter] = useState<string>('');
  const [areaFilter, setAreaFilter] = useState<string>('');
  const [agentFilter, setAgentFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [repaymentTypeFilter, setRepaymentTypeFilter] = useState<string>('');
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
      const response = await fetchCashInList({
        month: filters.payment_month,
        sortTime: 'desc',
        agent: agentName || filters.agent,
        segment: filters.segment,
        area: filters.area
      });
      
      setOrders(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Failed to fetch cash-in list data:', err);
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

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'TOP': return 'info';
      case 'COD': return 'success';
      default: return 'default';
    }
  };

  const getRepaymentTypeColor = (type: string) => {
    switch (type) {
      case 'FULL': return 'success';
      case 'PARTIAL': return 'warning';
      default: return 'default';
    }
  };

  const searchFields = (order: CashInListItem, query: string): boolean => {
    if (!query) return true;

    const searchableFields = [
      order.order_code?.toLowerCase() || '',
      order.store_name?.toLowerCase() || '',
      order.segment?.toLowerCase() || '',
      order.area?.toLowerCase() || '',
      order.agent_name?.toLowerCase() || '',
      order.type?.toLowerCase() || '',
      order.repayment_type?.toLowerCase() || '',
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
    if (typeFilter && o.type !== typeFilter) return false;
    if (repaymentTypeFilter && o.repayment_type !== repaymentTypeFilter) return false;

    // Search functionality
    if (searchQuery) {
      return searchFields(o, searchQuery);
    }

    return true;
  });

  // Reset page when local filters change
  useEffect(() => {
    setPage(0);
  }, [segmentFilter, areaFilter, agentFilter, typeFilter, repaymentTypeFilter, searchQuery]);

  const uniqueSegments = Array.from(new Set(orders.map((o) => o.segment)));
  const uniqueAreas = Array.from(new Set(orders.map((o) => o.area)));
  const uniqueAgents = Array.from(new Set(orders.map((o) => o.agent_name)));
  const uniqueTypes = Array.from(new Set(orders.map((o) => o.type)));
  const uniqueRepaymentTypes = Array.from(new Set(orders.map((o) => o.repayment_type)));

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    let aValue: any = a[orderBy];
    let bValue: any = b[orderBy];

    if (orderBy === 'total_paid') {
      aValue = Number(aValue);
      bValue = Number(bValue);
    }

    if (orderBy === 'payment_date') {
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

  const totalPaid = filteredOrders.reduce((sum, o) => sum + Number(o.total_paid) || 0, 0);
  const totalOrders = filteredOrders.length;

  const prepareDataForExport = (orders: CashInListItem[]) => {
    return orders.map((o) => ({
      'Order Code': o.order_code,
      'Store Name': o.store_name,
      'Segment': o.segment,
      'Area': o.area,
      'Agent': o.agent_name,
      'Payment Type': o.type,
      'Repayment Type': o.repayment_type,
      'Payment Date': o.payment_date ? formatDate(o.payment_date) : 'No Payment Date',
      'Total Paid': o.total_paid,
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
      { wch: 25 }, // Store Name
      { wch: 15 }, // Segment
      { wch: 15 }, // Area
      { wch: 20 }, // Agent
      { wch: 15 }, // Payment Type
      { wch: 15 }, // Repayment Type
      { wch: 15 }, // Payment Date
      { wch: 15 }, // Total Paid
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

  // Removed prepareDetailDataForExport - not needed for new API structure
  const prepareDetailDataForExport = (_fullOrders: any[]): any[] => {
    // This function is no longer needed with the new API structure
    return [];
  };

  // Removed handleDetailDownload - not needed for new API structure
  const handleDetailDownload = async () => {
    // Detail download is not available with the new cash-in list API
    alert('Detail download is not available with the new API structure');
  };

  const clearAllFilters = () => {
    setSegmentFilter('');
    setAreaFilter('');
    setAgentFilter('');
    setTypeFilter('');
    setRepaymentTypeFilter('');
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
              disabled={!segmentFilter && !areaFilter && !agentFilter && !typeFilter && !repaymentTypeFilter && !searchQuery}
            >
              Clear Filters
            </Button>
          </Box>
        </Box>

        {/* Summary Stats */}
        <Box mb={3} sx={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
          <Box sx={{ textAlign: 'center', minWidth: '200px' }}>
            <Typography variant="h3" color="primary" fontWeight="bold" mb={1}>
              {!filters.payment_month ? '--' : formatCurrency(totalPaid)}
            </Typography>
            <Typography variant="h6" color="textSecondary" fontWeight="500">
              Total Paid
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
              {!filters.payment_month ? '--' : (totalOrders > 0 ? formatCurrency(Math.round(totalPaid / totalOrders)) : formatCurrency(0))}
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
            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <FormControl fullWidth>
                <InputLabel>Payment Type</InputLabel>
                <Select
                  value={typeFilter}
                  label="Payment Type"
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <MenuItem value="">All Types</MenuItem>
                  {uniqueTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <FormControl fullWidth>
                <InputLabel>Repayment Type</InputLabel>
                <Select
                  value={repaymentTypeFilter}
                  label="Repayment Type"
                  onChange={(e) => setRepaymentTypeFilter(e.target.value)}
                >
                  <MenuItem value="">All Types</MenuItem>
                  {uniqueRepaymentTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
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
                          label={row.type}
                          color={getTypeColor(row.type) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={row.repayment_type}
                          color={getRepaymentTypeColor(row.repayment_type) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {row.payment_date ? formatDate(row.payment_date) : 'No Payment Date'}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        {formatCurrency(row.total_paid)}
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



