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
        fetch('/api/students').then(r => r.ok ? r.json().then(d => d.length) : 0),
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
          <p className="text-slate-400">
            {roleLabels[userRole]} Dashboard • {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStats}
            disabled={loading}
            className="border-white/10 text-slate-300 hover:text-white"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          </Button>
          <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20">
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
    { label: 'Institutions', value: stats?.institutions || 0, icon: Building2, color: 'from-blue-500 to-cyan-500' },
    { label: 'Total Users', value: stats?.users || 0, icon: Users, color: 'from-purple-500 to-pink-500' },
    { label: 'Students', value: stats?.students || 0, icon: GraduationCap, color: 'from-green-500 to-emerald-500' },
    { label: 'Courses', value: stats?.courses || 0, icon: BookOpen, color: 'from-amber-500 to-yellow-500' },
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
                <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
              ) : (
                <>
                  <div className="text-3xl font-bold text-white">{stat.value.toLocaleString()}</div>
                  <div className="text-sm text-slate-400">{stat.label}</div>
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
              <Button variant="outline" className="w-full border-white/10 text-slate-300 hover:text-white">
                <Building2 className="w-4 h-4 mr-2" />
                Institutions
              </Button>
            </Link>
            <Link href="/dashboard/users">
              <Button variant="outline" className="w-full border-white/10 text-slate-300 hover:text-white">
                <Users className="w-4 h-4 mr-2" />
                Users
              </Button>
            </Link>
            <Link href="/dashboard/conflicts">
              <Button variant="outline" className="w-full border-white/10 text-slate-300 hover:text-white">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Conflicts
              </Button>
            </Link>
            <Link href="/dashboard/exam-timetable">
              <Button variant="outline" className="w-full border-white/10 text-slate-300 hover:text-white">
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
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Database</span>
                <Badge className="bg-green-500/10 text-green-400 border-green-500/20">Operational</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">API Endpoints</span>
                <Badge className="bg-green-500/10 text-green-400 border-green-500/20">All Running</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Active Conflicts</span>
                <Badge className={stats?.conflicts ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'}>
                  {stats?.conflicts || 0}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              Platform Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-white/5 rounded-lg">
                <div className="text-2xl font-bold text-white">{stats?.faculties || 0}</div>
                <div className="text-xs text-slate-400">Faculties</div>
              </div>
              <div className="text-center p-3 bg-white/5 rounded-lg">
                <div className="text-2xl font-bold text-white">{stats?.departments || 0}</div>
                <div className="text-xs text-slate-400">Departments</div>
              </div>
              <div className="text-center p-3 bg-white/5 rounded-lg">
                <div className="text-2xl font-bold text-white">{stats?.lecturers || 0}</div>
                <div className="text-xs text-slate-400">Lecturers</div>
              </div>
              <div className="text-center p-3 bg-white/5 rounded-lg">
                <div className="text-2xl font-bold text-white">{stats?.rooms || 0}</div>
                <div className="text-xs text-slate-400">Rooms</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
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
                <Sparkles className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-semibold text-white">Setup Progress</h3>
              </div>
              <p className="text-sm text-slate-400 mb-4">
                {completed} of {setupProgress.length} steps complete ({progressPercent}%)
              </p>
              <Progress value={progressPercent} className="h-2 bg-white/10" />
            </div>
            {progressPercent < 100 && (
              <Link href="/dashboard/exam-timetable">
                <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white border-0">
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
          { label: 'Faculties', value: stats?.faculties || 0, sublabel: `${stats?.departments || 0} departments`, icon: Building2, color: 'from-blue-500 to-cyan-500' },
          { label: 'Students', value: stats?.students || 0, sublabel: `${stats?.coStudents || 0} with COs`, icon: GraduationCap, color: 'from-purple-500 to-pink-500' },
          { label: 'Courses', value: stats?.courses || 0, sublabel: 'Active courses', icon: BookOpen, color: 'from-green-500 to-emerald-500' },
          { label: 'Lecturers', value: stats?.lecturers || 0, sublabel: 'Teaching staff', icon: Users, color: 'from-amber-500 to-yellow-500' },
        ].map((stat, i) => (
          <Card key={i} className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
              ) : (
                <>
                  <div className="text-3xl font-bold text-white">{stat.value.toLocaleString()}</div>
                  <div className="text-sm text-slate-400">{stat.label}</div>
                  <div className="text-xs text-cyan-400 mt-1">{stat.sublabel}</div>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Conflicts Alert */}
      {(stats?.conflicts || 0) > 0 && (
        <Card className="bg-amber-500/5 border-amber-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-amber-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-medium">Attention Required</h3>
                <p className="text-sm text-slate-400">
                  {stats?.conflicts} conflict(s) detected. Please review and resolve before publishing timetable.
                </p>
              </div>
              <Link href="/dashboard/conflicts">
                <Button variant="outline" className="border-amber-500/20 text-amber-400 hover:bg-amber-500/10">
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
          <Button className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white border-0">
            <Sparkles className="w-4 h-4 mr-2" />
            Generate Timetable
          </Button>
        </Link>
        <Link href="/dashboard/students">
          <Button variant="outline" className="w-full border-white/10 text-slate-300 hover:text-white">
            <GraduationCap className="w-4 h-4 mr-2" />
            Students
          </Button>
        </Link>
        <Link href="/dashboard/courses">
          <Button variant="outline" className="w-full border-white/10 text-slate-300 hover:text-white">
            <BookOpen className="w-4 h-4 mr-2" />
            Courses
          </Button>
        </Link>
        <Link href="/dashboard/rooms">
          <Button variant="outline" className="w-full border-white/10 text-slate-300 hover:text-white">
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
          { label: 'Courses', value: stats?.courses || 0, icon: BookOpen, color: 'from-blue-500 to-cyan-500' },
          { label: 'Students', value: stats?.students || 0, sublabel: `${stats?.coStudents || 0} with COs`, icon: GraduationCap, color: 'from-purple-500 to-pink-500' },
          { label: 'Lecturers', value: stats?.lecturers || 0, icon: Users, color: 'from-green-500 to-emerald-500' },
          { label: 'Rooms', value: stats?.rooms || 0, icon: MapPin, color: 'from-amber-500 to-yellow-500' },
        ].map((stat, i) => (
          <Card key={i} className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
              ) : (
                <>
                  <div className="text-3xl font-bold text-white">{stat.value.toLocaleString()}</div>
                  <div className="text-sm text-slate-400">{stat.label}</div>
                  {stat.sublabel && <div className="text-xs text-amber-400 mt-1">{stat.sublabel}</div>}
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
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  ) : item.status === 'warning' ? (
                    <AlertCircle className="w-5 h-5 text-amber-400" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-slate-500" />
                  )}
                  <span className="text-slate-300">{item.label}</span>
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
  return (
    <div className="space-y-4">
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-cyan-400" />
            My Schedule Overview
          </CardTitle>
          <CardDescription>Your teaching and invigilation schedule</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-white/5 rounded-lg">
              <BookOpen className="w-8 h-8 mx-auto text-cyan-400 mb-2" />
              <div className="text-2xl font-bold text-white">{stats?.courses || 0}</div>
              <div className="text-sm text-slate-400">Courses Teaching</div>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-lg">
              <Calendar className="w-8 h-8 mx-auto text-green-400 mb-2" />
              <div className="text-2xl font-bold text-white">{stats?.examPeriods || 0}</div>
              <div className="text-sm text-slate-400">Exam Periods</div>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-lg">
              <Users className="w-8 h-8 mx-auto text-purple-400 mb-2" />
              <div className="text-2xl font-bold text-white">{stats?.students || 0}</div>
              <div className="text-sm text-slate-400">Total Students</div>
            </div>
          </div>

          <Link href="/dashboard/lecturer-schedule">
            <Button className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white border-0">
              View Full Schedule
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

function StudentDashboard({ stats, loading }: { stats: DashboardStats | null; loading: boolean }) {
  return (
    <div className="space-y-4">
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-cyan-400" />
            My Exam Timetable
          </CardTitle>
          <CardDescription>Your personalized exam schedule</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="text-center p-4 bg-white/5 rounded-lg">
              <BookOpen className="w-8 h-8 mx-auto text-cyan-400 mb-2" />
              <div className="text-2xl font-bold text-white">{stats?.courses || 0}</div>
              <div className="text-sm text-slate-400">Registered Courses</div>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-lg">
              <AlertTriangle className="w-8 h-8 mx-auto text-amber-400 mb-2" />
              <div className="text-2xl font-bold text-white">{stats?.coStudents || 0}</div>
              <div className="text-sm text-slate-400">Carry-over Students</div>
            </div>
          </div>

          <Link href="/dashboard/my-timetable">
            <Button className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white border-0">
              View My Timetable
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
