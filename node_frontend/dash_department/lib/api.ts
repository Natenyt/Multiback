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

export interface LeaderboardEntry {
  full_name: string;
  rank: number;
  department_name: string;
  solved_total: number;
  avatar_url: string | null;
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
}

export async function getLeaderboard(): Promise<LeaderboardResponse> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_BASE_URL}/dashboard/leaderboard/`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData: ApiError = await response.json().catch(() => ({
      detail: 'Failed to fetch leaderboard data',
    }));
    const errorMessage = errorData.detail || errorData.message || errorData.error || 'Failed to fetch leaderboard data';
    if (response.status === 401 || errorMessage.includes('token') || errorMessage.includes('authentication') || errorMessage.includes('not valid')) {
      clearAuthTokens();
      throw new Error('Authentication failed. Please log in again.');
    }
    throw new Error(errorMessage);
  }

  const data: LeaderboardResponse = await response.json();
  return data;
}

// Ticket-related interfaces and functions
export interface TicketListItem {
  session_id: string;
  citizen_name: string;
  phone_number: string;
  location: string;
  created_at: string;
  neighborhood: string | null;
  preview_text: string;
}

export interface Neighborhood {
  id: number;
  name_uz: string;
  name_ru: string;
}

export interface MessageContent {
  id: number;
  content_type: string;
  text?: string;
  caption?: string;
  file_url?: string | null;
  thumbnail_url?: string | null;
  telegram_file_id?: string | null;
  media_group_id?: string | null;
  created_at: string;
}

export interface Message {
  message_uuid: string;
  created_at: string;
  delivered_at: string | null;
  read_at: string | null;
  is_staff_message: boolean;
  is_me: boolean;
  sender_platform: string;
  sender: {
    user_uuid: string | null;
    full_name: string;
    avatar_url: string | null;
  };
  contents: MessageContent[];
}

export interface SessionData {
  session_uuid: string;
  status: string;
  origin: string;
  created_at: string;
  assigned_staff: {
    user_uuid: string;
    full_name: string;
    avatar_url: string | null;
  } | null;
  citizen: {
    user_uuid: string;
    full_name: string;
    avatar_url: string | null;
  };
  last_messaged: string | null;
  sla_deadline: string | null;
  sla_breached: boolean;
  is_hold: boolean;
}

export interface TicketHistoryResponse {
  session: SessionData;
  messages: Message[];
  next: string | null;
  has_more: boolean;
}

export async function getTickets(
  status: 'unassigned' | 'assigned' | 'closed',
  options?: {
    search?: string;
    neighborhood_id?: number;
    page?: number;
    page_size?: number;
    lang?: string;
  }
): Promise<TicketListItem[]> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const url = new URL(`${API_BASE_URL}/tickets/`);
  url.searchParams.append('status', status);
  
  if (options?.search) {
    url.searchParams.append('search', options.search);
  }
  if (options?.neighborhood_id) {
    url.searchParams.append('neighborhood_id', String(options.neighborhood_id));
  }
  if (options?.page) {
    url.searchParams.append('page', String(options.page));
  }
  if (options?.page_size) {
    url.searchParams.append('page_size', String(options.page_size));
  }
  if (options?.lang) {
    url.searchParams.append('lang', options.lang);
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
      detail: 'Failed to fetch tickets',
    }));
    const errorMessage = errorData.detail || errorData.message || errorData.error || 'Failed to fetch tickets';
    if (response.status === 401 || errorMessage.includes('token') || errorMessage.includes('authentication') || errorMessage.includes('not valid')) {
      clearAuthTokens();
      throw new Error('Authentication failed. Please log in again.');
    }
    throw new Error(errorMessage);
  }

  const data: TicketListItem[] = await response.json();
  return data;
}

export async function getTicketHistory(sessionUuid: string): Promise<TicketHistoryResponse> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_BASE_URL}/tickets/${sessionUuid}/history/`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData: ApiError = await response.json().catch(() => ({
      detail: 'Failed to fetch ticket history',
    }));
    const errorMessage = errorData.detail || errorData.message || errorData.error || 'Failed to fetch ticket history';
    if (response.status === 401 || errorMessage.includes('token') || errorMessage.includes('authentication') || errorMessage.includes('not valid')) {
      clearAuthTokens();
      throw new Error('Authentication failed. Please log in again.');
    }
    throw new Error(errorMessage);
  }

  const data: TicketHistoryResponse = await response.json();
  return data;
}

