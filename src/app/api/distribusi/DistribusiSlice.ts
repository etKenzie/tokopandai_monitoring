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

export interface OrdersResponse {
  code: number;
  status: string;
  message: string;
  data: Order[];
}

// Types for Order Query Parameters
export interface OrderQueryParams {
  sortTime?: 'asc' | 'desc';
  payment?: string;
  month?: string;
  agent?: string;
  segment?: string;
  area?: string;
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
