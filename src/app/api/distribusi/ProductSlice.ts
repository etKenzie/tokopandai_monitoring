// Types for Product API
export interface Product {
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
}

export interface ProductOrder {
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
  total_invoice: string;
  agent_name: string;
  admin_name: string;
  business_type: string;
  sub_business_type: string;
  profit: number;
  overdue_status: string;
}

export interface ProductOrdersResponse {
  code: number;
  status: string;
  message: string;
  data: ProductOrder[];
}

// Get API URL from environment variable with fallback
const AM_API_URL = process.env.NEXT_PUBLIC_API_URL;

// Fetch Product Orders by product_id
export const fetchProductOrders = async (productId: string): Promise<ProductOrdersResponse> => {
  const baseUrl = AM_API_URL;
  
  const queryParams = new URLSearchParams();
  queryParams.append('product_id', productId);
  
  const url = `${baseUrl}/api/product/item?${queryParams.toString()}`;
  
  console.log('Fetching product orders from:', url);
  console.log('Product ID:', productId);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch product orders: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};
