// Types for Order API
export interface Order {
  order_id: string;
  order_code: string;
  user_id: string;
  reseller_name: string;
  store_name: string;
  segment: string;
  area: string;
  reseller_code: string;
  phone_number: string;
  status_order: string;
  status_payment: string;
  payment_type: string;
  order_date: string;
  faktur_date: string | null;
  payment_due_date: string | null;
  process_hub: string;
  is_cross: number;
  order_type: string;
  month: string;
  payment_date: string | null;
  total_invoice: number;
  agent_name: string;
  admin_name: string;
  business_type: string;
  sub_business_type: string;
  profit: number;
  overdue_status: string;
}

// Types for Full Order API (with detail_order)
export interface FullOrderDetailItem {
  order_id: string;
  order_item_id: string;
  order_code: string;
  product_id: string;
  sku: string;
  price: string;
  order_quantity: number;
  total_invoice: string;
  profit: number;
  stock_product: number;
  variant_name: string;
  product_variant_id: string;
  variant: string;
  variant_value: number;
  order_date: string;
  status: string;
  nama_lengkap: string;
  nama_toko: string;
  reseller_code: string;
  alamat: string;
  product_name: string;
  brands: string;
  type_category: string;
  sub_category: string;
  dt_code: string;
  hub: string;
  principle_id: string;
  principle: string;
  serve_price: number | null;
  buy_price: number;
}

export interface FullOrder {
  order_id: string;
  order_code: string;
  user_id: string;
  reseller_name: string;
  store_name: string;
  segment: string;
  area: string;
  reseller_code: string;
  phone_number: string;
  status_order: string;
  status_payment: string;
  payment_type: string;
  order_date: string;
  faktur_date: string | null;
  payment_due_date: string | null;
  process_hub: string;
  is_cross: number;
  order_type: string;
  month: string;
  payment_date: string | null;
  total_invoice: string;
  agent_name: string;
  admin_name: string;
  business_type: string;
  sub_business_type: string;
  profit: number;
  detail_order: FullOrderDetailItem[];
}

export interface FullOrdersResponse {
  code: number;
  status: string;
  message: string;
  data: FullOrder[];
}

export interface OrdersResponse {
  code: number;
  status: string;
  message: string;
  data: Order[];
}

// Types for Order Detail API
export interface OrderDetailItem {
  order_id: string;
  order_item_id: string;
  order_code: string;
  product_id: string;
  sku: string;
  price: string;
  order_quantity: number;
  total_invoice: string;
  stock_product: number;
  variant_name: string;
  product_variant_id: string;
  variant: string;
  variant_value: number;
  order_date: string;
  status: string;
  nama_lengkap: string;
  nama_toko: string;
  reseller_code: string;
  alamat: string;
  product_name: string;
  brands: string;
  type_category: string;
  sub_category: string;
  dt_code: string;
  hub: string;
  principle_id: string;
  principle: string;
  serve_price: number | null;
  buy_price: number;
}

export interface OrderDetailResponse {
  code: number;
  status: string;
  message: string;
  data: {
    order_code: string;
    details: OrderDetailItem[];
  };
}

// Types for Order Item Update API
export interface OrderItemUpdate {
  order_item_id: string;
  new_buy_price: number;
}

export interface OrderItemUpdateRequest {
  details: OrderItemUpdate[];
}

export interface OrderItemUpdateResponse {
  code: number;
  status: string;
  message: string;
}

// Types for Order Query Parameters
export interface OrderQueryParams {
  sortTime?: 'asc' | 'desc';
  payment?: string;
  month?: string;
  payment_month?: string;
  agent?: string;
  segment?: string;
  area?: string;
}

export interface OverdueOrdersQueryParams {
  start_date?: string;
  end_date?: string;
  sortTime?: 'asc' | 'desc';
  agent?: string;
}

// Get API URL from environment variable with fallback
const AM_API_URL = process.env.NEXT_PUBLIC_API_URL;

// Fetch Orders
export const fetchOrders = async (params: OrderQueryParams): Promise<OrdersResponse> => {
  const baseUrl = AM_API_URL;
  
  // Build query string from parameters
  const queryParams = new URLSearchParams();
  
  if (params.sortTime) queryParams.append('sortTime', params.sortTime);
  if (params.payment) queryParams.append('payment', params.payment);
  if (params.month) queryParams.append('month', params.month);
  if (params.payment_month) queryParams.append('payment_month', params.payment_month);
  if (params.agent) queryParams.append('agent', params.agent);
  if (params.segment) queryParams.append('segment', params.segment);
  if (params.area) queryParams.append('area', params.area);
  
  const url = `${baseUrl}/api/order?${queryParams.toString()}`;
  
  console.log('Fetching orders from:', url);
  console.log('Query params:', queryParams.toString());
  console.log('Params received:', params);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch orders: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};

