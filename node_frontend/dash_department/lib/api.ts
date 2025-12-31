import { LoginRequest, LoginResponse, ApiError } from './types';

// Use Next.js API proxy route instead of direct backend URL
// This keeps BACKEND_PRIVATE_URL server-side only
const API_BASE_URL = typeof window !== 'undefined' 
  ? '/api/proxy'  // Client-side: use Next.js API route
  : (process.env.BACKEND_PRIVATE_URL || 'http://localhost:8000/api'); // Server-side: direct backend

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

export function getRefreshToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('refresh_token');
  }
  return null;
}

/**
 * Decode JWT token to check expiration
 * Returns the expiration timestamp in seconds, or null if invalid
 */
function getTokenExpiration(token: string): number | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    const payload = JSON.parse(atob(parts[1]));
    return payload.exp || null;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}

/**
 * Check if a token is expired or will expire soon (within 5 minutes)
 */
export function isTokenExpired(token: string | null): boolean {
  if (!token) {
    return true;
  }
  const exp = getTokenExpiration(token);
  if (!exp) {
    return true; // If we can't decode it, consider it expired
  }
  // Check if token expires within 5 minutes (300 seconds)
  const now = Math.floor(Date.now() / 1000);
  return exp <= (now + 300);
}

// Token refresh lock to prevent concurrent refresh requests
// This ensures only one refresh happens at a time, even if multiple calls request it simultaneously
let refreshPromise: Promise<string | null> | null = null;

/**
 * Refresh the access token using the refresh token
 * This function is protected by a mutex to prevent concurrent refresh requests
 */
async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    console.warn('No refresh token available');
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/token/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Token refresh failed:', errorData);
      // If refresh token is invalid, clear all tokens
      if (response.status === 401 || response.status === 403) {
        clearAuthTokens();
        // Redirect to login page
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
      return null;
    }

    const data = await response.json();
    if (data.access) {
      // Update the access token in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', data.access);
      }
      return data.access;
    }
    return null;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
}

/**
 * Get a valid access token, refreshing if necessary
 * This function uses a mutex to ensure only one refresh happens at a time,
 * even when called concurrently from multiple places
 */
export async function getValidAuthToken(): Promise<string | null> {
  let token = getAuthToken();
  
  // If token is expired or will expire soon, refresh it
  if (isTokenExpired(token)) {
    // If a refresh is already in progress, wait for it instead of starting a new one
    if (refreshPromise) {
      console.log('Token refresh already in progress, waiting for existing refresh...');
      return await refreshPromise;
    }
    
    // Start a new refresh and store the promise so other concurrent calls can wait for it
    console.log('Token expired or expiring soon, refreshing...');
    refreshPromise = refreshAccessToken()
      .then((newToken) => {
        // Clear the promise after completion (success or failure)
        refreshPromise = null;
        return newToken;
      })
      .catch((error) => {
        // Clear the promise on error
        refreshPromise = null;
        throw error;
      });
    
    token = await refreshPromise;
  }
  
  return token;
}

/**
 * Make an authenticated fetch request with automatic token refresh on 401
 * Uses the same token refresh locking mechanism to prevent concurrent refreshes
 */
