'use client';

import { OverdueSnapshotMonthlyResponse, fetchOverdueSnapshotMonthly } from '@/app/api/distribusi/DistribusiSlice';
import { getAgentNameFromRole } from '@/config/roles';
import {
  Box,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Typography
} from '@mui/material';
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from 'react';

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface OverdueSnapshotMonthlyChartProps {
  selectedMonth?: string; // YYYY-MM format
  selectedAgent?: string;
  hasRestrictedRole?: boolean;
  userRoleForFiltering?: string;
}

type ChartType = 'totals' | 'status' | 'status_count';

const OverdueSnapshotMonthlyChart = ({ 
  selectedMonth, 
  selectedAgent,
  hasRestrictedRole = false,
  userRoleForFiltering
}: OverdueSnapshotMonthlyChartProps) => {
  const [chartData, setChartData] = useState<OverdueSnapshotMonthlyResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [chartType, setChartType] = useState<ChartType>('totals');
  const [startMonth, setStartMonth] = useState<string>('');
  const [endMonth, setEndMonth] = useState<string>('');

  // Generate month options (YYYY-MM format, last 12 months)
  const generateMonthOptions = () => {
    const options: string[] = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      options.push(`${year}-${month}`);
    }
    return options.reverse(); // Oldest first
  };

  const monthOptions = generateMonthOptions();

  // Initialize month range - sync with selectedMonth from parent if provided
  useEffect(() => {
    if (selectedMonth) {
      // Use selected month as end month
      setEndMonth(selectedMonth);
      
      // Set start month to 3 months before selected month
      const [year, monthNum] = selectedMonth.split('-');
      const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
      const startDate = new Date(date.getFullYear(), date.getMonth() - 3, 1);
      const startYear = startDate.getFullYear();
      const startMonthNum = String(startDate.getMonth() + 1).padStart(2, '0');
      setStartMonth(`${startYear}-${startMonthNum}`);
    } else {
      // Fallback to current month if no selectedMonth provided
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const currentMonth = `${year}-${month}`;
      
      // Set end month to current month
      setEndMonth(currentMonth);
      
      // Set start month to 3 months ago
      const startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      const startYear = startDate.getFullYear();
      const startMonthNum = String(startDate.getMonth() + 1).padStart(2, '0');
      setStartMonth(`${startYear}-${startMonthNum}`);
    }
  }, [selectedMonth]);

  const fetchChartData = useCallback(async () => {
    if (!startMonth || !endMonth) {
      return;
    }
    
    setLoading(true);
    try {
      // For users with restricted roles, use their mapped agent name instead of filter selection
      const agentName = hasRestrictedRole && userRoleForFiltering 
        ? getAgentNameFromRole(userRoleForFiltering) 
        : (selectedAgent || undefined);
      
      const response = await fetchOverdueSnapshotMonthly({
        start_month: startMonth,
        end_month: endMonth,
        agent: agentName,
      });
      
      setChartData(response);
    } catch (error) {
      console.error('Failed to fetch chart data:', error);
    } finally {
      setLoading(false);
    }
  }, [startMonth, endMonth, selectedAgent, hasRestrictedRole, userRoleForFiltering]);

  // Fetch data when month range or agent filter changes
  useEffect(() => {
    if (startMonth && endMonth) {
      fetchChartData();
    }
  }, [startMonth, endMonth, selectedAgent, hasRestrictedRole, userRoleForFiltering, fetchChartData]);

  const handleChartTypeChange = (event: SelectChangeEvent<ChartType>) => {
    setChartType(event.target.value as ChartType);
  };

  const handleStartMonthChange = (event: SelectChangeEvent<string>) => {
    setStartMonth(event.target.value);
  };

  const handleEndMonthChange = (event: SelectChangeEvent<string>) => {
    setEndMonth(event.target.value);
  };

  const formatMonthDisplay = (month: string) => {
    const [year, monthNum] = month.split('-');
    const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Prepare chart data
  const prepareChartData = () => {
    if (!chartData?.data || !Array.isArray(chartData.data) || chartData.data.length === 0) {
      return { categories: [], series: [] };
    }

    // Sort months chronologically
    const sortedData = chartData.data.sort((a, b) => {
      return a.snapshot_month.localeCompare(b.snapshot_month);
    });
    
    const categories = sortedData.map(item => formatMonthDisplay(item.snapshot_month));
    
    let series: any[] = [];

    if (chartType === 'totals') {
      // Totals view: Total Invoice and Total Count (with dual y-axes)
      series = [
        {
          name: 'Total Invoice',
          data: sortedData.map(item => item.totals.total_invoice || 0)
        },
        {
          name: 'Total Count',
          data: sortedData.map(item => item.totals.total_count || 0),
          yAxisIndex: 1 // Use second y-axis for count
        }
      ];
    } else if (chartType === 'status') {
      // Status breakdown view: Total Invoice for each overdue_status
      // First, collect all unique overdue_statuses across all months
      const statusSet = new Set<string>();
      sortedData.forEach(item => {
        item.breakdown.forEach(b => {
          statusSet.add(b.overdue_status);
        });
      });
      
      const statuses = Array.from(statusSet).sort();
      
      // Create a series for each status
      series = statuses.map(status => {
        return {
          name: status,
          data: sortedData.map(item => {
            const breakdownItem = item.breakdown.find(b => b.overdue_status === status);
            return breakdownItem?.total_invoice || 0;
          })
        };
      });
    } else if (chartType === 'status_count') {
      // Status count breakdown view: Count for each overdue_status
      // First, collect all unique overdue_statuses across all months
      const statusSet = new Set<string>();
      sortedData.forEach(item => {
        item.breakdown.forEach(b => {
          statusSet.add(b.overdue_status);
        });
      });
      
      const statuses = Array.from(statusSet).sort();
      
      // Create a series for each status showing count
      series = statuses.map(status => {
        return {
          name: status,
          data: sortedData.map(item => {
            const breakdownItem = item.breakdown.find(b => b.overdue_status === status);
            return breakdownItem?.count || 0;
          })
        };
      });
    }

    return {
      categories,
      series
    };
  };

  const chartDataConfig = useMemo(() => {
    return prepareChartData();
  }, [chartData, chartType]);

  // Only render chart if we have valid data
  const shouldRenderChart = chartDataConfig.categories.length > 0 && chartDataConfig.series.length > 0;

  const formatValue = (value: number, type: ChartType) => {
    if (type === 'totals') {
      // For totals, check if it's invoice (large number) or count (smaller number)
      // If value > 1000000, it's likely invoice, otherwise count
      if (value > 1000000) {
        return formatCurrency(value);
      }
      return value.toLocaleString('id-ID');
    } else {
      // Status view always shows currency (invoice amounts)
      return formatCurrency(value);
    }
  };

  const chartOptions = {
    chart: {
      type: 'line' as const,
      height: 350,
      toolbar: {
        show: false
      }
    },
    stroke: {
      curve: 'smooth' as const,
      width: 3
    },
    xaxis: {
      categories: chartDataConfig.categories,
      labels: {
        style: {
          fontSize: '12px'
        }
      }
    },
    yaxis: chartType === 'totals' ? [
      {
        title: {
          text: 'Total Invoice',
          style: {
            color: '#000000'
          }
        },
        labels: {
          formatter: function(value: number) {
            return formatCurrency(value);
          },
          style: {
            colors: '#000000'
          }
        }
      },
      {
        opposite: true,
        title: {
          text: 'Total Count',
          style: {
            color: '#000000'
          }
        },
        labels: {
          formatter: function(value: number) {
            return value.toLocaleString('id-ID');
          },
          style: {
            colors: '#000000'
          }
        }
      }
    ] : chartType === 'status_count' ? {
      labels: {
        formatter: function(value: number) {
          return value.toLocaleString('id-ID');
        },
        style: {
          colors: '#000000'
        }
      }
    } : {
      labels: {
        formatter: function(value: number) {
          return formatCurrency(value);
        },
        style: {
          colors: '#000000'
        }
      }
    },
    tooltip: {
      y: {
        formatter: function(value: number, { seriesIndex }: { seriesIndex: number }) {
          if (chartType === 'totals') {
            // First series is Total Invoice, second is Total Count
            if (seriesIndex === 0) {
              return formatCurrency(value);
            } else {
              return value.toLocaleString('id-ID');
            }
          } else if (chartType === 'status_count') {
            return value.toLocaleString('id-ID');
          }
          return formatCurrency(value);
        }
      }
    },
    colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'],
    grid: {
      borderColor: '#E5E7EB',
      strokeDashArray: 4
    },
    markers: {
      size: 6,
      strokeColors: '#FFFFFF',
      strokeWidth: 2
    },
    legend: {
      position: 'bottom' as const,
      horizontalAlign: 'center' as const,
      labels: {
        colors: '#000000',
        useSeriesColors: false
      }
    }
  };

  return (
    <Card>
      <CardContent>
        {/* Controls */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
          <Typography variant="h6" sx={{ margin: 0 }}>
            Overdue Snapshot Monthly Trend
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <FormControl size="small">
              <InputLabel>Chart Type</InputLabel>
              <Select
                value={chartType}
                label="Chart Type"
                onChange={handleChartTypeChange}
              >
                <MenuItem value="totals">Totals (Invoice & Count)</MenuItem>
                <MenuItem value="status">Status Breakdown (Invoice by Status)</MenuItem>
                <MenuItem value="status_count">Status Breakdown (Count by Status)</MenuItem>
              </Select>
            </FormControl>
            
            {/* Start Month */}
            <FormControl size="small">
              <InputLabel>Start Month</InputLabel>
              <Select
                value={startMonth}
                label="Start Month"
                onChange={handleStartMonthChange}
              >
                {monthOptions.map((month) => (
                  <MenuItem key={month} value={month}>
                    {formatMonthDisplay(month)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* End Month */}
            <FormControl size="small">
              <InputLabel>End Month</InputLabel>
              <Select
                value={endMonth}
                label="End Month"
                onChange={handleEndMonthChange}
              >
                {monthOptions.map((month) => (
                  <MenuItem key={month} value={month}>
                    {formatMonthDisplay(month)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>

        {/* Chart */}
        <Box sx={{ height: 400, position: 'relative' }}>
          {loading ? (
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '100%' 
              }}
            >
              <Typography>Loading chart data...</Typography>
            </Box>
          ) : shouldRenderChart ? (
            <ReactApexChart
              key={`${startMonth}-${endMonth}-${chartType}`}
              options={chartOptions}
              series={chartDataConfig.series}
              type="line"
              height={350}
            />
          ) : (
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '100%' 
              }}
            >
              <Typography color="textSecondary">No data available for the selected month range</Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default OverdueSnapshotMonthlyChart;

