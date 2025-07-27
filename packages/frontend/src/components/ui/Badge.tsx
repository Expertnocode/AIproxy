import React from 'react'
import { cn } from '../../lib/utils'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
  icon?: React.ReactNode
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', icon, children, ...props }, ref) => {
    const variants = {
      default: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
      success: 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100',
      warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100',
      error: 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100',
      info: 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100',
      secondary: 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100'
    }

    const sizes = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-0.5 text-xs',
      lg: 'px-3 py-1 text-sm'
    }

    const iconSizes = {
      sm: 'h-3 w-3',
      md: 'h-3 w-3',
      lg: 'h-4 w-4'
    }

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full font-medium',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {icon && (
          <span className={cn(iconSizes[size], children ? 'mr-1' : '')}>
            {icon}
          </span>
        )}
        {children}
      </span>
    )
  }
)

Badge.displayName = 'Badge'

export { Badge }