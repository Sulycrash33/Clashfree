'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Shield,
  Users,
  Calendar,
  Clock,
  Zap,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Building2,
  GraduationCap,
  BookOpen,
  AlertTriangle,
} from 'lucide-react'

const roles = [
  {
    id: 'SA',
    title: 'Super Admin',
    subtitle: 'Platform Control',
    description: 'Full platform management. All institutions, users, system health, global settings.',
    icon: Shield,
    color: 'from-red-500 to-orange-500',
    features: ['47+ institutions', 'User management', 'System health', 'Activity logs'],
  },
  {
    id: 'IA',
    title: 'Institution Admin',
    subtitle: 'Institution Scope',
    description: 'Full control within your institution. Setup, generation, approval, publication.',
    icon: Building2,
    color: 'from-blue-500 to-cyan-500',
    features: ['Faculties & depts', 'Timetable generation', 'Approval workflow', 'Reports'],
  },
  {
    id: 'TO',
    title: 'Timetable Officer',
    subtitle: 'Faculty Scope',
    description: 'Manage scheduling data within assigned faculty. Submit for admin approval.',
    icon: Calendar,
    color: 'from-purple-500 to-pink-500',
    features: ['Course management', 'Student data', 'Room inventory', 'Conflict resolution'],
  },
  {
    id: 'LC',
    title: 'Lecturer',
    subtitle: 'Personal View',
    description: 'View personal schedule, set availability, see invigilation assignments.',
    icon: BookOpen,
    color: 'from-green-500 to-emerald-500',
    features: ['My schedule', 'Availability setter', 'Invigilation duties', 'Course assignments'],
  },
  {
    id: 'ST',
    title: 'Student',
    subtitle: 'Personal Timetable',
    description: 'View personal exam timetable with carry-over courses and venue assignments.',
    icon: GraduationCap,
    color: 'from-amber-500 to-yellow-500',
    features: ['My exams', 'Venue locations', 'Carry-over status', 'Calendar sync'],
  },
]

const features = [
  {
    icon: Zap,
    title: 'Smart Engine',
    description: 'AI-powered conflict detection. Never miss a clash again.',
  },
  {
    icon: Clock,
    title: 'Real-time Sync',
    description: 'Changes reflect instantly across all devices and users.',
  },
  {
    icon: CheckCircle2,
    title: 'Zero Clashes',
    description: 'Guaranteed conflict-free timetables or the engine halts.',
  },
  {
    icon: AlertTriangle,
    title: 'CO Detection',
    description: 'Carry-over students automatically checked against all registered courses.',
  },
]

const institutions = [
  'Federal Universities',
  'State Universities',
  'Private Universities',
  'Polytechnics',
  'Colleges of Education',
  'Schools of Nursing',
  'Health Tech Schools',
  'Monotechnics',
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/10 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-lg">
              CF
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              ClashFree
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-400">
            <a href="#roles" className="hover:text-white transition-colors">Roles</a>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#institutions" className="hover:text-white transition-colors">Institutions</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/10">
                Sign In
              </Button>
            </Link>
            <Link href="/login">
              <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white border-0">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 container mx-auto px-4 pt-20 pb-16 text-center">
        <Badge className="mb-6 bg-cyan-500/10 text-cyan-400 border-cyan-500/20 px-4 py-1.5">
          <Sparkles className="w-4 h-4 mr-2" />
          Revolutionary Academic Scheduling
        </Badge>

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
          End Timetable Clashes
          <br />
          <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
            Permanently.
          </span>
        </h1>

        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-8">
          From data to published timetable in minutes. Smart engine detects conflicts before they happen.
          Carry-over students automatically validated.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <Link href="/login">
            <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white border-0 px-8 h-12">
              Get Started Free
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 h-12 px-8">
            Request Demo
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
          {[
            { value: '47+', label: 'Institutions' },
            { value: '1.2M+', label: 'Students' },
            { value: '0', label: 'Clash Reports' },
            { value: '312+', label: 'Timetables Generated' },
          ].map((stat, i) => (
            <div key={i} className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="text-2xl md:text-3xl font-bold text-white">{stat.value}</div>
              <div className="text-sm text-slate-400">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="relative z-10 container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature, i) => (
            <Card key={i} className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-cyan-400" />
                </div>
                <h3 className="font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-400">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Roles Section */}
      <section id="roles" className="relative z-10 container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Role-Based Access</h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Every user sees only what they need. Zero privilege escalation. All actions logged.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {roles.map((role) => (
            <Card
              key={role.id}
              className="group bg-white/5 border-white/10 backdrop-blur-sm hover:border-white/20 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <CardHeader className="pb-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${role.color} flex items-center justify-center mb-3`}>
                  <role.icon className="w-5 h-5 text-white" />
                </div>
                <CardTitle className="text-lg">{role.title}</CardTitle>
                <CardDescription className="text-slate-500">{role.subtitle}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-400 mb-4">{role.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {role.features.map((f, i) => (
                    <Badge key={i} variant="secondary" className="bg-white/10 text-slate-300 text-xs">
                      {f}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Institutions Section */}
      <section id="institutions" className="relative z-10 container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Built for Every Nigerian Tertiary Structure</h2>
          <p className="text-slate-400">
            From federal universities to health technology schools.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {institutions.map((inst, i) => (
            <Badge
              key={i}
              variant="outline"
              className="px-4 py-2 text-sm border-white/20 text-slate-300 hover:bg-white/10 transition-colors"
            >
              {inst}
            </Badge>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 container mx-auto px-4 py-20">
        <div className="bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 rounded-3xl p-8 md:p-16 text-center border border-white/10 backdrop-blur-sm">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            All Parameters Met → Guaranteed Conflict-Free Output
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto mb-8">
            Parameters incomplete? Engine halts and returns a structured validation report detailing every missing or invalid parameter.
            ClashFree never generates a timetable on incomplete or invalid academic data.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login">
              <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white border-0 px-8 h-12">
                Get Started Free
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 h-12 px-8">
              Request a Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 py-8">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-sm">
              CF
            </div>
            <span className="text-sm text-slate-400">© 2025 ClashFree. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-400">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
