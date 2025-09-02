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
  employer?: string;
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

// Types for Karyawan Overdue API
export interface KaryawanOverdue {
  id_karyawan: number;
  ktp: string;
  name: string;
  company: string;
  sourced_to: string;
  project: string;
  total_amount_owed: number;
  repayment_date: string;
  days_overdue: number;
}

export interface KaryawanOverdueResponse {
  status: string;
  count: number;
  results: KaryawanOverdue[];
  message: string | null;
}

// Types for Karyawan Overdue Query Parameters
export interface KaryawanOverdueParams {
  employer?: string;
  sourced_to?: string;
  project?: string;
  id_karyawan?: string;
  month?: string;
  year?: string;
}

// Types for Loan Risk API
export interface LoanRiskResponse {
  status: string;
  total_unrecovered_kasbon: number;
  unrecovered_kasbon_count: number;
  total_expected_repayment: number;
  kasbon_principal_recovery_rate: number;
  message: string | null;
}

// Types for Loan Risk Query Parameters
export interface LoanRiskParams {
  employer?: string;
  sourced_to?: string;
  project?: string;
  id_karyawan?: string;
  month?: string;
  year?: string;
}

// Types for Loan Risk Monthly API
export interface LoanRiskMonthlyData {
  total_unrecovered_kasbon: number;
  unrecovered_kasbon_count: number;
  total_expected_repayment: number;
  kasbon_principal_recovery_rate: number;
}

export interface LoanRiskMonthlyResponse {
  status: string;
  monthly_data: Record<string, LoanRiskMonthlyData>;
  message: string | null;
}

// Types for Loan Risk Monthly Query Parameters
export interface LoanRiskMonthlyParams {
  employer?: string;
  sourced_to?: string;
  project?: string;
  id_karyawan?: string;
  start_date?: string;
  end_date?: string;
}

// Types for User Coverage API
export interface UserCoverage {
  total_eligible_employees: number;
  total_kasbon_requests: number;
  penetration_rate: number;
  total_first_borrow: number;
  message: string | null;
}

export interface UserCoverageResponse {
  status: string;
  total_eligible_employees: number;
  total_kasbon_requests: number;
  penetration_rate: number;
  total_first_borrow: number;
  message: string | null;
}

// Types for User Coverage Query Parameters
export interface UserCoverageParams {
  employer?: string;
  sourced_to?: string;
  project?: string;
  month?: string;
  year?: string;
}

// Types for User Coverage Monthly API
export interface UserCoverageMonthlyData {
  total_eligible_employees: number;
  total_kasbon_requests: number;
  penetration_rate: number;
  total_first_borrow: number;
}

export interface UserCoverageMonthlyResponse {
  status: string;
  monthly_data: Record<string, UserCoverageMonthlyData>;
  message: string | null;
}

// Types for User Coverage Monthly Query Parameters
export interface UserCoverageMonthlyParams {
  employer?: string;
  sourced_to?: string;
  project?: string;
  start_date?: string;
  end_date?: string;
}

// Types for Coverage Utilization API
export interface CoverageUtilization {
  total_eligible_employees: number;
  total_loan_requests: number;
  penetration_rate: number;
  total_approved_requests: number;
  total_rejected_requests: number;
  approval_rate: number;
  total_new_borrowers: number;
  average_approval_time: number;
  total_disbursed_amount: number;
  average_disbursed_amount: number;
  message: string | null;
}

export interface CoverageUtilizationResponse {
  status: string;
  total_eligible_employees: number;
  total_loan_requests: number;
  penetration_rate: number;
  total_approved_requests: number;
  total_rejected_requests: number;
  approval_rate: number;
  total_new_borrowers: number;
  average_approval_time: number;
  total_disbursed_amount: number;
  average_disbursed_amount: number;
  message: string | null;
}

// Types for Coverage Utilization Query Parameters
export interface CoverageUtilizationParams {
  employer?: string;
  sourced_to?: string;
  project?: string;
  month?: string;
  year?: string;
}

// Types for Coverage Utilization Monthly API
export interface CoverageUtilizationMonthlyData {
  total_first_borrow: number;
  total_loan_requests: number;
  total_approved_requests: number;
  total_rejected_requests: number;
  penetration_rate: number;
  total_disbursed_amount: number;
}