// Helper function to fetch orders with default parameters
export const fetchOrdersDefault = async (): Promise<OrdersResponse> => {
  return fetchOrders({
    sortTime: 'desc',
    payment: 'BELUM LUNAS'
  });
};

// Helper function to fetch orders by specific payment status
export const fetchOrdersByPaymentStatus = async (paymentStatus: string): Promise<OrdersResponse> => {
  return fetchOrders({
    sortTime: 'desc',
    payment: paymentStatus
  });
};

// Helper function to fetch orders by month
export const fetchOrdersByMonth = async (month: string): Promise<OrdersResponse> => {
  return fetchOrders({
    sortTime: 'desc',
    month: month
  });
};

// Helper function to fetch orders by agent
export const fetchOrdersByAgent = async (agent: string): Promise<OrdersResponse> => {
  return fetchOrders({
    sortTime: 'desc',
    agent: agent
  });
};

// Helper function to fetch orders by segment
export const fetchOrdersBySegment = async (segment: string): Promise<OrdersResponse> => {
  return fetchOrders({
    sortTime: 'desc',
    segment: segment
  });
};

// Helper function to fetch orders by area
export const fetchOrdersByArea = async (area: string): Promise<OrdersResponse> => {
  return fetchOrders({
    sortTime: 'desc',
    area: area
  });
};

// Fetch Overdue Orders
export const fetchOverdueOrders = async (params: OverdueOrdersQueryParams): Promise<OrdersResponse> => {
  const baseUrl = AM_API_URL;
  
  // Build query string from parameters
  const queryParams = new URLSearchParams();
  
  if (params.start_date) queryParams.append('start_date', params.start_date);
  if (params.end_date) queryParams.append('end_date', params.end_date);
  if (params.sortTime) queryParams.append('sortTime', params.sortTime);
  if (params.agent) queryParams.append('agent', params.agent);
  
  const url = `${baseUrl}/api/order/overdue?${queryParams.toString()}`;
  
  console.log('Fetching overdue orders from:', url);
  console.log('Query params:', queryParams.toString());
  console.log('Params received:', params);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch overdue orders: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};

// Types for Overdue Snapshot API
export interface OverdueSnapshotBreakdown {
  overdue_status: string;
  count: number;
  count_previous_month: number;
  count_change: number;
  count_change_percentage: string;
  total_invoice: number;
  invoice_previous_month: number;
  invoice_change: number;
  invoice_change_percentage: string;
  total_profit: number;
  profit_previous_month: number;
  profit_change: number;
  profit_change_percentage: string;
}

export interface OverdueSnapshotPreviousTotals {
  total_count: number;
  total_invoice: number;
  total_profit: number;
}

export interface OverdueSnapshotTotals {
  total_count: number;
  total_invoice: number;
  total_profit: number;
  previous_totals: OverdueSnapshotPreviousTotals;
  count_change: number;
  count_change_percentage: string;
  invoice_change: number;
  invoice_change_percentage: string;
  profit_change: number;
  profit_change_percentage: string;
}

export interface OverdueSnapshotResponse {
  code: number;
  status: string;
  message: string;
  data: {
    snapshot_month: string;
    previous_month: string;
    totals: OverdueSnapshotTotals;
    breakdown: OverdueSnapshotBreakdown[];
  };
}

export interface OverdueSnapshotQueryParams {
  month: string;
  agent?: string;
}

// Fetch Overdue Snapshot
export const fetchOverdueSnapshot = async (params: OverdueSnapshotQueryParams): Promise<OverdueSnapshotResponse> => {
  const baseUrl = AM_API_URL;
  
  // Build query string from parameters
  const queryParams = new URLSearchParams();
  
  if (params.month) queryParams.append('month', params.month);
  if (params.agent) queryParams.append('agent', params.agent);
  
  const url = `${baseUrl}/api/order/overdue-snapshot?${queryParams.toString()}`;
  
  console.log('Fetching overdue snapshot from:', url);
  console.log('Query params:', queryParams.toString());
  console.log('Params received:', params);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch overdue snapshot: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};

// Types for Overdue Snapshot Monthly API
export interface OverdueSnapshotMonthlyItem {
  snapshot_month: string;
  totals: OverdueSnapshotTotals;
  breakdown: OverdueSnapshotBreakdown[];
}

export interface OverdueSnapshotMonthlyResponse {
  code: number;
  status: string;
  message: string;
  data: OverdueSnapshotMonthlyItem[];
}

export interface OverdueSnapshotMonthlyQueryParams {
  start_month: string; // Format: YYYY-MM
  end_month: string; // Format: YYYY-MM
  agent?: string;
}

