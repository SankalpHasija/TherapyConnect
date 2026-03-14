import type { ReactElement } from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type AssessmentType = 'PHQ9' | 'GAD7'

type PhqBadgeProps = {
  score: number
  type: AssessmentType
  className?: string
}

type Severity = 'minimal' | 'mild' | 'moderate' | 'high'

function getSeverity(score: number, type: AssessmentType): Severity {
  if (type === 'PHQ9') {
    if (score <= 4) return 'minimal'
    if (score <= 9) return 'mild'
    if (score <= 14) return 'moderate'
    return 'high'
  }

  if (score <= 4) return 'minimal'
  if (score <= 9) return 'mild'
  if (score <= 14) return 'moderate'
  return 'high'
}

const severityStyles: Record<Severity, string> = {
  minimal: 'bg-[var(--phq-minimal-bg)] text-[var(--phq-minimal-text)]',
  mild: 'bg-[var(--phq-mild-bg)] text-[var(--phq-mild-text)]',
  moderate: 'bg-[var(--phq-moderate-bg)] text-[var(--phq-moderate-text)]',
  high: 'bg-[var(--phq-high-bg)] text-[var(--phq-high-text)]',
}

export default function PhqBadge({ score, type, className }: PhqBadgeProps): ReactElement {
  const severity = getSeverity(score, type)
  const label = type === 'PHQ9' ? `PHQ-9: ${score}` : `GAD-7: ${score}`

  return (
    <Badge
      variant="outline"
      className={cn('rounded-full border-0 px-2.5 py-0.5 text-xs font-medium', severityStyles[severity], className)}
    >
      {label}
    </Badge>
  )
}
