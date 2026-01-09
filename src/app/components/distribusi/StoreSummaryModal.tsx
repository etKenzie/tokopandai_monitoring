'use client';

import { fetchStoreSummary, StoreSummaryItem } from '@/app/api/distribusi/DistribusiSlice';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tabs,
  Tab,
  TextField,
  Typography
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';

interface StoreSummaryModalProps {
  open: boolean;
  onClose: () => void;
  month: string;
  agent?: string;
}

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
      id={`store-summary-tabpanel-${index}`}
      aria-labelledby={`store-summary-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const StoreSummaryModal = ({ open, onClose, month, agent }: StoreSummaryModalProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasOrderStores, setHasOrderStores] = useState<StoreSummaryItem[]>([]);
  const [noOrderStores, setNoOrderStores] = useState<StoreSummaryItem[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearchQuery, setActiveSearchQuery] = useState('');

  useEffect(() => {
    if (open && month) {
      fetchStoreSummaryData();
    } else {
      // Reset state when modal closes
      setHasOrderStores([]);
      setNoOrderStores([]);
      setError(null);
      setTabValue(0);
      setPage(0);
      setSearchQuery('');
      setActiveSearchQuery('');
    }
  }, [open, month, agent]);

  const fetchStoreSummaryData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchStoreSummary(month, agent);
      setHasOrderStores(response.data.has_order || []);
      setNoOrderStores(response.data.no_order || []);
    } catch (err) {
      console.error('Failed to fetch store summary:', err);
      setError(err instanceof Error ? err.message : 'Failed to load store summary');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setPage(0); // Reset pagination when switching tabs
  };

  const handleSearch = () => {
    setActiveSearchQuery(searchQuery);
    setPage(0); // Reset to first page when searching
  };

  const handleSearchKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setActiveSearchQuery('');
    setPage(0);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Use useMemo to calculate current stores based on tab and search
  const currentStores = useMemo(() => {
    const stores = tabValue === 0 ? hasOrderStores : noOrderStores;
    if (!activeSearchQuery) return stores;
    
    const query = activeSearchQuery.toLowerCase();
    return stores.filter((store) => {
      return (
        store.store_name.toLowerCase().includes(query) ||
        (store.reseller_code && store.reseller_code.toLowerCase().includes(query)) ||
        store.segment.toLowerCase().includes(query) ||
        store.area.toLowerCase().includes(query) ||
        store.agent_name.toLowerCase().includes(query) ||
        (store.phone_number && store.phone_number.toLowerCase().includes(query)) ||
        store.user_status.toLowerCase().includes(query)
      );
    });
  }, [tabValue, hasOrderStores, noOrderStores, activeSearchQuery]);

  const paginatedStores = currentStores.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle>
        Store Summary - {month}
        {agent && (
          <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
            Agent: {agent}
          </Typography>
        )}
      </DialogTitle>
      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ py: 2 }}>
            <Typography color="error">{error}</Typography>
          </Box>
        ) : (
          <Box>
            <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
              <Tab 
                label={`Stores with Orders (${hasOrderStores.length})`}
                id="store-summary-tab-0"
                aria-controls="store-summary-tabpanel-0"
              />
              <Tab 
                label={`Stores without Orders (${noOrderStores.length})`}
                id="store-summary-tab-1"
                aria-controls="store-summary-tabpanel-1"
              />
            </Tabs>

            {/* Search Bar */}
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search stores by name, code, segment, area, agent, phone, or status..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                sx={{ flex: 1 }}
              />
              <Button
                variant="contained"
                onClick={handleSearch}
                sx={{ minWidth: 100 }}
              >
                Search
              </Button>
              {activeSearchQuery && (
                <Button
                  variant="outlined"
                  onClick={handleClearSearch}
                  sx={{ minWidth: 100 }}
                >
                  Clear
                </Button>
              )}
            </Box>
            {activeSearchQuery && (
              <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                Showing {currentStores.length} result{currentStores.length !== 1 ? 's' : ''} for &quot;{activeSearchQuery}&quot;
              </Typography>
            )}

            <TabPanel value={tabValue} index={0}>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Store Name</strong></TableCell>
                      <TableCell><strong>Reseller Code</strong></TableCell>
                      <TableCell><strong>Segment</strong></TableCell>
                      <TableCell><strong>Area</strong></TableCell>
                      <TableCell><strong>Agent</strong></TableCell>
                      <TableCell><strong>Phone Number</strong></TableCell>
                      <TableCell><strong>User Status</strong></TableCell>
                      <TableCell align="right"><strong>Total Invoice</strong></TableCell>
                      <TableCell align="right"><strong>Total Profit</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedStores.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} align="center">
                          <Typography variant="body2" color="textSecondary">
                            No stores found
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedStores.map((store) => (
                        <TableRow key={store.user_id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {store.store_name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="textSecondary">
                              {store.reseller_code || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={store.segment} size="small" />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{store.area}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{store.agent_name}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{store.phone_number || '-'}</Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={store.user_status}
                              size="small"
                              color={store.user_status === 'Active' ? 'success' : 'default'}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight="medium">
                              {store.total_invoice !== undefined 
                                ? new Intl.NumberFormat('id-ID', {
                                    style: 'currency',
                                    currency: 'IDR',
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0,
                                  }).format(store.total_invoice)
                                : '-'
                              }
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight="medium" color="success.main">
                              {store.total_profit !== undefined 
                                ? new Intl.NumberFormat('id-ID', {
                                    style: 'currency',
                                    currency: 'IDR',
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0,
                                  }).format(store.total_profit)
                                : '-'
                              }
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                <TablePagination
                  component="div"
                  count={currentStores.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  rowsPerPageOptions={[5, 10, 25, 50]}
                />
              </TableContainer>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
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
                    {paginatedStores.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          <Typography variant="body2" color="textSecondary">
                            No stores found
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedStores.map((store) => (
                        <TableRow key={store.user_id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {store.store_name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={store.segment} size="small" />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{store.area}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{store.agent_name}</Typography>
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
                  count={currentStores.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  rowsPerPageOptions={[5, 10, 25, 50]}
                />
              </TableContainer>
            </TabPanel>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StoreSummaryModal;