async function authenticatedFetch(
  url: string,
  options: RequestInit = {},
  retryCount = 0
): Promise<Response> {
  // Get valid token (will refresh if needed, using the lock mechanism)
  let token = await getValidAuthToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  // Add authorization header
  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${token}`);
  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // If we get a 401, try refreshing the token once and retry
  // Use getValidAuthToken() which handles the lock, instead of calling refreshAccessToken() directly
  if (response.status === 401 && retryCount === 0) {
    console.log('Got 401, attempting token refresh and retry...');
    // Use getValidAuthToken() which will use the lock if refresh is needed
    // This ensures we don't create duplicate refresh requests
    const newToken = await getValidAuthToken();
    if (newToken) {
      // Retry with new token
      const retryHeaders = new Headers(options.headers);
      retryHeaders.set('Authorization', `Bearer ${newToken}`);
      if (!retryHeaders.has('Content-Type') && options.body && typeof options.body === 'string') {
        retryHeaders.set('Content-Type', 'application/json');
      }
      return fetch(url, {
        ...options,
        headers: retryHeaders,
      });
    } else {
      // Refresh failed, clear tokens and redirect
      clearAuthTokens();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new Error('Authentication failed. Please log in again.');
    }
  }

  return response;
}

/**
 * Fetch an authenticated image and convert it to a blob URL
 * This is needed because <img> tags can't send authentication headers
 */
export async function fetchAuthenticatedImage(url: string): Promise<string | null> {
  const token = getAuthToken();
  if (!token) {
    console.warn('No auth token available for image fetch');
    return null;
  }

  try {
    // Determine the correct fetch URL
    // Always route through Next.js proxy to avoid CORS issues
    let fetchUrl = url;
    
    // If it's already a full URL with domain
    if (url.startsWith('http://') || url.startsWith('https://')) {
      // Check if it's pointing to our backend (ngrok or backend domain)
      // Extract the path and route through proxy
      try {
        const urlObj = new URL(url);
        const path = urlObj.pathname;
        // Route through proxy
        if (path.startsWith('/api/')) {
          fetchUrl = `/api/proxy${path.substring(4)}`;
        } else {
          fetchUrl = `/api/proxy${path}`;
        }
        // Preserve query params if any
        if (urlObj.search) {
          fetchUrl += urlObj.search;
        }
      } catch (e) {
        // If URL parsing fails, try to extract path manually
        const pathMatch = url.match(/https?:\/\/[^\/]+(\/.*)/);
        if (pathMatch) {
          const path = pathMatch[1];
          if (path.startsWith('/api/')) {
            fetchUrl = `/api/proxy${path.substring(4)}`;
          } else {
            fetchUrl = `/api/proxy${path}`;
          }
        } else {
          // Fallback: use as-is (external URL)
          fetchUrl = url;
        }
      }
    } 
    // All relative URLs should go through proxy
    else if (url.startsWith('/api/')) {
      // API endpoints go through proxy
      fetchUrl = `/api/proxy${url.substring(4)}`; // substring(4) removes '/api'
    }
    else if (url.startsWith('/media/')) {
      // Media files also go through proxy to ensure auth headers are sent
      fetchUrl = `/api/proxy${url}`;
    }
    // Relative URL without leading slash
    else if (!url.startsWith('/')) {
      fetchUrl = `/api/proxy/${url}`;
    }
    // Other relative URLs
    else {
      fetchUrl = `/api/proxy${url}`;
    }

    const response = await fetch(fetchUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch image: ${fetchUrl} (original: ${url}) - ${response.status} ${response.statusText}`);
      // Try to get error details
      try {
        const errorText = await response.text();
        if (errorText) {
          console.error('Error response:', errorText.substring(0, 200)); // Limit length
        }
      } catch (e) {
        // Ignore
      }
      return null;
    }

    // Check if response is actually an image
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.startsWith('image/') && !contentType.startsWith('application/octet-stream')) {
      // Might be JSON error response from proxy
      try {
        const jsonData = await response.json();
        console.error('Proxy returned JSON instead of image:', jsonData);
        return null;
      } catch (e) {
        // Not JSON, continue
      }
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('Error fetching authenticated image:', error);
    return null;
  }
}

export function clearAuthTokens(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('staff_uuid');
  }
}

export function storeStaffUuid(staffUuid: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('staff_uuid', staffUuid);
  }
}

export function getStaffUuid(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('staff_uuid');
  }
  return null;
}

export interface StaffProfileResponse {
  full_name: string;
  email: string;
  avatar_url: string | null;
  job_title: string;
  department: string;
  department_name_uz: string | null;
  department_id: number | null;
  phone_number: string;
  joined_at: string | null;
  staff_uuid: string;
  role: string;
}

