import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  FileText, 
  Activity, 
  Shield, 
  AlertTriangle, 
  Clock, 
  DollarSign,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { auditService } from '../services/audit'

type TabType = 'logs' | 'usage'

export function AuditPage() {
  const [activeTab, setActiveTab] = useState<TabType>('logs')
  const [page, setPage] = useState(1)
  const limit = 20

  const { data: logs, isLoading: logsLoading } = useQuery({
    queryKey: ['audit-logs', page],
    queryFn: () => auditService.getLogs({ page, limit }),
    enabled: activeTab === 'logs'
  })

  const { data: usage, isLoading: usageLoading } = useQuery({
    queryKey: ['audit-usage', page],
    queryFn: () => auditService.getUsage({ page, limit }),
    enabled: activeTab === 'usage'
  })

  const isLoading = activeTab === 'logs' ? logsLoading : usageLoading
  const currentData = activeTab === 'logs' ? logs : usage
  const totalPages = currentData ? Math.ceil(currentData.pagination.total / limit) : 0

  const getEventTypeIcon = (eventType: string) => {
    switch (eventType) {
      case 'PROXY_REQUEST':
        return <Activity className="h-4 w-4 text-blue-500" />
      case 'PII_DETECTED':
        return <Shield className="h-4 w-4 text-orange-500" />
      case 'RULE_TRIGGERED':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'USER_LOGIN':
      case 'USER_LOGOUT':
        return <Clock className="h-4 w-4 text-green-500" />
      default:
        return <FileText className="h-4 w-4 text-gray-500" />
    }
  }

  const formatCost = (cost: number | null) => {
    if (cost === null) return 'N/A'
    return `$${cost.toFixed(4)}`
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Audit & Analytics</h1>
        <p className="mt-1 text-sm text-gray-600">
          Monitor system activity and usage analytics
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => {
              setActiveTab('logs')
              setPage(1)
            }}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'logs'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FileText className="h-4 w-4 inline mr-2" />
            Audit Logs
          </button>
          <button
            onClick={() => {
              setActiveTab('usage')
              setPage(1)
            }}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'usage'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Activity className="h-4 w-4 inline mr-2" />
            Usage Analytics
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="card">
        {isLoading ? (
          <div className="card-content">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex space-x-4">
                  <div className="w-8 h-8 bg-gray-200 rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="card-content">
              {activeTab === 'logs' && logs?.items.length ? (
                <div className="space-y-4">
                  {logs.items.map((log) => (
                    <div key={log.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                      <div className="flex-shrink-0">
                        {getEventTypeIcon(log.eventType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">
                            {log.eventType.replace('_', ' ')}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(log.timestamp).toLocaleString()}
                          </p>
                        </div>
                        {log.userId && (
                          <p className="text-sm text-gray-600">
                            User ID: {log.userId}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 font-mono">
                          Request ID: {log.requestId}
                        </p>
                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                          <details className="mt-2">
                            <summary className="text-xs text-primary-600 cursor-pointer">
                              View Details
                            </summary>
                            <pre className="mt-1 text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : activeTab === 'usage' && usage?.items.length ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Timestamp
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Provider/Model
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tokens
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cost
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Security
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Time
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {usage.items.map((record) => (
                        <tr key={record.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(record.timestamp).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{record.provider}</div>
                            <div className="text-sm text-gray-500">{record.model}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {record.totalTokens.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500">
                              In: {record.inputTokens.toLocaleString()} • 
                              Out: {record.outputTokens.toLocaleString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center">
                              <DollarSign className="h-3 w-3 mr-1" />
                              {formatCost(record.cost)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              {record.piiDetected && (
                                <span className="badge badge-warning">
                                  PII
                                </span>
                              )}
                              {record.rulesTriggered.length > 0 && (
                                <span className="badge badge-info">
                                  {record.rulesTriggered.length} Rules
                                </span>
                              )}
                              {!record.piiDetected && record.rulesTriggered.length === 0 && (
                                <span className="badge badge-success">
                                  Clean
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {record.processingTimeMs}ms
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  {activeTab === 'logs' ? (
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  ) : (
                    <Activity className="mx-auto h-12 w-12 text-gray-400" />
                  )}
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No {activeTab === 'logs' ? 'audit logs' : 'usage data'} found
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {activeTab === 'logs' 
                      ? 'System events will appear here as they occur.'
                      : 'Usage analytics will appear here after making API requests.'
                    }
                  </p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {currentData && totalPages > 1 && (
              <div className="border-t border-gray-200 px-4 py-3 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="btn-outline disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                      className="btn-outline disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing{' '}
                        <span className="font-medium">
                          {(page - 1) * limit + 1}
                        </span>{' '}
                        to{' '}
                        <span className="font-medium">
                          {Math.min(page * limit, currentData.pagination.total)}
                        </span>{' '}
                        of{' '}
                        <span className="font-medium">
                          {currentData.pagination.total}
                        </span>{' '}
                        results
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <button
                          onClick={() => setPage(Math.max(1, page - 1))}
                          disabled={page === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                          {page} of {totalPages}
                        </span>
                        <button
                          onClick={() => setPage(Math.min(totalPages, page + 1))}
                          disabled={page === totalPages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}