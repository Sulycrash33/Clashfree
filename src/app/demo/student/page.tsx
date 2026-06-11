"use client";

import { useState, useMemo } from "react";
import {
  BookOpen, ChevronDown, CheckCircle2, AlertTriangle,
  XCircle, Info, Clock, Award, BarChart3, Layers,
  User, Calendar, Shield, ChevronRight, X,
  TrendingUp, BookMarked, Zap, RefreshCw,
} from "lucide-react";
import { DemoLayout } from "../_components/DemoLayout";
import {
  FEATURED_STUDENTS, type Student,
  type RegisteredCourse, type StudentConflict, type ConflictType,
} from "../_data/fedko-students";
import { LEVEL_COLORS, type Level } from "../_data/fedko-timetable";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const CONFLICT_CONFIG: Record<ConflictType, {
  label: string; color: string; bg: string; border: string;
  icon: React.ElementType; severityMap: Record<string, string>;
}> = {
  none: {
    label: "No Conflict", color: "text-emerald-400",
    bg: "bg-emerald-500/10", border: "border-emerald-400/20",
    icon: CheckCircle2, severityMap: {},
  },
  timetable_clash: {
    label: "Timetable Clash", color: "text-red-400",
    bg: "bg-red-500/10", border: "border-red-400/30",
    icon: XCircle, severityMap: { critical: "bg-red-600", warning: "bg-amber-600", info: "bg-sky-600" },
  },
  credit_overload: {
    label: "Credit Overload", color: "text-orange-400",
    bg: "bg-orange-500/10", border: "border-orange-400/30",
    icon: AlertTriangle, severityMap: { critical: "bg-orange-600", warning: "bg-amber-600", info: "bg-sky-600" },
  },
  credit_underload: {
    label: "Credit Underload", color: "text-amber-400",
    bg: "bg-amber-500/10", border: "border-amber-400/30",
    icon: AlertTriangle, severityMap: {},
  },
  course_prerequisite_missing: {
    label: "Prerequisite Missing", color: "text-purple-400",
    bg: "bg-purple-500/10", border: "border-purple-400/30",
    icon: Shield, severityMap: { critical: "bg-purple-600", warning: "bg-amber-600", info: "bg-sky-600" },
  },
  carryover_spillover: {
    label: "Carryover / Spillover", color: "text-amber-400",
    bg: "bg-amber-500/10", border: "border-amber-400/30",
    icon: RefreshCw, severityMap: { critical: "bg-red-600", warning: "bg-amber-600", info: "bg-sky-600" },
  },
  venue_capacity_exceeded: {
    label: "Venue Overcapacity", color: "text-sky-400",
    bg: "bg-sky-500/10", border: "border-sky-400/30",
    icon: BarChart3, severityMap: { critical: "bg-red-600", warning: "bg-amber-600", info: "bg-sky-600" },
  },
  lecturer_double_booked: {
    label: "Lecturer Double-Booked", color: "text-rose-400",
    bg: "bg-rose-500/10", border: "border-rose-400/30",
    icon: User, severityMap: {},
  },
  multiple: {
    label: "Multiple Issues", color: "text-fuchsia-400",
    bg: "bg-fuchsia-500/10", border: "border-fuchsia-400/30",
    icon: Zap, severityMap: { critical: "bg-red-600", warning: "bg-amber-600", info: "bg-sky-600" },
  },
};

function severityBadge(severity: StudentConflict["severity"]) {
  const map = {
    critical: "bg-red-600 text-white",
    warning: "bg-amber-500 text-black",
    info: "bg-sky-600 text-white",
  };
  return map[severity];
}

function cgpaColor(cgpa: number) {
  if (cgpa >= 4.5) return "text-emerald-400";
  if (cgpa >= 3.5) return "text-sky-400";
  if (cgpa >= 2.4) return "text-amber-400";
  return "text-red-400";
}

