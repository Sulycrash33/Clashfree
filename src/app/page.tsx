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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card text-foreground">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-secondary/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-secondary/20 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-foreground/10 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary to-secondary flex items-center justify-center font-bold text-lg">
              CF
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-secondary to-secondary bg-clip-text text-transparent">
              ClashFree
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#roles" className="hover:text-foreground transition-colors">Roles</a>
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#institutions" className="hover:text-foreground transition-colors">Institutions</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground hover:bg-foreground/10">
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-gradient-to-r from-secondary to-secondary hover:from-secondary hover:to-secondary text-white border-0">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 container mx-auto px-4 pt-20 pb-16 text-center">
        <Badge className="mb-6 bg-secondary/10 text-secondary border-secondary/20 px-4 py-1.5">
          <Sparkles className="w-4 h-4 mr-2" />
          Revolutionary Academic Scheduling
        </Badge>

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
          End Timetable Clashes
          <br />
          <span className="bg-gradient-to-r from-secondary via-secondary to-primary bg-clip-text text-transparent">
            Permanently.
          </span>
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          From data to published timetable in minutes. Smart engine detects conflicts before they happen.
          Carry-over students automatically validated.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <Link href="/signup">
            <Button size="lg" className="bg-gradient-to-r from-secondary to-secondary hover:from-secondary hover:to-secondary text-white border-0 px-8 h-12">
              Get Started Free
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>

        {/* Platform Highlights */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
          {[
            { value: '5', label: 'User Roles' },
            { value: '8', label: 'Institution Types' },
            { value: '0', label: 'Clash Guarantee' },
            { value: '100%', label: 'Automation' },
          ].map((stat, i) => (
            <div key={i} className="bg-foreground/5 backdrop-blur-sm rounded-xl p-4 border border-foreground/10">
              <div className="text-2xl md:text-3xl font-bold text-foreground">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="relative z-10 container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature, i) => (
            <Card key={i} className="bg-foreground/5 border-foreground/10 backdrop-blur-sm hover:bg-foreground/10 transition-colors">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary/20 to-secondary/20 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-secondary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Institutions Section */}
      <section id="institutions" className="relative z-10 container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">Built for Every Nigerian Tertiary Structure</h2>
          <p className="text-muted-foreground">
            From federal universities to health technology schools.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {institutions.map((inst, i) => (
            <Badge
              key={i}
              variant="outline"
              className="px-4 py-2 text-sm border-foreground/20 text-muted-foreground hover:bg-foreground/10 transition-colors"
            >
              {inst}
            </Badge>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 container mx-auto px-4 py-20">
        <div className="bg-gradient-to-r from-secondary/10 via-secondary/10 to-primary/10 rounded-3xl p-8 md:p-16 text-center border border-foreground/10 backdrop-blur-sm">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
            All Parameters Met → Guaranteed Conflict-Free Output
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
            Parameters incomplete? Engine halts and returns a structured validation report detailing every missing or invalid parameter.
            ClashFree never generates a timetable on incomplete or invalid academic data.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="bg-gradient-to-r from-secondary to-secondary hover:from-secondary hover:to-secondary text-white border-0 px-8 h-12">
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-foreground/10 py-8">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-secondary to-secondary flex items-center justify-center font-bold text-sm">
              CF
            </div>
            <span className="text-sm text-muted-foreground">© 2026 ClashFree. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
