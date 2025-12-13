import { LoginRequest, LoginResponse, ApiError } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export async function staffLogin(
  credentials: LoginRequest
): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/staff-login/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const errorData: ApiError = await response.json().catch(() => ({
      detail: 'An error occurred during login',
    }));
    throw new Error(errorData.detail || errorData.message || errorData.error || 'Login failed');
  }

  const data: LoginResponse = await response.json();
  return data;
}

export function storeAuthTokens(access: string, refresh: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', access);
    localStorage.setItem('refresh_token', refresh);
  }
}

export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
}

export function clearAuthTokens(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
  }
}

export interface StaffProfileResponse {
  full_name: string;
  email: string;
  avatar_url: string | null;
  job_title: string;
  department: string;
  phone_number: string;
  joined_at: string | null;
}

export async function getStaffProfile(): Promise<StaffProfileResponse> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_BASE_URL}/dashboard/staff-profile/`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData: ApiError = await response.json().catch(() => ({
      detail: 'Failed to fetch staff profile',
    }));
    // Check for specific token invalidation messages
    const errorMessage = errorData.detail || errorData.message || errorData.error || 'Failed to fetch staff profile';
    if (response.status === 401 || errorMessage.includes('token') || errorMessage.includes('authentication') || errorMessage.includes('not valid')) {
      clearAuthTokens(); // Clear tokens if invalid
      throw new Error('Authentication failed. Please log in again.'); // Throw a specific error
    }
    throw new Error(errorMessage);
  }

  const data: StaffProfileResponse = await response.json();
  return data;
}

export interface DashboardStatsResponse {
  unassigned_count: number;
  active_count: number;
  solved_today: number;
  personal_best_record: number;
  completion_rate: number;
}

export async function getDashboardStats(): Promise<DashboardStatsResponse> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_BASE_URL}/dashboard/stats/`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData: ApiError = await response.json().catch(() => ({
      detail: 'Failed to fetch dashboard stats',
    }));
    const errorMessage = errorData.detail || errorData.message || errorData.error || 'Failed to fetch dashboard stats';
    if (response.status === 401 || errorMessage.includes('token') || errorMessage.includes('authentication') || errorMessage.includes('not valid')) {
      clearAuthTokens();
      throw new Error('Authentication failed. Please log in again.');
    }
    throw new Error(errorMessage);
  }

  const data: DashboardStatsResponse = await response.json();
  return data;
}

export interface SessionsChartDataPoint {
  date: string;
  unassigned: number;
  assigned: number;
  closed: number;
}

export async function getSessionsChart(period?: string): Promise<SessionsChartDataPoint[]> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const url = new URL(`${API_BASE_URL}/dashboard/sessions-chart/`);
  if (period) {
    url.searchParams.append('period', period);
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData: ApiError = await response.json().catch(() => ({
      detail: 'Failed to fetch sessions chart data',
    }));
    const errorMessage = errorData.detail || errorData.message || errorData.error || 'Failed to fetch sessions chart data';
    if (response.status === 401 || errorMessage.includes('token') || errorMessage.includes('authentication') || errorMessage.includes('not valid')) {
      clearAuthTokens();
      throw new Error('Authentication failed. Please log in again.');
    }
    throw new Error(errorMessage);
  }

  const data: SessionsChartDataPoint[] = await response.json();
  return data;
}

export interface DemographicsResponse {
  male_count: number;
  female_count: number;
  male_percentage: number;
  female_percentage: number;
  total_appealers: number;
}

export async function getDemographics(): Promise<DemographicsResponse> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_BASE_URL}/dashboard/demographics/`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData: ApiError = await response.json().catch(() => ({
      detail: 'Failed to fetch demographics data',
    }));
    const errorMessage = errorData.detail || errorData.message || errorData.error || 'Failed to fetch demographics data';
    if (response.status === 401 || errorMessage.includes('token') || errorMessage.includes('authentication') || errorMessage.includes('not valid')) {
      clearAuthTokens();
      throw new Error('Authentication failed. Please log in again.');
    }
    throw new Error(errorMessage);
  }

  const data: DemographicsResponse = await response.json();
  return data;
}

export interface TopNeighborhood {
  neighborhood_name: string;
  count: number;
  percentage: number;
}

export async function getTopNeighborhoods(): Promise<TopNeighborhood[]> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_BASE_URL}/dashboard/top-neighborhoods/`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData: ApiError = await response.json().catch(() => ({
      detail: 'Failed to fetch top neighborhoods data',
    }));
    const errorMessage = errorData.detail || errorData.message || errorData.error || 'Failed to fetch top neighborhoods data';
    if (response.status === 401 || errorMessage.includes('token') || errorMessage.includes('authentication') || errorMessage.includes('not valid')) {
      clearAuthTokens();
      throw new Error('Authentication failed. Please log in again.');
    }
    throw new Error(errorMessage);
  }

  const data: TopNeighborhood[] = await response.json();
  return data;
}

