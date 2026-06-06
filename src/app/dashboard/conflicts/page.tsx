'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PageHeader } from '@/components/page-header'
import { AlertTriangle, CheckCircle2, XCircle, Clock, Users, MapPin, BookOpen, Loader2, RefreshCw, TrendingUp, AlertCircle, Eye, RotateCcw, ShieldCheck } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'

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
  details?: any
}

interface ExamPeriod {
  id: string
  name: string
  session: string
  semester: number
}

interface COStats {
  totalStudents: number
  studentsWithCOs: number
  studentsWithSpillover: number
  coCoursesBreakdown: { courseCode: string; count: number }[]
  levelBreakdown: { level: number; coCount: number; spilloverCount: number }[]
}

const conflictTypes: Record<string, { label: string; color: string; icon: any }> = {
  STUDENT_CLASH: { label: 'Student Clash', color: 'text-red-400', icon: Users },
  LECTURER_CLASH: { label: 'Lecturer Clash', color: 'text-amber-400', icon: Users },
  ROOM_CLASH: { label: 'Room Clash', color: 'text-purple-400', icon: MapPin },
  ROOM_CAPACITY: { label: 'Room Capacity', color: 'text-cyan-400', icon: MapPin },
  ROOM_TYPE_MISMATCH: { label: 'Room Type Mismatch', color: 'text-blue-400', icon: MapPin },
  LECTURER_UNAVAILABLE: { label: 'Lecturer Unavailable', color: 'text-orange-400', icon: Clock },
  CO_CLASH: { label: 'CO Clash', color: 'text-pink-400', icon: AlertTriangle },
}

const severityColors: Record<string, string> = {
  CRITICAL: 'bg-red-500/10 text-red-400 border-red-500/20',
  WARNING: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  INFO: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
}

