'use client';

import { Box, Grid } from '@mui/material';
import React from 'react';
import DashboardCard from './DashboardCard';

interface TileDef {
  title: string;
  value: string | number;
  isCurrency?: boolean;
  color?: string;
  fontWeight?: number;
}

interface SummaryTilesProps {
  tiles: TileDef[];
  md?: number; // columns per row, default 4
}

const SummaryTiles: React.FC<SummaryTilesProps> = ({ tiles, md = 4 }) => {
  const formatValue = (value: string | number, isCurrency?: boolean) => {
    if (isCurrency && typeof value === 'number') {
      // Format currency with commas as thousand separators but preserve actual decimals
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 3, // Allow up to 3 decimal places if they exist
      }).format(value);
    }
    
    if (typeof value === 'number') {
      // Only format as percentage if explicitly marked as currency: false AND value is a decimal between 0 and 1
      if (isCurrency === false && value <= 1 && value > 0 && value % 1 !== 0) {
        return `${(value * 100).toFixed(2)}%`;
      }
      // Format numbers with commas as thousand separators, preserving actual decimal places
      return value.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 3, // Allow up to 3 decimal places if they exist
      });
    }
    
    return value;
  };

  return (
    <Grid container spacing={3} alignItems="stretch">
      {tiles.map((tile, idx) => (
        <Grid size={{ xs: 12, sm: 6, md: md }} key={tile.title + idx}>
          <Box sx={{ color: tile.color, fontWeight: tile.fontWeight, height: '100%' }}>
            <DashboardCard>
              <Box p={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <Box
                  sx={{
                    fontSize: '0.875rem',
                    color: 'text.secondary',
                    mb: 1,
                    fontWeight: 500,
                    minHeight: '1.5rem', // Ensure consistent title height
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {tile.title}
                </Box>
                <Box
                  sx={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    color: tile.color || 'text.primary',
                    minHeight: '2.5rem', // Ensure consistent value height
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {formatValue(tile.value, tile.isCurrency)}
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
