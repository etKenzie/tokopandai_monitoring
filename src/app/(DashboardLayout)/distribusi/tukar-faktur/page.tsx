'use client';

import {
  createTukarFakturBatch,
  fetchTukarFakturBatchDetail,
  fetchTukarFakturBatches,
  TukarFakturBatchDetailData,
  TukarFakturBatchListItem,
  uploadTukarFakturPdf,
} from '@/app/api/distribusi/DistribusiSlice';
import ProtectedRoute from '@/app/components/auth/ProtectedRoute';
import PageContainer from '@/app/components/container/PageContainer';
import { getPageRoles } from '@/config/roles';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useCallback, useMemo, useState } from 'react';

const TukarFakturPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploadBatchId, setUploadBatchId] = useState('');
  const [uploadedPdfUrl, setUploadedPdfUrl] = useState('');
  const [uploadedPdfPath, setUploadedPdfPath] = useState('');

  const [dueDate, setDueDate] = useState('');
  const [orderCodesText, setOrderCodesText] = useState('');
  const [customerStoreSummary, setCustomerStoreSummary] = useState('');
  const [totalCombinedAmount, setTotalCombinedAmount] = useState('');
  const [invoiceCount, setInvoiceCount] = useState('');
  const [idempotencyKey, setIdempotencyKey] = useState('');

  const [page, setPage] = useState('1');
  const [limit, setLimit] = useState('20');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [generatedBy, setGeneratedBy] = useState('');
  const [orderCodeFilter, setOrderCodeFilter] = useState('');

  const [batches, setBatches] = useState<TukarFakturBatchListItem[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<TukarFakturBatchDetailData | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const [loadingUpload, setLoadingUpload] = useState(false);
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingDetailId, setLoadingDetailId] = useState<string | null>(null);
  const [loadingPdfId, setLoadingPdfId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const orderCodes = useMemo(
    () =>
      orderCodesText
        .split('\n')
        .map((v) => v.trim())
        .filter(Boolean),
    [orderCodesText],
  );

  const loadBatches = useCallback(async () => {
    clearMessages();
    setLoadingList(true);
    try {
      const list = await fetchTukarFakturBatches({
        page: Number(page) || 1,
        limit: Number(limit) || 20,
        from: fromDate || undefined,
        to: toDate || undefined,
        generated_by: generatedBy || undefined,
        order_code: orderCodeFilter || undefined,
      });
      setBatches(list);
      setSuccess(`Loaded ${list.length} batch(es).`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load batches.');
    } finally {
      setLoadingList(false);
    }
  }, [page, limit, fromDate, toDate, generatedBy, orderCodeFilter]);

  const onUploadPdf = async () => {
    clearMessages();
    if (!file) {
      setError('Please select a PDF file first.');
      return;
    }
    setLoadingUpload(true);
    try {
      const res = await uploadTukarFakturPdf(file, uploadBatchId || undefined);
      setUploadedPdfUrl(res.data.file_url || '');
      setUploadedPdfPath(res.data.file_path || '');
      setSuccess('PDF uploaded successfully. You can now create batch.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload PDF.');
    } finally {
      setLoadingUpload(false);
    }
  };

  const onCreateBatch = async () => {
    clearMessages();
    if (!dueDate) {
      setError('Due date is required.');
      return;
    }
    if (orderCodes.length === 0) {
      setError('At least one order code is required.');
      return;
    }

    setLoadingCreate(true);
    try {
      const res = await createTukarFakturBatch({
        due_date: dueDate,
        recipient_name: customerStoreSummary || 'Customer',
        recipient_address: customerStoreSummary || '-',
        items: orderCodes.map((order_code) => ({ order_code })),
        customer_store_summary: customerStoreSummary || undefined,
        total_combined_amount: totalCombinedAmount ? Number(totalCombinedAmount) : undefined,
        invoice_count: invoiceCount ? Number(invoiceCount) : undefined,
        idempotency_key: idempotencyKey || undefined,
      });
      setSuccess(`Batch created: ${res.data.batch_id}`);
      loadBatches();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create batch.');
    } finally {
      setLoadingCreate(false);
    }
  };

  const onViewDetail = async (batchId: string) => {
    clearMessages();
    setLoadingDetailId(batchId);
    try {
      const res = await fetchTukarFakturBatchDetail(batchId);
      setSelectedBatch(res.data);
      setDetailOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch detail.');
    } finally {
      setLoadingDetailId(null);
    }
  };

  const onDownloadPdf = async (batchId: string) => {
    clearMessages();
    setLoadingPdfId(batchId);
    try {
      setError('Legacy PDF endpoint removed. Use Sales > Tukar Faktur page for on-demand PDF generation.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download PDF.');
    } finally {
      setLoadingPdfId(null);
    }
  };

  return (
    <PageContainer title="Tukar Faktur" description="Manage Tukar Faktur upload and batches">
      <Box>
        <Box mb={3}>
          <Typography variant="h3" fontWeight="bold" mb={1}>
            Tukar Faktur
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Upload PDF, create batch, review batch list, and download generated PDF.
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" mb={2}>
                  1) Upload PDF
                </Typography>
                <Stack spacing={2}>
                  <Button variant="outlined" component="label">
                    {file ? file.name : 'Choose PDF File'}
                    <input
                      type="file"
                      hidden
                      accept="application/pdf"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                    />
                  </Button>
                  <TextField
                    label="Batch ID (optional)"
                    value={uploadBatchId}
                    onChange={(e) => setUploadBatchId(e.target.value)}
                    size="small"
                  />
                  <Button variant="contained" onClick={onUploadPdf} disabled={loadingUpload}>
                    {loadingUpload ? 'Uploading...' : 'Upload PDF'}
                  </Button>
                  <TextField
                    label="PDF URL"
                    value={uploadedPdfUrl}
                    onChange={(e) => setUploadedPdfUrl(e.target.value)}
                    size="small"
                  />
                  <TextField
                    label="PDF Path"
                    value={uploadedPdfPath}
                    onChange={(e) => setUploadedPdfPath(e.target.value)}
                    size="small"
                  />
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, lg: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" mb={2}>
                  2) Create Batch
                </Typography>
                <Stack spacing={2}>
                  <TextField
                    label="Due Date"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextField
                    label="Order Codes (one per line)"
                    value={orderCodesText}
                    onChange={(e) => setOrderCodesText(e.target.value)}
                    size="small"
                    multiline
                    minRows={4}
                    placeholder={'SO-2026-0001\nSO-2026-0002'}
                  />
                  <TextField
                    label="Customer Store Summary (optional)"
                    value={customerStoreSummary}
                    onChange={(e) => setCustomerStoreSummary(e.target.value)}
                    size="small"
                  />
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Total Combined Amount (optional)"
                        value={totalCombinedAmount}
                        onChange={(e) => setTotalCombinedAmount(e.target.value)}
                        size="small"
                        fullWidth
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Invoice Count (optional)"
                        value={invoiceCount}
                        onChange={(e) => setInvoiceCount(e.target.value)}
                        size="small"
                        fullWidth
                      />
                    </Grid>
                  </Grid>
                  <TextField
                    label="Idempotency Key (optional)"
                    value={idempotencyKey}
                    onChange={(e) => setIdempotencyKey(e.target.value)}
                    size="small"
                  />
                  <Button variant="contained" onClick={onCreateBatch} disabled={loadingCreate}>
                    {loadingCreate ? 'Creating...' : 'Create Batch'}
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" mb={2}>
                  3) List Batches
                </Typography>
                <Grid container spacing={2} mb={2}>
                  <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                    <TextField label="Page" value={page} onChange={(e) => setPage(e.target.value)} size="small" fullWidth />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                    <TextField label="Limit" value={limit} onChange={(e) => setLimit(e.target.value)} size="small" fullWidth />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                    <TextField
                      label="From"
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      size="small"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                    <TextField
                      label="To"
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      size="small"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                    <TextField
                      label="Generated By"
                      value={generatedBy}
                      onChange={(e) => setGeneratedBy(e.target.value)}
                      size="small"
                      fullWidth
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                    <TextField
                      label="Order Code"
                      value={orderCodeFilter}
                      onChange={(e) => setOrderCodeFilter(e.target.value)}
                      size="small"
                      fullWidth
                    />
                  </Grid>
                </Grid>
                <Box mb={2}>
                  <Button variant="contained" onClick={loadBatches} disabled={loadingList}>
                    {loadingList ? 'Loading...' : 'Load Batches'}
                  </Button>
                </Box>

                {loadingList ? (
                  <Box display="flex" justifyContent="center" py={4}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Batch ID</TableCell>
                        <TableCell>Due Date</TableCell>
                        <TableCell>Generated By</TableCell>
                        <TableCell>Invoices</TableCell>
                        <TableCell>Total Amount</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {batches.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center">
                            No batches found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        batches.map((row) => (
                          <TableRow key={row.batch_id}>
                            <TableCell>{row.batch_id}</TableCell>
                            <TableCell>{row.due_date || '-'}</TableCell>
                            <TableCell>{row.generated_by || '-'}</TableCell>
                            <TableCell>{row.invoice_count ?? '-'}</TableCell>
                            <TableCell>
                              {typeof row.total_combined_amount === 'number'
                                ? row.total_combined_amount.toLocaleString('id-ID')
                                : '-'}
                            </TableCell>
                            <TableCell>
                              <Stack direction="row" spacing={1}>
                                <Button
                                  variant="outlined"
                                  size="small"
                                  onClick={() => onViewDetail(row.batch_id)}
                                  disabled={loadingDetailId === row.batch_id}
                                >
                                  {loadingDetailId === row.batch_id ? 'Loading...' : 'Detail'}
                                </Button>
                                <Button
                                  variant="contained"
                                  size="small"
                                  onClick={() => onDownloadPdf(row.batch_id)}
                                  disabled={loadingPdfId === row.batch_id}
                                >
                                  {loadingPdfId === row.batch_id ? 'Loading...' : 'PDF'}
                                </Button>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Batch Detail</DialogTitle>
          <DialogContent>
            <Box component="pre" sx={{ m: 0, whiteSpace: 'pre-wrap' }}>
              {JSON.stringify(selectedBatch, null, 2)}
            </Box>
          </DialogContent>
        </Dialog>
      </Box>
    </PageContainer>
  );
};

export default function ProtectedTukarFakturPage() {
  return (
    <ProtectedRoute requiredRoles={getPageRoles('DISTRIBUSI_DASHBOARD')}>
      <TukarFakturPage />
    </ProtectedRoute>
  );
}
