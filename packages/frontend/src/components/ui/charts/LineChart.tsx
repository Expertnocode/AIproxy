import React from 'react'
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'
import { useTheme } from '../../../contexts/ThemeContext'

interface LineChartProps {
  data: Array<Record<string, any>>
  lines: Array<{
    dataKey: string
    color: string
    name?: string
    strokeWidth?: number
    dotSize?: number
  }>
  xAxisDataKey: string
  height?: number
  showGrid?: boolean
  showLegend?: boolean
  formatTooltip?: (value: any, name: string) => [string, string]
  formatXAxis?: (value: any) => string
  formatYAxis?: (value: any) => string
}

export function LineChart({
  data,
  lines,
  xAxisDataKey,
  height = 300,
  showGrid = true,
  showLegend = false,
  formatTooltip,
  formatXAxis,
  formatYAxis
}: LineChartProps) {
  const { actualTheme } = useTheme()
  const isDark = actualTheme === 'dark'

  const theme = {
    text: isDark ? '#e5e7eb' : '#374151',
    grid: isDark ? '#374151' : '#e5e7eb',
    background: isDark ? '#1f2937' : '#ffffff'
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        {showGrid && (
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke={theme.grid}
            opacity={0.3}
          />
        )}
        <XAxis
          dataKey={xAxisDataKey}
          stroke={theme.text}
          fontSize={12}
          axisLine={false}
          tickLine={false}
          {...(formatXAxis && { tickFormatter: formatXAxis })}
        />
        <YAxis
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
        {lines.map((line) => (
          <Line
            key={line.dataKey}
            type="monotone"
            dataKey={line.dataKey}
            stroke={line.color}
            strokeWidth={line.strokeWidth || 2}
            name={line.name || line.dataKey}
            dot={{ fill: line.color, r: line.dotSize || 4 }}
            activeDot={{ r: (line.dotSize || 4) + 2, fill: line.color }}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  )
}