export default function ConflictsPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [conflicts, setConflicts] = useState<Conflict[]>([])
  const [examPeriods, setExamPeriods] = useState<ExamPeriod[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [detecting, setDetecting] = useState(false)
  const [filter, setFilter] = useState<'all' | 'CRITICAL' | 'WARNING' | 'INFO'>('all')
  const [coStats, setCOStats] = useState<COStats | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailConflict, setDetailConflict] = useState<Conflict | null>(null)
  const [overrideNote, setOverrideNote] = useState('')
  const [overriding, setOverriding] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch exam periods
      const periodsRes = await fetch('/api/exam-periods')
      if (periodsRes.ok) {
        const periods = await periodsRes.json()
        setExamPeriods(periods)
        if (periods.length > 0 && !selectedPeriod) {
          setSelectedPeriod(periods[0].id)
        }
      }

      // Fetch conflicts
      const conflictsRes = await fetch('/api/conflicts')
      if (conflictsRes.ok) {
        const data = await conflictsRes.json()
        setConflicts(data.conflicts || [])
      }

      // Fetch CO stats
      const coStatsRes = await fetch('/api/co-stats')
      if (coStatsRes.ok) {
        setCOStats(await coStatsRes.json())
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to fetch data', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [selectedPeriod, toast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleDetectCOClashes = async () => {
    if (!selectedPeriod) {
      toast({ title: 'Error', description: 'Please select an exam period', variant: 'destructive' })
      return
    }

    setDetecting(true)
    try {
      const res = await fetch(`/api/conflicts?action=detect-co&examPeriodId=${selectedPeriod}`)
      if (res.ok) {
        const data = await res.json()
        setConflicts(data.conflicts)
        toast({
          title: 'Detection Complete',
          description: `Found ${data.conflicts.length} CO clashes affecting ${data.totalAffected} students`,
        })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to detect CO clashes', variant: 'destructive' })
    } finally {
      setDetecting(false)
    }
  }

  const handleResolve = async (id: string) => {
    try {
      const res = await fetch('/api/conflicts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'RESOLVED', resolution: 'Resolved by administrator' }),
      })

      if (res.ok) {
        setConflicts(prev => prev.map(c =>
          c.id === id ? { ...c, status: 'RESOLVED', resolution: 'Resolved by administrator' } : c
        ))
        toast({ title: 'Success', description: 'Conflict marked as resolved' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update conflict', variant: 'destructive' })
    }
  }

  const handleIgnore = async (id: string) => {
    try {
      const res = await fetch('/api/conflicts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'IGNORED' }),
      })

      if (res.ok) {
        setConflicts(prev => prev.map(c => c.id === id ? { ...c, status: 'IGNORED' } : c))
        toast({ title: 'Success', description: 'Conflict ignored' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update conflict', variant: 'destructive' })
    }
  }

  const handleOverride = async (id: string, note: string) => {
    setOverriding(true)
    try {
      const res = await fetch('/api/conflicts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'RESOLVED', resolution: note || 'Override approved by IA' }),
      })
      if (res.ok) {
        setConflicts(prev => prev.map(c => c.id === id ? { ...c, status: 'RESOLVED', resolution: note || 'Override approved by IA' } : c))
        setDetailOpen(false)
        setOverrideNote('')
        toast({ title: 'Override applied', description: 'Conflict overridden and marked resolved' })
      }
    } catch { toast({ title: 'Error', description: 'Failed to override', variant: 'destructive' }) }
    finally { setOverriding(false) }
  }

  const handleReopen = async (id: string) => {
    try {
      const res = await fetch('/api/conflicts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'DETECTED', resolution: null }),
      })
      if (res.ok) {
        setConflicts(prev => prev.map(c => c.id === id ? { ...c, status: 'DETECTED', resolution: undefined } : c))
        setDetailOpen(false)
        toast({ title: 'Conflict re-opened' })
      }
    } catch { toast({ title: 'Error', description: 'Failed to re-open', variant: 'destructive' }) }
  }

  const filteredConflicts = filter === 'all'
    ? conflicts
    : conflicts.filter(c => c.severity === filter)

  const stats = {
    total: conflicts.length,
    critical: conflicts.filter(c => c.severity === 'CRITICAL').length,
    warning: conflicts.filter(c => c.severity === 'WARNING').length,
    resolved: conflicts.filter(c => c.status === 'RESOLVED').length,
  }

  if (!['SA', 'IA', 'TO'].includes(session?.user?.role || '')) {
    return (
      <Alert className="bg-red-500/10 border-red-500/20">
        <AlertDescription className="text-red-400">Access denied. Only administrators can view conflicts.</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Conflicts & Issues"
        description="Detect and resolve scheduling conflicts"
        onRefresh={fetchData}
        loading={loading}
      />

      {/* Control Panel */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="space-y-1">
                <label className="text-sm text-slate-400">Exam Period</label>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="w-64 bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select exam period" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10">
                    {examPeriods.map((p) => (
                      <SelectItem key={p.id} value={p.id} className="text-white">
                        {p.name} - {p.session} Sem {p.semester}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={handleDetectCOClashes}
                disabled={detecting || !selectedPeriod}
                className="bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white border-0"
              >
                {detecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Detecting...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Detect CO Clashes
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

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

      {/* CO Statistics */}
      {coStats && (
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              Carry-Over Statistics
            </CardTitle>
            <CardDescription>Overview of students with carry-over and spillover courses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-white/5 rounded-lg">
                <div className="text-3xl font-bold text-white">{coStats.studentsWithCOs}</div>
                <div className="text-sm text-slate-400">Students with COs</div>
              </div>
              <div className="text-center p-4 bg-white/5 rounded-lg">
                <div className="text-3xl font-bold text-white">{coStats.studentsWithSpillover}</div>
                <div className="text-sm text-slate-400">Students with Spillovers</div>
              </div>
              <div className="text-center p-4 bg-white/5 rounded-lg">
                <div className="text-3xl font-bold text-white">{coStats.totalStudents}</div>
                <div className="text-sm text-slate-400">Total Students</div>
              </div>
            </div>
            {coStats.coCoursesBreakdown.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-slate-400 mb-3">Top CO Courses</h4>
                <div className="flex flex-wrap gap-2">
                  {coStats.coCoursesBreakdown.slice(0, 8).map(({ courseCode, count }) => (
                    <Badge key={courseCode} variant="outline" className="border-white/10 text-slate-300">
                      {courseCode}: {count} students
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
            const typeInfo = conflictTypes[conflict.type] || { label: conflict.type, color: 'text-slate-400', icon: AlertCircle }
            const IconComponent = typeInfo.icon
            return (
              <Card key={conflict.id} className="bg-white/5 border-white/10">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <IconComponent className={`w-5 h-5 ${typeInfo.color}`} />
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
                      {conflict.details && (
                        <div className="mt-3 p-3 bg-white/5 rounded-lg">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-slate-500">Course A:</span>
                              <span className="ml-2 text-cyan-400">{conflict.details.courseA?.code}</span>
                              <span className="text-xs text-slate-400 ml-1">({conflict.details.courseA?.status})</span>
                            </div>
                            <div>
                              <span className="text-slate-500">Course B:</span>
                              <span className="ml-2 text-pink-400">{conflict.details.courseB?.code}</span>
                              <span className="text-xs text-slate-400 ml-1">({conflict.details.courseB?.status})</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { setDetailConflict(conflict); setOverrideNote(''); setDetailOpen(true) }}
                        className="border-white/10 text-slate-300 hover:text-white"
                      >
                        <Eye className="w-3 h-3 mr-1" /> Detail
                      </Button>
                      {conflict.status === 'DETECTED' && (
                        <>
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
                          {['IA', 'SA'].includes(session?.user?.role || '') && (
                            <Button
                              size="sm"
                              onClick={() => { setDetailConflict(conflict); setOverrideNote(''); setDetailOpen(true) }}
                              className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border-0"
                            >
                              <ShieldCheck className="w-3 h-3 mr-1" /> Override
                            </Button>
                          )}
                        </>
                      )}
                      {['RESOLVED', 'IGNORED'].includes(conflict.status) && ['IA', 'SA'].includes(session?.user?.role || '') && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReopen(conflict.id)}
                          className="border-amber-500/20 text-amber-400 hover:text-amber-300"
                        >
                          <RotateCcw className="w-3 h-3 mr-1" /> Re-open
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
      {/* Override Detail Sheet */}
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent className="bg-slate-900 border-white/10 text-white w-full sm:max-w-xl overflow-y-auto">
          {detailConflict && (
            <>
              <SheetHeader className="mb-5">
                <SheetTitle className="text-white flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  Conflict Detail
                </SheetTitle>
                <SheetDescription className="text-slate-400">
                  {conflictTypes[detailConflict.type]?.label || detailConflict.type} · {detailConflict.severity}
                </SheetDescription>
              </SheetHeader>

              {/* Status + severity */}
              <div className="flex items-center gap-2 mb-4">
                <Badge className={severityColors[detailConflict.severity]}>{detailConflict.severity}</Badge>
                <Badge variant="outline" className={
                  detailConflict.status === 'RESOLVED' ? 'text-green-400 border-green-500/30'
                  : detailConflict.status === 'IGNORED' ? 'text-slate-400 border-white/10'
                  : 'text-red-400 border-red-500/30'
                }>{detailConflict.status}</Badge>
              </div>

              {/* Description */}
              <div className="p-3 bg-white/5 rounded-lg border border-white/10 mb-4">
                <p className="text-sm text-white">{detailConflict.description}</p>
                <p className="text-xs text-slate-400 mt-2">Affected: {detailConflict.affectedName}</p>
                <p className="text-xs text-slate-400">Detected: {new Date(detailConflict.createdAt).toLocaleString()}</p>
              </div>

              {/* Slot details */}
              {detailConflict.details && (
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {detailConflict.details.courseA && (
                    <div className="p-3 bg-cyan-500/5 rounded-lg border border-cyan-500/20">
                      <div className="text-xs text-slate-400 mb-1">Slot A</div>
                      <Badge variant="outline" className="text-cyan-400 border-cyan-400/20 font-mono text-xs mb-1">{detailConflict.details.courseA.code}</Badge>
                      <p className="text-xs text-white">{detailConflict.details.courseA.name || ''}</p>
                      {detailConflict.details.courseA.status && (
                        <Badge className="bg-amber-500/20 text-amber-400 text-xs mt-1">{detailConflict.details.courseA.status}</Badge>
                      )}
                    </div>
                  )}
                  {detailConflict.details.courseB && (
                    <div className="p-3 bg-pink-500/5 rounded-lg border border-pink-500/20">
                      <div className="text-xs text-slate-400 mb-1">Slot B</div>
                      <Badge variant="outline" className="text-pink-400 border-pink-400/20 font-mono text-xs mb-1">{detailConflict.details.courseB.code}</Badge>
                      <p className="text-xs text-white">{detailConflict.details.courseB.name || ''}</p>
                      {detailConflict.details.courseB.status && (
                        <Badge className="bg-amber-500/20 text-amber-400 text-xs mt-1">{detailConflict.details.courseB.status}</Badge>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Existing resolution */}
              {detailConflict.resolution && (
                <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20 mb-4">
                  <p className="text-xs text-slate-400 mb-1">Resolution note:</p>
                  <p className="text-sm text-green-400">{detailConflict.resolution}</p>
                </div>
              )}

              {/* Override panel — IA/SA only */}
              {['IA', 'SA'].includes(session?.user?.role || '') && detailConflict.status === 'DETECTED' && (
                <div className="space-y-3 border-t border-white/10 pt-4">
                  <p className="text-sm text-white font-medium flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-400" /> Override Conflict
                  </p>
                  <p className="text-xs text-slate-400">As Institution Admin, you can override this conflict and provide a justification.</p>
                  <Textarea
                    value={overrideNote}
                    onChange={e => setOverrideNote(e.target.value)}
                    placeholder="Enter override justification (e.g. Special arrangement approved by Dean)..."
                    className="bg-white/5 border-white/10 text-white text-sm min-h-[80px]"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleOverride(detailConflict.id, overrideNote)}
                      disabled={overriding}
                      className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border-0"
                    >
                      {overriding ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
                      Apply Override
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleResolve(detailConflict.id)}
                      className="border-green-500/20 text-green-400"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" /> Resolve
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleIgnore(detailConflict.id)}
                      className="border-white/10 text-slate-400"
                    >
                      Ignore
                    </Button>
                  </div>
                </div>
              )}

              {/* Reopen panel */}
              {['IA', 'SA'].includes(session?.user?.role || '') && ['RESOLVED', 'IGNORED'].includes(detailConflict.status) && (
                <div className="border-t border-white/10 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => handleReopen(detailConflict.id)}
                    className="border-amber-500/20 text-amber-400"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" /> Re-open Conflict
                  </Button>
                </div>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
