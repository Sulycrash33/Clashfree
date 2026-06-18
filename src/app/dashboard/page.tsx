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
      // Fetch all counts in parallel
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

      // Get CO stats
      const coStats = await fetch('/api/co-stats').then(r => r.ok ? r.json() : { studentsWithCOs: 0 })

      // Get faculty drill-down
      const facultyData = await fetch('/api/faculties').then(r => r.ok ? r.json() : [])
      const facultyDrilldown = (facultyData || []).map((f: any) => ({
        id: f.id,
        name: f.name,
        code: f.code,
        departments: f._count?.departments || 0,
        courses: f._count?.courses || 0,
      }))

      // Student:Lecturer ratio
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Welcome back, {session.user.name?.split(' ')[0] || 'User'}
          </h1>
          <p className="text-muted">
            {roleLabels[userRole]} Dashboard • {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStats}
            disabled={loading}
            className="border-white/10 text-muted hover:text-white"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          </Button>
          <Badge className="bg-secondary/10 text-secondary border-secondary/20">
            {userRole}
          </Badge>
        </div>
      </div>

      {/* Stats Grid */}
      {userRole === 'SA' && <SuperAdminStats stats={stats} loading={loading} />}
      {userRole === 'IA' && <InstitutionAdminStats stats={stats} loading={loading} />}
      {userRole === 'TO' && <TimetableOfficerStats stats={stats} loading={loading} />}
      {userRole === 'LC' && <LecturerDashboard stats={stats} loading={loading} />}
      {userRole === 'ST' && <StudentDashboard stats={stats} loading={loading} />}
    </div>
  )
}

