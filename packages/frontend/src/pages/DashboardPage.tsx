import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  Shield, 
  Activity, 
  AlertTriangle, 
  TrendingUp,
  Database,
  Zap,
  DollarSign,
  Clock,
  Users,
  Eye
} from 'lucide-react'
import { apiService } from '../services/api'
import { 
  Card, 
  CardHeader, 
  CardContent,
  MetricCard,
  Badge,
  Button,
  LineChart,
  BarChart,
  PieChart
} from '../components/ui'
import { formatNumber, formatCurrency, formatDate, getTimeAgo } from '../lib/utils'

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

// Mock data for charts
const mockTimeSeriesData = [
  { time: '00:00', requests: 12, tokens: 1200, pii: 2 },
  { time: '04:00', requests: 8, tokens: 800, pii: 1 },
  { time: '08:00', requests: 45, tokens: 4500, pii: 8 },
  { time: '12:00', requests: 67, tokens: 6700, pii: 12 },
  { time: '16:00', requests: 89, tokens: 8900, pii: 15 },
  { time: '20:00', requests: 54, tokens: 5400, pii: 9 },
]

const mockProviderData = [
  { name: 'OpenAI', value: 45, color: '#10b981' },
  { name: 'Claude', value: 30, color: '#3b82f6' },
  { name: 'Gemini', value: 25, color: '#f59e0b' },
]

export function DashboardPage() {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => apiService.get<DashboardStats>('/audit/analytics/summary'),
    refetchInterval: 30000
  })

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Failed to load dashboard
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Unable to fetch dashboard data. Please try again.
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
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Dashboard
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Overview of your AIProxy security gateway performance
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <Badge variant="success" icon={<Shield className="h-3 w-3" />}>
            All Systems Operational
          </Badge>
          <Button variant="outline" size="sm" icon={<Eye className="h-4 w-4" />}>
            View Logs
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Requests"
          value={stats?.summary.totalRequests ?? 0}
          description="API calls processed"
          icon={<Activity className="h-6 w-6" />}
          color="blue"
          trend={{
            value: 12.5,
            label: "vs last week",
            direction: "up"
          }}
          loading={isLoading}
          className="animate-slide-up"
        />
        
        <MetricCard
          title="Tokens Processed"
          value={formatNumber(stats?.summary.totalTokens ?? 0)}
          description="Total token usage"
          icon={<Database className="h-6 w-6" />}
          color="green"
          trend={{
            value: 8.3,
            label: "vs last week",
            direction: "up"
          }}
          loading={isLoading}
          className="animate-slide-up"
          style={{ animationDelay: '0.1s' }}
        />
        
        <MetricCard
          title="PII Detections"
          value={stats?.summary.piiDetections ?? 0}
          description="Sensitive data blocked"
          icon={<Shield className="h-6 w-6" />}
          color="yellow"
          trend={{
            value: 15.2,
            label: "vs last week",
            direction: "up"
          }}
          loading={isLoading}
          className="animate-slide-up"
          style={{ animationDelay: '0.2s' }}
        />
        
        <MetricCard
          title="Total Cost"
          value={formatCurrency(stats?.summary.totalCost ?? 0)}
          description="API usage cost"
          icon={<DollarSign className="h-6 w-6" />}
          color="purple"
          trend={{
            value: 2.1,
            label: "vs last week",
            direction: "down"
          }}
          loading={isLoading}
          className="animate-slide-up"
          style={{ animationDelay: '0.3s' }}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Chart */}
        <Card className="lg:col-span-2 animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Activity Overview
              </h3>
              <div className="flex space-x-2">
                <Badge variant="info" size="sm">24h</Badge>
                <Button variant="ghost" size="sm">
                  <TrendingUp className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-72 flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-center">
                <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 dark:text-gray-400">Chart will be here</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Provider Distribution */}
        <Card className="animate-slide-up" style={{ animationDelay: '0.5s' }}>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Provider Usage
            </h3>
          </CardHeader>
          <CardContent>
            <div className="h-72 flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                  <span className="text-white font-bold">100%</span>
                </div>
                <p className="text-gray-600 dark:text-gray-400">Provider Distribution</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card className="animate-slide-up" style={{ animationDelay: '0.6s' }}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Recent Activity
              </h3>
              <Button variant="ghost" size="sm">
                View All
              </Button>
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
            ) : stats?.recentActivity.length ? (
              <div className="space-y-4">
                {stats.recentActivity.slice(0, 5).map((activity, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      activity.piiDetected 
                        ? 'bg-yellow-100 dark:bg-yellow-900' 
                        : 'bg-green-100 dark:bg-green-900'
                    }`}>
                      {activity.piiDetected ? (
                        <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                      ) : (
                        <Zap className="h-4 w-4 text-green-600 dark:text-green-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {activity.provider} • {activity.model}
                        </p>
                        {activity.piiDetected && (
                          <Badge variant="warning" size="sm">PII</Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatNumber(activity.totalTokens)} tokens • {getTimeAgo(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Activity className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                  No activity yet
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Start making requests to see activity here.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions & System Status */}
        <div className="space-y-6">
          {/* System Status */}
          <Card className="animate-slide-up" style={{ animationDelay: '0.7s' }}>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                System Status
              </h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse-slow" />
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Security Engine
                  </span>
                </div>
                <Badge variant="success" size="sm">Online</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse-slow" />
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    API Gateway
                  </span>
                </div>
                <Badge variant="success" size="sm">Online</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse-slow" />
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Database
                  </span>
                </div>
                <Badge variant="info" size="sm">Healthy</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="animate-slide-up" style={{ animationDelay: '0.8s' }}>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Quick Actions
              </h3>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" variant="outline">
                <Shield className="h-4 w-4 mr-2" />
                Create Security Rule
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Users className="h-4 w-4 mr-2" />
                Manage API Keys
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                View Audit Logs
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}