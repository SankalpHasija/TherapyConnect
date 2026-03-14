'use client'

import * as React from 'react'
import { RadioGroup as RadioGroupPrimitive } from '@base-ui/react/radio-group'
import { Radio } from '@base-ui/react/radio'
import { cn } from '@/lib/utils'

const RadioGroup = RadioGroupPrimitive

const RadioGroupItem = React.forwardRef<
  HTMLSpanElement,
  Radio.Root.Props & { className?: string }
>(({ className, ...props }, ref) => (
  <Radio.Root
    ref={ref}
    className={cn(
      'h-4 w-4 shrink-0 rounded-full border border-slate-300 text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 data-[checked]:border-slate-900',
      className
    )}
    {...props}
  >
    <Radio.Indicator className="flex items-center justify-center">
      <span className="h-2 w-2 rounded-full bg-slate-900" />
    </Radio.Indicator>
  </Radio.Root>
))
RadioGroupItem.displayName = 'RadioGroupItem'

export { RadioGroup, RadioGroupItem }
