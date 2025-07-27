import React from 'react'
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'
import { useTheme } from '../../../contexts/ThemeContext'

interface BarChartProps {
  data: Array<Record<string, any>>
  bars: Array<{
    dataKey: string
    color: string
    name?: string
  }>
  xAxisDataKey: string
  height?: number
  showGrid?: boolean
  showLegend?: boolean
  formatTooltip?: (value: any, name: string) => [string, string]
  formatXAxis?: (value: any) => string
  formatYAxis?: (value: any) => string
  layout?: 'horizontal' | 'vertical'
}

export function BarChart({
  data,
  bars,
  xAxisDataKey,
  height = 300,
  showGrid = true,
  showLegend = false,
  formatTooltip,
  formatXAxis,
  formatYAxis,
  layout = 'vertical'
}: BarChartProps) {
  const { actualTheme } = useTheme()
  const isDark = actualTheme === 'dark'

  const theme = {
    text: isDark ? '#e5e7eb' : '#374151',
    grid: isDark ? '#374151' : '#e5e7eb',
    background: isDark ? '#1f2937' : '#ffffff'
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart 
        data={data} 
        layout={layout}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        {showGrid && (
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke={theme.grid}
            opacity={0.3}
          />
        )}
        <XAxis
          type={layout === 'vertical' ? 'category' : 'number'}
          dataKey={layout === 'vertical' ? xAxisDataKey : ''}
          stroke={theme.text}
          fontSize={12}
          axisLine={false}
          tickLine={false}
          {...(formatXAxis && { tickFormatter: formatXAxis })}
        />
        <YAxis
          type={layout === 'vertical' ? 'number' : 'category'}
          dataKey={layout === 'horizontal' ? xAxisDataKey : ''}
          stroke={theme.text}
          fontSize={12}
          axisLine={false}
          tickLine={false}
          {...(formatYAxis && { tickFormatter: formatYAxis })}
        />
        <Tooltip
          {...(formatTooltip && { formatter: formatTooltip })}
          contentStyle={{
            backgroundColor: theme.background,
            border: `1px solid ${theme.grid}`,
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            color: theme.text
          }}
          labelStyle={{ color: theme.text }}
        />
        {showLegend && <Legend />}
        {bars.map((bar) => (
          <Bar
            key={bar.dataKey}
            dataKey={bar.dataKey}
            fill={bar.color}
            name={bar.name || bar.dataKey}
            radius={[4, 4, 0, 0]}
          />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  )
}