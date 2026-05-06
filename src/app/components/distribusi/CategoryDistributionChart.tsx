'use client';

import { fetchProductCategory, ProductCategoryMonthlyResponse } from '@/app/api/distribusi/DistribusiSlice';
import {
    Box,
    Card,
    CardContent,
    CircularProgress,
    FormControl,
    FormControlLabel,
    InputLabel,
    MenuItem,
    Select,
    SelectChangeEvent,
    Switch,
    Typography
} from '@mui/material';
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from 'react';

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface CategoryDistributionChartProps {
  filters: {
    agent: string;
    area: string;
    segment?: string;
    month?: string;
    year?: string;
  };
}

type CategoryMonthlyMatrix = Record<string, Record<string, { total_invoice: number; total_profit: number; margin?: number }>>;

const CategoryDistributionChart = ({ filters }: CategoryDistributionChartProps) => {
  const [chartData, setChartData] = useState<ProductCategoryMonthlyResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [startMonthYear, setStartMonthYear] = useState<string>('');
  const [endMonthYear, setEndMonthYear] = useState<string>('');
  const [isManuallySet, setIsManuallySet] = useState(false);
  const [showMargin, setShowMargin] = useState(false);

  // Generate month-year options (current month - 12 months back)
  const generateMonthYearOptions = () => {
    const options = [];
    const currentDate = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthName = date.toLocaleString('en-US', { month: 'long' });
      const year = date.getFullYear();
      const value = `${monthName} ${year}`;
      options.push({ value, label: value });
    }
    
    // Reverse the array so oldest months appear first (top) and newest months appear last (bottom)
    return options.reverse();
  };

  const monthYearOptions = generateMonthYearOptions();

  // Initialize month range in useEffect to avoid hydration issues
  useEffect(() => {
    updateMonthRange();
  }, []);

  // Update month range when filters change
  useEffect(() => {
    console.log('Filters changed, updating month range:', filters);
    // Reset manual mode when page filters change (month, year, agent, area, segment)
    if (filters.month || filters.year || filters.agent || filters.area || filters.segment) {
      console.log('Page filters changed, resetting to automatic mode');
      setIsManuallySet(false);
    }
    updateMonthRange();
  }, [filters.month, filters.year, filters.agent, filters.area, filters.segment]);

  const updateMonthRange = () => {
    console.log('Updating month range with filters:', filters);
    
    if (filters.month && filters.year) {
      // Use the selected month and year from filters
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const monthName = monthNames[parseInt(filters.month) - 1];
      const selectedMonthYear = `${monthName} ${filters.year}`;
      
      console.log('Selected month year:', selectedMonthYear);
      
      // End month: the selected month
      setEndMonthYear(selectedMonthYear);
      
      // Start month: 3 months before the selected month
      let startYearNum = parseInt(filters.year);
      let startMonthNum = parseInt(filters.month) - 3;
      
      if (startMonthNum < 1) {
        startYearNum = startYearNum - 1;
        startMonthNum = 12 + startMonthNum; // Convert negative to positive month
      }
      
      const startMonthName = monthNames[startMonthNum - 1];
      const startMonthYear = `${startMonthName} ${startYearNum}`;
      
      console.log('Calculated start month year:', startMonthYear);
      
      setStartMonthYear(startMonthYear);
    } else {
      // Fallback to current month logic
      const currentDate = new Date();
      const currentMonth = currentDate.toLocaleString('en-US', { month: 'long' });
      const currentYear = currentDate.getFullYear();
      const currentMonthYear = `${currentMonth} ${currentYear}`;
      
      console.log('Using current month year:', currentMonthYear);
      
      setEndMonthYear(currentMonthYear);
      
      // Start month: 3 months before current month
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 3, 1);
      const startMonth = startDate.toLocaleString('en-US', { month: 'long' });
      const startYear = startDate.getFullYear();
      const startMonthYear = `${startMonth} ${startYear}`;
      
      console.log('Using calculated start month year:', startMonthYear);
      
      setStartMonthYear(startMonthYear);
    }
  };

  const fetchChartData = useCallback(async () => {
    if (!startMonthYear || !endMonthYear) {
      console.log('Missing month/year values:', { startMonthYear, endMonthYear });
      return;
    }
    
    console.log('Fetching chart data for range:', { startMonthYear, endMonthYear });
    setLoading(true);
    try {
      console.log('API call parameters:', {
        start_month: startMonthYear,
        end_month: endMonthYear,
        agent_name: filters.agent,
        area: filters.area,
        segment: filters.segment
      });

      const response = await fetchProductCategory({
        start_month: startMonthYear,
        end_month: endMonthYear,
        agent_name: filters.agent || undefined,
        area: filters.area || undefined,
        segment: filters.segment || undefined,
      });
      
      console.log('Chart data response:', response);
      setChartData(response);
    } catch (error) {
      console.error('Failed to fetch chart data:', error);
    } finally {
      setLoading(false);
    }
  }, [startMonthYear, endMonthYear, filters.agent, filters.area, filters.segment]);

  // Fetch data when month range changes
  useEffect(() => {
    if (startMonthYear && endMonthYear) {
      console.log('Month range changed, fetching new data:', { startMonthYear, endMonthYear });
      fetchChartData();
    }
  }, [startMonthYear, endMonthYear]);

  // Separate effect for filter changes that should trigger month range updates
  useEffect(() => {
    if (filters.agent || filters.area || filters.segment) {
      console.log('Filter changed, re-fetching data');
      fetchChartData();
    }
  }, [filters.agent, filters.area, filters.segment]);

  const handleCategoryChange = (event: SelectChangeEvent<string>) => {
    setSelectedCategory(event.target.value);
  };

  const handleStartMonthYearChange = (event: SelectChangeEvent<string>) => {
    console.log('Start month changed to:', event.target.value);
    setStartMonthYear(event.target.value);
    setIsManuallySet(true);
  };

  const handleEndMonthYearChange = (event: SelectChangeEvent<string>) => {
    console.log('End month changed to:', event.target.value);
    setEndMonthYear(event.target.value);
    setIsManuallySet(true);
  };

  const toSafeNumber = (value: unknown): number => {
    const num = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(num) ? num : 0;
  };

  const formatValue = (value: unknown) => {
    const safeValue = toSafeNumber(value);
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(safeValue);
  };
  const formatCompactNumber = (value: unknown) =>
    new Intl.NumberFormat('id-ID', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(toSafeNumber(value));
  const formatPercent = (value: unknown) => `${toSafeNumber(value).toFixed(2)}%`;

  const resolvedCategoryMatrix = useMemo<CategoryMonthlyMatrix>(() => {
    const payload = chartData?.data as unknown;
    if (!payload || typeof payload !== 'object') return {};

    // Support both API shapes:
    // 1) { data: { "Month Year": { "Category": {...} } } }
    // 2) { data: { data: { "Month Year": { "Category": {...} } } } }
    if ('data' in (payload as Record<string, unknown>)) {
      const nested = (payload as { data?: unknown }).data;
      if (nested && typeof nested === 'object') {
        return nested as CategoryMonthlyMatrix;
      }
    }

    return payload as CategoryMonthlyMatrix;
  }, [chartData]);

  // Get all available categories from the data
  const availableCategories = useMemo(() => {
    if (!resolvedCategoryMatrix || typeof resolvedCategoryMatrix !== 'object') {
      return [];
    }

    const allCategories = new Set<string>();
    const months = Object.keys(resolvedCategoryMatrix);
    
    months.forEach(month => {
      const monthData = resolvedCategoryMatrix[month];
      if (monthData) {
        Object.keys(monthData).forEach(category => allCategories.add(category));
      }
    });
    
    return Array.from(allCategories).sort();
  }, [resolvedCategoryMatrix]);

  // Set default category when data is loaded
  useEffect(() => {
    if (availableCategories.length === 0) {
      setSelectedCategory('');
      return;
    }

    // Keep selected category valid across filter/month changes.
    if (!selectedCategory || !availableCategories.includes(selectedCategory)) {
      setSelectedCategory(availableCategories[0]);
    }
  }, [availableCategories, selectedCategory]);

  // Prepare chart data with proper validation
  const prepareChartData = () => {
    if (!resolvedCategoryMatrix || !selectedCategory) {
      console.log('No chart data available or no category selected:', { chartData, selectedCategory });
      return { categories: [], series: [] };
    }

    console.log('Processing chart data for category:', selectedCategory);

    // Convert the nested object structure to arrays
    const months = Object.keys(resolvedCategoryMatrix).sort((a, b) => {
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      
      const [monthA, yearA] = a.split(' ');
      const [monthB, yearB] = b.split(' ');
      
      if (!monthA || !yearA || !monthB || !yearB) return 0;
      
      const yearDiff = parseInt(yearA) - parseInt(yearB);
      if (yearDiff !== 0) return yearDiff;
      
      const monthIndexA = monthNames.indexOf(monthA);
      const monthIndexB = monthNames.indexOf(monthB);
      
      return monthIndexA - monthIndexB;
    });
    
    const categories = months;
    
    const series = showMargin
      ? [
          {
            name: 'Margin',
            data: months.map((month) => {
              const monthData = resolvedCategoryMatrix[month];
              if (!monthData || !monthData[selectedCategory]) return 0;
              const row = monthData[selectedCategory];
              if (typeof row.margin === 'number') return row.margin;
              const invoice = row.total_invoice ?? 0;
              const profit = row.total_profit ?? 0;
              return invoice > 0 ? (profit / invoice) * 100 : 0;
            }),
          },
        ]
      : [
          {
            name: 'Total Invoice',
            data: months.map((month) => {
              const monthData = resolvedCategoryMatrix[month];
              return monthData && monthData[selectedCategory] ? monthData[selectedCategory].total_invoice : 0;
            }),
          },
          {
            name: 'Total Profit',
            data: months.map((month) => {
              const monthData = resolvedCategoryMatrix[month];
              return monthData && monthData[selectedCategory] ? monthData[selectedCategory].total_profit : 0;
            }),
          },
        ];

    console.log('Prepared chart data:', { categories, series, selectedCategory });

    return {
      categories,
      series
    };
  };

  const chartDataConfig = useMemo(() => {
    console.log('Recalculating chart data config...', { chartData, selectedCategory });
    return prepareChartData();
  }, [chartData, selectedCategory, resolvedCategoryMatrix, showMargin]);

  // Only render chart if we have valid data
  const shouldRenderChart = chartDataConfig.categories.length > 0 && chartDataConfig.series.length > 0;

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
    yaxis: {
      min: 0,
      max: showMargin ? 100 : undefined,
      labels: {
        formatter: function(value: unknown) {
          return showMargin ? formatPercent(value) : formatCompactNumber(value);
        }
      },
      title: {
        text: showMargin ? 'Margin (%)' : 'Value'
      }
    },
    tooltip: showMargin
      ? {
          y: {
            formatter: function(value: unknown) {
              return formatPercent(value);
            }
          }
        }
      : {
          y: [
            {
              formatter: function(value: unknown) {
                return formatValue(value);
              }
            },
            {
              formatter: function(value: unknown) {
                return formatValue(value);
              }
            }
          ]
        },
    colors: showMargin ? ['#F59E0B'] : ['#3B82F6', '#10B981'],
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
      horizontalAlign: 'center' as const
    }
  };

  return (
    <Card>
      <CardContent>
        
        {/* Controls */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
          <Typography variant="h6" sx={{ margin: 0 }}>
            Category Distribution
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={showMargin}
                  onChange={(e) => setShowMargin(e.target.checked)}
                  color="primary"
                />
              }
              label="Margin view"
            />
            <FormControl size="small">
              <InputLabel>Category</InputLabel>
              <Select
                value={selectedCategory}
                label="Category"
                onChange={handleCategoryChange}
                disabled={availableCategories.length === 0}
              >
                {availableCategories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {/* Start Month Year */}
            <FormControl size="small">
              <InputLabel>Start Month</InputLabel>
              <Select
                value={startMonthYear}
                label="Start Month"
                onChange={handleStartMonthYearChange}
              >
                {monthYearOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* End Month Year */}
            <FormControl size="small">
              <InputLabel>End Month</InputLabel>
              <Select
                value={endMonthYear}
                label="End Month"
                onChange={handleEndMonthYearChange}
              >
                {monthYearOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
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
              <CircularProgress />
            </Box>
          ) : shouldRenderChart ? (
            <ReactApexChart
              key={`${startMonthYear}-${endMonthYear}-${selectedCategory}`}
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

export default CategoryDistributionChart;

