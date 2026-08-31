'use client';

import { StockValueCategory } from '@/app/api/wms/WarehouseSlice';
import {
  Box,
  Card,
  CardContent,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TableRow,
  TableSortLabel,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';

type MetricKey = 'totalValue' | 'totalQty' | 'productCount';
type SortDirection = 'asc' | 'desc';

const METRIC_LABELS: Record<MetricKey, string> = {
  totalValue: 'Stock Value',
  totalQty: 'Qty',
  productCount: 'Products',
};

interface CategoryStockBreakdownProps {
  categories: StockValueCategory[];
  /** Highlights the row matching this category name, if any. */
  activeCategory?: string;
  onCategoryClick?: (categoryName: string) => void;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const formatNumber = (value: number) => Math.round(value).toLocaleString('id-ID');

const CategoryStockBreakdown = ({
  categories,
  activeCategory,
  onCategoryClick,
}: CategoryStockBreakdownProps) => {
  // The chosen metric drives both the ranking and the share bar behind each row.
  const [metric, setMetric] = useState<MetricKey>('totalValue');
  const [order, setOrder] = useState<SortDirection>('desc');

  const rows = categories ?? [];

  const total = useMemo(
    () => rows.reduce((sum, category) => sum + (category[metric] || 0), 0),
    [rows, metric],
  );

  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, category) => ({
          products: acc.products + (category.productCount || 0),
          qty: acc.qty + (category.totalQty || 0),
          value: acc.value + (category.totalValue || 0),
        }),
        { products: 0, qty: 0, value: 0 },
      ),
    [rows],
  );

  // Rank always reflects the descending order of the metric, even when the
  // table itself is sorted ascending, so "#1" stays the largest category.
  const ranked = useMemo(() => {
    const byMetricDesc = [...rows].sort((a, b) => b[metric] - a[metric]);
    const rankByName = new Map(
      byMetricDesc.map((category, index) => [category.categoryName, index + 1]),
    );

    return byMetricDesc
      .map((category) => ({
        ...category,
        rank: rankByName.get(category.categoryName) ?? 0,
        share: total > 0 ? ((category[metric] || 0) / total) * 100 : 0,
      }))
      .sort((a, b) => (order === 'desc' ? b[metric] - a[metric] : a[metric] - b[metric]));
  }, [rows, metric, order, total]);

  return (
    <Card
      sx={(theme) => ({
        border: '1px solid',
        borderColor:
          theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.12)',
        boxShadow: theme.palette.mode === 'dark' ? 'none' : '0 1px 4px rgba(0, 0, 0, 0.06)',
      })}
    >
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
            mb: 2,
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ m: 0 }}>
              Stock by Category
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Ranked by {METRIC_LABELS[metric].toLowerCase()} — click a row to filter the table
            </Typography>
          </Box>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={metric}
            onChange={(_, value) => value && setMetric(value as MetricKey)}
          >
            {(Object.keys(METRIC_LABELS) as MetricKey[]).map((key) => (
              <ToggleButton key={key} value={key}>
                {METRIC_LABELS[key]}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>

        <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 460 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 56 }}>#</TableCell>
                <TableCell>
                  <TableSortLabel
                    active
                    direction={order}
                    onClick={() => setOrder(order === 'desc' ? 'asc' : 'desc')}
                  >
                    Category
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">Products</TableCell>
                <TableCell align="right">Qty</TableCell>
                <TableCell align="right">Stock Value</TableCell>
                <TableCell align="right" sx={{ width: 80 }}>
                  Share
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ranked.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body2" color="textSecondary" sx={{ py: 2 }}>
                      No category data
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                ranked.map((category) => {
                  const active = activeCategory === category.categoryName;
                  const fill = Math.min(100, category.share);

                  return (
                    <TableRow
                      key={category.categoryId ?? category.categoryName}
                      hover
                      onClick={() => onCategoryClick?.(category.categoryName)}
                      sx={{
                        cursor: onCategoryClick ? 'pointer' : 'default',
                        // The share reads as a bar filling the row itself rather
                        // than as a separate progress column.
                        background: (theme) =>
                          `linear-gradient(to right, ${
                            active
                              ? 'rgba(245, 158, 11, 0.28)'
                              : theme.palette.mode === 'dark'
                                ? 'rgba(59, 130, 246, 0.30)'
                                : 'rgba(59, 130, 246, 0.16)'
                          } ${fill}%, transparent ${fill}%)`,
                        borderLeft: active ? '3px solid' : '3px solid transparent',
                        borderLeftColor: active ? 'warning.main' : 'transparent',
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold" color="text.secondary">
                          {category.rank}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={active ? 'bold' : 'medium'}>
                          {category.categoryName}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">{formatNumber(category.productCount)}</TableCell>
                      <TableCell align="right">{formatNumber(category.totalQty)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                        {formatCurrency(category.totalValue)}
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="caption" fontWeight="bold">
                          {category.share.toFixed(1)}%
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
            {ranked.length > 0 && (
              <TableFooter>
                <TableRow
                  sx={{
                    backgroundColor: 'action.hover',
                    '& td': {
                      fontWeight: 'bold',
                      fontSize: '0.875rem',
                      borderTop: '2px solid',
                      borderTopColor: 'divider',
                    },
                  }}
                >
                  <TableCell colSpan={2}>Total ({ranked.length} categories)</TableCell>
                  <TableCell align="right">{formatNumber(totals.products)}</TableCell>
                  <TableCell align="right">{formatNumber(totals.qty)}</TableCell>
                  <TableCell align="right">{formatCurrency(totals.value)}</TableCell>
                  <TableCell align="right">100%</TableCell>
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

export default CategoryStockBreakdown;
