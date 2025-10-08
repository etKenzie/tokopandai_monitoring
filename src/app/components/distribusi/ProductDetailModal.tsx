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
    Paper,
    Tab,
    Tabs,
    Typography
} from '@mui/material';
import { useEffect, useState } from 'react';
import { Product, ProductOrder, fetchProductOrders } from '../../api/distribusi/ProductSlice';
import ProductOrdersTable from './ProductOrdersTable';

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
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'FROZEN': return 'info';
      case 'MEAT': return 'error';
      case 'FRESH': return 'success';
      case 'DAIRY': return 'warning';
      default: return 'default';
    }
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
              <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
                <Paper sx={{ p: 2, textAlign: 'center', flex: 1 }}>
                  <Typography variant="h4" color="success.main" fontWeight="bold">
                    {formatCurrency(product.total_invoice)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Invoice
                  </Typography>
                </Paper>
                <Paper sx={{ p: 2, textAlign: 'center', flex: 1 }}>
                  <Typography variant="h4" color="info.main" fontWeight="bold">
                    {formatCurrency(product.average_buy_price)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Average Buy Price
                  </Typography>
                </Paper>
                <Paper sx={{ p: 2, textAlign: 'center', flex: 1 }}>
                  <Typography variant="h4" color="warning.main" fontWeight="bold">
                    {product.order_count}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Order Count
                  </Typography>
                </Paper>
                <Paper sx={{ p: 2, textAlign: 'center', flex: 1 }}>
                  <Typography variant="h4" color="primary.main" fontWeight="bold">
                    {product.total_quantity}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Quantity
                  </Typography>
                </Paper>
                <Paper sx={{ p: 2, textAlign: 'center', flex: 1 }}>
                  <Typography variant="h4" color="secondary.main" fontWeight="bold">
                    {product.active_stores}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Active Stores
                  </Typography>
                </Paper>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tabValue} onChange={handleTabChange} aria-label="product detail tabs">
                <Tab label="Orders" />
              </Tabs>
            </Box>

            <TabPanel value={tabValue} index={0}>
              <ProductOrdersTable 
                orders={productOrders} 
                loading={loading}
                onRefresh={fetchProductOrdersData}
                title="Product Orders"
              />
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