function cgpaClass(cgpa: number) {
  if (cgpa >= 4.5) return "First Class";
  if (cgpa >= 3.5) return "Second Class Upper";
  if (cgpa >= 2.4) return "Second Class Lower";
  return "Third Class / Below";
}

// ─────────────────────────────────────────────
// Profile selector
// ─────────────────────────────────────────────
function ProfileSelector({ selected, onSelect }: { selected: Student; onSelect: (s: Student) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 transition-colors text-left w-full sm:w-auto"
      >
        <div className={`w-8 h-8 rounded-full ${selected.colorClass} flex items-center justify-center text-xs font-bold text-white flex-shrink-0`}>
          {selected.imageInitials}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-white truncate">{selected.name}</div>
          <div className="text-xs text-white/40 truncate">{selected.dept} · {selected.level}L</div>
        </div>
        {selected.conflicts.length > 0 && (
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
            {selected.conflicts.length}
          </span>
        )}
        <ChevronDown className={`w-4 h-4 text-white/30 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 w-80 rounded-2xl border border-white/15 bg-[#13131f] shadow-2xl z-40 overflow-hidden">
          <div className="px-4 py-2 border-b border-white/10">
            <p className="text-xs text-white/30 font-medium">Select Student Profile</p>
          </div>
          <div className="py-1">
            {FEATURED_STUDENTS.map(s => {
              const criticalCount = s.conflicts.filter(c => c.severity === "critical").length;
              const hasWarning = s.conflicts.some(c => c.severity === "warning");
              return (
                <button
                  key={s.id}
                  onClick={() => { onSelect(s); setOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left ${
                    s.id === selected.id ? "bg-white/[0.04]" : ""
                  }`}
                >
                  <div className={`w-9 h-9 rounded-full ${s.colorClass} flex items-center justify-center text-xs font-bold text-white flex-shrink-0`}>
                    {s.imageInitials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white truncate">{s.name}</div>
                    <div className="text-xs text-white/40 truncate">{s.dept} · {s.level}L · CGPA {s.cgpa}</div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {criticalCount > 0 && (
                      <span className="w-5 h-5 rounded-full bg-red-600 text-white text-[9px] font-bold flex items-center justify-center">
                        {criticalCount}
                      </span>
                    )}
                    {hasWarning && criticalCount === 0 && (
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                    )}
                    {s.conflicts.length === 0 && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    )}
                    {s.id === selected.id && (
                      <CheckCircle2 className="w-4 h-4 text-white/30 ml-1" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          {/* Legend */}
          <div className="px-4 py-2 border-t border-white/10 flex gap-3 flex-wrap">
            {[
              { icon: <CheckCircle2 className="w-3 h-3 text-emerald-400" />, label: "Clean" },
              { icon: <AlertTriangle className="w-3 h-3 text-amber-400" />, label: "Warning" },
              { icon: <span className="w-3.5 h-3.5 rounded-full bg-red-600 text-white text-[8px] font-bold flex items-center justify-center">!</span>, label: "Critical" },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1">
                {l.icon}
                <span className="text-[10px] text-white/30">{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Conflict card (expanded)
// ─────────────────────────────────────────────
function ConflictCard({ conflict }: { conflict: StudentConflict }) {
  const [expanded, setExpanded] = useState(true);
  const cfg = CONFLICT_CONFIG[conflict.type];
  const Icon = cfg.icon;

  return (
    <div className={`rounded-2xl border overflow-hidden ${cfg.bg} ${cfg.border}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start justify-between gap-3 px-5 py-4 text-left hover:brightness-110 transition-all"
      >
        <div className="flex items-start gap-3">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${cfg.bg} border ${cfg.border}`}>
            <Icon className={`w-4 h-4 ${cfg.color}`} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-sm font-bold ${cfg.color}`}>{cfg.label}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full text-white ${severityBadge(conflict.severity)}`}>
                {conflict.severity.toUpperCase()}
              </span>
              <span className="text-[10px] text-white/30 font-medium">Detected by ClashFree</span>
            </div>
            <div className="text-sm font-semibold text-white mt-1">{conflict.title}</div>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-white/30 flex-shrink-0 mt-1 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-white/10 pt-4">
          {/* Description */}
          <p className="text-sm text-white/60 leading-relaxed">{conflict.description}</p>

          {/* Affected courses */}
          <div className="flex flex-wrap gap-2">
            {conflict.affectedCourses.map(code => (
              <span
                key={code}
                className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${cfg.bg} ${cfg.border} ${cfg.color}`}
              >
                {code}
              </span>
            ))}
          </div>

          {/* Resolution */}
          {conflict.resolution && (
            <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs font-semibold text-emerald-400">ClashFree Suggested Resolution</span>
              </div>
              <p className="text-sm text-white/55 leading-relaxed">{conflict.resolution}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Registered courses table
// ─────────────────────────────────────────────
function CourseTable({ student }: { student: Student }) {
  const lc = LEVEL_COLORS[student.level as Level] ?? LEVEL_COLORS[100];

  const typeConfig: Record<RegisteredCourse["type"], { label: string; dot: string }> = {
    core:      { label: "Core", dot: "bg-sky-400" },
    elective:  { label: "Elective", dot: "bg-violet-400" },
    general:   { label: "GST", dot: "bg-amber-400" },
    practical: { label: "Practical", dot: "bg-emerald-400" },
  };

  const totalCU = student.registeredCourses.reduce((s, c) => s + c.creditUnit, 0);
  const isOverload = totalCU > 24;
  const isUnderload = totalCU < 15;

  return (
    <div className="rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookMarked className="w-4 h-4 text-white/40" />
          <span className="text-sm font-semibold text-white/60">Registered Courses — Semester {student.semester}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/35">{student.registeredCourses.length} courses</span>
          <span className={`text-sm font-bold px-3 py-1 rounded-lg border ${
            isOverload ? "bg-red-500/15 border-red-400/30 text-red-300"
            : isUnderload ? "bg-amber-500/15 border-amber-400/30 text-amber-300"
            : "bg-emerald-500/15 border-emerald-400/30 text-emerald-300"
          }`}>
            {totalCU} CU
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="divide-y divide-white/5">
        {student.registeredCourses.map((course, i) => {
          const hasClash = !!course.clashWith;
          const isCarryover = !!course.isCarryover;
          const tc = typeConfig[course.type];

          return (
            <div
              key={`${course.code}-${i}`}
              className={`px-5 py-3.5 flex items-center gap-4 ${
                hasClash ? "bg-red-500/5 border-l-2 border-red-500"
                : isCarryover ? "bg-amber-500/5 border-l-2 border-amber-500"
                : "hover:bg-white/[0.02]"
              } transition-colors`}
            >
              {/* Index */}
              <div className="w-5 text-center text-xs text-white/20 flex-shrink-0">{i + 1}</div>

              {/* Course code */}
              <div className="w-28 flex-shrink-0">
                <div className="font-bold text-white text-sm">{course.code}</div>
                <div className="flex items-center gap-1 mt-0.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${tc.dot}`} />
                  <span className="text-[10px] text-white/30">{tc.label}</span>
                </div>
              </div>

              {/* Title */}
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white/70 truncate">{course.title}</div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {isCarryover && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-400/30 text-amber-300">
                      CARRYOVER
                    </span>
                  )}
                  {hasClash && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500/20 border border-red-400/30 text-red-300 flex items-center gap-1">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      CLASH w/ {course.clashWith}
                    </span>
                  )}
                </div>
              </div>

              {/* CU */}
              <div className="flex-shrink-0 text-right">
                <div className="text-sm font-bold text-white">{course.creditUnit}</div>
                <div className="text-[10px] text-white/30">CU</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-white/10 bg-white/[0.02] flex items-center justify-between">
        <div className="flex gap-3 flex-wrap">
          {Object.entries(typeConfig).map(([type, cfg]) => (
            <div key={type} className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
              <span className="text-[10px] text-white/30">
                {cfg.label} ({student.registeredCourses.filter(c => c.type === type).length})
              </span>
            </div>
          ))}
        </div>
        <div className={`flex items-center gap-1.5 text-sm font-bold ${
          isOverload ? "text-red-400" : isUnderload ? "text-amber-400" : "text-emerald-400"
        }`}>
          {isOverload && <AlertTriangle className="w-4 h-4" />}
          {!isOverload && !isUnderload && <CheckCircle2 className="w-4 h-4" />}
          Total: {totalCU} / 24 CU
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// CGPA visual bar
// ─────────────────────────────────────────────
function CGPABar({ cgpa }: { cgpa: number }) {
  const pct = (cgpa / 5) * 100;
  const color = cgpa >= 4.5 ? "bg-emerald-500" : cgpa >= 3.5 ? "bg-sky-500" : cgpa >= 2.4 ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-white/40">CGPA</span>
        <span className={`text-sm font-bold ${cgpaColor(cgpa)}`}>{cgpa} / 5.0</span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="text-[10px] text-white/30">{cgpaClass(cgpa)}</div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Credit unit donut (simple)
// ─────────────────────────────────────────────
function CUDonut({ current, max = 24 }: { current: number; max?: number }) {
  const pct = Math.min(100, (current / max) * 100);
  const over = current > max;
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <div className="flex items-center gap-4">
      <div className="relative w-16 h-16 flex-shrink-0">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
          <circle
            cx="32" cy="32" r={r} fill="none"
            stroke={over ? "#ef4444" : current >= 20 ? "#22c55e" : "#f59e0b"}
            strokeWidth="6"
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-xs font-bold ${over ? "text-red-400" : "text-white"}`}>{current}</span>
        </div>
      </div>
      <div>
        <div className="text-sm font-semibold text-white">{current} / {max} CU</div>
        <div className={`text-xs mt-0.5 ${over ? "text-red-400" : current < 15 ? "text-amber-400" : "text-emerald-400"}`}>
          {over ? `${current - max} CU over limit` : current < 15 ? "Underloaded" : "Within limit"}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────
export default function StudentPage() {
  const [student, setStudent] = useState<Student>(FEATURED_STUDENTS[0]);
  const [activeTab, setActiveTab] = useState<"courses" | "conflicts" | "profile">("courses");

  const handleSelect = (s: Student) => {
    setStudent(s);
    setActiveTab(s.conflicts.length > 0 ? "conflicts" : "courses");
  };

  const criticalCount = student.conflicts.filter(c => c.severity === "critical").length;
  const warningCount = student.conflicts.filter(c => c.severity === "warning").length;
  const lc = LEVEL_COLORS[student.level as Level] ?? LEVEL_COLORS[100];

  const TABS = [
    { id: "courses", label: "Registered Courses", icon: BookOpen },
    { id: "conflicts", label: `Conflicts (${student.conflicts.length})`, icon: AlertTriangle },
    { id: "profile", label: "Profile", icon: User },
  ] as const;

  return (
    <DemoLayout
      activeRole="st"
      roleName={student.name}
      roleSubtitle={`${student.dept} · ${student.level} Level`}
      conflictCount={criticalCount}
    >
      <div className="px-4 sm:px-6 py-8 space-y-6 max-w-4xl mx-auto">

        {/* ── Header ──────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-4 h-4 text-rose-400" />
              <span className="text-xs font-semibold text-rose-400 uppercase tracking-widest">Student Portal</span>
            </div>
            <h1 className="text-2xl font-bold text-white">My Registration</h1>
            <p className="text-white/40 text-sm mt-1">Semester {student.semester}, 2024/2025 · ClashFree conflict detection active</p>
          </div>
          <ProfileSelector selected={student} onSelect={handleSelect} />
        </div>

        {/* ── Conflict status banner ───────────── */}
        {student.conflicts.length === 0 ? (
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/5 p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <div>
              <div className="text-sm font-semibold text-emerald-300">Clean Registration — No Conflicts Detected</div>
              <div className="text-xs text-white/40 mt-0.5">
                {student.totalCreditUnits} CU registered across {student.registeredCourses.length} courses.
                ClashFree verified all slots are conflict-free.
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-red-400/20 bg-red-500/5 p-4 space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <span className="text-sm font-semibold text-red-300">
                  {student.conflicts.length} Issue{student.conflicts.length > 1 ? "s" : ""} Detected by ClashFree
                </span>
              </div>
              <div className="flex gap-2 ml-auto">
                {criticalCount > 0 && (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-600 text-white">
                    {criticalCount} Critical
                  </span>
                )}
                {warningCount > 0 && (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500 text-black">
                    {warningCount} Warning
                  </span>
                )}
              </div>
            </div>
            {/* Quick conflict list */}
            <div className="space-y-1">
              {student.conflicts.map((c, i) => {
                const cfg = CONFLICT_CONFIG[c.type];
                const Icon = cfg.icon;
                return (
                  <button
                    key={i}
                    onClick={() => setActiveTab("conflicts")}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-500/10 transition-colors text-left group"
                  >
                    <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${cfg.color}`} />
                    <span className="text-xs text-white/60 group-hover:text-white flex-1 truncate">{c.title}</span>
                    <ChevronRight className="w-3 h-3 text-white/20 flex-shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Quick stats ─────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="col-span-2 sm:col-span-1 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <CUDonut current={student.totalCreditUnits} />
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-2">
            <Award className="w-4 h-4 text-amber-400" />
            <div className={`text-2xl font-bold ${cgpaColor(student.cgpa)}`}>{student.cgpa}</div>
            <div className="text-xs text-white/35">CGPA · {cgpaClass(student.cgpa)}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-2">
            <Layers className="w-4 h-4 text-sky-400" />
            <div className={`text-2xl font-bold ${lc.badge.replace("bg-", "text-").replace("-600", "-400")}`}>{student.level}</div>
            <div className="text-xs text-white/35">Level · {student.dept}</div>
          </div>
          <div className={`rounded-2xl border p-4 space-y-2 ${
            student.conflicts.length === 0
              ? "border-emerald-400/20 bg-emerald-500/5"
              : criticalCount > 0
              ? "border-red-400/20 bg-red-500/5"
              : "border-amber-400/20 bg-amber-500/5"
          }`}>
            {student.conflicts.length === 0
              ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              : <AlertTriangle className="w-4 h-4 text-red-400" />
            }
            <div className={`text-2xl font-bold ${
              student.conflicts.length === 0 ? "text-emerald-400"
              : criticalCount > 0 ? "text-red-400" : "text-amber-400"
            }`}>
              {student.conflicts.length}
            </div>
            <div className="text-xs text-white/35">
              {student.conflicts.length === 0 ? "No conflicts" : `Conflict${student.conflicts.length > 1 ? "s" : ""} found`}
            </div>
          </div>
        </div>

        {/* ── Tabs ────────────────────────────── */}
        <div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1 w-fit flex-wrap">
          {TABS.map(t => {
            const Icon = t.icon;
            const isConflictTab = t.id === "conflicts";
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === t.id
                    ? isConflictTab && student.conflicts.length > 0
                      ? "bg-red-500/20 text-red-300 shadow"
                      : "bg-white/10 text-white shadow"
                    : "text-white/40 hover:text-white/70"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* ══ COURSES TAB ═══════════════════════ */}
        {activeTab === "courses" && (
          <div className="space-y-4">
            <CourseTable student={student} />

            {/* Semester credit breakdown */}
            <div className="rounded-2xl border border-white/10 p-5 space-y-3">
              <h3 className="text-sm font-semibold text-white/50 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" /> Credit Unit Breakdown
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { type: "core", label: "Core", color: "bg-sky-500" },
                  { type: "elective", label: "Elective", color: "bg-violet-500" },
                  { type: "general", label: "GST", color: "bg-amber-500" },
                  { type: "practical", label: "Practical", color: "bg-emerald-500" },
                ].map(t => {
                  const cu = student.registeredCourses
                    .filter(c => c.type === t.type)
                    .reduce((s, c) => s + c.creditUnit, 0);
                  return (
                    <div key={t.type} className="rounded-xl bg-white/5 border border-white/10 p-3 space-y-2">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${t.color}`} />
                        <span className="text-xs text-white/40">{t.label}</span>
                      </div>
                      <div className="text-xl font-bold text-white">{cu} CU</div>
                      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${t.color}`}
                          style={{ width: `${Math.min(100, (cu / student.totalCreditUnits) * 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-2">
                <CGPABar cgpa={student.cgpa} />
              </div>
            </div>
          </div>
        )}

        {/* ══ CONFLICTS TAB ═════════════════════ */}
        {activeTab === "conflicts" && (
          <div className="space-y-4">
            {student.conflicts.length === 0 ? (
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/5 p-12 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <div className="text-lg font-semibold text-emerald-300">All Clear — Zero Conflicts</div>
                <p className="text-sm text-white/40 max-w-sm mx-auto">
                  {student.name}'s registration has been verified by ClashFree.
                  All {student.registeredCourses.length} courses are scheduled without conflict.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-white/40">
                    {student.conflicts.length} issue{student.conflicts.length > 1 ? "s" : ""} detected —
                    {" "}{criticalCount} critical, {warningCount} warning
                  </p>
                  <div className="text-xs text-white/25 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-violet-400" />
                    Powered by ClashFree
                  </div>
                </div>
                {student.conflicts.map((c, i) => (
                  <ConflictCard key={i} conflict={c} />
                ))}
              </>
            )}
          </div>
        )}

        {/* ══ PROFILE TAB ════════════════════════ */}
        {activeTab === "profile" && (
          <div className="space-y-4">
            {/* Student card */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-5">
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 rounded-2xl ${student.colorClass} flex items-center justify-center text-lg font-bold text-white flex-shrink-0`}>
                  {student.imageInitials}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-white">{student.name}</h2>
                  <p className="text-white/50 text-sm mt-1">{student.deptName}</p>
                  {student.profileNote && (
                    <p className="text-xs text-white/30 mt-2 leading-relaxed italic">{student.profileNote}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: "Matric Number", value: student.matric },
                  { label: "Level", value: `${student.level} Level` },
                  { label: "Department", value: student.dept },
                  { label: "Email", value: student.email },
                  { label: "Phone", value: student.phone },
                  { label: "Semester", value: `Semester ${student.semester}` },
                ].map(f => (
                  <div key={f.label} className="rounded-xl bg-white/5 border border-white/10 p-3">
                    <div className="text-xs text-white/30">{f.label}</div>
                    <div className="text-sm text-white/70 mt-0.5 truncate">{f.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Academic standing */}
            <div className="rounded-2xl border border-white/10 p-5 space-y-4">
              <h3 className="text-sm font-semibold text-white/50 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Academic Standing
              </h3>
              <CGPABar cgpa={student.cgpa} />
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="rounded-xl bg-white/5 border border-white/10 p-3">
                  <div className="text-xs text-white/30">Registered CU</div>
                  <div className={`text-xl font-bold mt-1 ${
                    student.totalCreditUnits > 24 ? "text-red-400" : "text-white"
                  }`}>{student.totalCreditUnits}</div>
                </div>
                <div className="rounded-xl bg-white/5 border border-white/10 p-3">
                  <div className="text-xs text-white/30">Courses</div>
                  <div className="text-xl font-bold text-white mt-1">{student.registeredCourses.length}</div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </DemoLayout>
  );
}
