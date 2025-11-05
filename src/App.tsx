/**
 * Main App Component
 * Root component with routing, providers, and global error handling
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
import { HelmetProvider } from 'react-helmet-async';
import { Suspense } from 'react';

// Components
import LoadingSpinner from './components/ui/LoadingSpinner';
import ErrorBoundary from './components/ui/ErrorBoundary';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import EncryptPage from './pages/EncryptPage';
import RecordsPage from './pages/RecordsPage';

// Auth components
import { useAuthStatus } from './hooks/useAuth';

// React Query configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    },
    mutations: {
      retry: 1,
    },
  },
});

/**
 * Protected Route Component
 * Redirects to login if user is not authenticated
 */
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStatus();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

/**
 * Public Route Component
 * Redirects to dashboard if user is already authenticated
 */
interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStatus();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

/**
 * App Component
 */
const App: React.FC = () => {
  return (
    <HelmetProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <Router>
            <div className="min-h-screen bg-slate-950 text-white">
              <Suspense 
                fallback={
                  <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                    <LoadingSpinner size="lg" />
                  </div>
                }
              >
                <Routes>
                  {/* Public routes */}
                  <Route
                    path="/login"
                    element={
                      <PublicRoute>
                        <LoginPage />
                      </PublicRoute>
                    }
                  />
                  <Route
                    path="/register"
                    element={
                      <PublicRoute>
                        <RegisterPage />
                      </PublicRoute>
                    }
                  />

                  {/* Dashboard routes */}
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <DashboardPage />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/encrypt"
                    element={
                      <ProtectedRoute>
                        <EncryptPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/records"
                    element={
                      <ProtectedRoute>
                        <RecordsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/audit"
                    element={
                      <ProtectedRoute>
                        <div className="min-h-screen bg-slate-950 py-8 px-4">
                          <div className="max-w-7xl mx-auto">
                            <div className="text-center">
                              <h1 className="text-3xl font-bold text-white mb-4">Audit Logs</h1>
                              <p className="text-slate-400 mb-8">
                                Comprehensive audit trail of all encryption activities
                              </p>
                              <div className="bg-slate-900 rounded-lg p-8 border border-slate-700">
                                <svg className="w-16 h-16 mx-auto text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                <p className="text-slate-400">
                                  Audit logging functionality is being implemented
                                </p>
                                <p className="text-slate-500 text-sm mt-2">
                                  Coming soon: Real-time monitoring and compliance reporting
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </ProtectedRoute>
                    }
                  />

                  {/* Default redirect */}
                  <Route 
                    path="/" 
                    element={<Navigate to="/dashboard" replace />}
                  />

                  {/* 404 Not Found */}
                  <Route
                    path="*"
                    element={
                      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                        <div className="text-center">
                          <h1 className="text-6xl font-bold text-yellow-400 mb-4">404</h1>
                          <h2 className="text-2xl font-semibold text-white mb-4">Page Not Found</h2>
                          <p className="text-slate-400 mb-8">
                            The page you're looking for doesn't exist.
                          </p>
                          <a
                            href="/dashboard"
                            className="bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-medium py-2 px-4 rounded-md transition-colors"
                          >
                            Go to Dashboard
                          </a>
                        </div>
                      </div>
                    }
                  />
                </Routes>
              </Suspense>

              {/* Global toast notifications */}
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#1e293b',
                    color: '#f1f5f9',
                    border: '1px solid #334155',
                  },
                  success: {
                    iconTheme: {
                      primary: '#facc15',
                      secondary: '#1e293b',
                    },
                  },
                  error: {
                    iconTheme: {
                      primary: '#ef4444',
                      secondary: '#1e293b',
                    },
                  },
                }}
              />

              {/* React Query DevTools (only in development) */}
              {import.meta.env['NODE_ENV'] === 'development' && (
                <ReactQueryDevtools initialIsOpen={false} />
              )}
            </div>
          </Router>
        </QueryClientProvider>
      </ErrorBoundary>
    </HelmetProvider>
  );
};

export default App;