import type { ReactElement } from 'react'
import AppShell from '@/components/layout/AppShell'

type AdminLayoutProps = {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps): ReactElement {
  return <AppShell>{children}</AppShell>
}
