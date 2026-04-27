'use client';

import {
  createTukarFakturBatch,
  fetchOrderDetail,
  fetchTukarFakturBatchDetail,
  fetchTukarFakturBatches,
  Order,
  TukarFakturBatchDetailData,
  TukarFakturBatchListItem,
} from '@/app/api/distribusi/DistribusiSlice';
import ProtectedRoute from '@/app/components/auth/ProtectedRoute';
import PageContainer from '@/app/components/container/PageContainer';
import TukarFakturHistoryTable from '@/app/components/distribusi/TukarFakturHistoryTable';
import TukarFakturInvoiceModal from '@/app/components/distribusi/TukarFakturInvoiceModal';
import { useAuth } from '@/app/context/AuthContext';
import { getAgentNameFromRole, getPageRoles, getRestrictedRoles } from '@/config/roles';
import { Alert, Box, Button, Card, CardContent, Dialog, DialogContent, DialogTitle, Grid, Stack, TextField, Typography } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';

type GeneratedInvoiceRow = {
  orderCode: string;
  orderDate: string;
  amount: number;
};

const buildBatchInvoicePdfBlob = (args: {
  batch: TukarFakturBatchDetailData;
  recipientName: string;
  recipientAddress: string;
  rows: GeneratedInvoiceRow[];
}): Blob => {
  const { batch, recipientName, recipientAddress, rows } = args;
  const dueDate = batch.due_date ? new Date(batch.due_date).toLocaleDateString('id-ID') : '-';
  const today = new Date().toLocaleDateString('id-ID');
  const grandTotal =
    typeof batch.total_combined_amount === 'number'
      ? batch.total_combined_amount
      : rows.reduce((sum, row) => sum + row.amount, 0);

  const addressLines = recipientAddress
    .split(/\r?\n/)
    .map((v) => v.trim())
    .filter(Boolean);

  const esc = (v: string) =>
    (v || '')
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)')
      .replace(/[^\x20-\x7E]/g, ' ');
  const textAt = (x: number, y: number, size: number, text: string) =>
    `BT /F1 ${size} Tf ${x} ${y} Td (${esc(text)}) Tj ET`;
  const line = (x1: number, y1: number, x2: number, y2: number) =>
    `${x1} ${y1} m ${x2} ${y2} l S`;

  const xLeft = 40;
  const xRight = 330;
  let y = 800;
  const cmds: string[] = [];

  cmds.push(textAt(xLeft, y, 26, 'JuraganBeku'));
  y -= 46;

  cmds.push(textAt(xLeft, y, 12, 'To:'));
  cmds.push(textAt(xLeft + 24, y, 12, recipientName || '-'));
  y -= 18;
  (addressLines.length > 0 ? addressLines : ['-']).slice(0, 4).forEach((ln) => {
    cmds.push(textAt(xLeft + 24, y, 11, ln));
    y -= 16;
  });

  let yMeta = 754;
  const metaLabelX = xRight;
  const metaColonX = xRight + 78;
  const metaValueX = xRight + 92;
  const metaRow = (label: string, value: string) => {
    cmds.push(textAt(metaLabelX, yMeta, 11, label));
    cmds.push(textAt(metaColonX, yMeta, 11, ':'));
    cmds.push(textAt(metaValueX, yMeta, 11, value));
    yMeta -= 16;
  };
  metaRow('Date', today);
  metaRow('Due Date', dueDate);
  metaRow('Currency', 'IDR - RUPIAH');

  y = Math.min(y, yMeta) - 22;

  const tableX = 40;
  const tableW = 515;
  const hRow = 22;
  const cols = [tableX, 220, 360, 555];
  const headerTop = y;
  const bodyRows = Math.max(rows.length, 1);
  const tableBottom = headerTop - hRow * (bodyRows + 1);

  cmds.push(line(tableX, headerTop, tableX + tableW, headerTop));
  cmds.push(line(tableX, headerTop - hRow, tableX + tableW, headerTop - hRow));
  for (let i = 0; i < bodyRows; i++) {
    const yy = headerTop - hRow * (i + 2);
    cmds.push(line(tableX, yy, tableX + tableW, yy));
  }
  cols.forEach((x) => cmds.push(line(x, headerTop, x, tableBottom)));

  cmds.push(textAt(tableX + 6, headerTop - 15, 11, 'Order Code'));
  cmds.push(textAt(cols[1] + 6, headerTop - 15, 11, 'Order Date'));
  cmds.push(textAt(cols[2] + 6, headerTop - 15, 11, 'Amount'));

  rows.forEach((row, idx) => {
    const yy = headerTop - hRow * (idx + 1) - 15;
    cmds.push(textAt(tableX + 6, yy, 10, row.orderCode));
    cmds.push(textAt(cols[1] + 6, yy, 10, row.orderDate || '-'));
    cmds.push(textAt(cols[2] + 6, yy, 10, row.amount.toLocaleString('id-ID')));
  });

  const transferTop = tableBottom - 70;
  cmds.push(line(tableX, transferTop + 18, 300, transferTop + 18));
  cmds.push(line(tableX, transferTop - 52, 300, transferTop - 52));
  cmds.push(line(tableX, transferTop + 18, tableX, transferTop - 52));
  cmds.push(line(300, transferTop + 18, 300, transferTop - 52));
  cmds.push(textAt(tableX + 8, transferTop + 4, 11, 'Transfer to:'));
  cmds.push(textAt(tableX + 8, transferTop - 14, 11, 'PT Toko Pandai Nusantara'));
  cmds.push(textAt(tableX + 8, transferTop - 30, 11, 'Bank BCA, Cabang Matraman, Jakarta'));
  cmds.push(textAt(tableX + 8, transferTop - 46, 11, 'AC: 342-9183333 (IDR)'));

  const totalY = transferTop - 90;
  const pageRightX = 555;
  const totalLabelX = 390;
  const amountText = grandTotal.toLocaleString('id-ID');
  const amountRightX = pageRightX - amountText.length * 5.6;
  cmds.push(textAt(totalLabelX, totalY, 12, 'GRAND TOTAL'));
  cmds.push(textAt(amountRightX, totalY, 12, amountText));

  const regardsY = totalY - 34;
  cmds.push(textAt(totalLabelX, regardsY, 12, 'Regards,'));
  cmds.push(textAt(totalLabelX, regardsY - 18, 12, 'PT Toko Pandai Nusantara'));

  const stream = cmds.join('\n');
  const pdf = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length ${stream.length} >> stream
