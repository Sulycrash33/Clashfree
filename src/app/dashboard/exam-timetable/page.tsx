'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { PageHeader } from '@/components/page-header'
import {
  Calendar, Clock, MapPin, Users, AlertTriangle, CheckCircle2,
  Loader2, Sparkles, RefreshCw, XCircle, Filter, ChevronRight,
  ChevronLeft, Settings, Play, Eye, Plus, Building2, BookOpen,
  Layers
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Progress } from '@/components/ui/progress'
import { ExportButtons } from '@/components/export-buttons'
import { VersionHistory } from '@/components/version-history'
import { ConflictBadge } from '@/components/notification-badge'
import type { TimetableExportData } from '@/lib/export-utils'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Faculty { id: string; name: string; code: string }
interface Department { id: string; name: string; code: string; facultyId: string }
interface Room { id: string; code: string; name: string; capacity: number; type: string; faculty?: { id: string; name: string; code: string } }

interface ExamSlot {
  id: string; date: string; dayOfWeek: number; slotNumber: number
  startTime: string; endTime: string; status: string
  course: {
    id: string; code: string; name: string; level: number; isShared: boolean
    department?: { code: string; name: string }
    _count?: { studentCourses: number }
  }
  room: { id: string; code: string; name: string; capacity: number }
}

interface ExamPeriod {
  id: string; name: string; session: string; semester: number
  startDate: string; endDate: string; status: string
  slotsPerDay: number; includeSaturday: boolean; excludeFridays: boolean
  morningStart?: string; morningEnd?: string
  afternoonStart?: string; afternoonEnd?: string
  eveningStart?: string; eveningEnd?: string
}

interface Conflict {
  id: string; type: string; severity: string; status: string
  description: string; affectedName: string
}

// Wizard step config
type WizardStep = 'setup' | 'configure' | 'generate' | 'review'
const STEPS: { id: WizardStep; label: string; icon: React.ElementType }[] = [
  { id: 'setup',     label: 'Setup Period',  icon: Calendar },
  { id: 'configure', label: 'Configure',     icon: Settings },
  { id: 'generate',  label: 'Generate',      icon: Sparkles },
  { id: 'review',    label: 'Review',        icon: Eye },
]

