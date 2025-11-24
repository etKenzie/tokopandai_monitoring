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
  FormControlLabel,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Switch,
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
import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { Store, fetchStores } from '../../api/distribusi/StoreSlice';
import StoreDetailModal from './StoreDetailModal';

type StoreDirection = 'asc' | 'desc';
type SortableField = keyof Store | 'category';

interface HeadCell {
  id: SortableField;
  label: string;
  numeric: boolean;
}

const headCells: HeadCell[] = [
  { id: 'store_name', label: 'Store Name', numeric: false },
  { id: 'first_order_date', label: 'First Order Date', numeric: false },
  { id: 'first_order_month', label: 'First Order Month', numeric: false },
  { id: 'user_status', label: 'Status', numeric: false },
  { id: 'payment_status', label: 'Payment Status', numeric: false },
  { id: 'segment', label: 'Segment', numeric: false },
  { id: 'areas', label: 'Area', numeric: false },
  { id: 'agent_name', label: 'Agent', numeric: false },
  { id: 'business_type', label: 'Business Type', numeric: false },
  { id: 'sub_business_type', label: 'Sub Business Type', numeric: false },
  { id: 'category', label: 'Category', numeric: false },
  { id: '3_month_profit', label: '3 Month Profit', numeric: true },
  { id: 'active_months', label: 'Active Months', numeric: true },
  { id: 'dso', label: 'DSO', numeric: true },
  { id: 'remaining_limit', label: 'Remaining Limit', numeric: true },
  { id: 'termin_day', label: 'Termin Day', numeric: true },
  { id: 'profit_score', label: 'Profit Score', numeric: true },
  { id: 'owed_score', label: 'Owed Score', numeric: true },
  { id: 'activity_score', label: 'Activity Score', numeric: true },
  { id: 'payment_habits_score', label: 'Payment Habits Score', numeric: true },
  { id: 'final_score', label: 'Final Score', numeric: true },
];

interface StoresTableProps {
  filters: {
    agent_name?: string;
    areas?: string;
    segment?: string;
    user_status?: string;
    category?: string;
    interval_months?: number;
  };
  title?: string;
  agentName?: string;
  onFilteredStoresChange?: (filteredStores: Store[]) => void;
}