export interface CoverageUtilizationMonthlyResponse {
  status: string;
  monthly_data: Record<string, CoverageUtilizationMonthlyData>;
  message: string | null;
}

// Types for Coverage Utilization Monthly Query Parameters
export interface CoverageUtilizationMonthlyParams {
  employer?: string;
  sourced_to?: string;
  project?: string;
  start_date?: string;
  end_date?: string;
}

// Types for Repayment Risk API
export interface RepaymentRisk {
  total_expected_repayment: number;
  total_kasbon_principal_collected: number;
  total_admin_fee_collected: number;
  total_unrecovered_repayment: number;
  total_unrecovered_kasbon_principal: number;
  total_unrecovered_admin_fee: number;
  repayment_recovery_rate: number;
  delinquencies_rate: number;
  admin_fee_profit: number;
  message: string | null;
}

export interface RepaymentRiskResponse {
  status: string;
  total_expected_repayment: number;
  total_kasbon_principal_collected: number;
  total_admin_fee_collected: number;
  total_unrecovered_repayment: number;
  total_unrecovered_kasbon_principal: number;
  total_unrecovered_admin_fee: number;
  repayment_recovery_rate: number;
  delinquencies_rate: number;
  admin_fee_profit: number;
  message: string | null;
}

// Types for Repayment Risk Query Parameters
export interface RepaymentRiskParams {
  employer?: string;
  sourced_to?: string;
  project?: string;
  month?: string;
  year?: string;
}

// Types for Repayment Risk Monthly API
export interface RepaymentRiskMonthlyData {
  repayment_recovery_rate: number;
  total_expected_repayment: number;
  total_kasbon_principal_collected: number;
  total_unrecovered_repayment: number;
  admin_fee_profit: number;
}

export interface RepaymentRiskMonthlyResponse {
  status: string;
  monthly_data: Record<string, RepaymentRiskMonthlyData>;
  message: string | null;
}

// Types for Repayment Risk Monthly Query Parameters
export interface RepaymentRiskMonthlyParams {
  employer?: string;
  sourced_to?: string;
  project?: string;
  start_date?: string;
  end_date?: string;
}

// Types for Loan Requests API
export interface LoanRequests {
  total_approved_requests: number;
  total_rejected_requests: number;
  approval_rate: number;
  average_approval_time: number;
  message: string | null;
}

export interface LoanRequestsResponse {
  status: string;
  total_approved_requests: number;
  total_rejected_requests: number;
  approval_rate: number;
  average_approval_time: number;
  message: string | null;
}

// Types for Loan Requests Query Parameters
export interface LoanRequestsParams {
  employer?: string;
  sourced_to?: string;
  project?: string;
  month?: string;
  year?: string;
}

// Types for Loan Disbursement API
export interface LoanDisbursement {
  total_disbursed_amount: number;
  average_disbursed_amount: number;
  message: string | null;
}

export interface LoanDisbursementResponse {
  status: string;
  total_disbursed_amount: number;
  average_disbursed_amount: number;
  message: string | null;
}

// Types for Loan Disbursement Query Parameters
export interface LoanDisbursementParams {
  employer?: string;
  sourced_to?: string;
  project?: string;
  month?: string;
  year?: string;
}

// Types for Loan Disbursement Monthly API
export interface LoanDisbursementMonthlyData {
  total_disbursed_amount: number;
  total_loans: number;
  average_disbursed_amount: number;
}

export interface LoanDisbursementMonthlyResponse {
  status: string;
  monthly_data: Record<string, LoanDisbursementMonthlyData>;
  message: string | null;
}

// Types for Loan Disbursement Monthly Query Parameters
export interface LoanDisbursementMonthlyParams {
  employer?: string;
  sourced_to?: string;
  project?: string;
  start_date?: string;
  end_date?: string;
}

// Types for Loan Purpose API
export interface LoanPurpose {
  purpose_id: number;
  purpose_name: string;
  total_count: number;
  total_amount: number;
}

export interface LoanPurposeResponse {
  status: string;
  count: number;
  results: LoanPurpose[];
  message: string | null;
}

// Types for Loan Purpose Query Parameters
export interface LoanPurposeParams {
  employer?: string;
  sourced_to?: string;
  project?: string;
  id_karyawan?: string;
  month?: string;
  year?: string;
}

