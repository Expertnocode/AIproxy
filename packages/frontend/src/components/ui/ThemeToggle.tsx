import React from 'react'
import { SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline'
import { useTheme } from '../../contexts/ThemeContext'
import { Button } from './Button'
import { cn } from '../../lib/utils'

interface ThemeToggleProps {
  variant?: 'dropdown' | 'button'
  className?: string
}

export function ThemeToggle({ variant = 'button', className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()

  if (variant === 'button') {
    const icons = {
      light: <SunIcon className="h-4 w-4" />,
      dark: <MoonIcon className="h-4 w-4" />,
      system: <ComputerDesktopIcon className="h-4 w-4" />
    }

    const nextTheme = theme === 'light' ? 'dark' : 'light'

    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setTheme(nextTheme)}
        className={cn('w-9 h-9 p-0', className)}
        icon={icons[theme === 'system' ? 'light' : theme]}
      />
    )
  }

  return (
    <div className={cn('flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1', className)}>
      {(['light', 'dark', 'system'] as const).map((t) => (
        <button
          key={t}
          onClick={() => setTheme(t)}
          className={cn(
            'flex items-center justify-center w-8 h-8 rounded-md transition-colors',
            theme === t
              ? 'bg-white dark:bg-gray-700 shadow-sm'
              : 'hover:bg-gray-200 dark:hover:bg-gray-700'
          )}
        >
          {t === 'light' && <SunIcon className="h-4 w-4" />}
          {t === 'dark' && <MoonIcon className="h-4 w-4" />}
          {t === 'system' && <ComputerDesktopIcon className="h-4 w-4" />}
        </button>
      ))}
    </div>
  )
}