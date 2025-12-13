export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  role?: string;
  staff_role?: string;
  department_id?: string | null;
  user_uuid?: string;
  username?: string;
}

export interface ApiError {
  detail?: string;
  message?: string;
  error?: string;
}