${stream}
endstream endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000060 00000 n 
0000000117 00000 n 
0000000243 00000 n 
0000000000 00000 n 
trailer << /Root 1 0 R /Size 6 >>
startxref
0
%%EOF`;
  return new Blob([pdf], { type: 'application/pdf' });
};

const TukarFakturPage = () => {
  const { roles } = useAuth();
  const restrictedRoles = getRestrictedRoles();
  const hasRestrictedRole = roles.some((role) => restrictedRoles.includes(role));
  const userRoleForFiltering = roles.find((role) => restrictedRoles.includes(role));
  const agentFilter = hasRestrictedRole ? getAgentNameFromRole(userRoleForFiltering!) : '';

  const [modalOpen, setModalOpen] = useState(false);
  const [orderCodeFilter, setOrderCodeFilter] = useState('');
  const [batches, setBatches] = useState<TukarFakturBatchListItem[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<TukarFakturBatchDetailData | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingDetailId, setLoadingDetailId] = useState<string | null>(null);
  const [loadingPdfId, setLoadingPdfId] = useState<string | null>(null);
  const [processingBatch, setProcessingBatch] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const loadHistory = useCallback(async () => {
    clearMessages();
    setLoadingList(true);
    try {
      const rows = await fetchTukarFakturBatches({
        page: 1,
        limit: 50,
        order_code: orderCodeFilter || undefined,
      });
      setBatches(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setLoadingList(false);
    }
  }, [orderCodeFilter]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleGenerate = async ({
    dueDate,
    recipientName,
    recipientAddress,
    invoices,
  }: {
    dueDate: string;
    recipientName: string;
    recipientAddress: string;
    invoices: Order[];
  }) => {
    clearMessages();
    if (!recipientAddress.trim()) {
      setError('To address is required.');
      return;
    }
    setProcessingBatch(true);
    try {
      const total = invoices.reduce((sum, inv) => sum + Number(inv.total_invoice || 0), 0);
      const finalRecipientName = recipientName.trim() || invoices[0]?.store_name?.trim() || '';
      if (!finalRecipientName) {
        setError('Recipient name is required.');
        return;
      }
      await createTukarFakturBatch({
        due_date: dueDate,
        recipient_name: finalRecipientName,
        recipient_address: recipientAddress,
        generated_by: hasRestrictedRole ? agentFilter : undefined,
        items: invoices.map((inv) => ({ order_code: inv.order_code })),
        total_combined_amount: total,
        invoice_count: invoices.length,
        customer_store_summary: finalRecipientName,
        idempotency_key: crypto.randomUUID(),
      });
      setModalOpen(false);
      setSuccess('Tukar faktur batch generated successfully.');
      loadHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate tukar faktur');
    } finally {
      setProcessingBatch(false);
    }
  };

  const onDetail = async (batchId: string) => {
    setLoadingDetailId(batchId);
    try {
      const res = await fetchTukarFakturBatchDetail(batchId);
      setSelectedBatch(res.data);
      setDetailOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get detail');
    } finally {
      setLoadingDetailId(null);
    }
  };

  const onPdf = async (batchId: string) => {
    setLoadingPdfId(batchId);
    try {
      const detailRes = await fetchTukarFakturBatchDetail(batchId);
      const batch = detailRes.data;
      const itemCodes = (batch.items || []).map((item) => item.order_code).filter(Boolean);
      if (itemCodes.length === 0) {
        throw new Error('No order items found for this batch.');
      }

      const orderDetails = await Promise.all(
        itemCodes.map(async (code) => {
          try {
            const res = await fetchOrderDetail(code);
            return { code, details: res.data?.details || [] };
          } catch {
            return { code, details: [] };
          }
        }),
      );

      const rows: GeneratedInvoiceRow[] = orderDetails.map(({ code, details }) => {
        const first = details[0];
        const amount = details.reduce((sum, d) => sum + Number(d.total_invoice || 0), 0);
        const orderDate = first?.order_date
          ? new Date(first.order_date).toLocaleDateString('id-ID')
          : '-';
        return {
          orderCode: code,
          orderDate,
          amount,
        };
      });

      const firstDetail = orderDetails.find((item) => item.details.length > 0)?.details[0];
      const recipientName =
        batch.recipient_name ||
        firstDetail?.nama_toko ||
        batch.customer_store_summary ||
        'Customer';
      const recipientAddress =
        batch.recipient_address ||
        firstDetail?.alamat ||
        '-';

      const pdfBlob = buildBatchInvoicePdfBlob({
        batch,
        recipientName,
        recipientAddress,
        rows,
      });

      const url = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tukar-faktur-${batch.batch_id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download PDF');
    } finally {
      setLoadingPdfId(null);
    }
  };

  return (
    <PageContainer title="Tukar Faktur" description="Generate combined invoice PDF for BELUM LUNAS orders">
      <Box>
        <Box
          mb={3}
          display="flex"
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', md: 'center' }}
          flexDirection={{ xs: 'column', md: 'row' }}
          gap={2}
        >
          <Box>
            <Typography variant="h3" fontWeight="bold" mb={1}>
              Tukar Faktur
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Select BELUM LUNAS invoices, set one due date, generate one combined PDF, and keep batch history.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button variant="contained" onClick={() => setModalOpen(true)} disabled={processingBatch} sx={{ minWidth: 44, px: 1.5 }}>
              {processingBatch ? '...' : '+'}
            </Button>
            <Button variant="outlined" onClick={loadHistory} disabled={loadingList}>
              {loadingList ? 'Refreshing...' : 'Refresh'}
            </Button>
          </Stack>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Card>
          <CardContent>
            <Grid container spacing={2} mb={2}>
              <Grid size={{ xs: 12, md: 12 }}>
                <TextField label="Order Code" value={orderCodeFilter} onChange={(e) => setOrderCodeFilter(e.target.value)} fullWidth size="small" />
              </Grid>
            </Grid>
            <Stack direction="row" spacing={1} mb={2}>
              <Button variant="contained" onClick={loadHistory} disabled={loadingList}>
                {loadingList ? 'Searching...' : 'Search'}
              </Button>
            </Stack>
            <TukarFakturHistoryTable
              rows={batches}
              loading={loadingList}
              onDetail={onDetail}
              onPdf={onPdf}
              loadingDetailId={loadingDetailId}
              loadingPdfId={loadingPdfId}
            />
          </CardContent>
        </Card>

        <TukarFakturInvoiceModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          agent={agentFilter || undefined}
          onConfirm={handleGenerate}
        />

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
