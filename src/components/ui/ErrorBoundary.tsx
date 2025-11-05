/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 */

import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: string | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.setState({
      error,
      errorInfo: errorInfo.componentStack
    });

    // Log error to monitoring service (e.g., Sentry)
    console.error('Error Boundary caught an error:', error, errorInfo);
    
    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error, { extra: errorInfo });
    }
  }

  handleReload = (): void => {
    window.location.reload();
  };

  handleGoHome = (): void => {
    window.location.href = '/';
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-primary-900 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-primary-800 rounded-lg border border-primary-700 p-8 text-center">
            <div className="mb-6">
              <div className="mx-auto w-16 h-16 bg-error-600 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-primary-100 mb-2">
                Something went wrong
              </h1>
              <p className="text-primary-300 text-sm">
                We're sorry, but something unexpected happened. Please try again.
              </p>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-6 text-left">
                <summary className="text-sm text-primary-400 cursor-pointer mb-2">
                  Technical Details
                </summary>
                <div className="bg-primary-950 rounded p-3 text-xs text-primary-300 overflow-auto max-h-32">
                  <div className="font-semibold text-error-400 mb-2">
                    {this.state.error.message}
                  </div>
                  <pre className="whitespace-pre-wrap">
                    {this.state.error.stack}
                  </pre>
                  {this.state.errorInfo && (
                    <div className="mt-2 pt-2 border-t border-primary-700">
                      <div className="font-semibold text-warning-400 mb-1">
                        Component Stack:
                      </div>
                      <pre className="whitespace-pre-wrap">
                        {this.state.errorInfo}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            <div className="space-y-3">
              <button
                onClick={this.handleReload}
                className="w-full bg-accent-400 hover:bg-accent-500 text-primary-900 font-medium py-2 px-4 rounded-md transition-colors duration-200"
              >
                Reload Page
              </button>
              <button
                onClick={this.handleGoHome}
                className="w-full bg-primary-700 hover:bg-primary-600 text-primary-100 font-medium py-2 px-4 rounded-md border border-primary-600 hover:border-primary-500 transition-all duration-200"
              >
                Go to Home
              </button>
            </div>

            <p className="mt-6 text-xs text-primary-400">
              Error ID: {Date.now().toString(36)}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;