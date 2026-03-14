import type { ReactElement } from 'react'
import type { Metadata } from 'next'
import { Toaster } from '@/components/ui/sonner'
import AuthSessionProvider from '@/components/providers/SessionProvider'
import './globals.css'

export const metadata: Metadata = {
  title: 'TherapyConnect Pro',
  description: 'AI-powered telehealth practice management platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}): ReactElement {
  return (
    <html lang="en">
      <body className="font-sans">
        <AuthSessionProvider>{children}</AuthSessionProvider>
        <Toaster richColors />
      </body>
    </html>
  )
}
