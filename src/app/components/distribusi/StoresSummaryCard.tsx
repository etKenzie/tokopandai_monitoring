'use client';

import { Box, Card, CardContent, CircularProgress, Typography } from '@mui/material';

export interface StoresSummaryCardData {
  activeStores: number;
  totalStores: number;
  activationRate: number;
}

interface StoresSummaryCardProps {
  data?: StoresSummaryCardData;
  isLoading?: boolean;
}

const EMPTY: StoresSummaryCardData = {
  activeStores: 0,
  totalStores: 0,
  activationRate: 0,
};

const mutedLabelSx = {
  color: (theme: { palette: { mode: string } }) =>
    theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.45)',
};

function formatNumber(value: number): string {
  return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function formatPercent(value: number): string {
  return `${value.toLocaleString('en-US', { maximumFractionDigits: 1 })}%`;
}

const StoresSummaryCard = ({
  data = EMPTY,
  isLoading = false,
}: StoresSummaryCardProps) => {
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
                Stores
              </Typography>
              <Box
                sx={{
                  px: 1.1,
                  py: 0.35,
                  borderRadius: 0.75,
                  bgcolor: 'rgba(37, 99, 235, 0.12)',
                  color: '#2563EB',
                  border: '1px solid',
                  borderColor: 'rgba(37, 99, 235, 0.28)',
                  flexShrink: 0,
                }}
              >
                <Typography
                  variant="body2"
                  component="span"
                  sx={{ letterSpacing: 0.2, display: 'inline-flex', gap: 0.5 }}
                >
                  <Box component="span" fontWeight={800}>
                    {formatPercent(data.activationRate)}
                  </Box>
                  <Box component="span" fontWeight={600}>
                    activation
                  </Box>
                </Typography>
              </Box>
            </Box>

            <Box sx={{ mb: 1.75 }}>
              <Typography
                variant="h2"
                fontWeight={700}
                sx={{
                  lineHeight: 1.05,
                  fontVariantNumeric: 'tabular-nums',
                  fontSize: { xs: '2rem', sm: '2.35rem' },
                }}
              >
                {formatNumber(data.activeStores)}
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
                Active Stores
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
                  Total Stores
                </Typography>
                <Typography
                  variant="body1"
                  fontWeight={700}
                  sx={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {formatNumber(data.totalStores)}
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
                  Activation Rate
                </Typography>
                <Typography
                  variant="body1"
                  fontWeight={700}
                  sx={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {formatPercent(data.activationRate)}
                </Typography>
              </Box>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default StoresSummaryCard;
