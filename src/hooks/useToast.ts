/**
 * Toast notification hooks
 * Wrapper around react-hot-toast with consistent styling
 */

import toast, { 
  Toast, 
  ToastOptions, 
  Renderable, 
  ValueFunction,
  resolveValue 
} from 'react-hot-toast';

type ToastType = 'success' | 'error' | 'loading' | 'info' | 'warning';

interface CustomToastOptions extends ToastOptions {
  duration?: number;
  position?: 'top-center' | 'top-right' | 'top-left' | 'bottom-center' | 'bottom-right' | 'bottom-left';
}

/**
 * Default toast styling configuration
 */
const defaultToastOptions: CustomToastOptions = {
  duration: 4000,
  position: 'top-right',
  style: {
    background: '#1e293b',
    color: '#f1f5f9',
    border: '1px solid #334155',
    borderRadius: '8px',
    padding: '12px 16px',
    fontSize: '14px',
    fontWeight: '500'
  }
};

/**
 * Toast notification hook
 */
export const useToast = () => {
  const showToast = (
    message: Renderable,
    type: ToastType = 'info',
    options: CustomToastOptions = {}
  ): string => {
    const mergedOptions = { ...defaultToastOptions, ...options };

    switch (type) {
      case 'success':
        return toast.success(message, {
          ...mergedOptions,
          style: {
            ...mergedOptions.style,
            background: '#166534',
            color: '#dcfce7',
            border: '1px solid #22c55e'
          },
          iconTheme: {
            primary: '#22c55e',
            secondary: '#dcfce7'
          }
        });

      case 'error':
        return toast.error(message, {
          ...mergedOptions,
          style: {
            ...mergedOptions.style,
            background: '#991b1b',
            color: '#fee2e2',
            border: '1px solid #ef4444'
          },
          iconTheme: {
            primary: '#ef4444',
            secondary: '#fee2e2'
          }
        });

      case 'warning':
        return toast(message, {
          ...mergedOptions,
          style: {
            ...mergedOptions.style,
            background: '#92400e',
            color: '#fde68a',
            border: '1px solid #f59e0b'
          },
          icon: '⚠️'
        });

      case 'loading':
        return toast.loading(message, {
          ...mergedOptions,
          style: {
            ...mergedOptions.style,
            background: '#1e40af',
            color: '#dbeafe',
            border: '1px solid #3b82f6'
          }
        });

      case 'info':
      default:
        return toast(message, {
          ...mergedOptions,
          icon: 'ℹ️'
        });
    }
  };

  const success = (message: Renderable, options?: CustomToastOptions): string => {
    return showToast(message, 'success', options);
  };

  const error = (message: Renderable, options?: CustomToastOptions): string => {
    return showToast(message, 'error', options);
  };

  const warning = (message: Renderable, options?: CustomToastOptions): string => {
    return showToast(message, 'warning', options);
  };

  const info = (message: Renderable, options?: CustomToastOptions): string => {
    return showToast(message, 'info', options);
  };

  const loading = (message: Renderable, options?: CustomToastOptions): string => {
    return showToast(message, 'loading', options);
  };

  const dismiss = (toastId?: string): void => {
    toast.dismiss(toastId);
  };

  const promise = <T,>(
    promise: Promise<T>,
    messages: {
      loading: Renderable;
      success: ValueFunction<Renderable, T>;
      error: ValueFunction<Renderable, unknown>;
    },
    options?: CustomToastOptions
  ): Promise<T> => {
    return toast.promise(promise, messages, {
      ...defaultToastOptions,
      ...options,
      style: {
        ...defaultToastOptions.style,
        ...options?.style
      }
    });
  };

  // Convenience methods for common scenarios
  const authError = (message = 'Authentication failed. Please try again.'): string => {
    return error(message, { duration: 5000 });
  };

  const networkError = (message = 'Network error. Please check your connection.'): string => {
    return error(message, { duration: 6000 });
  };

  const validationError = (message: string): string => {
    return warning(message, { duration: 4000 });
  };

  const copySuccess = (text = 'Copied to clipboard!'): string => {
    return success(text, { duration: 2000 });
  };

  const encryptSuccess = (): string => {
    return success('Data encrypted successfully!', { duration: 3000 });
  };

  const decryptSuccess = (): string => {
    return success('Data decrypted successfully!', { duration: 3000 });
  };

  return {
    // Core methods
    toast: showToast,
    success,
    error,
    warning,
    info,
    loading,
    dismiss,
    promise,
    
    // Convenience methods
    authError,
    networkError,
    validationError,
    copySuccess,
    encryptSuccess,
    decryptSuccess
  };
};

/**
 * Global toast configuration
 */
export const configureToast = (): void => {
  // No additional global configuration needed
  // react-hot-toast works well with default settings
};

export default useToast;