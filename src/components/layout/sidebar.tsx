'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Building2,
  Users,
  BookOpen,
  Calendar,
  Clock,
  MapPin,
  AlertTriangle,
  FileText,
  Settings,
  LogOut,
  Shield,
  GraduationCap,
  ChevronDown,
  Menu,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

const roleLabels = {
  SA: 'Super Admin',
  IA: 'Institution Admin',
  TO: 'Timetable Officer',
  LC: 'Lecturer',
  ST: 'Student',
}

const navigation = {
  SA: [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Institutions', href: '/dashboard/institutions', icon: Building2 },
    { name: 'Users', href: '/dashboard/users', icon: Users },
    { name: 'Activity Logs', href: '/dashboard/logs', icon: FileText },
    { name: 'System Health', href: '/dashboard/health', icon: Shield },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ],
  IA: [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Faculties', href: '/dashboard/faculties', icon: Building2 },
    { name: 'Departments', href: '/dashboard/departments', icon: Users },
    { name: 'Courses', href: '/dashboard/courses', icon: BookOpen },
    { name: 'Students', href: '/dashboard/students', icon: GraduationCap },
    { name: 'Lecturers', href: '/dashboard/lecturers', icon: Users },
    { name: 'Rooms', href: '/dashboard/rooms', icon: MapPin },
    { name: 'Exam Timetable', href: '/dashboard/exam-timetable', icon: Calendar },
    { name: 'Lecture Timetable', href: '/dashboard/lecture-timetable', icon: Clock },
    { name: 'Conflicts', href: '/dashboard/conflicts', icon: AlertTriangle },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ],
  TO: [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Courses', href: '/dashboard/courses', icon: BookOpen },
    { name: 'Students', href: '/dashboard/students', icon: GraduationCap },
    { name: 'Lecturers', href: '/dashboard/lecturers', icon: Users },
    { name: 'Rooms', href: '/dashboard/rooms', icon: MapPin },
    { name: 'Exam Timetable', href: '/dashboard/exam-timetable', icon: Calendar },
    { name: 'Lecture Timetable', href: '/dashboard/lecture-timetable', icon: Clock },
    { name: 'Conflicts', href: '/dashboard/conflicts', icon: AlertTriangle },
  ],
  LC: [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'My Schedule', href: '/dashboard/lecturer-schedule', icon: Calendar },
    { name: 'Courses', href: '/dashboard/courses', icon: BookOpen },
    { name: 'Students', href: '/dashboard/students', icon: GraduationCap },
    { name: 'Rooms', href: '/dashboard/rooms', icon: MapPin },
  ],
  ST: [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'My Timetable', href: '/dashboard/my-timetable', icon: Calendar },
    { name: 'Courses', href: '/dashboard/courses', icon: BookOpen },
    { name: 'Conflicts', href: '/dashboard/conflicts', icon: AlertTriangle },
  ],
}

export function Sidebar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  if (!session?.user) return null

  const userRole = session.user.role as keyof typeof navigation
  const navItems = navigation[userRole] || navigation.ST

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-slate-800 border border-white/10"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen w-64 bg-slate-900 border-r border-white/10 transition-transform duration-300',
          'lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-bold">
                CF
              </div>
              <div>
                <h1 className="font-bold text-white">ClashFree</h1>
                <p className="text-xs text-slate-400">{roleLabels[userRole]}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  )}
                  onClick={() => setMobileOpen(false)}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* User info */}
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm font-bold">
                {session.user.name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{session.user.name}</p>
                <p className="text-xs text-slate-400 truncate">{session.user.email}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-slate-400 hover:text-white hover:bg-white/5"
              onClick={() => signOut({ callbackUrl: '/login' })}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>
    </>
  )
}
