import { useEffect, useState } from 'react';

interface AuditEntry {
  id: string;
  action: string;
  actionCategory: string;
  actorId?: string;
  actorRole?: string;
  resourceType?: string;
  resourceId?: string;
  status: 'success' | 'failure' | 'pending';
  statusCode?: number;
  ipAddress?: string;
  timestamp: string;
  duration?: number;
  metadata?: Record<string, any>;
}

interface SessionAuditEntry {
  id: string;
  userId: string;
  eventType: string;
  ipAddress: string;
  country?: string;
  city?: string;
  isSuspicious: boolean;
  timestamp: string;
}

interface PaymentAuditEntry {
  id: string;
  paymentId: string;
  userId: string;
  paymentType: string;
  action: string;
  amount?: number;
  currency?: string;
  paymentProvider?: string;
  status?: string;
  timestamp: string;
}

export function AuditDashboard() {
  const [activeTab, setActiveTab] = useState<'general' | 'sessions' | 'payments'>('general');
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [sessionLogs, setSessionLogs] = useState<SessionAuditEntry[]>([]);
  const [paymentLogs, setPaymentLogs] = useState<PaymentAuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [suspiciousOnly, setSuspiciousOnly] = useState(false);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        if (activeTab === 'general') {
          const response = await fetch('/api/admin/audit-logs?limit=100');
          if (response.ok) {
            const data = await response.json();
            setAuditLogs(data.logs || []);
          }
        } else if (activeTab === 'sessions') {
          const response = await fetch(
            `/api/admin/session-audit-logs?suspicious=${suspiciousOnly}&limit=100`
          );
          if (response.ok) {
            const data = await response.json();
            setSessionLogs(data.logs || []);
          }
        } else if (activeTab === 'payments') {
          const response = await fetch('/api/admin/payment-audit-logs?limit=100');
          if (response.ok) {
            const data = await response.json();
            setPaymentLogs(data.logs || []);
          }
        }
      } catch (error) {
        console.error('Failed to fetch audit logs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [activeTab, suspiciousOnly]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400';
      case 'failure':
        return 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400';
      case 'pending':
        return 'bg-yellow-50 dark:bg-yellow-950/20 text-yellow-700 dark:text-yellow-400';
      default:
        return 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-400';
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      auth: '🔐',
      payment: '💳',
      content_access: '👁️',
      session: '🔄',
      security: '🛡️',
      moderation: '⚖️',
      admin: '👤'
    };
    return icons[category] || '📋';
  };

  const formatTimestamp = (value: string) =>
    new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(new Date(value));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Audit Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Monitor system activity, security events, and transactions
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
        {['general', 'sessions', 'payments'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-3 font-medium text-sm border-b-2 transition ${
              activeTab === tab
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            {tab === 'general' && '📋 General'}
            {tab === 'sessions' && '🔐 Sessions'}
            {tab === 'payments' && '💳 Payments'}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Filter by action, user, or resource..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {activeTab === 'sessions' && (
          <label className="flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900">
            <input
              type="checkbox"
              checked={suspiciousOnly}
              onChange={(e) => setSuspiciousOnly(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-slate-700 dark:text-slate-300">Suspicious Only</span>
          </label>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading audit logs...</div>
      ) : (
        <div className="space-y-3">
          {activeTab === 'general' && auditLogs.length > 0 && (
            <div className="space-y-3">
              {auditLogs
                .filter(
                  (log) =>
                    !filter ||
                    log.action.includes(filter) ||
                    log.actionCategory.includes(filter) ||
                    log.actorId?.includes(filter)
                )
                .map((log) => (
                  <div
                    key={log.id}
                    className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3 flex-1">
                        <span className="text-2xl">{getCategoryIcon(log.actionCategory)}</span>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">
                            {log.action}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {formatTimestamp(log.timestamp)}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          log.status
                        )}`}
                      >
                        {log.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs text-slate-600 dark:text-slate-400">
                      {log.actorRole && <div>Actor: {log.actorRole}</div>}
                      {log.resourceType && <div>Resource: {log.resourceType}</div>}
                      {log.duration && <div>Duration: {log.duration}ms</div>}
                    </div>
                  </div>
                ))}
            </div>
          )}

          {activeTab === 'sessions' && sessionLogs.length > 0 && (
            <div className="space-y-3">
              {sessionLogs
                .filter(
                  (log) =>
                    !filter ||
                    log.eventType.includes(filter) ||
                    log.ipAddress.includes(filter)
                )
                .map((log) => (
                  <div
                    key={log.id}
                    className={`p-4 rounded-lg border ${
                      log.isSuspicious
                        ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/20'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3 flex-1">
                        <span className="text-2xl">
                          {log.isSuspicious ? '⚠️' : '✓'}
                        </span>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">
                            {log.eventType}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {formatTimestamp(log.timestamp)}
                          </p>
                        </div>
                      </div>
                      {log.isSuspicious && (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                          Suspicious
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs text-slate-600 dark:text-slate-400">
                      <div>IP: {log.ipAddress.substring(0, 15)}</div>
                      {log.city && <div>Location: {log.city}, {log.country}</div>}
                    </div>
                  </div>
                ))}
            </div>
          )}

          {activeTab === 'payments' && paymentLogs.length > 0 && (
            <div className="space-y-3">
              {paymentLogs
                .filter(
                  (log) =>
                    !filter ||
                    log.paymentType.includes(filter) ||
                    log.paymentProvider?.includes(filter)
                )
                .map((log) => (
                  <div
                    key={log.id}
                    className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3 flex-1">
                        <span className="text-2xl">💳</span>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">
                            {log.paymentType} - {log.action}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {formatTimestamp(log.timestamp)}
                          </p>
                        </div>
                      </div>
                      {log.amount && (
                        <div className="text-right">
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {log.currency} {log.amount.toFixed(2)}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs text-slate-600 dark:text-slate-400">
                      <div>Provider: {log.paymentProvider}</div>
                      {log.status && <div>Status: {log.status}</div>}
                    </div>
                  </div>
                ))}
            </div>
          )}

          {(activeTab === 'general' && auditLogs.length === 0) ||
          (activeTab === 'sessions' && sessionLogs.length === 0) ||
          (activeTab === 'payments' && paymentLogs.length === 0) ? (
            <div className="text-center py-12 text-slate-500">No audit logs found</div>
          ) : null}
        </div>
      )}
    </div>
  );
}
