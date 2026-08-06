'use client';

import { Box, Card, CardContent, CircularProgress, Typography } from '@mui/material';

export interface InvoiceSummaryCardData {
  totalInvoice: number;
  invoiceCount: number;
  margin: number;
}

interface InvoiceSummaryCardProps {
  data?: InvoiceSummaryCardData;
  isLoading?: boolean;
}

const EMPTY: InvoiceSummaryCardData = {
  totalInvoice: 0,
  invoiceCount: 0,
  margin: 0,
};

const mutedLabelSx = {
  color: (theme: { palette: { mode: string } }) =>
    theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.45)',
};

function formatNumber(value: number): string {
  return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function formatIdr(value: number): string {
  return `IDR ${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

function formatPercent(value: number): string {
  return `${value.toLocaleString('en-US', { maximumFractionDigits: 1 })}%`;
}

const InvoiceSummaryCard = ({
  data = EMPTY,
  isLoading = false,
}: InvoiceSummaryCardProps) => {
  return (
    <Card
      sx={(theme) => ({
        height: '100%',
        border: '1px solid',
        borderColor:
          theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.12)',
        boxShadow:
          theme.palette.mode === 'dark' ? 'none' : '0 1px 4px rgba(0, 0, 0, 0.06)',
      })}
    >
      <CardContent sx={{ p: 1.75, '&:last-child': { pb: 1.75 } }}>
        {isLoading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={160}>
            <CircularProgress size={32} />
          </Box>
        ) : (
          <>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1,
                mb: 1.75,
              }}
            >
              <Typography
                variant="subtitle1"
                fontWeight={700}
                sx={{
                  textTransform: 'uppercase',
                  letterSpacing: 0.6,
                  lineHeight: 1.2,
                  ...mutedLabelSx,
                }}
              >
                Invoice
              </Typography>
            </Box>

            <Box sx={{ mb: 1.75 }}>
              <Typography
                variant="h2"
                fontWeight={700}
                sx={{
                  lineHeight: 1.1,
                  fontVariantNumeric: 'tabular-nums',
                  fontSize: { xs: '1.55rem', sm: '1.85rem' },
                  wordBreak: 'break-word',
                }}
              >
                {formatIdr(data.totalInvoice)}
              </Typography>
              <Typography
                variant="body1"
                fontWeight={600}
                sx={{
                  mt: 0.4,
                  display: 'block',
                  ...mutedLabelSx,
                }}
              >
                Total Invoice
              </Typography>
            </Box>

            <Box
              sx={{
                borderTop: '1px solid',
                borderColor: 'divider',
                pt: 1.25,
                display: 'flex',
                flexDirection: 'column',
                gap: 0.75,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 2,
                }}
              >
                <Typography variant="body1" color="text.secondary" fontWeight={500}>
                  Invoice Count
                </Typography>
                <Typography
                  variant="body1"
                  fontWeight={700}
                  sx={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {formatNumber(data.invoiceCount)}
                </Typography>
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 2,
                }}
              >
                <Typography variant="body1" color="text.secondary" fontWeight={500}>
                  Margin
                </Typography>
                <Typography
                  variant="body1"
                  fontWeight={700}
                  sx={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {formatPercent(data.margin)}
                </Typography>
              </Box>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default InvoiceSummaryCard;
