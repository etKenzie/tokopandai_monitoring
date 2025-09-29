'use client';

import { Box, CircularProgress, Grid } from '@mui/material';
import React from 'react';
import DashboardCard from './DashboardCard';

interface TileDef {
  title: string;
  value: string | number;
  isCurrency?: boolean;
  color?: string;
  fontWeight?: number;
  mdSize?: number; // Individual tile column size
  unit?: string; // Optional unit suffix (e.g., "Days", "%", etc.)
  isLoading?: boolean; // Optional loading state for individual tiles
}

interface SummaryTilesProps {
  tiles: TileDef[];
  md?: number; // columns per row, default 4
}

const SummaryTiles: React.FC<SummaryTilesProps> = ({ tiles, md = 4 }) => {
  const formatValue = (value: string | number, isCurrency?: boolean) => {
    if (isCurrency && typeof value === 'number') {
      // Format currency with commas as thousand separators, no decimal places
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0, // No decimal places for currency
      }).format(value);
    }
    
    if (typeof value === 'number') {
      // Only format as percentage if explicitly marked as currency: false AND value is a decimal between 0 and 1
      if (isCurrency === false && value <= 1 && value > 0 && value % 1 !== 0) {
        return `${(value * 100).toFixed(1)}%`;
      }
      // Format numbers with commas as thousand separators, showing decimals only when they exist
      return value.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 1, // Show up to 1 decimal place only if it exists
      });
    }
    
    return value;
  };

  return (
    <Grid container spacing={3} alignItems="stretch">
      {tiles.map((tile, idx) => (
        <Grid size={{ xs: 12, sm: 6, md: tile.mdSize || md }} key={tile.title + idx}>
          <Box sx={{ color: tile.color, fontWeight: tile.fontWeight, height: '100%' }}>
            <DashboardCard>
              <Box p={2} sx={{ 
                height: '120px', 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'space-between',
                minHeight: '120px'
              }}>
                <Box
                  sx={{
                    fontSize: '0.875rem',
                    color: 'text.secondary',
                    mb: 1,
                    fontWeight: 500,
                    minHeight: '1.5rem',
                    alignItems: 'flex-start',
                    lineHeight: '1.2',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {tile.title}
                </Box>
                <Box
                  sx={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    color: tile.color || 'text.primary',
                    minHeight: '2.5rem',
                    alignItems: 'flex-end',
                    lineHeight: '1.2',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {tile.isLoading ? (
                    <CircularProgress size={20} />
                  ) : (
                    formatValue(tile.value, tile.isCurrency) + (tile.unit || '')
                  )}
                </Box>
              </Box>
            </DashboardCard>
          </Box>
        </Grid>
      ))}
    </Grid>
  );
};

export default SummaryTiles;
