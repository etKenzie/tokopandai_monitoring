"use client";

import { fetchStoreMonthly, Store, StoreMonthly } from "@/app/api/distribusi/StoreSlice";
import ProtectedRoute from "@/app/components/auth/ProtectedRoute";
import PageContainer from "@/app/components/container/PageContainer";
import StoreDetailModal from "@/app/components/distribusi/StoreDetailModal";
import { useAuth } from "@/app/context/AuthContext";
import { useCheckRoles } from "@/app/hooks/useCheckRoles";
import { getAgentNameFromRole, getPageRoles, getRestrictedRoles } from "@/config/roles";
import { ArrowDownward, ArrowUpward, Search as SearchIcon, TrendingDown, TrendingUp } from '@mui/icons-material';
import {
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    FormControl,
    FormControlLabel,
    Grid,
    InputAdornment,
    InputLabel,
    List,
    ListItem,
    ListItemText,
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
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";

interface ComparisonData extends StoreMonthly {
  lastMonthInvoice?: number;
  lastMonthProfit?: number;
  lastMonthMargin?: number;
  invoiceChange?: number;
  profitChange?: number;
  marginChange?: number;
  invoiceChangePercent?: number;
  profitChangePercent?: number;
  marginChangePercent?: number;
}

type SortDirection = 'asc' | 'desc';
type SortableField = keyof ComparisonData;

interface HeadCell {
  id: SortableField;
  label: string;
  numeric: boolean;
}

const headCells: HeadCell[] = [
  { id: 'store_name', label: 'Store Name', numeric: false },
  { id: 'agent_name', label: 'Agent', numeric: false },
  { id: 'segment', label: 'Segment', numeric: false },
  { id: 'total_invoice', label: 'Current Month Invoice', numeric: true },
  { id: 'lastMonthInvoice', label: 'Last Month Invoice', numeric: true },
  { id: 'invoiceChange', label: 'Invoice Change', numeric: true },
  { id: 'total_profit', label: 'Current Month Profit', numeric: true },
  { id: 'lastMonthProfit', label: 'Last Month Profit', numeric: true },
  { id: 'profitChange', label: 'Profit Change', numeric: true },
  { id: 'margin', label: 'Current Margin %', numeric: true },
  { id: 'lastMonthMargin', label: 'Last Month Margin %', numeric: true },
];

const StoresComparePage = () => {
  const { user, roles } = useAuth();
  
  // Check access for allowed roles
  const accessCheck = useCheckRoles(getPageRoles('DISTRIBUSI_DASHBOARD'));
  
  // Get restricted roles from config
  const restrictedRoles = getRestrictedRoles();
  
  // Check if current user has a restricted role
  const hasRestrictedRole = roles.some(role => restrictedRoles.includes(role));
  const userRoleForFiltering = roles.find(role => restrictedRoles.includes(role));

  // Generate month options for the last 12 months
  const generateMonthOptions = () => {
    const options = [];
    const currentDate = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthName = date.toLocaleString('en-US', { month: 'long' });
      const year = date.getFullYear();
      const value = `${monthName} ${year}`;
      
      options.push({
        value,
        label: value
      });
    }
    
    return options;
  };

  const monthOptions = generateMonthOptions();

  // Get current and last month
  const getCurrentMonth = () => {
    const currentDate = new Date();
    const currentMonth = currentDate.toLocaleString('en-US', { month: 'long' });
    const currentYear = currentDate.getFullYear();
    return `${currentMonth} ${currentYear}`;
  };

  const getLastMonth = () => {
    const currentDate = new Date();
    const lastMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const lastMonth = lastMonthDate.toLocaleString('en-US', { month: 'long' });
    const lastYear = lastMonthDate.getFullYear();
    return `${lastMonth} ${lastYear}`;
  };

  const [currentMonthData, setCurrentMonthData] = useState<StoreMonthly[]>([]);
  const [lastMonthData, setLastMonthData] = useState<StoreMonthly[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCurrentMonth, setSelectedCurrentMonth] = useState<string>(getCurrentMonth());
  const [selectedLastMonth, setSelectedLastMonth] = useState<string>(getLastMonth());
  const [appliedCurrentMonth, setAppliedCurrentMonth] = useState<string>(getCurrentMonth());
  const [appliedLastMonth, setAppliedLastMonth] = useState<string>(getLastMonth());
  const [orderBy, setOrderBy] = useState<SortableField>('total_invoice');
  const [order, setOrder] = useState<SortDirection>('desc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [segmentFilter, setSegmentFilter] = useState<string>('');
  const [agentFilter, setAgentFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'invoice' | 'profit'>('invoice');
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Fetch data for both months
  const fetchComparisonData = useCallback(async () => {
    if (!appliedCurrentMonth || !appliedLastMonth) return;
    
    setLoading(true);
    setError(null);
    try {
      // For users with restricted roles, use their mapped agent name
      const agentName = hasRestrictedRole ? getAgentNameFromRole(userRoleForFiltering!) : undefined;
      
      const [currentResponse, lastResponse] = await Promise.all([
        fetchStoreMonthly(appliedCurrentMonth, agentName),
        fetchStoreMonthly(appliedLastMonth, agentName)
      ]);
      
      setCurrentMonthData(currentResponse.data);
      setLastMonthData(lastResponse.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch comparison data');
      console.error('Failed to fetch comparison data:', err);
    } finally {
      setLoading(false);
    }
  }, [appliedCurrentMonth, appliedLastMonth, hasRestrictedRole, userRoleForFiltering]);

  // Fetch data when applied months change
  useEffect(() => {
    fetchComparisonData();
  }, [fetchComparisonData]);

  // Handle apply button click
  const handleApply = () => {
    setAppliedCurrentMonth(selectedCurrentMonth);
    setAppliedLastMonth(selectedLastMonth);
    setPage(0);
  };

  // Create comparison data
  const comparisonData = useMemo(() => {
    const dataMap = new Map<string, ComparisonData>();
    
    // Add current month data
    currentMonthData.forEach(store => {
      dataMap.set(store.user_id, {
        ...store,
        lastMonthInvoice: 0,
        lastMonthProfit: 0,
        lastMonthMargin: 0,
        invoiceChange: store.total_invoice,
        profitChange: store.total_profit,
        marginChange: store.margin,
        invoiceChangePercent: 100,
        profitChangePercent: 100,
        marginChangePercent: 0,
      });
    });
    
    // Update with last month data
    lastMonthData.forEach(store => {
      const existing = dataMap.get(store.user_id);
      if (existing) {
        existing.lastMonthInvoice = store.total_invoice;
        existing.lastMonthProfit = store.total_profit;
        existing.lastMonthMargin = store.margin;
        existing.invoiceChange = existing.total_invoice - store.total_invoice;
        existing.profitChange = existing.total_profit - store.total_profit;
        existing.marginChange = existing.margin - store.margin;
        existing.invoiceChangePercent = store.total_invoice > 0 
          ? ((existing.total_invoice - store.total_invoice) / store.total_invoice) * 100 
          : 0;
        existing.profitChangePercent = store.total_profit > 0 
          ? ((existing.total_profit - store.total_profit) / store.total_profit) * 100 
          : 0;
        existing.marginChangePercent = existing.margin - store.margin;
      } else {
        // Store exists in last month but not current month
        dataMap.set(store.user_id, {
          ...store,
          total_invoice: 0,
          total_profit: 0,
          margin: 0,
          lastMonthInvoice: store.total_invoice,
          lastMonthProfit: store.total_profit,
          lastMonthMargin: store.margin,
          invoiceChange: -store.total_invoice,
          profitChange: -store.total_profit,
          marginChange: -store.margin,
          invoiceChangePercent: -100,
          profitChangePercent: -100,
          marginChangePercent: -store.margin,
        });
      }
    });
    
    return Array.from(dataMap.values());
  }, [currentMonthData, lastMonthData]);

  // Filter data based on segment and agent filters
  const filteredComparisonData = useMemo(() => {
    return comparisonData.filter(store => {
      if (segmentFilter && store.segment !== segmentFilter) return false;
      if (agentFilter && store.agent_name !== agentFilter) return false;
      return true;
    });
  }, [comparisonData, segmentFilter, agentFilter]);

  // Calculate summary stats with store lists (using filtered data)
  const summaryStats = useMemo(() => {
    if (viewMode === 'invoice') {
      const storesWithInvoiceUp = filteredComparisonData.filter(
        store => store.invoiceChange !== undefined && store.invoiceChange > 0 && store.lastMonthInvoice !== undefined && store.lastMonthInvoice > 0
      );
      
      const storesWithInvoiceDown = filteredComparisonData.filter(
        store => store.invoiceChange !== undefined && store.invoiceChange < 0 && store.lastMonthInvoice !== undefined && store.lastMonthInvoice > 0
      );
      
      const storesNoOrderThisMonth = filteredComparisonData.filter(
        store => (store.total_invoice === 0 || !store.total_invoice) && store.lastMonthInvoice !== undefined && store.lastMonthInvoice > 0
      );
      
      const storesNewThisMonth = filteredComparisonData.filter(
        store => store.total_invoice > 0 && (store.lastMonthInvoice === 0 || !store.lastMonthInvoice || store.lastMonthInvoice === undefined)
      );
      
      return {
        up: {
          count: storesWithInvoiceUp.length,
          stores: storesWithInvoiceUp,
          label: 'Stores with Invoice Up'
        },
        down: {
          count: storesWithInvoiceDown.length,
          stores: storesWithInvoiceDown,
          label: 'Stores with Invoice Down'
        },
        noOrderThisMonth: {
          count: storesNoOrderThisMonth.length,
          stores: storesNoOrderThisMonth
        },
        newThisMonth: {
          count: storesNewThisMonth.length,
          stores: storesNewThisMonth
        },
      };
    } else {
      const storesWithProfitUp = filteredComparisonData.filter(
        store => store.profitChange !== undefined && store.profitChange > 0 && store.lastMonthProfit !== undefined && store.lastMonthProfit > 0
      );
      
      const storesWithProfitDown = filteredComparisonData.filter(
        store => store.profitChange !== undefined && store.profitChange < 0 && store.lastMonthProfit !== undefined && store.lastMonthProfit > 0
      );
      
      const storesNoOrderThisMonth = filteredComparisonData.filter(
        store => (store.total_invoice === 0 || !store.total_invoice) && store.lastMonthInvoice !== undefined && store.lastMonthInvoice > 0
      );
      
      const storesNewThisMonth = filteredComparisonData.filter(
        store => store.total_invoice > 0 && (store.lastMonthInvoice === 0 || !store.lastMonthInvoice || store.lastMonthInvoice === undefined)
      );
      
      return {
        up: {
          count: storesWithProfitUp.length,
          stores: storesWithProfitUp,
          label: 'Stores with Profit Up'
        },
        down: {
          count: storesWithProfitDown.length,
          stores: storesWithProfitDown,
          label: 'Stores with Profit Down'
        },
        noOrderThisMonth: {
          count: storesNoOrderThisMonth.length,
          stores: storesNoOrderThisMonth
        },
        newThisMonth: {
          count: storesNewThisMonth.length,
          stores: storesNewThisMonth
        },
      };
    }
  }, [filteredComparisonData, viewMode]);

  // Get unique segments and agents for filters
  const uniqueSegments = useMemo(() => {
    return Array.from(new Set(comparisonData.map(store => store.segment).filter(Boolean))).sort();
  }, [comparisonData]);

  const uniqueAgents = useMemo(() => {
    return Array.from(new Set(comparisonData.map(store => store.agent_name).filter(Boolean))).sort();
  }, [comparisonData]);

  // Apply search filter to filtered comparison data
  const filteredData = useMemo(() => {
    if (!searchQuery) return filteredComparisonData;
    
    const query = searchQuery.toLowerCase();
    return filteredComparisonData.filter(store => {
      return (
        store.store_name.toLowerCase().includes(query) ||
        store.agent_name.toLowerCase().includes(query) ||
        store.segment.toLowerCase().includes(query) ||
        store.business_type?.toLowerCase().includes(query) ||
        store.sub_business_type?.toLowerCase().includes(query)
      );
    });
  }, [filteredComparisonData, searchQuery]);

  // Sort and paginate data
  const sortedData = useMemo(() => {
    const sorted = [...filteredData].sort((a, b) => {
      let aValue: any = a[orderBy];
      let bValue: any = b[orderBy];
      
      // Handle undefined values
      if (aValue === undefined || aValue === null) aValue = 0;
      if (bValue === undefined || bValue === null) bValue = 0;
      
      if (typeof aValue === 'string') {
        return order === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      return order === 'asc' ? aValue - bValue : bValue - aValue;
    });
    
    return sorted;
  }, [filteredData, orderBy, order]);

  const paginatedData = useMemo(() => {
    return sortedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [sortedData, page, rowsPerPage]);

  const handleRequestSort = (property: SortableField) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
    setPage(0);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const handleRowClick = (comparisonData: ComparisonData) => {
    // Create a minimal store object from comparison data
    const minimalStore: Store = {
      user_id: comparisonData.user_id,
      reseller_name: comparisonData.store_name,
      store_name: comparisonData.store_name,
      first_order_date: '',
      first_order_month: '',
      user_status: comparisonData.user_status || 'Active',
      segment: comparisonData.segment,
      areas: '',
      agent_name: comparisonData.agent_name,
      business_type: comparisonData.business_type,
      sub_business_type: comparisonData.sub_business_type,
      profit_score: 0,
      "3_month_profit": comparisonData.total_profit,
      owed_score: 0,
      activity_score: 0,
      active_months: 0,
      payment_habits_score: 0,
      final_score: 0,
      order_this_year: 0,
      three_month_profit: comparisonData.total_profit
    };
    setSelectedStore(minimalStore);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedStore(null);
  };

  return (
    <PageContainer title="Stores Compare" description="Compare store performance between months">
      <Box>
        {/* Header */}
        <Box mb={3} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h3" fontWeight="bold" mb={1}>
              Stores Comparison
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Compare store performance metrics between two months
            </Typography>
            {hasRestrictedRole && (
              <Typography variant="body2" color="info.main" sx={{ mt: 1, fontStyle: 'italic' }}>
                Showing data for {getAgentNameFromRole(userRoleForFiltering!)} only
              </Typography>
            )}
          </Box>
          <FormControlLabel
            control={
              <Switch
                checked={viewMode === 'profit'}
                onChange={(e) => setViewMode(e.target.checked ? 'profit' : 'invoice')}
                color="primary"
              />
            }
            label={viewMode === 'invoice' ? 'Invoice View' : 'Profit View'}
            sx={{ mt: 1 }}
          />
        </Box>

        {/* Month Filters */}
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2} alignItems="flex-end">
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Current Month</InputLabel>
                <Select
                  value={selectedCurrentMonth}
                  label="Current Month"
                  onChange={(e) => setSelectedCurrentMonth(e.target.value)}
                >
                  {monthOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Last Month</InputLabel>
                <Select
                  value={selectedLastMonth}
                  label="Last Month"
                  onChange={(e) => setSelectedLastMonth(e.target.value)}
                >
                  {monthOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <Button
                variant="contained"
                fullWidth
                onClick={handleApply}
                disabled={loading}
              >
                Apply
              </Button>
            </Grid>
          </Grid>
        </Box>

        {/* Error Display */}
        {error && (
          <Box mb={3}>
            <Typography variant="body1" color="error">
              {error}
            </Typography>
          </Box>
        )}

        {/* Summary Stats */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flex: '0 0 auto' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      {summaryStats.up.label}
                    </Typography>
                    <Typography variant="h4" fontWeight="bold" color="success.main">
                      {summaryStats.up.count}
                    </Typography>
                  </Box>
                  <TrendingUp sx={{ fontSize: 40, color: 'success.main' }} />
                </Box>
              </CardContent>
              <Box sx={{ flex: '1 1 auto', overflow: 'auto', px: 2, pb: 2 }}>
                <List dense>
                  {summaryStats.up.stores.map((store) => {
                    const change = viewMode === 'invoice' ? store.invoiceChange : store.profitChange;
                    const changePercent = viewMode === 'invoice' ? store.invoiceChangePercent : store.profitChangePercent;
                    return (
                      <ListItem key={store.user_id} sx={{ px: 0 }}>
                        <ListItemText
                          primary={store.store_name}
                          secondary={
                            <Box component="span">
                              {formatCurrency(change || 0)} (
                              <Box component="span" sx={{ color: 'success.main', fontWeight: 'medium' }}>
                                {formatPercent(changePercent || 0)}
                              </Box>
                              )
                            </Box>
                          }
                          primaryTypographyProps={{ variant: 'body2' }}
                          secondaryTypographyProps={{ variant: 'caption' }}
                        />
                      </ListItem>
                    );
                  })}
                  {summaryStats.up.stores.length === 0 && (
                    <Typography variant="body2" color="textSecondary" sx={{ px: 2, py: 1 }}>
                      No stores
                    </Typography>
                  )}
                </List>
              </Box>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flex: '0 0 auto' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      {summaryStats.down.label}
                    </Typography>
                    <Typography variant="h4" fontWeight="bold" color="error.main">
                      {summaryStats.down.count}
                    </Typography>
                  </Box>
                  <TrendingDown sx={{ fontSize: 40, color: 'error.main' }} />
                </Box>
              </CardContent>
              <Box sx={{ flex: '1 1 auto', overflow: 'auto', px: 2, pb: 2 }}>
                <List dense>
                  {summaryStats.down.stores.map((store) => {
                    const change = viewMode === 'invoice' ? store.invoiceChange : store.profitChange;
                    const changePercent = viewMode === 'invoice' ? store.invoiceChangePercent : store.profitChangePercent;
                    return (
                      <ListItem key={store.user_id} sx={{ px: 0 }}>
                        <ListItemText
                          primary={store.store_name}
                          secondary={
                            <Box component="span">
                              {formatCurrency(Math.abs(change || 0))} (
                              <Box component="span" sx={{ color: 'error.main', fontWeight: 'medium' }}>
                                {formatPercent(changePercent || 0)}
                              </Box>
                              )
                            </Box>
                          }
                          primaryTypographyProps={{ variant: 'body2' }}
                          secondaryTypographyProps={{ variant: 'caption' }}
                        />
                      </ListItem>
                    );
                  })}
                  {summaryStats.down.stores.length === 0 && (
                    <Typography variant="body2" color="textSecondary" sx={{ px: 2, py: 1 }}>
                      No stores
                    </Typography>
                  )}
                </List>
              </Box>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flex: '0 0 auto' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      No Order This Month
                    </Typography>
                    <Typography variant="h4" fontWeight="bold" color="warning.main">
                      {summaryStats.noOrderThisMonth.count}
                    </Typography>
                  </Box>
                  <ArrowDownward sx={{ fontSize: 40, color: 'warning.main' }} />
                </Box>
              </CardContent>
              <Box sx={{ flex: '1 1 auto', overflow: 'auto', px: 2, pb: 2 }}>
                <List dense>
                  {summaryStats.noOrderThisMonth.stores.map((store) => (
                    <ListItem key={store.user_id} sx={{ px: 0 }}>
                      <ListItemText
                        primary={store.store_name}
                        secondary={`Last month: ${formatCurrency(store.lastMonthInvoice || 0)}`}
                        primaryTypographyProps={{ variant: 'body2' }}
                        secondaryTypographyProps={{ variant: 'caption' }}
                      />
                    </ListItem>
                  ))}
                  {summaryStats.noOrderThisMonth.stores.length === 0 && (
                    <Typography variant="body2" color="textSecondary" sx={{ px: 2, py: 1 }}>
                      No stores
                    </Typography>
                  )}
                </List>
              </Box>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flex: '0 0 auto' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      New This Month
                    </Typography>
                    <Typography variant="h4" fontWeight="bold" color="info.main">
                      {summaryStats.newThisMonth.count}
                    </Typography>
                  </Box>
                  <ArrowUpward sx={{ fontSize: 40, color: 'info.main' }} />
                </Box>
              </CardContent>
              <Box sx={{ flex: '1 1 auto', overflow: 'auto', px: 2, pb: 2 }}>
                <List dense>
                  {summaryStats.newThisMonth.stores.map((store) => (
                    <ListItem key={store.user_id} sx={{ px: 0 }}>
                      <ListItemText
                        primary={store.store_name}
                        secondary={`Invoice: ${formatCurrency(store.total_invoice || 0)}`}
                        primaryTypographyProps={{ variant: 'body2' }}
                        secondaryTypographyProps={{ variant: 'caption' }}
                      />
                    </ListItem>
                  ))}
                  {summaryStats.newThisMonth.stores.length === 0 && (
                    <Typography variant="body2" color="textSecondary" sx={{ px: 2, py: 1 }}>
                      No stores
                    </Typography>
                  )}
                </List>
              </Box>
            </Card>
          </Grid>
        </Grid>

        {/* Table Filters */}
        <Box sx={{ mb: 2 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 12, md: 6 }}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search stores..."
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
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Segment</InputLabel>
                <Select
                  value={segmentFilter}
                  label="Segment"
                  onChange={(e) => {
                    setSegmentFilter(e.target.value);
                    setPage(0);
                  }}
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
                <InputLabel>Agent</InputLabel>
                <Select
                  value={agentFilter}
                  label="Agent"
                  onChange={(e) => {
                    setAgentFilter(e.target.value);
                    setPage(0);
                  }}
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

        {/* Comparison Table */}
        <Card>
          <CardContent>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
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
                      {paginatedData.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={headCells.length} align="center">
                            <Typography variant="body2" color="textSecondary">
                              No data available
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedData.map((row) => (
                          <TableRow 
                            key={row.user_id} 
                            hover
                            onClick={() => handleRowClick(row)}
                            sx={{ cursor: 'pointer' }}
                          >
                            <TableCell>
                              <Typography variant="body2" fontWeight="medium">
                                {row.store_name}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="textSecondary">
                                {row.agent_name}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="textSecondary">
                                {row.segment}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" fontWeight="medium">
                                {formatCurrency(row.total_invoice || 0)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" color="textSecondary">
                                {formatCurrency(row.lastMonthInvoice || 0)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                                {row.invoiceChange !== undefined && row.invoiceChange !== 0 && (
                                  <>
                                    {row.invoiceChange > 0 ? (
                                      <ArrowUpward sx={{ fontSize: 16, color: 'success.main' }} />
                                    ) : (
                                      <ArrowDownward sx={{ fontSize: 16, color: 'error.main' }} />
                                    )}
                                    <Typography 
                                      variant="body2" 
                                      fontWeight="medium"
                                      color={row.invoiceChange > 0 ? 'success.main' : 'error.main'}
                                    >
                                      {formatCurrency(Math.abs(row.invoiceChange))}
                                    </Typography>
                                    {row.invoiceChangePercent !== undefined && (
                                      <Typography 
                                        variant="caption" 
                                        color={row.invoiceChange > 0 ? 'success.main' : 'error.main'}
                                      >
                                        ({formatPercent(row.invoiceChangePercent)})
                                      </Typography>
                                    )}
                                  </>
                                )}
                                {(!row.invoiceChange || row.invoiceChange === 0) && (
                                  <Typography variant="body2" color="textSecondary">
                                    -
                                  </Typography>
                                )}
                              </Box>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" fontWeight="medium">
                                {formatCurrency(row.total_profit || 0)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" color="textSecondary">
                                {formatCurrency(row.lastMonthProfit || 0)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                                {row.profitChange !== undefined && row.profitChange !== 0 && (
                                  <>
                                    {row.profitChange > 0 ? (
                                      <ArrowUpward sx={{ fontSize: 16, color: 'success.main' }} />
                                    ) : (
                                      <ArrowDownward sx={{ fontSize: 16, color: 'error.main' }} />
                                    )}
                                    <Typography 
                                      variant="body2" 
                                      fontWeight="medium"
                                      color={row.profitChange > 0 ? 'success.main' : 'error.main'}
                                    >
                                      {formatCurrency(Math.abs(row.profitChange))}
                                    </Typography>
                                    {row.profitChangePercent !== undefined && (
                                      <Typography 
                                        variant="caption" 
                                        color={row.profitChange > 0 ? 'success.main' : 'error.main'}
                                      >
                                        ({formatPercent(row.profitChangePercent)})
                                      </Typography>
                                    )}
                                  </>
                                )}
                                {(!row.profitChange || row.profitChange === 0) && (
                                  <Typography variant="body2" color="textSecondary">
                                    -
                                  </Typography>
                                )}
                              </Box>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" fontWeight="medium">
                                {row.margin?.toFixed(2) || '0.00'}%
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" color="textSecondary">
                                {row.lastMonthMargin?.toFixed(2) || '0.00'}%
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  component="div"
                  count={sortedData.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  rowsPerPageOptions={[10, 25, 50, 100]}
                  labelRowsPerPage="Rows per page:"
                />
              </>
            )}
          </CardContent>
        </Card>

        {/* Store Detail Modal */}
        <StoreDetailModal
          open={modalOpen}
          onClose={handleCloseModal}
          store={selectedStore}
        />
      </Box>
    </PageContainer>
  );
};

export default function ProtectedStoresComparePage() {
  return (
    <ProtectedRoute requiredRoles={getPageRoles('DISTRIBUSI_DASHBOARD')}>
      <StoresComparePage />
    </ProtectedRoute>
  );
}