// Fetch Overdue Snapshot Monthly
export const fetchOverdueSnapshotMonthly = async (params: OverdueSnapshotMonthlyQueryParams): Promise<OverdueSnapshotMonthlyResponse> => {
  const baseUrl = AM_API_URL;
  
  // Build query string from parameters
  const queryParams = new URLSearchParams();
  
  if (params.start_month) queryParams.append('start_month', params.start_month);
  if (params.end_month) queryParams.append('end_month', params.end_month);
  if (params.agent) queryParams.append('agent', params.agent);
  
  const url = `${baseUrl}/api/order/overdue-snapshot-monthly?${queryParams.toString()}`;
  
  console.log('Fetching overdue snapshot monthly from:', url);
  console.log('Query params:', queryParams.toString());
  console.log('Params received:', params);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch overdue snapshot monthly: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};

// Types for Store Summary API
export interface StoreSummaryItem {
  user_id: string;
  store_name: string;
  reseller_code?: string;
  segment: string;
  area: string;
  agent_name: string;
  phone_number?: string;
  user_status: string;
  business_type?: string;
  payment_status?: string;
  total_invoice?: number;
  total_profit?: number;
}

export interface StoreSummaryResponse {
  code: number;
  status: string;
  message: string;
  data: {
    has_order: StoreSummaryItem[];
    no_order: StoreSummaryItem[];
  };
}

// Fetch Store Summary
export const fetchStoreSummary = async (month: string, agent?: string): Promise<StoreSummaryResponse> => {
  const baseUrl = AM_API_URL;
  
  const queryParams = new URLSearchParams();
  queryParams.append('month', month);
  if (agent) queryParams.append('agent', agent);
  
  const url = `${baseUrl}/api/order/store-summary?${queryParams.toString()}`;
  
  console.log('Fetching store summary from:', url);
  console.log('Month:', month, 'Agent:', agent);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch store summary: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};

