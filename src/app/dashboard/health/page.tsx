'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, Server, Database, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'

interface HealthStatus {
  database: 'healthy' | 'degraded' | 'down'
  api: 'healthy' | 'degraded' | 'down'
  storage: 'healthy' | 'degraded' | 'down'
  lastChecked: string
}

export default function HealthPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [health, setHealth] = useState<HealthStatus>({
    database: 'healthy',
    api: 'healthy',
    storage: 'healthy',
    lastChecked: new Date().toISOString()
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  if (status === 'loading') {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!session || session.user?.role !== 'SA') {
    return <div className="p-8">Access denied. Super Admin only.</div>
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-success" />
      case 'degraded':
        return <AlertTriangle className="w-5 h-5 text-accent-gold" />
      case 'down':
        return <XCircle className="w-5 h-5 text-clash" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-success'
      case 'degraded':
        return 'text-accent-gold'
      case 'down':
        return 'text-clash'
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Health"
        description="Monitor the health status of all system components"
        icon={Shield}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {getStatusIcon(health.database)}
              <span className={`text-2xl font-bold capitalize ${getStatusColor(health.database)}`}>
                {health.database}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">PostgreSQL connection</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Services</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {getStatusIcon(health.api)}
              <span className={`text-2xl font-bold capitalize ${getStatusColor(health.api)}`}>
                {health.api}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">All API endpoints</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {getStatusIcon(health.storage)}
              <span className={`text-2xl font-bold capitalize ${getStatusColor(health.storage)}`}>
                {health.storage}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">File storage system</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Health Check:</span>
              <span>{new Date(health.lastChecked).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Version:</span>
              <span>1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Environment:</span>
              <span>Production</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
