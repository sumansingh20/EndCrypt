/**
 * Register Page
 * User registration form with validation and password strength indicator
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-hot-toast';

// Components
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/ui/LoadingSpinner';

// Hooks
import { useAuth } from '../hooks/useAuth';

// Validation
import { registerSchema, type RegisterFormData, getPasswordStrength } from '../utils/validators';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register: registerUser, isLoading, error } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setError
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange'
  });

  const password = watch('password');
  const passwordStrength = password ? getPasswordStrength(password) : { score: 0, feedback: [] };

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await registerUser({
        name: data.name.trim(),
        email: data.email.toLowerCase().trim(),
        password: data.password
      });
      
      toast.success('Account created successfully! Please log in.');
      navigate('/login');
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Handle specific error cases
      if (error.response?.status === 409) {
        setError('email', { message: 'An account with this email already exists' });
      } else if (error.response?.status === 400) {
        const errorData = error.response.data;
        if (errorData.field) {
          setError(errorData.field as keyof RegisterFormData, { 
            message: errorData.message 
          });
        } else {
          toast.error(errorData.message || 'Registration failed. Please check your information.');
        }
      } else {
        toast.error(error.response?.data?.message || 'Registration failed. Please try again.');
      }
    }
  };

  const getPasswordStrengthColor = (score: number) => {
    if (score < 2) return 'bg-red-500';
    if (score < 4) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthLabel = (score: number) => {
    if (score < 2) return 'Weak';
    if (score < 4) return 'Fair';
    return 'Strong';
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center mb-6">
            <svg className="w-8 h-8 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">
            Create your account
          </h2>
          <p className="text-slate-400">
            Join EndCrypt and start securing your financial data
          </p>
        </div>

        {/* Registration Form */}
        <Card className="p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Global Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-red-400 text-sm">{error}</div>
                </div>
              </div>
            )}

            {/* Full Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
                Full Name *
              </label>
              <Input
                id="name"
                type="text"
                autoComplete="name"
                placeholder="Enter your full name"
                {...register('name')}
                error={errors.name?.message || undefined}
                disabled={isLoading}
                leftIcon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                }
              />
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                Email Address *
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="Enter your email"
                {...register('email')}
                error={errors.email?.message || undefined}
                disabled={isLoading}
                leftIcon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                }
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                Password *
              </label>
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Create a strong password"
                {...register('password')}
                error={errors.password?.message || undefined}
                disabled={isLoading}
                leftIcon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                }
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 hover:text-slate-300 transition-colors"
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                }
              />

              {/* Password Strength Indicator */}
              {password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-400">Password strength:</span>
                    <span className={`text-xs font-medium ${
                      passwordStrength.score < 2 ? 'text-red-400' :
                      passwordStrength.score < 4 ? 'text-yellow-400' :
                      'text-green-400'
                    }`}>
                      {getPasswordStrengthLabel(passwordStrength.score)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor(passwordStrength.score)}`}
                      style={{ width: `${Math.min(100, (passwordStrength.score / 5) * 100)}%` }}
                    />
                  </div>
                  {passwordStrength.feedback.length > 0 && (
                    <ul className="mt-2 text-xs text-slate-400 space-y-1">
                      {passwordStrength.feedback.map((feedback, index) => (
                        <li key={index} className="flex items-center">
                          <span className="w-1 h-1 bg-slate-500 rounded-full mr-2" />
                          {feedback}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-2">
                Confirm Password *
              </label>
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Confirm your password"
                {...register('confirmPassword')}
                error={errors.confirmPassword?.message || undefined}
                disabled={isLoading}
                leftIcon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-slate-400 hover:text-slate-300 transition-colors"
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                }
              />
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-start">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                className="h-4 w-4 text-yellow-400 focus:ring-yellow-400 border-slate-600 bg-slate-800 rounded mt-1"
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-slate-300">
                I agree to the{' '}
                <a
                  href="#"
                  className="font-medium text-yellow-400 hover:text-yellow-300 transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    toast('Terms of Service coming soon', { icon: 'ℹ️' });
                  }}
                >
                  Terms of Service
                </a>{' '}
                and{' '}
                <a
                  href="#"
                  className="font-medium text-yellow-400 hover:text-yellow-300 transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    toast('Privacy Policy coming soon', { icon: 'ℹ️' });
                  }}
                >
                  Privacy Policy
                </a>
              </label>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              disabled={!isValid || isLoading}
              className="w-full"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <LoadingSpinner size="sm" className="mr-2" />
                  Creating account...
                </div>
              ) : (
                'Create account'
              )}
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-slate-800 text-slate-400">Or</span>
              </div>
            </div>

            {/* Login Link */}
            <div className="text-center">
              <span className="text-slate-400">Already have an account? </span>
              <Link
                to="/login"
                className="font-medium text-yellow-400 hover:text-yellow-300 transition-colors"
              >
                Sign in
              </Link>
            </div>
          </form>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-slate-500">
          <p>
            &copy; 2025 EndCrypt. Built with React, TypeScript, and AWS KMS.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;