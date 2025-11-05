/**
 * TypeScript type definitions for the Finance Encryption API
 * Defines all API request/response interfaces and domain models
 */

// Core domain models
export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface EncryptedRecord {
  id: string;
  encryptedBlobId: string;
  createdAt: string;
  updatedAt: string;
  meta?: Record<string, unknown>;
  userId: string;
}

export interface DecryptedRecord {
  id: string;
  transactionId: string;
  amount: number;
  currency: string;
  payer: string;
  payee: string;
  notes?: string;
  decryptedAt: string;
}

export interface AuditLog {
  id: string;
  action: AuditAction;
  userId: string;
  timestamp: string;
  details: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export type AuditAction = 
  | 'user_login'
  | 'user_logout'
  | 'user_register'
  | 'data_encrypt'
  | 'data_decrypt'
  | 'data_list'
  | 'audit_view';

// API Request types
export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface EncryptRequest {
  transactionId: string;
  amount: number;
  currency: string;
  payer: string;
  payee: string;
  notes?: string;
}

export interface AuditQuery {
  from?: string;
  to?: string;
  action?: AuditAction;
  page?: number;
  limit?: number;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
  expiresAt: string;
}

export interface RegisterResponse extends ApiResponse<{ user: User }> {}

export interface EncryptResponse extends ApiResponse<{
  id: string;
  encryptedBlobId: string;
  createdAt: string;
}> {}

export interface ListResponse extends ApiResponse<{
  records: EncryptedRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> {}

export interface DecryptResponse extends ApiResponse<{
  record: DecryptedRecord;
}> {}

export interface AuditResponse extends ApiResponse<{
  logs: AuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> {}

// Dashboard analytics types
export interface DashboardStats {
  totalRecords: number;
  totalEncrypted: number;
  totalDecrypted: number;
  lastEncryptedAt?: string;
  activeKeys: number;
  alerts: Alert[];
}

export interface Alert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: string;
  dismissed: boolean;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
  }[];
}

// Error types
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

export interface ValidationError extends ApiError {
  field: string;
  value: unknown;
}

// Authentication context types
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Form validation types
export type FormErrors<T> = {
  [K in keyof T]?: string;
};

// Environment configuration
export interface AppConfig {
  apiBaseUrl: string;
  appName: string;
  version: string;
  environment: 'development' | 'staging' | 'production';
}

// Utility types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type SortOrder = 'asc' | 'desc';

export type SortableField = 'createdAt' | 'updatedAt' | 'amount' | 'transactionId';

// Hook return types
export interface UseApiQuery<T> {
  data: T | undefined;
  isLoading: boolean;
  isError: boolean;
  error: ApiError | null;
  refetch: () => void;
}

export interface UseApiMutation<TRequest, TResponse> {
  mutate: (data: TRequest) => Promise<TResponse>;
  isLoading: boolean;
  isError: boolean;
  error: ApiError | null;
  reset: () => void;
}