/**
 * Loading Spinner Component
 * Displays loading state with customizable size and text
 */

import React from 'react';
import { clsx } from 'clsx';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  className?: string;
  fullScreen?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  text,
  className,
  fullScreen = false
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const containerClasses = clsx(
    'flex flex-col items-center justify-center',
    {
      'fixed inset-0 bg-primary-900 bg-opacity-75 z-50': fullScreen,
      'p-8': fullScreen
    },
    className
  );

  const spinnerClasses = clsx(
    'animate-spin rounded-full border-2 border-primary-600 border-t-accent-400',
    sizeClasses[size]
  );

  return (
    <div className={containerClasses} role="status" aria-label="Loading">
      <div className={spinnerClasses} />
      {text && (
        <p className="mt-4 text-sm text-primary-300 animate-pulse">
          {text}
        </p>
      )}
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default LoadingSpinner;