'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageHeader } from '@/components/page-header'
import {
  Calendar, Clock, MapPin, BookOpen, Users, CheckCircle2,
  Loader2, User, Shield, AlertTriangle, RefreshCw
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Alert, AlertDescription } from '@/components/ui/alert'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExamSlot {
  id: string; date: string; slotNumber: number; startTime: string; endTime: string
  course: { id: string; code: string; name: string; level: number; department?: { code: string; name: string }; _count?: { studentCourses: number } }
  room: { id: string; code: string; name: string; capacity: number }
}

interface InvigAssignment {
  id: string; role: string; notes?: string
  examSlot: ExamSlot
  lecturer: { id: string; staffId: string; name: string }
}

interface LectureSlot {
  id: string; dayOfWeek: number; startTime: string; endTime: string
  course: { id: string; code: string; name: string; level: number; isShared: boolean; department?: { code: string } }
  room: { id: string; code: string; name: string; capacity: number }
}

const slotColors = [
  'from-cyan-500/20 to-blue-500/20 border-cyan-500/30',
  'from-purple-500/20 to-pink-500/20 border-purple-500/30',
  'from-amber-500/20 to-yellow-500/20 border-amber-500/30',
]
const roleColors: Record<string, string> = {
  CHIEF: 'bg-amber-500/20 text-amber-400',
  ASSISTANT: 'bg-cyan-500/20 text-cyan-400',
  SUPERVISOR: 'bg-purple-500/20 text-purple-400',
}
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function LecturerSchedulePage() {
  const { data: session } = useSession()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [lecturer, setLecturer] = useState<any>(null)
  const [courses, setCourses] = useState<any[]>([])
  const [examPeriods, setExamPeriods] = useState<any[]>([])
  const [lectureTimetables, setLectureTimetables] = useState<any[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState('')
  const [selectedLectureTT, setSelectedLectureTT] = useState('')
  const [examSlots, setExamSlots] = useState<ExamSlot[]>([])
  const [invigAssignments, setInvigAssignments] = useState<InvigAssignment[]>([])
  const [lectureSlots, setLectureSlots] = useState<LectureSlot[]>([])
  const [invigStats, setInvigStats] = useState({ total: 0, chief: 0, assistant: 0, supervisor: 0 })
  const [activeTab, setActiveTab] = useState<'exam' | 'lecture' | 'invigilation'>('exam')

  // ── Fetchers ─────────────────────────────────────────────────────────────────

  const fetchBase = useCallback(async () => {
    setLoading(true)
    try {
      const [periodsRes, ttRes, lecturersRes] = await Promise.all([
        fetch('/api/exam-periods'),
        fetch('/api/lecture-timetables'),
        fetch('/api/lecturers?limit=1'),
      ])

      if (periodsRes.ok) {
        const p = await periodsRes.json()
        setExamPeriods(p)
        if (p.length > 0) setSelectedPeriod(p[0].id)
      }
      if (ttRes.ok) {
        const t = await ttRes.json()
        setLectureTimetables(t)
        if (t.length > 0) setSelectedLectureTT(t[0].id)
      }
      if (lecturersRes.ok) {
        const lecs = await lecturersRes.json()
        if (lecs.length > 0) setLecturer(lecs[0])
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to load data', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const fetchExamData = useCallback(async () => {
    if (!selectedPeriod || !lecturer) return
    try {
      const [slotsRes, invigsRes] = await Promise.all([
        fetch(`/api/exam-slots?examPeriodId=${selectedPeriod}`),
        fetch(`/api/invigilations?lecturerId=${lecturer.id}&examPeriodId=${selectedPeriod}`),
      ])
      if (slotsRes.ok) {
        const data = await slotsRes.json()
        // Only slots for courses this lecturer teaches
        const lCourseRes = await fetch(`/api/courses?lecturerId=${lecturer.id}`)
        const lCourses = lCourseRes.ok ? await lCourseRes.json() : []
        setCourses(lCourses)
        const courseIds = new Set(lCourses.map((c: any) => c.id))
        setExamSlots((data.slots || []).filter((s: ExamSlot) => courseIds.has(s.course.id)))
      }
      if (invigsRes.ok) {
        const data = await invigsRes.json()
        setInvigAssignments(data.assignments || [])
        setInvigStats(data.stats || { total: 0, chief: 0, assistant: 0, supervisor: 0 })
      }
    } catch {}
  }, [selectedPeriod, lecturer])

  const fetchLectureSlots = useCallback(async () => {
    if (!selectedLectureTT || !lecturer) return
    try {
      // Get lecture slots for courses this lecturer teaches
      const res = await fetch(`/api/lecture-slots?timetableId=${selectedLectureTT}`)
      if (res.ok) {
        const data = await res.json()
        // Filter by lecturer's courses
        const courseIds = new Set(courses.map((c: any) => c.id))
        setLectureSlots((data.slots || []).filter((s: LectureSlot) => courseIds.has(s.course.id)))
      }
    } catch {}
  }, [selectedLectureTT, lecturer, courses])

  // ── Effects ──────────────────────────────────────────────────────────────────

  useEffect(() => { fetchBase() }, [fetchBase])
  useEffect(() => { fetchExamData() }, [fetchExamData])
  useEffect(() => { fetchLectureSlots() }, [fetchLectureSlots])

  // ── Derived ──────────────────────────────────────────────────────────────────

  const groupedExam = useMemo(() => examSlots.reduce((acc, s) => {
    const dk = new Date(s.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
    if (!acc[dk]) acc[dk] = []
    acc[dk].push(s)
    return acc
  }, {} as Record<string, ExamSlot[]>), [examSlots])

  const groupedInvig = useMemo(() => invigAssignments.reduce((acc, a) => {
    const dk = new Date(a.examSlot.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
    if (!acc[dk]) acc[dk] = []
    acc[dk].push(a)
    return acc
  }, {} as Record<string, InvigAssignment[]>), [invigAssignments])

  // Weekly lecture grid: dayOfWeek → slots sorted by time
  const lectureGrid = useMemo(() => {
    const g: Record<number, LectureSlot[]> = {}
    for (let i = 1; i <= 6; i++) g[i] = []
    lectureSlots.forEach(s => {
      if (g[s.dayOfWeek]) g[s.dayOfWeek].push(s)
    })
    Object.values(g).forEach(arr => arr.sort((a, b) => a.startTime.localeCompare(b.startTime)))
    return g
  }, [lectureSlots])

  const totalLectureSlotsPerWeek = lectureSlots.length
  const slotsPerWeekTarget = 6
  const slotsStatus = totalLectureSlotsPerWeek >= slotsPerWeekTarget ? 'good' : totalLectureSlotsPerWeek >= 3 ? 'low' : 'critical'

  if (!['LC', 'TO', 'IA', 'SA'].includes(session?.user?.role || '')) {
    return (
      <Alert className="bg-amber-500/10 border-amber-500/20">
        <AlertDescription className="text-amber-400">Access denied.</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lecturer Schedule"
        description="Teaching, exam supervision & invigilation duties"
        onRefresh={() => { fetchExamData(); fetchLectureSlots() }}
        loading={loading}
      />

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
        </div>
      ) : !lecturer ? (
        <Card className="bg-white/5 border-white/10">
          <CardContent className="py-12 text-center">
            <User className="w-12 h-12 mx-auto text-slate-500 mb-4" />
            <p className="text-white font-medium">No lecturer profile found</p>
            <p className="text-sm text-slate-400">Contact your department administrator</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* ── Lecturer Profile Card ── */}
          <Card className="bg-white/5 border-white/10">
            <CardContent className="pt-5">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-2xl font-bold text-white">
                    {lecturer.name?.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{lecturer.name}</h2>
                    <p className="text-slate-400 text-sm">{lecturer.staffId} · {lecturer.rank || 'Lecturer'}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge variant="outline" className="border-green-500/30 text-green-400">{lecturer.department?.code}</Badge>
                      <Badge variant="outline" className="border-white/10 text-slate-300">{courses.length} Course(s)</Badge>
                      <Badge variant="outline" className={`border-white/10 ${slotsStatus === 'good' ? 'text-green-400' : slotsStatus === 'low' ? 'text-amber-400' : 'text-red-400'}`}>
                        {totalLectureSlotsPerWeek}/{slotsPerWeekTarget} lecture slots/wk
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                    <SelectTrigger className="w-56 bg-white/5 border-white/10 text-white text-sm">
                      <SelectValue placeholder="Exam period" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10">
                      {examPeriods.map(p => (
                        <SelectItem key={p.id} value={p.id} className="text-white">{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedLectureTT} onValueChange={setSelectedLectureTT}>
                    <SelectTrigger className="w-56 bg-white/5 border-white/10 text-white text-sm">
                      <SelectValue placeholder="Lecture timetable" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10">
                      {lectureTimetables.map(t => (
                        <SelectItem key={t.id} value={t.id} className="text-white">{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Stats Row ── */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              { label: 'Courses', value: courses.length, icon: BookOpen, color: 'from-cyan-500/20 to-blue-500/20', tc: 'text-cyan-400' },
              { label: 'Exam Days', value: Object.keys(groupedExam).length, icon: Calendar, color: 'from-green-500/20 to-emerald-500/20', tc: 'text-green-400' },
              { label: 'Lecture Slots/Wk', value: totalLectureSlotsPerWeek, icon: Clock, color: slotsStatus === 'good' ? 'from-green-500/20 to-emerald-500/20' : 'from-amber-500/20 to-yellow-500/20', tc: slotsStatus === 'good' ? 'text-green-400' : 'text-amber-400' },
              { label: 'Invigilations', value: invigStats.total, icon: Shield, color: 'from-purple-500/20 to-pink-500/20', tc: 'text-purple-400' },
              { label: 'Chief Invig', value: invigStats.chief, icon: Users, color: 'from-amber-500/20 to-yellow-500/20', tc: 'text-amber-400' },
            ].map(s => (
              <Card key={s.label} className="bg-white/5 border-white/10">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center`}>
                      <s.icon className={`w-4 h-4 ${s.tc}`} />
                    </div>
                    <div>
                      <div className="text-xl font-bold text-white">{s.value}</div>
                      <div className="text-xs text-slate-400">{s.label}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* ── Slots/week alert ── */}
          {slotsStatus !== 'good' && (
            <Card className="bg-amber-500/5 border-amber-500/20">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-amber-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm">
                    Only {totalLectureSlotsPerWeek} lecture slot(s)/week assigned — target is {slotsPerWeekTarget}. Contact the Timetable Officer to update the schedule.
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Tabs ── */}
          <div className="flex gap-1 bg-white/5 p-1 rounded-lg w-fit">
            {([
              { id: 'exam', label: 'Exam Schedule', count: examSlots.length },
              { id: 'lecture', label: 'Lecture Timetable', count: totalLectureSlotsPerWeek },
              { id: 'invigilation', label: 'Invigilation', count: invigStats.total },
            ] as const).map(tab => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab(tab.id)}
                className={activeTab === tab.id ? 'bg-cyan-500 text-white' : 'text-slate-400 hover:text-white'}
              >
                {tab.label}
                {tab.count > 0 && (
                  <Badge className="ml-2 bg-white/10 text-white text-xs">{tab.count}</Badge>
                )}
              </Button>
            ))}
          </div>

          {/* ════════════════════════════════════════
              TAB: EXAM SCHEDULE
          ════════════════════════════════════════ */}
          {activeTab === 'exam' && (
            <>
              {examSlots.length === 0 ? (
                <Card className="bg-white/5 border-white/10">
                  <CardContent className="py-12 text-center">
                    <Calendar className="w-12 h-12 mx-auto text-slate-500 mb-3" />
                    <p className="text-white font-medium">No exam slots yet</p>
                    <p className="text-sm text-slate-400">Exam schedule will appear here once generated</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {Object.entries(groupedExam).sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime()).map(([date, slots]) => (
                    <Card key={date} className="bg-white/5 border-white/10">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base text-white flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-cyan-400" /> {date}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {slots.sort((a, b) => a.slotNumber - b.slotNumber).map(slot => (
                            <div key={slot.id} className={`p-3 rounded-lg bg-gradient-to-r ${slotColors[slot.slotNumber - 1]} border`}>
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <Badge variant="outline" className="border-white/20 text-cyan-400 font-mono">{slot.course.code}</Badge>
                                <Badge className="bg-white/10 text-slate-300 text-xs">{['Morning', 'Afternoon', 'Evening'][slot.slotNumber - 1]}</Badge>
                                <Badge className="bg-green-500/20 text-green-400 text-xs">Course Lecturer</Badge>
                              </div>
                              <p className="text-white font-medium text-sm">{slot.course.name}</p>
                              <div className="flex flex-wrap gap-4 mt-2 text-xs text-slate-400">
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{slot.startTime}–{slot.endTime}</span>
                                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{slot.room.name} ({slot.room.code})</span>
                                <span className="flex items-center gap-1"><Users className="w-3 h-3" />{slot.course._count?.studentCourses || 0} students</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ════════════════════════════════════════
              TAB: LECTURE TIMETABLE
          ════════════════════════════════════════ */}
          {activeTab === 'lecture' && (
            <>
              {lectureSlots.length === 0 ? (
                <Card className="bg-white/5 border-white/10">
                  <CardContent className="py-12 text-center">
                    <Clock className="w-12 h-12 mx-auto text-slate-500 mb-3" />
                    <p className="text-white font-medium">No lecture slots assigned</p>
                    <p className="text-sm text-slate-400">The timetable officer needs to assign lecture slots for your courses</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {Object.entries(lectureGrid).filter(([, slots]) => slots.length > 0).map(([dayIdx, slots]) => (
                    <Card key={dayIdx} className="bg-white/5 border-white/10">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base text-white flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-purple-400" />
                            {DAY_NAMES[parseInt(dayIdx)]}
                          </span>
                          <Badge variant="outline" className="text-slate-400 border-white/10">{slots.length} class(es)</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {slots.map(slot => (
                            <div key={slot.id} className="p-3 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-purple-400 border-purple-400/20 font-mono text-xs">{slot.course.code}</Badge>
                                {slot.course.isShared && <Badge className="bg-pink-500/20 text-pink-400 text-xs">GST</Badge>}
                              </div>
                              <p className="text-white text-sm font-medium">{slot.course.name}</p>
                              <div className="flex flex-wrap gap-4 mt-1 text-xs text-slate-400">
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{slot.startTime}–{slot.endTime}</span>
                                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{slot.room.code}</span>
                                <span>{slot.course.level}L</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ════════════════════════════════════════
              TAB: INVIGILATION
          ════════════════════════════════════════ */}
          {activeTab === 'invigilation' && (
            <>
              {/* Role summary */}
              {invigStats.total > 0 && (
                <div className="flex flex-wrap gap-3">
                  {invigStats.chief > 0 && <Badge className={`${roleColors.CHIEF} px-3 py-1`}>Chief Invigilator × {invigStats.chief}</Badge>}
                  {invigStats.assistant > 0 && <Badge className={`${roleColors.ASSISTANT} px-3 py-1`}>Assistant × {invigStats.assistant}</Badge>}
                  {invigStats.supervisor > 0 && <Badge className={`${roleColors.SUPERVISOR} px-3 py-1`}>Supervisor × {invigStats.supervisor}</Badge>}
                </div>
              )}

              {invigAssignments.length === 0 ? (
                <Card className="bg-white/5 border-white/10">
                  <CardContent className="py-12 text-center">
                    <Shield className="w-12 h-12 mx-auto text-slate-500 mb-3" />
                    <p className="text-white font-medium">No invigilation duties assigned</p>
                    <p className="text-sm text-slate-400">The timetable officer will assign your invigilation duties after exam generation</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {Object.entries(groupedInvig).sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime()).map(([date, assignments]) => (
                    <Card key={date} className="bg-white/5 border-white/10">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base text-white flex items-center gap-2">
                          <Shield className="w-4 h-4 text-purple-400" /> {date}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {assignments.sort((a, b) => a.examSlot.slotNumber - b.examSlot.slotNumber).map(a => (
                            <div key={a.id} className={`p-3 rounded-lg bg-gradient-to-r ${slotColors[a.examSlot.slotNumber - 1]} border`}>
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <Badge variant="outline" className="border-white/20 text-white font-mono text-xs">{a.examSlot.course.code}</Badge>
                                <Badge className={`${roleColors[a.role]} text-xs`}>{a.role}</Badge>
                                <Badge className="bg-white/10 text-slate-300 text-xs">{['Morning', 'Afternoon', 'Evening'][a.examSlot.slotNumber - 1]}</Badge>
                              </div>
                              <p className="text-white text-sm font-medium">{a.examSlot.course.name}</p>
                              <div className="flex flex-wrap gap-4 mt-1 text-xs text-slate-400">
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{a.examSlot.startTime}–{a.examSlot.endTime}</span>
                                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{a.examSlot.room.name}</span>
                                <span className="flex items-center gap-1"><Users className="w-3 h-3" />{a.examSlot.course._count?.studentCourses || 0} students</span>
                              </div>
                              {a.notes && <p className="text-xs text-slate-400 mt-1 italic">Note: {a.notes}</p>}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Courses Teaching */}
          {courses.length > 0 && (
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2 text-base">
                  <BookOpen className="w-4 h-4 text-cyan-400" /> Courses Teaching ({courses.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {courses.map((c: any) => (
                    <div key={c.id} className="p-3 bg-white/5 rounded-lg border border-white/10">
                      <Badge variant="outline" className="border-white/20 text-cyan-400 font-mono text-xs mb-1">{c.code}</Badge>
                      <p className="text-white text-sm">{c.name}</p>
                      <p className="text-xs text-slate-400 mt-1">{c.level}L · {c.creditUnits} CU</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