export async function assignTicket(sessionUuid: string): Promise<{ status: string; session: SessionData; message: string }> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_BASE_URL}/tickets/${sessionUuid}/assign/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData: ApiError = await response.json().catch(() => ({
      detail: 'Failed to assign ticket',
    }));
    const errorMessage = errorData.detail || errorData.message || errorData.error || 'Failed to assign ticket';
    if (response.status === 401 || errorMessage.includes('token') || errorMessage.includes('authentication') || errorMessage.includes('not valid')) {
      clearAuthTokens();
      throw new Error('Authentication failed. Please log in again.');
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data;
}

export async function escalateTicket(sessionUuid: string): Promise<{ status: string; session: SessionData; message: string }> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_BASE_URL}/tickets/${sessionUuid}/escalate/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData: ApiError = await response.json().catch(() => ({
      detail: 'Failed to escalate ticket',
    }));
    const errorMessage = errorData.detail || errorData.message || errorData.error || 'Failed to escalate ticket';
    if (response.status === 401 || errorMessage.includes('token') || errorMessage.includes('authentication') || errorMessage.includes('not valid')) {
      clearAuthTokens();
      throw new Error('Authentication failed. Please log in again.');
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data;
}

export async function sendMessage(
  sessionUuid: string,
  options?: {
    text?: string;
    files?: File[];
    voiceBlob?: Blob;
    client_message_id?: string;
  }
): Promise<{ message: Message; queued_for_analysis: boolean; broadcasted: boolean; telegram_delivery: any }> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const formData = new FormData();
  
  if (options?.text) {
    formData.append('text', options.text);
  }
  
  if (options?.client_message_id) {
    formData.append('client_message_id', options.client_message_id);
  }

  if (options?.files && options.files.length > 0) {
    options.files.forEach((file) => {
      formData.append('files', file);
    });
  }

  if (options?.voiceBlob) {
    formData.append('files', options.voiceBlob, 'voice.ogg');
  }

  const response = await fetch(`${API_BASE_URL}/tickets/${sessionUuid}/send/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData: ApiError = await response.json().catch(() => ({
      detail: 'Failed to send message',
    }));
    const errorMessage = errorData.detail || errorData.message || errorData.error || 'Failed to send message';
    if (response.status === 401 || errorMessage.includes('token') || errorMessage.includes('authentication') || errorMessage.includes('not valid')) {
      clearAuthTokens();
      throw new Error('Authentication failed. Please log in again.');
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data;
}

export async function getNeighborhoods(options?: { search?: string; lang?: string }): Promise<Neighborhood[]> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const url = new URL(`${API_BASE_URL}/neighborhoods/`);
  if (options?.search) {
    url.searchParams.append('search', options.search);
  }
  if (options?.lang) {
    url.searchParams.append('lang', options.lang);
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
      detail: 'Failed to fetch neighborhoods',
    }));
    const errorMessage = errorData.detail || errorData.message || errorData.error || 'Failed to fetch neighborhoods';
    if (response.status === 401 || errorMessage.includes('token') || errorMessage.includes('authentication') || errorMessage.includes('not valid')) {
      clearAuthTokens();
      throw new Error('Authentication failed. Please log in again.');
    }
    throw new Error(errorMessage);
  }

  const data: Neighborhood[] = await response.json();
  return data;
}

