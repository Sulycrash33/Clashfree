'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageHeader } from '@/components/page-header'
import {
  Clock, MapPin, Users, AlertTriangle, CheckCircle2, Loader2,
  Sparkles, BookOpen, Building2, RefreshCw, Filter, Download,
  Moon, Eye, ChevronDown
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

// ─── Constants ───────────────────────────────────────────────────────────────

const DAYS = [
  { idx: 1, label: 'Monday',    short: 'Mon' },
  { idx: 2, label: 'Tuesday',   short: 'Tue' },
  { idx: 3, label: 'Wednesday', short: 'Wed' },
  { idx: 4, label: 'Thursday',  short: 'Thu' },
  { idx: 5, label: 'Friday',    short: 'Fri' },
  { idx: 6, label: 'Saturday',  short: 'Sat' },
]

const TIME_SLOTS = [
  { start: '08:00', end: '10:00', label: '8 – 10 AM' },
  { start: '10:00', end: '12:00', label: '10 – 12 PM' },
  { start: '12:00', end: '14:00', label: '12 – 2 PM' },
  { start: '14:00', end: '16:00', label: '2 – 4 PM' },
  { start: '16:00', end: '18:00', label: '4 – 6 PM' },
]

// Jumu'ah prayer block: Friday 12:00–14:00
const JUMUAH_DAY = 5
const JUMUAH_START = '12:00'
const JUMUAH_END = '14:00'

const DAY_COLORS = [
  'from-cyan-500/20 to-blue-500/20 border-cyan-500/30',
  'from-purple-500/20 to-pink-500/20 border-purple-500/30',
  'from-green-500/20 to-emerald-500/20 border-green-500/30',
  'from-amber-500/20 to-yellow-500/20 border-amber-500/30',
  'from-rose-500/20 to-red-500/20 border-rose-500/30',
  'from-indigo-500/20 to-violet-500/20 border-indigo-500/30',
]

const LEVEL_COLORS: Record<number, string> = {
  100: 'bg-green-500/20 text-green-400',
  200: 'bg-blue-500/20 text-blue-400',
  300: 'bg-purple-500/20 text-purple-400',
  400: 'bg-amber-500/20 text-amber-400',
  500: 'bg-pink-500/20 text-pink-400',
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface LectureSlot {
  id: string
  dayOfWeek: number
  startTime: string
  endTime: string
  isRecurring: boolean
  notes?: string
  course: {
    id: string; code: string; name: string; level: number
    creditUnits: number; isShared: boolean
    department?: { id: string; code: string; name: string; faculty?: { id: string; code: string; name: string } }
  }
  room: { id: string; code: string; name: string; capacity: number; faculty?: { id: string; code: string } }
}

interface Timetable { id: string; name: string; session: string; semester: number; status: string }
interface Faculty   { id: string; name: string; code: string }
interface Department { id: string; name: string; code: string; facultyId: string }

// ─── Component ───────────────────────────────────────────────────────────────

export default function LectureTimetablePage() {
  const { data: session } = useSession()
  const { toast } = useToast()

  const [timetables,  setTimetables]  = useState<Timetable[]>([])
  const [faculties,   setFaculties]   = useState<Faculty[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [slots,       setSlots]       = useState<LectureSlot[]>([])
  const [stats,       setStats]       = useState({ totalSlots: 0, uniqueCourses: 0, uniqueRooms: 0, uniqueDays: 0 })

  const [selectedTimetable, setSelectedTimetable] = useState('')
  const [selectedFaculty,   setSelectedFaculty]   = useState('all')
  const [selectedDept,      setSelectedDept]      = useState('all')
  const [selectedLevel,     setSelectedLevel]      = useState('all')
  const [showJumuah,        setShowJumuah]         = useState(true)
  const [showSaturday,      setShowSaturday]       = useState(false)
  const [deptViewOpen,      setDeptViewOpen]       = useState(false)
  const [loading,           setLoading]            = useState(true)
  const [slotsLoading,      setSlotsLoading]       = useState(false)

  // ── Fetchers ────────────────────────────────────────────────────────────────

  const fetchTimetables = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/lecture-timetables')
      if (res.ok) {
        const data = await res.json()
        setTimetables(data)
        if (data.length > 0) setSelectedTimetable(data[0].id)
      }
    } catch {}
    finally { setLoading(false) }
  }, [])

  const fetchFaculties = useCallback(async () => {
    try {
      const res = await fetch('/api/faculties')
      if (res.ok) setFaculties(await res.json())
    } catch {}
  }, [])

  const fetchDepartments = useCallback(async () => {
    try {
      const url = selectedFaculty && selectedFaculty !== 'all'
        ? `/api/departments?facultyId=${selectedFaculty}`
        : '/api/departments'
      const res = await fetch(url)
      if (res.ok) setDepartments(await res.json())
    } catch {}
  }, [selectedFaculty])

  const fetchSlots = useCallback(async () => {
    if (!selectedTimetable) return
    setSlotsLoading(true)
    try {
      const params = new URLSearchParams({ timetableId: selectedTimetable })
      if (selectedDept && selectedDept !== 'all') params.set('departmentId', selectedDept)
      else if (selectedFaculty && selectedFaculty !== 'all') params.set('facultyId', selectedFaculty)
      if (selectedLevel && selectedLevel !== 'all') params.set('level', selectedLevel)

      const res = await fetch(`/api/lecture-slots?${params}`)
      if (res.ok) {
        const data = await res.json()
        setSlots(data.slots || [])
        setStats(data.stats || { totalSlots: 0, uniqueCourses: 0, uniqueRooms: 0, uniqueDays: 0 })
      }
    } catch {}
    finally { setSlotsLoading(false) }
  }, [selectedTimetable, selectedDept, selectedFaculty, selectedLevel])

  // ── Effects ──────────────────────────────────────────────────────────────────

  useEffect(() => { fetchTimetables(); fetchFaculties() }, [fetchTimetables, fetchFaculties])
  useEffect(() => { fetchDepartments() }, [fetchDepartments])
  useEffect(() => { fetchSlots() }, [fetchSlots])
  useEffect(() => { setSelectedDept('all') }, [selectedFaculty])

  // ── Derived ──────────────────────────────────────────────────────────────────

  const activeDays = useMemo(() =>
    DAYS.filter(d => showSaturday ? true : d.idx !== 6),
    [showSaturday])

  // Grid: dayOfWeek × startTime → slots[]
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

  // Dept view: group slots by department
  const deptGroups = useMemo(() => {
    const m = new Map<string, { deptName: string; deptCode: string; slots: LectureSlot[] }>()
    slots.forEach(s => {
      const key = s.course.department?.id || 'unknown'
      const name = s.course.department?.name || 'General'
      const code = s.course.department?.code || 'GEN'
      if (!m.has(key)) m.set(key, { deptName: name, deptCode: code, slots: [] })
      m.get(key)!.slots.push(s)
    })
    return Array.from(m.values()).sort((a, b) => a.deptCode.localeCompare(b.deptCode))
  }, [slots])

  const isJumuahBlock = (dayIdx: number, startTime: string) =>
    dayIdx === JUMUAH_DAY && startTime === JUMUAH_START

  const selectedTimetableData = timetables.find(t => t.id === selectedTimetable)

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lecture Timetable"
        description="Weekly lecture schedule — real-time from database"
        onRefresh={fetchSlots}
        loading={loading || slotsLoading}
      />

      {/* ── Control Bar ── */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <CardContent className="pt-5">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Timetable select */}
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Timetable</label>
                <Select value={selectedTimetable} onValueChange={setSelectedTimetable}>
                  <SelectTrigger className="w-60 bg-white/5 border-white/10 text-white text-sm">
                    <SelectValue placeholder="Select timetable" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10">
                    {timetables.map(t => (
                      <SelectItem key={t.id} value={t.id} className="text-white">
                        {t.name}
                      </SelectItem>
                    ))}
                    {timetables.length === 0 && (
                      <SelectItem value="none" className="text-slate-400" disabled>No timetables found</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Faculty filter */}
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Faculty</label>
                <Select value={selectedFaculty} onValueChange={setSelectedFaculty}>
                  <SelectTrigger className="w-48 bg-white/5 border-white/10 text-white text-sm">
                    <SelectValue placeholder="All Faculties" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10">
                    <SelectItem value="all" className="text-white">All Faculties</SelectItem>
                    {faculties.map(f => (
                      <SelectItem key={f.id} value={f.id} className="text-white">{f.code} – {f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Department filter */}
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Department</label>
                <Select value={selectedDept} onValueChange={setSelectedDept}>
                  <SelectTrigger className="w-44 bg-white/5 border-white/10 text-white text-sm">
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10">
                    <SelectItem value="all" className="text-white">All Departments</SelectItem>
                    {departments.map(d => (
                      <SelectItem key={d.id} value={d.id} className="text-white">{d.code}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Level filter */}
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Level</label>
                <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                  <SelectTrigger className="w-28 bg-white/5 border-white/10 text-white text-sm">
                    <SelectValue placeholder="Level" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10">
                    <SelectItem value="all" className="text-white">All</SelectItem>
                    {[100, 200, 300, 400, 500].map(l => (
                      <SelectItem key={l} value={l.toString()} className="text-white">{l}L</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Right toggles */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Dept view toggle */}
              <Button
                variant={deptViewOpen ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDeptViewOpen(!deptViewOpen)}
                className={deptViewOpen ? 'bg-purple-500 text-white border-0' : 'border-white/10 text-slate-300'}
              >
                <Building2 className="w-4 h-4 mr-2" />
                Dept View
              </Button>

              {/* Jumu'ah toggle */}
              <Button
                variant={showJumuah ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowJumuah(!showJumuah)}
                className={showJumuah ? 'bg-emerald-600 text-white border-0' : 'border-white/10 text-slate-300'}
                title="Show/hide Jumu'ah prayer block on Fridays"
              >
                <Moon className="w-4 h-4 mr-2" />
                Jumu'ah
              </Button>

              {/* Saturday toggle */}
              <Button
                variant={showSaturday ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowSaturday(!showSaturday)}
                className={showSaturday ? 'bg-indigo-600 text-white border-0' : 'border-white/10 text-slate-300'}
              >
                Sat
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={fetchSlots}
                disabled={slotsLoading}
                className="border-white/10 text-slate-300"
              >
                {slotsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Slots',    value: stats.totalSlots,    icon: Clock,        color: 'from-purple-500/20 to-pink-500/20',   iconColor: 'text-purple-400' },
          { label: 'Courses',        value: stats.uniqueCourses, icon: BookOpen,     color: 'from-cyan-500/20 to-blue-500/20',     iconColor: 'text-cyan-400' },
          { label: 'Venues Used',    value: stats.uniqueRooms,   icon: MapPin,       color: 'from-amber-500/20 to-yellow-500/20',  iconColor: 'text-amber-400' },
          { label: 'Active Days',    value: stats.uniqueDays,    icon: CheckCircle2, color: 'from-green-500/20 to-emerald-500/20', iconColor: 'text-green-400' },
        ].map(s => (
          <Card key={s.label} className="bg-white/5 border-white/10">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center`}>
                  <s.icon className={`w-5 h-5 ${s.iconColor}`} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{s.value}</div>
                  <div className="text-xs text-slate-400">{s.label}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Empty State ── */}
      {!slotsLoading && slots.length === 0 && (
        <Card className="bg-white/5 border-white/10">
          <CardContent className="py-16 text-center">
            <Clock className="w-16 h-16 mx-auto text-slate-600 mb-4" />
            <p className="text-white font-medium mb-2">No lecture slots found</p>
            <p className="text-sm text-slate-400">
              {timetables.length === 0
                ? 'No lecture timetable exists yet. Create one via Institution Admin.'
                : 'No slots match your current filters, or this timetable has no slots yet.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* ── DEPT VIEW ── */}
      {deptViewOpen && slots.length > 0 && (
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-purple-400" />
              Department View
            </CardTitle>
            <CardDescription>{deptGroups.length} department(s) · {slots.length} total slots</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {deptGroups.map(({ deptName, deptCode, slots: dslots }) => (
                <div key={deptCode} className="border border-white/10 rounded-lg overflow-hidden">
                  <div className="px-4 py-3 bg-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-purple-400 border-purple-500/30 font-mono">{deptCode}</Badge>
                      <span className="text-white font-medium">{deptName}</span>
                    </div>
                    <Badge variant="outline" className="text-slate-400 border-white/10">{dslots.length} slots/week</Badge>
                  </div>
                  <div className="p-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {dslots.map(slot => {
                      const day = DAYS.find(d => d.idx === slot.dayOfWeek)
                      const jumuah = isJumuahBlock(slot.dayOfWeek, slot.startTime)
                      return (
                        <div key={slot.id} className={`p-3 rounded-lg border ${jumuah ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/10 bg-white/5'}`}>
                          <div className="flex items-center justify-between mb-1">
                            <Badge variant="outline" className="text-cyan-400 border-cyan-500/20 text-xs font-mono">{slot.course.code}</Badge>
                            <Badge className={`${LEVEL_COLORS[slot.course.level] || 'bg-white/10 text-slate-300'} text-xs`}>{slot.course.level}L</Badge>
                          </div>
                          <p className="text-xs text-white truncate mb-1">{slot.course.name}</p>
                          <div className="flex items-center justify-between text-xs text-slate-400">
                            <span>{day?.short} {slot.startTime}–{slot.endTime}</span>
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{slot.room.code}</span>
                          </div>
                          {jumuah && showJumuah && (
                            <div className="mt-1 text-xs text-emerald-400 flex items-center gap-1">
                              <Moon className="w-3 h-3" /> Clashes with Jumu'ah
                            </div>
                          )}
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

      {/* ── WEEKLY GRID ── */}
      {slots.length > 0 && (
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-400" />
              Weekly Schedule Canvas
              {selectedTimetableData && (
                <Badge variant="outline" className="text-slate-400 border-white/10 ml-2">
                  {selectedTimetableData.session} · Sem {selectedTimetableData.semester}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {slotsLoading ? 'Loading...' : `${slots.length} slots across ${stats.uniqueDays} day(s)`}
              {showJumuah && <span className="ml-2 text-emerald-400">· 🕌 Jumu'ah blocks shown</span>}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {slotsLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div style={{ minWidth: `${activeDays.length * 160 + 100}px` }}>
                  {/* Header */}
                  <div className={`grid gap-2 mb-2`} style={{ gridTemplateColumns: `100px repeat(${activeDays.length}, 1fr)` }}>
                    <div className="p-3 bg-white/5 rounded-lg">
                      <span className="text-slate-400 text-xs font-medium">Time</span>
                    </div>
                    {activeDays.map((d, i) => (
                      <div key={d.idx} className={`p-3 rounded-lg bg-gradient-to-br ${DAY_COLORS[i % DAY_COLORS.length]} border`}>
                        <span className="text-white text-sm font-medium">{d.label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Time rows */}
                  {TIME_SLOTS.map((ts, tsIdx) => (
                    <div
                      key={ts.start}
                      className="grid gap-2 mb-2"
                      style={{ gridTemplateColumns: `100px repeat(${activeDays.length}, 1fr)` }}
                    >
                      {/* Time label */}
                      <div className="p-3 bg-white/5 rounded-lg flex items-center justify-center">
                        <span className="text-slate-400 text-xs text-center">{ts.label}</span>
                      </div>

                      {/* Day cells */}
                      {activeDays.map((d, dIdx) => {
                        const isJumuah = showJumuah && isJumuahBlock(d.idx, ts.start)
                        const cellSlots = grid[d.idx]?.[ts.start] || []

                        if (isJumuah) {
                          return (
                            <div
                              key={d.idx}
                              className="p-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 min-h-[80px] flex flex-col items-center justify-center"
                            >
                              <Moon className="w-5 h-5 text-emerald-400 mb-1" />
                              <span className="text-emerald-400 text-xs font-medium">Jumu'ah</span>
                              <span className="text-emerald-500/60 text-xs">Prayer Block</span>
                              <span className="text-emerald-500/50 text-xs mt-1">12:00 – 14:00</span>
                            </div>
                          )
                        }

                        return (
                          <div
                            key={d.idx}
                            className={`p-2 rounded-lg bg-gradient-to-br ${DAY_COLORS[dIdx % DAY_COLORS.length]} border min-h-[80px]`}
                          >
                            {cellSlots.length > 0 ? (
                              <div className="space-y-1">
                                {cellSlots.map(slot => (
                                  <div
                                    key={slot.id}
                                    className="p-2 bg-slate-900/60 rounded-md hover:bg-slate-900/80 transition-colors group"
                                  >
                                    <div className="flex items-center justify-between">
                                      <Badge
                                        variant="outline"
                                        className={`text-xs font-mono ${slot.course.isShared ? 'text-pink-400 border-pink-400/20' : 'text-purple-400 border-purple-400/20'}`}
                                      >
                                        {slot.course.code}
                                      </Badge>
                                      <Badge className={`${LEVEL_COLORS[slot.course.level] || 'bg-white/10 text-slate-300'} text-xs`}>
                                        {slot.course.level}L
                                      </Badge>
                                    </div>
                                    <p className="text-xs text-white mt-1 truncate group-hover:whitespace-normal">
                                      {slot.course.name}
                                    </p>
                                    <div className="flex items-center justify-between mt-1">
                                      <span className="text-xs text-slate-500 truncate">
                                        {slot.course.department?.code}
                                      </span>
                                      <div className="flex items-center gap-1">
                                        <MapPin className="w-3 h-3 text-slate-500" />
                                        <span className="text-xs text-slate-400">{slot.room.code}</span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="h-full flex items-center justify-center text-slate-500 text-xs py-4">
                                Free
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

      {/* ── Legend ── */}
      {slots.length > 0 && (
        <Card className="bg-white/5 border-white/10">
          <CardContent className="pt-4">
            <div className="flex flex-wrap items-center gap-6">
              <span className="text-sm text-slate-400">Legend:</span>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-emerald-500/20 border border-emerald-500/30" />
                <span className="text-sm text-slate-300">🕌 Jumu'ah Prayer Block (Fri 12–2 PM)</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-pink-400 border-pink-400/20 text-xs">★</Badge>
                <span className="text-sm text-slate-300">Shared/General Course</span>
              </div>
              {[100, 200, 300, 400].map(l => (
                <div key={l} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${LEVEL_COLORS[l]?.split(' ')[0]}`} />
                  <span className="text-xs text-slate-400">{l}L</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
