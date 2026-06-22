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
  'from-secondary/20 to-secondary/20 border-secondary/30',
  'from-primary/20 to-clash/20 border-primary/30',
  'from-accent-gold/20 to-accent-gold/20 border-accent-gold/30',
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
      <Alert className="bg-accent-gold/10 border-accent-gold/20">
        <AlertDescription className="text-accent-gold">
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
          <Loader2 className="w-8 h-8 animate-spin text-secondary" />
        </div>
      ) : !studentInfo ? (
        <Card className="bg-foreground/5 border-foreground/10">
          <CardContent className="py-12 text-center">
            <User className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-foreground font-medium">No student profile found</p>
            <p className="text-sm text-muted-foreground">Please contact your department if you cannot see your timetable</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Student Info Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-secondary to-secondary flex items-center justify-center text-2xl font-bold">
                    {studentInfo.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">{studentInfo.name}</h2>
                    <p className="text-muted-foreground">{studentInfo.regNumber}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="border-foreground/10 text-secondary">
                        {studentInfo.department?.code} - {studentInfo.level} Level
                      </Badge>
                      {coCourses.length > 0 && (
                        <Badge variant="outline" className="border-accent-gold/20 text-accent-gold">
                          {coCourses.length} Carry-over(s)
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                    <SelectTrigger className="w-64 bg-foreground/5 border-foreground/10 text-foreground">
                      <SelectValue placeholder="Select exam period" />
                    </SelectTrigger>
                    <SelectContent className="bg-muted border-foreground/10">
                      {examPeriods.map((p) => (
                        <SelectItem key={p.id} value={p.id} className="text-foreground">
                          {p.name} - {p.session} Sem {p.semester}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    className="border-foreground/10 text-muted-foreground hover:text-foreground"
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
            <Alert className="bg-accent-gold/10 border-accent-gold/20">
              <AlertTriangle className="w-4 h-4 text-accent-gold" />
              <AlertDescription className="text-accent-gold">
                You have <strong>{coCourses.length}</strong> carry-over/spillover course(s):{' '}
                {coCourses.map(c => c.courseCode).join(', ')}. Please ensure these don't clash with your current courses.
              </AlertDescription>
            </Alert>
          )}

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-foreground/5 border-foreground/10">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-secondary/20 to-secondary/20 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">{studentInfo.courses.length}</div>
                    <div className="text-xs text-muted-foreground">Registered Courses</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-foreground/5 border-foreground/10">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-success/20 to-success/20 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">{sortedDates.length}</div>
                    <div className="text-xs text-muted-foreground">Exam Days</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-foreground/5 border-foreground/10">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent-gold/20 to-accent-gold/20 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-accent-gold" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">{coCourses.length}</div>
                    <div className="text-xs text-muted-foreground">Carry-overs</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-foreground/5 border-foreground/10">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-clash/20 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">{examSlots.length}</div>
                    <div className="text-xs text-muted-foreground">Exams Scheduled</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Timetable */}
          {examSlots.length === 0 ? (
            <Card className="bg-foreground/5 border-foreground/10">
              <CardContent className="py-12 text-center">
                <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-foreground font-medium">No exams scheduled yet</p>
                <p className="text-sm text-muted-foreground">Your timetable will appear here once exams are scheduled</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {sortedDates.map((date) => (
                <Card key={date} className="bg-foreground/5 border-foreground/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg text-foreground flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-secondary" />
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
                                    <Badge variant="outline" className="border-foreground/20 text-secondary font-mono">
                                      {slot.course.code}
                                    </Badge>
                                    <Badge variant="secondary" className="bg-foreground/10 text-muted-foreground">
                                      {slotLabels[slot.slotNumber - 1]}
                                    </Badge>
                                    {isCO && (
                                      <Badge variant="outline" className="border-accent-gold/20 text-accent-gold">
                                        {courseInfo?.status === 'CARRY_OVER' ? 'CO' : 'Spillover'}
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-foreground font-medium">{slot.course.name}</p>
                                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
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