// Fetch order details by order code
export const fetchOrderDetail = async (orderCode: string): Promise<OrderDetailResponse> => {
  if (!AM_API_URL) {
    throw new Error('API URL is not configured');
  }

  const url = `${AM_API_URL}/api/order/detail?order_code=${encodeURIComponent(orderCode)}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data: OrderDetailResponse = await response.json();
  return data;
};

// Update payment date for an order
export interface UpdatePaymentDateRequest {
  order_code: string;
  payment_date: string; // Format: YYYY-MM-DD
}

export interface UpdatePaymentDateResponse {
  code: number;
  status: string;
  message: string;
}

export const updateOrderPaymentDate = async (updateData: UpdatePaymentDateRequest): Promise<UpdatePaymentDateResponse> => {
  if (!AM_API_URL) {
    throw new Error('API URL is not configured');
  }

  const url = `${AM_API_URL}/api/order/payment-date`;
  
  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updateData),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data: UpdatePaymentDateResponse = await response.json();
  return data;
};

// Update order item buy prices
export const updateOrderItemBuyPrices = async (updateData: OrderItemUpdateRequest): Promise<OrderItemUpdateResponse> => {
  if (!AM_API_URL) {
    throw new Error('API URL is not configured');
  }

  const url = `${AM_API_URL}/api/order/order-items`;
  
  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updateData),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data: OrderItemUpdateResponse = await response.json();
  return data;
};

// Types for Cash-In API
export interface CashInData {
  paid: {
    paid_total_invoice: number;
    paid_invoice_count: number;
    paid_total_profit: number;
    paid_avg_payment_days: number;
  };
  unpaid: {
    unpaid_total_invoice: number;
    unpaid_invoice_count: number;
    unpaid_total_profit: number;
    unpaid_avg_payment_days: number;
  };
}

export interface CashInResponse {
  code: number;
  status: string;
  message: string;
  data: CashInData;
}

// Types for Cash-In Query Parameters
export interface CashInQueryParams {
  month?: string;
  year?: string;
  agent?: string;
  area?: string;
}

// Fetch Cash-In Data
export const fetchCashInData = async (params: CashInQueryParams): Promise<CashInResponse> => {
  const baseUrl = AM_API_URL;
  
  // Build query string from parameters
  const queryParams = new URLSearchParams();
  
  if (params.month) queryParams.append('month', params.month);
  if (params.year) queryParams.append('year', params.year);
  if (params.agent) queryParams.append('agent', params.agent);
  if (params.area) queryParams.append('area', params.area);
  
  const url = `${baseUrl}/api/order/cash-in?${queryParams.toString()}`;
  
  console.log('Fetching cash-in data from:', url);
  console.log('Query params:', queryParams.toString());
  console.log('Params received:', params);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch cash-in data: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};

// Types for Order Filters API
export interface OrderFiltersData {
  agents: string[];
  areas: string[];
}

export interface OrderFiltersResponse {
  code: number;
  status: string;
  message: string;
  data: OrderFiltersData;
}

// Types for Order Filters Query Parameters
export interface OrderFiltersQueryParams {
  month?: string;
  year?: string;
}

// Fetch Order Filters (Agents and Areas)
export const fetchOrderFilters = async (params: OrderFiltersQueryParams): Promise<OrderFiltersResponse> => {
  const baseUrl = AM_API_URL;
  
  // Build query string from parameters
  const queryParams = new URLSearchParams();
  
  if (params.month) queryParams.append('month', params.month);
  if (params.year) queryParams.append('year', params.year);
  
  const url = `${baseUrl}/api/order/filters?${queryParams.toString()}`;
  
  console.log('Fetching order filters from:', url);
  console.log('Query params:', queryParams.toString());
  console.log('Params received:', params);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch order filters: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};

// Types for Cash-In Monthly API
export interface CashInMonthlyDataItem {
  month: string;
  paid: {
    paid_total_invoice: number;
    paid_invoice_count: number;
    paid_total_profit: number;
    paid_avg_payment_days: number;
  };
  unpaid: {
    unpaid_total_invoice: number;
    unpaid_invoice_count: number;
    unpaid_total_profit: number;
    unpaid_avg_payment_days: number;
  };
}

export interface CashInMonthlyData extends Array<CashInMonthlyDataItem> {}

export interface CashInMonthlyResponse {
  code: number;
  status: string;
  message: string;
  data: CashInMonthlyData;
}

// Types for Cash-In Monthly Query Parameters
export interface CashInMonthlyQueryParams {
  start_month?: string;
  end_month?: string;
  agent?: string;
  area?: string;
}

// Types for Unpaid Overview API
export interface UnpaidOverviewData {
  current: {
    count: number;
    total_invoice: number;
  };
  B2W: {
    count: number;
    total_invoice: number;
  };
  "14DPD": {
    count: number;
    total_invoice: number;
  };
  "30DPD": {
    count: number;
    total_invoice: number;
  };
  "60DPD": {
    count: number;
    total_invoice: number;
  };
  "90DPD": {
    count: number;
    total_invoice: number;
  };
}

export interface UnpaidOverviewResponse {
  code: number;
  status: string;
  message: string;
  data: UnpaidOverviewData;
}

// Types for Unpaid Overview Query Parameters
export interface UnpaidOverviewQueryParams {
  agent?: string;
  area?: string;
}

// Fetch Unpaid Overview Data
export const fetchUnpaidOverview = async (params: UnpaidOverviewQueryParams): Promise<UnpaidOverviewResponse> => {
  const baseUrl = AM_API_URL;
  
  // Build query string from parameters
  const queryParams = new URLSearchParams();
  if (params.agent) queryParams.append('agent', params.agent);
  if (params.area) queryParams.append('area', params.area);
  
  const url = `${baseUrl}/api/order/unpaid-overview?${queryParams.toString()}`;
  
  console.log('Fetching unpaid overview data from:', url);
  console.log('Query params:', queryParams.toString());
  console.log('Params received:', params);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch unpaid overview data: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};

// Fetch Cash-In Monthly Data
export const fetchCashInMonthlyData = async (params: CashInMonthlyQueryParams): Promise<CashInMonthlyResponse> => {
  const baseUrl = AM_API_URL;
  
  // Build query string from parameters
  const queryParams = new URLSearchParams();
  
  if (params.start_month) queryParams.append('start_month', params.start_month);
  if (params.end_month) queryParams.append('end_month', params.end_month);
  if (params.agent) queryParams.append('agent', params.agent);
  if (params.area) queryParams.append('area', params.area);
  
  const url = `${baseUrl}/api/order/cash-in-monthly?${queryParams.toString()}`;
  
  console.log('Fetching cash-in monthly data from:', url);
  console.log('Query params:', queryParams.toString());
  console.log('Params received:', params);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch cash-in monthly data: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};

// Types for Sales Summary API
export interface SalesSummaryData {
  total_invoice: number;
  invoice_count: number;
  avg_payment_days: number;
  total_profit: number;
  margin: number;
  average_profit_day: number;
  average_profit_week: number;
}

export interface SalesSummaryResponse {
  code: number;
  status: string;
  message: string;
  data: SalesSummaryData;
}

// Types for Monthly Summary API
export interface MonthlySummaryData {
  month: string;
  total_invoice: number;
  invoice_count: number;
  avg_payment_days: number;
  total_profit: number;
  margin: number;
  average_profit_day: number;
  average_profit_week: number;
}

export interface MonthlySummaryResponse {
  code: number;
  status: string;
  message: string;
  data: MonthlySummaryData[];
}

// Types for Sales Summary Query Parameters
export interface SalesSummaryQueryParams {
  month?: string;
  agent_name?: string;
  area?: string;
  segment?: string;
  status_payment?: string;
}

// Fetch Sales Summary Data
export const fetchSalesSummary = async (params: SalesSummaryQueryParams): Promise<SalesSummaryResponse> => {
  const baseUrl = AM_API_URL;
  
  // Build query string from parameters
  const queryParams = new URLSearchParams();
  
  if (params.month) queryParams.append('month', params.month);
  if (params.agent_name) queryParams.append('agent_name', params.agent_name);
  if (params.area) queryParams.append('area', params.area);
  if (params.segment) queryParams.append('segment', params.segment);
  if (params.status_payment) queryParams.append('status_payment', params.status_payment);
  
  const url = `${baseUrl}/api/order/summary?${queryParams.toString()}`;
  
  console.log('Fetching sales summary data from:', url);
  console.log('Query params:', queryParams.toString());
  console.log('Params received:', params);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch sales summary data: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};

// Types for Sales Summary Monthly API
export interface SalesSummaryMonthlyDataItem {
  month: string;
  total_invoice: number;
  invoice_count: number;
  avg_payment_days: number;
  total_profit: number;
  margin: number;
}

export interface SalesSummaryMonthlyData extends Array<SalesSummaryMonthlyDataItem> {}

export interface SalesSummaryMonthlyResponse {
  code: number;
  status: string;
  message: string;
  data: SalesSummaryMonthlyData;
}

// Types for Sales Summary Monthly Query Parameters
export interface SalesSummaryMonthlyQueryParams {
  start_month?: string;
  end_month?: string;
  agent_name?: string;
  area?: string;
  segment?: string;
  status_payment?: string;
}

// Fetch Sales Summary Monthly Data
export const fetchSalesSummaryMonthly = async (params: SalesSummaryMonthlyQueryParams): Promise<SalesSummaryMonthlyResponse> => {
  const baseUrl = AM_API_URL;
  
  // Build query string from parameters
  const queryParams = new URLSearchParams();
  
  if (params.start_month) queryParams.append('start_month', params.start_month);
  if (params.end_month) queryParams.append('end_month', params.end_month);
  if (params.agent_name) queryParams.append('agent_name', params.agent_name);
  if (params.area) queryParams.append('area', params.area);
  if (params.segment) queryParams.append('segment', params.segment);
  if (params.status_payment) queryParams.append('status_payment', params.status_payment);
  
  const url = `${baseUrl}/api/order/summary-monthly?${queryParams.toString()}`;
  
  console.log('Fetching sales summary monthly data from:', url);
  console.log('Query params:', queryParams.toString());
  console.log('Params received:', params);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch sales summary monthly data: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};

// Types for Total Stores API
export interface TotalStoresData {
  total_stores: number;
  active_stores: number;
  activation_rate: number;
}

export interface TotalStoresResponse {
  code: number;
  status: string;
  message: string;
  data: TotalStoresData;
}

// Types for Total Stores Query Parameters
export interface TotalStoresQueryParams {
  month?: string;
  agent_name?: string;
  area?: string;
  segment?: string;
  status_payment?: string;
}

// Fetch Total Stores Data
export const fetchTotalStores = async (params: TotalStoresQueryParams): Promise<TotalStoresResponse> => {
  const baseUrl = AM_API_URL;
  
  // Build query string from parameters
  const queryParams = new URLSearchParams();
  
  if (params.month) queryParams.append('month', params.month);
  if (params.agent_name) queryParams.append('agent_name', params.agent_name);
  if (params.area) queryParams.append('area', params.area);
  if (params.segment) queryParams.append('segment', params.segment);
  if (params.status_payment) queryParams.append('status_payment', params.status_payment);
  
  const url = `${baseUrl}/api/order/total-stores?${queryParams.toString()}`;
  
  console.log('Fetching total stores data from:', url);
  console.log('Query params:', queryParams.toString());
  console.log('Params received:', params);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch total stores data: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};

// Types for Total Stores Monthly API
export interface TotalStoresMonthlyDataItem {
  month: string;
  total_stores: number;
  active_stores: number;
  activation_rate: number;
}

export interface TotalStoresMonthlyData extends Array<TotalStoresMonthlyDataItem> {}

export interface TotalStoresMonthlyResponse {
  code: number;
  status: string;
  message: string;
  data: TotalStoresMonthlyData;
}

// Types for Total Stores Monthly Query Parameters
export interface TotalStoresMonthlyQueryParams {
  start_month?: string;
  end_month?: string;
  agent_name?: string;
  area?: string;
  segment?: string;
  status_payment?: string;
}

// Fetch Total Stores Monthly Data
export const fetchTotalStoresMonthly = async (
  params: TotalStoresMonthlyQueryParams,
  signal?: AbortSignal
): Promise<TotalStoresMonthlyResponse> => {
  const baseUrl = AM_API_URL;
  
  // Build query string from parameters
  const queryParams = new URLSearchParams();
  
  if (params.start_month) queryParams.append('start_month', params.start_month);
  if (params.end_month) queryParams.append('end_month', params.end_month);
  if (params.agent_name) queryParams.append('agent_name', params.agent_name);
  if (params.area) queryParams.append('area', params.area);
  if (params.segment) queryParams.append('segment', params.segment);
  if (params.status_payment) queryParams.append('status_payment', params.status_payment);
  
  const url = `${baseUrl}/api/order/total-stores-monthly?${queryParams.toString()}`;
  
  console.log('Fetching total stores monthly data from:', url);
  console.log('Query params:', queryParams.toString());
  console.log('Params received:', params);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    signal, // Pass abort signal to fetch
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch total stores monthly data: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};

// Orders Pagination API
export interface OrderPaginationData {
  order_id: string;
  order_code: string;
  user_id: string;
  reseller_name: string;
  store_name: string;
  segment: string;
  area: string;
  reseller_code: string;
  phone_number: string;
  status_order: string;
  status_payment: string;
  payment_type: string;
  order_date: string;
  faktur_date: string | null;
  payment_due_date: string;
  process_hub: string;
  is_cross: number;
  order_type: string;
  month: string;
  payment_date: string | null;
  total_invoice: number;
  agent_name: string;
  admin_name: string;
  business_type: string;
  sub_business_type: string;
  profit: number;
  overdue_status: string;
}

export interface OrderPaginationMetadata {
  total_orders: number;
  total_invoice: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface OrderPaginationResponse {
  code: number;
  status: string;
  message: string;
  data: {
    data: OrderPaginationData[];
    metadata: OrderPaginationMetadata;
  };
}

export interface OrderPaginationQueryParams {
  payment?: string;
  sortTime?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  month?: string;
  agent_name?: string;
  area?: string;
  status_payment?: string;
}

// Fetch Orders Data (without pagination)
export const fetchOrdersData = async (params: OrderPaginationQueryParams): Promise<{ data: OrderPaginationData[] }> => {
  const baseUrl = AM_API_URL;
  
  // Build query string from parameters
  const queryParams = new URLSearchParams();
  
  if (params.payment) queryParams.append('payment', params.payment);
  if (params.sortTime) queryParams.append('sortTime', params.sortTime);
  if (params.month) queryParams.append('month', params.month);
  if (params.agent_name) queryParams.append('agent_name', params.agent_name);
  if (params.area) queryParams.append('area', params.area);
  if (params.status_payment) queryParams.append('status_payment', params.status_payment);
  
  const url = `${baseUrl}/api/order?${queryParams.toString()}`;
  
  console.log('Fetching orders data from:', url);
  console.log('Query params:', queryParams.toString());
  console.log('Params received:', params);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch orders data: ${response.status} ${response.statusText}`);
  }
  
  const result = await response.json();
  return { data: result.data || result };
};

