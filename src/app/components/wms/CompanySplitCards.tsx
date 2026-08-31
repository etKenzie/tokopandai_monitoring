'use client';

import { CompanyNominal } from '@/app/api/wms/PurchasingSlice';
import { Box, Card, CardContent, Grid, Typography } from '@mui/material';

interface CompanySplitCardsProps {
  companies: Record<string, CompanyNominal>;
}

type MetricKey = 'totalNominal' | 'totalOrders' | 'totalQty';

interface MetricConfig {
  key: MetricKey;
  heading: string;
  caption: string;
  accent: string;
  format: (value: number) => string;
}

const mutedLabelSx = {
  color: (theme: { palette: { mode: string } }) =>
    theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.45)',
};

const formatNumber = (value: number): string =>
  Math.round(value).toLocaleString('id-ID');

const formatIdr = (value: number): string =>
  `Rp ${Math.round(value).toLocaleString('id-ID')}`;

const formatPercent = (value: number): string =>
  `${value.toLocaleString('en-US', { maximumFractionDigits: 1 })}%`;

/** "PT TOKOPANDAI NUSANTARA" -> "Tokopandai" */
const shortCompanyName = (name: string): string => {
  const significant = name.replace(/^PT\.?\s+/i, '').trim();
  const firstWord = significant.split(/\s+/)[0] ?? name;
  return firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase();
};

const METRICS: MetricConfig[] = [
  {
    key: 'totalNominal',
    heading: 'Total Nominal',
    caption: 'Total pembelian',
    accent: '#0EA5E9',
    format: formatIdr,
  },
  {
    key: 'totalOrders',
    heading: 'Orders',
    caption: 'Total orders',
    accent: '#8B5CF6',
    format: formatNumber,
  },
  {
    key: 'totalQty',
    heading: 'Quantity',
    caption: 'Total quantity',
    accent: '#D97706',
    format: formatNumber,
  },
];

const CompanySplitCards = ({ companies }: CompanySplitCardsProps) => {
  const rows = Object.values(companies ?? {});

  return (
    <Grid container spacing={2}>
      {METRICS.map((metric) => {
        const total = rows.reduce((sum, row) => sum + (row[metric.key] || 0), 0);
        const splits = [...rows].sort((a, b) => b[metric.key] - a[metric.key]);
        const leaderShare = total > 0 && splits.length > 0
          ? (splits[0][metric.key] / total) * 100
          : 0;

        return (
          <Grid key={metric.key} size={{ xs: 12, md: 4 }}>
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
                    {metric.heading}
                  </Typography>
                  {splits.length > 0 && (
                    <Box
                      sx={{
                        px: 1.1,
                        py: 0.35,
                        borderRadius: 0.75,
                        bgcolor: `${metric.accent}1F`,
                        color: metric.accent,
                        border: '1px solid',
                        borderColor: `${metric.accent}47`,
                        flexShrink: 0,
                      }}
                    >
                      <Typography
                        variant="body2"
                        component="span"
                        sx={{ letterSpacing: 0.2, display: 'inline-flex', gap: 0.5 }}
                      >
                        <Box component="span" fontWeight={800}>
                          {formatPercent(leaderShare)}
                        </Box>
                        <Box component="span" fontWeight={600}>
                          {shortCompanyName(splits[0].buyerCompany)}
                        </Box>
                      </Typography>
                    </Box>
                  )}
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
                    {metric.format(total)}
                  </Typography>
                  <Typography
                    variant="body1"
                    fontWeight={600}
                    sx={{ mt: 0.4, display: 'block', ...mutedLabelSx }}
                  >
                    {metric.caption}
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
                  {splits.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No company data
                    </Typography>
                  ) : (
                    splits.map((row) => (
                      <Box
                        key={row.buyerCompany}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 2,
                        }}
                      >
                        <Typography
                          variant="body1"
                          color="text.secondary"
                          fontWeight={500}
                          title={row.buyerCompany}
                        >
                          {shortCompanyName(row.buyerCompany)}
                        </Typography>
                        <Typography
                          variant="body1"
                          fontWeight={700}
                          sx={{ fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}
                        >
                          {metric.format(row[metric.key])}
                        </Typography>
                      </Box>
                    ))
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
};

export default CompanySplitCards;