const StoresTable = ({ 
  filters,
  title = 'Stores',
  agentName,
  onFilteredStoresChange
}: StoresTableProps) => {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderBy, setOrderBy] = useState<SortableField>('final_score');
  const [order, setOrder] = useState<StoreDirection>('desc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [segmentFilter, setSegmentFilter] = useState<string>('');
  const [areaFilter, setAreaFilter] = useState<string>('');
  const [agentFilter, setAgentFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('');
  const [businessTypeFilter, setBusinessTypeFilter] = useState<string>('');
  const [subBusinessTypeFilter, setSubBusinessTypeFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [activeMonthsFilter, setActiveMonthsFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [showScoreColumns, setShowScoreColumns] = useState(false);
  const prevFilteredStoresRef = useRef<Store[]>([]);

  const fetchStoresData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchStores({
        agent_name: agentName || filters.agent_name,
        areas: filters.areas,
        segment: filters.segment,
        user_status: filters.user_status,
        interval_months: filters.interval_months
      });
      
      setStores(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Failed to fetch stores data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStoresData();
    // Reset pagination when filters change
    setPage(0);
  }, [filters.agent_name, filters.areas, filters.segment, filters.user_status, filters.interval_months, agentName]);

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

  const getUserStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'success';
      case 'Inactive': return 'error';
      case 'Suspended': return 'warning';
      default: return 'default';
    }
  };

  const getPaymentStatusColor = (status?: string) => {
    if (!status) return 'default';
    const statusLower = status.toLowerCase();
    
    // Best statuses (green)
    if (statusLower === 'current' || statusLower === 'paid' || statusLower === 'up to date') {
      return 'success';
    }
    
    // 30 DPD (yellow/orange warning)
    if (statusLower.includes('30') && statusLower.includes('dpd')) {
      return 'warning';
    }
    
    // 60 DPD (orange/red)
    if (statusLower.includes('60') && statusLower.includes('dpd')) {
      return 'warning';
    }
    
    // Worst statuses (red)
    if (statusLower.includes('90') && statusLower.includes('dpd')) {
      return 'error';
    }
    
    // Other overdue/unpaid statuses (red)
    if (statusLower === 'unpaid' || statusLower === 'overdue' || statusLower.includes('overdue')) {
      return 'error';
    }
    
    // Partial payment (orange)
    if (statusLower === 'partial' || statusLower.includes('partial')) {
      return 'warning';
    }
    
    return 'default';
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    if (score >= 40) return 'error';
    return 'default';
  };

  const getCategory = (finalScore: number) => {
    if (finalScore >= 75) return 'A';
    if (finalScore >= 50) return 'B';
    if (finalScore >= 25) return 'C';
    return 'D';
  };

  const getCategoryColor = (finalScore: number) => {
    if (finalScore >= 75) return 'success';
    if (finalScore >= 50) return 'info';
    if (finalScore >= 25) return 'warning';
    return 'error';
  };

  const searchFields = (store: Store, query: string): boolean => {
    if (!query) return true;

    const searchableFields = [
      store.reseller_name?.toLowerCase() || '',
      store.store_name?.toLowerCase() || '',
      store.segment?.toLowerCase() || '',
      store.areas?.toLowerCase() || '',
      store.agent_name?.toLowerCase() || '',
      store.user_status?.toLowerCase() || '',
      store.payment_status?.toLowerCase() || '',
      store.business_type?.toLowerCase() || '',
      store.sub_business_type?.toLowerCase() || '',
    ];

    return searchableFields.some((field) =>
      field.includes(query.toLowerCase())
    );
  };

  const filteredStores = useMemo(() => {
    return stores.filter((s) => {
      // Apply filters
      if (segmentFilter && s.segment !== segmentFilter) return false;
      if (areaFilter && s.areas !== areaFilter) return false;
      if (agentFilter && s.agent_name !== agentFilter) return false;
      if (statusFilter && s.user_status !== statusFilter) return false;
      if (paymentStatusFilter && s.payment_status !== paymentStatusFilter) return false;
      if (businessTypeFilter && s.business_type !== businessTypeFilter) return false;
      if (subBusinessTypeFilter && s.sub_business_type !== subBusinessTypeFilter) return false;
      if (categoryFilter && getCategory(s.final_score) !== categoryFilter) return false;
      if (activeMonthsFilter && s.active_months !== parseInt(activeMonthsFilter)) return false;

      // Search functionality
      if (searchQuery) {
        return searchFields(s, searchQuery);
      }

      return true;
    });
  }, [stores, segmentFilter, areaFilter, agentFilter, statusFilter, paymentStatusFilter, businessTypeFilter, subBusinessTypeFilter, categoryFilter, activeMonthsFilter, searchQuery]);

  // Reset page when local filters change
  useEffect(() => {
    setPage(0);
  }, [segmentFilter, areaFilter, agentFilter, statusFilter, paymentStatusFilter, businessTypeFilter, subBusinessTypeFilter, categoryFilter, activeMonthsFilter, searchQuery]);

  // Notify parent component when filtered stores change
  useEffect(() => {
    if (onFilteredStoresChange && filteredStores !== prevFilteredStoresRef.current) {
      prevFilteredStoresRef.current = filteredStores;
      onFilteredStoresChange(filteredStores);
    }
  }, [filteredStores, onFilteredStoresChange]);

  const uniqueSegments = Array.from(new Set(stores.map((s) => s.segment)));
  const uniqueAreas = Array.from(new Set(stores.map((s) => s.areas)));
  const uniqueAgents = Array.from(new Set(stores.map((s) => s.agent_name)));
  const uniqueStatuses = Array.from(new Set(stores.map((s) => s.user_status)));
  const uniquePaymentStatuses = Array.from(new Set(stores.map((s) => s.payment_status).filter(Boolean))).sort();
  const uniqueBusinessTypes = Array.from(new Set(stores.map((s) => s.business_type)));
  const uniqueSubBusinessTypes = Array.from(new Set(stores.map((s) => s.sub_business_type)));
  const uniqueActiveMonths = Array.from(new Set(stores.map((s) => s.active_months))).sort((a, b) => a - b);

  const sortedStores = [...filteredStores].sort((a, b) => {
    let aValue: any = a[orderBy as keyof Store];
    let bValue: any = b[orderBy as keyof Store];

    // Handle category sorting
    if (orderBy === 'category') {
      aValue = getCategory(a.final_score);
      bValue = getCategory(b.final_score);
    }

    if (orderBy === 'profit_score' || orderBy === 'owed_score' || orderBy === 'activity_score' || orderBy === 'payment_habits_score' || orderBy === 'final_score' || orderBy === 'remaining_limit' || orderBy === 'termin_day' || orderBy === 'dso') {
      aValue = Number(aValue);
      bValue = Number(bValue);
    }

    if (orderBy === 'first_order_date') {
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

  const totalStores = filteredStores.length;
  const activeStores = filteredStores.filter(s => s.user_status === 'Active').length;
  
  // Filter out stores with final score of 0 (no transactions)
  const storesWithTransactions = filteredStores.filter(s => s.final_score > 0);
  
  const avgFinalScore = storesWithTransactions.length > 0 ? 
    Math.round(storesWithTransactions.reduce((sum, s) => sum + s.final_score, 0) / storesWithTransactions.length) : 0;
  const avgProfitScore = storesWithTransactions.length > 0 ? 
    Math.round(storesWithTransactions.reduce((sum, s) => sum + s.profit_score, 0) / storesWithTransactions.length) : 0;

  const prepareDataForExport = (stores: Store[]) => {
    return stores.map((s) => ({
      'Store Name': s.store_name,
      'First Order Date': formatDate(s.first_order_date),
      'First Order Month': s.first_order_month,
      'Status': s.user_status,
      'Payment Status': s.payment_status || '',
      'Segment': s.segment,
      'Area': s.areas,
      'Agent': s.agent_name,
      'Business Type': s.business_type,
      'Sub Business Type': s.sub_business_type,
      'Category': getCategory(s.final_score),
      'Active Months': s.active_months,
      'DSO': s.dso !== undefined ? s.dso : '',
      'Remaining Limit': s.remaining_limit !== undefined ? s.remaining_limit : '',
      'Termin Day': s.termin_day !== undefined ? s.termin_day : '',
      'Profit Score': s.profit_score,
      'Owed Score': s.owed_score,
      'Activity Score': s.activity_score,
      'Payment Habits Score': s.payment_habits_score,
      'Final Score': s.final_score,
    }));
  };

  const handleExcelExport = () => {
    if (!stores.length) return;

    // Only run on client side
    if (typeof window === 'undefined' || typeof document === 'undefined' || typeof Blob === 'undefined') return;

    const data = prepareDataForExport(filteredStores);
    
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);

    // Set column widths
    const colWidths = [
      { wch: 25 }, // Store Name
      { wch: 15 }, // First Order Date
      { wch: 15 }, // First Order Month
      { wch: 15 }, // Status
      { wch: 15 }, // Payment Status
      { wch: 15 }, // Segment
      { wch: 15 }, // Area
      { wch: 20 }, // Agent
      { wch: 20 }, // Business Type
      { wch: 25 }, // Sub Business Type
      { wch: 10 }, // Category
      { wch: 15 }, // 3 Month Profit
      { wch: 15 }, // Active Months
      { wch: 15 }, // DSO
      { wch: 15 }, // Remaining Limit
      { wch: 15 }, // Termin Day
      { wch: 15 }, // Profit Score
      { wch: 15 }, // Owed Score
      { wch: 15 }, // Activity Score
      { wch: 20 }, // Payment Habits Score
      { wch: 15 }, // Final Score
    ];
    ws['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Stores');

    // Generate Excel file
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    // Download file
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stores.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const clearAllFilters = () => {
    setSegmentFilter('');
    setAreaFilter('');
    setAgentFilter('');
    setStatusFilter('');
    setPaymentStatusFilter('');
    setBusinessTypeFilter('');
    setSubBusinessTypeFilter('');
    setCategoryFilter('');
    setActiveMonthsFilter('');
    setSearchQuery('');
    setPage(0);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleRowClick = (store: Store) => {
    setSelectedStore(store);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedStore(null);
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
              onClick={fetchStoresData}
              disabled={loading}
              sx={{ mr: 1 }}
            >
              Refresh
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExcelExport}
              disabled={filteredStores.length === 0}
              sx={{ mr: 1 }}
            >
              Export Excel
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={clearAllFilters}
              disabled={!segmentFilter && !areaFilter && !agentFilter && !statusFilter && !paymentStatusFilter && !businessTypeFilter && !subBusinessTypeFilter && !categoryFilter && !activeMonthsFilter && !searchQuery}
            >
              Clear Filters
            </Button>
          </Box>
        </Box>

        {/* Summary Stats */}
        <Box mb={3} sx={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
          <Box sx={{ textAlign: 'center', minWidth: '200px' }}>
            <Typography variant="h3" color="primary" fontWeight="bold" mb={1}>
              {totalStores}
            </Typography>
            <Typography variant="h6" color="textSecondary" fontWeight="500">
              Total Stores
            </Typography>
          </Box>
          {/* <Box sx={{ textAlign: 'center', minWidth: '200px' }}>
            <Typography variant="h3" color="success.main" fontWeight="bold" mb={1}>
              {activeStores}
            </Typography>
            <Typography variant="h6" color="textSecondary" fontWeight="500">
              Active Stores
            </Typography>
          </Box> */}
          <Box sx={{ textAlign: 'center', minWidth: '200px' }}>
            <Typography variant="h3" color="info.main" fontWeight="bold" mb={1}>
              {avgFinalScore}
            </Typography>
            <Typography variant="h6" color="textSecondary" fontWeight="500">
              Avg Final Score
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center', minWidth: '200px' }}>
            <Typography variant="h3" color="warning.main" fontWeight="bold" mb={1}>
              {avgProfitScore}
            </Typography>
            <Typography variant="h6" color="textSecondary" fontWeight="500">
              Avg Profit Score
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
                placeholder="Search stores..."
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
            <Grid size={{ xs: 12 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={showScoreColumns}
                    onChange={(e) => setShowScoreColumns(e.target.checked)}
                    color="primary"
                  />
                }
                label="Show Score Columns (Profit Score, Owed Score, Activity Score, Payment Habits Score)"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(0);
                  }}
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  {uniqueStatuses.map((status) => (
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
                  value={paymentStatusFilter}
                  label="Payment Status"
                  onChange={(e) => {
                    setPaymentStatusFilter(e.target.value);
                    setPage(0);
                  }}
                >
                  <MenuItem value="">All Payment Statuses</MenuItem>
                  {uniquePaymentStatuses.map((paymentStatus) => (
                    <MenuItem key={paymentStatus} value={paymentStatus}>
                      {paymentStatus}
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
            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={categoryFilter}
                  label="Category"
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <MenuItem value="">All Categories</MenuItem>
                  <MenuItem value="A">A (75-100)</MenuItem>
                  <MenuItem value="B">B (50-74)</MenuItem>
                  <MenuItem value="C">C (25-49)</MenuItem>
                  <MenuItem value="D">D (0-24)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <FormControl fullWidth>
                <InputLabel>Active Months</InputLabel>
                <Select
                  value={activeMonthsFilter}
                  label="Active Months"
                  onChange={(e) => setActiveMonthsFilter(e.target.value)}
                >
                  <MenuItem value="">All Active Months</MenuItem>
                  {uniqueActiveMonths.map((months) => (
                    <MenuItem key={months} value={months.toString()}>
                      {months} {months === 1 ? 'Month' : 'Months'}
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
          </Grid>
        </Box>

        {/* Table */}
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                {headCells
                  .filter((headCell) => {
                    // Hide score columns if toggle is off
                    if (!showScoreColumns) {
                      return !['profit_score', 'owed_score', 'activity_score', 'payment_habits_score'].includes(headCell.id);
                    }
                    return true;
                  })
                  .map((headCell) => (
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
                  <TableCell colSpan={headCells.filter((h) => showScoreColumns || !['profit_score', 'owed_score', 'activity_score', 'payment_habits_score'].includes(h.id)).length} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={headCells.filter((h) => showScoreColumns || !['profit_score', 'owed_score', 'activity_score', 'payment_habits_score'].includes(h.id)).length} align="center">
                    <Typography variant="body2" color="error">
                      {error}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : sortedStores.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={headCells.filter((h) => showScoreColumns || !['profit_score', 'owed_score', 'activity_score', 'payment_habits_score'].includes(h.id)).length} align="center">
                    <Typography variant="body2" color="textSecondary">
                      No stores found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                sortedStores
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((row) => (
                    <TableRow 
                      key={row.user_id} 
                      hover 
                      onClick={() => handleRowClick(row)}
                      sx={{ 
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        }
                      }}
                    >
                      <TableCell>{row.store_name}</TableCell>
                      <TableCell>{formatDate(row.first_order_date)}</TableCell>
                      <TableCell>
                        <Chip
                          label={row.first_order_month}
                          size="small"
                          variant="outlined"
                          color="primary"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={row.user_status}
                          color={getUserStatusColor(row.user_status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={row.payment_status || 'N/A'}
                          color={getPaymentStatusColor(row.payment_status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={row.segment || 'N/A'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={row.areas || 'N/A'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{row.agent_name}</TableCell>
                      <TableCell>
                        <Chip
                          label={row.business_type || 'N/A'}
                          size="small"
                          variant="outlined"
                          color="info"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={row.sub_business_type || 'N/A'}
                          size="small"
                          variant="outlined"
                          color="secondary"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getCategory(row.final_score)}
                          color={getCategoryColor(row.final_score) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="medium" color="success.main">
                          {formatCurrency(row["3_month_profit"])}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="medium">
                          {row.active_months}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="medium">
                          {typeof row.dso === 'number' ? row.dso.toFixed(2) : '-'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="medium">
                          {row.remaining_limit !== undefined ? formatCurrency(row.remaining_limit) : '-'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="medium">
                          {row.termin_day !== undefined ? `${row.termin_day} days` : '-'}
                        </Typography>
                      </TableCell>
                      {showScoreColumns && (
                        <>
                          <TableCell align="right">
                            <Chip
                              label={row.profit_score}
                              color={getScoreColor(row.profit_score) as any}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Chip
                              label={row.owed_score}
                              color={getScoreColor(row.owed_score) as any}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Chip
                              label={row.activity_score}
                              color={getScoreColor(row.activity_score) as any}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Chip
                              label={row.payment_habits_score}
                              color={getScoreColor(row.payment_habits_score) as any}
                              size="small"
                            />
                          </TableCell>
                        </>
                      )}
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                        <Chip
                          label={row.final_score}
                          color={getScoreColor(row.final_score) as any}
                          size="small"
                          variant="filled"
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
            count={filteredStores.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </TableContainer>
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

export default StoresTable;
