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
