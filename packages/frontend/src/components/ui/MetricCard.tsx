import React from 'react'
import { Card, CardContent } from './Card'
import { Badge } from './Badge'
import { cn } from '../../lib/utils'

interface MetricCardProps {
  title: string
  value: string | number
  description?: string
  icon?: React.ReactNode
  trend?: {
    value: number
    label: string
    direction: 'up' | 'down' | 'neutral'
  }
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray'
  className?: string
  loading?: boolean
  style?: React.CSSProperties
}

export function MetricCard({
  title,
  value,
  description,
  icon,
  trend,
  color = 'blue',
  className,
  loading = false,
  style
}: MetricCardProps) {
  const colorClasses = {
    blue: {
      icon: 'text-blue-600 dark:text-blue-400',
      iconBg: 'bg-blue-100 dark:bg-blue-900/50'
    },
    green: {
      icon: 'text-green-600 dark:text-green-400',
      iconBg: 'bg-green-100 dark:bg-green-900/50'
    },
    yellow: {
      icon: 'text-yellow-600 dark:text-yellow-400',
      iconBg: 'bg-yellow-100 dark:bg-yellow-900/50'
    },
    red: {
      icon: 'text-red-600 dark:text-red-400',
      iconBg: 'bg-red-100 dark:bg-red-900/50'
    },
    purple: {
      icon: 'text-purple-600 dark:text-purple-400',
      iconBg: 'bg-purple-100 dark:bg-purple-900/50'
    },
    gray: {
      icon: 'text-gray-600 dark:text-gray-400',
      iconBg: 'bg-gray-100 dark:bg-gray-800'
    }
  }

  const trendColors = {
    up: 'text-green-600 dark:text-green-400',
    down: 'text-red-600 dark:text-red-400',
    neutral: 'text-gray-600 dark:text-gray-400'
  }

  if (loading) {
    return (
      <Card className={cn('animate-pulse', className)}>
        <CardContent>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            </div>
            <div className="ml-4 flex-1">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2" />
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn('transition-all duration-200 hover:shadow-lg', className)} style={style}>
      <CardContent>
        <div className="flex items-center">
          {icon && (
            <div className="flex-shrink-0">
              <div className={cn(
                'inline-flex items-center justify-center p-3 rounded-lg',
                colorClasses[color].iconBg
              )}>
                <div className={cn('h-6 w-6', colorClasses[color].icon)}>
                  {icon}
                </div>
              </div>
            </div>
          )}
          <div className={cn('flex-1', icon ? 'ml-4' : '')}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 truncate">
                {title}
              </p>
              {trend && (
                <Badge variant="secondary" size="sm">
                  <span className={trendColors[trend.direction]}>
                    {trend.direction === 'up' && '↗'}
                    {trend.direction === 'down' && '↘'}
                    {trend.direction === 'neutral' && '→'}
                  </span>
                  <span className="ml-1">{trend.value}%</span>
                </Badge>
              )}
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            {description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {description}
              </p>
            )}
            {trend && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {trend.label}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}