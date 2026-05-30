'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageHeader } from '@/components/page-header'
import { Calendar, Clock, MapPin, BookOpen, Users, AlertTriangle, CheckCircle2, Loader2, User } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ExamSlot {
  id: string
  date: string
  slotNumber: number
  startTime: string
  endTime: string
  course: {
    id: string
    code: string
    name: string
    level: number
    department?: { code: string; name: string }
    _count?: { studentCourses: number }
  }
  room: { id: string; code: string; name: string; capacity: number }
}

interface InvigilationAssignment {
  id: string
  examSlot: ExamSlot
  role: string
}

interface LecturerInfo {
  id: string
  staffId: string
  name: string
  email: string
  department: { code: string; name: string }
  courses: {
    id: string
    code: string
    name: string
    level: number
  }[]
  invigilationAssignments: InvigilationAssignment[]
}

const slotLabels = ['Morning', 'Afternoon', 'Evening']
const slotColors = [
  'from-cyan-500/20 to-blue-500/20 border-cyan-500/30',
  'from-purple-500/20 to-pink-500/20 border-purple-500/30',
  'from-amber-500/20 to-yellow-500/20 border-amber-500/30',
]

export default function LecturerSchedulePage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [lecturerInfo, setLecturerInfo] = useState<LecturerInfo | null>(null)
  const [examPeriods, setExamPeriods] = useState<any[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<string>('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch exam periods
      const periodsRes = await fetch('/api/exam-periods')
      if (periodsRes.ok) {
        const periods = await periodsRes.json()
        setExamPeriods(periods)
        if (periods.length > 0) {
          setSelectedPeriod(periods[0].id)
        }
      }

      // For demo, fetch a sample lecturer
      const lecturersRes = await fetch('/api/lecturers?limit=1')
      if (lecturersRes.ok) {
        const lecturers = await lecturersRes.json()
        if (lecturers.length > 0) {
          const lecturer = lecturers[0]
          // Get courses taught by this lecturer
          const coursesRes = await fetch(`/api/courses?lecturerId=${lecturer.id}`)
          const courses = coursesRes.ok ? await coursesRes.json() : []

          setLecturerInfo({
            ...lecturer,
            courses,
            invigilationAssignments: [],
          })
        }
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load data', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Get all exam slots for lecturer's courses
  const [examSlots, setExamSlots] = useState<ExamSlot[]>([])

  useEffect(() => {
    if (selectedPeriod && lecturerInfo) {
      fetch(`/api/exam-slots?examPeriodId=${selectedPeriod}`)
        .then(res => res.json())
        .then(data => {
          const courseIds = lecturerInfo.courses.map(c => c.id)
          const filteredSlots = (data.slots || []).filter((slot: ExamSlot) =>
            courseIds.includes(slot.course.id)
          )
          setExamSlots(filteredSlots)
        })
        .catch(console.error)
    }
  }, [selectedPeriod, lecturerInfo])

  // Group slots by date
  const groupedSlots = examSlots.reduce((acc, slot) => {
    const dateKey = new Date(slot.date).toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    })
    if (!acc[dateKey]) acc[dateKey] = []
    acc[dateKey].push(slot)
    return acc
  }, {} as Record<string, ExamSlot[]>)

  const sortedDates = Object.keys(groupedSlots).sort((a, b) => {
    return new Date(a).getTime() - new Date(b).getTime()
  })

  // Calculate total invigilation hours
  const totalExams = examSlots.length

  if (session?.user?.role && !['LC', 'TO', 'IA', 'SA'].includes(session.user.role)) {
    return (
      <Alert className="bg-amber-500/10 border-amber-500/20">
        <AlertDescription className="text-amber-400">
          Access denied. This page is for lecturers and administrators.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lecturer Schedule"
        description="Your teaching and invigilation schedule"
        onRefresh={fetchData}
        loading={loading}
      />

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
        </div>
      ) : !lecturerInfo ? (
        <Card className="bg-white/5 border-white/10">
          <CardContent className="py-12 text-center">
            <User className="w-12 h-12 mx-auto text-slate-500 mb-4" />
            <p className="text-white font-medium">No lecturer profile found</p>
            <p className="text-sm text-slate-400">Please contact your department if you cannot see your schedule</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Lecturer Info Card */}
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-2xl font-bold">
                    {lecturerInfo.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{lecturerInfo.name}</h2>
                    <p className="text-slate-400">{lecturerInfo.staffId}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="border-white/10 text-green-400">
                        {lecturerInfo.department?.code} - Lecturer
                      </Badge>
                      <Badge variant="outline" className="border-white/10 text-slate-300">
                        {lecturerInfo.courses.length} Course(s)
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
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
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-white/5 border-white/10">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{lecturerInfo.courses.length}</div>
                    <div className="text-xs text-slate-400">Courses Teaching</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{totalExams}</div>
                    <div className="text-xs text-slate-400">Exam Supervisions</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/20 to-yellow-500/20 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{sortedDates.length}</div>
                    <div className="text-xs text-slate-400">Exam Days</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                    <Users className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">
                      {examSlots.reduce((sum, s) => sum + (s.course._count?.studentCourses || 0), 0)}
                    </div>
                    <div className="text-xs text-slate-400">Total Students</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Courses Teaching */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-cyan-400" />
                Courses Teaching
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {lecturerInfo.courses.map((course) => (
                  <div
                    key={course.id}
                    className="p-3 bg-white/5 rounded-lg border border-white/10"
                  >
                    <Badge variant="outline" className="border-white/20 text-cyan-400 font-mono mb-2">
                      {course.code}
                    </Badge>
                    <p className="text-white text-sm">{course.name}</p>
                    <p className="text-xs text-slate-400 mt-1">{course.level} Level</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Schedule */}
          {examSlots.length === 0 ? (
            <Card className="bg-white/5 border-white/10">
              <CardContent className="py-12 text-center">
                <Calendar className="w-12 h-12 mx-auto text-slate-500 mb-4" />
                <p className="text-white font-medium">No exams scheduled yet</p>
                <p className="text-sm text-slate-400">Your exam supervision schedule will appear here</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-green-400" />
                    Exam Supervision Schedule
                  </CardTitle>
                  <CardDescription>Exams for courses you are teaching</CardDescription>
                </CardHeader>
              </Card>

              {sortedDates.map((date) => (
                <Card key={date} className="bg-white/5 border-white/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg text-white flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-cyan-400" />
                      {date}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {groupedSlots[date]
                        .sort((a, b) => a.slotNumber - b.slotNumber)
                        .map((slot) => (
                          <div
                            key={slot.id}
                            className={`p-4 rounded-lg bg-gradient-to-r ${slotColors[slot.slotNumber - 1]} border`}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="outline" className="border-white/20 text-cyan-400 font-mono">
                                    {slot.course.code}
                                  </Badge>
                                  <Badge variant="secondary" className="bg-white/10 text-slate-300">
                                    {slotLabels[slot.slotNumber - 1]}
                                  </Badge>
                                  <Badge variant="outline" className="border-green-500/20 text-green-400">
                                    Course Lecturer
                                  </Badge>
                                </div>
                                <p className="text-white font-medium">{slot.course.name}</p>
                                <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    {slot.startTime} - {slot.endTime}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-4 h-4" />
                                    {slot.room.name} ({slot.room.code})
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Users className="w-4 h-4" />
                                    {slot.course._count?.studentCourses || 0} students
                                  </span>
                                </div>
                              </div>
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
    </div>
  )
}
