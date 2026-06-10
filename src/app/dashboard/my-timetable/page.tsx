'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageHeader } from '@/components/page-header'
import { Calendar, Clock, MapPin, BookOpen, AlertTriangle, CheckCircle2, Loader2, Download, User } from 'lucide-react'
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
  }
  room: { id: string; code: string; name: string; capacity: number }
}

interface StudentInfo {
  id: string
  regNumber: string
  name: string
  level: number
  department: { code: string; name: string }
  courses: {
    courseId: string
    courseCode: string
    courseName: string
    status: 'REGISTERED' | 'CARRY_OVER' | 'SPILLOVER'
  }[]
}

const slotLabels = ['Morning', 'Afternoon', 'Evening']
const slotColors = [
  'from-cyan-500/20 to-blue-500/20 border-cyan-500/30',
  'from-purple-500/20 to-pink-500/20 border-purple-500/30',
  'from-amber-500/20 to-yellow-500/20 border-amber-500/30',
]

export default function MyTimetablePage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null)
  const [examSlots, setExamSlots] = useState<ExamSlot[]>([])
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

      // Fetch the actual logged-in student's profile via userId
      const studentRes = await fetch('/api/students?me=true')
      if (studentRes.ok) {
        const data = await studentRes.json()
        // API returns array — pick the one matching the session user
        const students = Array.isArray(data) ? data : data.students || []
        if (students.length > 0) {
          const studentDetail = await fetch(`/api/students/${students[0].id}`)
          if (studentDetail.ok) {
            setStudentInfo(await studentDetail.json())
          }
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

  useEffect(() => {
    if (selectedPeriod && studentInfo) {
      // Fetch exam slots for student's courses
      fetch(`/api/exam-slots?examPeriodId=${selectedPeriod}`)
        .then(res => res.json())
        .then(data => {
          // Filter slots for student's courses
          const studentCourseIds = studentInfo.courses.map(c => c.courseId)
          const filteredSlots = (data.slots || []).filter((slot: ExamSlot) =>
            studentCourseIds.includes(slot.course.id)
          )
          setExamSlots(filteredSlots)
        })
        .catch(console.error)
    }
  }, [selectedPeriod, studentInfo])

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

  // Count CO courses
  const coCourses = studentInfo?.courses.filter(c => c.status !== 'REGISTERED') || []

  if (session?.user?.role && !['ST', 'LC'].includes(session.user.role)) {
    return (
      <Alert className="bg-amber-500/10 border-amber-500/20">
        <AlertDescription className="text-amber-400">
          This page is for students. Admins can view individual student timetables from the Students page.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Exam Timetable"
        description="Your personal exam schedule"
        onRefresh={fetchData}
        loading={loading}
      />

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
        </div>
      ) : !studentInfo ? (
        <Card className="bg-white/5 border-white/10">
          <CardContent className="py-12 text-center">
            <User className="w-12 h-12 mx-auto text-slate-500 mb-4" />
            <p className="text-white font-medium">No student profile found</p>
            <p className="text-sm text-slate-400">Please contact your department if you cannot see your timetable</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Student Info Card */}
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-2xl font-bold">
                    {studentInfo.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{studentInfo.name}</h2>
                    <p className="text-slate-400">{studentInfo.regNumber}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="border-white/10 text-cyan-400">
                        {studentInfo.department?.code} - {studentInfo.level} Level
                      </Badge>
                      {coCourses.length > 0 && (
                        <Badge variant="outline" className="border-amber-500/20 text-amber-400">
                          {coCourses.length} Carry-over(s)
                        </Badge>
                      )}
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
                  <Button
                    variant="outline"
                    className="border-white/10 text-slate-300 hover:text-white"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CO Warning */}
          {coCourses.length > 0 && (
            <Alert className="bg-amber-500/10 border-amber-500/20">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <AlertDescription className="text-amber-400">
                You have <strong>{coCourses.length}</strong> carry-over/spillover course(s):{' '}
                {coCourses.map(c => c.courseCode).join(', ')}. Please ensure these don't clash with your current courses.
              </AlertDescription>
            </Alert>
          )}

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-white/5 border-white/10">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{studentInfo.courses.length}</div>
                    <div className="text-xs text-slate-400">Registered Courses</div>
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
                    <div className="text-2xl font-bold text-white">{sortedDates.length}</div>
                    <div className="text-xs text-slate-400">Exam Days</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/20 to-yellow-500/20 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{coCourses.length}</div>
                    <div className="text-xs text-slate-400">Carry-overs</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{examSlots.length}</div>
                    <div className="text-xs text-slate-400">Exams Scheduled</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Timetable */}
          {examSlots.length === 0 ? (
            <Card className="bg-white/5 border-white/10">
              <CardContent className="py-12 text-center">
                <Calendar className="w-12 h-12 mx-auto text-slate-500 mb-4" />
                <p className="text-white font-medium">No exams scheduled yet</p>
                <p className="text-sm text-slate-400">Your timetable will appear here once exams are scheduled</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
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
                        .map((slot) => {
                          const courseInfo = studentInfo.courses.find(c => c.courseId === slot.course.id)
                          const isCO = courseInfo && courseInfo.status !== 'REGISTERED'

                          return (
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
                                    {isCO && (
                                      <Badge variant="outline" className="border-amber-500/20 text-amber-400">
                                        {courseInfo?.status === 'CARRY_OVER' ? 'CO' : 'Spillover'}
                                      </Badge>
                                    )}
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
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
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
