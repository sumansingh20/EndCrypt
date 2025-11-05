/**
 * Zustand authentication store
 * Manages user authentication state, JWT tokens, and auth-related actions
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { authApi } from '@/api/endpoints';
import type { User, AuthState, LoginRequest, RegisterRequest } from '@/types/api';

interface AuthStore extends AuthState {
  // Actions
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  
  // Computed properties
  isTokenExpired: () => boolean;
  getTokenExpirationTime: () => number | null;
}

interface PersistedAuthData {
  user: User | null;
  token: string | null;
  tokenExpiration: number | null;
}

/**
 * Check if JWT token is expired
 */
const isJWTExpired = (token: string): boolean => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3 || !parts[1]) return true;
    
    const payload = JSON.parse(atob(parts[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  } catch {
    return true;
  }
};

/**
 * Extract expiration time from JWT token
 */
const getJWTExpiration = (token: string): number | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3 || !parts[1]) return null;
    
    const payload = JSON.parse(atob(parts[1]));
    return payload.exp * 1000; // Convert to milliseconds
  } catch {
    return null;
  }
};

/**
 * Custom storage implementation that only persists essential data
 */
const createSecureStorage = () => ({
  getItem: (name: string): string | null => {
    try {
      const item = localStorage.getItem(name);
      if (!item) return null;
      
      const parsed: PersistedAuthData = JSON.parse(item);
      
      // Check if token is expired on load
      if (parsed.token && isJWTExpired(parsed.token)) {
        localStorage.removeItem(name);
        return null;
      }
      
      return item;
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    try {
      localStorage.setItem(name, value);
    } catch (error) {
      console.error('Failed to persist auth state:', error);
    }
  },
  removeItem: (name: string): void => {
    try {
      localStorage.removeItem(name);
    } catch (error) {
      console.error('Failed to remove auth state:', error);
    }
  }
});

/**
 * Main authentication store
 */
export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (credentials: LoginRequest) => {
        console.log('🔐 AuthStore: Starting login process...', { email: credentials.email });
        set({ isLoading: true, error: null });
        
        try {
          console.log('🔐 AuthStore: Calling API login...');
          const response = await authApi.login(credentials);
          console.log('🔐 AuthStore: API response received:', { success: response.success, hasToken: !!response.token, hasUser: !!response.user });
          
          if (response.success && response.token && response.user) {
            const tokenExpiration = getJWTExpiration(response.token);
            console.log('🔐 AuthStore: Setting authenticated state...');
            
            set({
              user: response.user,
              token: response.token,
              isAuthenticated: true,
              isLoading: false,
              error: null
            });

            // Set up automatic token refresh
            if (tokenExpiration) {
              scheduleTokenRefresh(tokenExpiration);
            }
            console.log('✅ AuthStore: Login completed successfully');
          } else {
            console.error('❌ AuthStore: Invalid response format:', response);
            throw new Error('Login failed - invalid response');
          }
        } catch (error) {
          console.error('❌ AuthStore: Login error:', error);
          const errorMessage = error instanceof Error ? error.message : 'Login failed';
          set({ 
            isLoading: false, 
            error: errorMessage,
            isAuthenticated: false,
            user: null,
            token: null
          });
          throw error;
        }
      },

      register: async (userData: RegisterRequest) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await authApi.register(userData);
          
          if (response.success && response.data?.user) {
            // Registration successful, but user needs to login
            set({
              isLoading: false,
              error: null
            });
          } else {
            throw new Error(response.error || 'Registration failed');
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Registration failed';
          set({ 
            isLoading: false, 
            error: errorMessage
          });
          throw error;
        }
      },

      logout: () => {
        // Clear token refresh timeout
        clearTokenRefreshTimeout();
        
        // Call logout API (fire and forget)
        authApi.logout().catch(console.error);
        
        // Clear state
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null
        });
      },

      refreshToken: async () => {
        const { token } = get();
        
        if (!token || isJWTExpired(token)) {
          get().logout();
          return;
        }
        
        try {
          const response = await authApi.refresh();
          
          if (response.success && response.token && response.user) {
            const tokenExpiration = getJWTExpiration(response.token);
            
            set({
              user: response.user,
              token: response.token,
              isAuthenticated: true,
              error: null
            });

            // Schedule next refresh
            if (tokenExpiration) {
              scheduleTokenRefresh(tokenExpiration);
            }
          } else {
            throw new Error('Token refresh failed');
          }
        } catch (error) {
          console.error('Token refresh failed:', error);
          get().logout();
        }
      },

      clearError: () => {
        set({ error: null });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      // Computed properties
      isTokenExpired: () => {
        const { token } = get();
        return !token || isJWTExpired(token);
      },

      getTokenExpirationTime: () => {
        const { token } = get();
        return token ? getJWTExpiration(token) : null;
      }
    }),
    {
      name: 'finance-encryption-auth',
      storage: createJSONStorage(() => createSecureStorage()),
      partialize: (state): PersistedAuthData => ({
        user: state.user,
        token: state.token,
        tokenExpiration: state.getTokenExpirationTime()
      }),
      onRehydrateStorage: () => (state) => {
        // Check token validity on rehydration
        if (state?.token && isJWTExpired(state.token)) {
          state.logout();
        } else if (state?.token) {
          // Schedule token refresh for valid tokens
          const expiration = getJWTExpiration(state.token);
          if (expiration) {
            scheduleTokenRefresh(expiration);
          }
        }
      }
    }
  )
);

/**
 * Token refresh scheduling
 */
let refreshTimeoutId: NodeJS.Timeout | null = null;

const scheduleTokenRefresh = (expirationTime: number) => {
  clearTokenRefreshTimeout();
  
  // Refresh token 5 minutes before expiration
  const refreshTime = expirationTime - Date.now() - (5 * 60 * 1000);
  
  if (refreshTime > 0) {
    refreshTimeoutId = setTimeout(() => {
      useAuthStore.getState().refreshToken();
    }, refreshTime);
  }
};

const clearTokenRefreshTimeout = () => {
  if (refreshTimeoutId) {
    clearTimeout(refreshTimeoutId);
    refreshTimeoutId = null;
  }
};

/**
 * Auth helper functions for API client
 */
export const getAuthToken = (): string | null => {
  return useAuthStore.getState().token;
};

export const isAuthenticated = (): boolean => {
  return useAuthStore.getState().isAuthenticated && !useAuthStore.getState().isTokenExpired();
};

/**
 * Higher-order component for protected routes
 */
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> => {
  return (props: P) => {
    const { isAuthenticated } = useAuthStore();
    
    if (!isAuthenticated) {
      // Redirect to login or show unauthorized message
      window.location.href = '/login';
      return null;
    }
    
    return <Component {...props} />;
  };
};

/**
 * Hook to access current user
 */
export const useCurrentUser = () => {
  return useAuthStore((state) => state.user);
};

/**
 * Hook to access auth status
 */
export const useAuthStatus = () => {
  return useAuthStore((state) => ({
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    isTokenExpired: state.isTokenExpired()
  }));
};