const slotColors = [
  'from-cyan-500/20 to-blue-500/20 border-cyan-500/30',
  'from-purple-500/20 to-pink-500/20 border-purple-500/30',
  'from-amber-500/20 to-yellow-500/20 border-amber-500/30',
]
const levelColors: Record<number, string> = {
  100: 'bg-green-500/20 text-green-400 border-green-500/30',
  200: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  300: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  400: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  500: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ExamTimetablePage() {
  const { data: session } = useSession()
  const { toast } = useToast()

  // Wizard state
  const [step, setStep] = useState<WizardStep>('setup')

  // Data
  const [examPeriods, setExamPeriods] = useState<ExamPeriod[]>([])
  const [faculties, setFaculties] = useState<Faculty[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [examSlots, setExamSlots] = useState<ExamSlot[]>([])
  const [conflicts, setConflicts] = useState<Conflict[]>([])
  const [stats, setStats] = useState({ totalExams: 0, uniqueCourses: 0, roomsUsed: 0, totalStudents: 0 })

  // Selection
  const [selectedPeriod, setSelectedPeriod] = useState<string>('')
  const [selectedPeriodData, setSelectedPeriodData] = useState<ExamPeriod | null>(null)
  const [selectedFaculty, setSelectedFaculty] = useState<string>('all')

  // New period form
  const [showNewPeriod, setShowNewPeriod] = useState(false)
  const [newPeriod, setNewPeriod] = useState({
    name: '', session: '2025/2026', semester: 1,
    startDate: '', endDate: '',
    morningStart: '08:00', morningEnd: '11:00',
    afternoonStart: '12:00', afternoonEnd: '15:00',
    eveningStart: '16:00', eveningEnd: '19:00',
    includeSaturday: true, excludeFridays: false,
    slotsPerDay: 3,
  })
  const [creatingPeriod, setCreatingPeriod] = useState(false)

  // Generation
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressMessage, setProgressMessage] = useState('')
  const [currentVersion, setCurrentVersion] = useState(0)

  // Filters (review step)
  const [filterLevel, setFilterLevel] = useState<string>('all')
  const [filterDept, setFilterDept] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')

  // Loading
  const [loading, setLoading] = useState(true)

  // ── Fetchers ────────────────────────────────────────────────────────────────

  const fetchExamPeriods = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/exam-periods')
      if (res.ok) {
        const data = await res.json()
        setExamPeriods(data)
        if (data.length > 0) {
          setSelectedPeriod(data[0].id)
          setSelectedPeriodData(data[0])
        }
      }
    } catch { toast({ title: 'Error', description: 'Failed to fetch exam periods', variant: 'destructive' }) }
    finally { setLoading(false) }
  }, [toast])

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

  const fetchRooms = useCallback(async () => {
    try {
      const url = selectedFaculty && selectedFaculty !== 'all'
        ? `/api/rooms?facultyId=${selectedFaculty}`
        : '/api/rooms'
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setRooms(data)
      }
    } catch {}
  }, [selectedFaculty])

  const fetchExamSlots = useCallback(async () => {
    if (!selectedPeriod) return
    try {
      const res = await fetch(`/api/exam-slots?examPeriodId=${selectedPeriod}`)
      if (res.ok) {
        const data = await res.json()
        setExamSlots(data.slots || [])
        setStats(data.stats || { totalExams: 0, uniqueCourses: 0, roomsUsed: 0, totalStudents: 0 })
      }
    } catch {}
  }, [selectedPeriod])

  const fetchConflicts = useCallback(async () => {
    if (!selectedPeriod) return
    try {
      const res = await fetch(`/api/conflicts?examPeriodId=${selectedPeriod}`)
      if (res.ok) {
        const data = await res.json()
        setConflicts(data.conflicts || [])
      }
    } catch {}
  }, [selectedPeriod])

  // ── Effects ─────────────────────────────────────────────────────────────────

  useEffect(() => { fetchExamPeriods(); fetchFaculties() }, [fetchExamPeriods, fetchFaculties])
  useEffect(() => { fetchDepartments(); fetchRooms() }, [fetchDepartments, fetchRooms])
  useEffect(() => { fetchExamSlots(); fetchConflicts() }, [fetchExamSlots, fetchConflicts])
  useEffect(() => {
    if (selectedPeriod) {
      const p = examPeriods.find(p => p.id === selectedPeriod)
      setSelectedPeriodData(p || null)
    }
  }, [selectedPeriod, examPeriods])

  // Auto-advance to review if slots exist
  useEffect(() => {
    if (examSlots.length > 0 && step === 'generate') setStep('review')
  }, [examSlots.length])

  // ── Actions ─────────────────────────────────────────────────────────────────

  const handleCreatePeriod = async () => {
    if (!newPeriod.name || !newPeriod.startDate || !newPeriod.endDate) {
      toast({ title: 'Missing fields', description: 'Name, start date and end date are required', variant: 'destructive' })
      return
    }
    setCreatingPeriod(true)
    try {
      const res = await fetch('/api/exam-periods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPeriod),
      })
      if (res.ok) {
        const created = await res.json()
        toast({ title: 'Exam period created!' })
        setShowNewPeriod(false)
        await fetchExamPeriods()
        setSelectedPeriod(created.id)
        setSelectedPeriodData(created)
      } else {
        const err = await res.json()
        toast({ title: 'Error', description: err.error || 'Failed to create period', variant: 'destructive' })
      }
    } catch { toast({ title: 'Error', description: 'Network error', variant: 'destructive' }) }
    finally { setCreatingPeriod(false) }
  }

  const handleGenerate = async () => {
    if (!selectedPeriod) return
    setGenerating(true); setProgress(0); setProgressMessage('Initializing...')

    const steps = [
      { progress: 10, message: 'Loading courses and students...' },
      { progress: 25, message: 'Checking constraints...' },
      { progress: 40, message: 'Predicting CO/spillover clashes...' },
      { progress: 55, message: 'Generating timetable slots...' },
      { progress: 70, message: 'Assigning venues per faculty...' },
      { progress: 85, message: 'Checking for conflicts...' },
      { progress: 95, message: 'Finalising...' },
    ]
    let i = 0
    const interval = setInterval(() => {
      if (i < steps.length) { setProgress(steps[i].progress); setProgressMessage(steps[i].message); i++ }
    }, 600)

    try {
      const res = await fetch('/api/exam-periods/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examPeriodId: selectedPeriod }),
      })
      clearInterval(interval)
      if (res.ok) {
        const result = await res.json()
        setProgress(100); setProgressMessage('Complete!')
        if (result.success) {
          toast({ title: '✅ Timetable Generated!', description: `${result.generation?.assignments?.length || 0} exam slots created` })
          fetchExamSlots(); fetchConflicts()
          setCurrentVersion(v => v + 1)
          setTimeout(() => setStep('review'), 800)
        } else {
          toast({ title: 'Generated with issues', description: result.message || 'Some conflicts detected', variant: 'destructive' })
          fetchExamSlots(); fetchConflicts()
        }
      } else {
        const err = await res.json()
        toast({ title: 'Generation Failed', description: err.error || 'Failed to generate', variant: 'destructive' })
      }
    } catch { clearInterval(interval); toast({ title: 'Error', description: 'Generation error', variant: 'destructive' }) }
    finally { setTimeout(() => { setGenerating(false); setProgress(0); setProgressMessage('') }, 1200) }
  }

  const handleClearTimetable = async () => {
    if (!selectedPeriod || !confirm('Clear all exam slots for this period?')) return
    try {
      const res = await fetch(`/api/exam-slots?examPeriodId=${selectedPeriod}`, { method: 'DELETE' })
      if (res.ok) {
        setExamSlots([]); setStats({ totalExams: 0, uniqueCourses: 0, roomsUsed: 0, totalStudents: 0 })
        toast({ title: 'Timetable cleared' })
        setStep('generate')
      }
    } catch { toast({ title: 'Error', description: 'Failed to clear', variant: 'destructive' }) }
  }

  // ── Derived ──────────────────────────────────────────────────────────────────

  const filteredSlots = useMemo(() => examSlots.filter(s => {
    if (filterLevel !== 'all' && s.course.level !== parseInt(filterLevel)) return false
    if (filterDept !== 'all' && s.course.department?.code !== filterDept) return false
    return true
  }), [examSlots, filterLevel, filterDept])

  const slotDepts = useMemo(() => {
    const m = new Map<string, string>()
    examSlots.forEach(s => { if (s.course.department) m.set(s.course.department.code, s.course.department.name) })
    return Array.from(m.entries())
  }, [examSlots])

  const groupedSlots = useMemo(() => filteredSlots.reduce((acc, slot) => {
    const dk = new Date(slot.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    if (!acc[dk]) acc[dk] = {}
    if (!acc[dk][slot.slotNumber]) acc[dk][slot.slotNumber] = []
    acc[dk][slot.slotNumber].push(slot)
    return acc
  }, {} as Record<string, Record<number, ExamSlot[]>>), [filteredSlots])

  const sortedDates = useMemo(() =>
    Object.keys(groupedSlots).sort((a, b) => new Date(a).getTime() - new Date(b).getTime()),
    [groupedSlots])

  const getSlotTime = (n: number) => {
    if (!selectedPeriodData) return ['Morning', 'Afternoon', 'Evening'][n - 1]
    const p = selectedPeriodData
    return n === 1 ? `Morning (${p.morningStart || '08:00'} – ${p.morningEnd || '11:00'})`
      : n === 2 ? `Afternoon (${p.afternoonStart || '12:00'} – ${p.afternoonEnd || '15:00'})`
      : `Evening (${p.eveningStart || '16:00'} – ${p.eveningEnd || '19:00'})`
  }

  const exportData: TimetableExportData = useMemo(() => ({
    institution: 'FEDKO',
    examPeriod: selectedPeriodData?.name || 'Exam Timetable',
    session: selectedPeriodData?.session || '2025/2026',
    semester: selectedPeriodData?.semester || 1,
    generatedAt: new Date().toLocaleString(),
    slots: examSlots.map(s => ({
      date: new Date(s.date).toLocaleDateString(),
      dayOfWeek: s.dayOfWeek, slotNumber: s.slotNumber,
      startTime: s.startTime, endTime: s.endTime,
      courseCode: s.course.code, courseName: s.course.name,
      level: s.course.level, department: s.course.department?.name || 'General',
      room: s.room.name, roomCapacity: s.room.capacity,
      studentCount: s.course._count?.studentCourses || 0,
      isShared: s.course.isShared,
    })),
  }), [examSlots, selectedPeriodData])

  const criticalConflicts = conflicts.filter(c => c.severity === 'CRITICAL').length
  const warningConflicts = conflicts.filter(c => c.severity === 'WARNING').length
  const stepIndex = STEPS.findIndex(s => s.id === step)

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <PageHeader
        title="Exam Timetable"
        description="Step-by-step exam scheduling with CO clash detection"
        onRefresh={() => { fetchExamPeriods(); fetchExamSlots(); fetchConflicts() }}
        loading={loading}
      />

      {/* ── Wizard Progress Bar ── */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center justify-between">
            {STEPS.map((s, idx) => {
              const Icon = s.icon
              const isActive = s.id === step
              const isDone = idx < stepIndex
              return (
                <div key={s.id} className="flex items-center flex-1">
                  <button
                    onClick={() => {
                      if (isDone || isActive) setStep(s.id)
                      // allow jumping to review if slots exist
                      if (s.id === 'review' && examSlots.length > 0) setStep('review')
                    }}
                    className={`flex flex-col items-center gap-1 group cursor-pointer transition-all ${
                      isActive ? 'opacity-100' : isDone ? 'opacity-80' : 'opacity-40'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                      isActive ? 'bg-cyan-500 border-cyan-400 shadow-lg shadow-cyan-500/30'
                      : isDone ? 'bg-green-500/20 border-green-500'
                      : 'bg-white/5 border-white/10'
                    }`}>
                      {isDone
                        ? <CheckCircle2 className="w-5 h-5 text-green-400" />
                        : <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      }
                    </div>
                    <span className={`text-xs font-medium hidden sm:block ${isActive ? 'text-cyan-400' : isDone ? 'text-green-400' : 'text-slate-500'}`}>
                      {s.label}
                    </span>
                  </button>
                  {idx < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 transition-all ${idx < stepIndex ? 'bg-green-500/40' : 'bg-white/10'}`} />
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* ══════════════════════════════════════════════════════════════
          STEP 1 — SETUP PERIOD
      ══════════════════════════════════════════════════════════════ */}
      {step === 'setup' && (
        <div className="space-y-4">
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-cyan-400" />
                Select or Create Exam Period
              </CardTitle>
              <CardDescription>Choose an existing exam period or create a new one</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Existing periods */}
              {examPeriods.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-slate-300">Existing Exam Periods</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {examPeriods.map(p => (
                      <button
                        key={p.id}
                        onClick={() => { setSelectedPeriod(p.id); setSelectedPeriodData(p) }}
                        className={`p-4 rounded-lg border text-left transition-all ${
                          selectedPeriod === p.id
                            ? 'border-cyan-500 bg-cyan-500/10'
                            : 'border-white/10 bg-white/5 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-white font-medium">{p.name}</span>
                          <Badge variant="outline" className={
                            p.status === 'PUBLISHED' ? 'text-green-400 border-green-500/30'
                            : p.status === 'GENERATED' ? 'text-cyan-400 border-cyan-500/30'
                            : 'text-amber-400 border-amber-500/30'
                          }>{p.status}</Badge>
                        </div>
                        <div className="text-sm text-slate-400">
                          {p.session} · Sem {p.semester} · {new Date(p.startDate).toLocaleDateString()} – {new Date(p.endDate).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-slate-500 mt-1 flex gap-3">
                          <span>{p.excludeFridays ? '🕌 Jumu\'ah excluded' : 'Fridays included'}</span>
                          <span>{p.includeSaturday ? 'Sat included' : 'No Saturday'}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* New period toggle */}
              <div>
                <Button
                  variant="outline"
                  onClick={() => setShowNewPeriod(!showNewPeriod)}
                  className="border-white/10 text-slate-300 hover:text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {showNewPeriod ? 'Cancel' : 'Create New Exam Period'}
                </Button>
              </div>

              {showNewPeriod && (
                <Card className="bg-white/5 border-white/10">
                  <CardContent className="pt-5 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-slate-300">Period Name *</Label>
                        <Input
                          value={newPeriod.name}
                          onChange={e => setNewPeriod(p => ({ ...p, name: e.target.value }))}
                          placeholder="e.g. First Semester Exams 2025/2026"
                          className="bg-white/5 border-white/10 text-white mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-slate-300">Academic Session</Label>
                        <Input
                          value={newPeriod.session}
                          onChange={e => setNewPeriod(p => ({ ...p, session: e.target.value }))}
                          placeholder="2025/2026"
                          className="bg-white/5 border-white/10 text-white mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-slate-300">Start Date *</Label>
                        <Input
                          type="date"
                          value={newPeriod.startDate}
                          onChange={e => setNewPeriod(p => ({ ...p, startDate: e.target.value }))}
                          className="bg-white/5 border-white/10 text-white mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-slate-300">End Date *</Label>
                        <Input
                          type="date"
                          value={newPeriod.endDate}
                          onChange={e => setNewPeriod(p => ({ ...p, endDate: e.target.value }))}
                          className="bg-white/5 border-white/10 text-white mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-slate-300">Semester</Label>
                        <Select
                          value={newPeriod.semester.toString()}
                          onValueChange={v => setNewPeriod(p => ({ ...p, semester: parseInt(v) }))}
                        >
                          <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-white/10">
                            <SelectItem value="1" className="text-white">1st Semester</SelectItem>
                            <SelectItem value="2" className="text-white">2nd Semester</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Slot times */}
                    <div className="border-t border-white/10 pt-4">
                      <Label className="text-slate-300 mb-3 block">Slot Times</Label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {[
                          { label: 'Morning', startKey: 'morningStart', endKey: 'morningEnd' },
                          { label: 'Afternoon', startKey: 'afternoonStart', endKey: 'afternoonEnd' },
                          { label: 'Evening', startKey: 'eveningStart', endKey: 'eveningEnd' },
                        ].map(slot => (
                          <div key={slot.label} className="p-3 bg-white/5 rounded-lg border border-white/10">
                            <div className="text-xs text-slate-400 mb-2">{slot.label}</div>
                            <div className="flex items-center gap-2">
                              <Input
                                type="time"
                                value={(newPeriod as any)[slot.startKey]}
                                onChange={e => setNewPeriod(p => ({ ...p, [slot.startKey]: e.target.value }))}
                                className="bg-white/5 border-white/10 text-white text-xs p-1 h-8"
                              />
                              <span className="text-slate-500 text-xs">to</span>
                              <Input
                                type="time"
                                value={(newPeriod as any)[slot.endKey]}
                                onChange={e => setNewPeriod(p => ({ ...p, [slot.endKey]: e.target.value }))}
                                className="bg-white/5 border-white/10 text-white text-xs p-1 h-8"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Toggles */}
                    <div className="flex flex-wrap gap-6 pt-2">
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={newPeriod.excludeFridays}
                          onCheckedChange={v => setNewPeriod(p => ({ ...p, excludeFridays: v }))}
                        />
                        <div>
                          <div className="text-sm text-white">Exclude Fridays (Jumu'ah)</div>
                          <div className="text-xs text-slate-500">No exams on Fridays — Islamic prayer consideration</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={newPeriod.includeSaturday}
                          onCheckedChange={v => setNewPeriod(p => ({ ...p, includeSaturday: v }))}
                        />
                        <div>
                          <div className="text-sm text-white">Include Saturdays</div>
                          <div className="text-xs text-slate-500">Schedule exams on Saturdays</div>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={handleCreatePeriod}
                      disabled={creatingPeriod}
                      className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-0"
                    >
                      {creatingPeriod ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                      Create Exam Period
                    </Button>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>

          {/* Next */}
          <div className="flex justify-end">
            <Button
              onClick={() => setStep('configure')}
              disabled={!selectedPeriod}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-0"
            >
              Next: Configure
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          STEP 2 — CONFIGURE
      ══════════════════════════════════════════════════════════════ */}
      {step === 'configure' && selectedPeriodData && (
        <div className="space-y-4">
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-cyan-400" />
                Configure — {selectedPeriodData.name}
              </CardTitle>
              <CardDescription>Review period settings and select faculty scope for venue assignment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Period summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Session', value: selectedPeriodData.session },
                  { label: 'Semester', value: `Semester ${selectedPeriodData.semester}` },
                  { label: 'Start', value: new Date(selectedPeriodData.startDate).toLocaleDateString() },
                  { label: 'End', value: new Date(selectedPeriodData.endDate).toLocaleDateString() },
                ].map(item => (
                  <div key={item.label} className="p-3 bg-white/5 rounded-lg border border-white/10">
                    <div className="text-xs text-slate-400">{item.label}</div>
                    <div className="text-white font-medium mt-1">{item.value}</div>
                  </div>
                ))}
              </div>

              {/* Slot times display */}
              <div>
                <Label className="text-slate-300 mb-3 block">Scheduled Slot Times</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[1, 2, 3].map(n => (
                    <div key={n} className={`p-3 rounded-lg bg-gradient-to-br ${slotColors[n - 1]} border`}>
                      <div className="text-xs text-white/60 mb-1">Slot {n}</div>
                      <div className="text-white font-medium text-sm">{getSlotTime(n)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Jumu'ah / Saturday flags */}
              <div className="flex flex-wrap gap-3">
                <Badge variant="outline" className={selectedPeriodData.excludeFridays ? 'text-green-400 border-green-500/30' : 'text-slate-400 border-white/10'}>
                  🕌 Jumu'ah: {selectedPeriodData.excludeFridays ? 'Fridays Excluded ✓' : 'Fridays Included'}
                </Badge>
                <Badge variant="outline" className={selectedPeriodData.includeSaturday ? 'text-cyan-400 border-cyan-500/30' : 'text-slate-400 border-white/10'}>
                  📅 Saturday: {selectedPeriodData.includeSaturday ? 'Included' : 'Excluded'}
                </Badge>
              </div>

              {/* Faculty/venue scope */}
              <div className="border-t border-white/10 pt-4">
                <Label className="text-slate-300 mb-2 block">Faculty Scope for Venue Assignment</Label>
                <p className="text-xs text-slate-500 mb-3">Select a faculty to assign only rooms within that faculty. Leave as "All" to use all institution rooms.</p>
                <Select value={selectedFaculty} onValueChange={setSelectedFaculty}>
                  <SelectTrigger className="w-72 bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select faculty scope" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10">
                    <SelectItem value="all" className="text-white">All Faculties (Global)</SelectItem>
                    {faculties.map(f => (
                      <SelectItem key={f.id} value={f.id} className="text-white">{f.code} – {f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {rooms.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="text-xs text-slate-400">{rooms.length} venue(s) in scope:</span>
                    {rooms.slice(0, 8).map(r => (
                      <Badge key={r.id} variant="outline" className="text-xs text-slate-300 border-white/10">
                        {r.code} ({r.capacity})
                      </Badge>
                    ))}
                    {rooms.length > 8 && <Badge variant="outline" className="text-xs text-slate-400 border-white/10">+{rooms.length - 8} more</Badge>}
                  </div>
                )}
              </div>

              {/* Departments in scope */}
              {departments.length > 0 && (
                <div>
                  <Label className="text-slate-300 mb-2 block">Departments in Scope ({departments.length})</Label>
                  <div className="flex flex-wrap gap-2">
                    {departments.map(d => (
                      <Badge key={d.id} variant="outline" className="text-xs text-slate-300 border-white/10">{d.code}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep('setup')} className="border-white/10 text-slate-300">
              <ChevronLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            <Button onClick={() => setStep('generate')} className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-0">
              Next: Generate <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          STEP 3 — GENERATE
      ══════════════════════════════════════════════════════════════ */}
      {step === 'generate' && (
        <div className="space-y-4">
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                Generate Timetable
              </CardTitle>
              <CardDescription>
                {selectedPeriodData?.name} · {selectedPeriodData?.session} Sem {selectedPeriodData?.semester}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Summary before generate */}
              <div className="p-4 bg-white/5 rounded-lg border border-white/10 space-y-2">
                <div className="text-sm text-slate-300 font-medium mb-2">Ready to Generate</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-400">
                    <CheckCircle2 className="w-3 h-3 text-green-400" />
                    Period: <span className="text-white">{selectedPeriodData?.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <CheckCircle2 className="w-3 h-3 text-green-400" />
                    Jumu'ah: <span className={selectedPeriodData?.excludeFridays ? 'text-green-400' : 'text-slate-300'}>
                      {selectedPeriodData?.excludeFridays ? 'Fridays excluded ✓' : 'Not excluded'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <CheckCircle2 className="w-3 h-3 text-green-400" />
                    Venues: <span className="text-white">{rooms.length} rooms in scope</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <CheckCircle2 className="w-3 h-3 text-green-400" />
                    Saturday: <span className="text-white">{selectedPeriodData?.includeSaturday ? 'Included' : 'Excluded'}</span>
                  </div>
                </div>
              </div>

              {/* Generate button */}
              {!generating && (
                <div className="flex flex-col items-center gap-4 py-6">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center">
                    <Sparkles className="w-10 h-10 text-cyan-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-white font-medium">Auto-Generate Clash-Free Timetable</p>
                    <p className="text-sm text-slate-400 mt-1">Engine will detect CO clashes, assign venues, and respect Jumu'ah blocks</p>
                  </div>
                  <Button
                    onClick={handleGenerate}
                    disabled={!selectedPeriod}
                    size="lg"
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white border-0 px-10"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Generate Timetable
                  </Button>
                </div>
              )}

              {/* Progress */}
              {generating && (
                <div className="space-y-3 py-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-300 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                      {progressMessage}
                    </span>
                    <span className="text-cyan-400 font-medium">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-3 bg-white/10" />
                  <div className="grid grid-cols-7 gap-1 mt-2">
                    {[10, 25, 40, 55, 70, 85, 100].map(p => (
                      <div key={p} className={`h-1 rounded-full transition-all ${progress >= p ? 'bg-cyan-400' : 'bg-white/10'}`} />
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep('configure')} className="border-white/10 text-slate-300" disabled={generating}>
              <ChevronLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            {examSlots.length > 0 && (
              <Button onClick={() => setStep('review')} className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-0">
                View Results <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          STEP 4 — REVIEW
      ══════════════════════════════════════════════════════════════ */}
      {step === 'review' && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Exam Days', value: sortedDates.length, icon: Calendar, color: 'from-cyan-500/20 to-blue-500/20', iconColor: 'text-cyan-400' },
              { label: 'Exams Scheduled', value: stats.totalExams, icon: CheckCircle2, color: 'from-green-500/20 to-emerald-500/20', iconColor: 'text-green-400' },
              { label: 'Students', value: stats.totalStudents.toLocaleString(), icon: Users, color: 'from-amber-500/20 to-yellow-500/20', iconColor: 'text-amber-400' },
              { label: 'Venues Used', value: stats.roomsUsed, icon: MapPin, color: 'from-purple-500/20 to-pink-500/20', iconColor: 'text-purple-400' },
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

          {/* Conflicts alert */}
          {conflicts.length > 0 && (
            <Card className="bg-red-500/5 border-red-500/20">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <ConflictBadge count={conflicts.length} critical={criticalConflicts} warnings={warningConflicts} />
                  <Button variant="link" className="text-red-400 hover:text-red-300" onClick={() => window.location.href = '/dashboard/conflicts'}>
                    View All Conflicts →
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Controls bar */}
          <Card className="bg-white/5 border-white/10">
            <CardContent className="pt-4">
              <div className="flex flex-wrap items-center gap-4 justify-between">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-400">Filter:</span>
                  </div>
                  <Select value={filterLevel} onValueChange={setFilterLevel}>
                    <SelectTrigger className="w-32 bg-white/5 border-white/10 text-white text-sm">
                      <SelectValue placeholder="Level" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10">
                      <SelectItem value="all" className="text-white">All Levels</SelectItem>
                      {[100, 200, 300, 400, 500].map(l => (
                        <SelectItem key={l} value={l.toString()} className="text-white">{l}L</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterDept} onValueChange={setFilterDept}>
                    <SelectTrigger className="w-48 bg-white/5 border-white/10 text-white text-sm">
                      <SelectValue placeholder="Department" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10">
                      <SelectItem value="all" className="text-white">All Departments</SelectItem>
                      {slotDepts.map(([code, name]) => (
                        <SelectItem key={code} value={code} className="text-white">{code} – {name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex bg-white/5 rounded-lg p-1">
                    {(['calendar', 'list'] as const).map(v => (
                      <Button
                        key={v}
                        variant={viewMode === v ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode(v)}
                        className={viewMode === v ? 'bg-cyan-500 text-white' : 'text-slate-400'}
                      >
                        {v === 'calendar' ? 'Calendar' : 'List'}
                      </Button>
                    ))}
                  </div>
                  <ExportButtons data={exportData} disabled={examSlots.length === 0} />
                  <VersionHistory examPeriodId={selectedPeriod} currentVersion={currentVersion} />
                  <Button
                    variant="outline"
                    onClick={handleClearTimetable}
                    className="border-red-500/20 text-red-400 hover:bg-red-500/10"
                  >
                    <XCircle className="w-4 h-4 mr-2" /> Clear & Regenerate
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Calendar/List Canvas */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-cyan-400" />
                Exam Schedule Canvas
              </CardTitle>
              <CardDescription>
                {filteredSlots.length} exams across {sortedDates.length} days
                {selectedPeriodData?.excludeFridays && <span className="ml-2 text-green-400">· 🕌 Jumu'ah excluded</span>}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredSlots.length === 0 ? (
                <div className="py-12 text-center">
                  <Calendar className="w-16 h-16 mx-auto text-slate-600 mb-4" />
                  <p className="text-white font-medium mb-2">No matching exams</p>
                  <p className="text-sm text-slate-400">Try adjusting your filters</p>
                </div>
              ) : viewMode === 'calendar' ? (
                <div className="overflow-x-auto">
                  <div className="min-w-[800px]">
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      <div className="p-3 bg-white/5 rounded-lg">
                        <span className="text-slate-400 text-sm font-medium">Date</span>
                      </div>
                      {[1, 2, 3].map(n => (
                        <div key={n} className={`p-3 rounded-lg bg-gradient-to-br ${slotColors[n - 1]} border`}>
                          <span className="text-white text-sm font-medium">{getSlotTime(n)}</span>
                        </div>
                      ))}
                    </div>
                    {sortedDates.map(date => (
                      <div key={date} className="grid grid-cols-4 gap-2 mb-2">
                        <div className="p-3 bg-white/5 rounded-lg flex items-center">
                          <span className="text-white font-medium text-sm">{date}</span>
                        </div>
                        {[1, 2, 3].map(n => {
                          const slots = groupedSlots[date]?.[n] || []
                          return (
                            <div key={n} className={`p-2 rounded-lg bg-gradient-to-br ${slotColors[n - 1]} border min-h-[80px]`}>
                              {slots.length > 0 ? (
                                <div className="space-y-1">
                                  {slots.map(slot => (
                                    <div key={slot.id} className="p-2 bg-slate-900/60 rounded-md hover:bg-slate-900/80 transition-colors group">
                                      <div className="flex items-center justify-between">
                                        <Badge variant="outline" className={`${slot.course.isShared ? 'text-pink-400 border-pink-400/20' : 'text-cyan-400 border-cyan-400/20'} text-xs font-mono`}>
                                          {slot.course.code}{slot.course.isShared ? ' ★' : ''}
                                        </Badge>
                                        <Badge variant="secondary" className={`${levelColors[slot.course.level] || 'bg-white/10 text-slate-300'} text-xs`}>
                                          {slot.course.level}L
                                        </Badge>
                                      </div>
                                      <p className="text-xs text-white mt-1 truncate group-hover:whitespace-normal">{slot.course.name}</p>
                                      <div className="flex items-center justify-between mt-1">
                                        <div className="flex items-center gap-1">
                                          <MapPin className="w-3 h-3 text-slate-500" />
                                          <span className="text-xs text-slate-400">{slot.room.code}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <Users className="w-3 h-3 text-slate-500" />
                                          <span className="text-xs text-slate-400">{slot.course._count?.studentCourses || 0}</span>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="h-full flex items-center justify-center text-slate-500 text-xs py-4">Free</div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {sortedDates.map(date => (
                    <div key={date} className="space-y-2">
                      <h3 className="text-white font-medium sticky top-0 bg-slate-900/80 py-2 px-1 rounded">{date}</h3>
                      {[1, 2, 3].map(n => {
                        const slots = groupedSlots[date]?.[n] || []
                        if (!slots.length) return null
                        return (
                          <div key={n} className="pl-4 border-l-2 border-white/10">
                            <div className="flex items-center gap-2 mb-2">
                              <Clock className="w-4 h-4 text-slate-400" />
                              <span className="text-sm text-slate-300">{getSlotTime(n)}</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                              {slots.map(slot => (
                                <div key={slot.id} className="p-3 bg-white/5 rounded-lg border border-white/10 hover:border-cyan-500/30 transition-colors">
                                  <div className="flex items-center justify-between mb-2">
                                    <Badge variant="outline" className="text-cyan-400 text-xs font-mono">{slot.course.code}</Badge>
                                    <Badge variant="secondary" className={`${levelColors[slot.course.level] || 'bg-white/10 text-slate-300'} text-xs`}>{slot.course.level}L</Badge>
                                  </div>
                                  <p className="text-sm text-white mb-2">{slot.course.name}</p>
                                  <div className="flex items-center justify-between text-xs text-slate-400">
                                    <div className="flex items-center gap-1"><MapPin className="w-3 h-3" />{slot.room.name}</div>
                                    <div className="flex items-center gap-1"><Users className="w-3 h-3" />{slot.course._count?.studentCourses || 0}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Legend */}
          <Card className="bg-white/5 border-white/10">
            <CardContent className="pt-4">
              <div className="flex flex-wrap items-center gap-6">
                <span className="text-sm text-slate-400">Legend:</span>
                {['Morning', 'Afternoon', 'Evening'].map((l, i) => (
                  <div key={l} className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded bg-gradient-to-br ${slotColors[i].split(' ')[0]} ${slotColors[i].split(' ')[1]}`} />
                    <span className="text-sm text-slate-300">{l}</span>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-pink-400 border-pink-400/20 text-xs">★ GST</Badge>
                  <span className="text-sm text-slate-300">Shared/General Course</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep('generate')} className="border-white/10 text-slate-300">
              <ChevronLeft className="w-4 h-4 mr-2" /> Back to Generate
            </Button>
            <Button variant="outline" onClick={() => setStep('setup')} className="border-white/10 text-slate-300">
              New Period <Plus className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
