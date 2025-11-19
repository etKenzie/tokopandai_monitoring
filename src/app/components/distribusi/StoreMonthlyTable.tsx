'use client';

import { Download as DownloadIcon, Refresh as RefreshIcon, Search as SearchIcon } from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
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
import { useState } from 'react';
import * as XLSX from 'xlsx';
import { Store, StoreMonthly } from '../../api/distribusi/StoreSlice';
import StoreDetailModal from './StoreDetailModal';

type StoreDirection = 'asc' | 'desc';
type SortableStoreField = keyof StoreMonthly;

interface StoreHeadCell {
  id: SortableStoreField;
  label: string;
  numeric: boolean;
}

const headCells: StoreHeadCell[] = [
  { id: 'store_name', label: 'Store Name', numeric: false },
  { id: 'agent_name', label: 'Agent', numeric: false },
  { id: 'segment', label: 'Segment', numeric: false },
  { id: 'business_type', label: 'Business Type', numeric: false },
  { id: 'sub_business_type', label: 'Sub Business Type', numeric: false },
  { id: 'user_status', label: 'User Status', numeric: false },
  { id: 'total_invoice', label: 'Total Invoice', numeric: true },
  { id: 'total_profit', label: 'Total Profit', numeric: true },
  { id: 'margin', label: 'Margin %', numeric: true },
];

interface StoreMonthlyTableProps {
  stores: StoreMonthly[];
  loading?: boolean;
  onRefresh?: () => void;
  title?: string;
}

