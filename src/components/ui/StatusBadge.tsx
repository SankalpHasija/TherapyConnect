import type { ReactElement } from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type AppointmentStatus =
  | 'SCHEDULED'
  | 'WAITING'
  | 'IN_SESSION'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW'

type StatusBadgeProps = {
  status: AppointmentStatus
  className?: string
}

const statusStyles: Record<AppointmentStatus, string> = {
  SCHEDULED: 'bg-[var(--status-scheduled-bg)] text-[var(--status-scheduled-text)]',
  COMPLETED: 'bg-[var(--status-completed-bg)] text-[var(--status-completed-text)]',
  CANCELLED: 'bg-[var(--status-cancelled-bg)] text-[var(--status-cancelled-text)]',
  IN_SESSION: 'bg-[var(--status-session-bg)] text-[var(--status-session-text)]',
  WAITING: 'bg-[var(--status-waiting-bg)] text-[var(--status-waiting-text)]',
  NO_SHOW: 'bg-slate-100 text-slate-500',
}

export default function StatusBadge({ status, className }: StatusBadgeProps): ReactElement {
  const label = status.replace('_', ' ')
  return (
    <Badge
      variant="outline"
      className={cn('rounded-full border-0 px-2.5 py-0.5 text-xs font-medium', statusStyles[status], className)}
    >
      {label}
    </Badge>
  )
}
