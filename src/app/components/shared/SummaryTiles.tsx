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
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    }
    
    if (typeof value === 'number') {
      // Format percentages
      if (value <= 1 && value > 0) {
        return `${(value * 100).toFixed(2)}%`;
      }
      // Format large numbers with commas
      return value.toLocaleString('id-ID');
    }
    
    return value;
  };

  return (
    <Grid container spacing={3} alignItems="stretch">
      {tiles.map((tile, idx) => (
        <Grid size={{ xs: 12, sm: 6, md: md }} key={tile.title + idx}>
          <Box sx={{ color: tile.color, fontWeight: tile.fontWeight, height: '100%' }}>
            <DashboardCard>
              <Box p={2}>
                <Box
                  sx={{
                    fontSize: '0.875rem',
                    color: 'text.secondary',
                    mb: 1,
                    fontWeight: 500,
                  }}
                >
                  {tile.title}
                </Box>
                <Box
                  sx={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    color: tile.color || 'text.primary',
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
