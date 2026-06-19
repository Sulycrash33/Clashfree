'use client'

import { SessionProvider } from 'next-auth/react'
import { Sidebar } from '@/components/layout/sidebar'
import { redirect } from 'next/navigation'
import { useSession } from 'next-auth/react'

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary" />
      </div>
    )
  }

  if (status === 'unauthenticated') {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar />
      <main
        className={[
          // Desktop: offset by sidebar width
          'lg:ml-64',
          // Mobile: offset by top bar (56px) and bottom nav (64px)
          'min-h-screen',
        ].join(' ')}
      >
        <div className="p-4 lg:p-8 pt-[70px] lg:pt-8 pb-[80px] lg:pb-8">
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
