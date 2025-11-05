/**
 * Authentication hooks
 * Custom React hooks for auth-related functionality
 */

import { useCallback } from 'react';
import { useAuthStore } from '@/state/authStore';
import type { LoginRequest, RegisterRequest } from '@/types/api';

/**
 * Hook for authentication actions
 */
export const useAuth = () => {
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    clearError,
    isTokenExpired
  } = useAuthStore();

  const handleLogin = useCallback(async (credentials: LoginRequest) => {
    try {
      await login(credentials);
    } catch (error) {
      // Error is already handled in the store
      throw error;
    }
  }, [login]);

  const handleRegister = useCallback(async (userData: RegisterRequest) => {
    try {
      await register(userData);
    } catch (error) {
      // Error is already handled in the store
      throw error;
    }
  }, [register]);

  const handleLogout = useCallback(() => {
    logout();
  }, [logout]);

  return {
    // State
    user,
    isAuthenticated: isAuthenticated && !isTokenExpired(),
    isLoading,
    error,
    
    // Actions
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    clearError
  };
};

/**
 * Hook to get current user information
 */
export const useCurrentUser = () => {
  const user = useAuthStore((state) => state.user);
  return user;
};

/**
 * Hook to check auth status
 */
export const useAuthStatus = () => {
  const { isAuthenticated, isLoading, error, isTokenExpired } = useAuthStore();
  
  return {
    isAuthenticated: isAuthenticated && !isTokenExpired(),
    isLoading,
    error,
    isTokenExpired: isTokenExpired()
  };
};

/**
 * Hook for protected route logic
 */
export const useRequireAuth = () => {
  const { isAuthenticated, isTokenExpired } = useAuthStore();
  
  return {
    isAuthorized: isAuthenticated && !isTokenExpired(),
    redirectToLogin: () => {
      window.location.href = '/login';
    }
  };
};