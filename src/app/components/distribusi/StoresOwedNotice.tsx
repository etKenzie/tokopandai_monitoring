'use client';

import { fetchOverdueOrders, Order } from '@/app/api/distribusi/DistribusiSlice';
import { useAuth } from '@/app/context/AuthContext';
import { getAgentNameFromRole, getRestrictedRoles } from '@/config/roles';
import { ExpandMore as ExpandMoreIcon, Warning as WarningIcon } from '@mui/icons-material';
import {
    Alert,
    Box,
    Card,
    CardContent,
    Chip,
    Collapse,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography
} from '@mui/material';
import { useEffect, useState } from 'react';

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

interface StoreOwedSummary {
  user_id: string;
  store_name: string;
  reseller_name: string;
  agent_name: string | null;
  segment: string;
  area: string;
  business_type: string;
  sub_business_type: string;
  total_owed: number;
  order_count: number;
}

interface StoresOwedNoticeProps {
  agentFilter?: string;
}

const StoresOwedNotice = ({ agentFilter }: StoresOwedNoticeProps) => {
  const { roles } = useAuth();
  const [storesOwed, setStoresOwed] = useState<StoreOwedSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false); // Default to collapsed

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Calculate past week dates (7 days ago to today)
        const today = new Date();
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);
        
        const endDate = today.toISOString().split('T')[0]; // YYYY-MM-DD
        const startDate = sevenDaysAgo.toISOString().split('T')[0]; // YYYY-MM-DD
        
        // Determine agent name: use filter if provided, otherwise use role-based agent
        const restrictedRoles = getRestrictedRoles();
        const hasRestrictedRole = roles.some(role => restrictedRoles.includes(role));
        const userRoleForFiltering = roles.find(role => restrictedRoles.includes(role));
        const roleBasedAgent = hasRestrictedRole && userRoleForFiltering 
          ? getAgentNameFromRole(userRoleForFiltering) 
          : undefined;
        
        // Use agentFilter if provided, otherwise fall back to role-based agent
        const agentName = agentFilter || roleBasedAgent;
        
        const response = await fetchOverdueOrders({
          start_date: startDate,
          end_date: endDate,
          sortTime: 'desc',
          agent: agentName
        });
        
        // Group orders by user_id and sum total_invoice
        const storeMap = new Map<string, StoreOwedSummary>();
        
        response.data.forEach((order: Order) => {
          // Convert total_invoice to number if it's a string
          const invoiceAmount = typeof order.total_invoice === 'string' 
            ? parseFloat(order.total_invoice) 
            : order.total_invoice;
          
          if (storeMap.has(order.user_id)) {
            const existing = storeMap.get(order.user_id)!;
            existing.total_owed += invoiceAmount;
            existing.order_count += 1;
          } else {
            storeMap.set(order.user_id, {
              user_id: order.user_id,
              store_name: order.store_name,
              reseller_name: order.reseller_name,
              agent_name: order.agent_name || null,
              segment: order.segment,
              area: order.area,
              business_type: order.business_type,
              sub_business_type: order.sub_business_type,
              total_owed: invoiceAmount,
              order_count: 1
            });
          }
        });
        
        // Convert map to array and filter out stores with 0 owed
        const stores = Array.from(storeMap.values()).filter(
          (store) => store.total_owed > 0
        );
        
        // Sort by total_owed descending
        stores.sort((a, b) => b.total_owed - a.total_owed);
        
        setStoresOwed(stores);
      } catch (err) {
        console.error('Failed to fetch overdue orders:', err);
        setError(err instanceof Error ? err.message : 'Failed to load overdue orders');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [roles, agentFilter]);

  if (loading) {
    return null; // Don't show anything while loading
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (storesOwed.length === 0) {
    return null; // Don't show notice if no stores with owed amounts
  }

  return (
    <Card sx={{ mb: 3, borderLeft: '4px solid', borderLeftColor: 'warning.main' }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
          <Box display="flex" alignItems="center" gap={1}>
            <WarningIcon color="warning" />
            <Typography variant="h6" color="warning.main" fontWeight="bold">
              Overdue Orders - Past Week ({storesOwed.length} stores)
            </Typography>
          </Box>
          <IconButton
            onClick={() => setExpanded(!expanded)}
            size="small"
            sx={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}
          >
            <ExpandMoreIcon />
          </IconButton>
        </Box>

        <Collapse in={expanded}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Store Name</strong></TableCell>
                  <TableCell><strong>Agent</strong></TableCell>
                  <TableCell><strong>Segment</strong></TableCell>
                  <TableCell><strong>Area</strong></TableCell>
                  <TableCell align="right"><strong>Order Count</strong></TableCell>
                  <TableCell align="right"><strong>Total Owed</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {storesOwed.map((store) => (
                  <TableRow key={store.user_id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {store.store_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {store.business_type} - {store.sub_business_type}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {store.agent_name ? (
                        <Chip label={store.agent_name} size="small" color="primary" />
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          -
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip label={store.segment} size="small" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{store.area}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="medium">
                        {store.order_count}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" color="error.main" fontWeight="bold">
                        {formatCurrency(store.total_owed)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default StoresOwedNotice;