// Fetch Updated Sales Summary (with new fields)
export const fetchUpdatedSalesSummary = async (params: SalesSummaryQueryParams): Promise<SalesSummaryResponse> => {
  const baseUrl = AM_API_URL;
  
  // Build query string from parameters
  const queryParams = new URLSearchParams();
  
  if (params.month) queryParams.append('month', params.month);
  if (params.agent_name) queryParams.append('agent_name', params.agent_name);
  if (params.area) queryParams.append('area', params.area);
  if (params.segment) queryParams.append('segment', params.segment);
  if (params.status_payment) queryParams.append('status_payment', params.status_payment);
  
  const url = `${baseUrl}/api/order/summary?${queryParams.toString()}`;
  
  console.log('Fetching updated sales summary data from:', url);
  console.log('Query params:', queryParams.toString());
  console.log('Params received:', params);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch updated sales summary data: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};

// Fetch Updated Monthly Summary (with new fields)
export const fetchUpdatedSalesSummaryMonthly = async (params: SalesSummaryMonthlyQueryParams): Promise<MonthlySummaryResponse> => {
  const baseUrl = AM_API_URL;
  
  // Build query string from parameters
  const queryParams = new URLSearchParams();
  
  if (params.start_month) queryParams.append('start_month', params.start_month);
  if (params.end_month) queryParams.append('end_month', params.end_month);
  if (params.agent_name) queryParams.append('agent_name', params.agent_name);
  if (params.area) queryParams.append('area', params.area);
  if (params.segment) queryParams.append('segment', params.segment);
  if (params.status_payment) queryParams.append('status_payment', params.status_payment);
  
  const url = `${baseUrl}/api/order/summary-monthly?${queryParams.toString()}`;
  
  console.log('Fetching updated sales summary monthly data from:', url);
  console.log('Query params:', queryParams.toString());
  console.log('Params received:', params);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch updated sales summary monthly data: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};

