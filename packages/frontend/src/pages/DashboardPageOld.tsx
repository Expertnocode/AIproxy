import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  Shield, 
  Activity, 
  AlertTriangle, 
  TrendingUp,
  Database,
  Zap,
  DollarSign
} from 'lucide-react'
import { apiService } from '../services/api'

interface DashboardStats {
  summary: {
    totalRequests: number
    totalTokens: number
    totalCost: number
    piiDetections: number
  }
  recentActivity: Array<{
    provider: string
    model: string
    totalTokens: number
    timestamp: string
    piiDetected: boolean
  }>
}

export function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => apiService.get<DashboardStats>('/audit/analytics/summary'),
    refetchInterval: 30000
  })

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card">
              <div className="card-content">
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const statCards = [
    {
      name: 'Total Requests',
      value: stats?.summary.totalRequests.toLocaleString() || '0',
      icon: Activity,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      name: 'Tokens Processed',
      value: stats?.summary.totalTokens.toLocaleString() || '0',
      icon: Database,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      name: 'PII Detections',
      value: stats?.summary.piiDetections.toLocaleString() || '0',
      icon: Shield,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      name: 'Total Cost',
      value: `$${stats?.summary.totalCost.toFixed(4) || '0.00'}`,
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Overview of your AIProxy security gateway
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((item) => {
          const Icon = item.icon
          return (
            <div key={item.name} className="card">
              <div className="card-content">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`inline-flex items-center justify-center p-3 rounded-md ${item.bgColor}`}>
                      <Icon className={`h-6 w-6 ${item.color}`} />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {item.name}
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {item.value}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
        </div>
        <div className="card-content">
          {stats?.recentActivity.length ? (
            <div className="flow-root">
              <ul className="-mb-8">
                {stats.recentActivity.map((activity, activityIdx) => (
                  <li key={activityIdx}>
                    <div className="relative pb-8">
                      {activityIdx !== stats.recentActivity.length - 1 && (
                        <span
                          className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                          aria-hidden="true"
                        />
                      )}
                      <div className="relative flex space-x-3">
                        <div>
                          <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                            activity.piiDetected ? 'bg-orange-500' : 'bg-green-500'
                          }`}>
                            {activity.piiDetected ? (
                              <AlertTriangle className="h-4 w-4 text-white" />
                            ) : (
                              <Zap className="h-4 w-4 text-white" />
                            )}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                          <div>
                            <p className="text-sm text-gray-500">
                              <span className="font-medium text-gray-900">
                                {activity.provider}
                              </span>{' '}
                              {activity.model} • {activity.totalTokens.toLocaleString()} tokens
                              {activity.piiDetected && (
                                <span className="ml-2 badge badge-warning">
                                  PII Detected
                                </span>
                              )}
                            </p>
                          </div>
                          <div className="text-right text-sm whitespace-nowrap text-gray-500">
                            {new Date(activity.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="text-center py-12">
              <Activity className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No activity yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Start making requests through the proxy to see activity here.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="card">
          <div className="card-content">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-primary-600" />
              <div className="ml-4">
                <h4 className="text-lg font-medium text-gray-900">Security Status</h4>
                <p className="text-sm text-gray-500">All systems operational</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <h4 className="text-lg font-medium text-gray-900">Performance</h4>
                <p className="text-sm text-gray-500">Avg response: &lt;200ms</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <h4 className="text-lg font-medium text-gray-900">Alerts</h4>
                <p className="text-sm text-gray-500">No active alerts</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}