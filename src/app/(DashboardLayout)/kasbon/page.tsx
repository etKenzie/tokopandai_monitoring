'use client';

import { Box, Card, CardContent, Grid, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { fetchKaryawan, Karyawan } from '../../api/kasbon/KasbonSlice';
import PageContainer from '../../components/container/PageContainer';
import KaryawanTable from '../../components/kasbon/KaryawanTable';

const KasbonDashboard = () => {
  const [karyawan, setKaryawan] = useState<Karyawan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchKaryawan();
      setKaryawan(response.results);
      setTotalCount(response.count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <PageContainer title="Kasbon Dashboard" description="Manage kasbon data for employees">
      <Box>
        {/* Header */}
        <Box mb={3}>
          <Typography variant="h3" fontWeight="bold" mb={1}>
            Kasbon Dashboard
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Manage and monitor kasbon data for employees across different clients
          </Typography>
        </Box>

        {/* Statistics Cards */}
        <Box mb={3}>
          <Grid container spacing={3}>
            <Grid
              size={{
                xs: 12,
                md: 3
              }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="textSecondary" gutterBottom>
                    Total Employees
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {totalCount.toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid
              size={{
                xs: 12,
                md: 3
              }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="textSecondary" gutterBottom>
                    Active Employees
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="success.main">
                    {karyawan.filter(k => k.status === '1').length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid
              size={{
                xs: 12,
                md: 3
              }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="textSecondary" gutterBottom>
                    Eligible for Kasbon
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="primary.main">
                    {karyawan.filter(k => k.loan_kasbon_eligible === 1).length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid
              size={{
                xs: 12,
                md: 3
              }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="textSecondary" gutterBottom>
                    Pending Status
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="warning.main">
                    {karyawan.filter(k => k.status === '2').length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* Karyawan Table Component */}
        <KaryawanTable
          karyawan={karyawan}
          title="Employee Data"
          loading={loading}
          onRefresh={fetchData}
        />
      </Box>
    </PageContainer>
  );
};

export default KasbonDashboard;
