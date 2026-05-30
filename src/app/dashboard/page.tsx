'use client'

import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
} from 'lucide-react'

const roleLabels: Record<string, string> = {
  SA: 'Super Admin',
  IA: 'Institution Admin',
  TO: 'Timetable Officer',
  LC: 'Lecturer',
  ST: 'Student',
}

export default function DashboardPage() {
  const { data: session } = useSession()

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
          <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20">
            {userRole}
          </Badge>
        </div>
      </div>

      {/* Stats Grid */}
      {userRole === 'SA' && <SuperAdminStats />}
      {userRole === 'IA' && <InstitutionAdminStats />}
      {userRole === 'TO' && <TimetableOfficerStats />}
      {userRole === 'LC' && <LecturerDashboard />}
      {userRole === 'ST' && <StudentDashboard />}
    </div>
  )
}

function SuperAdminStats() {
  const stats = [
    { label: 'Institutions', value: '47', change: '+3 this month', icon: Building2, color: 'from-blue-500 to-cyan-500' },
    { label: 'Active Users', value: '1,284', change: '+128 this week', icon: Users, color: 'from-purple-500 to-pink-500' },
    { label: 'Timetables Generated', value: '312', change: '0 unresolved clashes', icon: Calendar, color: 'from-green-500 to-emerald-500' },
    { label: 'System Uptime', value: '99.9%', change: 'All systems operational', icon: CheckCircle2, color: 'from-amber-500 to-yellow-500' },
  ]

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card key={i} className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <Badge variant="secondary" className="bg-white/10 text-slate-300">
                  {stat.change}
                </Badge>
              </div>
              <div className="text-3xl font-bold text-white">{stat.value}</div>
              <div className="text-sm text-slate-400">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Recent Platform Activity</CardTitle>
          <CardDescription>Latest actions across all institutions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { action: 'UNILAG — Exam timetable generated successfully', time: 'Today, 09:14', type: 'success' },
              { action: 'COE Minna — Institution onboarded', time: 'Today, 08:41', type: 'info' },
              { action: 'NSUK — Timetable officer updated room inventory', time: 'Yesterday, 16:22', type: 'info' },
              { action: 'ABU — Generation attempt blocked. Missing lecturer assignments', time: 'Yesterday, 11:05', type: 'warning' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-white/5">
                <div className={`w-2 h-2 mt-2 rounded-full ${
                  item.type === 'success' ? 'bg-green-500' :
                  item.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                }`} />
                <div className="flex-1">
                  <p className="text-sm text-white">{item.action}</p>
                  <p className="text-xs text-slate-500">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  )
}

function InstitutionAdminStats() {
  const stats = [
    { label: 'Faculties', value: '9', sublabel: '62 departments', icon: Building2, color: 'from-blue-500 to-cyan-500' },
    { label: 'Students', value: '4,280', sublabel: '+312 new', icon: GraduationCap, color: 'from-purple-500 to-pink-500' },
    { label: 'Courses', value: '387', sublabel: '24 shared/GST', icon: BookOpen, color: 'from-green-500 to-emerald-500' },
    { label: 'Lecturers', value: '184', sublabel: '5 pending availability', icon: Users, color: 'from-amber-500 to-yellow-500' },
  ]

  const setupProgress = [
    { step: 'Institution profile configured', done: true },
    { step: 'Faculties and departments added', done: true },
    { step: 'Course catalog uploaded', done: true },
    { step: 'Lecturers imported', done: true },
    { step: 'Student registrations imported', done: true },
    { step: 'Room inventory complete', done: true },
    { step: 'Exam period defined', done: true },
    { step: 'Carry-over registrations confirmed', done: false },
    { step: 'Lecturer availability windows set', done: false },
    { step: 'Conflict reports resolved', done: false },
  ]

  const completed = setupProgress.filter(s => s.done).length

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card key={i} className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="text-3xl font-bold text-white">{stat.value}</div>
              <div className="text-sm text-slate-400">{stat.label}</div>
              <div className="text-xs text-cyan-400 mt-1">{stat.sublabel}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Setup Progress */}
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Setup Checklist</CardTitle>
            <CardDescription>{completed} of {setupProgress.length} steps complete</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {setupProgress.map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                    item.done ? 'bg-green-500' : 'bg-white/10'
                  }`}>
                    {item.done && <CheckCircle2 className="w-3 h-3 text-white" />}
                  </div>
                  <span className={item.done ? 'text-white' : 'text-slate-400'}>{item.step}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Scheduling Status */}
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Scheduling Status</CardTitle>
            <CardDescription>Current timetable status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-cyan-400" />
                  <div>
                    <p className="text-white font-medium">Exam Timetable</p>
                    <p className="text-xs text-slate-400">First Semester 2025/2026</p>
                  </div>
                </div>
                <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20">
                  2 conflicts
                </Badge>
              </div>
              <div className="p-4 rounded-lg bg-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-purple-400" />
                  <div>
                    <p className="text-white font-medium">Lecture Timetable</p>
                    <p className="text-xs text-slate-400">First Semester 2025/2026</p>
                  </div>
                </div>
                <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
                  Published
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

function TimetableOfficerStats() {
  const stats = [
    { label: 'Courses', value: '147', icon: BookOpen, color: 'from-blue-500 to-cyan-500' },
    { label: 'Students', value: '1,240', sublabel: '+84 with COs', icon: GraduationCap, color: 'from-purple-500 to-pink-500' },
    { label: 'Lecturers', value: '84', sublabel: '1 missing availability', icon: Users, color: 'from-green-500 to-emerald-500' },
    { label: 'Rooms', value: '18', icon: MapPin, color: 'from-amber-500 to-yellow-500' },
  ]

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card key={i} className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div className="text-3xl font-bold text-white">{stat.value}</div>
              <div className="text-sm text-slate-400">{stat.label}</div>
              {stat.sublabel && <div className="text-xs text-cyan-400 mt-1">{stat.sublabel}</div>}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Data Readiness</CardTitle>
          <CardDescription>Faculty of Applied Sciences • NSUK • 2025/2026</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { label: 'Courses', value: '147 / 147', status: 'complete' },
              { label: 'Lecturers assigned', value: '83 / 84', status: 'warning' },
              { label: 'Student registrations', value: '1,240 Imported', status: 'complete' },
              { label: 'Carry-over registrations', value: '84 students — pending confirm', status: 'warning' },
              { label: 'Room inventory', value: '18 rooms ready', status: 'complete' },
              { label: 'Conflict reports', value: '2 open', status: 'error' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                <span className="text-slate-300">{item.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white">{item.value}</span>
                  <div className={`w-2 h-2 rounded-full ${
                    item.status === 'complete' ? 'bg-green-500' :
                    item.status === 'warning' ? 'bg-amber-500' : 'bg-red-500'
                  }`} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  )
}

function LecturerDashboard() {
  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>My Schedule</CardTitle>
        <CardDescription>Your teaching and invigilation schedule</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12 text-slate-400">
          <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No scheduled classes or invigilation duties yet.</p>
          <p className="text-sm">Contact your department for assignment.</p>
        </div>
      </CardContent>
    </Card>
  )
}

function StudentDashboard() {
  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>My Exam Timetable</CardTitle>
        <CardDescription>Your personalized exam schedule</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12 text-slate-400">
          <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No exam timetable available yet.</p>
          <p className="text-sm">Timetable will appear once published by your institution.</p>
        </div>
      </CardContent>
    </Card>
  )
}
