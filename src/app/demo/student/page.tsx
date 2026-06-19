"use client";

import { useState, useMemo } from "react";
import {
  BookOpen, ChevronDown, CheckCircle2, AlertTriangle, XCircle,
  Clock, Award, BarChart3, User, Calendar, Shield, ChevronRight,
  X, TrendingUp, BookMarked, Zap, RefreshCw, Download, Camera,
  MapPin, FileText, Printer, Moon, Sun, Settings, Bell,
} from "lucide-react";
import { DemoLayout } from "../_components/DemoLayout";
import {
  FEATURED_STUDENTS, type Student,
  type RegisteredCourse, type StudentConflict, type ConflictType,
} from "../_data/fedko-students";
import { TIMETABLE, DAYS, LEVEL_COLORS, type Level, type TimetableSlot } from "../_data/fedko-timetable";

type TabId = "courses" | "timetable" | "conflicts" | "exam" | "profile";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CONFLICT_CONFIG: Record<ConflictType, { label: string; color: string; bg: string; border: string; icon: any; severityMap: Record<string, string> }> = {
  none:                       { label: "No Conflict",           color: "text-success", bg: "bg-success/10", border: "border-success/20", icon: CheckCircle2,  severityMap: {} },
  timetable_clash:            { label: "Timetable Clash",       color: "text-clash",     bg: "bg-clash/10",     border: "border-clash/30",    icon: XCircle,       severityMap: {} },
  credit_overload:            { label: "Credit Overload",       color: "text-accent-gold",  bg: "bg-accent-gold/10",  border: "border-accent-gold/30", icon: AlertTriangle,  severityMap: {} },
  credit_underload:           { label: "Credit Underload",      color: "text-accent-gold",   bg: "bg-accent-gold/10",   border: "border-accent-gold/30",  icon: AlertTriangle,  severityMap: {} },
  course_prerequisite_missing:{ label: "Prerequisite Missing",  color: "text-primary",  bg: "bg-primary/10",  border: "border-primary/30", icon: Shield,         severityMap: {} },
  carryover_spillover:        { label: "Carryover / Spillover", color: "text-accent-gold",   bg: "bg-accent-gold/10",   border: "border-accent-gold/30",  icon: RefreshCw,      severityMap: {} },
  venue_capacity_exceeded:    { label: "Venue Overcapacity",    color: "text-secondary",     bg: "bg-secondary/10",     border: "border-secondary/30",    icon: BarChart3,      severityMap: {} },
  lecturer_double_booked:     { label: "Lecturer Double-Booked",color: "text-clash",    bg: "bg-clash/10",    border: "border-clash/30",   icon: User,           severityMap: {} },
  multiple:                   { label: "Multiple Issues",       color: "text-clash", bg: "bg-clash/10", border: "border-clash/30",icon: Zap,            severityMap: {} },
};

function severityBadge(severity: StudentConflict["severity"]) {
  const map = { critical: "bg-clash text-white", warning: "bg-accent-gold text-black", info: "bg-secondary text-white" };
  return map[severity];
}

function cgpaColor(cgpa: number) {
  if (cgpa >= 4.5) return "text-success";
  if (cgpa >= 3.5) return "text-secondary";
  if (cgpa >= 2.4) return "text-accent-gold";
  return "text-clash";
}

function cgpaClass(cgpa: number) {
  if (cgpa >= 4.5) return "First Class";
  if (cgpa >= 3.5) return "Second Class Upper";
  if (cgpa >= 2.4) return "Second Class Lower";
  return "Third Class / Below";
}

function StudentPassport({ student, size = "lg" }: { student: Student; size?: "sm" | "lg" }) {
  const dim  = size === "lg" ? "w-24 h-24" : "w-10 h-10";
  const text = size === "lg" ? "text-2xl"  : "text-sm";
  const iconSz = size === "lg" ? "w-5 h-5" : "w-3 h-3";
  return (
    <div className={`${dim} rounded-2xl ${student.colorClass} relative flex items-center justify-center overflow-hidden border-2 border-foreground/20 flex-shrink-0 group`}>
      <span className={`font-bold text-foreground ${text}`}>{student.imageInitials}</span>
      <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
        <Camera className={`${iconSz} text-foreground`} />
        {size === "lg" && <span className="text-[9px] text-foreground/80 mt-1 font-medium">Photo</span>}
      </div>
      <div className="absolute top-1 right-1 w-2 h-2 border-t-2 border-r-2 border-foreground/40" />
      <div className="absolute bottom-1 left-1 w-2 h-2 border-b-2 border-l-2 border-foreground/40" />
    </div>
  );
}

