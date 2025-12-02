"use client";

import { fetchStoreSummary, StoreSummaryItem } from "@/app/api/distribusi/DistribusiSlice";
import { fetchStoreMonthly, StoreMonthly } from "@/app/api/distribusi/StoreSlice";
import ProtectedRoute from "@/app/components/auth/ProtectedRoute";
import PageContainer from "@/app/components/container/PageContainer";
import StoreMonthlyTable from "@/app/components/distribusi/StoreMonthlyTable";
import { useAuth } from "@/app/context/AuthContext";
import { useCheckRoles } from "@/app/hooks/useCheckRoles";
import { getAgentNameFromRole, getPageRoles, getRestrictedRoles } from "@/config/roles";
import { Download as DownloadIcon, Search as SearchIcon } from '@mui/icons-material';
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
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tabs,
  TextField,
  Typography
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import * as XLSX from 'xlsx';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`stores-monthly-tabpanel-${index}`}
      aria-labelledby={`stores-monthly-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const StoresMonthlyPage = () => {
  const { user, roles, refreshRoles } = useAuth();
  
  // Check access for allowed roles (configurable via roles config)
  const accessCheck = useCheckRoles(getPageRoles('DISTRIBUSI_DASHBOARD'));
  
  // Get restricted roles from config
  const restrictedRoles = getRestrictedRoles();
  
  // Check if current user has a restricted role
  const hasRestrictedRole = roles.some(role => restrictedRoles.includes(role));
  const userRoleForFiltering = roles.find(role => restrictedRoles.includes(role));
  
  // Log access check result for debugging
  console.log('Stores Monthly Access Check:', accessCheck);
  console.log('User roles:', roles);
  
  const [stores, setStores] = useState<StoreMonthly[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [tabValue, setTabValue] = useState(0);
  
  // Store summary data for stores without orders
  const [noOrderStores, setNoOrderStores] = useState<StoreSummaryItem[]>([]);
  const [noOrderLoading, setNoOrderLoading] = useState(false);
  const [noOrderError, setNoOrderError] = useState<string | null>(null);
  const [noOrderPage, setNoOrderPage] = useState(0);
  const [noOrderRowsPerPage, setNoOrderRowsPerPage] = useState(10);
  const [noOrderDataFetched, setNoOrderDataFetched] = useState(false); // Track if data has been fetched for current month
  const [noOrderSearchQuery, setNoOrderSearchQuery] = useState<string>('');
  const [noOrderAgentFilter, setNoOrderAgentFilter] = useState<string>('');
  const [noOrderSegmentFilter, setNoOrderSegmentFilter] = useState<string>('');
  const [noOrderUserStatusFilter, setNoOrderUserStatusFilter] = useState<string>('');

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

  // Set initial month to current month
  useEffect(() => {
    const currentDate = new Date();
    const currentMonth = currentDate.toLocaleString('en-US', { month: 'long' });
    const currentYear = currentDate.getFullYear();
    setSelectedMonth(`${currentMonth} ${currentYear}`);
  }, []);

  // Fetch stores monthly data
  const fetchStoresData = useCallback(async () => {
    if (!selectedMonth) return;
    
    setLoading(true);
    setError(null);
    try {
      // For users with restricted roles, use their mapped agent name
      const agentName = hasRestrictedRole ? getAgentNameFromRole(userRoleForFiltering!) : undefined;
      
      const response = await fetchStoreMonthly(selectedMonth, agentName);
      setStores(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch store monthly data');
      console.error('Failed to fetch store monthly data:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, hasRestrictedRole, userRoleForFiltering]);

  // Fetch stores without orders
  const fetchNoOrderStores = useCallback(async () => {
    if (!selectedMonth) return;
    
    // Don't fetch if data already exists for this month
    if (noOrderDataFetched) {
      return;
    }
    
    setNoOrderLoading(true);
    setNoOrderError(null);
    try {
      // For users with restricted roles, use their mapped agent name
      const agentName = hasRestrictedRole ? getAgentNameFromRole(userRoleForFiltering!) : undefined;
      
      const response = await fetchStoreSummary(selectedMonth, agentName);
      setNoOrderStores(response.data.no_order || []);
      setNoOrderDataFetched(true); // Mark as fetched
    } catch (err) {
      setNoOrderError(err instanceof Error ? err.message : 'Failed to fetch stores without orders');
      console.error('Failed to fetch stores without orders:', err);
    } finally {
      setNoOrderLoading(false);
    }
  }, [selectedMonth, hasRestrictedRole, userRoleForFiltering, noOrderDataFetched]);

  // Fetch stores data when month changes
  useEffect(() => {
    fetchStoresData();
    // Reset no order data when month changes
    setNoOrderStores([]);
    setNoOrderDataFetched(false);
    setNoOrderError(null);
    setNoOrderPage(0);
    setNoOrderLoading(false);
    // Reset filters
    setNoOrderSearchQuery('');
    setNoOrderAgentFilter('');
    setNoOrderSegmentFilter('');
    setNoOrderUserStatusFilter('');
  }, [selectedMonth, fetchStoresData]);

  // Fetch no order stores when month is set (on page load and when month changes)
  useEffect(() => {
    if (selectedMonth && !noOrderDataFetched && !noOrderLoading) {
      fetchNoOrderStores();
    }
  }, [selectedMonth, noOrderDataFetched, noOrderLoading, fetchNoOrderStores]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleNoOrderPageChange = (event: unknown, newPage: number) => {
    setNoOrderPage(newPage);
  };

  const handleNoOrderRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNoOrderRowsPerPage(parseInt(event.target.value, 10));
    setNoOrderPage(0);
  };

  // Filter stores without orders
  const filteredNoOrderStores = useMemo(() => {
    return noOrderStores.filter((store) => {
      // Apply search filter
      if (noOrderSearchQuery) {
        const query = noOrderSearchQuery.toLowerCase();
        const matchesSearch = 
          store.store_name.toLowerCase().includes(query) ||
          store.segment.toLowerCase().includes(query) ||
          store.area.toLowerCase().includes(query) ||
          store.agent_name.toLowerCase().includes(query) ||
          store.user_status.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }
      
      // Apply agent filter
      if (noOrderAgentFilter && store.agent_name !== noOrderAgentFilter) {
        return false;
      }
      
      // Apply segment filter
      if (noOrderSegmentFilter && store.segment !== noOrderSegmentFilter) {
        return false;
      }
      
      // Apply user status filter
      if (noOrderUserStatusFilter && store.user_status !== noOrderUserStatusFilter) {
        return false;
      }
      
      return true;
    });
  }, [noOrderStores, noOrderSearchQuery, noOrderAgentFilter, noOrderSegmentFilter, noOrderUserStatusFilter]);

  // Get unique values for filters
  const uniqueNoOrderAgents = useMemo(() => {
    return Array.from(new Set(noOrderStores.map(store => store.agent_name).filter(Boolean))).sort();
  }, [noOrderStores]);

  const uniqueNoOrderSegments = useMemo(() => {
    return Array.from(new Set(noOrderStores.map(store => store.segment).filter(Boolean))).sort();
  }, [noOrderStores]);

  const uniqueNoOrderUserStatuses = useMemo(() => {
    return Array.from(new Set(noOrderStores.map(store => store.user_status).filter(Boolean))).sort();
  }, [noOrderStores]);

  const paginatedNoOrderStores = filteredNoOrderStores.slice(
    noOrderPage * noOrderRowsPerPage,
    noOrderPage * noOrderRowsPerPage + noOrderRowsPerPage
  );

  const handleNoOrderSearchChange = (value: string) => {
    setNoOrderSearchQuery(value);
    setNoOrderPage(0);
  };

  const handleNoOrderClearFilters = () => {
    setNoOrderSearchQuery('');
    setNoOrderAgentFilter('');
    setNoOrderSegmentFilter('');
    setNoOrderUserStatusFilter('');
    setNoOrderPage(0);
  };

  const handleNoOrderExport = () => {
    const exportData = filteredNoOrderStores.map((store) => ({
      'Store Name': store.store_name,
      'Segment': store.segment,
      'Area': store.area,
      'Agent': store.agent_name,
      'User Status': store.user_status,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Stores Without Orders');
    XLSX.writeFile(wb, `stores-without-orders-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleMonthChange = (event: any) => {
    setSelectedMonth(event.target.value);
  };

  return (
    <PageContainer title="Stores Monthly" description="View store monthly performance">
      <Box>
        {/* Header */}
        <Box mb={3}>
          <Typography variant="h3" fontWeight="bold" mb={1}>
            Stores Monthly
          </Typography>
          <Typography variant="body1" color="textSecondary">
            View store performance metrics for a specific month
          </Typography>
          {hasRestrictedRole && (
            <Typography variant="body2" color="info.main" sx={{ mt: 1, fontStyle: 'italic' }}>
              Showing data for {getAgentNameFromRole(userRoleForFiltering!)} only
            </Typography>
          )}
        </Box>

        {/* Month Filter */}
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Select Month</InputLabel>
                <Select
                  value={selectedMonth}
                  label="Select Month"
                  onChange={handleMonthChange}
                >
                  {monthOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
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

        {/* Tabs */}
        <Box sx={{ mb: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab 
              label={`Stores with Orders (${stores.length})`}
              id="stores-monthly-tab-0"
              aria-controls="stores-monthly-tabpanel-0"
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>Stores without Orders</span>
                  {noOrderLoading ? (
                    <CircularProgress size={16} />
                  ) : (
                    <span>({noOrderStores.length})</span>
                  )}
                </Box>
              }
              id="stores-monthly-tab-1"
              aria-controls="stores-monthly-tabpanel-1"
            />
          </Tabs>
        </Box>

        {/* Tab Panels */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ 
            flex: 1,
            width: '100%',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            gap: 3
          }}>
            <StoreMonthlyTable 
              stores={stores}
              loading={loading}
              onRefresh={fetchStoresData}
              title={`Store Performance - ${selectedMonth}`}
            />
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {noOrderLoading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', py: 4, gap: 2 }}>
              <CircularProgress />
              <Typography variant="body2" color="textSecondary">
                Loading stores without orders...
              </Typography>
            </Box>
          ) : noOrderError ? (
            <Box sx={{ py: 2 }}>
              <Typography color="error">{noOrderError}</Typography>
            </Box>
          ) : (
            <Card>
              <CardContent>
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" fontWeight="bold">
                    Stores without Orders - {selectedMonth}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<DownloadIcon />}
                      onClick={handleNoOrderExport}
                      disabled={filteredNoOrderStores.length === 0}
                    >
                      Export
                    </Button>
                    <Button
                      variant="outlined"
                      color="secondary"
                      size="small"
                      onClick={handleNoOrderClearFilters}
                      disabled={!noOrderSearchQuery && !noOrderAgentFilter && !noOrderSegmentFilter && !noOrderUserStatusFilter}
                    >
                      Clear Filters
                    </Button>
                  </Box>
                </Box>

                {/* Summary Stats */}
                <Box mb={3} sx={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
                  <Box sx={{ textAlign: 'center', minWidth: '200px' }}>
                    <Typography variant="h3" color="primary" fontWeight="bold" mb={1}>
                      {filteredNoOrderStores.length}
                    </Typography>
                    <Typography variant="h6" color="textSecondary" fontWeight="500">
                      Total Stores
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
                        value={noOrderSearchQuery}
                        onChange={(e) => handleNoOrderSearchChange(e.target.value)}
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
                        <InputLabel>Agent</InputLabel>
                        <Select
                          value={noOrderAgentFilter}
                          label="Agent"
                          onChange={(e) => {
                            setNoOrderAgentFilter(e.target.value);
                            setNoOrderPage(0);
                          }}
                        >
                          <MenuItem value="">All Agents</MenuItem>
                          {uniqueNoOrderAgents.map((agent) => (
                            <MenuItem key={agent} value={agent}>
                              {agent}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <FormControl fullWidth>
                        <InputLabel>Segment</InputLabel>
                        <Select
                          value={noOrderSegmentFilter}
                          label="Segment"
                          onChange={(e) => {
                            setNoOrderSegmentFilter(e.target.value);
                            setNoOrderPage(0);
                          }}
                        >
                          <MenuItem value="">All Segments</MenuItem>
                          {uniqueNoOrderSegments.map((segment) => (
                            <MenuItem key={segment} value={segment}>
                              {segment}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <FormControl fullWidth>
                        <InputLabel>User Status</InputLabel>
                        <Select
                          value={noOrderUserStatusFilter}
                          label="User Status"
                          onChange={(e) => {
                            setNoOrderUserStatusFilter(e.target.value);
                            setNoOrderPage(0);
                          }}
                        >
                          <MenuItem value="">All User Statuses</MenuItem>
                          {uniqueNoOrderUserStatuses.map((status) => (
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
                        <TableCell><strong>Store Name</strong></TableCell>
                        <TableCell><strong>Segment</strong></TableCell>
                        <TableCell><strong>Area</strong></TableCell>
                        <TableCell><strong>Agent</strong></TableCell>
                        <TableCell><strong>User Status</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedNoOrderStores.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} align="center">
                            <Typography variant="body2" color="textSecondary">
                              No stores found
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedNoOrderStores.map((store) => (
                          <TableRow key={store.user_id} hover>
                            <TableCell>
                              <Typography variant="body2" fontWeight="medium">
                                {store.store_name}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="textSecondary">
                                {store.segment || 'N/A'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="textSecondary">
                                {store.area}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="textSecondary">
                                {store.agent_name}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={store.user_status}
                                size="small"
                                color={store.user_status === 'Active' ? 'success' : 'default'}
                              />
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                  <TablePagination
                    component="div"
                    count={filteredNoOrderStores.length}
                    rowsPerPage={noOrderRowsPerPage}
                    page={noOrderPage}
                    onPageChange={handleNoOrderPageChange}
                    onRowsPerPageChange={handleNoOrderRowsPerPageChange}
                    rowsPerPageOptions={[5, 10, 25, 50]}
                  />
                </TableContainer>
              </CardContent>
            </Card>
          )}
        </TabPanel>
      </Box>
    </PageContainer>
  );
};

export default function ProtectedStoresMonthlyPage() {
  return (
    <ProtectedRoute requiredRoles={getPageRoles('DISTRIBUSI_DASHBOARD')}>
      <StoresMonthlyPage />
    </ProtectedRoute>
  );
}
