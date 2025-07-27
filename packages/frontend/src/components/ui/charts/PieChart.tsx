import React from 'react'
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts'
import { useTheme } from '../../../contexts/ThemeContext'

interface PieChartProps {
  data: Array<{
    name: string
    value: number
    color: string
  }>
  height?: number
  showLegend?: boolean
  innerRadius?: number
  outerRadius?: number
  formatTooltip?: (value: any, name: string) => [string, string]
  centerLabel?: {
    value: string | number
    label: string
  }
}

export function PieChart({
  data,
  height = 300,
  showLegend = true,
  innerRadius = 0,
  outerRadius = 80,
  formatTooltip,
  centerLabel
}: PieChartProps) {
  const { actualTheme } = useTheme()
  const isDark = actualTheme === 'dark'

  const theme = {
    text: isDark ? '#e5e7eb' : '#374151',
    background: isDark ? '#1f2937' : '#ffffff'
  }

  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent
  }: any) => {
    if (percent < 0.05) return null // Don't show labels for slices < 5%
    
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text
        x={x}
        y={y}
        fill={theme.text}
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={12}
        fontWeight={500}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  const renderCenterLabel = () => {
    if (!centerLabel || innerRadius === 0) return null

    return (
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
        <tspan
          x="50%"
          dy="-0.5em"
          fontSize={24}
          fontWeight="bold"
          fill={theme.text}
        >
          {centerLabel.value}
        </tspan>
        <tspan
          x="50%"
          dy="1.5em"
          fontSize={14}
          fill={theme.text}
          opacity={0.7}
        >
          {centerLabel.label}
        </tspan>
      </text>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsPieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderCustomizedLabel}
          outerRadius={outerRadius}
          innerRadius={innerRadius}
          fill="#8884d8"
          dataKey="value"
          stroke="none"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        {renderCenterLabel()}
        <Tooltip
          formatter={formatTooltip || ((value: number) => [value.toLocaleString(), ''])}
          contentStyle={{
            backgroundColor: theme.background,
            border: `1px solid ${theme.text}20`,
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            color: theme.text
          }}
          labelStyle={{ color: theme.text }}
        />
        {showLegend && (
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            wrapperStyle={{ color: theme.text }}
          />
        )}
      </RechartsPieChart>
    </ResponsiveContainer>
  )
}