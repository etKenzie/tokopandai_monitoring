'use client';

import {
  fetchPrincipalOrders,
  PrincipalOrder,
} from '@/app/api/distribusi/DistribusiSlice';
import OrderDetailModal from '@/app/components/shared/OrderDetailModal';
import {
  Close as CloseIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  OpenInNew as OpenInNewIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Tabs,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useMemo, useState, Fragment } from 'react';
import PrincipalMonthlyTrendChart from './PrincipalMonthlyTrendChart';
import {
  formatDateRangeLabel,
  getCurrentMonthLabel,
  getDateRangeForPreset,
  PERIOD_LABELS,
  PeriodPreset,
} from './principalPeriodUtils';

interface PrincipalOrdersModalProps {
  open: boolean;
  onClose: () => void;
  principalId: string | null;
  principalName: string | null;
  brandName?: string | null;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

interface StoreSummary {
  user_id: string;
  store_name: string;
  segment: string;
  area: string;
  agent_name: string;
  business_type: string;
  sub_business_type: string;
  order_count: number;
  principal_total_quantity: number;
  principal_total_invoice: number;
  principal_total_profit: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`principal-orders-tabpanel-${index}`}
      aria-labelledby={`principal-orders-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

const formatDate = (dateString: string | null) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatPercent = (value: number) =>
  new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

const getPaymentStatusColor = (status: string) => {
  switch (status) {
    case 'LUNAS':
      return 'success';
    case 'BELUM LUNAS':
      return 'error';
    case 'SEBAGIAN':
      return 'warning';
    default:
      return 'default';
  }
};

const getOrderStatusColor = (status: string) => {
  switch (status) {
    case 'PACKAGED':
      return 'success';
    case 'PROCESS DELIVERY':
      return 'warning';
    case 'DELIVERED':
      return 'info';
    case 'CANCELLED':
      return 'error';
    default:
      return 'default';
  }
};

const PrincipalOrdersModal = ({
  open,
  onClose,
  principalId,
  principalName,
  brandName,
}: PrincipalOrdersModalProps) => {
  const [orders, setOrders] = useState<PrincipalOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('6m');
  const periodRange = useMemo(() => getDateRangeForPreset(periodPreset), [periodPreset]);
  const [tabValue, setTabValue] = useState(0);
  const [ordersPage, setOrdersPage] = useState(0);
  const [storesPage, setStoresPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [storeOrderBy, setStoreOrderBy] = useState<keyof StoreSummary>('principal_total_invoice');
  const [storeOrder, setStoreOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedOrderCode, setSelectedOrderCode] = useState<string | null>(null);
  const [orderDetailOpen, setOrderDetailOpen] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const currentMonthLabel = useMemo(() => getCurrentMonthLabel(), []);

  const fetchOrders = useCallback(async () => {
    if (!principalId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetchPrincipalOrders({
        principal_id: principalId,
        sortTime: 'desc',
        start_date: periodRange.start_date,
        end_date: periodRange.end_date,
      });
      setOrders(response.data?.data ?? []);
    } catch (err) {
      console.error('Failed to fetch principal orders:', err);
      setOrders([]);
      setError(err instanceof Error ? err.message : 'Failed to load principal orders');
    } finally {
      setLoading(false);
    }
  }, [principalId, periodRange.start_date, periodRange.end_date]);

  useEffect(() => {
    if (open && principalId) {
      setPeriodPreset('6m');
      setTabValue(0);
      setOrdersPage(0);
      setStoresPage(0);
      setExpandedOrderId(null);
    } else {
      setOrders([]);
      setError(null);
    }
  }, [open, principalId]);

  useEffect(() => {
    if (open && principalId) {
      fetchOrders();
    }
  }, [open, principalId, periodPreset, fetchOrders]);

  const storeSummaries = useMemo(() => {
    const storeMap = new Map<string, StoreSummary>();

    orders.forEach((order) => {
      const userId = order.user_id;
      if (!storeMap.has(userId)) {
        storeMap.set(userId, {
          user_id: userId,
          store_name: order.store_name,
          segment: order.segment,
          area: order.area,
          agent_name: order.agent_name,
          business_type: order.business_type,
          sub_business_type: order.sub_business_type,
          order_count: 0,
          principal_total_quantity: 0,
          principal_total_invoice: 0,
          principal_total_profit: 0,
        });
      }

      const store = storeMap.get(userId)!;
      store.order_count += 1;
      store.principal_total_quantity += order.principal_total_quantity || 0;
      store.principal_total_invoice += order.principal_total_invoice || 0;
      store.principal_total_profit += order.principal_total_profit || 0;
    });

    return Array.from(storeMap.values());
  }, [orders]);

  const metrics = useMemo(() => {
    const uniqueStores = storeSummaries.length;
    const repeatStores = storeSummaries.filter((s) => s.order_count > 1);
    const repeatOrders = storeSummaries.reduce(
      (sum, s) => sum + Math.max(0, s.order_count - 1),
      0
    );
    const totalPrincipalInvoice = orders.reduce(
      (sum, o) => sum + (o.principal_total_invoice || 0),
      0
    );
    const totalPrincipalProfit = orders.reduce(
      (sum, o) => sum + (o.principal_total_profit || 0),
      0
    );
    const totalPrincipalQuantity = orders.reduce(
      (sum, o) => sum + (o.principal_total_quantity || 0),
      0
    );
    const totalLineItems = orders.reduce((sum, o) => sum + (o.products?.length ?? 0), 0);

    return {
      totalOrders: orders.length,
      uniqueStores,
      repeatStores: repeatStores.length,
      repeatOrders,
      totalPrincipalInvoice,
      totalPrincipalProfit,
      totalPrincipalQuantity,
      totalLineItems,
    };
  }, [orders, storeSummaries]);

  const currentMonthMetrics = useMemo(() => {
    const monthOrders = orders.filter((o) => o.month === currentMonthLabel);
    const storeIds = new Set(monthOrders.map((o) => o.user_id));
    const principalInvoice = monthOrders.reduce(
      (sum, o) => sum + (o.principal_total_invoice || 0),
      0
    );
    const principalProfit = monthOrders.reduce(
      (sum, o) => sum + (o.principal_total_profit || 0),
      0
    );

    return {
      month: currentMonthLabel,
      order_count: monthOrders.length,
      unique_stores: storeIds.size,
      principal_invoice: principalInvoice,
      principal_profit: principalProfit,
      margin: principalInvoice > 0 ? (principalProfit / principalInvoice) * 100 : 0,
    };
  }, [orders, currentMonthLabel]);

  const sortedStores = useMemo(() => {
    return [...storeSummaries].sort((a, b) => {
      const aValue = a[storeOrderBy];
      const bValue = b[storeOrderBy];
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return storeOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
      const aText = String(aValue ?? '').toLowerCase();
      const bText = String(bValue ?? '').toLowerCase();
      return storeOrder === 'asc' ? aText.localeCompare(bText) : bText.localeCompare(aText);
    });
  }, [storeSummaries, storeOrder, storeOrderBy]);

  const paginatedOrders = orders.slice(
    ordersPage * rowsPerPage,
    ordersPage * rowsPerPage + rowsPerPage
  );
  const paginatedStores = sortedStores.slice(
    storesPage * rowsPerPage,
    storesPage * rowsPerPage + rowsPerPage
  );

  const handleStoreSort = (property: keyof StoreSummary) => {
    const isAsc = storeOrderBy === property && storeOrder === 'asc';
    setStoreOrder(isAsc ? 'desc' : 'asc');
    setStoreOrderBy(property);
  };

  const toggleOrderExpand = (orderId: string) => {
    setExpandedOrderId((prev) => (prev === orderId ? null : orderId));
  };

  const openOrderDetail = (orderCode: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedOrderCode(orderCode);
    setOrderDetailOpen(true);
  };

  if (!principalId) return null;

  const orderColSpan = 11;

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="xl"
        fullWidth
        PaperProps={{ sx: { minHeight: '90vh' } }}
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={2}>
            <Box>
              <Typography variant="h5" component="div">
                {principalName ?? 'Principal'}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {brandName ? `Brand: ${brandName} • ` : ''}
                {periodRange.label}
                {periodRange.start_date && periodRange.end_date
                  ? ` • ${formatDateRangeLabel(periodRange.start_date, periodRange.end_date)}`
                  : ''}
              </Typography>
            </Box>
            <Button onClick={onClose} startIcon={<CloseIcon />} variant="outlined" size="small">
              Close
            </Button>
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          <Box sx={{ mb: 3 }}>
            <ToggleButtonGroup
              exclusive
              value={periodPreset}
              onChange={(_, value: PeriodPreset | null) => {
                if (value) setPeriodPreset(value);
              }}
              size="small"
              sx={{ flexWrap: 'wrap' }}
            >
              {(Object.keys(PERIOD_LABELS) as PeriodPreset[]).map((key) => (
                <ToggleButton key={key} value={key}>
                  {PERIOD_LABELS[key]}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>

          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : (
            <Box>
              <Box mb={3}>
                <Typography variant="h6" gutterBottom>
                  Current Month — {currentMonthMetrics.month}
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" color="primary" fontWeight="bold">
                        {formatCurrency(currentMonthMetrics.principal_invoice)}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Principal Invoice
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" color="success.main" fontWeight="bold">
                        {formatCurrency(currentMonthMetrics.principal_profit)}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Principal Profit
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" color="info.main" fontWeight="bold">
                        {currentMonthMetrics.order_count}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Orders
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" color="info.main" fontWeight="bold">
                        {currentMonthMetrics.unique_stores}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Stores
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" color="warning.main" fontWeight="bold">
                        {formatPercent(currentMonthMetrics.margin)}%
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Margin
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>

              <Box mb={3}>
                <Typography variant="h6" gutterBottom>
                  Period Summary — {PERIOD_LABELS[periodPreset]}
                </Typography>
              <Grid container spacing={2} sx={{ mb: 0 }}>
                <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="primary" fontWeight="bold">
                      {metrics.totalOrders}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Orders
                    </Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="info.main" fontWeight="bold">
                      {metrics.uniqueStores}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Stores
                    </Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="warning.main" fontWeight="bold">
                      {metrics.repeatStores}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Repeat Stores
                    </Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="warning.main" fontWeight="bold">
                      {metrics.repeatOrders}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Repeat Orders
                    </Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="success.main" fontWeight="bold">
                      {formatCurrency(metrics.totalPrincipalInvoice)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Principal Invoice
                    </Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="success.main" fontWeight="bold">
                      {formatCurrency(metrics.totalPrincipalProfit)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Principal Profit
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
              </Box>

              <PrincipalMonthlyTrendChart
                orders={orders}
                startDate={periodRange.start_date}
                endDate={periodRange.end_date}
              />

              <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ mb: 1 }}>
                <Tab label={`Orders (${orders.length})`} />
                <Tab label={`Stores (${storeSummaries.length})`} />
              </Tabs>

              <TabPanel value={tabValue} index={0}>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                  Click a row to expand principal line items. Use the order link for full order detail.
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell width={40} />
                        <TableCell>Order</TableCell>
                        <TableCell>Store</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Payment</TableCell>
                        <TableCell>Hub</TableCell>
                        <TableCell>Products</TableCell>
                        <TableCell align="right">Qty</TableCell>
                        <TableCell align="right">Principal Invoice</TableCell>
                        <TableCell align="right">Principal Profit</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedOrders.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={orderColSpan} align="center">
                            <Typography variant="body2" color="textSecondary">
                              No orders in this date range
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedOrders.map((order) => {
                          const isExpanded = expandedOrderId === order.order_id;
                          const products = order.products ?? [];
                          return (
                            <Fragment key={order.order_id}>
                              <TableRow
                                key={order.order_id}
                                hover
                                sx={{ cursor: 'pointer' }}
                                onClick={() => toggleOrderExpand(order.order_id)}
                              >
                                <TableCell>
                                  <IconButton size="small" tabIndex={-1}>
                                    {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                  </IconButton>
                                </TableCell>
                                <TableCell>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <Typography variant="body2" fontWeight="bold">
                                      {order.order_code}
                                    </Typography>
                                    <IconButton
                                      size="small"
                                      title="Open full order"
                                      onClick={(e) => openOrderDetail(order.order_code, e)}
                                    >
                                      <OpenInNewIcon fontSize="small" />
                                    </IconButton>
                                  </Box>
                                  <Typography variant="caption" color="textSecondary">
                                    {order.month}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2" fontWeight="medium">
                                    {order.store_name}
                                  </Typography>
                                  <Typography variant="caption" color="textSecondary">
                                    {order.business_type}
                                    {order.sub_business_type ? ` • ${order.sub_business_type}` : ''}
                                  </Typography>
                                  <Typography variant="caption" display="block" color="textSecondary">
                                    {order.area} • {order.segment} • {order.agent_name}
                                  </Typography>
                                </TableCell>
                                <TableCell>{formatDate(order.order_date)}</TableCell>
                                <TableCell>
                                  <Chip
                                    label={order.status_order}
                                    size="small"
                                    color={getOrderStatusColor(order.status_order) as 'success'}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={order.status_payment}
                                    size="small"
                                    color={getPaymentStatusColor(order.status_payment) as 'success'}
                                  />
                                  <Typography variant="caption" display="block" color="textSecondary">
                                    {order.payment_type}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2">{order.process_hub}</Typography>
                                  {order.overdue_status && (
                                    <Chip
                                      label={order.overdue_status}
                                      size="small"
                                      variant="outlined"
                                      sx={{ mt: 0.5 }}
                                    />
                                  )}
                                </TableCell>
                                <TableCell>
                                  {products.length > 0 ? (
                                    <Chip
                                      label={`${products.length} item${products.length === 1 ? '' : 's'}`}
                                      size="small"
                                      variant="outlined"
                                    />
                                  ) : (
                                    '—'
                                  )}
                                </TableCell>
                                <TableCell align="right">{order.principal_total_quantity}</TableCell>
                                <TableCell align="right">
                                  {formatCurrency(order.principal_total_invoice)}
                                </TableCell>
                                <TableCell align="right" sx={{ color: 'success.main', fontWeight: 'bold' }}>
                                  {formatCurrency(order.principal_total_profit)}
                                </TableCell>
                              </TableRow>
                              <TableRow key={`${order.order_id}-detail`}>
                                <TableCell colSpan={orderColSpan} sx={{ py: 0, borderBottom: isExpanded ? undefined : 0 }}>
                                  <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                    <Box sx={{ py: 2, px: 1 }}>
                                      {products.length === 0 ? (
                                        <Typography variant="body2" color="textSecondary">
                                          No principal line items on this order.
                                        </Typography>
                                      ) : (
                                        <Table size="small">
                                          <TableHead>
                                            <TableRow>
                                              <TableCell>Product</TableCell>
                                              <TableCell>SKU</TableCell>
                                              <TableCell>Brand</TableCell>
                                              <TableCell>Variant</TableCell>
                                              <TableCell align="right">Qty</TableCell>
                                              <TableCell align="right">Sale Price</TableCell>
                                              <TableCell align="right">Buy Price</TableCell>
                                              <TableCell align="right">Invoice</TableCell>
                                              <TableCell align="right">Profit</TableCell>
                                            </TableRow>
                                          </TableHead>
                                          <TableBody>
                                            {products.map((item) => (
                                              <TableRow key={item.order_item_id}>
                                                <TableCell>
                                                  <Typography variant="body2" fontWeight="medium">
                                                    {item.product_name}
                                                  </Typography>
                                                </TableCell>
                                                <TableCell>{item.sku}</TableCell>
                                                <TableCell>
                                                  <Chip label={item.brand_name} size="small" variant="outlined" />
                                                </TableCell>
                                                <TableCell>{item.variant_name}</TableCell>
                                                <TableCell align="right">{item.order_quantity}</TableCell>
                                                <TableCell align="right">{formatCurrency(item.price)}</TableCell>
                                                <TableCell align="right">{formatCurrency(item.buy_price)}</TableCell>
                                                <TableCell align="right">
                                                  {formatCurrency(item.total_invoice)}
                                                </TableCell>
                                                <TableCell align="right" sx={{ color: 'success.main' }}>
                                                  {formatCurrency(item.profit)}
                                                </TableCell>
                                              </TableRow>
                                            ))}
                                          </TableBody>
                                        </Table>
                                      )}
                                    </Box>
                                  </Collapse>
                                </TableCell>
                              </TableRow>
                            </Fragment>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  component="div"
                  count={orders.length}
                  page={ordersPage}
                  onPageChange={(_, p) => setOrdersPage(p)}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={(e) => {
                    setRowsPerPage(parseInt(e.target.value, 10));
                    setOrdersPage(0);
                    setStoresPage(0);
                  }}
                  rowsPerPageOptions={[10, 25, 50, 100]}
                />
              </TabPanel>

              <TabPanel value={tabValue} index={1}>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                  {metrics.repeatStores} store(s) ordered more than once ({metrics.repeatOrders} repeat
                  order{metrics.repeatOrders === 1 ? '' : 's'} in this period).
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sortDirection={storeOrderBy === 'store_name' ? storeOrder : false}>
                          <TableSortLabel
                            active={storeOrderBy === 'store_name'}
                            direction={storeOrderBy === 'store_name' ? storeOrder : 'asc'}
                            onClick={() => handleStoreSort('store_name')}
                          >
                            Store
                          </TableSortLabel>
                        </TableCell>
                        <TableCell>Business Type</TableCell>
                        <TableCell>Area</TableCell>
                        <TableCell>Agent</TableCell>
                        <TableCell align="right" sortDirection={storeOrderBy === 'order_count' ? storeOrder : false}>
                          <TableSortLabel
                            active={storeOrderBy === 'order_count'}
                            direction={storeOrderBy === 'order_count' ? storeOrder : 'asc'}
                            onClick={() => handleStoreSort('order_count')}
                          >
                            Orders
                          </TableSortLabel>
                        </TableCell>
                        <TableCell align="center">Repeat</TableCell>
                        <TableCell align="right" sortDirection={storeOrderBy === 'principal_total_invoice' ? storeOrder : false}>
                          <TableSortLabel
                            active={storeOrderBy === 'principal_total_invoice'}
                            direction={storeOrderBy === 'principal_total_invoice' ? storeOrder : 'asc'}
                            onClick={() => handleStoreSort('principal_total_invoice')}
                          >
                            Principal Invoice
                          </TableSortLabel>
                        </TableCell>
                        <TableCell align="right" sortDirection={storeOrderBy === 'principal_total_profit' ? storeOrder : false}>
                          <TableSortLabel
                            active={storeOrderBy === 'principal_total_profit'}
                            direction={storeOrderBy === 'principal_total_profit' ? storeOrder : 'asc'}
                            onClick={() => handleStoreSort('principal_total_profit')}
                          >
                            Principal Profit
                          </TableSortLabel>
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedStores.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} align="center">
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
                              <Typography variant="caption" color="textSecondary">
                                {store.segment}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">{store.business_type}</Typography>
                              {store.sub_business_type && (
                                <Typography variant="caption" color="textSecondary">
                                  {store.sub_business_type}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>{store.area}</TableCell>
                            <TableCell>{store.agent_name}</TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" fontWeight="bold">
                                {store.order_count}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              {store.order_count > 1 ? (
                                <Chip
                                  label={`${store.order_count - 1} repeat`}
                                  size="small"
                                  color="warning"
                                />
                              ) : (
                                <Chip label="New" size="small" color="default" variant="outlined" />
                              )}
                            </TableCell>
                            <TableCell align="right">
                              {formatCurrency(store.principal_total_invoice)}
                            </TableCell>
                            <TableCell align="right" sx={{ color: 'success.main', fontWeight: 'bold' }}>
                              {formatCurrency(store.principal_total_profit)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  component="div"
                  count={sortedStores.length}
                  page={storesPage}
                  onPageChange={(_, p) => setStoresPage(p)}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={(e) => {
                    setRowsPerPage(parseInt(e.target.value, 10));
                    setOrdersPage(0);
                    setStoresPage(0);
                  }}
                  rowsPerPageOptions={[10, 25, 50, 100]}
                />
              </TabPanel>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      <OrderDetailModal
        open={orderDetailOpen}
        onClose={() => {
          setOrderDetailOpen(false);
          setSelectedOrderCode(null);
        }}
        orderCode={selectedOrderCode}
      />
    </>
  );
};

export default PrincipalOrdersModal;