// Types for NOO (Number of Orders) API
export interface NOOOrder {
  order_id: string;
  order_code: string;
  user_id: string;
  reseller_name: string;
  store_name: string;
  segment: string;
  area: string;
  reseller_code: string;
  phone_number: string;
  status_order: string;
  status_payment: string;
  payment_type: string;
  order_date: string;
  faktur_date: string | null;
  process_hub: string;
  is_cross: number;
  month: string;
  order_type: string;
  payment_date: string | null;
  total_invoice: number;
  total_pembayaran: number;
  business_type: string;
  sub_business_type: string;
  agent_name: string;
  admin_name: string;
  profit: number;
}

export interface NOOResponse {
  code: number;
  status: string;
  message: string;
  data: NOOOrder[];
}

// Types for NOO Query Parameters
export interface NOOQueryParams {
  month?: string;
  sortTime?: 'asc' | 'desc';
  agent?: string;
  area?: string;
  status_payment?: string;
}

// Fetch NOO Data
export const fetchNOOData = async (params: NOOQueryParams): Promise<NOOResponse> => {
  const baseUrl = AM_API_URL;
  
  // Build query string from parameters
  const queryParams = new URLSearchParams();
  
  if (params.month) queryParams.append('month', params.month);
  if (params.sortTime) queryParams.append('sortTime', "desc");
  if (params.agent) queryParams.append('agent', params.agent);
  if (params.area) queryParams.append('area', params.area);
  if (params.status_payment) queryParams.append('status_payment', params.status_payment);
  
  const url = `${baseUrl}/api/order/stores-order-once?${queryParams.toString()}`;
  
  console.log('Fetching NOO data from:', url);
  console.log('Query params:', queryParams.toString());
  console.log('Params received:', params);
  console.log('Month parameter being sent:', params.month);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch NOO data: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};

