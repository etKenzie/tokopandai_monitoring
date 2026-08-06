'use client';

import { ExpandLess as ExpandLessIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Collapse,
  Typography,
} from '@mui/material';
import { useState } from 'react';

export interface ProfitProgressCardData {
  totalProfit: number;
  goalProfit: number;
  profitRemaining: number;
  profitProgress: number;
  daysRemaining: number;
  averageDailyProfit: number;
  averageWeeklyProfit: number;
  dailyProfitToGoal: number;
  weeklyProfitToGoal: number;
}

interface ProfitProgressCardProps {
  data?: ProfitProgressCardData;
  isLoading?: boolean;
  goalAccentColor?: string;
}

const EMPTY: ProfitProgressCardData = {
  totalProfit: 0,
  goalProfit: 0,
  profitRemaining: 0,
  profitProgress: 0,
  daysRemaining: 0,
  averageDailyProfit: 0,
  averageWeeklyProfit: 0,
  dailyProfitToGoal: 0,
  weeklyProfitToGoal: 0,
};

const TOTAL_PROFIT_COLOR = '#16A34A';
const PROGRESS_COLOR = '#16A34A';
const REMAINING_COLOR = '#DC2626';

function formatIdr(value: number): string {
  return `IDR ${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

function formatPercent(value: number): string {
  return `${value.toLocaleString('en-US', { maximumFractionDigits: 1 })}%`;
}

function getDaysColor(days: number): string {
  if (days <= 30) return '#DC2626';
  if (days <= 90) return '#D97706';
  return '#16A34A';
}

const ProfitProgressCard = ({
  data = EMPTY,
  isLoading = false,
  goalAccentColor,
}: ProfitProgressCardProps) => {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const achievedPct = Math.min(100, Math.max(0, data.profitProgress));
  const remainingPct = Math.max(0, 100 - achievedPct);
  const remainingColor =
    data.profitRemaining >= 0 ? PROGRESS_COLOR : REMAINING_COLOR;

  return (
    <Card
      sx={(theme) => ({
        border: '1px solid',
        borderColor:
          theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.12)',
        bgcolor: theme.palette.background.paper,
        boxShadow:
          theme.palette.mode === 'dark' ? 'none' : '0 1px 4px rgba(0, 0, 0, 0.06)',
      })}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        {isLoading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={180}>
            <CircularProgress size={32} />
          </Box>
        ) : (
          <>
            <Box
              onClick={() => setDetailsOpen((open) => !open)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1,
                mb: 0.75,
                cursor: 'pointer',
                userSelect: 'none',
                borderRadius: 1,
                '&:hover': {
                  opacity: 0.85,
                },
              }}
            >
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: '1.15rem',
                  color: 'text.primary',
                }}
              >
                Profit Progress
              </Typography>
              <Box sx={{ display: 'inline-flex', alignItems: 'center', color: 'text.secondary' }}>
                <Typography variant="caption" fontWeight={600} sx={{ mr: 0.5 }}>
                  {detailsOpen ? 'Hide details' : 'Show details'}
                </Typography>
                {detailsOpen ? (
                  <ExpandLessIcon fontSize="small" />
                ) : (
                  <ExpandMoreIcon fontSize="small" />
                )}
              </Box>
            </Box>

            <Box
              sx={{
                display: 'flex',
                alignItems: { xs: 'flex-start', md: 'flex-end' },
                justifyContent: 'space-between',
                flexDirection: { xs: 'column', md: 'row' },
                gap: { xs: 2, md: 3 },
                mb: 1.75,
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  fontWeight={700}
                  sx={{
                    lineHeight: 1.1,
                    fontVariantNumeric: 'tabular-nums',
                    fontSize: { xs: '1.65rem', sm: '2rem', md: '2.2rem' },
                    color: TOTAL_PROFIT_COLOR,
                    wordBreak: 'break-word',
                  }}
                >
                  {formatIdr(data.totalProfit)}
                </Typography>
                <Typography
                  variant="body2"
                  fontWeight={600}
                  color="text.secondary"
                  sx={{ mt: 0.35 }}
                >
                  Total Profit
                </Typography>
              </Box>

              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: { xs: 2, sm: 3 },
                  flexShrink: 0,
                }}
              >
                <Box>
                  <Typography variant="body2" fontWeight={600} color="text.secondary">
                    Profit Remaining
                  </Typography>
                  <Typography
                    fontWeight={700}
                    sx={{
                      mt: 0.25,
                      color: remainingColor,
                      fontVariantNumeric: 'tabular-nums',
                      fontSize: { xs: '0.95rem', sm: '1.05rem' },
                    }}
                  >
                    {formatIdr(data.profitRemaining)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" fontWeight={600} color="text.secondary">
                    Goal Profit
                  </Typography>
                  <Typography
                    fontWeight={700}
                    sx={{
                      mt: 0.25,
                      color: 'text.primary',
                      fontVariantNumeric: 'tabular-nums',
                      fontSize: { xs: '0.95rem', sm: '1.05rem' },
                    }}
                  >
                    {formatIdr(data.goalProfit)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" fontWeight={600} color="text.secondary">
                    Profit Progress
                  </Typography>
                  <Typography
                    fontWeight={700}
                    sx={{
                      mt: 0.25,
                      fontVariantNumeric: 'tabular-nums',
                      fontSize: { xs: '0.95rem', sm: '1.05rem' },
                    }}
                  >
                    {formatPercent(data.profitProgress)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" fontWeight={600} color="text.secondary">
                    Days Remaining
                  </Typography>
                  <Typography
                    fontWeight={700}
                    sx={{
                      mt: 0.25,
                      color: getDaysColor(data.daysRemaining),
                      fontVariantNumeric: 'tabular-nums',
                      fontSize: { xs: '0.95rem', sm: '1.05rem' },
                    }}
                  >
                    {data.daysRemaining.toLocaleString('en-US')} days
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Box
              sx={{
                width: '100%',
                height: 10,
                borderRadius: 1.5,
                overflow: 'hidden',
                bgcolor: (theme) =>
                  theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                backgroundImage:
                  data.goalProfit > 0
                    ? `linear-gradient(to right,
                        ${PROGRESS_COLOR} 0%,
                        ${PROGRESS_COLOR} ${achievedPct}%,
                        ${REMAINING_COLOR} ${achievedPct}%,
                        ${REMAINING_COLOR} 100%)`
                    : 'none',
              }}
            />

            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: { xs: 1.25, sm: 2.5 },
                mt: 1,
              }}
            >
              <Typography variant="caption" fontWeight={600} sx={{ color: PROGRESS_COLOR }}>
                Achieved {formatPercent(achievedPct)}
              </Typography>
              <Typography variant="caption" fontWeight={600} sx={{ color: REMAINING_COLOR }}>
                Remaining {formatPercent(remainingPct)}
              </Typography>
            </Box>

            <Collapse in={detailsOpen}>
              <Box
                sx={{
                  borderTop: '1px solid',
                  borderColor: 'divider',
                  pt: 1.5,
                  mt: 2,
                  display: 'grid',
                  gap: 2,
                  gridTemplateColumns: {
                    xs: '1fr 1fr',
                    sm: 'repeat(4, minmax(0, 1fr))',
                  },
                }}
              >
                <Box>
                  <Typography variant="body2" fontWeight={600} color="text.secondary">
                    Avg Daily Profit
                  </Typography>
                  <Typography
                    fontWeight={700}
                    sx={{
                      mt: 0.35,
                      fontVariantNumeric: 'tabular-nums',
                      fontSize: { xs: '0.95rem', sm: '1.05rem' },
                    }}
                  >
                    {formatIdr(data.averageDailyProfit)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" fontWeight={600} color="text.secondary">
                    Avg Weekly Profit
                  </Typography>
                  <Typography
                    fontWeight={700}
                    sx={{
                      mt: 0.35,
                      fontVariantNumeric: 'tabular-nums',
                      fontSize: { xs: '0.95rem', sm: '1.05rem' },
                    }}
                  >
                    {formatIdr(data.averageWeeklyProfit)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" fontWeight={600} color="text.secondary">
                    Daily to Goal
                  </Typography>
                  <Typography
                    fontWeight={700}
                    sx={{
                      mt: 0.35,
                      color: goalAccentColor || 'text.primary',
                      fontVariantNumeric: 'tabular-nums',
                      fontSize: { xs: '0.95rem', sm: '1.05rem' },
                    }}
                  >
                    {formatIdr(data.dailyProfitToGoal)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" fontWeight={600} color="text.secondary">
                    Weekly to Goal
                  </Typography>
                  <Typography
                    fontWeight={700}
                    sx={{
                      mt: 0.35,
                      color: goalAccentColor || 'text.primary',
                      fontVariantNumeric: 'tabular-nums',
                      fontSize: { xs: '0.95rem', sm: '1.05rem' },
                    }}
                  >
                    {formatIdr(data.weeklyProfitToGoal)}
                  </Typography>
                </Box>
              </Box>
            </Collapse>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfitProgressCard;
