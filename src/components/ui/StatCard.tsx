import type { ReactElement } from 'react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type StatCardColor = 'teal' | 'green' | 'amber'

type StatCardProps = {
  label: string
  value: string
  trend: string
  trendLabel: string
  sparkData: number[]
  color: StatCardColor
  icon?: ReactNode
  className?: string
}

const colorMap: Record<StatCardColor, { stroke: string; fill: string; iconBg: string; text: string }> = {
  teal: {
    stroke: '#0f766e',
    fill: 'rgba(15, 118, 110, 0.15)',
    iconBg: 'bg-[#ccfbf1] text-[#0f766e]',
    text: 'text-[#0f766e]',
  },
  green: {
    stroke: '#15803d',
    fill: 'rgba(21, 128, 61, 0.15)',
    iconBg: 'bg-[#dcfce7] text-[#15803d]',
    text: 'text-[#15803d]',
  },
  amber: {
    stroke: '#d97706',
    fill: 'rgba(217, 119, 6, 0.15)',
    iconBg: 'bg-[#fef3c7] text-[#d97706]',
    text: 'text-[#d97706]',
  },
}

type SparklinePath = {
  points: string
  areaPath: string
}

function buildSparkline(data: number[]): SparklinePath {
  const safeData = data.length > 0 ? data : [0]
  const height = 40
  const width = 120
  const max = Math.max(...safeData)
  const min = Math.min(...safeData)
  const range = max - min || 1
  const step = safeData.length > 1 ? width / (safeData.length - 1) : width

  const coords = safeData.map((value, index) => {
    const normalized = (value - min) / range
    const x = index * step
    const y = height - normalized * height
    return { x, y }
  })

  const points = coords.map((coord) => `${coord.x},${coord.y}`).join(' ')
  const areaPath = `M 0 ${height} L ${points} L ${width} ${height} Z`
  return { points, areaPath }
}

export default function StatCard({
  label,
  value,
  trend,
  trendLabel,
  sparkData,
  color,
  icon,
  className,
}: StatCardProps): ReactElement {
  const styles = colorMap[color]
  const { points, areaPath } = buildSparkline(sparkData)

  return (
    <div className={cn('surface-card', className)}>
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
        <div
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-full text-sm',
            styles.iconBg
          )}
        >
          {icon ?? <span className="text-[10px] font-semibold">•</span>}
        </div>
      </div>
      <div className="mt-3 text-[28px] font-semibold text-slate-900">{value}</div>
      <div className="mt-1 flex items-center gap-2 text-xs">
        <span className={cn('font-medium', styles.text)}>{trend}</span>
        <span className="text-slate-500">{trendLabel}</span>
      </div>
      <div className="sparkline-area">
        <svg viewBox="0 0 120 40" preserveAspectRatio="none" className="h-full w-full">
          <path d={areaPath} fill={styles.fill} />
          <polyline
            points={points}
            fill="none"
            stroke={styles.stroke}
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  )
}
