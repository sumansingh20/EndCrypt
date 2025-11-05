/**
 * API endpoint functions implementing the backend contract
 * All functions return typed responses and handle errors consistently
 */

import { request } from './client';
import type {
  RegisterRequest,
  RegisterResponse,
  LoginRequest,
  AuthResponse,
  EncryptRequest,
  EncryptResponse,
  ListResponse,
  DecryptResponse,
  AuditResponse,
  AuditQuery,
  DashboardStats,
  ApiResponse
} from '@/types/api';

/**
 * Authentication endpoints
 */
export const authApi = {
  /**
   * Register a new user account
   */
  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    return request.post<RegisterResponse>('/api/register', data);
  },

  /**
   * Login with email and password
   */
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    return request.post<AuthResponse>('/api/login', data);
  },

  /**
   * Refresh authentication token
   */
  refresh: async (): Promise<AuthResponse> => {
    return request.post<AuthResponse>('/api/refresh');
  },

  /**
   * Logout and invalidate token
   */
  logout: async (): Promise<ApiResponse> => {
    return request.post<ApiResponse>('/api/logout');
  },

  /**
   * Get current user profile
   */
  profile: async (): Promise<ApiResponse> => {
    return request.get<ApiResponse>('/api/profile');
  }
};

/**
 * Encryption/Decryption endpoints
 */
export const encryptionApi = {
  /**
   * Encrypt financial transaction data
   */
  encrypt: async (data: EncryptRequest): Promise<EncryptResponse> => {
    return request.post<EncryptResponse>('/api/encrypt', data);
  },

  /**
   * Get list of encrypted records
   */
  list: async (page = 1, limit = 10): Promise<ListResponse> => {
    return request.get<ListResponse>(`/api/list?page=${page}&limit=${limit}`);
  },

  /**
   * Decrypt a specific record by ID
   */
  decrypt: async (id: string): Promise<DecryptResponse> => {
    return request.get<DecryptResponse>(`/api/decrypt/${encodeURIComponent(id)}`);
  },

  /**
   * Delete an encrypted record
   */
  delete: async (id: string): Promise<ApiResponse> => {
    return request.delete<ApiResponse>(`/api/records/${encodeURIComponent(id)}`);
  }
};

/**
 * Audit and monitoring endpoints
 */
export const auditApi = {
  /**
   * Get audit logs with optional filtering
   */
  getLogs: async (query: AuditQuery = {}): Promise<AuditResponse> => {
    const params = new URLSearchParams();
    
    if (query.from) params.append('from', query.from);
    if (query.to) params.append('to', query.to);
    if (query.action) params.append('action', query.action);
    if (query.page) params.append('page', query.page.toString());
    if (query.limit) params.append('limit', query.limit.toString());

    const queryString = params.toString();
    const url = queryString ? `/api/audit?${queryString}` : '/api/audit';
    
    return request.get<AuditResponse>(url);
  },

  /**
   * Export audit logs as CSV
   */
  exportLogs: async (query: AuditQuery = {}): Promise<Blob> => {
    const params = new URLSearchParams();
    
    if (query.from) params.append('from', query.from);
    if (query.to) params.append('to', query.to);
    if (query.action) params.append('action', query.action);

    const queryString = params.toString();
    const url = queryString ? `/api/audit/export?${queryString}` : '/api/audit/export';
    
    return request.get<Blob>(url, {
      responseType: 'blob',
      headers: {
        'Accept': 'text/csv'
      }
    });
  }
};

/**
 * Dashboard and analytics endpoints
 */
export const dashboardApi = {
  /**
   * Get dashboard statistics and metrics
   */
  getStats: async (): Promise<ApiResponse<DashboardStats>> => {
    return request.get<ApiResponse<DashboardStats>>('/api/dashboard/stats');
  },

  /**
   * Get encryption/decryption activity chart data
   */
  getActivityChart: async (days = 30): Promise<ApiResponse> => {
    return request.get<ApiResponse>(`/api/dashboard/activity?days=${days}`);
  },

  /**
   * Get alerts and notifications
   */
  getAlerts: async (): Promise<ApiResponse> => {
    return request.get<ApiResponse>('/api/dashboard/alerts');
  },

  /**
   * Dismiss an alert
   */
  dismissAlert: async (alertId: string): Promise<ApiResponse> => {
    return request.patch<ApiResponse>(`/api/dashboard/alerts/${encodeURIComponent(alertId)}/dismiss`);
  }
};

/**
 * System health and monitoring endpoints
 */
export const systemApi = {
  /**
   * Check API health status
   */
  health: async (): Promise<ApiResponse> => {
    return request.get<ApiResponse>('/api/health');
  },

  /**
   * Get system version information
   */
  version: async (): Promise<ApiResponse> => {
    return request.get<ApiResponse>('/api/version');
  },

  /**
   * Check AWS KMS connectivity
   */
  kmsStatus: async (): Promise<ApiResponse> => {
    return request.get<ApiResponse>('/api/system/kms-status');
  }
};

/**
 * File upload/download utilities
 */
export const fileApi = {
  /**
   * Upload a file (for bulk encryption)
   */
  upload: async (file: File, onProgress?: (progress: number) => void): Promise<ApiResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    return request.post<ApiResponse>('/api/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      }
    });
  },

  /**
   * Download decrypted data as file
   */
  download: async (recordId: string, format: 'json' | 'csv' = 'json'): Promise<Blob> => {
    return request.get<Blob>(`/api/files/download/${encodeURIComponent(recordId)}?format=${format}`, {
      responseType: 'blob'
    });
  }
};

/**
 * Utility function to build query parameters
 */
export const buildQueryParams = (params: Record<string, string | number | boolean | undefined>): string => {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      searchParams.append(key, value.toString());
    }
  });
  
  return searchParams.toString();
};

/**
 * Combined API object for easy importing
 */
export const api = {
  auth: authApi,
  encryption: encryptionApi,
  audit: auditApi,
  dashboard: dashboardApi,
  system: systemApi,
  file: fileApi
};

export default api;