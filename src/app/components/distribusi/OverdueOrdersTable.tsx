'use client';

import { getAgentNameFromRole } from '@/config/roles';
import { ArrowForward as ArrowForwardIcon, Download as DownloadIcon, ExpandLess as ExpandLessIcon, ExpandMore as ExpandMoreIcon, Info as InfoIcon, Refresh as RefreshIcon, Search as SearchIcon } from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  TextField,
  Typography
} from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { fetchOverdueOrders, Order } from '../../api/distribusi/DistribusiSlice';
import OrderDetailModal from '../shared/OrderDetailModal';

type OrderDirection = 'asc' | 'desc';
type SortableField = keyof Order | 'days_late';

interface HeadCell {
  id: SortableField;
  label: string;
  numeric: boolean;
}

const headCells: HeadCell[] = [
  { id: 'order_code', label: 'Order Code', numeric: false },
  { id: 'month', label: 'Month', numeric: false },
  { id: 'reseller_name', label: 'Reseller Name', numeric: false },
  { id: 'store_name', label: 'Store Name', numeric: false },
  { id: 'segment', label: 'Segment', numeric: false },
  { id: 'area', label: 'Area', numeric: false },
  { id: 'agent_name', label: 'Agent', numeric: false },
  { id: 'status_order', label: 'Order Status', numeric: false },
  { id: 'status_payment', label: 'Payment Status', numeric: false },
  { id: 'payment_type', label: 'Payment Type', numeric: false },
  { id: 'order_date', label: 'Order Date', numeric: false },
  { id: 'faktur_date', label: 'Faktur Date', numeric: false },
  { id: 'payment_due_date', label: 'Due Date', numeric: false },
  { id: 'overdue_status', label: 'Overdue Status', numeric: false },
  { id: 'days_late', label: 'Days Late', numeric: true },
  { id: 'total_invoice', label: 'Total Invoice', numeric: true },
  { id: 'profit', label: 'Profit', numeric: true },
  { id: 'business_type', label: 'Business Type', numeric: false },
  { id: 'sub_business_type', label: 'Sub Business Type', numeric: false },
];

interface OverdueOrdersTableProps {
  filters: {
    start_date?: string;
    end_date?: string;
    agent?: string;
  };
  title?: string;
  // Role-based filtering props
  hasRestrictedRole?: boolean;
  userRoleForFiltering?: string;
  // Callback to update available agents in parent
  onAgentsUpdate?: (agents: string[]) => void;
}

