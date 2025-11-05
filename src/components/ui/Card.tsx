/**
 * Card Component
 * Reusable card container with optional header and footer
 */

import { ReactNode } from 'react';
import { clsx } from 'clsx';

export interface CardProps {
  children: ReactNode;
  className?: string;
  header?: ReactNode;
  footer?: ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outlined' | 'elevated';
}

const Card: React.FC<CardProps> = ({
  children,
  className,
  header,
  footer,
  padding = 'md',
  variant = 'default'
}) => {
  const baseClasses = [
    'bg-primary-800',
    'rounded-lg',
    'transition-all duration-200'
  ];

  const variantClasses = {
    default: 'border border-primary-700',
    outlined: 'border-2 border-primary-600',
    elevated: 'shadow-lg border border-primary-700 hover:shadow-xl'
  };

  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  const cardClasses = clsx(
    baseClasses,
    variantClasses[variant],
    paddingClasses[padding],
    className
  );

  const headerClasses = clsx(
    'border-b border-primary-700 pb-4 mb-4',
    {
      'px-6 pt-6': padding === 'none',
      'px-4 pt-4': padding === 'sm',
      'px-8 pt-8': padding === 'lg'
    }
  );

  const footerClasses = clsx(
    'border-t border-primary-700 pt-4 mt-4',
    {
      'px-6 pb-6': padding === 'none',
      'px-4 pb-4': padding === 'sm',
      'px-8 pb-8': padding === 'lg'
    }
  );

  return (
    <div className={cardClasses}>
      {header && (
        <div className={headerClasses}>
          {header}
        </div>
      )}
      
      <div className={padding === 'none' ? 'px-6' : ''}>
        {children}
      </div>
      
      {footer && (
        <div className={footerClasses}>
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;