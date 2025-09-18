'use client';

import { StoreOrder } from '@/app/api/distribusi/StoreSlice';
import {
    Box,
    Chip,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography
} from '@mui/material';
import { useState } from 'react';
import OrderDetailModal from '../shared/OrderDetailModal';

interface StoreOrdersTableProps {
  storeOrders: StoreOrder[];
}

const StoreOrdersTable = ({ storeOrders }: StoreOrdersTableProps) => {
  const [selectedOrderCode, setSelectedOrderCode] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
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

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'LUNAS': return 'success';
      case 'BELUM LUNAS': return 'error';
      case 'SEBAGIAN': return 'warning';
      default: return 'default';
    }
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'PACKAGED': return 'success';
      case 'PROCESS DELIVERY': return 'warning';
      case 'DELIVERED': return 'info';
      case 'CANCELLED': return 'error';
      default: return 'default';
    }
  };

  const getOverdueStatusColor = (status: string | null) => {
    if (!status) return 'default';
    if (status.includes('Current')) return 'success';
    if (status.includes('B2W') || status.includes('14DPD')) return 'warning';
    if (status.includes('40DPD') || status.includes('60DPD')) return 'error';
    if (status.includes('90DPD')) return 'default';
    return 'default';
  };

  const handleRowClick = (orderCode: string) => {
    setSelectedOrderCode(orderCode);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedOrderCode(null);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Store Orders ({storeOrders.length} orders)
      </Typography>
      
      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Order Code</TableCell>
              <TableCell>Month</TableCell>
              <TableCell>Order Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Payment Status</TableCell>
              <TableCell>Payment Type</TableCell>
              <TableCell>Payment Due Date</TableCell>
              <TableCell align="right">Total Invoice</TableCell>
              <TableCell align="right">Profit</TableCell>
              <TableCell>Overdue Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {storeOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  <Typography variant="body2" color="textSecondary">
                    No orders found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              storeOrders.map((order) => (
                <TableRow 
                  key={order.order_id} 
                  hover
                  onClick={() => handleRowClick(order.order_code)}
                  sx={{ 
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    }
                  }}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {order.order_code}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={order.month}
                      size="small"
                      variant="outlined"
                      color="primary"
                    />
                  </TableCell>
                  <TableCell>{formatDate(order.order_date)}</TableCell>
                  <TableCell>
                    <Chip
                      label={order.status_order}
                      color={getOrderStatusColor(order.status_order) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={order.status_payment}
                      color={getPaymentStatusColor(order.status_payment) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{order.payment_type}</TableCell>
                  <TableCell>
                    {order.payment_due_date ? formatDate(order.payment_due_date) : 'N/A'}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    {formatCurrency(order.total_invoice)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                    {formatCurrency(order.profit)}
                  </TableCell>
                  <TableCell>
                    {order.overdue_status ? (
                      <Chip
                        label={order.overdue_status}
                        color={getOverdueStatusColor(order.overdue_status) as any}
                        size="small"
                      />
                    ) : (
                      <Typography variant="body2" color="textSecondary">
                        N/A
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Order Detail Modal */}
      <OrderDetailModal
        open={modalOpen}
        onClose={handleCloseModal}
        orderCode={selectedOrderCode}
      />
    </Box>
  );
};

export default StoreOrdersTable;