// Types for Compare API
export interface CompareData {
  W1_total_invoice: number;
  W1_total_profit: number;
  W1_invoice_count: number;
  W1_margin: number;
  W2_total_invoice: number;
  W2_total_profit: number;
  W2_invoice_count: number;
  W2_margin: number;
  W3_total_invoice: number;
  W3_total_profit: number;
  W3_invoice_count: number;
  W3_margin: number;
  W4_total_invoice: number;
  W4_total_profit: number;
  W4_invoice_count: number;
  W4_margin: number;
  W5_total_invoice?: number;
  W5_total_profit?: number;
  W5_invoice_count?: number;
  W5_margin?: number;
  total_invoice: number;
  total_profit: number;
  total_invoice_count: number;
  total_margin: number;
}

export interface CompareResponse {
  code: number;
  status: string;
  message: string;
  data: CompareData;
}

// Types for Compare Query Parameters
export interface CompareQueryParams {
  month: string;
  agent_name?: string;
}

// Fetch Compare Data
export const fetchCompareData = async (params: CompareQueryParams): Promise<CompareResponse> => {
  const searchParams = new URLSearchParams();
  
  if (params.month) {
    searchParams.append('month', params.month);
  }
  
  if (params.agent_name) {
    searchParams.append('agent_name', params.agent_name);
  }
  
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/order/compare?${searchParams.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch compare data: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};

// Types for Product Summary API
export interface ProductVariant {
  variant_name: string;
  average_buy_price: number;
  average_sale_price: number;
  total_invoice: number;
  total_quantity: number;
  profit?: number;
}

export interface ProductSummaryData {
  product_id: string;
  product_name: string;
  sku: string;
  brands: string;
  type_category: string;
  sub_category: string;
  total_invoice?: number;
  average_buy_price?: number;
  order_count?: number;
  total_quantity?: number;
  active_stores?: number;
  profit?: number;
  variants?: ProductVariant[];
}

export interface ProductSummaryResponse {
  code: number;
  status: string;
  message: string;
  data: ProductSummaryData[];
}

// Types for Product Summary Query Parameters
export interface ProductSummaryQueryParams {
  month?: string;
  agent?: string;
  area?: string;
  segment?: string;
}

// Fetch Product Summary Data
export const fetchProductSummary = async (params: ProductSummaryQueryParams): Promise<ProductSummaryResponse> => {
  const baseUrl = AM_API_URL;
  
  // Build query string from parameters
  const queryParams = new URLSearchParams();
  
  if (params.month) queryParams.append('month', params.month);
  if (params.agent) queryParams.append('agent_name', params.agent);
  if (params.area) queryParams.append('area', params.area);
  if (params.segment) queryParams.append('segment', params.segment);
  
  const url = `${baseUrl}/api/product/summary?${queryParams.toString()}`;
  
  console.log('Fetching product summary data from:', url);
  console.log('Query params:', queryParams.toString());
  console.log('Params received:', params);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch product summary data: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};

// Types for Product Type Monthly API
export interface ProductTypeMonthlyData {
  total_invoice: number;
  total_profit: number;
}

export interface ProductTypeMonthlyResponse {
  code: number;
  status: string;
  message: string;
  data: Record<string, Record<string, ProductTypeMonthlyData>>;
}

// Types for Product Type Monthly Query Parameters
export interface ProductTypeMonthlyQueryParams {
  start_month?: string;
  end_month?: string;
  agent_name?: string;
  area?: string;
  segment?: string;
}

// Fetch Product Type Monthly Data
export const fetchProductTypeMonthly = async (params: ProductTypeMonthlyQueryParams): Promise<ProductTypeMonthlyResponse> => {
  const baseUrl = AM_API_URL;
  
  // Build query string from parameters
  const queryParams = new URLSearchParams();
  
  if (params.start_month) queryParams.append('start_month', params.start_month);
  if (params.end_month) queryParams.append('end_month', params.end_month);
  if (params.agent_name) queryParams.append('agent_name', params.agent_name);
  if (params.area) queryParams.append('area', params.area);
  if (params.segment) queryParams.append('segment', params.segment);
  
  const url = `${baseUrl}/api/product/type?${queryParams.toString()}`;
  
  console.log('Fetching product type monthly data from:', url);
  console.log('Query params:', queryParams.toString());
  console.log('Params received:', params);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch product type monthly data: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};

// Types for Product Category Monthly Data
export interface ProductCategoryMonthlyData {
  total_invoice: number;
  total_profit: number;
}

export interface ProductCategoryMonthlyResponse {
  code: number;
  status: string;
  message: string;
  data: Record<string, Record<string, ProductCategoryMonthlyData>>;
}

// Types for Product Category Monthly Query Parameters
export interface ProductCategoryMonthlyQueryParams {
  start_month?: string;
  end_month?: string;
  agent_name?: string;
  area?: string;
  segment?: string;
}

// Fetch Product Category Monthly Data
export const fetchProductCategory = async (params: ProductCategoryMonthlyQueryParams): Promise<ProductCategoryMonthlyResponse> => {
  const baseUrl = AM_API_URL;
  
  // Build query string from parameters
  const queryParams = new URLSearchParams();
  
  if (params.start_month) queryParams.append('start_month', params.start_month);
  if (params.end_month) queryParams.append('end_month', params.end_month);
  if (params.agent_name) queryParams.append('agent_name', params.agent_name);
  if (params.area) queryParams.append('area', params.area);
  if (params.segment) queryParams.append('segment', params.segment);
  
  const url = `${baseUrl}/api/product/category?${queryParams.toString()}`;
  
  console.log('Fetching product category monthly data from:', url);
  console.log('Query params:', queryParams.toString());
  console.log('Params received:', params);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch product category monthly data: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};

// Types for Full Orders Query Parameters
export interface FullOrdersQueryParams {
  sortTime?: 'asc' | 'desc';
  month?: string;
  payment_month?: string;
  agent?: string;
  segment?: string;
  area?: string;
  status_payment?: string;
}

// Fetch Full Orders (with detail_order)
export const fetchFullOrders = async (params: FullOrdersQueryParams): Promise<FullOrdersResponse> => {
  const baseUrl = AM_API_URL;
  
  // Build query string from parameters
  const queryParams = new URLSearchParams();
  
  if (params.sortTime) queryParams.append('sortTime', params.sortTime);
  if (params.month) queryParams.append('month', params.month);
  if (params.payment_month) queryParams.append('payment_month', params.payment_month);
  if (params.agent) queryParams.append('agent', params.agent);
  if (params.segment) queryParams.append('segment', params.segment);
  if (params.area) queryParams.append('area', params.area);
  if (params.status_payment) queryParams.append('status_payment', params.status_payment);
  
  const url = `${baseUrl}/api/order/dashboard?${queryParams.toString()}`;
  
  console.log('Fetching full orders from:', url);
  console.log('Query params:', queryParams.toString());
  console.log('Params received:', params);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch full orders: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};