const OverdueOrdersTable = ({ 
  filters,
  title = 'Overdue Orders',
  hasRestrictedRole = false,
  userRoleForFiltering,
  onAgentsUpdate
}: OverdueOrdersTableProps) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderBy, setOrderBy] = useState<SortableField>('order_date');
  const [order, setOrder] = useState<OrderDirection>('desc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [segmentFilter, setSegmentFilter] = useState<string>('');
  const [areaFilter, setAreaFilter] = useState<string>('');
  const [agentFilter, setAgentFilter] = useState<string>('');
  const [statusOrderFilter, setStatusOrderFilter] = useState<string>('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('');
  const [overdueStatusFilter, setOverdueStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedOrderCode, setSelectedOrderCode] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [storeSearchQuery, setStoreSearchQuery] = useState<string>('');
  const [activeStoreSearchQuery, setActiveStoreSearchQuery] = useState<string>('');
  const [storePage, setStorePage] = useState(0);
  const [storeRowsPerPage, setStoreRowsPerPage] = useState(5);
  const [showTransitionedOrders, setShowTransitionedOrders] = useState(false);

  const fetchOverdueOrdersData = async () => {
    // Clear existing data immediately when fetching new data
    setOrders([]);
    setError(null);

    setLoading(true);
    try {
      // For users with restricted roles, use their mapped agent name instead of filter selection
      const agentName = hasRestrictedRole && userRoleForFiltering 
        ? getAgentNameFromRole(userRoleForFiltering) 
        : filters.agent;

      // Build request parameters - only include dates if they are provided
      const requestParams: any = {
        sortTime: 'desc',
        agent: agentName
      };

      // Only add dates if both are provided
      if (filters.start_date && filters.end_date) {
        requestParams.start_date = filters.start_date;
        requestParams.end_date = filters.end_date;
      }

      const response = await fetchOverdueOrders(requestParams);
      
      setOrders(response.data);
      
      // Update available agents in parent component
      if (onAgentsUpdate) {
        const uniqueAgents = Array.from(new Set(response.data.map((o: Order) => o.agent_name).filter(Boolean))) as string[];
        onAgentsUpdate(uniqueAgents.sort());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Failed to fetch overdue orders data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Clear data when dates change
  useEffect(() => {
    setOrders([]);
    setError(null);
    setPage(0);
    // Clear local filters when dates change
    setSegmentFilter('');
    setAreaFilter('');
    setAgentFilter('');
    setStatusOrderFilter('');
    setPaymentStatusFilter('');
    setOverdueStatusFilter('');
    setSearchQuery('');
  }, [filters.start_date, filters.end_date]);

  useEffect(() => {
    fetchOverdueOrdersData();
    // Reset pagination when filters change
    setPage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.start_date, filters.end_date, filters.agent, hasRestrictedRole, userRoleForFiltering]);

  const handleRequestSort = (property: SortableField) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0);
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'LUNAS': return 'success';
      case 'BELUM LUNAS': return 'error';
      case 'SEBAGIAN': return 'warning';
      default: return 'default';
    }
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'PACKAGED': return 'success';
      case 'PROCESS DELIVERY': return 'warning';
      case 'DELIVERED': return 'info';
      case 'CANCELLED': return 'error';
      default: return 'default';
    }
  };

  // Calculate days late (how many days past the due date)
  const calculateDaysLate = (order: Order): number => {
    if (!order.payment_due_date) return 0;
    
    const today = new Date();
    const dueDate = new Date(order.payment_due_date);
    
    // Reset time to start of day for accurate day calculation
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    
    // Calculate difference in days (positive if due date is in the future, negative if past due)
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Return 0 if not overdue, otherwise return the number of days late
    return diffDays < 0 ? Math.abs(diffDays) : 0;
  };

  // Calculate overdue status based on payment_due_date and current date
  const calculateOverdueStatus = (order: Order): string => {
    if (!order.payment_due_date) return '';
    
    const today = new Date();
    const dueDate = new Date(order.payment_due_date);
    
    // Reset time to start of day for accurate day calculation
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    
    // Calculate difference in days (positive if due date is in the future, negative if past due)
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Determine overdue status based on days past due
    if (diffDays >= 0) {
      return 'CURRENT';
    } else {
      const daysPastDue = Math.abs(diffDays);
      if (daysPastDue < 14) {
        return 'B2W';
      } else if (daysPastDue < 30) {
        return '14DPD';
      } else if (daysPastDue < 60) {
        return '30DPD';
      } else if (daysPastDue < 90) {
        return '60DPD';
      } else {
        return '90DPD';
      }
    }
  };

  const getOverdueStatusColor = (status: string) => {
    if (!status) return 'default';
    if (status.includes('DPD')) {
      const days = parseInt(status.replace('DPD', '').trim());
      if (days >= 30) return 'error';
      if (days >= 14) return 'warning';
      return 'info';
    }
    if (status === 'CURRENT') return 'success';
    if (status === 'B2W') return 'warning';
    return 'default';
  };

  const searchFields = (order: Order, query: string): boolean => {
    if (!query) return true;

    const searchableFields = [
      order.order_code?.toLowerCase() || '',
      order.reseller_name?.toLowerCase() || '',
      order.store_name?.toLowerCase() || '',
      order.segment?.toLowerCase() || '',
      order.area?.toLowerCase() || '',
      order.agent_name?.toLowerCase() || '',
      order.status_order?.toLowerCase() || '',
      order.status_payment?.toLowerCase() || '',
      order.payment_type?.toLowerCase() || '',
      order.business_type?.toLowerCase() || '',
      order.sub_business_type?.toLowerCase() || '',
      calculateOverdueStatus(order).toLowerCase(),
    ];

    return searchableFields.some((field) =>
      field.includes(query.toLowerCase())
    );
  };

  const filteredOrders = orders.filter((o) => {
    // Apply filters
    if (segmentFilter && o.segment !== segmentFilter) return false;
    if (areaFilter && o.area !== areaFilter) return false;
    if (agentFilter && o.agent_name !== agentFilter) return false;
    if (statusOrderFilter && o.status_order !== statusOrderFilter) return false;
    if (paymentStatusFilter && o.status_payment !== paymentStatusFilter) return false;
    if (overdueStatusFilter) {
      const overdueStatus = calculateOverdueStatus(o);
      if (overdueStatus !== overdueStatusFilter) return false;
    }

    // Search functionality
    if (searchQuery) {
      return searchFields(o, searchQuery);
    }

    return true;
  });

  // Reset page when local filters change
  useEffect(() => {
    setPage(0);
  }, [segmentFilter, areaFilter, agentFilter, statusOrderFilter, paymentStatusFilter, overdueStatusFilter, searchQuery]);

  const uniqueSegments = Array.from(new Set(orders.map((o) => o.segment)));
  const uniqueAreas = Array.from(new Set(orders.map((o) => o.area)));
  const uniqueAgents = Array.from(new Set(orders.map((o) => o.agent_name)));
  const uniqueStatusOrders = Array.from(new Set(orders.map((o) => o.status_order)));
  const uniquePaymentStatuses = Array.from(new Set(orders.map((o) => o.status_payment)));
  const uniqueOverdueStatuses = Array.from(new Set(orders.map((o) => calculateOverdueStatus(o)).filter(Boolean))).sort();

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    // Special handling for days_late field - use calculated value
    if (orderBy === 'days_late') {
      const aValue = calculateDaysLate(a);
      const bValue = calculateDaysLate(b);
      if (order === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return bValue < aValue ? -1 : bValue > aValue ? 1 : 0;
      }
    }

    let aValue: any = a[orderBy as keyof Order];
    let bValue: any = b[orderBy as keyof Order];

    if (orderBy === 'total_invoice' || orderBy === 'profit') {
      aValue = Number(aValue);
      bValue = Number(bValue);
    }

    if (orderBy === 'order_date' || orderBy === 'faktur_date' || orderBy === 'payment_due_date') {
      aValue = aValue ? new Date(aValue).getTime() : 0;
      bValue = bValue ? new Date(bValue).getTime() : 0;
    }

    // Special handling for overdue_status field - use calculated value
    if (orderBy === 'overdue_status') {
      const getOverduePriority = (status: string) => {
        if (!status) return 6; // null status gets lowest priority
        if (status === 'CURRENT') return 0;
        if (status === 'B2W') return 1;
        if (status.includes('14DPD')) return 2;
        if (status.includes('30DPD')) return 3;
        if (status.includes('60DPD')) return 4;
        if (status.includes('90DPD')) return 5;
        return 6; // for any other status
      };
      
      aValue = getOverduePriority(calculateOverdueStatus(a));
      bValue = getOverduePriority(calculateOverdueStatus(b));
    } else if (typeof aValue === 'string' && typeof bValue === 'string') {
      // Handle string comparisons for other text fields
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (order === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return bValue < aValue ? -1 : bValue > aValue ? 1 : 0;
    }
  });

  const totalInvoice = filteredOrders.reduce((sum, o) => sum + (Number(o.total_invoice) || 0), 0);
  const totalProfit = filteredOrders.reduce((sum, o) => sum + (Number(o.profit) || 0), 0);
  const totalOrders = filteredOrders.length;
  
  // Calculate unique stores based on user_id
  const uniqueStores = new Set(filteredOrders.map(o => o.user_id));
  const storeCount = uniqueStores.size;

  // Calculate store details grouped by store - memoized for performance
  interface StoreDetail {
    userId: string;
    storeName: string;
    resellerName: string;
    agentName: string;
    businessType: string;
    subBusinessType: string;
    segment: string;
    area: string;
    totalInvoice: number;
    totalProfit: number;
    orderCount: number;
    overdueStatuses: string[];
  }

  const storeDetails = useMemo(() => {
    const storeDetailsMap = new Map<string, StoreDetail>();
    
    filteredOrders.forEach(order => {
      const storeId = order.user_id;
      if (!storeDetailsMap.has(storeId)) {
        storeDetailsMap.set(storeId, {
          userId: storeId,
          storeName: order.store_name,
          resellerName: order.reseller_name,
          agentName: order.agent_name,
          businessType: order.business_type,
          subBusinessType: order.sub_business_type,
          segment: order.segment,
          area: order.area,
          totalInvoice: 0,
          totalProfit: 0,
          orderCount: 0,
          overdueStatuses: []
        });
      }
      
      const store = storeDetailsMap.get(storeId)!;
      store.totalInvoice += Number(order.total_invoice) || 0;
      store.totalProfit += Number(order.profit) || 0;
      store.orderCount += 1;
      const overdueStatus = calculateOverdueStatus(order);
      if (overdueStatus && !store.overdueStatuses.includes(overdueStatus)) {
        store.overdueStatuses.push(overdueStatus);
      }
    });

    // Sort by total invoice descending
    return Array.from(storeDetailsMap.values()).sort((a, b) => b.totalInvoice - a.totalInvoice);
  }, [filteredOrders]);

  // Memoize filtered stores for the modal
  const filteredStoresForModal = useMemo(() => {
    return storeDetails.filter((store) => {
      if (!activeStoreSearchQuery) return true;
      const query = activeStoreSearchQuery.toLowerCase();
      return (
        store.storeName.toLowerCase().includes(query) ||
        store.resellerName.toLowerCase().includes(query) ||
        store.agentName?.toLowerCase().includes(query) ||
        store.segment.toLowerCase().includes(query) ||
        store.area.toLowerCase().includes(query)
      );
    });
  }, [storeDetails, activeStoreSearchQuery]);

  const prepareDataForExport = (orders: Order[]) => {
    // Add summary row at the beginning
    const summaryRow = {
      'Order Code': 'SUMMARY',
      'Month': '',
      'Reseller Name': '',
      'Store Name': '',
      'Segment': '',
      'Area': '',
      'Agent': '',
      'Order Status': '',
      'Payment Status': '',
      'Payment Type': '',
      'Order Date': '',
      'Faktur Date': '',
      'Due Date': '',
      'Overdue Status': '',
      'Days Late': '',
      'Total Invoice': totalInvoice,
      'Profit': totalProfit,
      'Business Type': `Stores: ${storeCount} | Total Orders: ${totalOrders}`,
      'Sub Business Type': '',
    };
    
    const orderData = orders.map((o) => ({
      'Order Code': o.order_code,
      'Month': o.month,
      'Reseller Name': o.reseller_name,
      'Store Name': o.store_name,
      'Segment': o.segment,
      'Area': o.area,
      'Agent': o.agent_name,
      'Order Status': o.status_order,
      'Payment Status': o.status_payment,
      'Payment Type': o.payment_type,
      'Order Date': formatDate(o.order_date),
      'Faktur Date': o.faktur_date ? formatDate(o.faktur_date) : '',
      'Due Date': o.payment_due_date ? formatDate(o.payment_due_date) : '',
      'Overdue Status': calculateOverdueStatus(o) || '',
      'Days Late': calculateDaysLate(o),
      'Total Invoice': o.total_invoice,
      'Profit': o.profit,
      'Business Type': o.business_type,
      'Sub Business Type': o.sub_business_type,
    }));
    
    return [summaryRow, ...orderData];
  };

  const handleExcelExport = () => {
    if (!orders.length) return;

    // Only run on client side
    if (typeof window === 'undefined' || typeof document === 'undefined' || typeof Blob === 'undefined') return;

    const data = prepareDataForExport(filteredOrders);
    
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);

    // Set column widths
    const colWidths = [
      { wch: 15 }, // Order Code
      { wch: 15 }, // Month
      { wch: 25 }, // Reseller Name
      { wch: 25 }, // Store Name
      { wch: 15 }, // Segment
      { wch: 15 }, // Area
      { wch: 20 }, // Agent
      { wch: 15 }, // Order Status
      { wch: 15 }, // Payment Status
      { wch: 15 }, // Payment Type
      { wch: 15 }, // Order Date
      { wch: 15 }, // Faktur Date
      { wch: 15 }, // Due Date
      { wch: 15 }, // Overdue Status
      { wch: 12 }, // Days Late
      { wch: 15 }, // Total Invoice
      { wch: 15 }, // Profit
      { wch: 20 }, // Business Type
      { wch: 25 }, // Sub Business Type
    ];
    ws['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Overdue Orders');

    // Generate Excel file
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    // Download file
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `overdue-orders.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const clearAllFilters = () => {
    setSegmentFilter('');
    setAreaFilter('');
    setAgentFilter('');
    setStatusOrderFilter('');
    setPaymentStatusFilter('');
    setSearchQuery('');
    setPage(0);
  };

  const handleRowClick = (orderCode: string) => {
    setSelectedOrderCode(orderCode);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedOrderCode(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Calculate days past due for a specific reference date
  const calculateDaysPastDueForDate = (order: Order, referenceDate: Date): number => {
    if (!order.payment_due_date) return 0;
    
    const today = new Date(referenceDate);
    const dueDate = new Date(order.payment_due_date);
    
    // Reset time to start of day for accurate day calculation
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    
    // Calculate difference in days (positive if due date is in the future, negative if past due)
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Return 0 if not overdue, otherwise return the number of days past due
    return diffDays < 0 ? Math.abs(diffDays) : 0;
  };

  // Find orders that transitioned from 30DPD to 60DPD in the last 10 days
  // These are orders that are currently 60-70 days late
  // (These orders just entered the 60DPD range in the last 10 days)
  const ordersTransitionedTo60DPD = useMemo(() => {
    const result = filteredOrders.filter(order => {
      if (!order.payment_due_date) return false;
      
      // Calculate days past due today
      const daysPastDueToday = calculateDaysLate(order);
      
      // Orders that are currently 60-70 days late
      // These orders just entered the 60DPD range (60-89 days) in the last 10 days
      return daysPastDueToday >= 60 && daysPastDueToday <= 70;
    });
    
    // Debug logging
    console.log('Orders transitioned to 60DPD:', result.length);
    console.log('Sample orders:', result.slice(0, 3).map(o => ({
      order_code: o.order_code,
      days_late: calculateDaysLate(o),
      payment_due_date: o.payment_due_date
    })));
    
    return result;
  }, [filteredOrders]);

  const transitionedTotalInvoice = ordersTransitionedTo60DPD.reduce((sum, o) => sum + (Number(o.total_invoice) || 0), 0);
  const transitionedTotalProfit = ordersTransitionedTo60DPD.reduce((sum, o) => sum + (Number(o.profit) || 0), 0);
  const transitionedOrderCount = ordersTransitionedTo60DPD.length;

  return (
    <Card>
      <CardContent>
        {/* Recap Section: Orders Transitioned from 30DPD to 60DPD */}
        <Box
          sx={{
            mb: 3,
            p: 2,
            backgroundColor: transitionedOrderCount > 0 ? 'error.light' : 'grey.100',
            borderRadius: 2,
            border: '2px solid',
            borderColor: transitionedOrderCount > 0 ? 'error.main' : 'grey.300',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="h6" fontWeight="bold" color={transitionedOrderCount > 0 ? 'error.main' : 'text.secondary'}>
              ⚠️ Order yang Naik dari 30DPD ke 60DPD (10 Hari Terakhir)
            </Typography>
            {transitionedOrderCount > 0 && (
              <Button
                variant="outlined"
                size="small"
                endIcon={showTransitionedOrders ? <ExpandLessIcon /> : <ArrowForwardIcon />}
                onClick={() => setShowTransitionedOrders(!showTransitionedOrders)}
                sx={{ minWidth: '150px' }}
              >
                {showTransitionedOrders ? 'Sembunyikan' : 'Lihat Order'}
              </Button>
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap', mt: 2 }}>
            <Box>
              <Typography variant="h4" color={transitionedOrderCount > 0 ? 'error.main' : 'text.secondary'} fontWeight="bold">
                {transitionedOrderCount}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Order (60-70 hari terlambat)
              </Typography>
            </Box>
            <Box>
              <Typography variant="h5" color={transitionedOrderCount > 0 ? 'error.main' : 'text.secondary'} fontWeight="bold">
                {formatCurrency(transitionedTotalInvoice)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Total Invoice
              </Typography>
            </Box>
            <Box>
              <Typography variant="h5" color={transitionedOrderCount > 0 ? 'error.main' : 'text.secondary'} fontWeight="bold">
                {formatCurrency(transitionedTotalProfit)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Total Profit
              </Typography>
            </Box>
          </Box>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 2, fontStyle: 'italic' }}>
            {transitionedOrderCount > 0 
              ? 'Order-order ini saat ini 60-70 hari terlambat dan baru saja masuk ke kategori 60DPD dalam 10 hari terakhir.'
              : 'Tidak ada order yang ditemukan dengan 60-70 hari terlambat. Ini adalah order yang baru saja masuk ke kategori 60DPD.'}
          </Typography>
          
          {/* Expanded Orders List */}
          {showTransitionedOrders && transitionedOrderCount > 0 && (
            <Box sx={{ mt: 3 }}>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Order Code</TableCell>
                      <TableCell>Store Name</TableCell>
                      <TableCell>Agent</TableCell>
                      <TableCell>Due Date</TableCell>
                      <TableCell align="right">Days Late</TableCell>
                      <TableCell align="right">Total Invoice</TableCell>
                      <TableCell align="right">Profit</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {ordersTransitionedTo60DPD.map((order) => (
                      <TableRow 
                        key={order.order_id}
                        hover
                        onClick={() => handleRowClick(order.order_code)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {order.order_code}
                          </Typography>
                        </TableCell>
                        <TableCell>{order.store_name}</TableCell>
                        <TableCell>{order.agent_name}</TableCell>
                        <TableCell>{formatDate(order.payment_due_date)}</TableCell>
                        <TableCell align="right">
                          <Typography 
                            variant="body2" 
                            fontWeight="bold" 
                            color="error.main"
                            sx={{
                              border: '1px solid',
                              borderColor: 'error.main',
                              borderRadius: '4px',
                              padding: '4px 8px',
                              display: 'inline-block',
                              minWidth: '40px',
                              textAlign: 'center'
                            }}
                          >
                            {calculateDaysLate(order)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                          {formatCurrency(Number(order.total_invoice))}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                          {formatCurrency(Number(order.profit))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </Box>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            mb: 3,
          }}
        >
          <Box>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchOverdueOrdersData}
              disabled={loading}
              sx={{ mr: 1 }}
            >
              Refresh
            </Button>
            <Button
              variant="outlined"
              startIcon={<InfoIcon />}
              onClick={() => setDetailsModalOpen(true)}
              disabled={filteredOrders.length === 0}
              sx={{ mr: 1 }}
            >
              Overview
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExcelExport}
              disabled={filteredOrders.length === 0}
              sx={{ mr: 1 }}
            >
              Export Excel
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={clearAllFilters}
              disabled={!segmentFilter && !areaFilter && !agentFilter && !statusOrderFilter && !paymentStatusFilter && !overdueStatusFilter && !searchQuery}
            >
              Clear Filters
            </Button>
          </Box>
        </Box>

        {/* Summary Stats */}
        <Box mb={3} sx={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
          <Box sx={{ textAlign: 'center', minWidth: '200px' }}>
            <Typography variant="h3" color="primary" fontWeight="bold" mb={1}>
              {storeCount}
            </Typography>
            <Typography variant="h6" color="textSecondary" fontWeight="500">
              Unique Stores
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center', minWidth: '200px' }}>
            <Typography variant="h3" color="secondary" fontWeight="bold" mb={1}>
              {totalOrders}
            </Typography>
            <Typography variant="h6" color="textSecondary" fontWeight="500">
              Total Orders
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center', minWidth: '200px' }}>
            <Typography variant="h3" color="info.main" fontWeight="bold" mb={1}>
              {formatCurrency(totalInvoice)}
            </Typography>
            <Typography variant="h6" color="textSecondary" fontWeight="500">
              Total Invoice Amount
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center', minWidth: '200px' }}>
            <Typography variant="h3" color="success.main" fontWeight="bold" mb={1}>
              {formatCurrency(totalProfit)}
            </Typography>
            <Typography variant="h6" color="textSecondary" fontWeight="500">
              Total Profit Amount
            </Typography>
          </Box>
        </Box>

        {/* Search and Filters */}
        <Box mb={3}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search overdue orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Overdue Status</InputLabel>
                <Select
                  value={overdueStatusFilter}
                  label="Overdue Status"
                  onChange={(e) => {
                    setOverdueStatusFilter(e.target.value);
                    setPage(0);
                  }}
                >
                  <MenuItem value="">All Overdue Statuses</MenuItem>
                  {uniqueOverdueStatuses.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Order Status</InputLabel>
                <Select
                  value={statusOrderFilter}
                  label="Order Status"
                  onChange={(e) => setStatusOrderFilter(e.target.value)}
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  {uniqueStatusOrders.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Payment Status</InputLabel>
                <Select
                  value={paymentStatusFilter}
                  label="Payment Status"
                  onChange={(e) => setPaymentStatusFilter(e.target.value)}
                >
                  <MenuItem value="">All Payment Statuses</MenuItem>
                  {uniquePaymentStatuses.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Agent</InputLabel>
                <Select
                  value={agentFilter}
                  label="Agent"
                  onChange={(e) => setAgentFilter(e.target.value)}
                  disabled={hasRestrictedRole}
                >
                  <MenuItem value="">All Agents</MenuItem>
                  {uniqueAgents.map((agent) => (
                    <MenuItem key={agent} value={agent}>
                      {agent}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Segment</InputLabel>
                <Select
                  value={segmentFilter}
                  label="Segment"
                  onChange={(e) => setSegmentFilter(e.target.value)}
                >
                  <MenuItem value="">All Segments</MenuItem>
                  {uniqueSegments.map((segment) => (
                    <MenuItem key={segment} value={segment}>
                      {segment}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Area</InputLabel>
                <Select
                  value={areaFilter}
                  label="Area"
                  onChange={(e) => setAreaFilter(e.target.value)}
                >
                  <MenuItem value="">All Areas</MenuItem>
                  {uniqueAreas.map((area) => (
                    <MenuItem key={area} value={area}>
                      {area}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>

        {/* Table */}
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                {headCells.map((headCell) => (
                  <TableCell
                    key={headCell.id}
                    align={headCell.numeric ? 'right' : 'left'}
                    sortDirection={orderBy === headCell.id ? order : false}
                  >
                    <TableSortLabel
                      active={orderBy === headCell.id}
                      direction={orderBy === headCell.id ? order : 'asc'}
                      onClick={() => handleRequestSort(headCell.id)}
                    >
                      {headCell.label}
                    </TableSortLabel>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={headCells.length} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={headCells.length} align="center">
                    <Typography variant="body2" color="error">
                      {error}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : sortedOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={headCells.length} align="center">
                    <Typography variant="body2" color="textSecondary">
                      {'No overdue orders found'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                sortedOrders
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((row) => (
                    <TableRow 
                      key={row.order_id} 
                      hover 
                      onClick={() => handleRowClick(row.order_code)}
                      sx={{ 
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        }
                      }}
                    >
                      <TableCell>{row.order_code}</TableCell>
                      <TableCell>
                        <Chip
                          label={row.month}
                          size="small"
                          variant="outlined"
                          color="primary"
                        />
                      </TableCell>
                      <TableCell>{row.reseller_name}</TableCell>
                      <TableCell>{row.store_name}</TableCell>
                      <TableCell>
                        <Chip
                          label={row.segment}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={row.area}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{row.agent_name}</TableCell>
                      <TableCell>
                        <Chip
                          label={row.status_order}
                          color={getOrderStatusColor(row.status_order) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={row.status_payment}
                          color={getPaymentStatusColor(row.status_payment) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{row.payment_type}</TableCell>
                      <TableCell>{formatDate(row.order_date)}</TableCell>
                      <TableCell>{row.faktur_date ? formatDate(row.faktur_date) : '-'}</TableCell>
                      <TableCell>{formatDate(row.payment_due_date)}</TableCell>
                      <TableCell>
                        {(() => {
                          const overdueStatus = calculateOverdueStatus(row);
                          return overdueStatus ? (
                            <Chip
                              label={overdueStatus}
                              color={getOverdueStatusColor(overdueStatus) as any}
                              size="small"
                            />
                          ) : (
                            '-'
                          );
                        })()}
                      </TableCell>
                      <TableCell align="right">
                        <Typography 
                          variant="body2" 
                          fontWeight="bold" 
                          color={calculateDaysLate(row) > 0 ? 'error.main' : 'text.secondary'}
                          sx={{
                            border: '1px solid',
                            borderColor: calculateDaysLate(row) > 0 ? 'error.main' : 'text.secondary',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            display: 'inline-block',
                            minWidth: '40px',
                            textAlign: 'center'
                          }}
                        >
                          {calculateDaysLate(row)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        {formatCurrency(Number(row.total_invoice))}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                        {formatCurrency(Number(row.profit))}
                      </TableCell>
                      <TableCell>{row.business_type}</TableCell>
                      <TableCell>{row.sub_business_type}</TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={filteredOrders.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </TableContainer>
      </CardContent>

      {/* Order Detail Modal */}
      <OrderDetailModal
        open={modalOpen}
        onClose={handleCloseModal}
        orderCode={selectedOrderCode}
      />

      {/* Store Details Modal */}
      <Dialog
        open={detailsModalOpen}
        onClose={() => {
          setDetailsModalOpen(false);
          setStoreSearchQuery(''); // Clear search when modal closes
          setActiveStoreSearchQuery(''); // Clear active search when modal closes
        }}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Overdue Orders by Store
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, mb: 2, display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search stores by name, reseller, or agent..."
              value={storeSearchQuery}
              onChange={(e) => setStoreSearchQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  setActiveStoreSearchQuery(storeSearchQuery);
                }
              }}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={() => {
                setActiveStoreSearchQuery(storeSearchQuery);
                setStorePage(0); // Reset to first page when searching
              }}
              size="small"
              sx={{ minWidth: '120px' }}
            >
              Search
            </Button>
          </Box>
          <Box sx={{ mt: 2 }}>
            {(() => {
              const paginatedStores = filteredStoresForModal.slice(
                storePage * storeRowsPerPage,
                storePage * storeRowsPerPage + storeRowsPerPage
              );
              
              return (
                <>
                  {paginatedStores.map((store, index) => (
              <Accordion key={index}>
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  sx={{ '& .MuiAccordionSummary-content': { margin: '12px 0' } }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', pr: 2 }}>
                    <Box>
                      <Typography variant="h6" fontWeight="bold">
                        {store.storeName}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {store.resellerName} • {store.segment} • {store.area}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <Typography variant="body2" color="textSecondary">
                        Orders: {store.orderCount}
                      </Typography>
                      <Typography variant="body2" color="primary.main" fontWeight="bold">
                        Invoice: {formatCurrency(store.totalInvoice)}
                      </Typography>
                      <Typography variant="body2" color="success.main" fontWeight="bold">
                        Profit: {formatCurrency(store.totalProfit)}
                      </Typography>
                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      <strong>Agent:</strong> {store.agentName || '-'} • <strong>Business Type:</strong> {store.businessType} • <strong>Sub Type:</strong> {store.subBusinessType}
                    </Typography>
                    {store.overdueStatuses.length > 0 && (
                      <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Typography variant="body2" color="textSecondary">
                          <strong>Overdue Statuses:</strong>
                        </Typography>
                        {store.overdueStatuses.map((status, idx) => (
                          <Chip
                            key={idx}
                            label={status}
                            color={getOverdueStatusColor(status) as any}
                            size="small"
                          />
                        ))}
                      </Box>
                    )}
                  </Box>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Order Code</TableCell>
                          <TableCell>Order Date</TableCell>
                          <TableCell>Faktur Date</TableCell>
                          <TableCell>Due Date</TableCell>
                          <TableCell>Overdue Status</TableCell>
                          <TableCell align="right">Days Late</TableCell>
                          <TableCell align="right">Total Invoice</TableCell>
                          <TableCell align="right">Profit</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredOrders
                          .filter(o => o.user_id === store.userId)
                          .map((order) => (
                            <TableRow key={order.order_id}>
                              <TableCell>
                                <Typography variant="body2" fontWeight="medium">
                                  {order.order_code}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">
                                  {formatDate(order.order_date)}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">
                                  {order.faktur_date ? formatDate(order.faktur_date) : '-'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">
                                  {formatDate(order.payment_due_date)}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                {(() => {
                                  const overdueStatus = calculateOverdueStatus(order);
                                  return overdueStatus ? (
                                    <Chip
                                      label={overdueStatus}
                                      color={getOverdueStatusColor(overdueStatus) as any}
                                      size="small"
                                    />
                                  ) : (
                                    '-'
                                  );
                                })()}
                              </TableCell>
                              <TableCell align="right">
                                <Typography 
                                  variant="body2" 
                                  fontWeight="bold" 
                                  color={calculateDaysLate(order) > 0 ? 'error.main' : 'text.secondary'}
                                  sx={{
                                    border: '1px solid',
                                    borderColor: calculateDaysLate(order) > 0 ? 'error.main' : 'text.secondary',
                                    borderRadius: '4px',
                                    padding: '4px 8px',
                                    display: 'inline-block',
                                    minWidth: '40px',
                                    textAlign: 'center'
                                  }}
                                >
                                  {calculateDaysLate(order)}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body2" fontWeight="bold" color="primary.main">
                                  {formatCurrency(Number(order.total_invoice))}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body2" fontWeight="bold" color="success.main">
                                  {formatCurrency(Number(order.profit))}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </AccordionDetails>
              </Accordion>
                  ))}
                  {filteredStoresForModal.length === 0 && (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body2" color="textSecondary">
                        No stores found
                      </Typography>
                    </Box>
                  )}
                </>
              );
            })()}
          </Box>
          
          {/* Pagination for stores */}
          {filteredStoresForModal.length > storeRowsPerPage && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, mb: 2 }}>
                <TablePagination
                  component="div"
                  count={filteredStoresForModal.length}
                  rowsPerPage={storeRowsPerPage}
                  page={storePage}
                  onPageChange={(event, newPage) => setStorePage(newPage)}
                  onRowsPerPageChange={(event) => {
                    setStoreRowsPerPage(parseInt(event.target.value, 10));
                    setStorePage(0);
                  }}
                  rowsPerPageOptions={[5, 10, 25, 50]}
                />
              </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setDetailsModalOpen(false);
            setStorePage(0); // Reset pagination when closing
          }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default OverdueOrdersTable;

