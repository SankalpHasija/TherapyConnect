import type { ReactElement } from 'react'
import Link from 'next/link'
import PageWrapper from '@/components/layout/PageWrapper'
import { Button } from '@/components/ui/button'

export default function LandingPage(): ReactElement {
  return (
    <PageWrapper>
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <div className="max-w-2xl space-y-4">
          <h1 className="text-4xl font-semibold text-slate-900">TherapyConnect Pro</h1>
          <p className="text-slate-600">
            AI-powered telehealth practice management for modern therapists.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <Button render={<Link href="/login" />} nativeButton={false} variant="outline">
              Sign In
            </Button>
            <Button render={<Link href="/register" />} nativeButton={false}>
              Get Started
            </Button>
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
