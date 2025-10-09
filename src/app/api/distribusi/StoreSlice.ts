// Types for Store API
export interface Store {
  user_id: string;
  reseller_name: string;
  store_name: string;
  first_order_date: string;
  first_order_month: string;
  user_status: string;
  segment: string;
  areas: string;
  agent_name: string;
  profit_score: number;
  "3_month_profit": number;
  owed_score: number;
  activity_score: number;
  active_months: number;
  payment_habits_score: number;
  final_score: number;
  order_this_year: number;
  three_month_profit: number;
}

export interface StoresResponse {
  code: number;
  status: string;
  message: string;
  data: Store[];
}

// Types for Store Query Parameters
export interface StoreQueryParams {
  agent_name?: string;
  areas?: string;
  segment?: string;
  user_status?: string;
  interval_months?: number;
}

// Get API URL from environment variable with fallback
const AM_API_URL = process.env.NEXT_PUBLIC_API_URL;

// Fetch Stores
export const fetchStores = async (params: StoreQueryParams): Promise<StoresResponse> => {
  const baseUrl = AM_API_URL;
  
  // Build query string from parameters
  const queryParams = new URLSearchParams();
  
  if (params.agent_name) queryParams.append('agent_name', params.agent_name);
  if (params.areas) queryParams.append('areas', params.areas);
  if (params.segment) queryParams.append('segment', params.segment);
  if (params.user_status) queryParams.append('user_status', params.user_status);
  if (params.interval_months) queryParams.append('interval_months', params.interval_months.toString());
  
  const url = `${baseUrl}/api/store?${queryParams.toString()}`;
  
  console.log('Fetching stores from:', url);
  console.log('Query params:', queryParams.toString());
  console.log('Params received:', params);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch stores: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};

// Helper function to fetch stores with default parameters
export const fetchStoresDefault = async (): Promise<StoresResponse> => {
  return fetchStores({});
};

// Helper function to fetch stores by agent
export const fetchStoresByAgent = async (agentName: string): Promise<StoresResponse> => {
  return fetchStores({
    agent_name: agentName
  });
};

// Helper function to fetch stores by area
export const fetchStoresByArea = async (area: string): Promise<StoresResponse> => {
  return fetchStores({
    areas: area
  });
};

// Helper function to fetch stores by segment
export const fetchStoresBySegment = async (segment: string): Promise<StoresResponse> => {
  return fetchStores({
    segment: segment
  });
};

// Helper function to fetch stores by user status
export const fetchStoresByUserStatus = async (userStatus: string): Promise<StoresResponse> => {
  return fetchStores({
    user_status: userStatus
  });
};

// Types for Store Orders API
export interface StoreOrder {
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
  overdue_status: string | null;
}

export interface StoreOrdersResponse {
  code: number;
  status: string;
  message: string;
  data: StoreOrder[];
}

// Fetch Store Orders by user_id
export const fetchStoreOrders = async (userId: string, intervalMonths?: number): Promise<StoreOrdersResponse> => {
  const baseUrl = AM_API_URL;
  
  const queryParams = new URLSearchParams();
  queryParams.append('user_id', userId);
  if (intervalMonths) {
    queryParams.append('interval_months', intervalMonths.toString());
  }
  
  const url = `${baseUrl}/api/store/orders?${queryParams.toString()}`;
  
  console.log('Fetching store orders from:', url);
  console.log('User ID:', userId);
  console.log('Interval Months:', intervalMonths);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch store orders: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};

// Types for Store Products API
export interface StoreProduct {
  product_id: string;
  product_name: string;
  sku: string;
  brands: string;
  type_category: string;
  sub_category: string;
  total_invoice: number;
  average_buy_price: number;
  order_count: number;
  total_quantity: number;
  active_stores: number;
  profit: number;
}

export interface StoreProductsResponse {
  code: number;
  status: string;
  message: string;
  data: StoreProduct[];
}

// Fetch Store Products by user_id
export const fetchStoreProducts = async (userId: string, intervalMonths?: number): Promise<StoreProductsResponse> => {
  const baseUrl = AM_API_URL;
  
  const queryParams = new URLSearchParams();
  queryParams.append('user_id', userId);
  if (intervalMonths) {
    queryParams.append('interval_months', intervalMonths.toString());
  }
  
  const url = `${baseUrl}/api/store/products?${queryParams.toString()}`;
  
  console.log('Fetching store products from:', url);
  console.log('User ID:', userId);
  console.log('Interval Months:', intervalMonths);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch store products: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};