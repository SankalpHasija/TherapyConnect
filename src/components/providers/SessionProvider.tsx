'use client'

import type { ReactElement } from 'react'
import { SessionProvider } from 'next-auth/react'

type SessionProviderProps = {
  children: React.ReactNode
}

export default function AuthSessionProvider({
  children,
}: SessionProviderProps): ReactElement {
  return <SessionProvider>{children}</SessionProvider>
}
