/**
 * Input Component
 * Reusable input field with validation states and icons
 */

import { forwardRef, InputHTMLAttributes } from 'react';
import { clsx } from 'clsx';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | undefined;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isRequired?: boolean;
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      isRequired = false,
      fullWidth = false,
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    const inputClasses = clsx(
      'block w-full rounded-md border-0 py-2 px-3',
      'bg-primary-800 text-primary-100 placeholder-primary-400',
      'ring-1 ring-inset focus:ring-2 focus:ring-inset',
      'transition-colors duration-200',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      {
        'ring-primary-600 focus:ring-accent-400': !error,
        'ring-error-500 focus:ring-error-400': error,
        'pl-10': leftIcon,
        'pr-10': rightIcon,
        'w-full': fullWidth
      },
      className
    );

    const containerClasses = clsx('relative', {
      'w-full': fullWidth
    });

    return (
      <div className={containerClasses}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-primary-200 mb-2"
          >
            {label}
            {isRequired && <span className="text-error-400 ml-1">*</span>}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <div className="h-5 w-5 text-primary-400">{leftIcon}</div>
            </div>
          )}
          
          <input
            ref={ref}
            id={inputId}
            className={inputClasses}
            disabled={disabled}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={
              error ? `${inputId}-error` : 
              helperText ? `${inputId}-helper` : undefined
            }
            {...props}
          />
          
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <div className="h-5 w-5 text-primary-400">{rightIcon}</div>
            </div>
          )}
        </div>
        
        {error && (
          <p
            id={`${inputId}-error`}
            className="mt-2 text-sm text-error-400"
            role="alert"
          >
            {error}
          </p>
        )}
        
        {helperText && !error && (
          <p
            id={`${inputId}-helper`}
            className="mt-2 text-sm text-primary-400"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;