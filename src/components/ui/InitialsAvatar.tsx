import type { ReactElement } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

type AvatarSize = 'sm' | 'md' | 'lg'

type InitialsAvatarProps = {
  name: string
  size?: AvatarSize
  colorIndex?: number
  className?: string
}

const sizeClasses: Record<AvatarSize, string> = {
  sm: 'h-7 w-7 text-xs',
  md: 'h-9 w-9 text-sm',
  lg: 'h-11 w-11 text-base',
}

const palette = [
  'bg-[#ccfbf1] text-[#0f766e]',
  'bg-[#99f6e4] text-[#0f766e]',
  'bg-[#5eead4] text-[#0f766e]',
  'bg-[#2dd4bf] text-[#0f766e]',
  'bg-[#14b8a6] text-white',
]

function getInitials(name: string): string {
  const parts = name.trim().split(' ').filter(Boolean)
  if (parts.length === 0) return ''
  if (parts.length === 1) return parts[0][0] ?? ''
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`
}

function getColorIndex(name: string): number {
  let hash = 0
  for (const char of name) {
    hash = (hash + char.charCodeAt(0)) % palette.length
  }
  return hash
}

export default function InitialsAvatar({
  name,
  size = 'md',
  colorIndex,
  className,
}: InitialsAvatarProps): ReactElement {
  const index = colorIndex ?? getColorIndex(name)
  const colorClass = palette[index % palette.length]

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      <AvatarFallback className={cn('font-semibold', colorClass)}>
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  )
}
