import type { ReactElement } from 'react'
import AppShell from '@/components/layout/AppShell'

type PractitionerLayoutProps = {
  children: React.ReactNode
}

export default function PractitionerLayout({
  children,
}: PractitionerLayoutProps): ReactElement {
  return <AppShell>{children}</AppShell>
}
