'use client';

import type { Order } from '@/app/api/distribusi/DistribusiSlice';
import { calculateDaysLate } from '@/utils/overdueStatus';
import { ArrowForward as ArrowForwardIcon, ExpandLess as ExpandLessIcon } from '@mui/icons-material';
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';

interface OverdueTransitionRecapProps {
  /** Same filtered set as the table / chart (respects segment, area, search, etc.). */
  orders: Order[];
  onOrderClick?: (orderCode: string) => void;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

const OverdueTransitionRecap = ({ orders, onOrderClick }: OverdueTransitionRecapProps) => {
  const [showList, setShowList] = useState(false);

  const ordersTransitionedTo60DPD = useMemo(() => {
    return orders.filter((order) => {
      if (!order.payment_due_date) return false;
      const daysLate = calculateDaysLate(order);
      return daysLate >= 60 && daysLate <= 70;
    });
  }, [orders]);

  const transitionedTotalInvoice = ordersTransitionedTo60DPD.reduce(
    (sum, o) => sum + (Number(o.total_invoice) || 0),
    0
  );
  const transitionedTotalProfit = ordersTransitionedTo60DPD.reduce(
    (sum, o) => sum + (Number(o.profit) || 0),
    0
  );
  const transitionedOrderCount = ordersTransitionedTo60DPD.length;

  return (
    <Box
      sx={{
        mb: 0,
        p: 2,
        backgroundColor: transitionedOrderCount > 0 ? 'error.light' : 'grey.100',
        borderRadius: 2,
        border: '2px solid',
        borderColor: transitionedOrderCount > 0 ? 'error.main' : 'grey.300',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h6" fontWeight="bold" color={transitionedOrderCount > 0 ? 'error.main' : 'text.secondary'}>
          ⚠️ Order yang Naik dari 30DPD ke 60DPD (10 Hari Terakhir)
        </Typography>
        {transitionedOrderCount > 0 && (
          <Button
            variant="outlined"
            size="small"
            endIcon={showList ? <ExpandLessIcon /> : <ArrowForwardIcon />}
            onClick={() => setShowList(!showList)}
            sx={{ minWidth: '150px' }}
          >
            {showList ? 'Sembunyikan' : 'Lihat Order'}
          </Button>
        )}
      </Box>
      <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap', mt: 2 }}>
        <Box>
          <Typography variant="h4" color={transitionedOrderCount > 0 ? 'error.main' : 'text.secondary'} fontWeight="bold">
            {transitionedOrderCount}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Order (60-70 hari terlambat)
          </Typography>
        </Box>
        <Box>
          <Typography variant="h5" color={transitionedOrderCount > 0 ? 'error.main' : 'text.secondary'} fontWeight="bold">
            {formatCurrency(transitionedTotalInvoice)}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Total Invoice
          </Typography>
        </Box>
        <Box>
          <Typography variant="h5" color={transitionedOrderCount > 0 ? 'error.main' : 'text.secondary'} fontWeight="bold">
            {formatCurrency(transitionedTotalProfit)}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Total Profit
          </Typography>
        </Box>
      </Box>
      <Typography variant="body2" color="textSecondary" sx={{ mt: 2, fontStyle: 'italic' }}>
        {transitionedOrderCount > 0
          ? 'Order-order ini saat ini 60-70 hari terlambat dan baru saja masuk ke kategori 60DPD dalam 10 hari terakhir.'
          : 'Tidak ada order yang ditemukan dengan 60-70 hari terlambat. Ini adalah order yang baru saja masuk ke kategori 60DPD.'}
      </Typography>

      {showList && transitionedOrderCount > 0 && (
        <Box sx={{ mt: 3 }}>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Order Code</TableCell>
                  <TableCell>Store Name</TableCell>
                  <TableCell>Agent</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell align="right">Days Late</TableCell>
                  <TableCell align="right">Total Invoice</TableCell>
                  <TableCell align="right">Profit</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ordersTransitionedTo60DPD.map((order) => (
                  <TableRow
                    key={order.order_id}
                    hover
                    onClick={() => onOrderClick?.(order.order_code)}
                    sx={{ cursor: onOrderClick ? 'pointer' : 'default' }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {order.order_code}
                      </Typography>
                    </TableCell>
                    <TableCell>{order.store_name}</TableCell>
                    <TableCell>{order.agent_name}</TableCell>
                    <TableCell>{formatDate(order.payment_due_date)}</TableCell>
                    <TableCell align="right">
                      <Typography
                        variant="body2"
                        fontWeight="bold"
                        color="error.main"
                        sx={{
                          border: '1px solid',
                          borderColor: 'error.main',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          display: 'inline-block',
                          minWidth: '40px',
                          textAlign: 'center',
                        }}
                      >
                        {calculateDaysLate(order)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                      {formatCurrency(Number(order.total_invoice))}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                      {formatCurrency(Number(order.profit))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Box>
  );
};

export default OverdueTransitionRecap;
