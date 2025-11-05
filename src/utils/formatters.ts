/**
 * Data formatting utilities
 * Functions for formatting dates, numbers, currency, and other data types
 */

import { format, formatDistanceToNow as dateFormatDistanceToNow, isValid, parseISO } from 'date-fns';

/**
 * Format currency with proper locale and symbol
 */
export const formatCurrency = (
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string => {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    // Fallback for invalid currency codes
    return `${currency.toUpperCase()} ${amount.toFixed(2)}`;
  }
};

/**
 * Format large numbers with abbreviations (K, M, B)
 */
export const formatNumber = (
  num: number,
  decimals: number = 1
): string => {
  if (num === 0) return '0';
  
  const k = 1000;
  const sizes = ['', 'K', 'M', 'B', 'T'];
  const i = Math.floor(Math.log(Math.abs(num)) / Math.log(k));
  
  if (i === 0) return num.toString();
  
  return (num / Math.pow(k, i)).toFixed(decimals) + sizes[i];
};

/**
 * Format percentage with specified decimal places
 */
export const formatPercentage = (
  value: number,
  decimals: number = 1
): string => {
  return `${(value * 100).toFixed(decimals)}%`;
};

/**
 * Format date to human readable string
 */
export const formatDate = (
  date: string | Date,
  formatString: string = 'MMM dd, yyyy'
): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) {
      return 'Invalid date';
    }
    return format(dateObj, formatString);
  } catch {
    return 'Invalid date';
  }
};

/**
 * Format date to relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (date: string | Date): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) {
      return 'Invalid date';
    }
    return dateFormatDistanceToNow(dateObj, { addSuffix: true });
  } catch {
    return 'Invalid date';
  }
};

/**
 * Export the date-fns formatDistanceToNow function directly
 */
export const formatDistanceToNow = (date: string | Date): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) {
      return 'Invalid date';
    }
    return dateFormatDistanceToNow(dateObj);
  } catch {
    return 'Invalid date';
  }
};

/**
 * Format date and time for display
 */
export const formatDateTime = (
  date: string | Date,
  includeSeconds: boolean = false
): string => {
  const formatString = includeSeconds 
    ? 'MMM dd, yyyy HH:mm:ss'
    : 'MMM dd, yyyy HH:mm';
  return formatDate(date, formatString);
};

/**
 * Format transaction ID for display
 */
export const formatTransactionId = (id: string): string => {
  if (!id) return '';
  
  // Add dashes for better readability if it's a long string
  if (id.length > 12) {
    return id.replace(/(.{4})/g, '$1-').slice(0, -1);
  }
  
  return id.toUpperCase();
};

/**
 * Truncate string with ellipsis
 */
export const truncateString = (
  str: string,
  maxLength: number,
  addEllipsis: boolean = true
): string => {
  if (str.length <= maxLength) return str;
  
  const truncated = str.slice(0, maxLength);
  return addEllipsis ? `${truncated}...` : truncated;
};

/**
 * Format file size in human readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Format duration in milliseconds to human readable string
 */
export const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
  return `${(ms / 3600000).toFixed(1)}h`;
};

/**
 * Format phone number for display
 */
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  
  if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  
  return phone; // Return original if can't format
};

/**
 * Format credit card number for display (masked)
 */
export const formatCreditCard = (cardNumber: string): string => {
  const cleaned = cardNumber.replace(/\D/g, '');
  
  if (cleaned.length < 4) return cardNumber;
  
  const lastFour = cleaned.slice(-4);
  const masked = '*'.repeat(cleaned.length - 4);
  
  return `${masked}${lastFour}`.replace(/(.{4})/g, '$1 ').trim();
};

/**
 * Capitalize first letter of each word
 */
export const toTitleCase = (str: string): string => {
  return str.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};

/**
 * Convert camelCase to Title Case
 */
export const camelToTitle = (str: string): string => {
  return str
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
};

/**
 * Generate initials from a full name
 */
export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

/**
 * Color utilities for status indicators
 */
export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    success: 'text-success-400 bg-success-400/10',
    error: 'text-error-400 bg-error-400/10',
    warning: 'text-warning-400 bg-warning-400/10',
    info: 'text-blue-400 bg-blue-400/10',
    pending: 'text-yellow-400 bg-yellow-400/10',
    active: 'text-green-400 bg-green-400/10',
    inactive: 'text-gray-400 bg-gray-400/10',
  };
  
  return colors[status.toLowerCase()] || colors['info'] || 'text-blue-400 bg-blue-400/10';
};

/**
 * Generate a hash code for a string (for consistent colors)
 */
export const hashCode = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
};

/**
 * Generate consistent color for a string
 */
export const getColorForString = (str: string): string => {
  const colors = [
    'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
    'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
  ];
  
  const hash = hashCode(str);
  const colorIndex = hash % colors.length;
  return colors[colorIndex] || 'bg-blue-500';
};