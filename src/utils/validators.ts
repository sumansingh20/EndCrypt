/**
 * Validation utilities
 * Functions for form validation and data validation
 */

import { z } from 'zod';

/**
 * Common validation schemas
 */
export const validationSchemas = {
  email: z.string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
    
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
    
  transactionId: z.string()
    .min(1, 'Transaction ID is required')
    .max(100, 'Transaction ID must be less than 100 characters')
    .regex(/^[A-Za-z0-9-_]+$/, 'Transaction ID can only contain letters, numbers, hyphens, and underscores'),
    
  amount: z.number()
    .min(0.01, 'Amount must be greater than 0')
    .max(999999999.99, 'Amount is too large')
    .multipleOf(0.01, 'Amount can only have up to 2 decimal places'),
    
  currency: z.string()
    .length(3, 'Currency must be 3 characters')
    .regex(/^[A-Z]{3}$/, 'Currency must be in ISO format (e.g., USD, EUR)'),
    
  personName: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .trim(),
    
  notes: z.string()
    .max(500, 'Notes must be less than 500 characters')
    .optional(),
    
  phoneNumber: z.string()
    .regex(/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number')
    .optional(),
};

/**
 * Registration form schema
 */
export const registerSchema = z.object({
  name: validationSchemas.name,
  email: validationSchemas.email,
  password: validationSchemas.password,
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

/**
 * Login form schema
 */
export const loginSchema = z.object({
  email: validationSchemas.email,
  password: z.string().min(1, 'Password is required'),
});

/**
 * Encryption form schema
 */
export const encryptionSchema = z.object({
  transactionId: validationSchemas.transactionId,
  amount: validationSchemas.amount,
  currency: validationSchemas.currency,
  payer: validationSchemas.personName,
  payee: validationSchemas.personName,
  notes: validationSchemas.notes,
});

/**
 * Profile update schema
 */
export const profileSchema = z.object({
  name: validationSchemas.name,
  email: validationSchemas.email,
  phoneNumber: validationSchemas.phoneNumber,
});

/**
 * Password change schema
 */
export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: validationSchemas.password,
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

/**
 * Audit log filter schema
 */
export const auditFilterSchema = z.object({
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  action: z.string().optional(),
  userId: z.string().optional(),
});

/**
 * Type inference from schemas
 */
export type RegisterFormData = z.infer<typeof registerSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type EncryptionFormData = z.infer<typeof encryptionSchema>;
export type ProfileFormData = z.infer<typeof profileSchema>;
export type PasswordChangeFormData = z.infer<typeof passwordChangeSchema>;
export type AuditFilterFormData = z.infer<typeof auditFilterSchema>;

/**
 * Custom validation functions
 */

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 */
export const getPasswordStrength = (password: string): {
  score: number;
  feedback: string[];
} => {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('At least 8 characters');
  }

  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('One uppercase letter');
  }

  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('One lowercase letter');
  }

  if (/[0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push('One number');
  }

  if (/[^A-Za-z0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push('One special character');
  }

  return { score, feedback };
};

/**
 * Validate file type
 */
export const isValidFileType = (
  file: File,
  allowedTypes: string[]
): boolean => {
  return allowedTypes.includes(file.type);
};

/**
 * Validate file size
 */
export const isValidFileSize = (
  file: File,
  maxSizeInMB: number
): boolean => {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  return file.size <= maxSizeInBytes;
};

/**
 * Validate currency code (ISO 4217)
 */
export const isValidCurrencyCode = (currency: string): boolean => {
  const validCurrencies = [
    'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY',
    'SEK', 'NZD', 'MXN', 'SGD', 'HKD', 'NOK', 'TRY', 'RUB',
    'INR', 'BRL', 'ZAR', 'KRW'
  ];
  return validCurrencies.includes(currency.toUpperCase());
};

/**
 * Sanitize HTML content
 */
export const sanitizeHtml = (html: string): string => {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
};

/**
 * Validate and sanitize user input
 */
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+=/gi, ''); // Remove event handlers
};

/**
 * Check if a date is valid
 */
export const isValidDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

/**
 * Validate credit card number using Luhn algorithm
 */
export const isValidCreditCard = (cardNumber: string): boolean => {
  const cleaned = cardNumber.replace(/\D/g, '');
  
  if (cleaned.length < 13 || cleaned.length > 19) {
    return false;
  }

  let sum = 0;
  let isEven = false;

  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned.charAt(i), 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
};

/**
 * Validate US phone number
 */
export const isValidUSPhoneNumber = (phoneNumber: string): boolean => {
  const cleaned = phoneNumber.replace(/\D/g, '');
  return /^1?[2-9]\d{2}[2-9]\d{2}\d{4}$/.test(cleaned);
};

/**
 * Validate postal code
 */
export const isValidPostalCode = (
  postalCode: string,
  country: string = 'US'
): boolean => {
  const patterns: Record<string, RegExp> = {
    US: /^\d{5}(-\d{4})?$/,
    CA: /^[A-Za-z]\d[A-Za-z] \d[A-Za-z]\d$/,
    UK: /^[A-Za-z]{1,2}\d[A-Za-z\d]? \d[A-Za-z]{2}$/,
    DE: /^\d{5}$/,
    FR: /^\d{5}$/,
  };

  const pattern = patterns[country.toUpperCase()];
  return pattern ? pattern.test(postalCode) : true;
};