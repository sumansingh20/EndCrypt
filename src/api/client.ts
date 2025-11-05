/**
 * Axios HTTP client configuration with authentication and error handling
 * Provides centralized API communication with automatic token management
 */

import axios, { 
  AxiosInstance, 
  AxiosRequestConfig, 
  AxiosResponse, 
  AxiosError 
} from 'axios';
import { ApiError } from '@/types/api';
import { getAuthToken, useAuthStore } from '@/state/authStore';

// Environment configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
const API_TIMEOUT = 10000; // 10 seconds

/**
 * Create and configure the main axios instance
 */
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: API_TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  // Request interceptor - add auth token
  client.interceptors.request.use(
    (config) => {
      // Get token from auth store (we'll implement this later)
      const token = getAuthToken();
      
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Add request timestamp for debugging
      config.metadata = { 
        startTime: Date.now(),
        requestId: generateRequestId()
      };

      return config;
    },
    (error: AxiosError) => {
      console.error('Request interceptor error:', error);
      return Promise.reject(error);
    }
  );

  // Response interceptor - handle errors and token expiration
  client.interceptors.response.use(
    (response: AxiosResponse) => {
      // Log response time for monitoring
      const { metadata } = response.config;
      if (metadata?.startTime) {
        const duration = Date.now() - metadata.startTime;
        console.debug(`API Response [${metadata.requestId}]: ${duration}ms`);
      }

      return response;
    },
    async (error: AxiosError) => {
      const originalRequest = error.config;

      // Handle 401 Unauthorized - token expired or invalid
      if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          // Try to refresh token
          await refreshAuthToken();
          
          // Retry original request with new token
          const token = getAuthToken();
          if (token && originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          
          return client(originalRequest);
        } catch (refreshError) {
          // Refresh failed, redirect to login
          console.error('Token refresh failed:', refreshError);
          handleAuthError();
          return Promise.reject(createApiError(error));
        }
      }

      // Handle other HTTP errors
      return Promise.reject(createApiError(error));
    }
  );

  return client;
};

/**
 * Transform axios error to standardized API error
 */
const createApiError = (error: AxiosError): ApiError => {
  const timestamp = new Date().toISOString();

  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    return {
      code: `HTTP_${status}`,
      message: (data as any)?.message || error.message || 'Request failed',
      details: {
        status,
        data,
        url: error.config?.url,
        method: error.config?.method?.toUpperCase()
      },
      timestamp
    };
  } 
  
  if (error.request) {
    // Network error - no response received
    return {
      code: 'NETWORK_ERROR',
      message: 'Network error - please check your connection',
      details: {
        url: error.config?.url,
        timeout: error.code === 'ECONNABORTED'
      },
      timestamp
    };
  }

  // Request setup error
  return {
    code: 'REQUEST_ERROR',
    message: error.message || 'Request configuration error',
    details: {},
    timestamp
  };
};

/**
 * Utility functions
 */
const refreshAuthToken = async (): Promise<void> => {
  try {
    await useAuthStore.getState().refreshToken();
  } catch (error) {
    // If refresh fails, logout user
    useAuthStore.getState().logout();
    throw error;
  }
};

const handleAuthError = (): void => {
  // Clear auth state and redirect to login
  useAuthStore.getState().logout();
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
};

/**
 * Generate unique request ID for debugging
 */
const generateRequestId = (): string => {
  return Math.random().toString(36).substring(2, 15);
};

/**
 * Enhanced request method with retry logic
 */
export const makeRequest = async <T>(
  config: AxiosRequestConfig,
  retries: number = 1
): Promise<T> => {
  const client = apiClient;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await client(config);
      return response.data;
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      
      // Wait before retry (exponential backoff)
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error('Max retries exceeded');
};

/**
 * Type-safe request wrapper
 */
export const request = {
  get: <T>(url: string, config?: AxiosRequestConfig): Promise<T> => 
    makeRequest<T>({ ...config, method: 'GET', url }),
    
  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => {
    console.log('🌐 API Client: POST request to', url, 'with data:', data);
    return makeRequest<T>({ ...config, method: 'POST', url, data });
  },
    
  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => 
    makeRequest<T>({ ...config, method: 'PUT', url, data }),
    
  patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => 
    makeRequest<T>({ ...config, method: 'PATCH', url, data }),
    
  delete: <T>(url: string, config?: AxiosRequestConfig): Promise<T> => 
    makeRequest<T>({ ...config, method: 'DELETE', url }),
};

// Create and export the main API client instance
export const apiClient = createApiClient();

// Export default client for direct usage
export default apiClient;

// Extend AxiosRequestConfig to include metadata
declare module 'axios' {
  interface AxiosRequestConfig {
    _retry?: boolean;
    metadata?: {
      startTime: number;
      requestId: string;
    };
  }
}