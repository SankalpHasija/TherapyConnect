"use client"

import { Accordion } from "@base-ui/react/accordion"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

function AccordionRoot({
  className,
  ...props
}: Accordion.Root.Props) {
  return <Accordion.Root className={cn("w-full", className)} {...props} />
}

function AccordionItem({
  className,
  ...props
}: Accordion.Item.Props) {
  return (
    <Accordion.Item
      className={cn("border-b border-slate-200", className)}
      {...props}
    />
  )
}

function AccordionTrigger({
  className,
  children,
  ...props
}: Accordion.Trigger.Props) {
  return (
    <Accordion.Header>
      <Accordion.Trigger
        className={cn(
          "flex w-full items-center justify-between py-2 text-left text-sm font-medium text-slate-900",
          className
        )}
        {...props}
      >
        {children}
        <ChevronDown className="h-4 w-4 text-slate-500 transition-transform data-[state=open]:rotate-180" />
      </Accordion.Trigger>
    </Accordion.Header>
  )
}

function AccordionContent({
  className,
  ...props
}: Accordion.Panel.Props) {
  return (
    <Accordion.Panel
      className={cn("pb-3 text-sm text-slate-600", className)}
      {...props}
    />
  )
}

export {
  AccordionRoot as Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
}
