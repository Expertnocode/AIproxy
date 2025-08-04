import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  Activity, 
  Shield, 
  AlertTriangle, 
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Database,
  Zap
} from 'lucide-react'
import { auditService } from '../services/audit'
import { Card, CardHeader, CardContent, Badge, Button } from '../components/ui'
import { formatCurrency, formatDate } from '../lib/utils'

export function AuditPage() {
  const [page, setPage] = useState(1)
  const limit = 20

  const { data: usage, isLoading, error } = useQuery({
    queryKey: ['audit-usage', page],
    queryFn: () => auditService.getUsage({ page, limit })
  })


  const totalPages = usage ? Math.ceil(usage.pagination.total / limit) : 0

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'OPENAI':
        return <Activity className="h-4 w-4 text-green-500" />
      case 'CLAUDE':
        return <Shield className="h-4 w-4 text-purple-500" />
      case 'GEMINI':
        return <Zap className="h-4 w-4 text-blue-500" />
      default:
        return <Database className="h-4 w-4 text-gray-500" />
    }
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Failed to load audit data
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Unable to fetch usage logs. Please try again.
            </p>
            <Button onClick={() => window.location.reload()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Usage Analytics
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Track AI API usage, costs, and security events
        </p>
      </div>

      {/* Usage Records */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Recent API Usage
            </h2>
            <Badge variant="secondary">
              {usage?.pagination.total || 0} total records
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-1" />
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : usage?.items?.length ? (
            <div className="space-y-4">
              {usage.items.map((record: any) => (
                <div 
                  key={record.id} 
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {getProviderIcon(record.provider)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {record.provider}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {record.model}
                        </span>
                        {record.piiDetected && (
                          <Badge variant="warning" size="sm">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            PII Detected
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(record.timestamp)} • {record.totalTokens} tokens • {formatCurrency(record.cost || 0)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {formatCurrency(record.cost || 0)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {record.totalTokens} tokens
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Database className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No usage data
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Start using the AI chat to see usage analytics here.
              </p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Page {page} of {totalPages}
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  icon={<ChevronLeft className="h-4 w-4" />}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  icon={<ChevronRight className="h-4 w-4" />}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}