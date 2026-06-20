'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import {
  Calendar,
  Zap,
  CheckCircle2,
  ArrowRight,
  Building2,
  AlertTriangle,
  BarChart3,
  FileSpreadsheet,
  Layers,
  Globe,
  ChevronRight,
} from 'lucide-react'

const features = [
  {
    icon: Zap,
    title: 'Conflict-Free Engine',
    description: 'Constraint-satisfaction algorithm guarantees zero clashes. If parameters are incomplete, it halts and tells you why.',
    highlight: 'Zero clashes or it stops.',
  },
  {
    icon: AlertTriangle,
    title: 'Carry-Over Detection',
    description: 'Automatically validates CO/spillover students against all current-level courses before publishing any timetable.',
    highlight: 'CO students never missed.',
  },
  {
    icon: BarChart3,
    title: 'Room Optimization',
    description: 'Matches course enrollment to venue capacity. Traffic-light system flags overcrowded slots before they become problems.',
    highlight: 'Capacity-aware scheduling.',
  },
  {
    icon: FileSpreadsheet,
    title: 'Bulk Data Import',
    description: 'Upload courses, students, rooms, and registrations via CSV/Excel. Real-time validation catches errors on import.',
    highlight: 'From spreadsheet to system in minutes.',
  },
  {
    icon: Layers,
    title: 'Multi-Tenant Architecture',
    description: 'One platform serves multiple institutions with complete data isolation. Role-based access from Super Admin to Student.',
    highlight: '5 roles, 8+ institution types.',
  },
  {
    icon: Globe,
    title: 'Integration-Ready',
    description: 'Works standalone or plugs into your existing Student Information System. Feed data in, get timetables out.',
    highlight: 'API-first design.',
  },
]

const steps = [
  {
    number: '01',
    title: 'Upload Your Data',
    description: 'Import courses, student registrations, rooms, and lecturer assignments via CSV or connect your SIS directly.',
    icon: FileSpreadsheet,
  },
  {
    number: '02',
    title: 'Configure Constraints',
    description: 'Set exam period dates, blackout days, slot times, room types, and any special requirements (Friday exclusions, etc.).',
    icon: Calendar,
  },
  {
    number: '03',
    title: 'Generate & Publish',
    description: 'One click. The engine assigns every course to a conflict-free slot. Export to PDF, Excel, or push to your portal.',
    icon: CheckCircle2,
  },
]