export async function getStaffProfile(): Promise<StaffProfileResponse> {
  const token = await getValidAuthToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await authenticatedFetch(`${API_BASE_URL}/dashboard/staff-profile/`, {
    method: 'GET',
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
  // Store staff_uuid for later use
  if (data.staff_uuid) {
    storeStaffUuid(data.staff_uuid);
  }
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

  // Build URL with query params (works with relative URLs)
  const params = new URLSearchParams();
  if (period) {
    params.append('period', period);
  }
  const queryString = params.toString();
  const url = `${API_BASE_URL}/dashboard/sessions-chart/${queryString ? '?' + queryString : ''}`;

  const response = await fetch(url, {
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
  intent_label?: string | null;
  assigned_staff?: {
    user_uuid: string;
    full_name: string;
    avatar_url: string | null;
  } | null;
  department_name?: string | null;
  origin?: string;
  location: string;
  created_at: string;
  assigned_at?: string | null;
  closed_at?: string | null;
  status?: string;
  neighborhood: {
    id: number;
    name_uz: string;
    name_ru: string;
    name: string;
  } | null;
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
    phone_number?: string | null;
    location?: string | null;
    neighborhood?: {
      id: number;
      name_uz: string;
      name_ru: string;
      name: string;
    } | null;
  };
  last_messaged: string | null;
  sla_deadline: string | null;
  sla_breached: boolean;
  is_hold: boolean;
  intent_label?: string | null;
  description?: string | null;
  phone_number?: string | null;
  neighborhood?: {
    id: number;
    name_uz: string;
    name_ru: string;
    name: string;
  } | null;
  location?: string | null;
  department_name?: string | null;
}

export interface TicketHistoryResponse {
  session: SessionData;
  messages: Message[];
  next: string | null;
  has_more: boolean;
}

export async function getTickets(
  status: 'unassigned' | 'assigned' | 'closed' | 'escalated',
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

  // Build URL with query params (works with relative URLs)
  const params = new URLSearchParams();
  params.append('status', status);
  
  // For assigned and closed status, send staff_uuid (required by backend)
  // Escalated status doesn't require staff_uuid (all escalated sessions visible to VIP)
  if (status === 'assigned' || status === 'closed') {
    const staffUuid = getStaffUuid();
    if (staffUuid) {
      params.append('staff_uuid', staffUuid);
    }
  }
  
  if (options?.search) {
    params.append('search', options.search);
  }
  if (options?.neighborhood_id) {
    params.append('neighborhood_id', String(options.neighborhood_id));
  }
  if (options?.page) {
    params.append('page', String(options.page));
  }
  if (options?.page_size) {
    params.append('page_size', String(options.page_size));
  }
  if (options?.lang) {
    params.append('lang', options.lang);
  }

  const queryString = params.toString();
  const url = `${API_BASE_URL}/tickets/${queryString ? '?' + queryString : ''}`;

  const response = await fetch(url, {
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

export async function getTicketHistory(sessionUuid: string, cursor?: string, lang: string = 'uz'): Promise<TicketHistoryResponse> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  // Build URL with query params (works with relative URLs)
  const params = new URLSearchParams();
  if (cursor) {
    params.append('cursor', cursor);
  }
  params.append('lang', lang);

  const queryString = params.toString();
  const url = `${API_BASE_URL}/tickets/${sessionUuid}/history/${queryString ? '?' + queryString : ''}`;

  const response = await fetch(url, {
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

export async function closeTicket(sessionUuid: string): Promise<{ status: string; session: SessionData; message: string }> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_BASE_URL}/tickets/${sessionUuid}/close/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData: ApiError = await response.json().catch(() => ({
      detail: 'Failed to close ticket',
    }));
    const errorMessage = errorData.detail || errorData.message || errorData.error || 'Failed to close ticket';
    if (response.status === 401 || errorMessage.includes('token') || errorMessage.includes('authentication') || errorMessage.includes('not valid')) {
      clearAuthTokens();
      throw new Error('Authentication failed. Please log in again.');
    }
    throw new Error(errorMessage);
  }

  const data: { status: string; session: SessionData; message: string } = await response.json();
  return data;
}

export async function updateTicketDescription(sessionUuid: string, description: string): Promise<{ status: string; session: SessionData; message: string }> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_BASE_URL}/tickets/${sessionUuid}/description/`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ description }),
  });

  if (!response.ok) {
    const errorData: ApiError = await response.json().catch(() => ({
      detail: 'Failed to update description',
    }));
    const errorMessage = errorData.detail || errorData.message || errorData.error || 'Failed to update description';
    if (response.status === 401 || errorMessage.includes('token') || errorMessage.includes('authentication') || errorMessage.includes('not valid')) {
      clearAuthTokens();
      throw new Error('Authentication failed. Please log in again.');
    }
    throw new Error(errorMessage);
  }

  const data: { status: string; session: SessionData; message: string } = await response.json();
  return data;
}

export async function holdTicket(sessionUuid: string): Promise<{ status: string; session: SessionData; message: string }> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_BASE_URL}/tickets/${sessionUuid}/hold/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData: ApiError = await response.json().catch(() => ({
      detail: 'Failed to hold ticket',
    }));
    const errorMessage = errorData.detail || errorData.message || errorData.error || 'Failed to hold ticket';
    if (response.status === 401 || errorMessage.includes('token') || errorMessage.includes('authentication') || errorMessage.includes('not valid')) {
      clearAuthTokens();
      throw new Error('Authentication failed. Please log in again.');
    }
    throw new Error(errorMessage);
  }

  const data: { status: string; session: SessionData; message: string } = await response.json();
  return data;
}

export async function sendMessage(
  sessionUuid: string,
  options?: {
    text?: string;
    client_message_id?: string;
  }
): Promise<{ message: Message; queued_for_analysis: boolean; broadcasted: boolean; telegram_delivery: any }> {
  // Get valid token (will refresh if needed)
  let token = await getValidAuthToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  // Only send text messages - use JSON instead of FormData
  const payload: { text: string; client_message_id?: string } = {
    text: options?.text || '',
  };
  
  if (options?.client_message_id) {
    payload.client_message_id = options.client_message_id;
  }

  let response = await fetch(`${API_BASE_URL}/tickets/${sessionUuid}/send/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  // If we get a 401, try refreshing the token once and retry
  // Use getValidAuthToken() which handles the lock, instead of calling refreshAccessToken() directly
  if (response.status === 401) {
    console.log('Got 401 on sendMessage, attempting token refresh and retry...');
    // Use getValidAuthToken() which will use the lock if refresh is needed
    // This ensures we don't create duplicate refresh requests
    const newToken = await getValidAuthToken();
    if (newToken) {
      // Retry with new token
      response = await fetch(`${API_BASE_URL}/tickets/${sessionUuid}/send/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${newToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } else {
      // Refresh failed, clear tokens and redirect
      clearAuthTokens();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new Error('Authentication failed. Please log in again.');
    }
  }

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

  // Build URL with query params (works with relative URLs)
  const params = new URLSearchParams();
  if (options?.search) {
    params.append('search', options.search);
  }
  if (options?.lang) {
    params.append('lang', options.lang);
  }

  const queryString = params.toString();
  const url = `${API_BASE_URL}/neighborhoods/${queryString ? '?' + queryString : ''}`;

  const response = await fetch(url, {
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

export interface Department {
  id: number;
  name_uz: string;
  name_ru: string;
  is_active: boolean;
}

export async function getDepartments(options?: { search?: string; lang?: string }): Promise<Department[]> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  // Build URL with query params
  const params = new URLSearchParams();
  if (options?.search) {
    params.append('search', options.search);
  }
  if (options?.lang) {
    params.append('lang', options.lang);
  }

  const queryString = params.toString();
  const url = `${API_BASE_URL}/departments/${queryString ? '?' + queryString : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData: ApiError = await response.json().catch(() => ({
      detail: 'Failed to fetch departments',
    }));
    const errorMessage = errorData.detail || errorData.message || errorData.error || 'Failed to fetch departments';
    if (response.status === 401 || errorMessage.includes('token') || errorMessage.includes('authentication') || errorMessage.includes('not valid')) {
      clearAuthTokens();
      throw new Error('Authentication failed. Please log in again.');
    }
    throw new Error(errorMessage);
  }

  const data: Department[] = await response.json();
  return data;
}

export interface TrainCorrectionRequest {
  text: string;
  correct_department_id: string;
  message_uuid: string;
  corrected_by?: string;
  language?: string;
  correction_notes?: string;
}

export async function trainCorrection(request: TrainCorrectionRequest): Promise<{ status: string }> {
  // Django endpoint that proxies to FastAPI (FastAPI is not exposed publicly)
  const response = await authenticatedFetch(`${API_BASE_URL}/train-correction/`, {
    method: 'POST',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData: ApiError = await response.json().catch(() => ({
      detail: 'Failed to train correction',
    }));
    const errorMessage = errorData.detail || errorData.message || errorData.error || 'Failed to train correction';
    if (response.status === 401 || errorMessage.includes('token') || errorMessage.includes('authentication') || errorMessage.includes('not valid')) {
      clearAuthTokens();
      throw new Error('Authentication failed. Please log in again.');
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data;
}

