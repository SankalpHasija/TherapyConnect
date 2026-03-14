import type { ReactElement } from 'react'
import Navbar from '@/components/layout/Navbar'

type PageWrapperProps = {
  children: React.ReactNode
  title?: string
}

export default function PageWrapper({ children, title }: PageWrapperProps): ReactElement {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8">
        {title && (
          <h1 className="text-2xl font-semibold text-slate-900 mb-6">{title}</h1>
        )}
        {children}
      </main>
    </div>
  )
}
