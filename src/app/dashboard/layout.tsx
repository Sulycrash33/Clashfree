'use client'

import { SessionProvider } from 'next-auth/react'
import { Sidebar } from '@/components/layout/sidebar'
import { DemoModeBanner } from '@/components/demo-banner'
import { redirect } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { isDemoCookieSet } from '@/lib/demo'

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const demoMode = isDemoCookieSet()

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500" />
      </div>
    )
  }

  if (status === 'unauthenticated') {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {demoMode && <DemoModeBanner />}
      <Sidebar demoMode={demoMode} />
      <main
        className="lg:ml-64 min-h-screen"
        data-demo-mode={demoMode ? 'true' : undefined}
      >
        <div className={`p-4 lg:p-8 ${demoMode ? 'pt-16 lg:pt-16' : 'pt-16 lg:pt-8'}`}>
          {children}
        </div>
      </main>
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <DashboardContent>{children}</DashboardContent>
    </SessionProvider>
  )
}
