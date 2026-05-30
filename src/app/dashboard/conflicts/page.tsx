'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PageHeader } from '@/components/page-header'
import { AlertTriangle, CheckCircle2, XCircle, Clock, Users, MapPin, BookOpen, Loader2, ChevronRight } from 'lucide-react'

interface Conflict {
  id: string
  type: string
  severity: string
  status: string
  description: string
  affectedName: string
  affectedEntity: string
  createdAt: string
  resolution?: string
}

const conflictTypes: Record<string, { label: string; color: string }> = {
  STUDENT_CLASH: { label: 'Student Clash', color: 'text-red-400' },
  LECTURER_CLASH: { label: 'Lecturer Clash', color: 'text-amber-400' },
  ROOM_CLASH: { label: 'Room Clash', color: 'text-purple-400' },
  ROOM_CAPACITY: { label: 'Room Capacity', color: 'text-cyan-400' },
  ROOM_TYPE_MISMATCH: { label: 'Room Type Mismatch', color: 'text-blue-400' },
  LECTURER_UNAVAILABLE: { label: 'Lecturer Unavailable', color: 'text-orange-400' },
  CO_CLASH: { label: 'CO Clash', color: 'text-pink-400' },
}

const severityColors: Record<string, string> = {
  CRITICAL: 'bg-red-500/10 text-red-400 border-red-500/20',
  WARNING: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  INFO: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
}

// Demo conflicts
const demoConflicts: Conflict[] = [
  {
    id: '1',
    type: 'CO_CLASH',
    severity: 'CRITICAL',
    status: 'DETECTED',
    description: 'Student NSUK/2021/CSC/045 has a carry-over exam (MTH 101) at the same time as CSC 301',
    affectedName: 'John Adamu (CSC 300 Level)',
    affectedEntity: 'student-045',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    type: 'ROOM_CAPACITY',
    severity: 'WARNING',
    status: 'DETECTED',
    description: 'MPH has capacity 1500 but 1,847 students are registered for GST 111',
    affectedName: 'Multi-Purpose Hall',
    affectedEntity: 'room-mph',
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    type: 'LECTURER_CLASH',
    severity: 'WARNING',
    status: 'ACKNOWLEDGED',
    description: 'Dr. Adamu is scheduled to invigilate CSC 201 and CSC 301 at overlapping times',
    affectedName: 'Dr. Adamu (Computer Science)',
    affectedEntity: 'lecturer-adamu',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    resolution: 'Recommended: Assign alternative invigilator for CSC 301',
  },
]

export default function ConflictsPage() {
  const { data: session } = useSession()
  const [conflicts, setConflicts] = useState<Conflict[]>(demoConflicts)
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<'all' | 'CRITICAL' | 'WARNING' | 'INFO'>('all')

  const filteredConflicts = filter === 'all' 
    ? conflicts 
    : conflicts.filter(c => c.severity === filter)

  const handleResolve = async (id: string) => {
    // Simulate resolution
    setConflicts(prev => prev.map(c => 
      c.id === id ? { ...c, status: 'RESOLVED', resolution: 'Conflict resolved by admin' } : c
    ))
  }

  const handleIgnore = async (id: string) => {
    setConflicts(prev => prev.map(c => 
      c.id === id ? { ...c, status: 'IGNORED' } : c
    ))
  }

  const stats = {
    total: conflicts.length,
    critical: conflicts.filter(c => c.severity === 'CRITICAL').length,
    warning: conflicts.filter(c => c.severity === 'WARNING').length,
    resolved: conflicts.filter(c => c.status === 'RESOLVED').length,
  }

  if (!['SA', 'IA', 'TO'].includes(session?.user?.role || '')) {
    return (
      <Alert className="bg-red-500/10 border-red-500/20">
        <AlertDescription className="text-red-400">Access denied.</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Conflicts & Issues"
        description="Detect and resolve scheduling conflicts"
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white/5 border-white/10">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{stats.total}</div>
                <div className="text-xs text-slate-400">Total Issues</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{stats.critical}</div>
                <div className="text-xs text-slate-400">Critical</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{stats.warning}</div>
                <div className="text-xs text-slate-400">Warnings</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{stats.resolved}</div>
                <div className="text-xs text-slate-400">Resolved</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-white/5 border-white/10">
        <CardContent className="pt-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">Filter:</span>
            {['all', 'CRITICAL', 'WARNING', 'INFO'].map((f) => (
              <Button
                key={f}
                variant={filter === f ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(f as any)}
                className={filter === f 
                  ? 'bg-cyan-500 text-white' 
                  : 'border-white/10 text-slate-400 hover:text-white'
                }
              >
                {f === 'all' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Conflicts List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
          </div>
        ) : filteredConflicts.length === 0 ? (
          <Card className="bg-white/5 border-white/10">
            <CardContent className="py-12 text-center">
              <CheckCircle2 className="w-12 h-12 mx-auto text-green-400 mb-4" />
              <p className="text-white font-medium">No conflicts detected</p>
              <p className="text-sm text-slate-400">All timetable constraints are satisfied</p>
            </CardContent>
          </Card>
        ) : (
          filteredConflicts.map((conflict) => {
            const typeInfo = conflictTypes[conflict.type] || { label: conflict.type, color: 'text-slate-400' }
            return (
              <Card key={conflict.id} className="bg-white/5 border-white/10">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <AlertTriangle className={`w-5 h-5 ${typeInfo.color}`} />
                        <span className="font-medium text-white">{typeInfo.label}</span>
                        <Badge className={severityColors[conflict.severity]}>
                          {conflict.severity}
                        </Badge>
                        <Badge variant="outline" className={`border-white/10 ${
                          conflict.status === 'RESOLVED' ? 'text-green-400' :
                          conflict.status === 'IGNORED' ? 'text-slate-400' :
                          conflict.status === 'ACKNOWLEDGED' ? 'text-amber-400' : 'text-red-400'
                        }`}>
                          {conflict.status}
                        </Badge>
                      </div>
                      <p className="text-slate-300 text-sm mb-2">{conflict.description}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span>Affected: {conflict.affectedName}</span>
                        <span>Detected: {new Date(conflict.createdAt).toLocaleString()}</span>
                      </div>
                      {conflict.resolution && (
                        <div className="mt-3 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                          <p className="text-sm text-green-400">
                            <strong>Resolution:</strong> {conflict.resolution}
                          </p>
                        </div>
                      )}
                    </div>
                    {conflict.status === 'DETECTED' && (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleResolve(conflict.id)}
                          className="bg-green-500/20 text-green-400 hover:bg-green-500/30 border-0"
                        >
                          Resolve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleIgnore(conflict.id)}
                          className="border-white/10 text-slate-400 hover:text-white"
                        >
                          Ignore
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