const stats = [
  { value: '0', label: 'Clashes Guaranteed', suffix: '' },
  { value: '3', label: 'Sessions Per Day', suffix: '' },
  { value: '47', label: 'Institution Types', suffix: '+' },
  { value: '100', label: 'Automation', suffix: '%' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Subtle background gradient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[800px] h-[400px] bg-secondary/5 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-border/50 backdrop-blur-xl sticky top-0 bg-background/80">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">CF</span>
            </div>
            <span className="text-lg font-bold text-foreground tracking-tight">
              ClashFree
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a>
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#institutions" className="hover:text-foreground transition-colors">Institutions</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/demo">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                Live Demo
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                Get Started
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 container mx-auto px-6 pt-24 pb-20">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge variant="outline" className="mb-6 px-4 py-1.5 text-xs font-medium border-border text-muted-foreground">
              Trusted by Nigerian Tertiary Institutions
            </Badge>
          </motion.div>

          <motion.h1
            className="text-4xl md:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Academic Scheduling{' '}
            <span className="text-primary">
              Without
            </span>{' '}
            the Clashes
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            From raw course data to a published, conflict-free exam timetable in minutes.
            Carry-over students validated. Room capacities respected. Zero manual cross-checking.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Link href="/signup">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8 text-base">
                Register Your Institution
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/demo">
              <Button size="lg" variant="outline" className="h-12 px-8 text-base border-border text-foreground hover:bg-muted">
                See Live Demo
              </Button>
            </Link>
          </motion.div>

          {/* Stats Row */}
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border rounded-2xl overflow-hidden border border-border"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            {stats.map((stat, i) => (
              <div key={i} className="bg-card p-6 text-center">
                <div className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
                  {stat.value}<span className="text-primary">{stat.suffix}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wider font-medium">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="relative z-10 py-24 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Three Steps to a Clash-Free Timetable
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              No complex setup. No weeks of training. Upload, configure, generate.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {steps.map((step, i) => (
              <div key={i} className="relative">
                <div className="bg-card border border-border rounded-2xl p-8 h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-4xl font-bold text-primary/20">{step.number}</span>
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <step.icon className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 z-10">
                    <ChevronRight className="w-6 h-6 text-border" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="relative z-10 container mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Built for the Realities of Nigerian Institutions
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Carry-over students, shared GST courses, Friday prayers, multiple campuses — we handle all of it.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, i) => (
            <Card key={i} className="bg-card border-border hover:border-primary/30 transition-colors group">
              <CardContent className="p-6">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">{feature.description}</p>
                <span className="text-xs font-medium text-primary">{feature.highlight}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Integration Section */}
      <section className="relative z-10 py-24 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="outline" className="mb-4 text-xs border-border text-muted-foreground">Two Deployment Options</Badge>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">
                Full Platform or API Integration
              </h2>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                No existing system? Use ClashFree end-to-end. Already have a Student Information System?
                Feed us your data via API or CSV — we return conflict-free timetables you can import back.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Building2 className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Full Platform Mode</h4>
                    <p className="text-sm text-muted-foreground">Manage courses, students, rooms, and schedules all in one place. For institutions starting fresh.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Layers className="w-4 h-4 text-secondary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Integration Mode</h4>
                    <p className="text-sm text-muted-foreground">Plug into your existing SIS with a scoped API key. Your portal handles users — ClashFree imports your data, validates it, and returns a generated, conflict-free timetable as JSON or CSV.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-2xl p-8">
              <div className="font-mono text-sm space-y-3">
                <div className="text-muted-foreground">{'// 1. Authenticate with your institution key'}</div>
                <div><span className="text-primary">Authorization:</span> <span className="text-foreground">Bearer cfk_••••••••</span></div>
                <div className="border-t border-border pt-3 mt-3 text-muted-foreground">{'// 2. Import your SIS data'}</div>
                <div><span className="text-primary">POST</span> <span className="text-foreground">/api/v1/integrate/data</span></div>
                <div className="border-t border-border pt-3 mt-3 text-muted-foreground">{'// 3. Validate completeness & conflicts'}</div>
                <div><span className="text-primary">POST</span> <span className="text-foreground">/api/v1/integrate/validate</span></div>
                <div className="border-t border-border pt-3 mt-3 text-muted-foreground">{'// 4. Generate the timetable'}</div>
                <div><span className="text-primary">POST</span> <span className="text-foreground">/api/v1/integrate/generate</span></div>
                <div className="border-t border-border pt-3 mt-3">
                  <span className="text-primary">GET</span> <span className="text-foreground">/api/v1/integrate/timetable</span>
                </div>
                <div className="pl-4">
                  <span className="text-success">200 OK</span>
                  <span className="text-muted-foreground"> — JSON or CSV, conflict-free</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Institutions */}
      <section id="institutions" className="relative z-10 container mx-auto px-6 py-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Designed for Every Nigerian Tertiary Structure
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Federal, state, or private. University, polytechnic, or college. One platform adapts to your academic structure.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
          {[
            'Federal Universities',
            'State Universities',
            'Private Universities',
            'Polytechnics',
            'Monotechnics',
            'Colleges of Education',
            'Schools of Nursing',
            'Health Technology Schools',
          ].map((inst, i) => (
            <div
              key={i}
              className="px-5 py-2.5 rounded-full bg-card border border-border text-sm text-foreground font-medium"
            >
              {inst}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 container mx-auto px-6 py-20">
        <div className="max-w-3xl mx-auto text-center bg-primary rounded-3xl p-12 md:p-16">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4 tracking-tight">
            Ready to End Timetable Clashes?
          </h2>
          <p className="text-primary-foreground/70 max-w-lg mx-auto mb-8">
            Register your institution today. Our team will set you up within 48 hours.
            No commitment required — see it working with your own data first.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 h-12 px-8 text-base font-semibold">
                Register Your Institution
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/demo">
              <Button size="lg" variant="ghost" className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10 h-12 px-8 text-base">
                Explore Demo First
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border py-10">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xs">CF</span>
            </div>
            <span className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} ClashFree. Built for Nigerian Tertiary Institutions.
            </span>
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
