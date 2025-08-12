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
