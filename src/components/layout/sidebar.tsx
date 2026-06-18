'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { clearDemoCookie } from '@/lib/demo'
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
  Menu,
  X,
  UserPlus,
  Bell,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'

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
    { name: 'Signups', href: '/dashboard/signups', icon: UserPlus },
    { name: 'Users', href: '/dashboard/users', icon: Users },
    { name: 'Exam Timetable', href: '/dashboard/exam-timetable', icon: Calendar },
    { name: 'Lecture Timetable', href: '/dashboard/lecture-timetable', icon: Clock },
    { name: 'Conflicts', href: '/dashboard/conflicts', icon: AlertTriangle },
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
    { name: 'Notifications', href: '/dashboard/notifications', icon: Bell },
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

// Bottom nav items (max 5, most important per role)
const bottomNav = {
  SA: [
    { name: 'Home', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Schools', href: '/dashboard/institutions', icon: Building2 },
    { name: 'Signups', href: '/dashboard/signups', icon: UserPlus },
    { name: 'Conflicts', href: '/dashboard/conflicts', icon: AlertTriangle },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ],
  IA: [
    { name: 'Home', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Courses', href: '/dashboard/courses', icon: BookOpen },
    { name: 'Timetable', href: '/dashboard/exam-timetable', icon: Calendar },
    { name: 'Conflicts', href: '/dashboard/conflicts', icon: AlertTriangle },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ],
  TO: [
    { name: 'Home', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Courses', href: '/dashboard/courses', icon: BookOpen },
    { name: 'Timetable', href: '/dashboard/exam-timetable', icon: Calendar },
    { name: 'Conflicts', href: '/dashboard/conflicts', icon: AlertTriangle },
    { name: 'Rooms', href: '/dashboard/rooms', icon: MapPin },
  ],
  LC: [
    { name: 'Home', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Schedule', href: '/dashboard/lecturer-schedule', icon: Calendar },
    { name: 'Courses', href: '/dashboard/courses', icon: BookOpen },
    { name: 'Students', href: '/dashboard/students', icon: GraduationCap },
    { name: 'Rooms', href: '/dashboard/rooms', icon: MapPin },
  ],
  ST: [
    { name: 'Home', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Timetable', href: '/dashboard/my-timetable', icon: Calendar },
    { name: 'Courses', href: '/dashboard/courses', icon: BookOpen },
    { name: 'Conflicts', href: '/dashboard/conflicts', icon: AlertTriangle },
  ],
}

interface SidebarProps {
  demoMode?: boolean
}

export function Sidebar({ demoMode = false }: SidebarProps) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Close drawer on route change
  useEffect(() => { setMobileOpen(false) }, [pathname])

  // Prevent body scroll when drawer open
  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  if (!session?.user) return null

  const userRole = (session.user as { role?: string }).role as keyof typeof navigation
  const navItems = navigation[userRole] || navigation.ST
  const bottomItems = bottomNav[userRole] || bottomNav.ST

  const handleSignOut = () => {
    clearDemoCookie()
    signOut({ callbackUrl: '/login' })
  }

  const NavLink = ({ item, onClick }: { item: { name: string; href: string; icon: React.ElementType }; onClick?: () => void }) => {
    const isActive = pathname === item.href
    return (
      <Link
        href={item.href}
        data-allow-nav="true"
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
          isActive
            ? 'bg-secondary/10 text-secondary border border-secondary/20'
            : 'text-muted hover:text-white hover:bg-foreground/5'
        )}
        onClick={onClick}
      >
        <item.icon className="w-5 h-5 shrink-0" />
        {item.name}
      </Link>
    )
  }

  return (
    <>
      {/* ── Desktop Sidebar ─────────────────────────────────── */}
      <aside className="hidden lg:flex fixed left-0 top-0 z-40 h-screen w-64 bg-muted border-r border-foreground/10 flex-col">
        {/* Logo */}
        <div className="p-4 border-b border-foreground/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary to-secondary flex items-center justify-center font-bold text-white">
              CF
            </div>
            <div>
              <h1 className="font-bold text-white">ClashFree</h1>
              <p className="text-xs text-muted">{roleLabels[userRole]}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(item => <NavLink key={item.href} item={item} />)}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-foreground/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-clash flex items-center justify-center text-sm font-bold text-white shrink-0">
              {(session.user as { name?: string }).name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{(session.user as { name?: string }).name}</p>
              <p className="text-xs text-muted truncate">{session.user.email}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted hover:text-white hover:bg-foreground/5 h-9"
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4 mr-2" /> Sign Out
          </Button>
        </div>
      </aside>

      {/* ── Mobile Top Bar ──────────────────────────────────── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-muted/95 backdrop-blur-sm border-b border-foreground/10 flex items-center px-4 gap-3">
        <button
          className="p-2 rounded-lg bg-foreground/5 hover:bg-foreground/10 transition-colors"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5 text-white" />
        </button>
        <div className="flex items-center gap-2 flex-1">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-secondary to-secondary flex items-center justify-center font-bold text-xs text-white">CF</div>
          <span className="font-bold text-white text-sm">ClashFree</span>
        </div>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-clash flex items-center justify-center text-xs font-bold text-white">
          {(session.user as { name?: string }).name?.charAt(0) || 'U'}
        </div>
      </div>

      {/* ── Mobile Drawer Overlay ───────────────────────────── */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile Drawer ───────────────────────────────────── */}
      <aside
        className={cn(
          'lg:hidden fixed left-0 top-0 z-50 h-screen w-72 bg-muted border-r border-foreground/10 flex flex-col',
          'transition-transform duration-300 ease-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Drawer header */}
        <div className="p-4 border-b border-foreground/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-secondary to-secondary flex items-center justify-center font-bold text-white text-sm">CF</div>
            <div>
              <h1 className="font-bold text-white text-sm">ClashFree</h1>
              <p className="text-xs text-muted">{roleLabels[userRole]}</p>
            </div>
          </div>
          <button
            className="p-1.5 rounded-lg hover:bg-foreground/10 text-muted hover:text-white transition-colors"
            onClick={() => setMobileOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User card */}
        <div className="px-4 py-3 border-b border-foreground/10 bg-foreground/3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-clash flex items-center justify-center text-sm font-bold text-white shrink-0">
              {(session.user as { name?: string }).name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{(session.user as { name?: string }).name}</p>
              <p className="text-xs text-muted truncate">{session.user.email}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto pb-8">
          {navItems.map(item => (
            <NavLink key={item.href} item={item} onClick={() => setMobileOpen(false)} />
          ))}
        </nav>

        {/* Sign out */}
        <div className="p-4 border-t border-foreground/10">
          <Button
            variant="ghost"
            className="w-full justify-start text-muted hover:text-white hover:bg-foreground/5"
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4 mr-2" /> Sign Out
          </Button>
        </div>
      </aside>

      {/* ── Mobile Bottom Nav ───────────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-muted/95 backdrop-blur-sm border-t border-foreground/10 flex items-center justify-around px-2">
        {bottomItems.map(item => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              data-allow-nav="true"
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl min-w-0 flex-1 transition-colors',
                isActive ? 'text-secondary' : 'text-muted hover:text-muted'
              )}
            >
              <item.icon className={cn('w-5 h-5', isActive && 'drop-shadow-[0_0_6px_rgba(34,211,238,0.6)]')} />
              <span className="text-[10px] font-medium truncate leading-tight">{item.name}</span>
              {isActive && <div className="w-1 h-1 rounded-full bg-secondary absolute bottom-2" />}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
