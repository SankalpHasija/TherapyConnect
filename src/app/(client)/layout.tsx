import type { ReactElement } from 'react'
import AppShell from '@/components/layout/AppShell'

type ClientLayoutProps = {
  children: React.ReactNode
}

export default function ClientLayout({ children }: ClientLayoutProps): ReactElement {
  return <AppShell>{children}</AppShell>
}
