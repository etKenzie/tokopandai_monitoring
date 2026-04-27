'use client';

import { TukarFakturBatchListItem } from '@/app/api/distribusi/DistribusiSlice';
import { Button, Stack, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';

interface TukarFakturHistoryTableProps {
  rows: TukarFakturBatchListItem[];
  loading: boolean;
  onDetail: (batchId: string) => void;
  onPdf: (batchId: string) => void;
  loadingDetailId?: string | null;
  loadingPdfId?: string | null;
}

const TukarFakturHistoryTable = ({
  rows,
  loading,
  onDetail,
  onPdf,
  loadingDetailId,
  loadingPdfId,
}: TukarFakturHistoryTableProps) => {
  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Customer</TableCell>
          <TableCell>Generated At</TableCell>
          <TableCell>Due Date</TableCell>
          <TableCell align="right">Invoice Count</TableCell>
          <TableCell align="right">Total Amount</TableCell>
          <TableCell>Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {loading ? (
          <TableRow>
            <TableCell colSpan={6} align="center">
              Loading...
            </TableCell>
          </TableRow>
        ) : rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} align="center">
              No history found.
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row) => (
            <TableRow key={row.batch_id} hover>
              <TableCell>{row.recipient_name || row.customer_store_summary || '-'}</TableCell>
              <TableCell>
                {row.generated_at
                  ? new Date(row.generated_at).toLocaleString('id-ID')
                  : row.created_at
                    ? new Date(row.created_at).toLocaleString('id-ID')
                    : '-'}
              </TableCell>
              <TableCell>{row.due_date || '-'}</TableCell>
              <TableCell align="right">{row.invoice_count ?? '-'}</TableCell>
              <TableCell align="right">
                {typeof row.total_combined_amount === 'number'
                  ? row.total_combined_amount.toLocaleString('id-ID')
                  : '-'}
              </TableCell>
              <TableCell>
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="outlined"
                    size="small"
                    disabled={loadingDetailId === row.batch_id}
                    onClick={() => onDetail(row.batch_id)}
                  >
                    {loadingDetailId === row.batch_id ? 'Loading...' : 'Detail'}
                  </Button>
                  <Button
                    variant="contained"
                    size="small"
                    disabled={loadingPdfId === row.batch_id}
                    onClick={() => onPdf(row.batch_id)}
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
  );
};

export default TukarFakturHistoryTable;
