import type { ReactElement } from 'react'
import PageWrapper from '@/components/layout/PageWrapper'

type AuthLayoutProps = {
  children: React.ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps): ReactElement {
  return <PageWrapper>{children}</PageWrapper>
}