// Types for Client Summary API
export interface ClientSummary {
  sourced_to: string;
  project: string;
  total_disbursement: number;
  total_requests: number;
  approved_requests: number;
  eligible_employees: number;
  active_employees: number;
  eligible_rate: number;
  penetration_rate: number;
  total_admin_fee_collected: number;
  total_unrecovered_payment: number;
  admin_fee_profit: number;
  delinquency_rate: number;
}

export interface ClientSummaryResponse {
  status: string;
  count: number;
  results: ClientSummary[];
}

export interface ClientSummaryParams {
  month?: string;
  year?: string;
}

// Get API URL from environment variable with fallback
const AM_API_URL = process.env.NEXT_PUBLIC_API_URL;


// API service functions
export const fetchKaryawan = async (clientId?: string): Promise<KaryawanResponse> => {
  const baseUrl = AM_API_URL;
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
  const baseUrl = AM_API_URL;
  
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
  const baseUrl = AM_API_URL;
  
  // Build query string from parameters
  const queryParams = new URLSearchParams();
  
  if (params.employer) queryParams.append('employer', params.employer);
  if (params.sourced_to) queryParams.append('sourced_to', params.sourced_to);
  if (params.project) queryParams.append('project', params.project);
  if (params.month) queryParams.append('month', params.month);
  if (params.year) queryParams.append('year', params.year);
  
  const url = `${baseUrl}/kasbon/summary?${queryParams.toString()}`;
  
  console.log('Fetching kasbon summary from:', url);
  console.log('Query params:', queryParams.toString());
  console.log('Params received:', params);
  
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
  const baseUrl = AM_API_URL;
  
  // Build query string from parameters
  const queryParams = new URLSearchParams();

  if (params.employer) queryParams.append('employer', params.employer);
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
  const baseUrl = AM_API_URL;
  
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

// Fetch Karyawan Overdue
export const fetchKaryawanOverdue = async (params: KaryawanOverdueParams): Promise<KaryawanOverdueResponse> => {
  const baseUrl = AM_API_URL;
  
  // Build query string from parameters
  const queryParams = new URLSearchParams();
  
  if (params.employer) queryParams.append('employer', params.employer);
  if (params.sourced_to) queryParams.append('sourced_to', params.sourced_to);
  if (params.project) queryParams.append('project', params.project);
  if (params.id_karyawan) queryParams.append('id_karyawan', params.id_karyawan);
  if (params.month) queryParams.append('month', params.month);
  if (params.year) queryParams.append('year', params.year);
  
  const url = `${baseUrl}/kasbon/karyawan-overdue?${queryParams.toString()}`;
  
  console.log('Fetching karyawan overdue from:', url);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch karyawan overdue: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};

// Fetch Loan Risk
export const fetchLoanRisk = async (params: LoanRiskParams): Promise<LoanRiskResponse> => {
  const baseUrl = AM_API_URL;
  
  // Build query string from parameters
  const queryParams = new URLSearchParams();
  
  if (params.employer) queryParams.append('employer', params.employer);
  if (params.sourced_to) queryParams.append('sourced_to', params.sourced_to);
  if (params.project) queryParams.append('project', params.project);
  if (params.id_karyawan) queryParams.append('id_karyawan', params.id_karyawan);
  if (params.month) queryParams.append('month', params.month);
  if (params.year) queryParams.append('year', params.year);
  
  const url = `${baseUrl}/kasbon/loan-risk?${queryParams.toString()}`;
  
  console.log('Fetching loan risk from:', url);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch loan risk: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};

// Fetch Loan Risk Monthly
export const fetchLoanRiskMonthly = async (params: LoanRiskMonthlyParams): Promise<LoanRiskMonthlyResponse> => {
  const baseUrl = AM_API_URL;
  
  // Build query string from parameters
  const queryParams = new URLSearchParams();
  
  if (params.employer) queryParams.append('employer', params.employer);
  if (params.sourced_to) queryParams.append('sourced_to', params.sourced_to);
  if (params.project) queryParams.append('project', params.project);
  if (params.id_karyawan) queryParams.append('id_karyawan', params.id_karyawan);
  if (params.start_date) queryParams.append('start_date', params.start_date);
  if (params.end_date) queryParams.append('end_date', params.end_date);
  
  const url = `${baseUrl}/kasbon/loan-risk-monthly?${queryParams.toString()}`;
  
  console.log('Fetching loan risk monthly from:', url);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch loan risk monthly: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};

// Fetch User Coverage
export const fetchUserCoverage = async (params: UserCoverageParams): Promise<UserCoverageResponse> => {
  const baseUrl = AM_API_URL;
  
  // Build query string from parameters
  const queryParams = new URLSearchParams();
  
  if (params.employer) queryParams.append('employer', params.employer);
  if (params.sourced_to) queryParams.append('sourced_to', params.sourced_to);
  if (params.project) queryParams.append('project', params.project);
  if (params.month) queryParams.append('month', params.month);
  if (params.year) queryParams.append('year', params.year);
  
  const url = `${baseUrl}/kasbon/user-coverage?${queryParams.toString()}`;
  
  console.log('Fetching user coverage from:', url);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch user coverage: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};

// Fetch User Coverage Monthly
export const fetchUserCoverageMonthly = async (params: UserCoverageMonthlyParams): Promise<UserCoverageMonthlyResponse> => {
  const baseUrl = AM_API_URL;
  
  // Build query string from parameters
  const queryParams = new URLSearchParams();
  
  if (params.employer) queryParams.append('employer', params.employer);
  if (params.sourced_to) queryParams.append('sourced_to', params.sourced_to);
  if (params.project) queryParams.append('project', params.project);
  if (params.start_date) queryParams.append('start_date', params.start_date);
  if (params.end_date) queryParams.append('end_date', params.end_date);
  
  const url = `${baseUrl}/kasbon/user-coverage-monthly?${queryParams.toString()}`;
  
  console.log('Fetching user coverage monthly from:', url);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch user coverage monthly: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};

// Fetch Coverage Utilization
export const fetchCoverageUtilization = async (params: CoverageUtilizationParams): Promise<CoverageUtilizationResponse> => {
  const baseUrl = AM_API_URL;
  
  // Build query string from parameters
  const queryParams = new URLSearchParams();
  
  if (params.employer) queryParams.append('employer', params.employer);
  if (params.sourced_to) queryParams.append('sourced_to', params.sourced_to);
  if (params.project) queryParams.append('project', params.project);
  if (params.month) queryParams.append('month', params.month);
  if (params.year) queryParams.append('year', params.year);
  
  const url = `${baseUrl}/kasbon/coverage-utilization?${queryParams.toString()}`;
  
  console.log('Fetching coverage utilization from:', url);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch coverage utilization: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};

// Fetch Coverage Utilization Monthly
export const fetchCoverageUtilizationMonthly = async (params: CoverageUtilizationMonthlyParams): Promise<CoverageUtilizationMonthlyResponse> => {
  const baseUrl = AM_API_URL;
  
  // Build query string from parameters
  const queryParams = new URLSearchParams();
  
  if (params.employer) queryParams.append('employer', params.employer);
  if (params.sourced_to) queryParams.append('sourced_to', params.sourced_to);
  if (params.project) queryParams.append('project', params.project);
  if (params.start_date) queryParams.append('start_date', params.start_date);
  if (params.end_date) queryParams.append('end_date', params.end_date);
  
  const url = `${baseUrl}/kasbon/coverage-utilization-monthly?${queryParams.toString()}`;
  
  console.log('Fetching coverage utilization monthly from:', url);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch coverage utilization monthly: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};

// Fetch Repayment Risk
export const fetchRepaymentRisk = async (params: RepaymentRiskParams): Promise<RepaymentRiskResponse> => {
  const baseUrl = AM_API_URL;
  
  // Build query string from parameters
  const queryParams = new URLSearchParams();
  
  if (params.employer) queryParams.append('employer', params.employer);
  if (params.sourced_to) queryParams.append('sourced_to', params.sourced_to);
  if (params.project) queryParams.append('project', params.project);
  if (params.month) queryParams.append('month', params.month);
  if (params.year) queryParams.append('year', params.year);
  
  const url = `${baseUrl}/kasbon/repayment-risk?${queryParams.toString()}`;
  
  console.log('Fetching repayment risk from:', url);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch repayment risk: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};

// Fetch Repayment Risk Monthly
export const fetchRepaymentRiskMonthly = async (params: RepaymentRiskMonthlyParams): Promise<RepaymentRiskMonthlyResponse> => {
  const baseUrl = AM_API_URL;
  
  // Build query string from parameters
  const queryParams = new URLSearchParams();
  
  if (params.employer) queryParams.append('employer', params.employer);
  if (params.sourced_to) queryParams.append('sourced_to', params.sourced_to);
  if (params.project) queryParams.append('project', params.project);
  if (params.start_date) queryParams.append('start_date', params.start_date);
  if (params.end_date) queryParams.append('end_date', params.end_date);
  
  const url = `${baseUrl}/kasbon/repayment-risk-monthly?${queryParams.toString()}`;
  
  console.log('Fetching repayment risk monthly from:', url);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch repayment risk monthly: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};

// Fetch Loan Requests
export const fetchLoanRequests = async (params: LoanRequestsParams): Promise<LoanRequestsResponse> => {
  const baseUrl = AM_API_URL;
  
  // Build query string from parameters
  const queryParams = new URLSearchParams();
  
  if (params.employer) queryParams.append('employer', params.employer);
  if (params.sourced_to) queryParams.append('sourced_to', params.sourced_to);
  if (params.project) queryParams.append('project', params.project);
  if (params.month) queryParams.append('month', params.month);
  if (params.year) queryParams.append('year', params.year);
  
  const url = `${baseUrl}/kasbon/requests?${queryParams.toString()}`;
  
  console.log('Fetching loan requests from:', url);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch loan requests: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};

// Fetch Loan Disbursement
export const fetchLoanDisbursement = async (params: LoanDisbursementParams): Promise<LoanDisbursementResponse> => {
  const baseUrl = AM_API_URL;
  
  // Build query string from parameters
  const queryParams = new URLSearchParams();
  
  if (params.employer) queryParams.append('employer', params.employer);
  if (params.sourced_to) queryParams.append('sourced_to', params.sourced_to);
  if (params.project) queryParams.append('project', params.project);
  if (params.month) queryParams.append('month', params.month);
  if (params.year) queryParams.append('year', params.year);
  
  const url = `${baseUrl}/kasbon/disbursement?${queryParams.toString()}`;
  
  console.log('Fetching loan disbursement from:', url);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch loan disbursement: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};

// Fetch Loan Disbursement Monthly
export const fetchLoanDisbursementMonthly = async (params: LoanDisbursementMonthlyParams): Promise<LoanDisbursementMonthlyResponse> => {
  const baseUrl = AM_API_URL;
  
  // Build query string from parameters
  const queryParams = new URLSearchParams();
  
  if (params.employer) queryParams.append('employer', params.employer);
  if (params.sourced_to) queryParams.append('sourced_to', params.sourced_to);
  if (params.project) queryParams.append('project', params.project);
  if (params.start_date) queryParams.append('start_date', params.start_date);
  if (params.end_date) queryParams.append('end_date', params.end_date);
  
  const url = `${baseUrl}/kasbon/disbursement-monthly?${queryParams.toString()}`;
  
  console.log('Fetching loan disbursement monthly from:', url);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch loan disbursement monthly: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};

// Fetch Loan Purpose
export const fetchLoanPurpose = async (params: LoanPurposeParams): Promise<LoanPurposeResponse> => {
  const baseUrl = AM_API_URL;
  
  // Build query string from parameters
  const queryParams = new URLSearchParams();
  
  if (params.employer) queryParams.append('employer', params.employer);
  if (params.sourced_to) queryParams.append('sourced_to', params.sourced_to);
  if (params.project) queryParams.append('project', params.project);
  if (params.id_karyawan) queryParams.append('id_karyawan', params.id_karyawan);
  if (params.month) queryParams.append('month', params.month);
  if (params.year) queryParams.append('year', params.year);
  
  const url = `${baseUrl}/kasbon/loan-purpose?${queryParams.toString()}`;
  
  console.log('Fetching loan purpose from:', url);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch loan purpose: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};

// Fetch Client Summary
export const fetchClientSummary = async (params: ClientSummaryParams): Promise<ClientSummaryResponse> => {
  const baseUrl = AM_API_URL;
  
  // Build query string from parameters
  const queryParams = new URLSearchParams();
  
  if (params.month) queryParams.append('month', params.month);
  if (params.year) queryParams.append('year', params.year);
  
  const url = `${baseUrl}/kasbon/client-summary?${queryParams.toString()}`;
  
  console.log('Fetching client summary from:', url);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch client summary: ${response.status} ${response.statusText}`);
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
