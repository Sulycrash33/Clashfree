'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { PageHeader } from '@/components/page-header'
import {
  Clock, MapPin, AlertTriangle, CheckCircle2, Loader2,
  Plus, Trash2, BookOpen, Building2, RefreshCw, Moon, Calendar, ShieldCheck,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const DAYS = [
  { idx: 1, label: 'Monday',    short: 'Mon' },
  { idx: 2, label: 'Tuesday',   short: 'Tue' },
  { idx: 3, label: 'Wednesday', short: 'Wed' },
  { idx: 4, label: 'Thursday',  short: 'Thu' },
  { idx: 5, label: 'Friday',    short: 'Fri' },
  { idx: 6, label: 'Saturday',  short: 'Sat' },
]

const TIME_SLOTS = [
  { start: '08:00', end: '10:00', label: '8-10 AM' },
  { start: '10:00', end: '12:00', label: '10-12 PM' },
  { start: '12:00', end: '14:00', label: '12-2 PM' },
  { start: '14:00', end: '16:00', label: '2-4 PM' },
  { start: '16:00', end: '18:00', label: '4-6 PM' },
]

const DAY_COLORS = [
  'from-secondary/20 to-secondary/20 border-secondary/30',
  'from-primary/20 to-clash/20 border-primary/30',
  'from-success/20 to-success/20 border-success/30',
  'from-accent-gold/20 to-accent-gold/20 border-accent-gold/30',
  'from-clash/20 to-clash/20 border-clash/30',
  'from-primary/20 to-primary/20 border-primary/30',
]

const LEVEL_COLORS: Record<number, string> = {
  100: 'bg-success/20 text-success',
  200: 'bg-secondary/20 text-secondary',
  300: 'bg-primary/20 text-primary',
  400: 'bg-accent-gold/20 text-accent-gold',
  500: 'bg-clash/20 text-clash',
}

const CAN_MANAGE = ['IA', 'TO', 'SA']

interface LectureSlot {
  id: string; dayOfWeek: number; startTime: string; endTime: string
  isRecurring: boolean; notes?: string
  course: { id: string; code: string; name: string; level: number; creditUnits: number; isShared: boolean; department?: { id: string; code: string; name: string } }
  room: { id: string; code: string; name: string; capacity: number }
}
interface Timetable { id: string; name: string; session: string; semester: number; status: string; startDate?: string; endDate?: string; _count?: { slots: number } }
interface Faculty    { id: string; name: string; code: string }
interface Department { id: string; name: string; code: string; facultyId: string }
interface Course     { id: string; code: string; name: string; level: number; isShared: boolean; departmentId: string }
interface Room       { id: string; code: string; name: string; capacity: number }

export default function LectureTimetablePage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const role = (session?.user as any)?.role || 'ST'
  const canManage = CAN_MANAGE.includes(role)

  const [timetables,  setTimetables]  = useState<Timetable[]>([])
  const [faculties,   setFaculties]   = useState<Faculty[]>([])
  const [allDepts,    setAllDepts]    = useState<Department[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [courses,     setCourses]     = useState<Course[]>([])
  const [rooms,       setRooms]       = useState<Room[]>([])
  const [slots,       setSlots]       = useState<LectureSlot[]>([])
  const [stats, setStats] = useState({ totalSlots: 0, uniqueCourses: 0, uniqueRooms: 0, uniqueDays: 0 })

  const [selectedTimetable, setSelectedTimetable] = useState('')
  const [selectedFaculty,   setSelectedFaculty]   = useState('all')
  const [selectedDept,      setSelectedDept]      = useState('all')
  const [selectedLevel,     setSelectedLevel]      = useState('all')
  const [showJumuah,   setShowJumuah]  = useState(true)
  const [showSaturday, setShowSaturday] = useState(false)
  const [deptView,     setDeptView]    = useState(false)

  const [loading,      setLoading]      = useState(true)
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [saving,       setSaving]       = useState(false)
  const [deletingId,   setDeletingId]   = useState<string | null>(null)
  const [createTTOpen, setCreateTTOpen] = useState(false)
  const [addSlotOpen,  setAddSlotOpen]  = useState(false)

  // Clash detection state
  const [clashRunning,  setClashRunning]  = useState(false)
  const [clashResult,   setClashResult]   = useState<null | {
    summary: { clashCount: number; errors: number; warnings: number; clean: boolean; byType: Record<string, number> }
    clashes: Array<{ type: string; severity: string; courseA: string; courseB?: string; day: string; time: string; description: string }>
    message: string
    timetableName: string
  }>(null)
  const [clashOpen, setClashOpen] = useState(false)

  const runClashDetect = useCallback(async () => {
    if (!selectedTimetable) return
    setClashRunning(true)
    setClashResult(null)
    try {
      const res = await fetch('/api/clash-detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timetableId: selectedTimetable, scope: 'full' }),
      })
      if (!res.ok) {
        const err = await res.json()
        toast({ title: 'Clash check failed', description: err.error || 'Unknown error', variant: 'destructive' })
        return
      }
      const data = await res.json()
      setClashResult(data)
      setClashOpen(true)
      if (data.summary.clean) {
        toast({ title: '✅ No clashes found', description: data.message })
      } else {
        toast({ title: `⚠️ ${data.summary.errors} clash(es) detected`, description: data.message, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to run clash check', variant: 'destructive' })
    } finally {
      setClashRunning(false)
    }
  }, [selectedTimetable, toast])

  const [ttForm, setTTForm] = useState({ name: '', session: '', semester: '1', startDate: '', endDate: '' })
  const [slotForm, setSlotForm] = useState({ courseId: '', roomId: '', dayOfWeek: '1', startTime: '08:00', endTime: '10:00', notes: '' })

  const fetchTimetables = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/lecture-timetables')
      if (r.ok) {
        const data = await r.json()
        setTimetables(data)
        if (data.length > 0) setSelectedTimetable((prev) => prev || data[0].id)
      }
    } catch {}
    finally { setLoading(false) }
  }, [])

  const fetchMeta = useCallback(async () => {
    try {
      const [fR, dR, rR] = await Promise.all([fetch('/api/faculties'), fetch('/api/departments'), fetch('/api/rooms')])
      if (fR.ok) setFaculties(await fR.json())
      if (dR.ok) { const d = await dR.json(); setAllDepts(d); setDepartments(d) }
      if (rR.ok) setRooms(await rR.json())
    } catch {}
  }, [])

  const fetchCourses = useCallback(async () => {
    try {
      const r = await fetch('/api/courses')
      if (r.ok) { const data = await r.json(); setCourses(Array.isArray(data) ? data : (data.courses || [])) }
    } catch {}
  }, [])

  const fetchSlots = useCallback(async () => {
    if (!selectedTimetable) return
    setSlotsLoading(true)
    try {
      const p = new URLSearchParams({ timetableId: selectedTimetable })
      if (selectedDept !== 'all') p.set('departmentId', selectedDept)
      else if (selectedFaculty !== 'all') p.set('facultyId', selectedFaculty)
      if (selectedLevel !== 'all') p.set('level', selectedLevel)
      const r = await fetch(`/api/lecture-slots?${p}`)
      if (r.ok) {
        const data = await r.json()
        setSlots(data.slots || [])
        setStats(data.stats || { totalSlots: 0, uniqueCourses: 0, uniqueRooms: 0, uniqueDays: 0 })
      }
    } catch {}
    finally { setSlotsLoading(false) }
  }, [selectedTimetable, selectedDept, selectedFaculty, selectedLevel])

  useEffect(() => { fetchTimetables(); fetchMeta() }, [fetchTimetables, fetchMeta])
  useEffect(() => { fetchSlots() }, [fetchSlots])
  useEffect(() => {
    setDepartments(selectedFaculty !== 'all' ? allDepts.filter(d => d.facultyId === selectedFaculty) : allDepts)
    setSelectedDept('all')
  }, [selectedFaculty, allDepts])

  const handleCreateTimetable = async () => {
    if (!ttForm.name || !ttForm.session || !ttForm.startDate || !ttForm.endDate) {
      toast({ title: 'Fill all required fields', variant: 'destructive' }); return
    }
    setSaving(true)
    try {
      const r = await fetch('/api/lecture-timetables', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...ttForm, semester: parseInt(ttForm.semester) }),
      })
      const data = await r.json()
      if (!r.ok) { toast({ title: data.error || 'Failed to create', variant: 'destructive' }); return }
      toast({ title: `Timetable created` })
      setCreateTTOpen(false)
      setTTForm({ name: '', session: '', semester: '1', startDate: '', endDate: '' })
      await fetchTimetables()
      setSelectedTimetable(data.id)
    } catch { toast({ title: 'Network error', variant: 'destructive' }) }
    finally { setSaving(false) }
  }

  const handleAddSlot = async () => {
    if (!slotForm.courseId || !slotForm.roomId) {
      toast({ title: 'Select course and room', variant: 'destructive' }); return
    }
    setSaving(true)
    try {
      const r = await fetch('/api/lecture-slots', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lectureTimetableId: selectedTimetable,
          courseId: slotForm.courseId, roomId: slotForm.roomId,
          dayOfWeek: parseInt(slotForm.dayOfWeek),
          startTime: slotForm.startTime, endTime: slotForm.endTime,
          notes: slotForm.notes || undefined,
        }),
      })
      const data = await r.json()
      if (!r.ok) { toast({ title: data.error || 'Failed to add slot', variant: 'destructive' }); return }
      toast({ title: `Slot added` })
      setAddSlotOpen(false)
      setSlotForm({ courseId: '', roomId: '', dayOfWeek: '1', startTime: '08:00', endTime: '10:00', notes: '' })
      fetchSlots()
    } catch { toast({ title: 'Network error', variant: 'destructive' }) }
    finally { setSaving(false) }
  }

  const handleDeleteSlot = async (slotId: string) => {
    setDeletingId(slotId)
    try {
      const r = await fetch(`/api/lecture-slots?slotId=${slotId}`, { method: 'DELETE' })
      if (!r.ok) { toast({ title: 'Failed to delete', variant: 'destructive' }); return }
      toast({ title: 'Slot removed' })
      setSlots(prev => prev.filter(s => s.id !== slotId))
      setStats(prev => ({ ...prev, totalSlots: Math.max(0, prev.totalSlots - 1) }))
    } catch { toast({ title: 'Network error', variant: 'destructive' }) }
    finally { setDeletingId(null) }
  }

  const openAddSlot = (dayIdx?: number, startTime?: string) => {
    if (courses.length === 0) fetchCourses()
    setSlotForm(f => ({
      ...f,
      dayOfWeek: dayIdx ? String(dayIdx) : '1',
      startTime: startTime || '08:00',
      endTime: startTime ? (TIME_SLOTS.find(t => t.start === startTime)?.end || '10:00') : '10:00',
    }))
    setAddSlotOpen(true)
  }

  const activeDays = useMemo(() => DAYS.filter(d => showSaturday || d.idx !== 6), [showSaturday])

  const grid = useMemo(() => {
    const g: Record<number, Record<string, LectureSlot[]>> = {}
    activeDays.forEach(d => { g[d.idx] = {} })
    slots.forEach(s => {
      if (!g[s.dayOfWeek]) return
      if (!g[s.dayOfWeek][s.startTime]) g[s.dayOfWeek][s.startTime] = []
      g[s.dayOfWeek][s.startTime].push(s)
    })
    return g
  }, [slots, activeDays])

  const deptGroups = useMemo(() => {
    const m = new Map<string, { deptName: string; deptCode: string; slots: LectureSlot[] }>()
    slots.forEach(s => {
      const key = s.course.department?.id || 'unk'
      if (!m.has(key)) m.set(key, { deptName: s.course.department?.name || 'General', deptCode: s.course.department?.code || 'GEN', slots: [] })
      m.get(key)!.slots.push(s)
    })
    return Array.from(m.values()).sort((a, b) => a.deptCode.localeCompare(b.deptCode))
  }, [slots])

  const isJumuah = (day: number, start: string) => day === 5 && start === '12:00'
  const selectedTTData = timetables.find(t => t.id === selectedTimetable)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lecture Timetable"
        description="Create and manage weekly lecture schedules for your institution"
        onRefresh={fetchSlots}
        loading={loading || slotsLoading}
      />

      {/* Top bar */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-end gap-3 flex-wrap">
          <div className="space-y-1">
            <label className="text-xs text-muted">Lecture Timetable</label>
            <Select value={selectedTimetable} onValueChange={setSelectedTimetable}>
              <SelectTrigger className="w-72 bg-white/5 border-white/10 text-white text-sm">
                <SelectValue placeholder={loading ? 'Loading...' : timetables.length === 0 ? 'No timetables yet' : 'Select timetable'} />
              </SelectTrigger>
              <SelectContent className="bg-muted border-white/10">
                {timetables.map(t => (
                  <SelectItem key={t.id} value={t.id} className="text-white">
                    <span className="font-medium">{t.name}</span>
                    <span className="text-muted ml-2 text-xs">· {t._count?.slots ?? 0} slots</span>
                  </SelectItem>
                ))}
                {timetables.length === 0 && !loading && (
                  <SelectItem value="__none" disabled className="text-muted italic">No timetables yet</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          {selectedTTData && (
            <Badge variant="outline" className={
              selectedTTData.status === 'PUBLISHED' ? 'text-success border-success/30 bg-success/10' :
              selectedTTData.status === 'DRAFT' ? 'text-accent-gold border-accent-gold/30 bg-accent-gold/10' :
              'text-muted border-muted/30'
            }>{selectedTTData.status}</Badge>
          )}
        </div>
        {canManage && (
          <div className="flex items-center gap-2">
            {selectedTimetable && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className={`border-white/10 text-muted hover:text-white ${clashResult && !clashResult.summary.clean ? 'border-clash/40 text-clash hover:text-clash' : clashResult?.summary.clean ? 'border-success/40 text-success' : ''}`}
                  onClick={runClashDetect}
                  disabled={clashRunning}
                >
                  {clashRunning ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : clashResult?.summary.clean ? (
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                  ) : clashResult && !clashResult.summary.clean ? (
                    <AlertTriangle className="w-4 h-4 mr-2" />
                  ) : (
                    <ShieldCheck className="w-4 h-4 mr-2" />
                  )}
                  {clashRunning ? 'Checking...' : clashResult ? `${clashResult.summary.errors} Error(s)` : 'Check Clashes'}
                </Button>
                <Button size="sm" className="bg-secondary hover:bg-secondary text-white" onClick={() => openAddSlot()}>
                  <Plus className="w-4 h-4 mr-2" /> Add Slot
                </Button>
              </>
            )}
            <Button size="sm" variant="outline" className="border-white/10 text-muted hover:text-white" onClick={() => setCreateTTOpen(true)}>
              <Calendar className="w-4 h-4 mr-2" /> New Timetable
            </Button>
          </div>
        )}
      </div>

      {/* Empty state - no timetables */}
      {!loading && timetables.length === 0 && (
        <Card className="bg-white/5 border-white/10 border-dashed">
          <CardContent className="py-20 text-center">
            <Calendar className="w-16 h-16 mx-auto text-muted mb-4" />
            <p className="text-white font-semibold text-lg mb-2">No Lecture Timetable Yet</p>
            <p className="text-sm text-muted mb-6 max-w-sm mx-auto">
              Create a lecture timetable for the current semester, then add weekly recurring slots for each course.
            </p>
            {canManage && (
              <Button className="bg-secondary hover:bg-secondary text-white" onClick={() => setCreateTTOpen(true)}>
                <Plus className="w-4 h-4 mr-2" /> Create Lecture Timetable
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      {timetables.length > 0 && (
        <Card className="bg-white/5 border-white/10">
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1">
                <label className="text-xs text-muted">Faculty</label>
                <Select value={selectedFaculty} onValueChange={setSelectedFaculty}>
                  <SelectTrigger className="w-44 bg-white/5 border-white/10 text-white text-sm">
                    <SelectValue placeholder="All Faculties" />
                  </SelectTrigger>
                  <SelectContent className="bg-muted border-white/10">
                    <SelectItem value="all" className="text-white">All Faculties</SelectItem>
                    {faculties.map(f => <SelectItem key={f.id} value={f.id} className="text-white">{f.code} - {f.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted">Department</label>
                <Select value={selectedDept} onValueChange={setSelectedDept}>
                  <SelectTrigger className="w-40 bg-white/5 border-white/10 text-white text-sm">
                    <SelectValue placeholder="All Depts" />
                  </SelectTrigger>
                  <SelectContent className="bg-muted border-white/10">
                    <SelectItem value="all" className="text-white">All Departments</SelectItem>
                    {departments.map(d => <SelectItem key={d.id} value={d.id} className="text-white">{d.code}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted">Level</label>
                <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                  <SelectTrigger className="w-24 bg-white/5 border-white/10 text-white text-sm">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent className="bg-muted border-white/10">
                    <SelectItem value="all" className="text-white">All</SelectItem>
                    {[100,200,300,400,500].map(l => <SelectItem key={l} value={String(l)} className="text-white">{l}L</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 ml-auto flex-wrap">
                <Button size="sm" variant={deptView ? 'default' : 'outline'} onClick={() => setDeptView(v => !v)}
                  className={deptView ? 'bg-primary text-white border-0' : 'border-white/10 text-muted'}>
                  <Building2 className="w-4 h-4 mr-1" /> Dept View
                </Button>
                <Button size="sm" variant={showJumuah ? 'default' : 'outline'} onClick={() => setShowJumuah(v => !v)}
                  className={showJumuah ? 'bg-success text-white border-0' : 'border-white/10 text-muted'}>
                  <Moon className="w-4 h-4 mr-1" /> Jumuah
                </Button>
                <Button size="sm" variant={showSaturday ? 'default' : 'outline'} onClick={() => setShowSaturday(v => !v)}
                  className={showSaturday ? 'bg-primary text-white border-0' : 'border-white/10 text-muted'}>Sat</Button>
                <Button size="sm" variant="outline" onClick={fetchSlots} disabled={slotsLoading} className="border-white/10 text-muted">
                  {slotsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      {timetables.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Slots',  value: stats.totalSlots,    icon: Clock,        grad: 'from-primary/20 to-clash/20',   ic: 'text-primary' },
            { label: 'Courses',      value: stats.uniqueCourses, icon: BookOpen,     grad: 'from-secondary/20 to-secondary/20',     ic: 'text-secondary'   },
            { label: 'Rooms Used',   value: stats.uniqueRooms,   icon: MapPin,       grad: 'from-accent-gold/20 to-accent-gold/20',  ic: 'text-accent-gold'  },
            { label: 'Active Days',  value: stats.uniqueDays,    icon: CheckCircle2, grad: 'from-success/20 to-success/20', ic: 'text-success'  },
          ].map(s => (
            <Card key={s.label} className="bg-white/5 border-white/10">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${s.grad} flex items-center justify-center`}>
                    <s.icon className={`w-5 h-5 ${s.ic}`} />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{s.value}</div>
                    <div className="text-xs text-muted">{s.label}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty slots */}
      {timetables.length > 0 && !slotsLoading && slots.length === 0 && (
        <Card className="bg-white/5 border-white/10 border-dashed">
          <CardContent className="py-14 text-center">
            <Clock className="w-12 h-12 mx-auto text-muted mb-3" />
            <p className="text-white font-medium mb-1">No lecture slots yet</p>
            <p className="text-sm text-muted mb-5">
              {canManage ? 'Click Add Slot or tap any empty grid cell to schedule a lecture.' : 'No slots match your filters.'}
            </p>
            {canManage && selectedTimetable && (
              <Button size="sm" className="bg-secondary hover:bg-secondary text-white" onClick={() => openAddSlot()}>
                <Plus className="w-4 h-4 mr-2" /> Add First Slot
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dept View */}
      {deptView && slots.length > 0 && (
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" /> Department View
            </CardTitle>
            <CardDescription>{deptGroups.length} dept(s) - {slots.length} total slots</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {deptGroups.map(({ deptName, deptCode, slots: ds }) => (
                <div key={deptCode} className="border border-white/10 rounded-lg overflow-hidden">
                  <div className="px-4 py-3 bg-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-primary border-primary/30 font-mono">{deptCode}</Badge>
                      <span className="text-white font-medium">{deptName}</span>
                    </div>
                    <Badge variant="outline" className="text-muted border-white/10">{ds.length} slots/week</Badge>
                  </div>
                  <div className="p-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {ds.map(slot => {
                      const day = DAYS.find(d => d.idx === slot.dayOfWeek)
                      const jum = isJumuah(slot.dayOfWeek, slot.startTime)
                      return (
                        <div key={slot.id} className={`p-3 rounded-lg border ${jum ? 'border-success/30 bg-success/5' : 'border-white/10 bg-white/5'} group relative`}>
                          <div className="flex items-center justify-between mb-1">
                            <Badge variant="outline" className="text-secondary border-secondary/20 text-xs font-mono">{slot.course.code}</Badge>
                            <div className="flex items-center gap-1">
                              <Badge className={`${LEVEL_COLORS[slot.course.level] || 'bg-white/10 text-muted'} text-xs`}>{slot.course.level}L</Badge>
                              {canManage && (
                                <button onClick={() => handleDeleteSlot(slot.id)} disabled={deletingId === slot.id}
                                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-clash/20 text-clash transition-all ml-1">
                                  {deletingId === slot.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-white truncate mb-1">{slot.course.name}</p>
                          <div className="flex items-center justify-between text-xs text-muted">
                            <span>{day?.short} {slot.startTime}-{slot.endTime}</span>
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{slot.room.code}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Weekly Grid */}
      {slots.length > 0 && (
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" /> Weekly Schedule Grid
              {selectedTTData && (
                <Badge variant="outline" className="text-muted border-white/10 ml-2 text-xs">
                  {selectedTTData.session} - Sem {selectedTTData.semester}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {slotsLoading ? 'Loading...' : `${slots.length} slots - ${stats.uniqueDays} active day(s)`}
              {canManage && <span className="ml-2 text-secondary/70 text-xs"> - Click any free cell to add a slot</span>}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {slotsLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div style={{ minWidth: `${activeDays.length * 160 + 100}px` }}>
                  <div className="grid gap-2 mb-2" style={{ gridTemplateColumns: `100px repeat(${activeDays.length}, 1fr)` }}>
                    <div className="p-3 bg-white/5 rounded-lg flex items-center justify-center">
                      <span className="text-muted text-xs font-medium">Time</span>
                    </div>
                    {activeDays.map((d, i) => (
                      <div key={d.idx} className={`p-3 rounded-lg bg-gradient-to-br ${DAY_COLORS[i % DAY_COLORS.length]} border`}>
                        <span className="text-white text-sm font-medium">{d.label}</span>
                      </div>
                    ))}
                  </div>
                  {TIME_SLOTS.map(ts => (
                    <div key={ts.start} className="grid gap-2 mb-2" style={{ gridTemplateColumns: `100px repeat(${activeDays.length}, 1fr)` }}>
                      <div className="p-3 bg-white/5 rounded-lg flex items-center justify-center">
                        <span className="text-muted text-xs text-center leading-tight">{ts.label}</span>
                      </div>
                      {activeDays.map((d, dIdx) => {
                        const jum = showJumuah && isJumuah(d.idx, ts.start)
                        const cellSlots = grid[d.idx]?.[ts.start] || []
                        if (jum) return (
                          <div key={d.idx} className="p-2 rounded-lg border border-success/30 bg-success/10 min-h-[80px] flex flex-col items-center justify-center gap-1">
                            <Moon className="w-5 h-5 text-success" />
                            <span className="text-success text-xs font-medium">Jumuah</span>
                            <span className="text-success/60 text-xs">Prayer Block</span>
                          </div>
                        )
                        return (
                          <div key={d.idx}
                            onClick={() => { if (canManage && cellSlots.length === 0) openAddSlot(d.idx, ts.start) }}
                            className={[
                              'p-2 rounded-lg border min-h-[80px]',
                              `bg-gradient-to-br ${DAY_COLORS[dIdx % DAY_COLORS.length]}`,
                              canManage && cellSlots.length === 0 ? 'cursor-pointer hover:ring-1 hover:ring-secondary/40 transition-all' : '',
                            ].join(' ')}
                          >
                            {cellSlots.length > 0 ? (
                              <div className="space-y-1">
                                {cellSlots.map(slot => (
                                  <div key={slot.id} className="p-2 bg-muted/60 rounded-md hover:bg-muted/80 transition-colors group/slot">
                                    <div className="flex items-center justify-between">
                                      <Badge variant="outline" className={`text-xs font-mono ${slot.course.isShared ? 'text-clash border-clash/20' : 'text-primary border-primary/20'}`}>
                                        {slot.course.code}
                                      </Badge>
                                      <div className="flex items-center gap-1">
                                        <Badge className={`${LEVEL_COLORS[slot.course.level] || 'bg-white/10 text-muted'} text-xs`}>{slot.course.level}L</Badge>
                                        {canManage && (
                                          <button onClick={e => { e.stopPropagation(); handleDeleteSlot(slot.id) }} disabled={deletingId === slot.id}
                                            className="opacity-0 group-hover/slot:opacity-100 p-0.5 rounded hover:bg-clash/20 text-clash transition-all">
                                            {deletingId === slot.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                    <p className="text-xs text-white mt-1 truncate">{slot.course.name}</p>
                                    <div className="flex items-center justify-between mt-1">
                                      <span className="text-xs text-muted">{slot.course.department?.code}</span>
                                      <span className="text-xs text-muted flex items-center gap-1"><MapPin className="w-3 h-3" />{slot.room.code}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="h-full flex items-center justify-center text-xs py-4">
                                {canManage
                                  ? <span className="flex items-center gap-1 text-muted opacity-50 hover:opacity-90 transition-opacity"><Plus className="w-3 h-3" /> Add</span>
                                  : <span className="text-muted">Free</span>}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      {slots.length > 0 && (
        <div className="flex flex-wrap items-center gap-5 px-1 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-success/20 border border-success/30" />
            <span className="text-muted">Jumuah Prayer Block (Fri 12-2 PM)</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-clash border-clash/20 text-xs">GST</Badge>
            <span className="text-muted">Shared/General Course</span>
          </div>
          {[100,200,300,400].map(l => (
            <div key={l} className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded-full ${LEVEL_COLORS[l]?.split(' ')[0]}`} />
              <span className="text-muted text-xs">{l}L</span>
            </div>
          ))}
        </div>
      )}

      {/* DIALOG: Create Timetable */}
      <Dialog open={createTTOpen} onOpenChange={setCreateTTOpen}>
        <DialogContent className="bg-muted border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-secondary" /> New Lecture Timetable
            </DialogTitle>
            <DialogDescription className="text-muted">
              One timetable per session/semester. Add slots after creating.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label className="text-muted">Name <span className="text-clash">*</span></Label>
              <Input placeholder="e.g. 2025/2026 First Semester"
                className="bg-white/5 border-white/10 text-white placeholder:text-muted"
                value={ttForm.name} onChange={e => setTTForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-muted">Academic Session <span className="text-clash">*</span></Label>
                <Input placeholder="2025/2026"
                  className="bg-white/5 border-white/10 text-white placeholder:text-muted"
                  value={ttForm.session} onChange={e => setTTForm(f => ({ ...f, session: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-muted">Semester <span className="text-clash">*</span></Label>
                <Select value={ttForm.semester} onValueChange={v => setTTForm(f => ({ ...f, semester: v }))}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-muted border-white/10">
                    <SelectItem value="1" className="text-white">First (1st)</SelectItem>
                    <SelectItem value="2" className="text-white">Second (2nd)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-muted">Start Date <span className="text-clash">*</span></Label>
                <Input type="date" className="bg-white/5 border-white/10 text-white"
                  value={ttForm.startDate} onChange={e => setTTForm(f => ({ ...f, startDate: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-muted">End Date <span className="text-clash">*</span></Label>
                <Input type="date" className="bg-white/5 border-white/10 text-white"
                  value={ttForm.endDate} onChange={e => setTTForm(f => ({ ...f, endDate: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1 border-white/10 text-muted"
                onClick={() => setCreateTTOpen(false)} disabled={saving}>Cancel</Button>
              <Button className="flex-1 bg-secondary hover:bg-secondary text-white"
                onClick={handleCreateTimetable} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />} Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG: Add Slot */}
      <Dialog open={addSlotOpen} onOpenChange={setAddSlotOpen}>
        <DialogContent className="bg-muted border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-secondary" /> Add Lecture Slot
            </DialogTitle>
            <DialogDescription className="text-muted">Schedule a weekly recurring lecture for a course.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-muted">Day <span className="text-clash">*</span></Label>
                <Select value={slotForm.dayOfWeek} onValueChange={v => setSlotForm(f => ({ ...f, dayOfWeek: v }))}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-muted border-white/10">
                    {DAYS.map(d => <SelectItem key={d.idx} value={String(d.idx)} className="text-white">{d.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-muted">Start <span className="text-clash">*</span></Label>
                <Select value={slotForm.startTime} onValueChange={v => setSlotForm(f => ({ ...f, startTime: v, endTime: TIME_SLOTS.find(t => t.start === v)?.end || f.endTime }))}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-muted border-white/10">
                    {TIME_SLOTS.map(t => <SelectItem key={t.start} value={t.start} className="text-white">{t.start}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-muted">End <span className="text-clash">*</span></Label>
                <Select value={slotForm.endTime} onValueChange={v => setSlotForm(f => ({ ...f, endTime: v }))}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-muted border-white/10">
                    {TIME_SLOTS.map(t => <SelectItem key={t.end} value={t.end} className="text-white">{t.end}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {parseInt(slotForm.dayOfWeek) === 5 && slotForm.startTime >= '12:00' && slotForm.startTime < '14:00' && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-accent-gold/10 border border-accent-gold/30">
                <AlertTriangle className="w-4 h-4 text-accent-gold mt-0.5 shrink-0" />
                <span className="text-sm text-accent-gold">Overlaps Jumuah prayer time (Fri 12:00-14:00). Consider rescheduling.</span>
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-muted">Course <span className="text-clash">*</span></Label>
              <Select value={slotForm.courseId} onValueChange={v => setSlotForm(f => ({ ...f, courseId: v }))}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white text-sm">
                  <SelectValue placeholder="Select course..." />
                </SelectTrigger>
                <SelectContent className="bg-muted border-white/10 max-h-52 overflow-y-auto">
                  {courses.length === 0 && <SelectItem value="__loading" disabled className="text-muted italic">Loading courses...</SelectItem>}
                  {courses.map(c => (
                    <SelectItem key={c.id} value={c.id} className="text-white">
                      <span className="font-mono text-secondary text-xs mr-2">{c.code}</span>
                      <span>{c.name}</span>
                      <span className="text-muted text-xs ml-1">({c.level}L)</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted">Room / Venue <span className="text-clash">*</span></Label>
              <Select value={slotForm.roomId} onValueChange={v => setSlotForm(f => ({ ...f, roomId: v }))}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white text-sm">
                  <SelectValue placeholder="Select room..." />
                </SelectTrigger>
                <SelectContent className="bg-muted border-white/10 max-h-52 overflow-y-auto">
                  {rooms.length === 0 && <SelectItem value="__loading" disabled className="text-muted italic">Loading rooms...</SelectItem>}
                  {rooms.map(r => (
                    <SelectItem key={r.id} value={r.id} className="text-white">
                      <span className="font-mono text-accent-gold text-xs mr-2">{r.code}</span>
                      <span>{r.name}</span>
                      <span className="text-muted text-xs ml-1">(cap {r.capacity})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted">Notes <span className="text-muted font-normal">(optional)</span></Label>
              <Textarea placeholder="e.g. Lab session, Group A only, Combined class..."
                className="bg-white/5 border-white/10 text-white resize-none text-sm placeholder:text-muted"
                rows={2} value={slotForm.notes} onChange={e => setSlotForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
            <div className="flex gap-3 pt-1">
              <Button variant="outline" className="flex-1 border-white/10 text-muted"
                onClick={() => setAddSlotOpen(false)} disabled={saving}>Cancel</Button>
              <Button className="flex-1 bg-secondary hover:bg-secondary text-white" onClick={handleAddSlot} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />} Add Slot
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Clash Detection Results Dialog */}
      <Dialog open={clashOpen} onOpenChange={setClashOpen}>
        <DialogContent className="bg-muted border-white/10 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {clashResult?.summary.clean
                ? <CheckCircle2 className="w-5 h-5 text-success" />
                : <AlertTriangle className="w-5 h-5 text-clash" />}
              Clash Detection — {clashResult?.timetableName}
            </DialogTitle>
            <DialogDescription className="text-muted">{clashResult?.message}</DialogDescription>
          </DialogHeader>

          {clashResult && (
            <div className="space-y-4">
              {/* Summary badges */}
              <div className="flex flex-wrap gap-2">
                {Object.entries(clashResult.summary.byType).map(([type, count]) => count > 0 && (
                  <Badge key={type} variant="outline" className={`text-xs ${
                    type === 'JUMUAH' || type === 'SHARED' ? 'border-accent-gold/30 text-accent-gold' : 'border-clash/30 text-clash'
                  }`}>
                    {type}: {count}
                  </Badge>
                ))}
                {clashResult.summary.clean && (
                  <Badge variant="outline" className="border-success/30 text-success text-xs">✅ All Clear</Badge>
                )}
              </div>

              {/* Clash list */}
              {clashResult.clashes.length > 0 ? (
                <div className="space-y-2">
                  {clashResult.clashes.map((clash, i) => (
                    <div key={i} className={`rounded-lg p-3 border text-sm ${
                      clash.severity === 'ERROR'
                        ? 'bg-clash/10 border-clash/20'
                        : 'bg-accent-gold/10 border-accent-gold/20'
                    }`}>
                      <div className="flex items-start gap-2">
                        <span className={`font-semibold text-xs mt-0.5 ${clash.severity === 'ERROR' ? 'text-clash' : 'text-accent-gold'}`}>
                          [{clash.type}]
                        </span>
                        <span className="text-muted">{clash.description}</span>
                      </div>
                      <div className="text-muted text-xs mt-1 ml-10">{clash.day} · {clash.time}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted">
                  <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-3" />
                  <p className="font-medium text-white">Timetable is clean</p>
                  <p className="text-sm">No room, lecturer, student or Jumu'ah clashes detected.</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