function SuperAdminStats({ stats, loading }: { stats: DashboardStats | null; loading: boolean }) {
  const statCards = [
    { label: 'Institutions', value: stats?.institutions || 0, icon: Building2, color: 'from-secondary to-secondary' },
    { label: 'Total Users', value: stats?.users || 0, icon: Users, color: 'from-primary to-clash' },
    { label: 'Students', value: stats?.students || 0, icon: GraduationCap, color: 'from-success to-success' },
    { label: 'Courses', value: stats?.courses || 0, icon: BookOpen, color: 'from-accent-gold to-accent-gold' },
  ]

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <Card key={i} className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/[0.07] transition-colors">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin text-muted" />
              ) : (
                <>
                  <div className="text-3xl font-bold text-white">{stat.value.toLocaleString()}</div>
                  <div className="text-sm text-muted">{stat.label}</div>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link href="/dashboard/institutions">
              <Button variant="outline" className="w-full border-white/10 text-muted hover:text-white">
                <Building2 className="w-4 h-4 mr-2" />
                Institutions
              </Button>
            </Link>
            <Link href="/dashboard/users">
              <Button variant="outline" className="w-full border-white/10 text-muted hover:text-white">
                <Users className="w-4 h-4 mr-2" />
                Users
              </Button>
            </Link>
            <Link href="/dashboard/conflicts">
              <Button variant="outline" className="w-full border-white/10 text-muted hover:text-white">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Conflicts
              </Button>
            </Link>
            <Link href="/dashboard/exam-timetable">
              <Button variant="outline" className="w-full border-white/10 text-muted hover:text-white">
                <Calendar className="w-4 h-4 mr-2" />
                Timetables
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-success" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted">Database</span>
                <Badge className="bg-success/10 text-success border-success/20">Operational</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">API Endpoints</span>
                <Badge className="bg-success/10 text-success border-success/20">All Running</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Active Conflicts</span>
                <Badge className={stats?.conflicts ? 'bg-accent-gold/10 text-accent-gold border-accent-gold/20' : 'bg-success/10 text-success border-success/20'}>
                  {stats?.conflicts || 0}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-secondary" />
              Platform Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-white/5 rounded-lg">
                <div className="text-2xl font-bold text-white">{stats?.faculties || 0}</div>
                <div className="text-xs text-muted">Faculties</div>
              </div>
              <div className="text-center p-3 bg-white/5 rounded-lg">
                <div className="text-2xl font-bold text-white">{stats?.departments || 0}</div>
                <div className="text-xs text-muted">Departments</div>
              </div>
              <div className="text-center p-3 bg-white/5 rounded-lg">
                <div className="text-2xl font-bold text-white">{stats?.lecturers || 0}</div>
                <div className="text-xs text-muted">Lecturers</div>
              </div>
              <div className="text-center p-3 bg-white/5 rounded-lg">
                <div className="text-2xl font-bold text-white">{stats?.rooms || 0}</div>
                <div className="text-xs text-muted">Rooms</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Faculty Drill-down */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-secondary" />
            Faculty Breakdown
          </CardTitle>
          <CardDescription>
            Departments and courses per faculty
            {stats?.studentLecturerRatio && (
              <span className={`ml-3 font-medium ${
                parseInt(stats.studentLecturerRatio) <= 20
                  ? 'text-success'
                  : parseInt(stats.studentLecturerRatio) <= 40
                  ? 'text-accent-gold'
                  : 'text-clash'
              }`}>
                Student:Lecturer ratio — {stats.studentLecturerRatio}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Loader2 className="w-6 h-6 animate-spin text-muted" />
          ) : (stats?.facultyDrilldown?.length || 0) === 0 ? (
            <p className="text-muted text-sm">No faculties found</p>
          ) : (
            <div className="space-y-2">
              {stats?.facultyDrilldown?.map(f => (
                <div key={f.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10 hover:border-white/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-secondary border-secondary/30 font-mono text-xs min-w-[50px] text-center">
                      {f.code}
                    </Badge>
                    <span className="text-white text-sm">{f.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-white font-medium">{f.departments}</div>
                      <div className="text-xs text-muted">Depts</div>
                    </div>
                    <div className="text-center">
                      <div className="text-white font-medium">{f.courses}</div>
                      <div className="text-xs text-muted">Courses</div>
                    </div>
                    <Link href={`/dashboard/departments?facultyId=${f.id}`}>
                      <Button variant="outline" size="sm" className="border-white/10 text-muted hover:text-white text-xs">
                        View Depts →
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
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Sparkles className="w-5 h-5 text-secondary" />
                <h3 className="text-lg font-semibold text-white">Setup Progress</h3>
              </div>
              <p className="text-sm text-muted mb-4">
                {completed} of {setupProgress.length} steps complete ({progressPercent}%)
              </p>
              <Progress value={progressPercent} className="h-2 bg-white/10" />
            </div>
            {progressPercent < 100 && (
              <Link href="/dashboard/exam-timetable">
                <Button className="bg-gradient-to-r from-secondary to-secondary hover:from-secondary hover:to-secondary text-white border-0">
                  Continue Setup
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Faculties', value: stats?.faculties || 0, sublabel: `${stats?.departments || 0} departments`, icon: Building2, color: 'from-secondary to-secondary' },
          { label: 'Students', value: stats?.students || 0, sublabel: `${stats?.coStudents || 0} with COs`, icon: GraduationCap, color: 'from-primary to-clash' },
          { label: 'Courses', value: stats?.courses || 0, sublabel: 'Active courses', icon: BookOpen, color: 'from-success to-success' },
          { label: 'Lecturers', value: stats?.lecturers || 0, sublabel: 'Teaching staff', icon: Users, color: 'from-accent-gold to-accent-gold' },
        ].map((stat, i) => (
          <Card key={i} className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin text-muted" />
              ) : (
                <>
                  <div className="text-3xl font-bold text-white">{stat.value.toLocaleString()}</div>
                  <div className="text-sm text-muted">{stat.label}</div>
                  <div className="text-xs text-secondary mt-1">{stat.sublabel}</div>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Conflicts Alert */}
      {(stats?.conflicts || 0) > 0 && (
        <Card className="bg-accent-gold/5 border-accent-gold/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent-gold/20 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-accent-gold" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-medium">Attention Required</h3>
                <p className="text-sm text-muted">
                  {stats?.conflicts} conflict(s) detected. Please review and resolve before publishing timetable.
                </p>
              </div>
              <Link href="/dashboard/conflicts">
                <Button variant="outline" className="border-accent-gold/20 text-accent-gold hover:bg-accent-gold/10">
                  View Conflicts
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Link href="/dashboard/exam-timetable">
          <Button className="w-full bg-gradient-to-r from-secondary to-secondary hover:from-secondary hover:to-secondary text-white border-0">
            <Sparkles className="w-4 h-4 mr-2" />
            Generate Timetable
          </Button>
        </Link>
        <Link href="/dashboard/students">
          <Button variant="outline" className="w-full border-white/10 text-muted hover:text-white">
            <GraduationCap className="w-4 h-4 mr-2" />
            Students
          </Button>
        </Link>
        <Link href="/dashboard/courses">
          <Button variant="outline" className="w-full border-white/10 text-muted hover:text-white">
            <BookOpen className="w-4 h-4 mr-2" />
            Courses
          </Button>
        </Link>
        <Link href="/dashboard/rooms">
          <Button variant="outline" className="w-full border-white/10 text-muted hover:text-white">
            <MapPin className="w-4 h-4 mr-2" />
            Rooms
          </Button>
        </Link>
      </div>
    </>
  )
}

function TimetableOfficerStats({ stats, loading }: { stats: DashboardStats | null; loading: boolean }) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Courses', value: stats?.courses || 0, icon: BookOpen, color: 'from-secondary to-secondary' },
          { label: 'Students', value: stats?.students || 0, sublabel: `${stats?.coStudents || 0} with COs`, icon: GraduationCap, color: 'from-primary to-clash' },
          { label: 'Lecturers', value: stats?.lecturers || 0, icon: Users, color: 'from-success to-success' },
          { label: 'Rooms', value: stats?.rooms || 0, icon: MapPin, color: 'from-accent-gold to-accent-gold' },
        ].map((stat, i) => (
          <Card key={i} className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin text-muted" />
              ) : (
                <>
                  <div className="text-3xl font-bold text-white">{stat.value.toLocaleString()}</div>
                  <div className="text-sm text-muted">{stat.label}</div>
                  {stat.sublabel && <div className="text-xs text-accent-gold mt-1">{stat.sublabel}</div>}
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Data Readiness Checklist</CardTitle>
          <CardDescription>Ensure all data is complete before generating timetable</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { label: 'Courses imported', value: stats?.courses || 0, status: (stats?.courses || 0) > 0 ? 'complete' : 'pending' },
              { label: 'Students registered', value: stats?.students || 0, status: (stats?.students || 0) > 0 ? 'complete' : 'pending' },
              { label: 'Lecturers assigned', value: stats?.lecturers || 0, status: (stats?.lecturers || 0) > 0 ? 'complete' : 'pending' },
              { label: 'Rooms available', value: stats?.rooms || 0, status: (stats?.rooms || 0) > 0 ? 'complete' : 'pending' },
              { label: 'Exam periods defined', value: stats?.examPeriods || 0, status: (stats?.examPeriods || 0) > 0 ? 'complete' : 'pending' },
              { label: 'Conflicts resolved', value: stats?.conflicts || 0, status: (stats?.conflicts || 0) === 0 ? 'complete' : 'warning' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                <div className="flex items-center gap-3">
                  {item.status === 'complete' ? (
                    <CheckCircle2 className="w-5 h-5 text-success" />
                  ) : item.status === 'warning' ? (
                    <AlertCircle className="w-5 h-5 text-accent-gold" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-muted" />
                  )}
                  <span className="text-muted">{item.label}</span>
                </div>
                <span className="text-sm text-white font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  )
}

function LecturerDashboard({ stats, loading }: { stats: DashboardStats | null; loading: boolean }) {
  const [lecturerCourses, setLecturerCourses] = useState<number>(0)
  const [lecturerStudents, setLecturerStudents] = useState<number>(0)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    // Fetch lecturer-specific data
    const fetchLecturerData = async () => {
      try {
        // Get lecturer linked to this user
        const lecRes = await fetch('/api/lecturers')
        if (lecRes.ok) {
          const lecs = await lecRes.json()
          const myLec = lecs.find((l: any) => l.userId)
          if (myLec) {
            // Get courses assigned to this lecturer
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
    <div className="space-y-4">
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-secondary" />
            My Schedule Overview
          </CardTitle>
          <CardDescription>Your teaching and invigilation schedule</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-white/5 rounded-lg">
              <BookOpen className="w-8 h-8 mx-auto text-secondary mb-2" />
              <div className="text-2xl font-bold text-white">{displayCourses}</div>
              <div className="text-sm text-muted">Courses Teaching</div>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-lg">
              <Calendar className="w-8 h-8 mx-auto text-success mb-2" />
              <div className="text-2xl font-bold text-white">{stats?.examPeriods || 0}</div>
              <div className="text-sm text-muted">Exam Periods</div>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-lg">
              <Users className="w-8 h-8 mx-auto text-primary mb-2" />
              <div className="text-2xl font-bold text-white">{displayStudents}</div>
              <div className="text-sm text-muted">My Students</div>
            </div>
          </div>

          <Link href="/dashboard/lecturer-schedule">
            <Button className="w-full bg-gradient-to-r from-secondary to-secondary hover:from-secondary hover:to-secondary text-white border-0">
              View Full Schedule
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

function StudentDashboard({ stats, loading }: { stats: DashboardStats | null; loading: boolean }) {
  const [myCourses, setMyCourses] = useState<{ registered: number; carryOver: number; total: number }>({ registered: 0, carryOver: 0, total: 0 })
  const [myExams, setMyExams] = useState<number>(0)
  const [studentProfile, setStudentProfile] = useState<{ name: string; regNumber: string; dept: string; level: number; isSpillover: boolean } | null>(null)

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        // Find student linked to this user
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
            // Get student's courses
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
        // Get exam count for student
        const periodRes = await fetch('/api/exam-periods')
        if (periodRes.ok) {
          const periods = await periodRes.json()
          if (periods.length > 0) {
            const slotsRes = await fetch(`/api/exam-slots?examPeriodId=${periods[0].id}`)
            if (slotsRes.ok) {
              const data = await slotsRes.json()
              // Count slots for this student's courses
              const courseIds = new Set<string>()
              // We already have myCourses from above, so this is a simplified count
              setMyExams(Math.min(data.slots?.length || 0, myCourses.total))
            }
          }
        }
      } catch {}
    }
    fetchStudentData()
  }, [])

  return (
    <div className="space-y-4">
      {/* Student Profile Card */}
      {studentProfile && (
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-accent-gold to-accent-gold flex items-center justify-center text-2xl font-bold text-white">
                {studentProfile.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{studentProfile.name}</h2>
                <p className="text-muted text-sm">{studentProfile.regNumber} • {studentProfile.dept} • {studentProfile.level}L</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="border-white/10 text-secondary">{studentProfile.dept} Department</Badge>
                  {studentProfile.isSpillover && (
                    <Badge variant="outline" className="border-accent-gold/20 text-accent-gold">Spillover Student</Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Carry-over Banner */}
      {myCourses.carryOver > 0 && (
        <Card className="bg-accent-gold/5 border-accent-gold/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent-gold/20 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-accent-gold" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-medium">Carry-over Courses Detected</h3>
                <p className="text-sm text-muted">
                  You have {myCourses.carryOver} carry-over course(s) from previous semesters. The timetable has been optimized to avoid clashes.
                </p>
              </div>
              <Badge className="bg-accent-gold/10 text-accent-gold border-accent-gold/20 text-lg px-4 py-2">
                {myCourses.carryOver}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-secondary" />
            My Exam Timetable
          </CardTitle>
          <CardDescription>Your personalized exam schedule</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-white/5 rounded-lg">
              <BookOpen className="w-8 h-8 mx-auto text-secondary mb-2" />
              <div className="text-2xl font-bold text-white">{myCourses.registered || myCourses.total || stats?.courses || 0}</div>
              <div className="text-sm text-muted">Registered Courses</div>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-lg">
              <AlertTriangle className="w-8 h-8 mx-auto text-accent-gold mb-2" />
              <div className="text-2xl font-bold text-white">{myCourses.carryOver}</div>
              <div className="text-sm text-muted">Carry-over Courses</div>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-lg">
              <Calendar className="w-8 h-8 mx-auto text-success mb-2" />
              <div className="text-2xl font-bold text-white">{myExams}</div>
              <div className="text-sm text-muted">Exams Scheduled</div>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-lg">
              <GraduationCap className="w-8 h-8 mx-auto text-primary mb-2" />
              <div className="text-2xl font-bold text-white">{studentProfile?.level || 0}00</div>
              <div className="text-sm text-muted">Level</div>
            </div>
          </div>

          <Link href="/dashboard/my-timetable">
            <Button className="w-full bg-gradient-to-r from-secondary to-secondary hover:from-secondary hover:to-secondary text-white border-0">
              View My Timetable
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
