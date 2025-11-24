'use client';

import { Close as CloseIcon } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Tab,
  Tabs,
  Typography
} from '@mui/material';
import { useEffect, useState } from 'react';
import { Store, StoreMetadata, StoreOrder, StoreProduct, fetchStoreOrders, fetchStoreProducts } from '../../api/distribusi/StoreSlice';
import StoreOrdersTable from './StoreOrdersTable';
import StoreProductsTable from './StoreProductsTable';
import StoreSummaryTab from './StoreSummaryTab';

interface StoreDetailModalProps {
  open: boolean;
  onClose: () => void;
  store: Store | null;
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
      id={`store-tabpanel-${index}`}
      aria-labelledby={`store-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const StoreDetailModal = ({ open, onClose, store }: StoreDetailModalProps) => {
  const [storeOrders, setStoreOrders] = useState<StoreOrder[]>([]);
  const [storeProducts, setStoreProducts] = useState<StoreProduct[]>([]);
  const [storeMetadata, setStoreMetadata] = useState<StoreMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [intervalMonths, setIntervalMonths] = useState(1);

  useEffect(() => {
    if (open && store) {
      fetchStoreOrdersData();
      fetchStoreProductsData();
      setTabValue(0); // Reset to first tab when opening
    }
  }, [open, store]);

  // Refetch products data when intervalMonths changes
  useEffect(() => {
    if (open && store) {
      fetchStoreProductsData();
    }
  }, [intervalMonths]);

  const fetchStoreOrdersData = async () => {
    if (!store) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetchStoreOrders(store.user_id);
      setStoreOrders(response.data.data);
      setStoreMetadata(response.data.metadata);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch store orders');
      console.error('Failed to fetch store orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStoreProductsData = async () => {
    if (!store) return;

    setProductsLoading(true);
    setProductsError(null);
    try {
      const response = await fetchStoreProducts(store.user_id, intervalMonths);
      setStoreProducts(response.data);
    } catch (err) {
      setProductsError(err instanceof Error ? err.message : 'Failed to fetch store products');
      console.error('Failed to fetch store products:', err);
    } finally {
      setProductsLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
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


  if (!store) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: { minHeight: '90vh' }
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h5" component="div">
              {store.store_name}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {storeMetadata?.reseller_name || store.reseller_name} • {storeMetadata?.areas || store.areas} • {storeMetadata?.segment || store.segment}
            </Typography>
          </Box>
          <Button
            onClick={onClose}
            startIcon={<CloseIcon />}
            variant="outlined"
            size="small"
          >
            Close
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : (
          <Box>
            {/* Store Information Header */}
            <Box mb={3}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="primary" fontWeight="bold">
                      {storeMetadata ? formatDate(storeMetadata.first_order_date) : formatDate(store.first_order_date)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      First Order Date
                    </Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="success.main" fontWeight="bold">
                      {formatCurrency(storeMetadata?.["3_month_profit"] || store["3_month_profit"] || 0)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      3 Month Profit
                    </Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="info.main" fontWeight="bold">
                      {storeMetadata?.active_months || store.active_months || 0}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Active Months
                    </Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="info.main" fontWeight="bold">
                      {storeMetadata?.user_status || store.user_status}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Status
                    </Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="info.main" fontWeight="bold">
                      {store.payment_status || 'N/A'}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Payment Status
                    </Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="info.main" fontWeight="bold">
                      {storeMetadata?.agent_name || store.agent_name}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Agent Name
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Box>

            {/* Performance Scores */}
            <Box mb={3}>
              <Typography variant="h6" gutterBottom>
                Performance Scores
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="primary.main" fontWeight="bold">
                      {storeMetadata?.final_score || store.final_score}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Final Score
                    </Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="success.main" fontWeight="bold">
                      {storeMetadata?.profit_score || store.profit_score}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Profit Score
                    </Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="warning.main" fontWeight="bold">
                      {storeMetadata?.owed_score || store.owed_score}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Owed Score
                    </Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="info.main" fontWeight="bold">
                      {storeMetadata?.activity_score || store.activity_score}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Activity Score
                    </Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="primary.main" fontWeight="bold">
                      {storeMetadata?.payment_habits_score || store.payment_habits_score}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Payment Habits Score
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tabValue} onChange={handleTabChange} aria-label="store detail tabs">
                <Tab label="Summary" />
                <Tab label="Orders" />
                <Tab label="Products" />
              </Tabs>
            </Box>

            <TabPanel value={tabValue} index={0}>
              <StoreSummaryTab storeOrders={storeOrders} />
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <StoreOrdersTable storeOrders={storeOrders} />
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              {/* Products Interval Filter */}
              <Box mb={3} sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Time Interval</InputLabel>
                  <Select
                    value={intervalMonths}
                    label="Time Interval"
                    onChange={(e) => setIntervalMonths(Number(e.target.value))}
                  >
                    <MenuItem value={1}>1 Month</MenuItem>
                    <MenuItem value={3}>3 Months</MenuItem>
                    <MenuItem value={6}>6 Months</MenuItem>
                    <MenuItem value={12}>12 Months</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {productsError ? (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {productsError}
                </Alert>
              ) : (
                <StoreProductsTable 
                  products={storeProducts} 
                  loading={productsLoading} 
                />
              )}
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

export default StoreDetailModal;
