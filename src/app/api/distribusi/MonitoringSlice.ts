// Types for Visit API
export interface Visit {
  id: string;
  sales_id: string;
  visit_date: string;
  outlet_new: string | null;
  outlet_id: string | null;
  outlet_name: string | null;
  outlet_pic_name: string;
  outlet_bagian_pic: string;
  outlet_number_pic: string;
  outlet_address: string;
  check_in_time: string | null;
  check_out_time: string | null;
  check_in_lat: number | null;
  check_in_lng: number | null;
  check_out_lat: number | null;
  check_out_lng: number | null;
  visit_purpose: string;
  visit_purpose_note: string | null;
  photo_display_url: string | null;
  photo_selfie_url: string | null;
  signature_url: string | null;
  outlet_feedback: string | null;
  notes: string | null;
  need_follow_up: number | null;
  follow_up_type: string | null;
  follow_up_date: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  agent_name: string;
}

export interface VisitsResponse {
  code: number;
  status: string;
  message: string;
  data: {
    data: Visit[];
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

// Types for Visit Query Parameters
export interface VisitQueryParams {
  sortTime?: 'asc' | 'desc';
  visit_status?: string;
  month?: string;
  agent?: string;
  segment?: string;
  area?: string;
  visit_type?: string;
}

// Get API URL from environment variable with fallback
const AM_API_URL = process.env.NEXT_PUBLIC_API_URL;

// Fetch Visits
export const fetchVisits = async (params: VisitQueryParams): Promise<VisitsResponse> => {
  const baseUrl = AM_API_URL;
  
  // Build query string from parameters
  const queryParams = new URLSearchParams();
  
  if (params.sortTime) queryParams.append('sortTime', params.sortTime);
  if (params.visit_status) queryParams.append('visit_status', params.visit_status);
  if (params.month) queryParams.append('month', params.month);
  if (params.agent) queryParams.append('agent', params.agent);
  if (params.segment) queryParams.append('segment', params.segment);
  if (params.area) queryParams.append('area', params.area);
  if (params.visit_type) queryParams.append('visit_type', params.visit_type);
  
  const url = `${baseUrl}/api/monitoring/visit?${queryParams.toString()}`;
  
  console.log('Fetching visits from:', url);
  console.log('Query params:', queryParams.toString());
  console.log('Params received:', params);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch visits: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};

// Helper function to fetch visits with default parameters
export const fetchVisitsDefault = async (): Promise<VisitsResponse> => {
  return fetchVisits({
    sortTime: 'desc'
  });
};

// Helper function to fetch visits by specific status
export const fetchVisitsByStatus = async (visitStatus: string): Promise<VisitsResponse> => {
  return fetchVisits({
    sortTime: 'desc',
    visit_status: visitStatus
  });
};

// Helper function to fetch visits by month
export const fetchVisitsByMonth = async (month: string): Promise<VisitsResponse> => {
  return fetchVisits({
    sortTime: 'desc',
    month: month
  });
};

// Helper function to fetch visits by agent
export const fetchVisitsByAgent = async (agent: string): Promise<VisitsResponse> => {
  return fetchVisits({
    sortTime: 'desc',
    agent: agent
  });
};

// Helper function to fetch visits by segment
export const fetchVisitsBySegment = async (segment: string): Promise<VisitsResponse> => {
  return fetchVisits({
    sortTime: 'desc',
    segment: segment
  });
};

// Helper function to fetch visits by area
export const fetchVisitsByArea = async (area: string): Promise<VisitsResponse> => {
  return fetchVisits({
    sortTime: 'desc',
    area: area
  });
};

// Helper function to fetch visits by type
export const fetchVisitsByType = async (visitType: string): Promise<VisitsResponse> => {
  return fetchVisits({
    sortTime: 'desc',
    visit_type: visitType
  });
};

// Types for Visit Summary API
export interface VisitSummaryData {
  total_visits: number;
  completed_visits: number;
  pending_visits: number;
  cancelled_visits: number;
  visits_by_type: {
    [key: string]: number;
  };
  visits_by_agent: {
    [key: string]: number;
  };
  visits_by_area: {
    [key: string]: number;
  };
}

export interface VisitSummaryResponse {
  code: number;
  status: string;
  message: string;
  data: VisitSummaryData;
}

// Types for Visit Summary Query Parameters
export interface VisitSummaryQueryParams {
  month?: string;
  year?: string;
  agent?: string;
  area?: string;
  visit_type?: string;
}

// Fetch Visit Summary Data
export const fetchVisitSummary = async (params: VisitSummaryQueryParams): Promise<VisitSummaryResponse> => {
  const baseUrl = AM_API_URL;
  
  // Build query string from parameters
  const queryParams = new URLSearchParams();
  
  if (params.month) queryParams.append('month', params.month);
  if (params.year) queryParams.append('year', params.year);
  if (params.agent) queryParams.append('agent', params.agent);
  if (params.area) queryParams.append('area', params.area);
  if (params.visit_type) queryParams.append('visit_type', params.visit_type);
  
  const url = `${baseUrl}/api/monitoring/visit/summary?${queryParams.toString()}`;
  
  console.log('Fetching visit summary from:', url);
  console.log('Query params:', queryParams.toString());
  console.log('Params received:', params);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch visit summary: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};

// Types for Complaint API
export interface Complaint {
  id: number;
  order_id: string;
  product_id: string;
  alasan: string;
  file: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string | null;
  deleted_by: string | null;
  order_code: string;
  product_name: string;
  product_sku: string;
}

export interface ComplaintsResponse {
  code: number;
  status: string;
  message: string;
  data: {
    data: Complaint[];
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

// Types for Complaint Query Parameters
export interface ComplaintQueryParams {
  sortTime?: 'asc' | 'desc';
  alasan?: string;
  month?: string;
  year?: string;
  order_code?: string;
  product_name?: string;
}

// Fetch Complaints
export const fetchComplaints = async (params: ComplaintQueryParams): Promise<ComplaintsResponse> => {
  const baseUrl = AM_API_URL;
  
  // Build query string from parameters
  const queryParams = new URLSearchParams();
  
  if (params.sortTime) queryParams.append('sortTime', params.sortTime);
  if (params.alasan) queryParams.append('alasan', params.alasan);
  if (params.month) queryParams.append('month', params.month);
  if (params.year) queryParams.append('year', params.year);
  if (params.order_code) queryParams.append('order_code', params.order_code);
  if (params.product_name) queryParams.append('product_name', params.product_name);
  
  const url = `${baseUrl}/api/monitoring/complaint?${queryParams.toString()}`;
  
  console.log('Fetching complaints from:', url);
  console.log('Query params:', queryParams.toString());
  console.log('Params received:', params);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch complaints: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};

// Helper function to fetch complaints with default parameters
export const fetchComplaintsDefault = async (): Promise<ComplaintsResponse> => {
  return fetchComplaints({
    sortTime: 'desc'
  });
};

// Helper function to fetch complaints by reason
export const fetchComplaintsByReason = async (alasan: string): Promise<ComplaintsResponse> => {
  return fetchComplaints({
    sortTime: 'desc',
    alasan: alasan
  });
};

// Helper function to fetch complaints by month
export const fetchComplaintsByMonth = async (month: string): Promise<ComplaintsResponse> => {
  return fetchComplaints({
    sortTime: 'desc',
    month: month
  });
};

// Helper function to fetch complaints by year
export const fetchComplaintsByYear = async (year: string): Promise<ComplaintsResponse> => {
  return fetchComplaints({
    sortTime: 'desc',
    year: year
  });
};

// Types for Complaint Summary API
export interface ComplaintSummaryData {
  total_complaints: number;
  complaints_by_reason: {
    [key: string]: number;
  };
  complaints_by_month: {
    [key: string]: number;
  };
  complaints_by_product: {
    [key: string]: number;
  };
}

export interface ComplaintSummaryResponse {
  code: number;
  status: string;
  message: string;
  data: ComplaintSummaryData;
}

// Types for Complaint Summary Query Parameters
export interface ComplaintSummaryQueryParams {
  month?: string;
  year?: string;
  alasan?: string;
}

// Fetch Complaint Summary Data
export const fetchComplaintSummary = async (params: ComplaintSummaryQueryParams): Promise<ComplaintSummaryResponse> => {
  const baseUrl = AM_API_URL;
  
  // Build query string from parameters
  const queryParams = new URLSearchParams();
  
  if (params.month) queryParams.append('month', params.month);
  if (params.year) queryParams.append('year', params.year);
  if (params.alasan) queryParams.append('alasan', params.alasan);
  
  const url = `${baseUrl}/api/monitoring/complaint/summary?${queryParams.toString()}`;
  
  console.log('Fetching complaint summary from:', url);
  console.log('Query params:', queryParams.toString());
  console.log('Params received:', params);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch complaint summary: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};
