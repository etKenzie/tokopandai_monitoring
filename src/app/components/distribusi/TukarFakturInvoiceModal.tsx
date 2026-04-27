'use client';

import { fetchOrders, Order } from '@/app/api/distribusi/DistribusiSlice';
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';

interface TukarFakturInvoiceModalProps {
  open: boolean;
  onClose: () => void;
  agent?: string;
  area?: string;
  segment?: string;
  onConfirm: (payload: { dueDate: string; recipientName: string; recipientAddress: string; invoices: Order[] }) => void;
}

const TukarFakturInvoiceModal = ({
  open,
  onClose,
  agent,
  area,
  segment,
  onConfirm,
}: TukarFakturInvoiceModalProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<Order[]>([]);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [dueDate, setDueDate] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    setSelectedCodes([]);
    setRecipientName('');
    setRecipientAddress('');
    (async () => {
      try {
        const res = await fetchOrders({
          sortTime: 'desc',
          payment: 'BELUM LUNAS',
          month: undefined,
          agent,
          area,
          segment,
        });
        const unpaid = res.data.filter((r) => (r.status_payment || '').toUpperCase() === 'BELUM LUNAS');
        setRows(unpaid);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load invoices');
      } finally {
        setLoading(false);
      }
    })();
  }, [open, agent, area, segment]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.order_code.toLowerCase().includes(q) ||
        r.store_name.toLowerCase().includes(q) ||
        r.reseller_name.toLowerCase().includes(q),
    );
  }, [rows, query]);

  const paged = useMemo(() => {
    const start = page * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, page, rowsPerPage]);

  const toggleCode = (code: string) => {
    setSelectedCodes((prev) => (prev.includes(code) ? prev.filter((v) => v !== code) : [...prev, code]));
  };

  const selectedInvoices = useMemo(
    () => rows.filter((r) => selectedCodes.includes(r.order_code)),
    [rows, selectedCodes],
  );

  const selectedStoreName = useMemo(
    () => selectedInvoices[0]?.store_name || '',
    [selectedInvoices],
  );

  useEffect(() => {
    if (!recipientName.trim() && selectedStoreName) {
      setRecipientName(selectedStoreName);
    }
  }, [selectedStoreName, recipientName]);

  const onSubmit = () => {
    if (!dueDate) {
      setError('Due date is required.');
      return;
    }
    if (selectedInvoices.length === 0) {
      setError('Select at least one BELUM LUNAS invoice.');
      return;
    }
    if (!recipientAddress.trim()) {
      setError('To address is required.');
      return;
    }
    if (!recipientName.trim()) {
      setError('To name is required.');
      return;
    }
    onConfirm({
      dueDate,
      recipientName: recipientName.trim(),
      recipientAddress: recipientAddress.trim(),
      invoices: selectedInvoices,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>Pilih Invoice BELUM LUNAS</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          {error && (
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          )}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Search by order code/store/reseller"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(0);
                }}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                label="Due Date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                label="To Name"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="To Address (required for PDF)"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                fullWidth
                size="small"
                multiline
                minRows={2}
              />
            </Grid>
          </Grid>

          <Box sx={{ maxHeight: 420, overflow: 'auto', border: '1px solid #eee', borderRadius: 1 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell width={48}>Pilih</TableCell>
                  <TableCell>Order Code</TableCell>
                  <TableCell>Invoice Date</TableCell>
                  <TableCell align="right">Invoice Amount</TableCell>
                  <TableCell>Store</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Box py={3} display="flex" alignItems="center" justifyContent="center" gap={1.5}>
                        <CircularProgress size={20} />
                        <Typography variant="body2" color="textSecondary">
                          Loading BELUM LUNAS invoices...
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : paged.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No BELUM LUNAS invoices found.
                    </TableCell>
                  </TableRow>
                ) : (
                  paged.map((row) => (
                    <TableRow key={row.order_code} hover>
                      <TableCell>
                        <Checkbox checked={selectedCodes.includes(row.order_code)} onChange={() => toggleCode(row.order_code)} />
                      </TableCell>
                      <TableCell>{row.order_code}</TableCell>
                      <TableCell>{new Date(row.order_date).toLocaleDateString('id-ID')}</TableCell>
                      <TableCell align="right">{Number(row.total_invoice || 0).toLocaleString('id-ID')}</TableCell>
                      <TableCell>{row.store_name}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Box>

          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Rows per page</InputLabel>
                <Select
                  value={String(rowsPerPage)}
                  label="Rows per page"
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    setPage(0);
                  }}
                >
                  <MenuItem value="10">10</MenuItem>
                  <MenuItem value="20">20</MenuItem>
                  <MenuItem value="50">50</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 8 }}>
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
                  Prev
                </Button>
                <Button
                  disabled={(page + 1) * rowsPerPage >= filtered.length}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </Stack>
            </Grid>
          </Grid>

          <Typography variant="body2" color="textSecondary">
            Selected: {selectedInvoices.length} invoice(s)
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={onSubmit}>
          Generate Tukar Faktur
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TukarFakturInvoiceModal;
