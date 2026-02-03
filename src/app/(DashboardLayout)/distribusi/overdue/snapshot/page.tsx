"use client";

import ProtectedRoute from "@/app/components/auth/ProtectedRoute";
import PageContainer from "@/app/components/container/PageContainer";
import { fetchOverdueSnapshot, fetchOrderFilters, OverdueSnapshotResponse, OrderFiltersData } from "@/app/api/distribusi/DistribusiSlice";
import OverdueSnapshotMonthlyChart from "@/app/components/distribusi/OverdueSnapshotMonthlyChart";
import OverdueSnapshotListTable from "@/app/components/distribusi/OverdueSnapshotListTable";
import SummaryTiles from "@/app/components/shared/SummaryTiles";
import { getPageRoles, getRestrictedRoles, getAgentNameFromRole } from "@/config/roles";
import { useAuth } from "@/app/context/AuthContext";
import {
  Box,
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
  Typography,
  Chip
} from "@mui/material";
import { ArrowUpward, ArrowDownward } from "@mui/icons-material";
import { useEffect, useState } from "react";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const OverdueSnapshotPage = () => {
  const { user, roles } = useAuth();
  
  // Get restricted roles from config
  const restrictedRoles = getRestrictedRoles();
  
  // Check if current user has a restricted role
  const hasRestrictedRole = roles.some(role => restrictedRoles.includes(role));
  const userRoleForFiltering = roles.find(role => restrictedRoles.includes(role));
  
  const [snapshotData, setSnapshotData] = useState<OverdueSnapshotResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableFilters, setAvailableFilters] = useState<OrderFiltersData | null>(null);
  const [filtersLoading, setFiltersLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    // Default to current month in YYYY-MM format
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  });

  // Fetch available filters
  useEffect(() => {
    const fetchFilters = async () => {
      setFiltersLoading(true);
      try {
        const [year, monthNum] = selectedMonth.split('-');
        // Convert month number to month name (e.g., "08" -> "August")
        const monthNames = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ];
        const monthName = monthNames[parseInt(monthNum) - 1];
        const formattedMonth = `${monthName} ${year}`;
        
        const response = await fetchOrderFilters({
          month: formattedMonth
        });
        setAvailableFilters(response.data);
      } catch (err) {
        console.error('Failed to fetch filters:', err);
      } finally {
        setFiltersLoading(false);
      }
    };
    
    if (selectedMonth) {
      fetchFilters();
    }
  }, [selectedMonth]);

  useEffect(() => {
    if (selectedMonth) {
      setLoading(true);
      setError(null);
      const fetchData = async () => {
        try {
          // For users with restricted roles, use their mapped agent name instead of filter selection
          const agentName = hasRestrictedRole ? getAgentNameFromRole(userRoleForFiltering!) : (selectedAgent || undefined);
          
          const data = await fetchOverdueSnapshot({ month: selectedMonth, agent: agentName });
          setSnapshotData(data);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to fetch overdue snapshot');
          console.error('Error fetching overdue snapshot:', err);
        } finally {
          setLoading(false);
        }
      };
      
      fetchData();
    }
  }, [selectedMonth, selectedAgent, hasRestrictedRole, userRoleForFiltering]);

  // Generate month options (last 12 months)
  const generateMonthOptions = () => {
    const options: string[] = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      options.push(`${year}-${month}`);
    }
    return options;
  };

  const formatMonthDisplay = (month: string) => {
    const [year, monthNum] = month.split('-');
    const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  const formatPercentage = (percentage: string) => {
    const num = parseFloat(percentage);
    const sign = num >= 0 ? '+' : '';
    return `${sign}${num.toFixed(2)}%`;
  };

  const getChangeColor = (change: number | string) => {
    const num = typeof change === 'string' ? parseFloat(change) : change;
    if (num > 0) return 'error'; // Red for increase (bad for overdue)
    if (num < 0) return 'info'; // Blue for decrease (good for overdue)
    return 'default';
  };

  // Prepare summary tiles data similar to sales overview
  const getSummaryTiles = () => {
    if (!snapshotData) return [];

    return [
      {
        title: 'Total Invoice',
        value: snapshotData.data.totals.total_invoice,
        isCurrency: true,
        mdSize: 4,
        isLoading: loading && !snapshotData,
        changeIndicator: snapshotData.data.totals.invoice_change_percentage ? {
          value: parseFloat(snapshotData.data.totals.invoice_change_percentage),
          isPercentage: true
        } : undefined
      },
      {
        title: 'Total Count',
        value: snapshotData.data.totals.total_count,
        isCurrency: false,
        mdSize: 4,
        isLoading: loading && !snapshotData,
        changeIndicator: snapshotData.data.totals.count_change !== undefined ? {
          value: snapshotData.data.totals.count_change,
          isPercentage: false
        } : undefined
      },
      {
        title: 'Total Profit',
        value: snapshotData.data.totals.total_profit,
        isCurrency: true,
        mdSize: 4,
        isLoading: loading && !snapshotData,
        changeIndicator: snapshotData.data.totals.profit_change_percentage ? {
          value: parseFloat(snapshotData.data.totals.profit_change_percentage),
          isPercentage: true
        } : undefined
      }
    ];
  };

  const ChangeIndicator = ({ change, isPercentage = false, isCurrency = false }: { change: number | string; isPercentage?: boolean; isCurrency?: boolean }) => {
    const num = typeof change === 'string' ? parseFloat(change) : change;
    const isPositive = num > 0;
    let displayValue: string;
    
    if (isPercentage) {
      displayValue = formatPercentage(change.toString());
    } else if (isCurrency) {
      displayValue = `${isPositive ? '+' : ''}${formatCurrency(Math.abs(num))}`;
    } else {
      displayValue = `${isPositive ? '+' : ''}${num.toLocaleString()}`;
    }
    
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
        {isPositive ? (
          <ArrowUpward sx={{ fontSize: 16, color: 'error.main' }} />
        ) : num < 0 ? (
          <ArrowDownward sx={{ fontSize: 16, color: 'info.main' }} />
        ) : null}
        <Typography 
          variant="caption" 
          sx={{ 
            color: getChangeColor(change) === 'error' ? 'error.main' : 
                   getChangeColor(change) === 'info' ? 'info.main' : 'text.secondary',
            fontWeight: 600
          }}
        >
          {displayValue}
        </Typography>
      </Box>
    );
  };

  return (
    <PageContainer title="Overdue" description="View overdue by month">
      <Box>
        {/* Header */}
        <Box mb={3}>
          <Typography variant="h3" fontWeight="bold" mb={1}>
            Overdue
          </Typography>
          <Typography variant="body1" color="textSecondary">
            View monthly snapshot of overdue orders with totals and breakdown by overdue status.
          </Typography>
          {hasRestrictedRole && (
            <Typography variant="body2" color="info.main" sx={{ mt: 1, fontStyle: 'italic' }}>
              Showing data for {getAgentNameFromRole(userRoleForFiltering!)} only
            </Typography>
          )}
        </Box>

        {/* Filters */}
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Select Month</InputLabel>
                <Select
                  value={selectedMonth}
                  label="Select Month"
                  onChange={(e) => setSelectedMonth(e.target.value)}
                >
                  {generateMonthOptions().map((month) => (
                    <MenuItem key={month} value={month}>
                      {formatMonthDisplay(month)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            {/* Agent Filter */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Agent</InputLabel>
                <Select
                  value={selectedAgent}
                  label="Agent"
                  onChange={(e) => setSelectedAgent(e.target.value)}
                  disabled={filtersLoading || hasRestrictedRole}
                >
                  <MenuItem value="">All Agents</MenuItem>
                  {availableFilters?.agents.map((agent) => (
                    <MenuItem key={agent} value={agent}>
                      {agent}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>

        {/* Loading State */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
            <CircularProgress />
          </Box>
        )}

        {/* Error State */}
        {error && (
          <Box sx={{ p: 3, bgcolor: 'error.light', borderRadius: 2, mb: 3 }}>
            <Typography color="error.dark" fontWeight="bold">
              Error: {error}
            </Typography>
          </Box>
        )}

        {/* Data Display */}
        {!loading && !error && snapshotData && (
          <>
            {/* Summary Tiles */}
            <Box mb={4}>
              <SummaryTiles tiles={getSummaryTiles()} />
            </Box>

            {/* Monthly Trend Charts */}
            <Box sx={{ mb: 5 }}>
              <OverdueSnapshotMonthlyChart 
                selectedMonth={selectedMonth}
                selectedAgent={selectedAgent}
                hasRestrictedRole={hasRestrictedRole}
                userRoleForFiltering={userRoleForFiltering}
              />
            </Box>

            {/* Breakdown Table */}
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.100' }}>
                    <TableCell><strong>Overdue Status</strong></TableCell>
                    <TableCell><strong>Count</strong></TableCell>
                    <TableCell align="right"><strong>Total Invoice</strong></TableCell>
                    <TableCell align="right"><strong>Total Profit</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {snapshotData.data.breakdown.map((item, index) => (
                    <TableRow key={index} hover>
                      <TableCell>
                        <Typography variant="body1" fontWeight="medium">
                          {item.overdue_status}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1">
                            {item.count.toLocaleString()}
                          </Typography>
                          {item.count_change !== undefined && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              {item.count_change > 0 ? (
                                <ArrowUpward sx={{ fontSize: 14, color: 'error.main' }} />
                              ) : item.count_change < 0 ? (
                                <ArrowDownward sx={{ fontSize: 14, color: 'success.main' }} />
                              ) : null}
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  color: item.count_change > 0 ? 'error.main' : 
                                         item.count_change < 0 ? 'success.main' : 'text.secondary',
                                  fontWeight: 600
                                }}
                              >
                                {item.count_change > 0 ? '+' : ''}{item.count_change.toLocaleString()}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                          <Typography variant="body1" fontWeight="medium">
                            {formatCurrency(item.total_invoice)}
                          </Typography>
                          {item.invoice_change_percentage !== undefined && item.invoice_change_percentage !== null && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'flex-end' }}>
                              {Number(item.invoice_change_percentage) > 0 ? (
                                <ArrowUpward sx={{ fontSize: 14, color: 'error.main' }} />
                              ) : Number(item.invoice_change_percentage) < 0 ? (
                                <ArrowDownward sx={{ fontSize: 14, color: 'success.main' }} />
                              ) : null}
                              <Typography
                                variant="caption"
                                sx={{
                                  color: Number(item.invoice_change_percentage) > 0 ? 'error.main' :
                                         Number(item.invoice_change_percentage) < 0 ? 'success.main' : 'text.secondary',
                                  fontWeight: 600
                                }}
                              >
                                {Number(item.invoice_change_percentage) > 0 ? '+' : ''}{item.invoice_change_percentage}%
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body1">
                          {formatCurrency(item.total_profit)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Total Row */}
                  <TableRow sx={{ bgcolor: 'grey.50', fontWeight: 'bold' }}>
                    <TableCell>
                      <Typography variant="body1" fontWeight="bold">
                        TOTAL
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body1" fontWeight="bold">
                        {snapshotData.data.totals.total_count.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body1" fontWeight="bold">
                        {formatCurrency(snapshotData.data.totals.total_invoice)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body1" fontWeight="bold">
                        {formatCurrency(snapshotData.data.totals.total_profit)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>

            {/* Overdue Snapshot List Table */}
            <OverdueSnapshotListTable
              selectedMonth={selectedMonth}
              selectedAgent={selectedAgent}
              hasRestrictedRole={hasRestrictedRole}
              userRoleForFiltering={userRoleForFiltering}
            />
          </>
        )}
      </Box>
    </PageContainer>
  );
};

export default function ProtectedOverdueSnapshotPage() {
  return (
    <ProtectedRoute requiredRoles={getPageRoles('DISTRIBUSI_DASHBOARD')}>
      <OverdueSnapshotPage />
    </ProtectedRoute>
  );
}

