"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Building2,
  CalendarClock,
  GraduationCap,
  BookOpen,
  ChevronRight,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Users,
  BookMarked,
  LayoutGrid,
} from "lucide-react";

// ─────────────────────────────────────────────
// Role definitions
// ─────────────────────────────────────────────
const ROLES = [
  {
    id: "sa",
    label: "Super Admin",
    sublabel: "Vice-Chancellor's Office",
    name: "Prof. Minato Namikaze",
    description:
      "Full institutional overview — all 9 faculties, department drill-down, student & lecturer distribution, facility ratios.",
    icon: ShieldCheck,
    gradient: "from-primary to-primary",
    border: "border-primary/40",
    badge: "bg-primary/20 text-primary",
    badgeText: "SA",
    href: "/demo/super-admin",
    stats: ["9 Faculties", "64 Departments", "196 Lecturers (SCI)"],
  },
  {
    id: "ia",
    label: "Institution Admin",
    sublabel: "Faculty of Physical & Applied Sciences",
    name: "Dr. Temari Nara",
    description:
      "Faculty-level control — override panel, add/remove departments and staff, manage faculty resources.",
    icon: Building2,
    gradient: "from-secondary to-secondary",
    border: "border-secondary/40",
    badge: "bg-secondary/20 text-secondary",
    badgeText: "IA",
    href: "/demo/institution-admin",
    stats: ["12 Departments", "35 Facilities", "20,000+ Students"],
  },
  {
    id: "to",
    label: "Timetable Officer",
    sublabel: "Faculty of Physical & Applied Sciences",
    name: "Mr. Konohamaru Sarutobi",
    description:
      "Full weekly timetable — colour-coded by level, dept/level filters, conflict flags, generate timetable wizard.",
    icon: CalendarClock,
    gradient: "from-accent-gold to-accent-gold",
    border: "border-accent-gold/40",
    badge: "bg-accent-gold/20 text-accent-gold",
    badgeText: "TO",
    href: "/demo/timetable-officer",
    stats: ["Mon–Fri 08:00–18:00", "All SCI Courses", "3 Active Conflicts"],
  },
  {
    id: "lc",
    label: "Lecturer",
    sublabel: "5 Profile Choices",
    name: "Select a lecturer profile",
    description:
      "Personal timetable, invigilation duties, cancel/reschedule/convert lectures. 5 profiles from Prof to Assistant.",
    icon: GraduationCap,
    gradient: "from-success to-success",
    border: "border-success/40",
    badge: "bg-success/20 text-success",
    badgeText: "LC",
    href: "/demo/lecturer",
    stats: ["5 Profiles", "CHM · PHY · CSC · BCH · MTH", "Invigilation Duties"],
  },
  {
    id: "st",
    label: "Student",
    sublabel: "5 Profile Choices",
    name: "Select a student profile",
    description:
      "Registered courses, credit units, ScheduleFlex conflict detection — from clean registration to carryover spillover.",
    icon: BookOpen,
    gradient: "from-clash to-clash",
    border: "border-clash/40",
    badge: "bg-clash/20 text-clash",
    badgeText: "ST",
    href: "/demo/student",
    stats: ["5 Profiles", "6 Conflict Types", "Live Detection"],
  },
];

