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
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import { useEffect, useState } from 'react';
import { fetchOrderDetail, OrderDetailItem, updateOrderPaymentDate, updateOrderTotalPaid } from '../../api/distribusi/DistribusiSlice';
import OrderItemUpdateModal from './OrderItemUpdateModal';

interface OrderDetailModalProps {
  open: boolean;
  onClose: () => void;
  orderCode: string | null;
}

const OrderDetailModal = ({ open, onClose, orderCode }: OrderDetailModalProps) => {
  const [orderDetails, setOrderDetails] = useState<OrderDetailItem[]>([]);
  const [orderPaymentDate, setOrderPaymentDate] = useState<string | null>(null);
  const [orderTotalPaid, setOrderTotalPaid] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrderItem, setSelectedOrderItem] = useState<OrderDetailItem | null>(null);
  const [itemUpdateModalOpen, setItemUpdateModalOpen] = useState(false);
  const [paymentDate, setPaymentDate] = useState<string>('');
  const [updatingPaymentDate, setUpdatingPaymentDate] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  
  // Total Paid states
  const [totalPaidAmount, setTotalPaidAmount] = useState<string>('');
  const [updatingTotalPaid, setUpdatingTotalPaid] = useState(false);
  const [totalPaidError, setTotalPaidError] = useState<string | null>(null);
  const [totalPaidSuccess, setTotalPaidSuccess] = useState(false);

  useEffect(() => {
    if (open && orderCode) {
      fetchOrderDetails();
    }
  }, [open, orderCode]);

  const fetchOrderDetails = async () => {
    if (!orderCode) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetchOrderDetail(orderCode);
      setOrderDetails(response.data.details);
      // Extract payment_date from response if available (check both data level and first detail item)
      const paymentDate = (response.data as any).payment_date || 
                          (response.data.details.length > 0 && (response.data.details[0] as any).payment_date) || 
                          null;
      setOrderPaymentDate(paymentDate);
      // Extract total_paid from response if available
      const totalPaid = (response.data as any).total_paid || null;
      setOrderTotalPaid(totalPaid);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch order details');
      console.error('Failed to fetch order details:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numAmount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PACKAGED': return 'success';
      case 'PROCESS DELIVERY': return 'warning';
      case 'DELIVERED': return 'info';
      case 'CANCELLED': return 'error';
      default: return 'default';
    }
  };

  const handleOrderItemClick = (orderItem: OrderDetailItem) => {
    setSelectedOrderItem(orderItem);
    setItemUpdateModalOpen(true);
  };

  const handleCloseItemUpdateModal = () => {
    setItemUpdateModalOpen(false);
    setSelectedOrderItem(null);
  };

  const handleOrderItemUpdate = () => {
    // Refresh the order details when an item is updated
    if (orderCode) {
      fetchOrderDetails();
    }
  };

  const handleUpdatePaymentDate = async () => {
    if (!orderCode || !paymentDate) {
      setUpdateError('Please select a payment date');
      return;
    }

    setUpdatingPaymentDate(true);
    setUpdateError(null);
    setUpdateSuccess(false);

    try {
      await updateOrderPaymentDate({
        order_code: orderCode,
        payment_date: paymentDate
      });
      
      setUpdateSuccess(true);
      setPaymentDate('');
      
      // Refresh order details after successful update
      if (orderCode) {
        fetchOrderDetails();
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setUpdateSuccess(false);
      }, 3000);
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : 'Failed to update payment date');
      console.error('Failed to update payment date:', err);
    } finally {
      setUpdatingPaymentDate(false);
    }
  };

  const handleUpdateTotalPaid = async () => {
    if (!orderCode || !totalPaidAmount) {
      setTotalPaidError('Please enter a total paid amount');
      return;
    }

    setUpdatingTotalPaid(true);
    setTotalPaidError(null);
    setTotalPaidSuccess(false);

    try {
      await updateOrderTotalPaid({
        order_code: orderCode,
        total_paid: totalPaidAmount
      });
      
      setTotalPaidSuccess(true);
      setTotalPaidAmount('');
      
      // Refresh order details after successful update
      if (orderCode) {
        fetchOrderDetails();
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setTotalPaidSuccess(false);
      }, 3000);
    } catch (err) {
      setTotalPaidError(err instanceof Error ? err.message : 'Failed to update total paid');
      console.error('Failed to update total paid:', err);
    } finally {
      setUpdatingTotalPaid(false);
    }
  };

  const totalInvoice = orderDetails.reduce((sum, item) => sum + parseFloat(item.total_invoice), 0);
  const totalQuantity = orderDetails.reduce((sum, item) => sum + item.order_quantity, 0);
  const totalProfit = orderDetails.reduce((sum, item) => sum + ((parseFloat(item.price) - item.buy_price) * item.order_quantity), 0);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { minHeight: '80vh' }
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5" component="div">
            Order Details - {orderCode}
          </Typography>
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
        ) : orderDetails.length === 0 ? (
          <Alert severity="info">
            No order details found for this order code.
          </Alert>
        ) : (
          <Box>
            {/* Order Summary */}
            {orderDetails.length > 0 && (
              <Box mb={3}>
                <Typography variant="h6" gutterBottom>
                  Order Summary
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Paper sx={{ p: 2, textAlign: 'center', flex: '1 1 0', minWidth: 120 }}>
                    <Typography variant="h5" color="primary" fontWeight="bold">
                      {formatCurrency(totalInvoice)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Total Invoice
                    </Typography>
                  </Paper>
                  <Paper sx={{ p: 2, textAlign: 'center', flex: '1 1 0', minWidth: 120 }}>
                    <Typography variant="h5" color="success.main" fontWeight="bold">
                      {formatCurrency(totalProfit)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Total Profit
                    </Typography>
                  </Paper>
                  <Paper sx={{ p: 2, textAlign: 'center', flex: '1 1 0', minWidth: 120 }}>
                    <Typography variant="h5" color="info.main" fontWeight="bold">
                      {totalQuantity}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Total Quantity
                    </Typography>
                  </Paper>
                  <Paper sx={{ p: 2, textAlign: 'center', flex: '1 1 0', minWidth: 120 }}>
                    <Typography variant="h5" color="warning.main" fontWeight="bold">
                      {orderDetails.length}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Items
                    </Typography>
                  </Paper>
                  <Paper sx={{ p: 2, textAlign: 'center', flex: '1 1 0', minWidth: 120 }}>
                    <Typography variant="h5" color="secondary.main" fontWeight="bold">
                      {orderTotalPaid !== null ? formatCurrency(orderTotalPaid) : 'IDR 0'}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Total Paid
                    </Typography>
                  </Paper>
                </Box>
              </Box>
            )}

            {/* Customer Information */}
            {orderDetails.length > 0 && (
              <Box mb={3}>
                <Typography variant="h6" gutterBottom>
                  Customer Information
                </Typography>
                <Paper sx={{ p: 2 }}>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="body2" color="textSecondary">
                        Customer Name
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {orderDetails[0].nama_lengkap}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="body2" color="textSecondary">
                        Store Name
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {orderDetails[0].nama_toko}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="body2" color="textSecondary">
                        Reseller Code
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {orderDetails[0].reseller_code}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="body2" color="textSecondary">
                        Hub
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {orderDetails[0].hub}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="body2" color="textSecondary">
                        Address
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {orderDetails[0].alamat}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Box>
            )}

            <Divider sx={{ my: 2 }} />

            {/* Order Items Table */}
            <Typography variant="h6" gutterBottom>
              Order Items ({orderDetails.length} items)
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell>SKU</TableCell>
                    <TableCell>Brand</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Variant</TableCell>
                    <TableCell align="right">Price</TableCell>
                    <TableCell align="right">Buy Price</TableCell>
                    <TableCell align="center">Qty</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell align="center">Status</TableCell>
                    <TableCell align="right">Stock</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orderDetails.map((item, index) => (
                    <TableRow 
                      key={item.order_item_id} 
                      hover
                      onClick={() => handleOrderItemClick(item)}
                      sx={{ 
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        }
                      }}
                    >
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {item.product_name}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {item.principle}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace">
                          {item.sku}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={item.brands}
                          size="small"
                          variant="outlined"
                          color="primary"
                        />
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            {item.type_category}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {item.sub_category}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {item.variant_name} ({item.variant_value})
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="bold">
                          {formatCurrency(item.price)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="bold" color="success.main">
                          {formatCurrency(item.buy_price)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" fontWeight="bold">
                          {item.order_quantity}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="bold" color="primary">
                          {formatCurrency(item.total_invoice)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={item.status}
                          color={getStatusColor(item.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography 
                          variant="body2" 
                          color={item.stock_product > 10 ? 'success.main' : item.stock_product > 0 ? 'warning.main' : 'error.main'}
                          fontWeight="bold"
                        >
                          {item.stock_product}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Order Date and Payment Date */}
            {orderDetails.length > 0 && (
              <Box mt={2} sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                <Typography variant="body2" color="textSecondary">
                  Order Date: {formatDate(orderDetails[0].order_date)}
                </Typography>
                {orderPaymentDate && (
                  <Typography variant="body2" color="textSecondary">
                    Payment Date: {formatDate(orderPaymentDate)}
                  </Typography>
                )}
              </Box>
            )}

            {/* Update Actions Section */}
            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" gutterBottom>
              Actions
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-start' }}>
              {/* Update Payment Date */}
              <Paper sx={{ p: 2, flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Update Payment Date
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <TextField
                    size="small"
                    label="Date"
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ max: new Date().toISOString().split('T')[0] }}
                    sx={{ flex: 1 }}
                  />
                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    onClick={handleUpdatePaymentDate}
                    disabled={!paymentDate || updatingPaymentDate}
                  >
                    {updatingPaymentDate ? <CircularProgress size={16} /> : 'Update'}
                  </Button>
                </Box>
                {updateError && <Alert severity="error" sx={{ mt: 1, py: 0 }}>{updateError}</Alert>}
                {updateSuccess && <Alert severity="success" sx={{ mt: 1, py: 0 }}>Updated!</Alert>}
              </Paper>

              {/* Update Total Paid - Only show when total_paid is not 0 */}
              {orderTotalPaid !== null && orderTotalPaid !== 0 && (
                <Paper sx={{ p: 2, flex: 1, minWidth: 0 }}>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Update Total Paid
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <TextField
                      size="small"
                      label="Amount"
                      type="number"
                      value={totalPaidAmount}
                      onChange={(e) => setTotalPaidAmount(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      inputProps={{ min: 0 }}
                      placeholder="e.g. 1000000"
                      sx={{ flex: 1 }}
                    />
                    <Button
                      variant="contained"
                      color="secondary"
                      size="small"
                      onClick={handleUpdateTotalPaid}
                      disabled={!totalPaidAmount || updatingTotalPaid}
                    >
                      {updatingTotalPaid ? <CircularProgress size={16} /> : 'Update'}
                    </Button>
                  </Box>
                  {totalPaidError && <Alert severity="error" sx={{ mt: 1, py: 0 }}>{totalPaidError}</Alert>}
                  {totalPaidSuccess && <Alert severity="success" sx={{ mt: 1, py: 0 }}>Updated!</Alert>}
                </Paper>
              )}
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
      </DialogActions>

      {/* Order Item Update Modal */}
      <OrderItemUpdateModal
        open={itemUpdateModalOpen}
        onClose={handleCloseItemUpdateModal}
        orderItem={selectedOrderItem}
        onUpdate={handleOrderItemUpdate}
      />
    </Dialog>
  );
};

export default OrderDetailModal;
