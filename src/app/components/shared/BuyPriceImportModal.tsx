'use client';

import { importOrderItemBuyPrices, BuyPriceImportResult } from '@/app/api/distribusi/DistribusiSlice';
import {
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon,
  UploadFile as UploadFileIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { ChangeEvent, useRef, useState } from 'react';
import * as XLSX from 'xlsx';

interface BuyPriceImportModalProps {
  open: boolean;
  onClose: () => void;
  onImported?: () => void;
}

interface BuyPricePreviewRow {
  rowNumber: number;
  orderCode?: string;
  orderItemId: string;
  newBuyPrice: number;
}

const normalizeHeader = (value: unknown) =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');

const parsePrice = (value: unknown): number => {
  if (typeof value === 'number') return value;
  const normalized = String(value ?? '')
    .replace(/[^\d.-]/g, '')
    .trim();
  return Number(normalized);
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);

const BuyPriceImportModal = ({
  open,
  onClose,
  onImported,
}: BuyPriceImportModalProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewRows, setPreviewRows] = useState<BuyPricePreviewRow[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [parsing, setParsing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BuyPriceImportResult | null>(null);

  const reset = () => {
    setFile(null);
    setPreviewRows([]);
    setValidationErrors([]);
    setError(null);
    setResult(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleClose = () => {
    if (uploading || parsing) return;
    reset();
    onClose();
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setParsing(true);
    setFile(selectedFile);
    setPreviewRows([]);
    setValidationErrors([]);
    setError(null);
    setResult(null);

    try {
      const workbook = XLSX.read(await selectedFile.arrayBuffer(), { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      if (!worksheet) throw new Error('The Excel file does not contain a worksheet.');

      const rows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
        header: 1,
        defval: '',
        raw: true,
      });

      if (rows.length < 2) {
        throw new Error('The Excel file must contain a header and at least one data row.');
      }

      const headers = rows[0].map(normalizeHeader);
      const orderCodeIndex = headers.indexOf('order code');
      const orderItemIdIndex = headers.indexOf('order item id');
      const newBuyPriceIndex = headers.indexOf('new buy price');

      if (orderItemIdIndex === -1 || newBuyPriceIndex === -1) {
        throw new Error(
          'Required columns not found. Use exactly "Order Item ID" and "New Buy Price".'
        );
      }

      const parsedRows: BuyPricePreviewRow[] = [];
      const errors: string[] = [];
      const seenIds = new Set<string>();

      rows.slice(1).forEach((row, index) => {
        const rowNumber = index + 2;
        const orderCode =
          orderCodeIndex >= 0 ? String(row[orderCodeIndex] ?? '').trim() : '';
        const orderItemId = String(row[orderItemIdIndex] ?? '').trim();
        const rawPrice = row[newBuyPriceIndex];

        if (!orderItemId && String(rawPrice ?? '').trim() === '') return;
        if (!orderItemId) {
          errors.push(`Row ${rowNumber}: Order Item ID is required.`);
          return;
        }

        const newBuyPrice = parsePrice(rawPrice);
        if (!Number.isFinite(newBuyPrice) || newBuyPrice < 0) {
          errors.push(`Row ${rowNumber}: New Buy Price must be a number of 0 or greater.`);
          return;
        }

        if (seenIds.has(orderItemId)) {
          errors.push(`Row ${rowNumber}: duplicate Order Item ID "${orderItemId}".`);
          return;
        }

        seenIds.add(orderItemId);
        parsedRows.push({
          rowNumber,
          orderCode: orderCode || undefined,
          orderItemId,
          newBuyPrice,
        });
      });

      if (parsedRows.length === 0 && errors.length === 0) {
        errors.push('No data rows were found.');
      }

      setPreviewRows(parsedRows);
      setValidationErrors(errors);
    } catch (parseError) {
      setFile(null);
      setError(
        parseError instanceof Error ? parseError.message : 'Failed to read the Excel file.'
      );
    } finally {
      setParsing(false);
    }
  };

  const handleImport = async () => {
    if (!file || previewRows.length === 0 || validationErrors.length > 0) return;

    setUploading(true);
    setError(null);
    try {
      const response = await importOrderItemBuyPrices(file, false);
      setResult(response.data);
      onImported?.();
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : 'Failed to import buy prices.'
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Import Buy Prices</Typography>
          <Button
            onClick={handleClose}
            startIcon={<CloseIcon />}
            size="small"
            disabled={uploading || parsing}
          >
            Close
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Select an Excel file with the required columns <strong>Order Item ID</strong> and{' '}
          <strong>New Buy Price</strong>. An <strong>Order Code</strong> column is optional and
          will be shown in the preview when available.
        </Typography>

        <input
          ref={inputRef}
          hidden
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
        />
        <Button
          variant="outlined"
          startIcon={parsing ? <CircularProgress size={18} /> : <UploadFileIcon />}
          onClick={() => inputRef.current?.click()}
          disabled={parsing || uploading}
        >
          {parsing ? 'Reading Excel...' : file ? 'Choose Another File' : 'Choose Excel File'}
        </Button>
        {file && (
          <Typography variant="body2" sx={{ mt: 1 }}>
            {file.name}
          </Typography>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {validationErrors.length > 0 && (
          <Alert severity="error" sx={{ mt: 2 }}>
            <Typography variant="subtitle2">
              Fix these rows before importing ({validationErrors.length}):
            </Typography>
            <Box component="ul" sx={{ my: 0.5, pl: 2.5, maxHeight: 160, overflowY: 'auto' }}>
              {validationErrors.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </Box>
          </Alert>
        )}

        {previewRows.length > 0 && !result && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Preview ({previewRows.length} changes)
            </Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 420 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell width={80}>Excel Row</TableCell>
                    <TableCell>Order Code</TableCell>
                    <TableCell>Order Item ID</TableCell>
                    <TableCell align="right">New Buy Price</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {previewRows.map((row) => (
                    <TableRow key={row.orderItemId}>
                      <TableCell>{row.rowNumber}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace' }}>
                        {row.orderCode || '—'}
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'monospace' }}>{row.orderItemId}</TableCell>
                      <TableCell align="right">{formatCurrency(row.newBuyPrice)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {result && (
          <Alert
            severity={result.errors === 0 ? 'success' : 'warning'}
            icon={result.errors === 0 ? <CheckCircleIcon /> : undefined}
            sx={{ mt: 3 }}
          >
            <Typography variant="subtitle1" fontWeight="bold">
              Import complete
            </Typography>
            <Typography variant="body2">
              Total: {result.total} • Success: {result.success} • Errors: {result.errors} •
              Skipped: {result.skipped} • Success rate: {result.success_rate}%
            </Typography>
            {result.error_details.length > 0 && (
              <Box component="pre" sx={{ whiteSpace: 'pre-wrap', fontSize: 12, mb: 0 }}>
                {JSON.stringify(result.error_details, null, 2)}
              </Box>
            )}
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={uploading || parsing}>
          {result ? 'Done' : 'Cancel'}
        </Button>
        {!result && (
          <Button
            variant="contained"
            onClick={handleImport}
            startIcon={uploading ? <CircularProgress size={18} color="inherit" /> : <UploadFileIcon />}
            disabled={
              uploading ||
              parsing ||
              !file ||
              previewRows.length === 0 ||
              validationErrors.length > 0
            }
          >
            {uploading ? 'Importing...' : `Import ${previewRows.length} Changes`}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default BuyPriceImportModal;
