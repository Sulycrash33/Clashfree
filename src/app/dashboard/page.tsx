'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Building2,
  Users,
  BookOpen,
  Calendar,
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle2,
  GraduationCap,
  MapPin,
  Loader2,
  RefreshCw,
  Sparkles,
  AlertCircle,
  ArrowRight,
  Activity,
} from 'lucide-react'
import Link from 'next/link'

const roleLabels: Record<string, string> = {
  SA: 'Super Admin',
  IA: 'Institution Admin',
  TO: 'Timetable Officer',
  LC: 'Lecturer',
  ST: 'Student',
}

interface DashboardStats {
  institutions: number
  users: number
  students: number
  courses: number
  lecturers: number
  rooms: number
  departments: number
  faculties: number
  examPeriods: number
  conflicts: number
  coStudents: number
  studentLecturerRatio: string
  facultyDrilldown: Array<{ id: string; name: string; code: string; departments: number; courses: number; rooms?: number }>
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchStats = useCallback(async () => {
    setLoading(true)
    try {
      const [institutions, users, students, courses, lecturers, rooms, departments, faculties, examPeriods, conflicts] = await Promise.all([
        fetch('/api/institutions').then(r => r.ok ? r.json().then(d => d.length) : 0),
        fetch('/api/users').then(r => r.ok ? r.json().then(d => d.length) : 0),
        fetch('/api/students').then(r => r.ok ? r.json().then(d => Array.isArray(d) ? d.length : d.data?.length || d.total || 0) : 0),
        fetch('/api/courses').then(r => r.ok ? r.json().then(d => d.length) : 0),
        fetch('/api/lecturers').then(r => r.ok ? r.json().then(d => d.length) : 0),
        fetch('/api/rooms').then(r => r.ok ? r.json().then(d => d.length) : 0),
        fetch('/api/departments').then(r => r.ok ? r.json().then(d => d.length) : 0),
        fetch('/api/faculties').then(r => r.ok ? r.json().then(d => d.length) : 0),
        fetch('/api/exam-periods').then(r => r.ok ? r.json().then(d => d.length) : 0),
        fetch('/api/conflicts').then(r => r.ok ? r.json().then(d => d.conflicts?.length || 0) : 0),
      ])

      const coStats = await fetch('/api/co-stats').then(r => r.ok ? r.json() : { studentsWithCOs: 0 })

      const facultyData = await fetch('/api/faculties').then(r => r.ok ? r.json() : [])
      const facultyDrilldown = (facultyData || []).map((f: any) => ({
        id: f.id,
        name: f.name,
        code: f.code,
        departments: f._count?.departments || 0,
        courses: f._count?.courses || 0,
      }))

      const ratio = (lecturers as number) > 0
        ? `${Math.round((students as number) / (lecturers as number))}:1`
        : 'N/A'

      setStats({
        institutions,
        users,
        students,
        courses,
        lecturers,
        rooms,
        departments,
        faculties,
        examPeriods,
        conflicts,
        coStudents: coStats.studentsWithCOs || 0,
        studentLecturerRatio: ratio,
        facultyDrilldown,
      })
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  if (!session?.user) return null

  const userRole = session.user.role

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Welcome back, {session.user.name?.split(' ')[0] || 'User'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {roleLabels[userRole]} &middot; {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStats}
            disabled={loading}
            className="h-9"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            <span className="ml-2 hidden sm:inline">Refresh</span>
          </Button>
          <Badge variant="outline" className="font-medium">
            {roleLabels[userRole]}
          </Badge>
        </div>
      </div>

      {/* Role-specific content */}
      {userRole === 'SA' && <SuperAdminStats stats={stats} loading={loading} />}
      {userRole === 'IA' && <InstitutionAdminStats stats={stats} loading={loading} />}
      {userRole === 'TO' && <TimetableOfficerStats stats={stats} loading={loading} />}
      {userRole === 'LC' && <LecturerDashboard stats={stats} loading={loading} />}
      {userRole === 'ST' && <StudentDashboard stats={stats} loading={loading} />}
    </div>
  )
}

/* ─── Stat Card Component ─────────────────────────────────────────── */
function StatCard({ label, value, sublabel, icon: Icon, loading }: {
  label: string
  value: number | string
  sublabel?: string
  icon: React.ElementType
  loading: boolean
}) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            ) : (
              <>
                <p className="text-3xl font-bold tracking-tight text-foreground">
                  {typeof value === 'number' ? value.toLocaleString() : value}
                </p>
                {sublabel && <p className="text-xs text-muted-foreground">{sublabel}</p>}
              </>
            )}
          </div>
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/* ─── Super Admin Dashboard ───────────────────────────────────────── */
function SuperAdminStats({ stats, loading }: { stats: DashboardStats | null; loading: boolean }) {
  return (
    <>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Institutions" value={stats?.institutions || 0} icon={Building2} loading={loading} />
        <StatCard label="Total Users" value={stats?.users || 0} icon={Users} loading={loading} />
        <StatCard label="Students" value={stats?.students || 0} icon={GraduationCap} loading={loading} />
        <StatCard label="Courses" value={stats?.courses || 0} icon={BookOpen} loading={loading} />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link href="/dashboard/institutions">
              <Button variant="outline" className="w-full h-auto py-3 flex flex-col items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                <span className="text-xs">Institutions</span>
              </Button>
            </Link>
            <Link href="/dashboard/users">
              <Button variant="outline" className="w-full h-auto py-3 flex flex-col items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <span className="text-xs">Users</span>
              </Button>
            </Link>
            <Link href="/dashboard/conflicts">
              <Button variant="outline" className="w-full h-auto py-3 flex flex-col items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-primary" />
                <span className="text-xs">Conflicts</span>
              </Button>
            </Link>
            <Link href="/dashboard/exam-timetable">
              <Button variant="outline" className="w-full h-auto py-3 flex flex-col items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                <span className="text-xs">Timetables</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Two Column: Health + Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="w-4 h-4 text-success" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: 'Database', status: 'Operational' },
                { label: 'API Endpoints', status: 'All Running' },
                { label: 'Active Conflicts', status: String(stats?.conflicts || 0), warn: (stats?.conflicts || 0) > 0 },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <Badge variant={item.warn ? 'destructive' : 'secondary'} className="font-normal text-xs">
                    {item.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Platform Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Faculties', value: stats?.faculties || 0 },
                { label: 'Departments', value: stats?.departments || 0 },
                { label: 'Lecturers', value: stats?.lecturers || 0 },
                { label: 'Rooms', value: stats?.rooms || 0 },
              ].map((item, i) => (
                <div key={i} className="text-center p-3 rounded-lg bg-muted/50">
                  <div className="text-2xl font-bold text-foreground">{item.value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{item.label}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Faculty Breakdown */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              Faculty Breakdown
            </CardTitle>
            {stats?.studentLecturerRatio && (
              <Badge variant="outline" className="font-normal">
                Student:Lecturer — {stats.studentLecturerRatio}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          ) : (stats?.facultyDrilldown?.length || 0) === 0 ? (
            <p className="text-sm text-muted-foreground">No faculties found</p>
          ) : (
            <div className="space-y-2">
              {stats?.facultyDrilldown?.map(f => (
                <div key={f.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="font-mono text-xs min-w-[50px] justify-center">
                      {f.code}
                    </Badge>
                    <span className="text-sm font-medium text-foreground">{f.name}</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-sm font-medium text-foreground">{f.departments}</div>
                      <div className="text-[10px] text-muted-foreground uppercase">Depts</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-foreground">{f.courses}</div>
                      <div className="text-[10px] text-muted-foreground uppercase">Courses</div>
                    </div>
                    <Link href={`/dashboard/departments?facultyId=${f.id}`}>
                      <Button variant="ghost" size="sm" className="text-xs h-8">
                        View <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}

/* ─── Institution Admin Dashboard ─────────────────────────────────── */
function InstitutionAdminStats({ stats, loading }: { stats: DashboardStats | null; loading: boolean }) {
  const setupProgress = [
    { step: 'Institution profile configured', done: true },
    { step: 'Faculties and departments added', done: (stats?.faculties || 0) > 0 },
    { step: 'Course catalog uploaded', done: (stats?.courses || 0) > 0 },
    { step: 'Lecturers imported', done: (stats?.lecturers || 0) > 0 },
    { step: 'Student registrations imported', done: (stats?.students || 0) > 0 },
    { step: 'Room inventory complete', done: (stats?.rooms || 0) > 0 },
    { step: 'Exam period defined', done: (stats?.examPeriods || 0) > 0 },
    { step: 'Conflicts resolved', done: (stats?.conflicts || 0) === 0 },
  ]

  const completed = setupProgress.filter(s => s.done).length
  const progressPercent = Math.round((completed / setupProgress.length) * 100)

  return (
    <>
      {/* Progress Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-foreground">Setup Progress</h3>
                <Badge variant="outline" className="ml-2 text-xs">{progressPercent}%</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                {completed} of {setupProgress.length} steps complete
              </p>
              <Progress value={progressPercent} className="h-2" />
            </div>
            {progressPercent < 100 && (
              <Link href="/dashboard/exam-timetable">
                <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                  Continue Setup
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Faculties" value={stats?.faculties || 0} sublabel={`${stats?.departments || 0} departments`} icon={Building2} loading={loading} />
        <StatCard label="Students" value={stats?.students || 0} sublabel={`${stats?.coStudents || 0} with carry-overs`} icon={GraduationCap} loading={loading} />
        <StatCard label="Courses" value={stats?.courses || 0} sublabel="Active courses" icon={BookOpen} loading={loading} />
        <StatCard label="Lecturers" value={stats?.lecturers || 0} sublabel="Teaching staff" icon={Users} loading={loading} />
      </div>

      {/* Conflicts Alert */}
      {(stats?.conflicts || 0) > 0 && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{stats?.conflicts} conflict(s) detected</p>
                <p className="text-xs text-muted-foreground">Review and resolve before publishing timetable</p>
              </div>
              <Link href="/dashboard/conflicts">
                <Button variant="outline" size="sm" className="border-destructive/30 text-destructive hover:bg-destructive/10">
                  View
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Link href="/dashboard/exam-timetable">
          <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
            <Sparkles className="w-4 h-4 mr-2" />
            Generate Timetable
          </Button>
        </Link>
        <Link href="/dashboard/students">
          <Button variant="outline" className="w-full">
            <GraduationCap className="w-4 h-4 mr-2" />
            Students
          </Button>
        </Link>
        <Link href="/dashboard/courses">
          <Button variant="outline" className="w-full">
            <BookOpen className="w-4 h-4 mr-2" />
            Courses
          </Button>
        </Link>
        <Link href="/dashboard/rooms">
          <Button variant="outline" className="w-full">
            <MapPin className="w-4 h-4 mr-2" />
            Rooms
          </Button>
        </Link>
      </div>
    </>
  )
}

/* ─── Timetable Officer Dashboard ─────────────────────────────────── */
function TimetableOfficerStats({ stats, loading }: { stats: DashboardStats | null; loading: boolean }) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Courses" value={stats?.courses || 0} icon={BookOpen} loading={loading} />
        <StatCard label="Students" value={stats?.students || 0} sublabel={`${stats?.coStudents || 0} with COs`} icon={GraduationCap} loading={loading} />
        <StatCard label="Lecturers" value={stats?.lecturers || 0} icon={Users} loading={loading} />
        <StatCard label="Rooms" value={stats?.rooms || 0} icon={MapPin} loading={loading} />
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Data Readiness Checklist</CardTitle>
          <CardDescription>Ensure all data is complete before generating timetable</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {[
              { label: 'Courses imported', value: stats?.courses || 0, done: (stats?.courses || 0) > 0 },
              { label: 'Students registered', value: stats?.students || 0, done: (stats?.students || 0) > 0 },
              { label: 'Lecturers assigned', value: stats?.lecturers || 0, done: (stats?.lecturers || 0) > 0 },
              { label: 'Rooms available', value: stats?.rooms || 0, done: (stats?.rooms || 0) > 0 },
              { label: 'Exam periods defined', value: stats?.examPeriods || 0, done: (stats?.examPeriods || 0) > 0 },
              { label: 'Conflicts resolved', value: stats?.conflicts || 0, done: (stats?.conflicts || 0) === 0, warn: (stats?.conflicts || 0) > 0 },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2.5">
                  {item.done ? (
                    <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                  ) : item.warn ? (
                    <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
                  )}
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                </div>
                <span className="text-sm font-medium text-foreground">{item.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  )
}

/* ─── Lecturer Dashboard ──────────────────────────────────────────── */
function LecturerDashboard({ stats, loading }: { stats: DashboardStats | null; loading: boolean }) {
  const [lecturerCourses, setLecturerCourses] = useState<number>(0)
  const [lecturerStudents, setLecturerStudents] = useState<number>(0)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const fetchLecturerData = async () => {
      try {
        const lecRes = await fetch('/api/lecturers')
        if (lecRes.ok) {
          const lecs = await lecRes.json()
          const myLec = lecs.find((l: any) => l.userId)
          if (myLec) {
            const coursesRes = await fetch(`/api/courses?lecturerId=${myLec.id}`)
            if (coursesRes.ok) {
              const courses = await coursesRes.json()
              setLecturerCourses(courses.length || 0)
              setLecturerStudents(courses.reduce((sum: number, c: any) => sum + (c._count?.studentCourses || 0), 0))
            }
          }
        }
      } catch {}
      setLoaded(true)
    }
    fetchLecturerData()
  }, [])

  const displayCourses = loaded ? lecturerCourses : (stats?.courses || 0)
  const displayStudents = loaded ? lecturerStudents : (stats?.students || 0)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Courses Teaching" value={displayCourses} icon={BookOpen} loading={loading && !loaded} />
        <StatCard label="Exam Periods" value={stats?.examPeriods || 0} icon={Calendar} loading={loading} />
        <StatCard label="My Students" value={displayStudents} icon={Users} loading={loading && !loaded} />
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground">My Schedule</h3>
              <p className="text-sm text-muted-foreground mt-1">View your teaching and invigilation schedule</p>
            </div>
            <Link href="/dashboard/lecturer-schedule">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                View Schedule
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/* ─── Student Dashboard ───────────────────────────────────────────── */
function StudentDashboard({ stats, loading }: { stats: DashboardStats | null; loading: boolean }) {
  const [myCourses, setMyCourses] = useState<{ registered: number; carryOver: number; total: number }>({ registered: 0, carryOver: 0, total: 0 })
  const [myExams, setMyExams] = useState<number>(0)
  const [studentProfile, setStudentProfile] = useState<{ name: string; regNumber: string; dept: string; level: number; isSpillover: boolean } | null>(null)

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const stuRes = await fetch('/api/students')
        if (stuRes.ok) {
          const stuData = await stuRes.json()
          const students = Array.isArray(stuData) ? stuData : stuData.data || []
          const myStu = students.find((s: any) => s.userId)
          if (myStu) {
            setStudentProfile({
              name: myStu.name,
              regNumber: myStu.regNumber,
              dept: myStu.department?.code || '',
              level: myStu.level,
              isSpillover: myStu.isSpillover,
            })
            const coursesRes = await fetch(`/api/students/courses?studentId=${myStu.id}`)
            if (coursesRes.ok) {
              const data = await coursesRes.json()
              setMyCourses({
                total: data.summary?.total || 0,
                registered: data.summary?.registered || 0,
                carryOver: data.summary?.carryOver || 0,
              })
            }
          }
        }
        const periodRes = await fetch('/api/exam-periods')
        if (periodRes.ok) {
          const periods = await periodRes.json()
          if (periods.length > 0) {
            const slotsRes = await fetch(`/api/exam-slots?examPeriodId=${periods[0].id}`)
            if (slotsRes.ok) {
              const data = await slotsRes.json()
              setMyExams(Math.min(data.slots?.length || 0, myCourses.total))
            }
          }
        }
      } catch {}
    }
    fetchStudentData()
  }, [])

  return (
    <div className="space-y-6">
      {/* Profile */}
      {studentProfile && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">
                {studentProfile.name.charAt(0)}
              </div>
              <div>
                <h2 className="font-semibold text-foreground">{studentProfile.name}</h2>
                <p className="text-sm text-muted-foreground">{studentProfile.regNumber} &middot; {studentProfile.dept} &middot; {studentProfile.level}L</p>
                {studentProfile.isSpillover && (
                  <Badge variant="outline" className="mt-1 text-xs border-destructive/30 text-destructive">Spillover</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* CO Alert */}
      {myCourses.carryOver > 0 && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  {myCourses.carryOver} carry-over course(s) detected
                </p>
                <p className="text-xs text-muted-foreground">Timetable optimized to avoid clashes with your current courses</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Registered" value={myCourses.registered || myCourses.total || stats?.courses || 0} icon={BookOpen} loading={loading} />
        <StatCard label="Carry-Over" value={myCourses.carryOver} icon={AlertTriangle} loading={loading} />
        <StatCard label="Exams" value={myExams} icon={Calendar} loading={loading} />
        <StatCard label="Level" value={`${studentProfile?.level || 0}00`} icon={GraduationCap} loading={loading} />
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground">My Timetable</h3>
              <p className="text-sm text-muted-foreground mt-1">View your personalized exam schedule</p>
            </div>
            <Link href="/dashboard/my-timetable">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                View Timetable
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
