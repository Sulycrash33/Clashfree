'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { History, GitBranch, Check, Clock, User, ChevronRight, Loader2 } from 'lucide-react'

interface Version {
  id: string
  version: number
  changes: string | null
  publishedBy: string | null
  publishedAt: string | null
  isCurrent: boolean
  createdAt: string
}

interface VersionHistoryProps {
  examPeriodId: string
  currentVersion?: number
}

export function VersionHistory({ examPeriodId, currentVersion = 0 }: VersionHistoryProps) {
  const [versions, setVersions] = useState<Version[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (open && examPeriodId) {
      fetchVersions()
    }
  }, [open, examPeriodId])

  const fetchVersions = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/timetable-versions?examPeriodId=${examPeriodId}`)
      if (res.ok) {
        const data = await res.json()
        setVersions(data)
      }
    } catch (error) {
      console.error('Failed to fetch versions:', error)
    } finally {
      setLoading(false)
    }
  }

  const parseChanges = (changesJson: string | null): { type: string; description: string }[] => {
    if (!changesJson) return []
    try {
      return JSON.parse(changesJson)
    } catch {
      return [{ type: 'update', description: changesJson }]
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="border-foreground/10 text-muted-foreground hover:text-foreground"
        >
          <History className="w-4 h-4 mr-2" />
          v{currentVersion || '0'}
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-muted border-foreground/10 text-foreground max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-secondary" />
            Version History
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Track changes and restore previous versions of the timetable
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 max-h-[400px] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-secondary" />
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <GitBranch className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No version history yet</p>
              <p className="text-sm mt-1">Versions are created when you publish a timetable</p>
            </div>
          ) : (
            <div className="space-y-3">
              {versions.map((version, index) => (
                <div
                  key={version.id}
                  className={`relative pl-6 pb-4 ${
                    index < versions.length - 1 ? 'border-l-2 border-foreground/10' : ''
                  }`}
                >
                  {/* Version node */}
                  <div className={`absolute left-0 top-0 w-3 h-3 rounded-full -translate-x-[7px] ${
                    version.isCurrent 
                      ? 'bg-success ring-2 ring-success/30' 
                      : 'bg-muted'
                  }`} />

                  <div className={`p-3 rounded-lg ${
                    version.isCurrent 
                      ? 'bg-success/10 border border-success/20' 
                      : 'bg-foreground/5 border border-foreground/10'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">Version {version.version}</span>
                        {version.isCurrent && (
                          <Badge className="bg-success/20 text-success border-0 text-xs">
                            Current
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(version.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Changes */}
                    {version.changes && (
                      <div className="space-y-1 mt-2">
                        {parseChanges(version.changes).map((change, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm">
                            <ChevronRight className="w-3 h-3 text-secondary mt-0.5 flex-shrink-0" />
                            <span className="text-muted-foreground">{change.description}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Publisher info */}
                    {version.publishedBy && (
                      <div className="flex items-center gap-2 mt-3 pt-2 border-t border-foreground/5 text-xs text-muted-foreground">
                        <User className="w-3 h-3" />
                        <span>Published by {version.publishedBy}</span>
                        {version.publishedAt && (
                          <>
                            <Clock className="w-3 h-3 ml-2" />
                            <span>{new Date(version.publishedAt).toLocaleString()}</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-foreground/10 flex justify-between items-center">
          <span className="text-xs text-muted-foreground">
            {versions.length} version(s) total
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOpen(false)}
            className="border-foreground/10 text-muted-foreground"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Mini version badge for inline display
interface VersionBadgeProps {
  version: number
  isCurrent?: boolean
  onClick?: () => void
}

export function VersionBadge({ version, isCurrent = false, onClick }: VersionBadgeProps) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium transition-colors ${
        isCurrent
          ? 'bg-success/20 text-success hover:bg-success/30'
          : 'bg-foreground/5 text-muted-foreground hover:bg-foreground/10'
      } ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <GitBranch className="w-3 h-3" />
      v{version}
      {isCurrent && <Check className="w-3 h-3" />}
    </button>
  )
}
