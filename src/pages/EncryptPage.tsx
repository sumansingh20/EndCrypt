/**
 * Transaction Recording Page
 * Interface for encrypting and storing financial transactions
 */

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-hot-toast';

// Components
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/ui/LoadingSpinner';

// API and types
import { api } from '../api/endpoints';
import type { EncryptRequest } from '../types/api';

// Validation
import { encryptionSchema, type EncryptionFormData } from '../utils/validators';

// Utils
import { formatCurrency } from '../utils/formatters';

const EncryptPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    reset
  } = useForm<EncryptionFormData>({
    resolver: zodResolver(encryptionSchema),
    mode: 'onChange'
  });

  const watchedAmount = watch('amount');
  const watchedCurrency = watch('currency');

  const encryptMutation = useMutation({
    mutationFn: async (data: EncryptRequest) => {
      setIsProcessing(true);
      return api.encryption.encrypt(data);
    },
    onSuccess: (response) => {
      toast.success('Transaction encrypted and stored successfully!');
      queryClient.invalidateQueries({ queryKey: ['encrypted-records'] });
      navigate('/records');
      reset();
    },
    onError: (error: any) => {
      console.error('Encryption failed:', error);
      toast.error(
        error.response?.data?.message || 
        'Failed to encrypt transaction. Please try again.'
      );
    },
    onSettled: () => {
      setIsProcessing(false);
    }
  });

  const onSubmit = async (data: EncryptionFormData) => {
    try {
      await encryptMutation.mutateAsync({
        transactionId: data.transactionId,
        amount: data.amount,
        currency: data.currency.toUpperCase(),
        payer: data.payer.trim(),
        payee: data.payee.trim(),
        notes: data.notes?.trim() || ''
      });
    } catch (error) {
      // Error handling is done in mutation
    }
  };

  const handleReset = () => {
    reset();
    toast.success('Form cleared');
  };

  return (
    <div className="min-h-screen bg-slate-950 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-slate-400 hover:text-slate-300 mb-4 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-white mb-2">
            Encrypt Transaction
          </h1>
          <p className="text-slate-400">
            Securely encrypt and store financial transaction data using AWS KMS
          </p>
        </div>

        {/* Main Form */}
        <Card className="p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Transaction ID */}
            <div>
              <label htmlFor="transactionId" className="block text-sm font-medium text-slate-300 mb-2">
                Transaction ID *
              </label>
                <Input
                  id="transactionId"
                  type="text"
                  placeholder="e.g., TXN-2024-001"
                  {...register('transactionId')}
                  error={errors.transactionId?.message || undefined}
                  disabled={isProcessing}
                />
            </div>

            {/* Amount and Currency Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="amount" className="block text-sm font-medium text-slate-300 mb-2">
                  Amount *
                </label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  {...register('amount', { valueAsNumber: true })}
                  error={errors.amount?.message || undefined}
                  disabled={isProcessing}
                />
              </div>
              <div>
                <label htmlFor="currency" className="block text-sm font-medium text-slate-300 mb-2">
                  Currency *
                </label>
                <select
                  id="currency"
                  {...register('currency')}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-white focus:ring-2 focus:ring-yellow-400 focus:border-transparent disabled:opacity-50"
                  disabled={isProcessing}
                >
                  <option value="">Select</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="JPY">JPY</option>
                  <option value="CAD">CAD</option>
                  <option value="AUD">AUD</option>
                  <option value="CHF">CHF</option>
                  <option value="CNY">CNY</option>
                </select>
                {errors.currency && (
                  <p className="mt-1 text-sm text-red-400">{errors.currency.message}</p>
                )}
              </div>
            </div>

            {/* Amount Preview */}
            {watchedAmount && watchedCurrency && (
              <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
                <div className="text-sm text-slate-400 mb-1">Transaction Amount:</div>
                <div className="text-xl font-semibold text-yellow-400">
                  {formatCurrency(watchedAmount, watchedCurrency)}
                </div>
              </div>
            )}

            {/* Payer and Payee */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="payer" className="block text-sm font-medium text-slate-300 mb-2">
                  Payer *
                </label>
                <Input
                  id="payer"
                  type="text"
                  placeholder="John Doe"
                  {...register('payer')}
                  error={errors.payer?.message || undefined}
                  disabled={isProcessing}
                />
              </div>
              <div>
                <label htmlFor="payee" className="block text-sm font-medium text-slate-300 mb-2">
                  Payee *
                </label>
                <Input
                  id="payee"
                  type="text"
                  placeholder="Jane Smith"
                  {...register('payee')}
                  error={errors.payee?.message || undefined}
                  disabled={isProcessing}
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-slate-300 mb-2">
                Notes
                <span className="text-slate-500 font-normal ml-2">(Optional)</span>
              </label>
              <textarea
                id="notes"
                rows={3}
                placeholder="Additional transaction details..."
                {...register('notes')}
                disabled={isProcessing}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-white placeholder-slate-500 focus:ring-2 focus:ring-yellow-400 focus:border-transparent disabled:opacity-50 resize-none"
              />
              {errors.notes && (
                <p className="mt-1 text-sm text-red-400">{errors.notes.message}</p>
              )}
            </div>

            {/* Security Notice */}
            <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-lg p-4">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-yellow-400 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <div>
                  <h4 className="text-yellow-400 font-medium text-sm mb-1">
                    End-to-End Encryption
                  </h4>
                  <p className="text-yellow-200/80 text-sm">
                    Your transaction data will be encrypted using AWS KMS before storage. 
                    Only authorized users can decrypt this information.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                type="submit"
                variant="primary"
                disabled={!isValid || isProcessing}
                className="flex-1"
              >
                {isProcessing ? (
                  <div className="flex items-center justify-center">
                    <LoadingSpinner size="sm" className="mr-2" />
                    Encrypting...
                  </div>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Encrypt & Store
                  </>
                )}
              </Button>
              
              <Button
                type="button"
                variant="secondary"
                onClick={handleReset}
                disabled={isProcessing}
                className="sm:w-auto"
              >
                Clear Form
              </Button>
            </div>
          </form>
        </Card>

        {/* Help Section */}
        <Card className="mt-8 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            💡 Quick Tips
          </h3>
          <div className="space-y-3 text-sm text-slate-300">
            <div className="flex items-start">
              <span className="text-yellow-400 mr-2">•</span>
              <span>Use unique transaction IDs to avoid conflicts</span>
            </div>
            <div className="flex items-start">
              <span className="text-yellow-400 mr-2">•</span>
              <span>All financial amounts are stored with precision up to 2 decimal places</span>
            </div>
            <div className="flex items-start">
              <span className="text-yellow-400 mr-2">•</span>
              <span>Encrypted data can be viewed and managed in the Records section</span>
            </div>
            <div className="flex items-start">
              <span className="text-yellow-400 mr-2">•</span>
              <span>All encryption operations are logged for audit purposes</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default EncryptPage;