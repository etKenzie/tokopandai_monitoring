'use client';

import {
    Box,
    Card,
    CardContent,
    CircularProgress,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Typography
} from '@mui/material';
import dynamic from "next/dynamic";
import { useEffect, useState } from 'react';

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface OrderTypeData {
  type_name: string;
  total_orders: number;
  active_stores: number;
  total_invoice: number;
  total_profit: number;
  margin: number;
  avg_order_value: number;
  paid_invoice: number;
  unpaid_invoice: number;
}

interface OrderTypeResponse {
  code: number;
  status: string;
  message: string;
  data: OrderTypeData[];
}

interface OrderTypeChartProps {
  filters: {
    month: string;
    year: string;
    agent: string;
    area: string;
    segment: string;
  };
  goalProfit?: number;
  goalProfitByAgent?: { [agentName: string]: number };
}

const OrderTypeChart = ({ filters, goalProfit = 0, goalProfitByAgent = {} }: OrderTypeChartProps) => {
  const [chartData, setChartData] = useState<OrderTypeData[]>([]);
  const [loading, setLoading] = useState(false);
  const [groupBy, setGroupBy] = useState<string>('agent');
  const [metricType, setMetricType] = useState<string>('goal_profit');

  const groupByOptions = [
    { value: 'area', label: 'Area' },
    { value: 'agent', label: 'Agent' },
    { value: 'segment', label: 'Segment' },
    { value: 'business_type', label: 'Business Type' },
    { value: 'sub_business_type', label: 'Sub Business Type' },
    { value: 'payment_status', label: 'Payment Status' }
  ];

  const metricTypeOptions = [
    { value: 'goal_profit', label: 'Profit' },
    { value: 'invoice_profit', label: 'Invoice & Profit' },
    { value: 'margin', label: 'Margin' },
    { value: 'orders_stores', label: 'Total Orders & Active Stores' },
    { value: 'paid_unpaid', label: 'Paid & Unpaid Invoice' }
  ];

  const fetchChartData = async () => {
    if (!filters.month || !filters.year) {
      console.log('OrderTypeChart: Missing month or year filters', { month: filters.month, year: filters.year });
      return;
    }
    
    setLoading(true);
    try {
      // Format month for API (e.g., "08" -> "August 2025")
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const monthIndex = parseInt(filters.month, 10) - 1;
      const monthName = monthNames[monthIndex];
      const formattedMonth = `${monthName} ${filters.year}`;

      const params = new URLSearchParams({
        month: formattedMonth,
        group_by: groupBy
      });

      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/order/type?${params.toString()}`;
      console.log('OrderTypeChart: Fetching data from:', apiUrl);
      console.log('OrderTypeChart: Filters:', filters);
      console.log('OrderTypeChart: GroupBy:', groupBy);

      const response = await fetch(apiUrl);
      const result: OrderTypeResponse = await response.json();
      
      console.log('OrderTypeChart: API Response:', result);
      
      if (result.code === 200) {
        console.log('OrderTypeChart: Data received:', result.data);
        setChartData(result.data);
      } else {
        console.error('Failed to fetch order type data:', result.message);
        setChartData([]);
      }
    } catch (error) {
      console.error('Failed to fetch order type data:', error);
      setChartData([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when filters or groupBy change
  useEffect(() => {
    fetchChartData();
  }, [filters.month, filters.year, groupBy]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  // Get chart configuration based on metric type
  const getChartConfig = () => {
    switch (metricType) {
      case 'goal_profit':
        // Only show goal profit when grouping by agent
        if (groupBy !== 'agent') {
          // When not grouping by agent, just show total profit
          return {
            yaxis: [
              {
                title: { text: 'Total Profit (IDR)', style: { fontSize: '14px', fontWeight: 600 } },
                labels: { formatter: (value: number) => formatCurrency(value) }
              }
            ],
            tooltip: {
              y: [
                { formatter: (value: number) => formatCurrency(value), title: { formatter: () => 'Total Profit: ' } }
              ]
            },
            colors: ['#10B981'],
            series: [
              { name: 'Total Profit', data: chartData.map(item => item.total_profit) }
            ]
          };
        }
        
        // When grouping by agent, show both goal profit and total profit on same axis
        const goalProfitData = chartData.map(item => goalProfitByAgent[item.type_name] || 0);
        
        return {
          yaxis: [
            {
              title: { text: 'Profit (IDR)', style: { fontSize: '14px', fontWeight: 600 } },
              labels: { formatter: (value: number) => formatCurrency(value) }
            }
          ],
          tooltip: {
            y: [
              { formatter: (value: number) => formatCurrency(value), title: { formatter: () => 'Goal Profit: ' } },
              { formatter: (value: number) => formatCurrency(value), title: { formatter: () => 'Total Profit: ' } }
            ]
          },
          colors: ['#8B5CF6', '#10B981'],
          series: [
            { name: 'Goal Profit', data: goalProfitData },
            { name: 'Total Profit', data: chartData.map(item => item.total_profit) }
          ]
        };
      case 'invoice_profit':
        return {
          yaxis: [
            {
              title: { text: 'Total Invoice (IDR)', style: { fontSize: '14px', fontWeight: 600 } },
              labels: { formatter: (value: number) => formatCurrency(value) }
            },
            {
              opposite: true,
              title: { text: 'Total Profit (IDR)', style: { fontSize: '14px', fontWeight: 600 } },
              labels: { formatter: (value: number) => formatCurrency(value) }
            }
          ],
          tooltip: {
            y: [
              { formatter: (value: number) => formatCurrency(value), title: { formatter: () => 'Total Invoice: ' } },
              { formatter: (value: number) => formatCurrency(value), title: { formatter: () => 'Total Profit: ' } }
            ]
          },
          colors: ['#3B82F6', '#10B981'],
          series: [
            { name: 'Total Invoice', data: chartData.map(item => item.total_invoice) },
            { name: 'Total Profit', data: chartData.map(item => item.total_profit) }
          ]
        };
      case 'margin':
        return {
          yaxis: [
            {
              title: { text: 'Margin (%)', style: { fontSize: '14px', fontWeight: 600 } },
              labels: { formatter: (value: number) => `${value.toFixed(2)}%` }
            }
          ],
          tooltip: {
            y: [
              { formatter: (value: number) => `${value.toFixed(2)}%`, title: { formatter: () => 'Margin: ' } }
            ]
          },
          colors: ['#F59E0B'],
          series: [
            { name: 'Margin', data: chartData.map(item => item.margin) }
          ]
        };
      case 'orders_stores':
        return {
          yaxis: [
            {
              title: { text: 'Total Orders', style: { fontSize: '14px', fontWeight: 600 } },
              labels: { formatter: (value: number) => formatNumber(value) }
            },
            {
              opposite: true,
              title: { text: 'Active Stores', style: { fontSize: '14px', fontWeight: 600 } },
              labels: { formatter: (value: number) => formatNumber(value) }
            }
          ],
          tooltip: {
            y: [
              { formatter: (value: number) => formatNumber(value), title: { formatter: () => 'Total Orders: ' } },
              { formatter: (value: number) => formatNumber(value), title: { formatter: () => 'Active Stores: ' } }
            ]
          },
          colors: ['#F59E0B', '#8B5CF6'],
          series: [
            { name: 'Total Orders', data: chartData.map(item => item.total_orders) },
            { name: 'Active Stores', data: chartData.map(item => item.active_stores) }
          ]
        };
      case 'paid_unpaid':
        return {
          yaxis: [
            {
              title: { text: 'Paid Invoice (IDR)', style: { fontSize: '14px', fontWeight: 600 } },
              labels: { formatter: (value: number) => formatCurrency(value) }
            },
            {
              opposite: true,
              title: { text: 'Unpaid Invoice (IDR)', style: { fontSize: '14px', fontWeight: 600 } },
              labels: { formatter: (value: number) => formatCurrency(value) }
            }
          ],
          tooltip: {
            y: [
              { formatter: (value: number) => formatCurrency(value), title: { formatter: () => 'Paid Invoice: ' } },
              { formatter: (value: number) => formatCurrency(value), title: { formatter: () => 'Unpaid Invoice: ' } }
            ]
          },
          colors: ['#22C55E', '#EF4444'],
          series: [
            { name: 'Paid Invoice', data: chartData.map(item => item.paid_invoice) },
            { name: 'Unpaid Invoice', data: chartData.map(item => item.unpaid_invoice) }
          ]
        };
      default:
        return {
          yaxis: [
            {
              title: { text: 'Total Invoice (IDR)', style: { fontSize: '14px', fontWeight: 600 } },
              labels: { formatter: (value: number) => formatCurrency(value) }
            },
            {
              opposite: true,
              title: { text: 'Total Orders', style: { fontSize: '14px', fontWeight: 600 } },
              labels: { formatter: (value: number) => formatNumber(value) }
            }
          ],
          tooltip: {
            y: [
              { formatter: (value: number) => formatCurrency(value), title: { formatter: () => 'Total Invoice: ' } },
              { formatter: (value: number) => formatNumber(value), title: { formatter: () => 'Total Orders: ' } }
            ]
          },
          colors: ['#3B82F6', '#10B981'],
          series: [
            { name: 'Total Invoice', data: chartData.map(item => item.total_invoice) },
            { name: 'Total Orders', data: chartData.map(item => item.total_orders) }
          ]
        };
    }
  };

  const chartConfig = getChartConfig();

  // Prepare chart data
  const chartOptions = {
    chart: {
      type: 'bar' as const,
      height: 400,
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: false,
          zoom: false,
          zoomin: false,
          zoomout: false,
          pan: false,
          reset: false,
        },
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
        endingShape: 'rounded',
        borderRadius: 4,
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 2,
      colors: ['transparent'],
    },
    xaxis: {
      categories: chartData.map(item => item.type_name),
      labels: {
        style: {
          fontSize: '12px',
        },
        rotate: -45,
        rotateAlways: false,
      },
    },
    yaxis: chartConfig.yaxis,
    tooltip: chartConfig.tooltip,
    colors: chartConfig.colors,
    legend: {
      position: 'top' as const,
      horizontalAlign: 'center' as const,
      fontSize: '14px',
      fontWeight: 600,
    },
    grid: {
      borderColor: '#f1f1f1',
    },
  };

  const series = chartConfig.series;

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Order Distribution by {groupByOptions.find(opt => opt.value === groupBy)?.label}
          </Typography>
          <Box display="flex" justifyContent="center" alignItems="center" height={400}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (!chartData || chartData.length === 0) {
    console.log('OrderTypeChart: No data available', { 
      chartData, 
      chartDataLength: chartData?.length, 
      loading, 
      filters,
      groupBy 
    });
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Order Distribution by {groupByOptions.find(opt => opt.value === groupBy)?.label}
          </Typography>
          <Box display="flex" justifyContent="center" alignItems="center" height={400}>
            <Typography color="textSecondary">
              No data available for {groupByOptions.find(opt => opt.value === groupBy)?.label} in {filters.month}/{filters.year}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">
            Order Distribution by {groupByOptions.find(opt => opt.value === groupBy)?.label}
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Group By</InputLabel>
              <Select
                value={groupBy}
                label="Group By"
                onChange={(e) => setGroupBy(e.target.value)}
              >
                {groupByOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Metrics</InputLabel>
              <Select
                value={metricType}
                label="Metrics"
                onChange={(e) => setMetricType(e.target.value)}
              >
                {metricTypeOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>
        
        <Typography variant="body2" color="textSecondary" mb={3}>
          Distribution of orders by {groupByOptions.find(opt => opt.value === groupBy)?.label.toLowerCase()} showing {metricTypeOptions.find(opt => opt.value === metricType)?.label.toLowerCase()}
        </Typography>
        
        <Box>
          <ReactApexChart
            options={chartOptions}
            series={series}
            type="bar"
            height={400}
          />
        </Box>
        
        <Box mt={3}>
          <Typography variant="subtitle2" gutterBottom>
            Summary:
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Total {groupByOptions.find(opt => opt.value === groupBy)?.label.toLowerCase()} categories: {chartData.length} | 
            Total invoice: {formatCurrency(chartData.reduce((sum, item) => sum + Number(item.total_invoice) || 0, 0))} | 
            Total orders: {formatNumber(chartData.reduce((sum, item) => sum + item.total_orders, 0))} |
            Total active stores: {formatNumber(chartData.reduce((sum, item) => sum + item.active_stores, 0))}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default OrderTypeChart;