function CGPABar({ cgpa }: { cgpa: number }) {
  const pct = (cgpa / 5.0) * 100;
  const color = cgpa >= 4.5 ? "bg-success" : cgpa >= 3.5 ? "bg-secondary" : cgpa >= 2.4 ? "bg-accent-gold" : "bg-clash";
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-foreground/40">CGPA</span>
        <span className={`text-sm font-bold ${cgpaColor(cgpa)}`}>{cgpa} / 5.0</span>
      </div>
      <div className="h-2 bg-foreground/10 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="text-[10px] text-foreground/30">{cgpaClass(cgpa)}</div>
    </div>
  );
}

function ProfileSelector({ selected, onSelect }: { selected: Student; onSelect: (s: Student) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-foreground/15 bg-foreground/5 hover:bg-foreground/10 transition-colors text-left w-full sm:w-auto">
        <StudentPassport student={selected} size="sm" />
        <div className="min-w-0">
          <div className="text-sm font-semibold text-foreground truncate">{selected.name}</div>
          <div className="text-xs text-foreground/40 truncate">{selected.dept} · {selected.level}L</div>
        </div>
        {selected.conflicts.length > 0 && (
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-clash text-white text-[10px] font-bold flex items-center justify-center">
            {selected.conflicts.length}
          </span>
        )}
        <ChevronDown className={`w-4 h-4 text-foreground/30 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-2 w-80 rounded-2xl border border-foreground/15 bg-muted shadow-2xl z-40 overflow-hidden">
          <div className="px-4 py-2 border-b border-foreground/10">
            <p className="text-xs text-foreground/30 font-medium">Select Student Profile</p>
          </div>
          <div className="py-1">
            {FEATURED_STUDENTS.map(s => {
              const criticalCount = s.conflicts.filter(c => c.severity === "critical").length;
              const hasWarning = s.conflicts.some(c => c.severity === "warning");
              return (
                <button key={s.id} onClick={() => { onSelect(s); setOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-foreground/5 transition-colors text-left ${s.id === selected.id ? "bg-foreground/[0.03]" : ""}`}>
                  <StudentPassport student={s} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-foreground truncate">{s.name}</div>
                    <div className="text-xs text-foreground/40 truncate">{s.dept} · {s.level}L · CGPA {s.cgpa}</div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {criticalCount > 0 && <span className="w-5 h-5 rounded-full bg-clash text-white text-[9px] font-bold flex items-center justify-center">{criticalCount}</span>}
                    {hasWarning && criticalCount === 0 && <AlertTriangle className="w-4 h-4 text-accent-gold" />}
                    {s.conflicts.length === 0 && <CheckCircle2 className="w-4 h-4 text-success" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function ConflictCard({ conflict }: { conflict: StudentConflict }) {
  const [expanded, setExpanded] = useState(true);
  const cfg = CONFLICT_CONFIG[conflict.type];
  const Icon = cfg.icon;
  return (
    <div className={`rounded-2xl border overflow-hidden ${cfg.bg} ${cfg.border}`}>
      <button onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start justify-between gap-3 px-5 py-4 text-left hover:brightness-110 transition-all">
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
            </div>
            <div className="text-sm font-semibold text-foreground mt-1">{conflict.title}</div>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-foreground/30 flex-shrink-0 mt-1 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>
      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-foreground/10 pt-4">
          <p className="text-sm text-foreground/60 leading-relaxed">{conflict.description}</p>
          <div className="flex flex-wrap gap-2">
            {conflict.affectedCourses.map(code => (
              <span key={code} className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${cfg.bg} ${cfg.border} ${cfg.color}`}>{code}</span>
            ))}
          </div>
          {conflict.resolution && (
            <div className="rounded-xl bg-foreground/5 border border-foreground/10 p-4 space-y-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                <span className="text-xs font-semibold text-success">ScheduleFlex Suggested Resolution</span>
              </div>
              <p className="text-sm text-foreground/55 leading-relaxed">{conflict.resolution}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CourseTable({ student }: { student: Student }) {
  const typeConfig: Record<RegisteredCourse["type"], { label: string; dot: string }> = {
    core:      { label: "Core",      dot: "bg-secondary" },
    elective:  { label: "Elective",  dot: "bg-primary" },
    general:   { label: "GST",       dot: "bg-accent-gold" },
    practical: { label: "Practical", dot: "bg-success" },
  };
  const totalCU = student.registeredCourses.reduce((s, c) => s + c.creditUnit, 0);
  const isOverload = totalCU > 24;
  const isUnderload = totalCU < 15;

  return (
    <div className="rounded-2xl border border-foreground/10 overflow-hidden">
      <div className="px-5 py-4 border-b border-foreground/10 bg-foreground/[0.03] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookMarked className="w-4 h-4 text-foreground/40" />
          <span className="text-sm font-semibold text-foreground/60">Registered Courses — Semester {student.semester}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-foreground/35">{student.registeredCourses.length} courses</span>
          <span className={`text-sm font-bold px-3 py-1 rounded-lg border ${isOverload ? "bg-clash/15 border-clash/30 text-clash" : isUnderload ? "bg-accent-gold/15 border-accent-gold/30 text-accent-gold" : "bg-success/15 border-success/30 text-success"}`}>{totalCU} CU</span>
        </div>
      </div>
      <div className="divide-y divide-white/5">
        {student.registeredCourses.map((course, i) => {
          const hasClash = !!course.clashWith;
          const isCarryover = !!course.isCarryover;
          const tc = typeConfig[course.type];
          return (
            <div key={`${course.code}-${i}`}
              className={`px-5 py-3.5 flex items-center gap-4 ${hasClash ? "bg-clash/5 border-l-2 border-clash" : isCarryover ? "bg-accent-gold/5 border-l-2 border-accent-gold" : "hover:bg-foreground/[0.03]"} transition-colors`}>
              <div className="w-5 text-center text-xs text-foreground/20 flex-shrink-0">{i + 1}</div>
              <div className="w-28 flex-shrink-0">
                <div className="font-bold text-foreground text-sm">{course.code}</div>
                <div className="flex items-center gap-1 mt-0.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${tc.dot}`} />
                  <span className="text-[10px] text-foreground/30">{tc.label}</span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-foreground/70 truncate">{course.title}</div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {isCarryover && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-accent-gold/20 border border-accent-gold/30 text-accent-gold">CARRYOVER</span>}
                  {hasClash && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-clash/20 border border-clash/30 text-clash flex items-center gap-1">
                      <AlertTriangle className="w-2.5 h-2.5" /> CLASH w/ {course.clashWith}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex-shrink-0 text-right">
                <div className="text-sm font-bold text-foreground">{course.creditUnit}</div>
                <div className="text-[10px] text-foreground/30">CU</div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="px-5 py-3 border-t border-foreground/10 bg-foreground/[0.03] flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-3 flex-wrap">
          {Object.entries(typeConfig).map(([type, cfg]) => (
            <div key={type} className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
              <span className="text-[10px] text-foreground/30">{cfg.label} ({student.registeredCourses.filter(c => c.type === type).length})</span>
            </div>
          ))}
        </div>
        <span className={`text-xs font-bold ${isOverload ? "text-clash" : isUnderload ? "text-accent-gold" : "text-success"}`}>
          {isOverload ? "⚠ Overloaded" : isUnderload ? "⚠ Underloaded" : "✓ Load OK"}
        </span>
      </div>
    </div>
  );
}

const TIME_BANDS = [
  { label: "08:00 – 10:00", start: "08:00" },
  { label: "10:00 – 12:00", start: "10:00" },
  { label: "12:00 – 14:00", start: "12:00" },
  { label: "14:00 – 16:00", start: "14:00" },
  { label: "16:00 – 18:00", start: "16:00" },
];

function StudentWeeklyTimetable({ student }: { student: Student }) {
  const studentCodes = new Set(student.registeredCourses.map(c => c.code));
  const clashCodes = new Set(student.registeredCourses.filter(c => !!c.clashWith || !!c.isCarryover).map(c => c.code));

  const grid = useMemo(() => {
    const map: Record<string, Record<string, TimetableSlot[]>> = {};
    TIME_BANDS.forEach(tb => {
      map[tb.start] = {};
      DAYS.forEach(d => { map[tb.start][d] = []; });
    });
    TIMETABLE.forEach(slot => {
      if (!studentCodes.has(slot.courseCode)) return;
      if (slot.slotType === "break" || slot.slotType === "jumuah") return;
      const band = TIME_BANDS.find(tb => tb.start === slot.startTime);
      if (band && map[band.start]?.[slot.day] !== undefined) {
        map[band.start][slot.day].push(slot);
      }
    });
    return map;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student.id]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-sm font-semibold text-foreground/60 flex items-center gap-2">
          <Calendar className="w-4 h-4" /> My Weekly Timetable — Semester {student.semester}
        </h3>
        <div className="flex gap-2 flex-wrap text-[10px]">
          <span className="px-2 py-0.5 rounded bg-foreground/5 border border-foreground/10 text-foreground/40">Mon – Fri · 08:00–18:00</span>
          {student.conflicts.some(c => c.type === "timetable_clash") && (
            <span className="px-2 py-0.5 rounded bg-clash/15 border border-clash/30 text-clash flex items-center gap-1">
              <AlertTriangle className="w-2.5 h-2.5" /> Clash Detected
            </span>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-foreground/10">
        <table className="w-full min-w-[520px] border-collapse text-xs">
          <thead>
            <tr className="border-b border-foreground/10">
              <th className="px-3 py-2.5 text-left text-[10px] font-bold text-foreground/35 uppercase w-28 border-r border-foreground/10 bg-foreground/[0.03]">Time</th>
              {DAYS.map(d => (
                <th key={d} className="px-2 py-2.5 text-center text-[10px] font-bold text-foreground/50 uppercase border-r border-foreground/10 last:border-r-0 bg-foreground/[0.03]">
                  {d.slice(0, 3)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TIME_BANDS.map(band => (
              <tr key={band.start} className="border-b border-foreground/5 last:border-b-0">
                <td className="px-3 py-3 border-r border-foreground/10 bg-foreground/[0.03] align-middle">
                  <div className="font-bold text-foreground/60 text-[10px] leading-tight">{band.label}</div>
                </td>
                {DAYS.map(day => {
                  const slots = grid[band.start]?.[day] ?? [];
                  const isJumaat = day === "Friday" && band.start === "12:00";
                  if (isJumaat) {
                    return (
                      <td key={day} className="px-1.5 py-1.5 border-r border-foreground/10 last:border-r-0 bg-success/5 align-top min-w-[80px]">
                        <div className="rounded-lg border border-success/20 bg-success/10 px-2 py-1.5 text-center">
                          <div className="text-[9px] font-bold text-success">🕌 Jumu&apos;ah</div>
                          <div className="text-[8px] text-success/60 mt-0.5">13:00–14:00</div>
                        </div>
                      </td>
                    );
                  }
                  if (slots.length === 0) {
                    return (
                      <td key={day} className="px-1.5 py-1.5 border-r border-foreground/10 last:border-r-0 bg-foreground/[0.03] align-top min-w-[80px]">
                        <div className="h-10 flex items-center justify-center">
                          <span className="text-[9px] text-foreground/10">—</span>
                        </div>
                      </td>
                    );
                  }
                  const hasMultiple = slots.length > 1;
                  return (
                    <td key={day} className={`px-1.5 py-1.5 border-r border-foreground/10 last:border-r-0 align-top min-w-[80px] ${hasMultiple ? "bg-clash/5" : ""}`}>
                      <div className="space-y-1">
                        {slots.map((slot, si) => {
                          const isClashing = clashCodes.has(slot.courseCode) || hasMultiple;
                          const isCarryover = student.registeredCourses.find(c => c.code === slot.courseCode)?.isCarryover;
                          const slotLc = LEVEL_COLORS[slot.level as Level] ?? LEVEL_COLORS[100];
                          return (
                            <div key={`${slot.id}-${si}`}
                              className={`rounded-lg border px-2 py-1.5 ${isClashing ? "bg-clash/15 border-clash/40" : isCarryover ? "bg-accent-gold/15 border-accent-gold/40" : `${slotLc.bg} ${slotLc.border}`}`}>
                              <div className={`text-[10px] font-extrabold truncate leading-tight ${isClashing ? "text-clash" : isCarryover ? "text-accent-gold" : slotLc.text}`}>
                                {slot.courseCode}
                              </div>
                              <div className={`text-[8px] mt-0.5 truncate ${isClashing ? "text-clash/70" : isCarryover ? "text-accent-gold/70" : slotLc.text}`}>
                                <MapPin className="inline w-2 h-2 mr-0.5" />
                                {slot.venue.replace("SCI ", "").replace("LAB-", "")}
                              </div>
                              {isClashing && <div className="text-[8px] font-bold text-clash flex items-center gap-0.5 mt-0.5"><AlertTriangle className="w-2 h-2" /> CLASH</div>}
                              {isCarryover && !isClashing && <div className="text-[8px] font-bold text-accent-gold mt-0.5">CARRY</div>}
                            </div>
                          );
                        })}
                        {hasMultiple && (
                          <div className="text-[8px] font-bold text-clash text-center py-0.5">⚠ {slots.length} overlap!</div>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-3 text-[10px] text-foreground/40">
        {[
          { bg: "bg-secondary border-secondary", label: "100 Level" },
          { bg: "bg-success border-success", label: "200 Level" },
          { bg: "bg-accent-gold border-accent-gold", label: "300 Level" },
          { bg: "bg-clash border-clash", label: "400 Level" },
          { bg: "bg-clash/20 border-clash/40", label: "Clash" },
          { bg: "bg-accent-gold/20 border-accent-gold/40", label: "Carryover" },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded border ${l.bg}`} />
            <span>{l.label}</span>
          </div>
        ))}
      </div>

      {student.conflicts.some(c => c.type === "timetable_clash" || c.type === "carryover_spillover") && (
        <div className="rounded-xl bg-clash/8 border border-clash/20 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-clash" />
            <span className="text-sm font-semibold text-clash">Active Timetable Conflicts</span>
          </div>
          {student.conflicts.filter(c => c.type === "timetable_clash" || c.type === "carryover_spillover").map((c, i) => (
            <div key={i} className="text-xs text-foreground/50 flex items-start gap-2">
              <XCircle className="w-3 h-3 text-clash flex-shrink-0 mt-0.5" />
              <span>{c.description}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ExamTimetablePlaceholder({ student }: { student: Student }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground/60 flex items-center gap-2">
          <FileText className="w-4 h-4" /> Exam Timetable — Semester {student.semester}
        </h3>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent-gold/15 border border-accent-gold/30 text-accent-gold font-semibold">Not Yet Released</span>
      </div>

      <div className="rounded-2xl border border-foreground/10 overflow-hidden">
        <div className="px-5 py-3 border-b border-foreground/10 bg-foreground/[0.03] grid grid-cols-[1fr_80px_80px_100px] gap-3">
          {["Course", "Date", "Time", "Venue"].map(h => (
            <span key={h} className="text-[10px] font-semibold text-foreground/25 uppercase">{h}</span>
          ))}
        </div>
        {student.registeredCourses.slice(0, 6).map((course, i) => (
          <div key={course.code} className={`px-5 py-3.5 border-b border-foreground/5 last:border-b-0 grid grid-cols-[1fr_80px_80px_100px] gap-3 items-center ${i % 2 === 0 ? "" : "bg-foreground/[0.03]"}`}>
            <div>
              <div className="font-bold text-foreground/50 text-sm">{course.code}</div>
              <div className="text-[10px] text-foreground/25 truncate">{course.title}</div>
            </div>
            <div className="h-4 rounded bg-foreground/5 border border-foreground/10 flex items-center justify-center">
              <span className="text-[8px] text-foreground/15 blur-[2px]">TBA</span>
            </div>
            <div className="h-4 rounded bg-foreground/5 border border-foreground/10 flex items-center justify-center">
              <span className="text-[8px] text-foreground/15 blur-[2px]">TBA</span>
            </div>
            <div className="h-4 rounded bg-foreground/5 border border-foreground/10 flex items-center justify-center">
              <span className="text-[8px] text-foreground/15 blur-[2px]">TBA</span>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-8 flex flex-col items-center justify-center text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-primary/15 border border-primary/20 flex items-center justify-center">
          <Calendar className="w-7 h-7 text-primary" />
        </div>
        <div>
          <div className="text-lg font-bold text-primary">Exam Timetable Coming Soon</div>
          <p className="text-sm text-foreground/40 mt-1.5 max-w-sm">
            The Examination Officer has not yet published the exam timetable for Semester {student.semester}, 2024/2025.
            You will be notified via WhatsApp and email when it is released.
          </p>
        </div>
        <div className="flex items-center gap-2 pt-1">
          <Bell className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs text-primary/70">Notifications enabled for your exam schedule</span>
        </div>
      </div>
    </div>
  );
}

function DownloadPanel({ student, onDownload }: { student: Student; onDownload: (type: string) => void }) {
  const items = [
    { id: "timetable", label: "My Weekly Timetable",  desc: "Full lecture schedule as PDF", icon: Calendar,      color: "text-secondary",     bg: "bg-secondary/10 border-secondary/20" },
    { id: "courses",   label: "Course Registration",  desc: "All registered courses and CU",icon: BookOpen,      color: "text-success", bg: "bg-success/10 border-success/20" },
    { id: "conflicts", label: "Conflict Report",       desc: "Full ScheduleFlex analysis",      icon: AlertTriangle, color: "text-clash",     bg: "bg-clash/10 border-clash/20",      disabled: student.conflicts.length === 0 },
    { id: "profile",   label: "Student Profile Card", desc: "Academic summary and CGPA",    icon: User,          color: "text-primary",  bg: "bg-primary/10 border-primary/20" },
    { id: "exam",      label: "Exam Timetable",        desc: "Not yet available",            icon: FileText,      color: "text-foreground/20",    bg: "bg-foreground/5 border-foreground/10",           disabled: true },
  ];
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Download className="w-4 h-4 text-foreground/40" />
        <h3 className="text-sm font-semibold text-foreground/60">Downloads and Exports</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map(item => {
          const Icon = item.icon;
          return (
            <button key={item.id} onClick={() => !item.disabled && onDownload(item.id)} disabled={item.disabled}
              className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${item.disabled ? "border-foreground/5 bg-foreground/[0.03] cursor-not-allowed opacity-40" : `${item.bg} hover:brightness-110`}`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border ${item.bg}`}>
                <Icon className={`w-4 h-4 ${item.color}`} />
              </div>
              <div className="min-w-0">
                <div className={`text-sm font-semibold ${item.disabled ? "text-foreground/30" : "text-foreground"}`}>{item.label}</div>
                <div className="text-xs text-foreground/35 mt-0.5">{item.desc}</div>
              </div>
              {!item.disabled && <Download className={`w-3.5 h-3.5 ${item.color} ml-auto flex-shrink-0 mt-0.5`} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StudentSettings({ onClose }: { onClose: () => void }) {
  const [notifs, setNotifs] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-foreground/15 bg-muted shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-foreground/10">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-foreground/40" />
            <span className="font-semibold text-foreground text-sm">Student Settings</span>
          </div>
          <button onClick={onClose} className="text-foreground/30 hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-foreground/5 border border-foreground/10">
            <div className="flex items-center gap-3">
              {darkMode ? <Moon className="w-4 h-4 text-primary" /> : <Sun className="w-4 h-4 text-accent-gold" />}
              <div>
                <div className="text-sm font-medium text-foreground">{darkMode ? "Dark" : "Light"} Mode</div>
                <div className="text-xs text-foreground/35">Toggle appearance</div>
              </div>
            </div>
            <button onClick={() => setDarkMode(!darkMode)}
              className={`w-11 h-6 rounded-full transition-colors relative ${darkMode ? "bg-primary" : "bg-foreground/20"}`}>
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${darkMode ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-foreground/5 border border-foreground/10">
            <div className="flex items-center gap-3">
              <Bell className="w-4 h-4 text-secondary" />
              <div>
                <div className="text-sm font-medium text-foreground">WhatsApp Notifications</div>
                <div className="text-xs text-foreground/35">Clash alerts and exam notices</div>
              </div>
            </div>
            <button onClick={() => setNotifs(!notifs)}
              className={`w-11 h-6 rounded-full transition-colors relative ${notifs ? "bg-secondary" : "bg-foreground/20"}`}>
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${notifs ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
          </div>
          <div className="p-3 rounded-xl bg-foreground/5 border border-foreground/10 space-y-2">
            <div className="text-sm font-medium text-foreground">Default Landing Tab</div>
            <div className="grid grid-cols-2 gap-1.5">
              {["Courses", "Timetable", "Conflicts", "Profile"].map(tab => (
                <button key={tab}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${tab === "Courses" ? "bg-clash/15 border-clash/30 text-clash" : "bg-foreground/5 border-foreground/10 text-foreground/40 hover:bg-foreground/10"}`}>
                  {tab}
                </button>
              ))}
            </div>
          </div>
          <p className="text-[10px] text-foreground/25 text-center">Settings saved automatically to your ScheduleFlex profile.</p>
        </div>
      </div>
    </div>
  );
}

export default function StudentPage() {
  const [student, setStudent] = useState<Student>(FEATURED_STUDENTS[0]);
  const [activeTab, setActiveTab] = useState<TabId>("courses");
  const [downloadToast, setDownloadToast] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const handleSelect = (s: Student) => {
    setStudent(s);
    setActiveTab(s.conflicts.length > 0 ? "conflicts" : "courses");
  };

  const handleDownload = (type: string) => {
    setDownloadToast(type);
    setTimeout(() => setDownloadToast(null), 3500);
  };

  const criticalCount = student.conflicts.filter(c => c.severity === "critical").length;
  const warningCount  = student.conflicts.filter(c => c.severity === "warning").length;
  const lc = LEVEL_COLORS[student.level as Level] ?? LEVEL_COLORS[100];

  const TABS = [
    { id: "courses"   as TabId, label: "Courses",                           icon: BookOpen },
    { id: "timetable" as TabId, label: "Timetable",                         icon: Calendar },
    { id: "conflicts" as TabId, label: `Conflicts (${student.conflicts.length})`, icon: AlertTriangle },
    { id: "exam"      as TabId, label: "Exam",                              icon: FileText },
    { id: "profile"   as TabId, label: "Profile",                           icon: User },
  ];

  return (
    <DemoLayout activeRole="st" roleName={student.name} roleSubtitle={`${student.dept} · ${student.level} Level`} conflictCount={criticalCount}>
      <div className="px-4 sm:px-6 py-8 space-y-6 max-w-5xl mx-auto">

        {/* Hero */}
        <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-5">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <div className="flex flex-col items-center gap-2">
              <StudentPassport student={student} size="lg" />
              <span className="text-[9px] text-foreground/25 text-center">Tap to upload photo</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <BookOpen className="w-3.5 h-3.5 text-clash" />
                    <span className="text-[10px] font-semibold text-clash uppercase tracking-widest">Student Portal</span>
                  </div>
                  <h1 className="text-2xl font-bold text-foreground">{student.name}</h1>
                  <p className="text-foreground/40 text-sm mt-0.5">{student.matric}</p>
                  <p className="text-foreground/30 text-xs mt-0.5">{student.deptName} · {student.level} Level · Semester {student.semester}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleDownload("profile")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-foreground/5 border border-foreground/10 hover:bg-foreground/10 transition-colors text-xs text-foreground/50">
                    <Download className="w-3 h-3" /> Download
                  </button>
                  <button onClick={() => setShowSettings(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-foreground/5 border border-foreground/10 hover:bg-foreground/10 transition-colors text-xs text-foreground/50">
                    <Settings className="w-3 h-3" /> Settings
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-4">
                {[
                  { label: "CGPA",      value: student.cgpa, className: cgpaColor(student.cgpa) },
                  { label: "Credit CU", value: student.totalCreditUnits, className: "text-foreground" },
                  { label: "Courses",   value: student.registeredCourses.length, className: "text-foreground" },
                  { label: "Conflicts", value: student.conflicts.length, className: student.conflicts.length === 0 ? "text-success" : criticalCount > 0 ? "text-clash" : "text-accent-gold" },
                  { label: "Level",     value: `${student.level}L`, className: lc.badge.replace("bg-", "text-").replace("-600", "-400") },
                  { label: "Semester",  value: `S${student.semester}`, className: "text-foreground" },
                ].map(s => (
                  <div key={s.label} className="rounded-lg bg-foreground/5 border border-foreground/10 p-2 text-center">
                    <div className={`text-base font-bold ${s.className}`}>{s.value}</div>
                    <div className="text-[9px] text-foreground/30">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <ProfileSelector selected={student} onSelect={handleSelect} />
          </div>
        </div>

        {/* Conflict banner */}
        {student.conflicts.length > 0 && (
          <div className="rounded-2xl border border-clash/20 bg-clash/5 p-4 space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <AlertTriangle className="w-5 h-5 text-clash" />
              <span className="text-sm font-semibold text-clash">
                {student.conflicts.length} Issue{student.conflicts.length > 1 ? "s" : ""} Detected by ScheduleFlex
              </span>
              <div className="flex gap-2 ml-auto">
                {criticalCount > 0 && <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-clash text-white">{criticalCount} Critical</span>}
                {warningCount > 0 && <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-accent-gold text-black">{warningCount} Warning</span>}
              </div>
            </div>
            {student.conflicts.map((c, i) => {
              const cfg = CONFLICT_CONFIG[c.type];
              const Icon = cfg.icon;
              return (
                <button key={i} onClick={() => setActiveTab("conflicts")}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-clash/10 transition-colors text-left group">
                  <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${cfg.color}`} />
                  <span className="text-xs text-foreground/60 group-hover:text-foreground flex-1 truncate">{c.title}</span>
                  <ChevronRight className="w-3 h-3 text-foreground/20 flex-shrink-0" />
                </button>
              );
            })}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-foreground/5 border border-foreground/10 rounded-xl p-1 flex-wrap">
          {TABS.map(t => {
            const Icon = t.icon;
            const isConflictTab = t.id === "conflicts";
            return (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === t.id
                    ? isConflictTab && student.conflicts.length > 0
                      ? "bg-clash/20 text-clash shadow"
                      : "bg-foreground/10 text-foreground shadow"
                    : "text-foreground/40 hover:text-foreground/70"
                }`}>
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* COURSES TAB */}
        {activeTab === "courses" && (
          <div className="space-y-4">
            <CourseTable student={student} />
            <div className="rounded-2xl border border-foreground/10 p-5 space-y-3">
              <h3 className="text-sm font-semibold text-foreground/50 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" /> Credit Unit Breakdown
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { type: "core",      label: "Core",      color: "bg-secondary" },
                  { type: "elective",  label: "Elective",  color: "bg-primary" },
                  { type: "general",   label: "GST",       color: "bg-accent-gold" },
                  { type: "practical", label: "Practical", color: "bg-success" },
                ].map(t => {
                  const cu = student.registeredCourses.filter(c => c.type === t.type).reduce((s, c) => s + c.creditUnit, 0);
                  return (
                    <div key={t.type} className="rounded-xl bg-foreground/5 border border-foreground/10 p-3 space-y-2">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${t.color}`} />
                        <span className="text-xs text-foreground/40">{t.label}</span>
                      </div>
                      <div className="text-xl font-bold text-foreground">{cu} CU</div>
                      <div className="h-1 bg-foreground/10 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${t.color}`} style={{ width: `${Math.min(100, (cu / (student.totalCreditUnits || 1)) * 100)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <CGPABar cgpa={student.cgpa} />
            </div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => handleDownload("courses")}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-success/10 border border-success/20 text-success text-sm hover:bg-success/20 transition-colors">
                <Download className="w-3.5 h-3.5" /> Download Course List
              </button>
              <button onClick={() => handleDownload("timetable")}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary/10 border border-secondary/20 text-secondary text-sm hover:bg-secondary/20 transition-colors">
                <Printer className="w-3.5 h-3.5" /> Print Timetable
              </button>
            </div>
          </div>
        )}

        {/* TIMETABLE TAB */}
        {activeTab === "timetable" && (
          <div className="space-y-4">
            <StudentWeeklyTimetable student={student} />
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => handleDownload("timetable")}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary/10 border border-secondary/20 text-secondary text-sm hover:bg-secondary/20 transition-colors">
                <Download className="w-3.5 h-3.5" /> Download Timetable PDF
              </button>
              {student.conflicts.length > 0 && (
                <button onClick={() => handleDownload("conflicts")}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-clash/10 border border-clash/20 text-clash text-sm hover:bg-clash/20 transition-colors">
                  <Download className="w-3.5 h-3.5" /> Download Clash Report
                </button>
              )}
            </div>
          </div>
        )}

        {/* CONFLICTS TAB */}
        {activeTab === "conflicts" && (
          <div className="space-y-4">
            {student.conflicts.length === 0 ? (
              <div className="rounded-2xl border border-success/20 bg-success/5 p-12 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-success mx-auto" />
                <div className="text-lg font-semibold text-success">All Clear — Zero Conflicts</div>
                <p className="text-sm text-foreground/40 max-w-sm mx-auto">
                  {student.name}&apos;s registration has been verified. All {student.registeredCourses.length} courses are scheduled without conflict.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <p className="text-sm text-foreground/40">{student.conflicts.length} issue{student.conflicts.length > 1 ? "s" : ""} — {criticalCount} critical, {warningCount} warning</p>
                  <button onClick={() => handleDownload("conflicts")}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-clash/10 border border-clash/20 text-clash text-xs hover:bg-clash/20 transition-colors">
                    <Download className="w-3 h-3" /> Export Report
                  </button>
                </div>
                {student.conflicts.map((c, i) => <ConflictCard key={i} conflict={c} />)}
              </>
            )}
          </div>
        )}

        {/* EXAM TAB */}
        {activeTab === "exam" && <ExamTimetablePlaceholder student={student} />}

        {/* PROFILE TAB */}
        {activeTab === "profile" && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-6 space-y-5">
              <div className="flex items-start gap-4">
                <StudentPassport student={student} size="lg" />
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-foreground">{student.name}</h2>
                  <p className="text-foreground/50 text-sm mt-1">{student.deptName}</p>
                  {student.profileNote && <p className="text-xs text-foreground/30 mt-2 leading-relaxed italic">{student.profileNote}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: "Matric Number", value: student.matric },
                  { label: "Level",         value: `${student.level} Level` },
                  { label: "Department",    value: student.dept },
                  { label: "Email",         value: student.email },
                  { label: "Phone",         value: student.phone },
                  { label: "Semester",      value: `Semester ${student.semester}` },
                ].map(f => (
                  <div key={f.label} className="rounded-xl bg-foreground/5 border border-foreground/10 p-3">
                    <div className="text-xs text-foreground/30">{f.label}</div>
                    <div className="text-sm text-foreground/70 mt-0.5 truncate">{f.value}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-foreground/10 p-5 space-y-4">
              <h3 className="text-sm font-semibold text-foreground/50 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Academic Standing
              </h3>
              <CGPABar cgpa={student.cgpa} />
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="rounded-xl bg-foreground/5 border border-foreground/10 p-3">
                  <div className="text-xs text-foreground/30">Registered CU</div>
                  <div className={`text-xl font-bold mt-1 ${student.totalCreditUnits > 24 ? "text-clash" : "text-foreground"}`}>{student.totalCreditUnits}</div>
                </div>
                <div className="rounded-xl bg-foreground/5 border border-foreground/10 p-3">
                  <div className="text-xs text-foreground/30">Courses</div>
                  <div className="text-xl font-bold text-foreground mt-1">{student.registeredCourses.length}</div>
                </div>
              </div>
            </div>
            <DownloadPanel student={student} onDownload={handleDownload} />
          </div>
        )}
      </div>

      {/* Download toast */}
      {downloadToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-muted border border-foreground/15 shadow-2xl">
          <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
          <div>
            <div className="text-sm font-semibold text-foreground capitalize">{downloadToast} ready</div>
            <div className="text-xs text-foreground/40">Demo: file would download to your device</div>
          </div>
          <button onClick={() => setDownloadToast(null)} className="ml-2 text-foreground/30 hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Settings modal */}
      {showSettings && <StudentSettings onClose={() => setShowSettings(false)} />}
    </DemoLayout>
  );
}
