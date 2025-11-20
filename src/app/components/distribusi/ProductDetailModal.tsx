'use client';

import { Close as CloseIcon } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Tab,
  Tabs,
  Typography
} from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react';
import { Product, ProductOrder, fetchProductOrders } from '../../api/distribusi/ProductSlice';
import ProductOrdersTable from './ProductOrdersTable';
import ProductSummaryTab from './ProductSummaryTab';

interface ProductDetailModalProps {
  open: boolean;
  onClose: () => void;
  product: Product | null;
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
      id={`product-tabpanel-${index}`}
      aria-labelledby={`product-tab-${index}`}
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

const ProductDetailModal = ({ open, onClose, product }: ProductDetailModalProps) => {
  const [productOrders, setProductOrders] = useState<ProductOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    if (open && product) {
      fetchProductOrdersData();
      setTabValue(0); // Reset to first tab when opening
    }
  }, [open, product]);

  const fetchProductOrdersData = async () => {
    if (!product) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetchProductOrders(product.product_id);
      setProductOrders(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch product orders');
      console.error('Failed to fetch product orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const formatCurrency = (amount: number) => {
    // Handle NaN, null, undefined
    const value = Number(amount) || 0;
    if (isNaN(value) || !isFinite(value)) {
      return 'IDR 0';
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Calculate metrics from productOrders, but prefer product-level values if available
  const calculateMetrics = () => {
    // Use product-level values if available (new API format)
    if (product && (product.order_count !== undefined || product.active_stores !== undefined)) {
      let totalInvoice = product.total_invoice;
      let totalQuantity = product.total_quantity;
      
      // If not available at product level, calculate from orders
      if (totalInvoice === undefined && productOrders && productOrders.length > 0) {
        totalInvoice = productOrders.reduce((sum, order) => sum + (Number(order.total_invoice) || 0), 0);
      }
      if (totalQuantity === undefined && productOrders && productOrders.length > 0) {
        totalQuantity = productOrders.reduce((sum, order) => sum + (Number(order.order_quantity) || 0), 0);
      }
      
      // Calculate variant metrics from orders
      const variantMap = new Map<string, { totalBuyPrice: number; totalSalePrice: number; totalQuantity: number }>();
      
      if (productOrders && productOrders.length > 0) {
        productOrders.forEach(order => {
          const itemQuantity = Number(order.order_quantity) || 0;
          const itemBuyPrice = Number(order.buy_price) || 0;
          const itemPrice = Number(order.price) || 0; // sale price
          
          // Track variant metrics
          if (order.variant_name) {
            if (!variantMap.has(order.variant_name)) {
              variantMap.set(order.variant_name, {
                totalBuyPrice: 0,
                totalSalePrice: 0,
                totalQuantity: 0
              });
            }
            const variantData = variantMap.get(order.variant_name)!;
            variantData.totalQuantity += itemQuantity;
            if (itemQuantity > 0) {
              variantData.totalBuyPrice += itemBuyPrice * itemQuantity;
              variantData.totalSalePrice += itemPrice * itemQuantity;
            }
          }
        });
      }
      
      // Calculate averages per variant
      const variantMetrics: Record<string, { buy_price: number; sale_price: number; quantity: number }> = {};
      variantMap.forEach((data, variantName) => {
        variantMetrics[variantName] = {
          buy_price: data.totalQuantity > 0 ? data.totalBuyPrice / data.totalQuantity : 0,
          sale_price: data.totalQuantity > 0 ? data.totalSalePrice / data.totalQuantity : 0,
          quantity: data.totalQuantity
        };
      });
      
      return {
        total_invoice: totalInvoice || 0,
        order_count: product.order_count || 0,
        total_quantity: totalQuantity || 0,
        active_stores: product.active_stores || 0,
        variantMetrics
      };
    }
    
    // Otherwise, calculate from productOrders (old API format)
    if (!productOrders || productOrders.length === 0) {
      return {
        total_invoice: 0,
        order_count: 0,
        total_quantity: 0,
        active_stores: product?.active_stores || 0,
        variantMetrics: {} as Record<string, { buy_price: number; sale_price: number; quantity: number }>
      };
    }

    let totalInvoice = 0;
    let totalQuantity = 0;
    const variantMap = new Map<string, { totalBuyPrice: number; totalSalePrice: number; totalQuantity: number }>();
    const uniqueStores = new Set<string>();

    productOrders.forEach(order => {
      const itemInvoice = Number(order.total_invoice) || 0;
      const itemQuantity = Number(order.order_quantity) || 0;
      const itemBuyPrice = Number(order.buy_price) || 0;
      const itemPrice = Number(order.price) || 0; // sale price
      
      totalInvoice += itemInvoice;
      totalQuantity += itemQuantity;
      
      if (order.store_name) {
        uniqueStores.add(order.store_name);
      }

      // Track variant metrics
      if (order.variant_name) {
        if (!variantMap.has(order.variant_name)) {
          variantMap.set(order.variant_name, {
            totalBuyPrice: 0,
            totalSalePrice: 0,
            totalQuantity: 0
          });
        }
        const variantData = variantMap.get(order.variant_name)!;
        variantData.totalQuantity += itemQuantity;
        if (itemQuantity > 0) {
          variantData.totalBuyPrice += itemBuyPrice * itemQuantity;
          variantData.totalSalePrice += itemPrice * itemQuantity;
        }
      }
    });

    // Calculate averages per variant
    const variantMetrics: Record<string, { buy_price: number; sale_price: number; quantity: number }> = {};
    variantMap.forEach((data, variantName) => {
      variantMetrics[variantName] = {
        buy_price: data.totalQuantity > 0 ? data.totalBuyPrice / data.totalQuantity : 0,
        sale_price: data.totalQuantity > 0 ? data.totalSalePrice / data.totalQuantity : 0,
        quantity: data.totalQuantity
      };
    });

    return {
      total_invoice: totalInvoice,
      order_count: productOrders.length,
      total_quantity: totalQuantity,
      active_stores: uniqueStores.size || product?.active_stores || 0,
      variantMetrics
    };
  };

  const metrics = calculateMetrics();

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'FROZEN': return 'info';
      case 'MEAT': return 'error';
      case 'FRESH': return 'success';
      case 'DAIRY': return 'warning';
      default: return 'default';
    }
  };

  // Component to display stores list
  const ProductStoresList = ({ productOrders }: { productOrders: ProductOrder[] }) => {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [orderBy, setOrderBy] = useState<keyof StoreSummary>('total_invoice');
    const [order, setOrder] = useState<'asc' | 'desc'>('desc');

    interface StoreSummary {
      user_id: string;
      store_name: string;
      reseller_name: string;
      reseller_code: string;
      segment: string;
      area: string;
      agent_name: string;
      phone_number: string;
      business_type: string;
      sub_business_type: string;
      order_count: number;
      total_quantity: number;
      total_invoice: number;
      total_profit: number;
    }

    // Aggregate stores from productOrders
    const storeSummaries = useMemo(() => {
      const storeMap = new Map<string, StoreSummary>();

      productOrders.forEach(order => {
        const userId = order.user_id;
        if (!storeMap.has(userId)) {
          storeMap.set(userId, {
            user_id: userId,
            store_name: order.store_name,
            reseller_name: order.reseller_name,
            reseller_code: order.reseller_code,
            segment: order.segment,
            area: order.area,
            agent_name: order.agent_name,
            phone_number: order.phone_number,
            business_type: order.business_type,
            sub_business_type: order.sub_business_type,
            order_count: 0,
            total_quantity: 0,
            total_invoice: 0,
            total_profit: 0
          });
        }

        const store = storeMap.get(userId)!;
        store.order_count += 1;
        store.total_quantity += Number(order.order_quantity) || 0;
        store.total_invoice += Number(order.total_invoice) || 0;
        store.total_profit += Number(order.profit) || 0;
      });

      return Array.from(storeMap.values());
    }, [productOrders]);

    const handleRequestSort = (property: keyof StoreSummary) => {
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

    const sortedStores = [...storeSummaries].sort((a, b) => {
      const aValue = a[orderBy];
      const bValue = b[orderBy];

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return order === 'asc' ? aValue - bValue : bValue - aValue;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return order === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return 0;
    });

    const getSegmentColor = (segment: string) => {
      switch (segment) {
        case 'RESELLER': return 'primary';
        case 'HORECA': return 'success';
        case 'OTHER': return 'default';
        default: return 'default';
      }
    };

    if (storeSummaries.length === 0) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <Typography variant="body2" color="textSecondary">
            No stores found
          </Typography>
        </Box>
      );
    }

    return (
      <Box>
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'store_name'}
                    direction={orderBy === 'store_name' ? order : 'asc'}
                    onClick={() => handleRequestSort('store_name')}
                  >
                    Store Name
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'reseller_name'}
                    direction={orderBy === 'reseller_name' ? order : 'asc'}
                    onClick={() => handleRequestSort('reseller_name')}
                  >
                    Reseller Name
                  </TableSortLabel>
                </TableCell>
                <TableCell>Reseller Code</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'segment'}
                    direction={orderBy === 'segment' ? order : 'asc'}
                    onClick={() => handleRequestSort('segment')}
                  >
                    Segment
                  </TableSortLabel>
                </TableCell>
                <TableCell>Area</TableCell>
                <TableCell>Agent</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Business Type</TableCell>
                <TableCell align="right">
                  <TableSortLabel
                    active={orderBy === 'order_count'}
                    direction={orderBy === 'order_count' ? order : 'asc'}
                    onClick={() => handleRequestSort('order_count')}
                  >
                    Orders
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">
                  <TableSortLabel
                    active={orderBy === 'total_quantity'}
                    direction={orderBy === 'total_quantity' ? order : 'asc'}
                    onClick={() => handleRequestSort('total_quantity')}
                  >
                    Quantity
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">
                  <TableSortLabel
                    active={orderBy === 'total_invoice'}
                    direction={orderBy === 'total_invoice' ? order : 'asc'}
                    onClick={() => handleRequestSort('total_invoice')}
                  >
                    Total Invoice
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">
                  <TableSortLabel
                    active={orderBy === 'total_profit'}
                    direction={orderBy === 'total_profit' ? order : 'asc'}
                    onClick={() => handleRequestSort('total_profit')}
                  >
                    Total Profit
                  </TableSortLabel>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedStores
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((store) => (
                  <TableRow key={store.user_id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {store.store_name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {store.reseller_name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="textSecondary">
                        {store.reseller_code}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={store.segment}
                        size="small"
                        color={getSegmentColor(store.segment) as any}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {store.area}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {store.agent_name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="textSecondary">
                        {store.phone_number || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {store.business_type}
                      </Typography>
                      {store.sub_business_type && (
                        <Typography variant="caption" color="textSecondary" display="block">
                          {store.sub_business_type}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="medium">
                        {store.order_count}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {store.total_quantity}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="medium">
                        {formatCurrency(store.total_invoice)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="medium" color="success.main">
                        {formatCurrency(store.total_profit)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={storeSummaries.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </TableContainer>
      </Box>
    );
  };

  if (!product) return null;

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
              {product.product_name}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {product.sku} • {product.brands} • {product.type_category}
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
            {/* Product Information Header */}
            <Box mb={3}>
              <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
                <Paper sx={{ p: 2, textAlign: 'center', flex: 1 }}>
                  <Typography variant="h4" color="primary" fontWeight="bold">
                    {product.sku}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    SKU
                  </Typography>
                </Paper>
                <Paper sx={{ p: 2, textAlign: 'center', flex: 1 }}>
                  <Typography variant="h4" color="info.main" fontWeight="bold">
                    {product.brands}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Brand
                  </Typography>
                </Paper>
                <Paper sx={{ p: 2, textAlign: 'center', flex: 1 }}>
                  <Typography variant="h4" color="success.main" fontWeight="bold">
                    {product.type_category}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Type Category
                  </Typography>
                </Paper>
                <Paper sx={{ p: 2, textAlign: 'center', flex: 1 }}>
                  <Typography variant="h4" color="warning.main" fontWeight="bold">
                    {product.sub_category}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Sub Category
                  </Typography>
                </Paper>
              </Box>
            </Box>

            {/* Performance Metrics */}
            <Box mb={3}>
              <Typography variant="h6" gutterBottom>
                Performance Metrics
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="success.main" fontWeight="bold">
                      {formatCurrency(metrics.total_invoice)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Invoice
                  </Typography>
                </Paper>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="warning.main" fontWeight="bold">
                      {metrics.order_count}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Order Count
                  </Typography>
                </Paper>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="primary.main" fontWeight="bold">
                      {metrics.total_quantity}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Quantity
                  </Typography>
                </Paper>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="error.main" fontWeight="bold">
                      {metrics.active_stores}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Active Stores
                  </Typography>
                </Paper>
                </Grid>
              </Grid>
              
              {/* Variant Prices */}
              {Object.keys(metrics.variantMetrics).length > 0 && (
                <Box mt={3}>
                  <Typography variant="h6" gutterBottom>
                    Variant Prices
                  </Typography>
                  <Grid container spacing={2}>
                    {Object.entries(metrics.variantMetrics).map(([variantName, variantData]) => (
                      <React.Fragment key={variantName}>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                          <Paper sx={{ p: 2, textAlign: 'center' }}>
                            <Typography variant="h5" color="info.main" fontWeight="bold">
                              {variantName}
                            </Typography>
                            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                              Buy Price
                            </Typography>
                            <Typography variant="h6" color="info.main" fontWeight="medium">
                              {formatCurrency(variantData.buy_price)}
                            </Typography>
                          </Paper>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                          <Paper sx={{ p: 2, textAlign: 'center' }}>
                            <Typography variant="h5" color="success.main" fontWeight="bold">
                              {variantName}
                            </Typography>
                            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                              Sale Price
                            </Typography>
                            <Typography variant="h6" color="success.main" fontWeight="medium">
                              {formatCurrency(variantData.sale_price)}
                            </Typography>
                          </Paper>
                        </Grid>
                      </React.Fragment>
                    ))}
                  </Grid>
              </Box>
              )}
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tabValue} onChange={handleTabChange} aria-label="product detail tabs">
                <Tab label="Overview" />
                <Tab label="Orders" />
                <Tab label="Stores" />
              </Tabs>
            </Box>

            <TabPanel value={tabValue} index={0}>
              <ProductSummaryTab 
                productOrders={productOrders} 
                product={product ? {
                  average_buy_price: product.average_buy_price,
                  total_quantity: product.total_quantity
                } : null}
              />
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <ProductOrdersTable 
                orders={productOrders} 
                loading={loading}
                onRefresh={fetchProductOrdersData}
                title="Product Orders"
              />
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              <ProductStoresList productOrders={productOrders} />
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

export default ProductDetailModal;
