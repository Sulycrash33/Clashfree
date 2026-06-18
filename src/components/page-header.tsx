'use client'

import { Button } from '@/components/ui/button'
import { Plus, RefreshCw } from 'lucide-react'

import type { LucideIcon } from 'lucide-react'

interface PageHeaderProps {
  title: string
  description: string
  icon?: LucideIcon
  actionLabel?: string
  onAction?: () => void
  onRefresh?: () => void
  loading?: boolean
}

export function PageHeader({
  title,
  description,
  icon: Icon,
  actionLabel,
  onAction,
  onRefresh,
  loading,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        <p className="text-muted">{description}</p>
      </div>
      <div className="flex items-center gap-2">
        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
            className="border-foreground/10 text-muted hover:text-white hover:bg-foreground/5"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        )}
        {actionLabel && onAction && (
          <Button
            size="sm"
            onClick={onAction}
            className="bg-gradient-to-r from-secondary to-secondary hover:from-secondary hover:to-secondary text-white border-0"
          >
            <Plus className="w-4 h-4 mr-2" />
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  )
}
