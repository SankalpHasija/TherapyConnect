import type { ReactElement } from 'react'
import { isValidElement } from 'react'
import type { ReactNode } from 'react'
import { format } from 'date-fns'
import { Menu } from 'lucide-react'
import Sidebar from '@/components/layout/Sidebar'
import AppShellHeader, { type AppShellHeaderProps } from '@/components/layout/AppShellHeader'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

type AppShellProps = {
  children: React.ReactNode
}

function findHeader(node: ReactNode): AppShellHeaderProps | null {
  if (!node) return null
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findHeader(child)
      if (found) return found
    }
    return null
  }

  if (isValidElement<{ children?: ReactNode }>(node)) {
    if (node.type === AppShellHeader) {
      return node.props as AppShellHeaderProps
    }
    return findHeader(node.props.children)
  }

  return null
}

export default function AppShell({ children }: AppShellProps): ReactElement {
  const header = findHeader(children)

  const currentDate = format(new Date(), 'EEEE, d MMMM yyyy')
  const title = header?.title ?? 'Overview'

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-main">
        <div className="app-topbar">
          <div className="flex items-center gap-3">
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger render={<Button variant="ghost" size="icon" />}>
                  <Menu className="h-4 w-4" />
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-[220px]">
                  <Sidebar variant="sheet" />
                </SheetContent>
              </Sheet>
            </div>
            <div>
              <p className="text-[15px] font-medium text-slate-900">{title}</p>
              <p className="text-xs text-slate-500">{currentDate}</p>
            </div>
          </div>
          <div>{header?.action}</div>
        </div>
        <div className="app-content">{children}</div>
      </div>
    </div>
  )
}
