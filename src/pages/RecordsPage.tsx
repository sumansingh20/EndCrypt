/**
 * Records Page
 * Display and manage encrypted financial records with search and filtering
 */

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';

// Components
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import LoadingSpinner from '../components/ui/LoadingSpinner';

// API
import { api } from '../api/endpoints';

// Types
import type { EncryptedRecord, DecryptedRecord } from '../types/api';

// Utils
import { formatDate, formatDistanceToNow, truncateString } from '../utils/formatters';

interface RecordWithDecryption extends EncryptedRecord {
  decryptedData?: DecryptedRecord;
  isDecrypting?: boolean;
}

const RecordsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set());
  const [decryptedRecords, setDecryptedRecords] = useState<Map<string, DecryptedRecord>>(new Map());

  // Pagination
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = 10;

  // Fetch encrypted records
  const {
    data: recordsData,
    isLoading: recordsLoading,
    error: recordsError,
    refetch
  } = useQuery({
    queryKey: ['encrypted-records', currentPage, pageSize],
    queryFn: () => api.encryption.list(currentPage, pageSize),
    placeholderData: (previousData) => previousData
  });

  // Decrypt mutation
  const decryptMutation = useMutation({
    mutationFn: async (recordId: string) => {
      return api.encryption.decrypt(recordId);
    },
    onSuccess: (response, recordId) => {
      if (response.success && response.data?.record) {
        setDecryptedRecords(prev => new Map(prev.set(recordId, response.data!.record)));
        toast.success('Record decrypted successfully');
      }
    },
    onError: (error: any) => {
      console.error('Decryption failed:', error);
      toast.error(
        error.response?.data?.message || 
        'Failed to decrypt record. Please try again.'
      );
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (recordId: string) => {
      return api.encryption.delete(recordId);
    },
    onSuccess: () => {
      toast.success('Record deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['encrypted-records'] });
      setSelectedRecords(new Set());
    },
    onError: (error: any) => {
      console.error('Delete failed:', error);
      toast.error(
        error.response?.data?.message || 
        'Failed to delete record. Please try again.'
      );
    }
  });

  const records = (recordsData as any)?.data?.records || [];
  const pagination = (recordsData as any)?.data?.pagination;

  // Filter records based on search term
  const filteredRecords = useMemo(() => {
    if (!searchTerm.trim()) return records;
    
    const term = searchTerm.toLowerCase();
    return records.filter((record: EncryptedRecord) => {
      const decrypted = decryptedRecords.get(record.id);
      return (
        record.id.toLowerCase().includes(term) ||
        record.encryptedBlobId.toLowerCase().includes(term) ||
        (decrypted?.transactionId?.toLowerCase().includes(term)) ||
        (decrypted?.payer?.toLowerCase().includes(term)) ||
        (decrypted?.payee?.toLowerCase().includes(term))
      );
    });
  }, [records, searchTerm, decryptedRecords]);

  // Handle search
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setSearchParams(prev => {
      if (value) {
        prev.set('search', value);
      } else {
        prev.delete('search');
      }
      prev.delete('page'); // Reset to first page
      return prev;
    });
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setSearchParams(prev => {
      prev.set('page', page.toString());
      return prev;
    });
  };

  // Handle record selection
  const toggleRecordSelection = (recordId: string) => {
    setSelectedRecords(prev => {
      const newSet = new Set(prev);
      if (newSet.has(recordId)) {
        newSet.delete(recordId);
      } else {
        newSet.add(recordId);
      }
      return newSet;
    });
  };

  // Handle decrypt record
  const handleDecrypt = async (recordId: string) => {
    if (decryptedRecords.has(recordId)) {
      // Already decrypted, toggle visibility or show details
      return;
    }
    await decryptMutation.mutateAsync(recordId);
  };

  // Handle delete record
  const handleDelete = async (recordId: string) => {
    if (window.confirm('Are you sure you want to delete this record? This action cannot be undone.')) {
      await deleteMutation.mutateAsync(recordId);
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedRecords.size === 0) return;
    
    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedRecords.size} record(s)? This action cannot be undone.`
    );
    
    if (confirmed) {
      const deletePromises = Array.from(selectedRecords).map(id => 
        deleteMutation.mutateAsync(id)
      );
      
      try {
        await Promise.all(deletePromises);
      } catch (error) {
        // Individual error handling is done in mutation
      }
    }
  };

  if (recordsError) {
    return (
      <div className="min-h-screen bg-slate-950 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <Card className="p-8 text-center">
            <div className="text-red-400 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Failed to Load Records</h2>
            <p className="text-slate-400 mb-6">Unable to fetch encrypted records. Please check your connection.</p>
            <Button onClick={() => refetch()} variant="primary">
              Try Again
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center text-slate-400 hover:text-slate-300 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Dashboard
              </button>
            </div>
            <div className="flex gap-3">
              {selectedRecords.size > 0 && (
                <Button
                  onClick={handleBulkDelete}
                  variant="secondary"
                  className="text-red-400 border-red-400 hover:bg-red-400/10"
                  disabled={deleteMutation.isPending}
                >
                  Delete Selected ({selectedRecords.size})
                </Button>
              )}
              <Button
                onClick={() => navigate('/encrypt')}
                variant="primary"
                className="flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                New Record
              </Button>
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-2">
            Encrypted Records
          </h1>
          <p className="text-slate-400">
            Manage your encrypted financial transaction records
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search records by ID, transaction, or participants..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                leftIcon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                }
              />
            </div>
            <Button
              onClick={() => refetch()}
              variant="secondary"
              disabled={recordsLoading}
              className="flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </Button>
          </div>
        </Card>

        {/* Records List */}
        <Card className="overflow-hidden">
          {recordsLoading ? (
            <div className="p-8 text-center">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-slate-400">Loading encrypted records...</p>
            </div>
          ) : filteredRecords.length > 0 ? (
            <>
              {/* Table Header */}
              <div className="bg-slate-900 px-6 py-4 border-b border-slate-700">
                <div className="grid grid-cols-12 gap-4 text-sm font-medium text-slate-300">
                  <div className="col-span-1">
                    <input
                      type="checkbox"
                      aria-label="Select all records"
                      checked={selectedRecords.size === filteredRecords.length && filteredRecords.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRecords(new Set(filteredRecords.map((r: EncryptedRecord) => r.id)));
                        } else {
                          setSelectedRecords(new Set());
                        }
                      }}
                      className="rounded border-slate-600 bg-slate-800 text-yellow-400 focus:ring-yellow-400"
                    />
                  </div>
                  <div className="col-span-3">Record ID</div>
                  <div className="col-span-2">Created</div>
                  <div className="col-span-3">Transaction Details</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-1">Actions</div>
                </div>
              </div>

              {/* Records */}
              <div className="divide-y divide-slate-700">
                {filteredRecords.map((record: EncryptedRecord) => {
                  const decrypted = decryptedRecords.get(record.id);
                  const isSelected = selectedRecords.has(record.id);

                  return (
                    <div key={record.id} className="p-6 hover:bg-slate-900/50 transition-colors">
                      <div className="grid grid-cols-12 gap-4 items-center">
                        {/* Checkbox */}
                        <div className="col-span-1">
                          <input
                            type="checkbox"
                            aria-label={`Select record ${record.id}`}
                            checked={isSelected}
                            onChange={() => toggleRecordSelection(record.id)}
                            className="rounded border-slate-600 bg-slate-800 text-yellow-400 focus:ring-yellow-400"
                          />
                        </div>

                        {/* Record ID */}
                        <div className="col-span-3">
                          <div className="font-mono text-sm text-white">
                            {truncateString(record.id, 20)}
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            Blob: {truncateString(record.encryptedBlobId, 16)}
                          </div>
                        </div>

                        {/* Created Date */}
                        <div className="col-span-2">
                          <div className="text-sm text-slate-300">
                            {formatDate(record.createdAt)}
                          </div>
                          <div className="text-xs text-slate-500">
                            {formatDistanceToNow(record.createdAt)} ago
                          </div>
                        </div>

                        {/* Transaction Details */}
                        <div className="col-span-3">
                          {decrypted ? (
                            <div>
                              <div className="text-sm text-white font-medium">
                                {decrypted.transactionId}
                              </div>
                              <div className="text-xs text-slate-400">
                                {decrypted.payer} → {decrypted.payee}
                              </div>
                              <div className="text-xs text-yellow-400 font-medium">
                                {decrypted.amount} {decrypted.currency}
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-slate-500">
                              <div className="flex items-center">
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                Encrypted
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Status */}
                        <div className="col-span-2">
                          {decrypted ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-400/10 text-green-400">
                              Decrypted
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-400/10 text-yellow-400">
                              Encrypted
                            </span>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="col-span-1">
                          <div className="flex items-center space-x-2">
                            {!decrypted && (
                              <button
                                onClick={() => handleDecrypt(record.id)}
                                disabled={decryptMutation.isPending}
                                className="p-2 text-slate-400 hover:text-yellow-400 transition-colors"
                                title="Decrypt record"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                                </svg>
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(record.id)}
                              disabled={deleteMutation.isPending}
                              className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                              title="Delete record"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Decrypted Details (Expanded) */}
                      {decrypted && decrypted.notes && (
                        <div className="mt-4 pt-4 border-t border-slate-700">
                          <div className="text-sm text-slate-300">
                            <span className="font-medium text-slate-200">Notes:</span> {decrypted.notes}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="bg-slate-900 px-6 py-4 border-t border-slate-700">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-400">
                      Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                      {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                      {pagination.total} records
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page <= 1}
                        variant="secondary"
                        size="sm"
                      >
                        Previous
                      </Button>
                      
                      {/* Page numbers */}
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        const page = Math.max(1, pagination.page - 2) + i;
                        if (page > pagination.totalPages) return null;
                        
                        return (
                          <Button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            variant={page === pagination.page ? "primary" : "secondary"}
                            size="sm"
                          >
                            {page}
                          </Button>
                        );
                      })}
                      
                      <Button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page >= pagination.totalPages}
                        variant="secondary"
                        size="sm"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-slate-800 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No Records Found</h3>
              <p className="text-slate-400 mb-6">
                {searchTerm ? 'No records match your search criteria.' : 'No encrypted records have been created yet.'}
              </p>
              {!searchTerm && (
                <Button
                  onClick={() => navigate('/encrypt')}
                  variant="primary"
                >
                  Create Your First Record
                </Button>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default RecordsPage;