const StoreMonthlyTable = ({ 
  stores, 
  loading = false, 
  onRefresh,
  title = 'Store Monthly Performance'
}: StoreMonthlyTableProps) => {
  const [orderBy, setOrderBy] = useState<SortableStoreField>('total_invoice');
  const [order, setOrder] = useState<StoreDirection>('desc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [agentFilter, setAgentFilter] = useState<string>('');
  const [segmentFilter, setSegmentFilter] = useState<string>('');
  const [businessTypeFilter, setBusinessTypeFilter] = useState<string>('');
  const [subBusinessTypeFilter, setSubBusinessTypeFilter] = useState<string>('');
  const [userStatusFilter, setUserStatusFilter] = useState<string>('');
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleRequestSort = (property: SortableStoreField) => {
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

  // Reset page when filters change
  const handleAgentFilterChange = (value: string) => {
    setAgentFilter(value);
    setPage(0);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setPage(0);
  };

  const clearAllFilters = () => {
    setAgentFilter('');
    setSegmentFilter('');
    setBusinessTypeFilter('');
    setSubBusinessTypeFilter('');
    setUserStatusFilter('');
    setSearchQuery('');
    setPage(0);
  };

  const searchFields = (store: StoreMonthly, query: string): boolean => {
    if (!query) return true;

    const searchableFields = [
      store.store_name?.toLowerCase() || '',
      store.agent_name?.toLowerCase() || '',
      store.segment?.toLowerCase() || '',
      store.business_type?.toLowerCase() || '',
      store.sub_business_type?.toLowerCase() || '',
    ];

    return searchableFields.some((field) =>
      field.includes(query.toLowerCase())
    );
  };

  const filteredStores = stores.filter((store) => {
    // Apply search filter
    if (searchQuery && !searchFields(store, searchQuery)) {
      return false;
    }
    
    // Apply agent filter
    if (agentFilter && store.agent_name !== agentFilter) {
      return false;
    }
    
    // Apply segment filter
    if (segmentFilter && store.segment !== segmentFilter) {
      return false;
    }
    
    // Apply business type filter
    if (businessTypeFilter && store.business_type !== businessTypeFilter) {
      return false;
    }
    
    // Apply sub business type filter
    if (subBusinessTypeFilter && store.sub_business_type !== subBusinessTypeFilter) {
      return false;
    }
    
    // Apply user status filter
    if (userStatusFilter && store.user_status !== userStatusFilter) {
      return false;
    }
    
    return true;
  });

  // Get unique values for filter dropdowns
  const uniqueAgents = Array.from(new Set(stores.map((store) => store.agent_name))).sort();
  const uniqueSegments = Array.from(new Set(stores.map((store) => store.segment))).sort();
  const uniqueBusinessTypes = Array.from(new Set(stores.map((store) => store.business_type))).sort();
  const uniqueSubBusinessTypes = Array.from(new Set(stores.map((store) => store.sub_business_type))).sort();
  const uniqueUserStatuses = Array.from(new Set(stores.map((store) => store.user_status).filter(Boolean))).sort();

  const sortedStores = [...filteredStores].sort((a, b) => {
    const aValue = a[orderBy];
    const bValue = b[orderBy];

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return order === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return order === 'asc' ? aValue - bValue : bValue - aValue;
    }

    return 0;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const handleExport = () => {
    const exportData = sortedStores.map((store) => ({
      'Store Name': store.store_name,
      'Agent': store.agent_name,
      'Segment': store.segment,
      'Business Type': store.business_type,
      'Sub Business Type': store.sub_business_type,
      'User Status': store.user_status || 'N/A',
      'Total Invoice': store.total_invoice,
      'Total Profit': store.total_profit,
      'Margin %': store.margin,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Store Monthly Data');
    XLSX.writeFile(wb, `store-monthly-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleRowClick = (storeMonthly: StoreMonthly) => {
    // Create a minimal store object from monthly data instantly
    const minimalStore: Store = {
      user_id: storeMonthly.user_id,
      reseller_name: storeMonthly.store_name, // Use store_name as reseller_name
      store_name: storeMonthly.store_name,
      first_order_date: '',
      first_order_month: '',
      user_status: 'Active',
      segment: storeMonthly.segment,
      areas: '',
      agent_name: storeMonthly.agent_name,
      business_type: storeMonthly.business_type,
      sub_business_type: storeMonthly.sub_business_type,
      profit_score: 0,
      "3_month_profit": storeMonthly.total_profit,
      owed_score: 0,
      activity_score: 0,
      active_months: 0,
      payment_habits_score: 0,
      final_score: 0,
      order_this_year: 0,
      three_month_profit: storeMonthly.total_profit
    };
    setSelectedStore(minimalStore);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedStore(null);
  };

  return (
    <Card>
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" fontWeight="bold">
            {title}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {onRefresh && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<RefreshIcon />}
                onClick={onRefresh}
                disabled={loading}
              >
                Refresh
              </Button>
            )}
            <Button
              variant="outlined"
              size="small"
              startIcon={<DownloadIcon />}
              onClick={handleExport}
              disabled={loading || stores.length === 0}
            >
              Export
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              size="small"
              onClick={clearAllFilters}
              disabled={!agentFilter && !segmentFilter && !businessTypeFilter && !subBusinessTypeFilter && !userStatusFilter && !searchQuery}
            >
              Clear Filters
            </Button>
          </Box>
        </Box>

        {/* Summary Stats */}
        <Box mb={3} sx={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
          <Box sx={{ textAlign: 'center', minWidth: '200px' }}>
            <Typography variant="h3" color="primary" fontWeight="bold" mb={1}>
              {sortedStores.length}
            </Typography>
            <Typography variant="h6" color="textSecondary" fontWeight="500">
              Total Stores
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center', minWidth: '200px' }}>
            <Typography variant="h3" color="success.main" fontWeight="bold" mb={1}>
              {formatCurrency(sortedStores.reduce((sum, store) => sum + store.total_invoice, 0))}
            </Typography>
            <Typography variant="h6" color="textSecondary" fontWeight="500">
              Total Invoice
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center', minWidth: '200px' }}>
            <Typography variant="h3" color="info.main" fontWeight="bold" mb={1}>
              {formatCurrency(sortedStores.reduce((sum, store) => sum + store.total_profit, 0))}
            </Typography>
            <Typography variant="h6" color="textSecondary" fontWeight="500">
              Total Profit
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center', minWidth: '200px' }}>
            <Typography variant="h3" color="warning.main" fontWeight="bold" mb={1}>
              {sortedStores.length > 0 ? formatPercentage(sortedStores.reduce((sum, store) => sum + store.margin, 0) / sortedStores.length) : '0%'}
            </Typography>
            <Typography variant="h6" color="textSecondary" fontWeight="500">
              Avg Margin
            </Typography>
          </Box>
        </Box>

        {/* Search and Filters */}
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search stores..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
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
                <InputLabel>Agent</InputLabel>
                <Select
                  value={agentFilter}
                  label="Agent"
                  onChange={(e) => handleAgentFilterChange(e.target.value)}
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
                <InputLabel>Business Type</InputLabel>
                <Select
                  value={businessTypeFilter}
                  label="Business Type"
                  onChange={(e) => setBusinessTypeFilter(e.target.value)}
                >
                  <MenuItem value="">All Business Types</MenuItem>
                  {uniqueBusinessTypes.map((businessType) => (
                    <MenuItem key={businessType} value={businessType}>
                      {businessType}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <FormControl fullWidth>
                <InputLabel>Sub Business Type</InputLabel>
                <Select
                  value={subBusinessTypeFilter}
                  label="Sub Business Type"
                  onChange={(e) => setSubBusinessTypeFilter(e.target.value)}
                >
                  <MenuItem value="">All Sub Business Types</MenuItem>
                  {uniqueSubBusinessTypes.map((subBusinessType) => (
                    <MenuItem key={subBusinessType} value={subBusinessType}>
                      {subBusinessType}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <FormControl fullWidth>
                <InputLabel>User Status</InputLabel>
                <Select
                  value={userStatusFilter}
                  label="User Status"
                  onChange={(e) => {
                    setUserStatusFilter(e.target.value);
                    setPage(0);
                  }}
                >
                  <MenuItem value="">All User Statuses</MenuItem>
                  {uniqueUserStatuses.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status}
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
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 3 }}>
                      <CircularProgress size={24} sx={{ mr: 2 }} />
                      <Typography variant="body2">Loading stores...</Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : sortedStores.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={headCells.length} align="center">
                    <Typography variant="body2" color="textSecondary">
                      No stores found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                sortedStores
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((store) => (
                    <TableRow 
                      key={store.user_id} 
                      hover 
                      onClick={() => handleRowClick(store)}
                      sx={{ 
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        }
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {store.store_name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="textSecondary">
                          {store.agent_name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="textSecondary">
                          {store.segment || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="textSecondary">
                          {store.business_type || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="textSecondary">
                          {store.sub_business_type || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="textSecondary">
                          {store.user_status || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="medium" color="primary">
                          {formatCurrency(store.total_invoice)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="medium" color="success.main">
                          {formatCurrency(store.total_profit)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="medium" color="warning.main">
                          {formatPercentage(store.margin)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={sortedStores.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </CardContent>

      {/* Store Detail Modal */}
      <StoreDetailModal
        open={modalOpen}
        onClose={handleCloseModal}
        store={selectedStore}
      />
    </Card>
  );
};

export default StoreMonthlyTable;
