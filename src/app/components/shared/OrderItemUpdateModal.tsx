'use client';

import { Close as CloseIcon, Lock as LockIcon, Save as SaveIcon } from '@mui/icons-material';
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
  Paper,
  TextField,
  Typography
} from '@mui/material';
import { useState } from 'react';
import { OrderDetailItem, OrderItemUpdate, updateOrderItemBuyPrices } from '../../api/distribusi/DistribusiSlice';
import { useAuth } from '../../context/AuthContext';

interface OrderItemUpdateModalProps {
  open: boolean;
  onClose: () => void;
  orderItem: OrderDetailItem | null;
  onUpdate: () => void;
}

const OrderItemUpdateModal = ({ open, onClose, orderItem, onUpdate }: OrderItemUpdateModalProps) => {
  const [newBuyPrice, setNewBuyPrice] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { roles } = useAuth();
  
  // Check if user has admin role
  const isAdmin = roles.includes('admin');

  // Reset form when modal opens/closes
  useState(() => {
    if (open && orderItem) {
      setNewBuyPrice(orderItem.buy_price.toString());
      setError(null);
      setSuccess(false);
    }
  });

  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numAmount);
  };

  const handleSave = async () => {
    if (!orderItem || !newBuyPrice) return;

    const price = parseFloat(newBuyPrice);
    if (isNaN(price) || price < 0) {
      setError('Please enter a valid price');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const updateData: OrderItemUpdate[] = [{
        order_item_id: orderItem.order_item_id,
        new_buy_price: price
      }];

      await updateOrderItemBuyPrices({ details: updateData });
      setSuccess(true);
      
      // Call the parent's onUpdate callback to refresh data
      onUpdate();
      
      // Close modal after a short delay to show success message
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update buy price');
      console.error('Failed to update buy price:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setNewBuyPrice('');
      setError(null);
      setSuccess(false);
      onClose();
    }
  };

  if (!orderItem) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="h6" component="div">
              Update Buy Price
            </Typography>
            {!isAdmin && (
              <Chip
                icon={<LockIcon />}
                label="Admin Only"
                size="small"
                color="warning"
                variant="outlined"
              />
            )}
          </Box>
          <Button
            onClick={handleClose}
            startIcon={<CloseIcon />}
            variant="outlined"
            size="small"
            disabled={loading}
          >
            Close
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {success ? (
          <Alert severity="success" sx={{ mb: 2 }}>
            Buy price updated successfully!
          </Alert>
        ) : (
          <Box>
            {/* Product Information */}
            <Paper sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Product Information
              </Typography>
              <Box mb={2}>
                <Typography variant="body2" color="textSecondary">
                  Product Name
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {orderItem.product_name}
                </Typography>
              </Box>
              <Box mb={2}>
                <Typography variant="body2" color="textSecondary">
                  SKU
                </Typography>
                <Typography variant="body1" fontFamily="monospace">
                  {orderItem.sku}
                </Typography>
              </Box>
              <Box mb={2}>
                <Typography variant="body2" color="textSecondary">
                  Brand
                </Typography>
                <Typography variant="body1">
                  {orderItem.brands}
                </Typography>
              </Box>
              <Box mb={2}>
                <Typography variant="body2" color="textSecondary">
                  Quantity
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {orderItem.order_quantity}
                </Typography>
              </Box>
            </Paper>

            <Divider sx={{ my: 2 }} />

            {/* Current Price Information */}
            <Box mb={3}>
              <Typography variant="h6" gutterBottom>
                Current Prices
              </Typography>
              <Box display="flex" justifyContent="space-between" mb={2}>
                <Typography variant="body2" color="textSecondary">
                  Selling Price:
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {formatCurrency(orderItem.price)}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={2}>
                <Typography variant="body2" color="textSecondary">
                  Current Buy Price:
                </Typography>
                <Typography variant="body1" fontWeight="bold" color="success.main">
                  {formatCurrency(orderItem.buy_price)}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={2}>
                <Typography variant="body2" color="textSecondary">
                  Total Invoice:
                </Typography>
                <Typography variant="body1" fontWeight="bold" color="primary.main">
                  {formatCurrency(orderItem.total_invoice)}
                </Typography>
              </Box>
            </Box>

            {/* Update Form */}
            <Box>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Typography variant="h6">
                  Update Buy Price
                </Typography>
                {!isAdmin && (
                  <Chip
                    icon={<LockIcon />}
                    label="Admin Only"
                    size="small"
                    color="warning"
                    variant="outlined"
                  />
                )}
              </Box>
              {!isAdmin && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Only administrators can update buy prices. Contact your system administrator if you need to make changes.
                </Alert>
              )}
              <TextField
                fullWidth
                // label="New Buy Price"
                type="number"
                value={newBuyPrice}
                onChange={(e) => setNewBuyPrice(e.target.value)}
                placeholder={isAdmin ? "Enter new buy price" : "Admin access required"}
                disabled={loading || !isAdmin}
                InputProps={{
                  startAdornment: (
                    <Typography variant="body2" sx={{ mr: 1 }}>
                      IDR
                    </Typography>
                  ),
                }}
                helperText={isAdmin ? "Enter the new buy price for this order item" : "Only administrators can update buy prices"}
                error={!!error}
              />
              {error && (
                <Alert severity="error" sx={{ mt: 1 }}>
                  {error}
                </Alert>
              )}
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button 
          onClick={handleClose} 
          variant="outlined"
          disabled={loading}
        >
          {success ? 'Close' : 'Cancel'}
        </Button>
        {!success && isAdmin && (
          <Button
            onClick={handleSave}
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
            disabled={loading || !newBuyPrice}
          >
            {loading ? 'Updating...' : 'Update Buy Price'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default OrderItemUpdateModal;
