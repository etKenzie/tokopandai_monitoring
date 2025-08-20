// Types for the API response
export interface Karyawan {
  id_karyawan: number;
  status: string;
  loan_kasbon_eligible: number;
  klient: string;
}

export interface KaryawanResponse {
  status: string;
  count: number;
  results: Karyawan[];
}

// Types for Kasbon Filters API
export interface KasbonFilters {
  employers: string[];
  placements: string[];
  projects: string[];
}

export interface KasbonFiltersResponse {
  status: string;
  filters: KasbonFilters;
}

// Types for Kasbon Summary API
export interface KasbonSummary {
  total_eligible_employees: number;
  total_processed_kasbon_requests: number;
  total_pending_kasbon_requests: number;
  total_first_borrow: number;
  total_approved_requests: number;
  total_rejected_requests: number;
  total_disbursed_amount: number;
  total_unique_requests: number;
  average_disbursed_amount: number;
  approval_rate: number;
  average_approval_time: number;
  penetration_rate: number;
  message: string | null;
}

export interface KasbonSummaryResponse {
  status: string;
  total_eligible_employees: number;
  total_processed_kasbon_requests: number;
  total_pending_kasbon_requests: number;
  total_first_borrow: number;
  total_approved_requests: number;
  total_rejected_requests: number;
  total_disbursed_amount: number;
  total_unique_requests: number;
  average_disbursed_amount: number;
  approval_rate: number;
  average_approval_time: number;
  penetration_rate: number;
  message: string | null;
}

// Types for Loan Fees API
export interface KasbonLoanFees {
  total_expected_admin_fee: number;
  expected_loans_count: number;
  total_collected_admin_fee: number;
  collected_loans_count: number;
  total_failed_payment: number;
  admin_fee_profit: number;
  message: string | null;
}

export interface KasbonLoanFeesResponse {
  status: string;
  total_expected_admin_fee: number;
  expected_loans_count: number;
  total_collected_admin_fee: number;
  collected_loans_count: number;
  total_failed_payment: number;
  admin_fee_profit: number;
  message: string | null;
}

// Types for Summary Query Parameters
export interface KasbonSummaryParams {
  employer?: string;
  sourced_to?: string;
  project?: string;
  month?: string;
  year?: string;
}

// Types for Loan Fees Query Parameters
export interface KasbonLoanFeesParams {
  sourced_to?: string;
  project?: string;
  id_karyawan?: string;
  month?: string;
  year?: string;
}

// Types for Loan Fees Monthly API
export interface KasbonLoanFeesMonthlyData {
  total_expected_admin_fee: number;
  expected_loans_count: number;
  total_collected_admin_fee: number;
  collected_loans_count: number;
  total_failed_payment: number;
  admin_fee_profit: number;
}

export interface KasbonLoanFeesMonthlyResponse {
  status: string;
  monthly_data: Record<string, KasbonLoanFeesMonthlyData>;
  message: string | null;
}

// Types for Loan Fees Monthly Query Parameters
export interface KasbonLoanFeesMonthlyParams {
  employer?: string;
  sourced_to?: string;
  project?: string;
  id_karyawan?: string;
  start_date?: string;
  end_date?: string;
}

import { config } from '../../../utils/config';

// API service functions
export const fetchKaryawan = async (clientId?: string): Promise<KaryawanResponse> => {
  const baseUrl = config.AM_API_URL;
  const url = clientId 
    ? `${baseUrl}/karyawan?klient=${clientId}`
    : `${baseUrl}/karyawan`;
  
  console.log('Fetching from:', url);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch karyawan data: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};

export const fetchKaryawanByClient = async (clientId: string): Promise<KaryawanResponse> => {
  return fetchKaryawan(clientId);
};

// Fetch Kasbon Filters
export const fetchKasbonFilters = async (employer?: string, placement?: string): Promise<KasbonFiltersResponse> => {
  const baseUrl = config.AM_API_URL;
  
  // Build query string from parameters
  const queryParams = new URLSearchParams();
  
  if (employer) queryParams.append('employer', employer);
  if (placement) queryParams.append('placement', placement);
  
  const url = queryParams.toString() 
    ? `${baseUrl}/kasbon/filters?${queryParams.toString()}`
    : `${baseUrl}/kasbon/filters`;
  
  console.log('Fetching kasbon filters from:', url);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch kasbon filters: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};

// Fetch Kasbon Summary
export const fetchKasbonSummary = async (params: KasbonSummaryParams): Promise<KasbonSummaryResponse> => {
  const baseUrl = config.AM_API_URL;
  
  // Build query string from parameters
  const queryParams = new URLSearchParams();
  
  if (params.employer) queryParams.append('employer', params.employer);
  if (params.sourced_to) queryParams.append('sourced_to', params.sourced_to);
  if (params.project) queryParams.append('project', params.project);
  if (params.month) queryParams.append('month', params.month);
  if (params.year) queryParams.append('year', params.year);
  
  const url = `${baseUrl}/kasbon/summary?${queryParams.toString()}`;
  
  console.log('Fetching kasbon summary from:', url);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch kasbon summary: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};

// Fetch Kasbon Loan Fees
export const fetchKasbonLoanFees = async (params: KasbonLoanFeesParams): Promise<KasbonLoanFeesResponse> => {
  const baseUrl = config.AM_API_URL;
  
  // Build query string from parameters
  const queryParams = new URLSearchParams();
  
  if (params.sourced_to) queryParams.append('sourced_to', params.sourced_to);
  if (params.project) queryParams.append('project', params.project);
  if (params.id_karyawan) queryParams.append('id_karyawan', params.id_karyawan);
  if (params.month) queryParams.append('month', params.month);
  if (params.year) queryParams.append('year', params.year);
  
  const url = `${baseUrl}/kasbon/loan-fees?${queryParams.toString()}`;
  
  console.log('Fetching kasbon loan fees from:', url);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch kasbon loan fees: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};

// Fetch Kasbon Loan Fees Monthly
export const fetchKasbonLoanFeesMonthly = async (params: KasbonLoanFeesMonthlyParams): Promise<KasbonLoanFeesMonthlyResponse> => {
  const baseUrl = config.AM_API_URL;
  
  // Build query string from parameters
  const queryParams = new URLSearchParams();
  
  if (params.employer) queryParams.append('employer', params.employer);
  if (params.sourced_to) queryParams.append('sourced_to', params.sourced_to);
  if (params.project) queryParams.append('project', params.project);
  if (params.id_karyawan) queryParams.append('id_karyawan', params.id_karyawan);
  if (params.start_date) queryParams.append('start_date', params.start_date);
  if (params.end_date) queryParams.append('end_date', params.end_date);
  
  const url = `${baseUrl}/kasbon/loan-fees-monthly?${queryParams.toString()}`;
  
  console.log('Fetching kasbon loan fees monthly from:', url);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch kasbon loan fees monthly: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};

// Helper function to fetch multiple summaries for different employers
export const fetchMultipleKasbonSummaries = async (
  employers: string[],
  params: Omit<KasbonSummaryParams, 'employer'>
): Promise<{ employer: string; data: KasbonSummaryResponse }[]> => {
  const promises = employers.map(async (employer) => {
    try {
      const data = await fetchKasbonSummary({ ...params, employer });
      return { employer, data };
    } catch (error) {
      console.error(`Failed to fetch summary for employer ${employer}:`, error);
      return { employer, data: null };
    }
  });
  
  const results = await Promise.all(promises);
  return results.filter(result => result.data !== null) as { employer: string; data: KasbonSummaryResponse }[];
};
