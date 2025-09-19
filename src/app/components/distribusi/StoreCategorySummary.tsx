'use client';

import { Store } from '@/app/api/distribusi/StoreSlice';
import {
    Box,
    Card,
    CardContent,
    Chip,
    Grid,
    Typography
} from '@mui/material';

interface StoreCategorySummaryProps {
  stores: Store[];
}

const StoreCategorySummary = ({ stores }: StoreCategorySummaryProps) => {
  const getCategory = (finalScore: number) => {
    if (finalScore >= 75) return 'A';
    if (finalScore >= 50) return 'B';
    if (finalScore >= 25) return 'C';
    return 'D';
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'A': return 'success';
      case 'B': return 'info';
      case 'C': return 'warning';
      case 'D': return 'error';
      default: return 'default';
    }
  };

  const getCategoryCount = (category: string) => {
    return stores.filter(store => getCategory(store.final_score) === category).length;
  };

  const getCategoryPercentage = (category: string) => {
    const count = getCategoryCount(category);
    const total = stores.length;
    return total > 0 ? Math.round((count / total) * 100) : 0;
  };

  const categories = ['A', 'B', 'C', 'D'];
  const categoryLabels = {
    'A': 'A (75-100)',
    'B': 'B (50-74)', 
    'C': 'C (25-49)',
    'D': 'D (0-24)'
  };

  return (
    <Box mb={3}>
      <Typography variant="h6" gutterBottom>
        Store Categories
      </Typography>
      <Grid container spacing={2}>
        {categories.map((category) => {
          const count = getCategoryCount(category);
          const percentage = getCategoryPercentage(category);
          
          return (
            <Grid key={category} size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Box sx={{ mb: 1 }}>
                    <Chip
                      label={category}
                      color={getCategoryColor(category) as any}
                      size="large"
                      sx={{ fontSize: '1.2rem', fontWeight: 'bold', minWidth: '50px' }}
                    />
                  </Box>
                  <Typography variant="h4" fontWeight="bold" color="primary">
                    {count}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {categoryLabels[category as keyof typeof categoryLabels]}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {percentage}% of total
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default StoreCategorySummary;
