/**
 * Dashboard Page
 * Main dashboard displaying encryption metrics, recent activity, and system status
 */

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

// Components
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';

// API
import { api } from '../api/endpoints';

// Types
import type { DashboardStats, EncryptedRecord, AuditLog } from '../types/api';

// Utils
import { formatDate, formatCurrency, formatDistanceToNow } from '../utils/formatters';
import { getDevBypassInfo } from '../utils/devBypass';

interface DashboardMetric {
  title: string;
  value: string | number;
  change?: {
    value: number;
    isPositive: boolean;
  };
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'yellow' | 'purple';
}

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  // Fetch dashboard statistics
  const {
    data: statsData,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats
  } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.dashboard.getStats(),
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 10000
  });

  // Fetch recent encrypted records
  const {
    data: recordsData,
    isLoading: recordsLoading
  } = useQuery({
    queryKey: ['recent-records'],
    queryFn: () => api.encryption.list(1, 5),
    refetchInterval: 60000 // Refresh every minute
  });

  // Fetch recent audit logs
  const {
    data: auditData,
    isLoading: auditLoading
  } = useQuery({
    queryKey: ['recent-audit'],
    queryFn: () => api.audit.getLogs({ limit: 5 }),
    refetchInterval: 60000
  });

  // Fetch activity chart data
  const {
    data: activityData,
    isLoading: activityLoading
  } = useQuery({
    queryKey: ['activity-chart', selectedTimeRange],
    queryFn: () => {
      const days = selectedTimeRange === '7d' ? 7 : selectedTimeRange === '30d' ? 30 : 90;
      return api.dashboard.getActivityChart(days);
    },
    refetchInterval: 300000 // Refresh every 5 minutes
  });

  const stats = statsData?.data;
  const records = recordsData?.data?.records || [];
  const auditLogs = auditData?.data?.logs || [];

  // Handle system alerts
  useEffect(() => {
    if (stats?.alerts && stats.alerts.length > 0) {
      stats.alerts.forEach(alert => {
        if (!alert.dismissed) {
          if (alert.type === 'error') {
            toast.error(alert.message);
          } else if (alert.type === 'warning') {
            toast(`⚠️ ${alert.message}`, { duration: 5000 });
          }
        }
      });
    }
  }, [stats?.alerts]);

  // Calculate metrics
  const metrics: DashboardMetric[] = [
    {
      title: 'Total Records',
      value: stats?.totalRecords || 0,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: 'blue'
    },
    {
      title: 'Encrypted Today',
      value: stats?.totalEncrypted || 0,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      color: 'green'
    },
    {
      title: 'Decrypted Today',
      value: stats?.totalDecrypted || 0,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
        </svg>
      ),
      color: 'yellow'
    },
    {
      title: 'Active Keys',
      value: stats?.activeKeys || 0,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
      ),
      color: 'purple'
    }
  ];

  const getMetricColorClasses = (color: DashboardMetric['color']) => {
    const colors = {
      blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      green: 'bg-green-500/10 text-green-400 border-green-500/20',
      yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20'
    };
    return colors[color];
  };

  if (statsError) {
    return (
      <div className="min-h-screen bg-slate-950 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <Card className="p-8 text-center">
            <div className="text-red-400 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Failed to Load Dashboard</h2>
            <p className="text-slate-400 mb-6">Unable to connect to the server. Please check your connection.</p>
            <Button onClick={() => refetchStats()} variant="primary">
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
        {/* Development Bypass Banner */}
        {getDevBypassInfo() && (
          <div className="mb-6">
            <Card className="bg-orange-500/10 border-orange-500/20 p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-500/20 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-orange-400 font-medium text-sm">Development Mode</div>
                  <div className="text-orange-300/80 text-xs">
                    Authentication bypass is active. Set VITE_DEV_BYPASS_LOGIN=false to enable login.
                  </div>
                </div>
                <div className="text-orange-400/60 text-xs">
                  User: {getDevBypassInfo()?.user.email}
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Dashboard
              </h1>
              <p className="text-slate-400">
                Monitor your encryption activities and system performance
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => navigate('/encrypt')}
                variant="primary"
                className="flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                New Encryption
              </Button>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {metrics.map((metric, index) => (
            <Card key={index} className="p-6">
              {statsLoading ? (
                <div className="animate-pulse">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-8 h-8 bg-slate-700 rounded"></div>
                    <div className="w-16 h-6 bg-slate-700 rounded"></div>
                  </div>
                  <div className="w-24 h-8 bg-slate-700 rounded mb-2"></div>
                  <div className="w-full h-4 bg-slate-700 rounded"></div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-2 rounded-lg border ${getMetricColorClasses(metric.color)}`}>
                      {metric.icon}
                    </div>
                    {metric.change && (
                      <span className={`text-sm font-medium ${
                        metric.change.isPositive ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {metric.change.isPositive ? '+' : ''}{metric.change.value}%
                      </span>
                    )}
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">
                    {typeof metric.value === 'number' ? metric.value.toLocaleString() : metric.value}
                  </div>
                  <div className="text-sm text-slate-400">
                    {metric.title}
                  </div>
                </>
              )}
            </Card>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Recent Records */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Recent Records</h2>
              <Button
                onClick={() => navigate('/records')}
                variant="secondary"
                size="sm"
              >
                View All
              </Button>
            </div>

            {recordsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse flex items-center space-x-4">
                    <div className="w-10 h-10 bg-slate-700 rounded-full"></div>
                    <div className="flex-1">
                      <div className="w-3/4 h-4 bg-slate-700 rounded mb-2"></div>
                      <div className="w-1/2 h-3 bg-slate-700 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : records.length > 0 ? (
              <div className="space-y-4">
                {records.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-4 bg-slate-900 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors cursor-pointer"
                    onClick={() => navigate(`/records/${record.id}`)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-yellow-400/10 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">
                          {record.id.substring(0, 8)}...
                        </div>
                        <div className="text-xs text-slate-400">
                          {formatDistanceToNow(record.createdAt)} ago
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-slate-300">Encrypted</div>
                      <div className="text-xs text-slate-500">
                        {formatDate(record.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-slate-800 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-slate-400 mb-4">No encrypted records yet</p>
                <Button
                  onClick={() => navigate('/encrypt')}
                  variant="primary"
                  size="sm"
                >
                  Create First Record
                </Button>
              </div>
            )}
          </Card>

          {/* Recent Activity */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Recent Activity</h2>
              <Button
                onClick={() => navigate('/audit')}
                variant="secondary"
                size="sm"
              >
                View Audit
              </Button>
            </div>

            {auditLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse flex items-start space-x-3">
                    <div className="w-8 h-8 bg-slate-700 rounded-full"></div>
                    <div className="flex-1">
                      <div className="w-3/4 h-4 bg-slate-700 rounded mb-2"></div>
                      <div className="w-1/2 h-3 bg-slate-700 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : auditLogs.length > 0 ? (
              <div className="space-y-4">
                {auditLogs.map((log) => (
                  <div key={log.id} className="flex items-start space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      log.action.includes('encrypt') ? 'bg-green-500/10 text-green-400' :
                      log.action.includes('decrypt') ? 'bg-yellow-500/10 text-yellow-400' :
                      log.action.includes('login') ? 'bg-blue-500/10 text-blue-400' :
                      'bg-slate-500/10 text-slate-400'
                    }`}>
                      {log.action.includes('encrypt') ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      ) : log.action.includes('decrypt') ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-white mb-1">
                        {log.action.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </div>
                      <div className="text-xs text-slate-400">
                        {formatDistanceToNow(log.timestamp)} ago
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-slate-800 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-slate-400">No recent activity</p>
              </div>
            )}
          </Card>
        </div>

        {/* Activity Chart */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Activity Overview</h2>
            <div className="flex gap-2">
              {(['7d', '30d', '90d'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setSelectedTimeRange(range)}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    selectedTimeRange === range
                      ? 'bg-yellow-400 text-slate-900'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {range.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {activityLoading ? (
            <div className="h-64 flex items-center justify-center">
              <LoadingSpinner size="lg" />
            </div>
          ) : activityData ? (
            <div className="h-64 flex items-center justify-center bg-slate-900 rounded-lg">
              <div className="text-center">
                <div className="text-yellow-400 mb-2">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <p className="text-slate-400">Chart visualization coming soon</p>
                <p className="text-sm text-slate-500 mt-1">Activity data is being collected</p>
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center bg-slate-900 rounded-lg">
              <div className="text-center">
                <p className="text-slate-400">Unable to load activity data</p>
              </div>
            </div>
          )}
        </Card>

        {/* System Status */}
        {stats?.lastEncryptedAt && (
          <Card className="p-6 mt-8">
            <h2 className="text-lg font-semibold text-white mb-4">System Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span className="text-sm text-slate-300">API Online</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span className="text-sm text-slate-300">AWS KMS Connected</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                <span className="text-sm text-slate-300">
                  Last activity: {formatDistanceToNow(stats.lastEncryptedAt)} ago
                </span>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;