/**
 * Development Bypass Utilities
 * Allows bypassing authentication in development while preserving production code
 */

import { useAuthStore } from '@/state/authStore';

/**
 * Mock admin user data for development bypass
 */
const MOCK_ADMIN_USER = {
  id: 'admin-user-001',
  name: 'System Administrator',
  email: 'admin@endcrypt.in',
  emailVerified: true,
  isActive: true,
  role: 'admin',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  lastLogin: new Date().toISOString(),
  loginCount: 1
};

/**
 * Mock JWT token for development bypass
 */
const MOCK_TOKEN = 'dev-bypass-token-' + Date.now();

/**
 * Check if development login bypass is enabled
 */
export const isDevBypassEnabled = (): boolean => {
  // Bypass disabled - require real authentication
  const FORCE_DEV_BYPASS = false;
  
  if (FORCE_DEV_BYPASS) {
    console.log('🚧 FORCED Development Bypass Active');
    return true;
  }
  
  const bypassEnabled = import.meta.env['VITE_DEV_BYPASS_LOGIN'] === 'true';
  const isDev = import.meta.env['NODE_ENV'] === 'development';
  console.log('🔍 Development Bypass Check:', { 
    bypassEnabled, 
    isDev, 
    env: import.meta.env['VITE_DEV_BYPASS_LOGIN'],
    result: bypassEnabled && isDev 
  });
  return bypassEnabled && isDev;
};

/**
 * Initialize development bypass if enabled
 * This simulates a successful login without actual authentication
 */
export const initDevBypass = async (): Promise<void> => {
  if (!isDevBypassEnabled()) return;

  const authStore = useAuthStore.getState();
  
  // Check if already authenticated
  if (authStore.isAuthenticated) return;

  console.log('🚧 Development Bypass: Attempting real admin login');
  
  try {
    // Try to do a real login with the admin user
    await authStore.login({
      email: 'admin@endcrypt.in',
      password: 'admin123'
    });
    console.log('✅ Development Bypass: Real admin login successful');
  } catch (error) {
    console.log('⚠️ Development Bypass: Real login failed, using mock auth');
    
    // Fallback to mock auth state
    useAuthStore.setState({
      user: MOCK_ADMIN_USER,
      token: MOCK_TOKEN,
      isAuthenticated: true,
      isLoading: false,
      error: null
    });
  }
};

/**
 * Development-only route guard bypass
 */
export const shouldBypassAuth = (): boolean => {
  return isDevBypassEnabled();
};

/**
 * Get development info for display
 */
export const getDevBypassInfo = () => {
  if (!isDevBypassEnabled()) return null;
  
  return {
    enabled: true,
    user: MOCK_ADMIN_USER,
    message: 'Development bypass active - authentication disabled',
    warning: 'This is for development only. Disable VITE_DEV_BYPASS_LOGIN in production.'
  };
};