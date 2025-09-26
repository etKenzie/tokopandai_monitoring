"use client";

import ProtectedRoute from "@/app/components/auth/ProtectedRoute";
import PageContainer from "@/app/components/container/PageContainer";
import { useAuth } from "@/app/context/AuthContext";
import { useCheckRoles } from "@/app/hooks/useCheckRoles";
import { getAgentNameFromRole, getPageRoles, getRestrictedRoles } from "@/config/roles";
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  CircularProgress, 
  FormControl, 
  Grid, 
  InputLabel, 
  MenuItem, 
  Paper, 
  Select, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Typography 
} from "@mui/material";
import React, { useState, useEffect, useCallback } from "react";
import { fetchCompareData, CompareData } from "@/app/api/distribusi/DistribusiSlice";

const ComparePage = () => {
  const { user, roles, refreshRoles } = useAuth();
  
  // Check access for allowed roles (configurable via roles config)
  const accessCheck = useCheckRoles(getPageRoles('DISTRIBUSI_DASHBOARD'));
  
  // Get restricted roles from config
  const restrictedRoles = getRestrictedRoles();
  
  // Check if current user has a restricted role
  const hasRestrictedRole = roles.some(role => restrictedRoles.includes(role));
  const userRoleForFiltering = roles.find(role => restrictedRoles.includes(role));
  
  // Log access check result for debugging
  console.log('Compare Access Check:', accessCheck);
  console.log('User roles:', roles);
  console.log('Has restricted role:', hasRestrictedRole);
  console.log('User role for filtering:', userRoleForFiltering);

  // Initialize filters with empty values to avoid hydration mismatch
  const [filters, setFilters] = useState({
    month1: '',
    month2: '',
    agent: ''
  });

  const [compareData1, setCompareData1] = useState<CompareData | null>(null);
  const [compareData2, setCompareData2] = useState<CompareData | null>(null);
  const [loading1, setLoading1] = useState(false);
  const [loading2, setLoading2] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set initial date values in useEffect to avoid hydration issues
  useEffect(() => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    
    // Set current month as month1, previous month as month2
    const currentMonth = currentDate.getMonth() + 1;
    const prevMonth = currentDate.getMonth() === 0 ? 12 : currentDate.getMonth();
    const prevYear = currentDate.getMonth() === 0 ? currentDate.getFullYear() - 1 : currentDate.getFullYear();
    
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    setFilters(prev => ({
      ...prev,
      month1: `${monthNames[currentMonth - 1]} ${currentYear}`,
      month2: `${monthNames[prevMonth - 1]} ${prevYear}`
    }));
  }, []);

  const fetchCompareDataCallback = useCallback(async (month: string, isFirstMonth: boolean) => {
    if (!month) return;
    
    const loadingState = isFirstMonth ? setLoading1 : setLoading2;
    const setDataState = isFirstMonth ? setCompareData1 : setCompareData2;
    
    loadingState(true);
    setError(null);
    
    try {
      // Month is already in "September 2025" format, so use it directly
      const formattedMonth = month;
      
      // For users with restricted roles, use their mapped agent name instead of filter selection
      const agentName = hasRestrictedRole ? getAgentNameFromRole(userRoleForFiltering!) : (filters.agent || undefined);
      
      const response = await fetchCompareData({
        month: formattedMonth,
        agent_name: agentName
      });
      
      console.log(`Compare data response for ${formattedMonth}:`, response);
      setDataState(response.data);
    } catch (err) {
      console.error(`Failed to fetch compare data for month ${month}:`, err);
      setDataState(null);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      loadingState(false);
    }
  }, [hasRestrictedRole, userRoleForFiltering, filters.agent]);

  const handleCompare = () => {
    if (filters.month1 && filters.month2) {
      fetchCompareDataCallback(filters.month1, true);
      fetchCompareDataCallback(filters.month2, false);
    }
  };

  // Auto-fetch when both months are selected
  useEffect(() => {
    if (filters.month1 && filters.month2) {
      handleCompare();
    }
  }, [filters.month1, filters.month2, filters.agent]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const getMonthName = (month: string) => {
    if (!month) return '';
    // Month is already in "September 2025" format, so return it directly
    return month;
  };

  const getChangeIndicator = (value1: number, value2: number) => {
    if (value1 === 0 && value2 === 0) return { color: 'default', symbol: '=' };
    if (value1 > value2) return { color: 'success', symbol: '↗' };
    if (value1 < value2) return { color: 'error', symbol: '↘' };
    return { color: 'default', symbol: '=' };
  };

  const getChangePercentage = (value1: number, value2: number) => {
    if (value2 === 0) return value1 > 0 ? '100%' : '0%';
    return `${((value1 - value2) / value2 * 100).toFixed(1)}%`;
  };

  return (
    <PageContainer title="Compare Months" description="Compare sales data between two months">
      <Box>
        {/* Header */}
        <Box mb={3}>
          <Typography variant="h3" fontWeight="bold" mb={1}>
            Month Comparison
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Compare sales performance between two months
          </Typography>
          {hasRestrictedRole && (
            <Typography variant="body2" color="info.main" sx={{ mt: 1, fontStyle: 'italic' }}>
              Showing data for {getAgentNameFromRole(userRoleForFiltering!)} only
            </Typography>
          )}
        </Box>

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" mb={2}>
              Select Months to Compare
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Month 1</InputLabel>
                  <Select
                    value={filters.month1}
                    label="Month 1"
                    onChange={(e) => setFilters(prev => ({ ...prev, month1: e.target.value }))}
                  >
                    {(() => {
                      const options = [];
                      const currentDate = new Date();
                      const currentYear = currentDate.getFullYear();
                      const monthNames = [
                        'January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'
                      ];
                      
                      // Generate options for current year and previous year
                      for (let year = currentYear; year >= currentYear - 1; year--) {
                        for (let month = 0; month < 12; month++) {
                          const value = `${monthNames[month]} ${year}`;
                          options.push(
                            <MenuItem key={value} value={value}>
                              {value}
                            </MenuItem>
                          );
                        }
                      }
                      return options;
                    })()}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Month 2</InputLabel>
                  <Select
                    value={filters.month2}
                    label="Month 2"
                    onChange={(e) => setFilters(prev => ({ ...prev, month2: e.target.value }))}
                  >
                    {(() => {
                      const options = [];
                      const currentDate = new Date();
                      const currentYear = currentDate.getFullYear();
                      const monthNames = [
                        'January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'
                      ];
                      
                      // Generate options for current year and previous year
                      for (let year = currentYear; year >= currentYear - 1; year--) {
                        for (let month = 0; month < 12; month++) {
                          const value = `${monthNames[month]} ${year}`;
                          options.push(
                            <MenuItem key={value} value={value}>
                              {value}
                            </MenuItem>
                          );
                        }
                      }
                      return options;
                    })()}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Agent</InputLabel>
                  <Select
                    value={filters.agent}
                    label="Agent"
                    onChange={(e) => setFilters(prev => ({ ...prev, agent: e.target.value }))}
                    disabled={hasRestrictedRole}
                  >
                    <MenuItem value="">All Agents</MenuItem>
                    <MenuItem value="Oki irawan">Oki irawan</MenuItem>
                    <MenuItem value="Rully">Rully</MenuItem>
                    <MenuItem value="Rifqi">Rifqi</MenuItem>
                    <MenuItem value="Mardi">Mardi</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Button
                  variant="contained"
                  onClick={handleCompare}
                  disabled={!filters.month1 || !filters.month2 || loading1 || loading2}
                  fullWidth
                >
                  Compare
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Comparison Table */}
        {error && (
          <Box display="flex" justifyContent="center" alignItems="center" height="200px">
            <Typography variant="body1" color="error">
              {error}
            </Typography>
          </Box>
        )}

        {!error && (compareData1 || compareData2) && (
          <Card>
            <CardContent>
              <Typography variant="h6" mb={2}>
                Comparison Results
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Metric</strong></TableCell>
                      <TableCell align="center">
                        <strong>{getMonthName(filters.month1)}</strong>
                        {loading1 && <CircularProgress size={16} sx={{ ml: 1 }} />}
                      </TableCell>
                      <TableCell align="center">
                        <strong>{getMonthName(filters.month2)}</strong>
                        {loading2 && <CircularProgress size={16} sx={{ ml: 1 }} />}
                      </TableCell>
                      <TableCell align="center"><strong>Change</strong></TableCell>
                      <TableCell align="center"><strong>% Change</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {/* Weekly Breakdown */}
                    {[1, 2, 3, 4, 5].map((week) => {
                      const weekKey = `W${week}` as keyof CompareData;
                      const totalInvoice1 = compareData1?.[`${weekKey}_total_invoice` as keyof CompareData] as number || 0;
                      const totalInvoice2 = compareData2?.[`${weekKey}_total_invoice` as keyof CompareData] as number || 0;
                      const totalProfit1 = compareData1?.[`${weekKey}_total_profit` as keyof CompareData] as number || 0;
                      const totalProfit2 = compareData2?.[`${weekKey}_total_profit` as keyof CompareData] as number || 0;
                      const margin1 = compareData1?.[`${weekKey}_margin` as keyof CompareData] as number || 0;
                      const margin2 = compareData2?.[`${weekKey}_margin` as keyof CompareData] as number || 0;
                      
                      return (
                        <React.Fragment key={week}>
                          {/* Week Header */}
                          <TableRow sx={{ backgroundColor: 'primary.50' }}>
                            <TableCell colSpan={5}>
                              <Typography variant="subtitle1" fontWeight="bold" color="primary">
                                Week {week}
                              </Typography>
                            </TableCell>
                          </TableRow>
                          
                          {/* Total Invoice */}
                          <TableRow>
                            <TableCell sx={{ pl: 4 }}>Total Invoice</TableCell>
                            <TableCell align="right">{formatCurrency(totalInvoice1)}</TableCell>
                            <TableCell align="right">{formatCurrency(totalInvoice2)}</TableCell>
                            <TableCell align="center" sx={{ color: `${getChangeIndicator(totalInvoice1, totalInvoice2).color}.main` }}>
                              {getChangeIndicator(totalInvoice1, totalInvoice2).symbol}
                            </TableCell>
                            <TableCell align="center" sx={{ color: `${getChangeIndicator(totalInvoice1, totalInvoice2).color}.main` }}>
                              {getChangePercentage(totalInvoice1, totalInvoice2)}
                            </TableCell>
                          </TableRow>
                          
                          {/* Total Profit */}
                          <TableRow>
                            <TableCell sx={{ pl: 4 }}>Total Profit</TableCell>
                            <TableCell align="right">{formatCurrency(totalProfit1)}</TableCell>
                            <TableCell align="right">{formatCurrency(totalProfit2)}</TableCell>
                            <TableCell align="center" sx={{ color: `${getChangeIndicator(totalProfit1, totalProfit2).color}.main` }}>
                              {getChangeIndicator(totalProfit1, totalProfit2).symbol}
                            </TableCell>
                            <TableCell align="center" sx={{ color: `${getChangeIndicator(totalProfit1, totalProfit2).color}.main` }}>
                              {getChangePercentage(totalProfit1, totalProfit2)}
                            </TableCell>
                          </TableRow>
                          
                          {/* Margin */}
                          <TableRow>
                            <TableCell sx={{ pl: 4 }}>Margin</TableCell>
                            <TableCell align="right">{formatPercentage(margin1)}</TableCell>
                            <TableCell align="right">{formatPercentage(margin2)}</TableCell>
                            <TableCell align="center" sx={{ color: `${getChangeIndicator(margin1, margin2).color}.main` }}>
                              {getChangeIndicator(margin1, margin2).symbol}
                            </TableCell>
                            <TableCell align="center" sx={{ color: `${getChangeIndicator(margin1, margin2).color}.main` }}>
                              {getChangePercentage(margin1, margin2)}
                            </TableCell>
                          </TableRow>
                        </React.Fragment>
                      );
                    })}
                    
                    {/* Total Invoice */}
                    <TableRow sx={{ backgroundColor: 'grey.50' }}>
                      <TableCell><strong>Total Invoice</strong></TableCell>
                      <TableCell align="right">
                        <strong>{formatCurrency(compareData1?.total_invoice || 0)}</strong>
                      </TableCell>
                      <TableCell align="right">
                        <strong>{formatCurrency(compareData2?.total_invoice || 0)}</strong>
                      </TableCell>
                      <TableCell align="center" sx={{ color: `${getChangeIndicator(compareData1?.total_invoice || 0, compareData2?.total_invoice || 0).color}.main` }}>
                        {getChangeIndicator(compareData1?.total_invoice || 0, compareData2?.total_invoice || 0).symbol}
                      </TableCell>
                      <TableCell align="center" sx={{ color: `${getChangeIndicator(compareData1?.total_invoice || 0, compareData2?.total_invoice || 0).color}.main` }}>
                        {getChangePercentage(compareData1?.total_invoice || 0, compareData2?.total_invoice || 0)}
                      </TableCell>
                    </TableRow>

                    {/* Total Profit */}
                    <TableRow sx={{ backgroundColor: 'grey.50' }}>
                      <TableCell><strong>Total Profit</strong></TableCell>
                      <TableCell align="right">
                        <strong>{formatCurrency(compareData1?.total_profit || 0)}</strong>
                      </TableCell>
                      <TableCell align="right">
                        <strong>{formatCurrency(compareData2?.total_profit || 0)}</strong>
                      </TableCell>
                      <TableCell align="center" sx={{ color: `${getChangeIndicator(compareData1?.total_profit || 0, compareData2?.total_profit || 0).color}.main` }}>
                        {getChangeIndicator(compareData1?.total_profit || 0, compareData2?.total_profit || 0).symbol}
                      </TableCell>
                      <TableCell align="center" sx={{ color: `${getChangeIndicator(compareData1?.total_profit || 0, compareData2?.total_profit || 0).color}.main` }}>
                        {getChangePercentage(compareData1?.total_profit || 0, compareData2?.total_profit || 0)}
                      </TableCell>
                    </TableRow>

                    {/* Invoice Count */}
                    <TableRow>
                      <TableCell><strong>Invoice Count</strong></TableCell>
                      <TableCell align="right">{compareData1?.total_invoice_count || 0}</TableCell>
                      <TableCell align="right">{compareData2?.total_invoice_count || 0}</TableCell>
                      <TableCell align="center" sx={{ color: `${getChangeIndicator(compareData1?.total_invoice_count || 0, compareData2?.total_invoice_count || 0).color}.main` }}>
                        {getChangeIndicator(compareData1?.total_invoice_count || 0, compareData2?.total_invoice_count || 0).symbol}
                      </TableCell>
                      <TableCell align="center" sx={{ color: `${getChangeIndicator(compareData1?.total_invoice_count || 0, compareData2?.total_invoice_count || 0).color}.main` }}>
                        {getChangePercentage(compareData1?.total_invoice_count || 0, compareData2?.total_invoice_count || 0)}
                      </TableCell>
                    </TableRow>

                    {/* Margin */}
                    <TableRow sx={{ backgroundColor: 'grey.50' }}>
                      <TableCell><strong>Margin</strong></TableCell>
                      <TableCell align="right">
                        <strong>{formatPercentage(compareData1?.total_margin || 0)}</strong>
                      </TableCell>
                      <TableCell align="right">
                        <strong>{formatPercentage(compareData2?.total_margin || 0)}</strong>
                      </TableCell>
                      <TableCell align="center" sx={{ color: `${getChangeIndicator(compareData1?.total_margin || 0, compareData2?.total_margin || 0).color}.main` }}>
                        {getChangeIndicator(compareData1?.total_margin || 0, compareData2?.total_margin || 0).symbol}
                      </TableCell>
                      <TableCell align="center" sx={{ color: `${getChangeIndicator(compareData1?.total_margin || 0, compareData2?.total_margin || 0).color}.main` }}>
                        {getChangePercentage(compareData1?.total_margin || 0, compareData2?.total_margin || 0)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        )}
      </Box>
    </PageContainer>
  );
};

export default function ProtectedComparePage() {
  return (
    <ProtectedRoute requiredRoles={getPageRoles('DISTRIBUSI_DASHBOARD')}>
      <ComparePage />
    </ProtectedRoute>
  );
}