// ─────────────────────────────────────────────
// Capability highlights
// ─────────────────────────────────────────────
const CAPABILITIES = [
  { icon: CheckCircle2, text: "Clash-free timetable generation", color: "text-success" },
  { icon: AlertTriangle, text: "Cross-level carryover conflict detection", color: "text-accent-gold" },
  { icon: Users, text: "7:1 Student–Lecturer ratio enforcement", color: "text-secondary" },
  { icon: BookMarked, text: "CCMAS-accurate course registry (64 per dept)", color: "text-primary" },
  { icon: LayoutGrid, text: "Multi-role dashboards (SA → Student)", color: "text-clash" },
  { icon: Sparkles, text: "WhatsApp + Email notifications on conflict", color: "text-accent-gold" },
];

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────
export default function DemoLandingPage() {
  const router = useRouter();
  const [hoveredRole, setHoveredRole] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background text-white">
      {/* ── Header ─────────────────────────────── */}
      <header className="border-b border-white/10 bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <CalendarClock className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-white tracking-tight">ScheduleFlex</span>
            <span className="text-white/30 text-sm">·</span>
            <span className="text-white/50 text-sm">Live Demo</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/15 border border-success/30 text-success text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              Demo Environment
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-16">

        {/* ── Hero ───────────────────────────────── */}
        <section className="text-center space-y-6 pt-4">
          {/* University badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-white/70">
            <Building2 className="w-4 h-4 text-primary" />
            Federal University of Konoha (FEDKO) — Demo Institution
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
            See ScheduleFlex{" "}
            <span className="bg-gradient-to-r from-primary via-secondary to-success bg-clip-text text-transparent">
              in action
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg text-white/60 leading-relaxed">
            A fully populated Nigerian university demo — 9 faculties, 12 science departments,
            real CCMAS courses, live conflict detection. Pick a role below to explore.
          </p>

          {/* Quick stats row */}
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            {[
              { label: "Departments", value: "64" },
              { label: "Courses (SCI)", value: "768" },
              { label: "Students (SCI)", value: "20,000+" },
              { label: "Lecturers (SCI)", value: "196" },
              { label: "Conflicts Detected", value: "127" },
            ].map((s) => (
              <div
                key={s.label}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-center"
              >
                <div className="text-xl font-bold text-white">{s.value}</div>
                <div className="text-xs text-white/40 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Role Cards ─────────────────────────── */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-white/40 uppercase tracking-widest text-center">
            Select Access Role
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {ROLES.map((role) => {
              const Icon = role.icon;
              const isHovered = hoveredRole === role.id;

              return (
                <button
                  key={role.id}
                  onClick={() => router.push(role.href)}
                  onMouseEnter={() => setHoveredRole(role.id)}
                  onMouseLeave={() => setHoveredRole(null)}
                  className={`
                    relative group text-left rounded-2xl border p-6 transition-all duration-300 cursor-pointer
                    bg-white/[0.03] hover:bg-white/[0.07]
                    ${role.border}
                    ${isHovered ? "shadow-2xl scale-[1.02]" : ""}
                  `}
                >
                  {/* Gradient glow on hover */}
                  <div
                    className={`
                      absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300
                      bg-gradient-to-br ${role.gradient} blur-xl -z-10
                    `}
                    style={{ opacity: isHovered ? 0.08 : 0 }}
                  />

                  <div className="space-y-4">
                    {/* Top row */}
                    <div className="flex items-start justify-between">
                      <div
                        className={`w-11 h-11 rounded-xl bg-gradient-to-br ${role.gradient} flex items-center justify-center shadow-lg`}
                      >
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${role.badge}`}>
                        {role.badgeText}
                      </span>
                    </div>

                    {/* Label */}
                    <div>
                      <div className="font-semibold text-white text-base">{role.label}</div>
                      <div className="text-xs text-white/40 mt-0.5">{role.sublabel}</div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-white/55 leading-relaxed">{role.description}</p>

                    {/* Stats */}
                    <div className="flex flex-wrap gap-1.5">
                      {role.stats.map((s) => (
                        <span
                          key={s}
                          className="text-xs px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-white/50"
                        >
                          {s}
                        </span>
                      ))}
                    </div>

                    {/* CTA */}
                    <div className="flex items-center gap-1 text-sm font-medium text-white/60 group-hover:text-white transition-colors">
                      <span>Enter as {role.label}</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Capabilities ───────────────────────── */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 space-y-6">
          <div className="text-center space-y-1">
            <h3 className="font-semibold text-white">What this demo showcases</h3>
            <p className="text-sm text-white/40">Every feature is powered by real FEDKO data</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CAPABILITIES.map((cap) => {
              const Icon = cap.icon;
              return (
                <div key={cap.text} className="flex items-start gap-3">
                  <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${cap.color}`} />
                  <span className="text-sm text-white/65">{cap.text}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Disclaimer ─────────────────────────── */}
        <p className="text-center text-xs text-white/25 pb-4">
          FEDKO is a fictional demo institution. All data is hardcoded for presentation purposes only.
          This section is isolated from production and will be removed after investor/stakeholder demonstrations.
        </p>
      </main>
    </div>
  );
}
