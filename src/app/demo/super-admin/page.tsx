"use client";

import { useState } from "react";
import {
  ChevronDown, ChevronRight, Building2, Users, BookMarked,
  FlaskConical, Monitor, BarChart3, AlertTriangle,
  ShieldCheck, Layers, GraduationCap, CheckCircle2, DoorOpen,
} from "lucide-react";
import { DemoLayout } from "../_components/DemoLayout";
import {
  FOCUS_FACULTY, OTHER_FACULTIES, DEPARTMENTS, LECTURE_FACILITIES,
  FACILITY_SUMMARY, getStudentDistribution,
} from "../_data/fedko-faculties";
import { POPULATION_SUMMARY, getFacultyTotals } from "../_data/fedko-students";
import { FEDKO_ROOMS, utilizationPercent } from "../_data/fedko-rooms";
import { TIMETABLE, getConflictSlots } from "../_data/fedko-timetable";

// ── Helpers ───────────────────────────────────────────────────
function StatCard({
  label, value, sub, icon: Icon, color,
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string;
}) {
  return (
    <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-5 space-y-3">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-4 h-4 text-foreground" />
      </div>
      <div>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        <div className="text-sm text-foreground/50 mt-0.5">{label}</div>
        {sub && <div className="text-xs text-foreground/30 mt-1">{sub}</div>}
      </div>
    </div>
  );
}

// ── Faculty row (non-focus) ───────────────────────────────────
function OtherFacultyRow({
  faculty,
}: {
  faculty: (typeof OTHER_FACULTIES)[number];
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-foreground/10 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-foreground/5 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-foreground/5 border border-foreground/10 flex items-center justify-center">
            <Building2 className="w-4 h-4 text-foreground/40" />
          </div>
          <div>
            <div className="font-medium text-foreground/80 text-sm">{faculty.name}</div>
            <div className="text-xs text-foreground/35 mt-0.5">{faculty.departments.length} departments</div>
          </div>
        </div>
        {open ? (
          <ChevronDown className="w-4 h-4 text-foreground/30 flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-foreground/30 flex-shrink-0" />
        )}
      </button>
      {open && (
        <div className="border-t border-foreground/10 px-5 py-3 bg-foreground/[0.03]">
          <ul className="space-y-1.5">
            {faculty.departments.map((d) => (
              <li key={d} className="flex items-center gap-2 text-sm text-foreground/45">
                <span className="w-1 h-1 rounded-full bg-foreground/20" />
                {d}
              </li>
            ))}
          </ul>
          <p className="text-xs text-foreground/20 mt-3 italic">
            Presentation view only — full data available for Faculty of Physical &amp; Applied Sciences.
          </p>
        </div>
      )}
    </div>
  );
}

// ── SCI Dept Card ─────────────────────────────────────────────
function SCIDeptCard({ dept }: { dept: (typeof DEPARTMENTS)[number] }) {
  const [open, setOpen] = useState(false);
  const distribution = getStudentDistribution(dept);
  const totalStudents = Object.values(distribution).reduce((s, v) => s + v, 0);
  const lecturerRatio = `${Math.round(totalStudents / dept.totalLecturers)}:1`;

  // Students per dept from population summary
  const popRows = POPULATION_SUMMARY.filter(p => p.dept === dept.code);

  return (
    <div className="rounded-2xl border border-foreground/10 overflow-hidden bg-foreground/[0.03]">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-foreground/5 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/30 to-secondary/30 border border-primary/20 flex items-center justify-center">
            <BookMarked className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="font-semibold text-foreground text-sm">{dept.name}</div>
            <div className="text-xs text-foreground/40 mt-0.5">
              {dept.code} · {dept.hodTitle}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm font-semibold text-foreground">{totalStudents}</span>
            <span className="text-xs text-foreground/35">students</span>
          </div>
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm font-semibold text-foreground">{dept.totalLecturers}</span>
            <span className="text-xs text-foreground/35">lecturers</span>
          </div>
          <div className="hidden md:flex flex-col items-end">
            <span className={`text-sm font-semibold ${
              parseInt(lecturerRatio) <= 7 ? "text-success" : "text-accent-gold"
            }`}>{lecturerRatio}</span>
            <span className="text-xs text-foreground/35">ratio</span>
          </div>
          {open ? (
            <ChevronDown className="w-4 h-4 text-foreground/30" />
          ) : (
            <ChevronRight className="w-4 h-4 text-foreground/30" />
          )}
        </div>
      </button>

      {open && (
        <div className="border-t border-foreground/10 px-5 py-5 bg-foreground/[0.03] space-y-5">
          {/* HOD */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-foreground/5 border border-foreground/10">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-gold to-accent-gold flex items-center justify-center text-xs font-bold text-white">
              {dept.hod.split(" ").slice(-1)[0][0]}
            </div>
            <div>
              <div className="text-sm font-medium text-foreground">{dept.hod}</div>
              <div className="text-xs text-foreground/40">Head of Department · {dept.code}</div>
            </div>
          </div>

          {/* Student distribution by level */}
          <div>
            <p className="text-xs font-semibold text-foreground/40 uppercase tracking-widest mb-3">Student Distribution</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.entries(distribution).map(([level, count]) => {
                const colors: Record<string, string> = {
                  "100 Level": "from-secondary/20 to-secondary/10 border-secondary/20 text-secondary",
                  "200 Level": "from-success/20 to-success/10 border-success/20 text-success",
                  "300 Level": "from-accent-gold/20 to-accent-gold/10 border-accent-gold/20 text-accent-gold",
                  "400 Level": "from-clash/20 to-clash/10 border-clash/20 text-clash",
                };
                const conflicts = popRows.find(
                  p => p.level === parseInt(level) as 100|200|300|400
                )?.conflictsDetected ?? 0;
                return (
                  <div key={level} className={`rounded-xl bg-gradient-to-br border p-3 ${colors[level]}`}>
                    <div className="text-lg font-bold text-foreground">{count}</div>
                    <div className="text-xs text-foreground/50">{level}</div>
                    {conflicts > 0 && (
                      <div className="mt-1.5 flex items-center gap-1 text-accent-gold text-[10px]">
                        <AlertTriangle className="w-3 h-3" />
                        {conflicts} conflict{conflicts > 1 ? "s" : ""}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Courses + Degree */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-foreground/5 border border-foreground/10 p-3 space-y-1">
              <div className="text-xs text-foreground/40">Courses Offered</div>
              <div className="text-xl font-bold text-foreground">64</div>
              <div className="text-xs text-foreground/30">8 per sem × 2 × 4 yrs</div>
            </div>
            <div className="rounded-xl bg-foreground/5 border border-foreground/10 p-3 space-y-1">
              <div className="text-xs text-foreground/40">Degree Awarded</div>
              <div className="text-sm font-semibold text-foreground">{dept.degreeAwarded}</div>
              <div className="text-xs text-foreground/30">4-year programme</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function SuperAdminPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "science" | "facilities" | "rooms" | "conflicts" | "allFaculties">(
    "overview"
  );

  const { totalStudents, totalConflicts } = getFacultyTotals();

  const flaggedIssues = TIMETABLE.filter(s => s.conflictFlag);
  const systemClashes = getConflictSlots();

  const TABS = [
    { id: "overview", label: "Overview" },
    { id: "science", label: "Faculty of Science (SCI)" },
    { id: "facilities", label: "Facilities" },
    { id: "rooms", label: "Rooms & Utilization" },
    { id: "conflicts", label: "Conflicts & Issues" },
    { id: "allFaculties", label: "All Faculties" },
  ] as const;

  return (
    <DemoLayout
      activeRole="sa"
      roleName="Prof. Minato Namikaze"
      roleSubtitle="Super Admin · Vice-Chancellor's Office"
      conflictCount={totalConflicts}
    >
      <div className="px-4 sm:px-6 py-8 space-y-8 max-w-7xl mx-auto">

        {/* ── Page header ──────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <span className="text-xs font-semibold text-primary uppercase tracking-widest">Super Admin</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">Institutional Overview</h1>
            <p className="text-foreground/40 text-sm mt-1">Federal University of Konoha · 2024/2025 Session</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Full Access</span>
          </div>
        </div>

        {/* ── Tabs ─────────────────────────────── */}
        <div className="flex gap-1 bg-foreground/5 border border-foreground/10 rounded-xl p-1 w-fit flex-wrap">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === t.id
                  ? "bg-foreground/10 text-foreground shadow"
                  : "text-foreground/40 hover:text-foreground/70"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ══ OVERVIEW TAB ══════════════════════ */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <StatCard label="Faculties" value={9} icon={Building2} color="bg-primary" />
              <StatCard label="Departments" value={64} icon={Layers} color="bg-secondary" />
              <StatCard label="Students (SCI)" value={totalStudents.toLocaleString()} sub="Focus faculty" icon={Users} color="bg-success" />
              <StatCard label="Lecturers (SCI)" value={FOCUS_FACULTY.totalLecturers} sub="7:1 ratio maintained" icon={GraduationCap} color="bg-accent-gold" />
              <StatCard label="Facilities (SCI)" value={FACILITY_SUMMARY.total} sub="Halls, labs, theatres" icon={FlaskConical} color="bg-clash" />
              <StatCard label="Conflicts Detected" value={totalConflicts} sub="ScheduleFlex active" icon={AlertTriangle} color="bg-clash" />
            </div>

            {/* Ratio enforcement banner */}
            <div className="rounded-2xl border border-success/20 bg-success/5 p-5 flex items-start gap-4">
              <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-success text-sm">Student–Lecturer Ratio: 7:1 Enforced</div>
                <p className="text-sm text-foreground/50 mt-1">
                  All 12 departments in Faculty of Physical &amp; Applied Sciences maintain the NUC-mandated 7:1
                  student-to-lecturer ratio. ScheduleFlex monitors this in real time and alerts Institution Admin
                  when any department breaches the threshold.
                </p>
              </div>
            </div>

            {/* Faculty grid (all 9) */}
            <div>
              <h2 className="text-sm font-semibold text-foreground/40 uppercase tracking-widest mb-4">All Faculties — Quick View</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* Focus faculty card */}
                <button
                  onClick={() => setActiveTab("science")}
                  className="rounded-2xl border border-primary/30 bg-primary/10 p-4 text-left hover:bg-primary/15 transition-colors group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-primary uppercase tracking-wide">FOCUS</span>
                    <ChevronRight className="w-4 h-4 text-primary group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <div className="font-semibold text-foreground text-sm">{FOCUS_FACULTY.name}</div>
                  <div className="text-xs text-foreground/40 mt-1">12 departments · Full data available</div>
                  <div className="mt-3 flex gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-md bg-foreground/10 text-foreground/50">{totalStudents} students</span>
                    <span className="text-xs px-2 py-0.5 rounded-md bg-foreground/10 text-foreground/50">{FOCUS_FACULTY.totalLecturers} lecturers</span>
                  </div>
                </button>

                {OTHER_FACULTIES.map(f => (
                  <div key={f.id} className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-4">
                    <div className="font-semibold text-foreground/70 text-sm">{f.name}</div>
                    <div className="text-xs text-foreground/30 mt-1">{f.departments.length} departments</div>
                    <div className="mt-2 text-[10px] text-foreground/20 italic">Click "All Faculties" tab to expand</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══ SCIENCE TAB ═══════════════════════ */}
        {activeTab === "science" && (
          <div className="space-y-6">
            {/* Faculty header */}
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 space-y-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h2 className="text-lg font-bold text-foreground">{FOCUS_FACULTY.name}</h2>
                  <p className="text-sm text-foreground/40 mt-1">Dean: {FOCUS_FACULTY.deanName} · Est. {FOCUS_FACULTY.established}</p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Depts", v: DEPARTMENTS.length },
                    { label: "Students", v: totalStudents.toLocaleString() },
                    { label: "Lecturers", v: FOCUS_FACULTY.totalLecturers },
                  ].map(s => (
                    <div key={s.label} className="rounded-xl bg-foreground/5 border border-foreground/10 p-3 text-center">
                      <div className="text-lg font-bold text-foreground">{s.v}</div>
                      <div className="text-xs text-foreground/35">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Dept cards */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-foreground/30 uppercase tracking-widest">
                12 Departments — Click to expand
              </p>
              {DEPARTMENTS.map(d => (
                <SCIDeptCard key={d.id} dept={d} />
              ))}
            </div>
          </div>
        )}

        {/* ══ FACILITIES TAB ════════════════════ */}
        {activeTab === "facilities" && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Lecture Halls", value: FACILITY_SUMMARY.lectureHalls, icon: BarChart3, color: "bg-secondary" },
                { label: "Laboratories", value: FACILITY_SUMMARY.laboratories, icon: FlaskConical, color: "bg-success" },
                { label: "Computer Labs", value: FACILITY_SUMMARY.computerLabs, icon: Monitor, color: "bg-primary" },
                { label: "Theatres", value: FACILITY_SUMMARY.theatres, icon: Users, color: "bg-accent-gold" },
              ].map(s => (
                <StatCard key={s.label} label={s.label} value={s.value} icon={s.icon} color={s.color} />
              ))}
            </div>

            {/* Facility list */}
            <div className="rounded-2xl border border-foreground/10 overflow-hidden">
              <div className="px-5 py-3 border-b border-foreground/10 bg-foreground/[0.03]">
                <p className="text-sm font-semibold text-foreground/60">All Facilities — Faculty of Physical &amp; Applied Sciences</p>
                <p className="text-xs text-foreground/30 mt-0.5">Shared faculty pool. Not assigned at department level.</p>
              </div>
              <div className="divide-y divide-white/5">
                {LECTURE_FACILITIES.map(f => (
                  <div key={f.id} className="flex items-center justify-between px-5 py-3 hover:bg-foreground/[0.03] transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        f.type === "Lecture Hall" ? "bg-secondary" :
                        f.type === "Laboratory" ? "bg-success" :
                        f.type === "Computer Lab" ? "bg-primary" : "bg-accent-gold"
                      }`} />
                      <div>
                        <div className="text-sm font-medium text-foreground/80">{f.name}</div>
                        <div className="text-xs text-foreground/35">{f.type} · {f.floor} Floor</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {f.dept && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-foreground/5 border border-foreground/10 text-foreground/40">
                          {f.dept}
                        </span>
                      )}
                      <span className="text-sm font-semibold text-foreground/60">{f.capacity}</span>
                      <span className="text-xs text-foreground/30">seats</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══ ROOMS & UTILIZATION TAB ═══════════ */}
        {activeTab === "rooms" && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard
                label="Total Rooms"
                value={FEDKO_ROOMS.length}
                icon={DoorOpen}
                color="bg-primary"
              />
              <StatCard
                label="Lecture Halls/Theatres"
                value={FEDKO_ROOMS.filter(r => r.type === "Lecture Hall" || r.type === "Lecture Theatre").length}
                icon={BarChart3}
                color="bg-secondary"
              />
              <StatCard
                label="Laboratories"
                value={FEDKO_ROOMS.filter(r => r.type === "Laboratory").length}
                icon={FlaskConical}
                color="bg-success"
              />
              <StatCard
                label="Total Capacity"
                value={FEDKO_ROOMS.reduce((sum, r) => sum + r.capacity, 0).toLocaleString()}
                sub="seats across all rooms"
                icon={Users}
                color="bg-accent-gold"
              />
            </div>

            {/* Room list with real utilization from the live timetable */}
            <div className="rounded-2xl border border-foreground/10 overflow-hidden">
              <div className="px-5 py-3 border-b border-foreground/10 bg-foreground/[0.03]">
                <p className="text-sm font-semibold text-foreground/60">Room Utilization — Faculty of Science</p>
                <p className="text-xs text-foreground/30 mt-0.5">Weekly slot usage computed from the actual generated timetable, not estimated.</p>
              </div>
              <div className="divide-y divide-white/5">
                {FEDKO_ROOMS.map(room => {
                  const pct = utilizationPercent(room);
                  return (
                    <div key={room.code} className="flex items-center justify-between px-5 py-3 hover:bg-foreground/[0.03] transition-colors gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${
                          room.type === "Laboratory" ? "bg-success" :
                          room.type === "Lecture Theatre" ? "bg-accent-gold" : "bg-secondary"
                        }`} />
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-foreground/80 truncate">{room.code}</div>
                          <div className="text-xs text-foreground/35">{room.type} · {room.building}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <span className="text-xs text-foreground/30 hidden sm:inline">{room.capacity} seats</span>
                        <div className="flex items-center gap-2 w-32">
                          <div className="flex-1 h-1.5 rounded-full bg-foreground/10 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${pct >= 70 ? "bg-clash" : pct >= 40 ? "bg-accent-gold" : "bg-success"}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-foreground/60 w-9 text-right">{pct}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ══ CONFLICTS & ISSUES TAB ════════════ */}
        {activeTab === "conflicts" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <StatCard
                label="Flagged Issues"
                value={flaggedIssues.length}
                sub="with documented cause"
                icon={AlertTriangle}
                color="bg-clash"
              />
              <StatCard
                label="System-Detected Clashes"
                value={systemClashes.length}
                sub="venue/time double-bookings"
                icon={AlertTriangle}
                color="bg-accent-gold"
              />
              <StatCard
                label="Resolution Rate"
                value="100%"
                sub="engine halts before publishing on unresolved clashes"
                icon={CheckCircle2}
                color="bg-success"
              />
            </div>

            {/* Flagged issues with reasons */}
            <div className="rounded-2xl border border-foreground/10 overflow-hidden">
              <div className="px-5 py-3 border-b border-foreground/10 bg-foreground/[0.03]">
                <p className="text-sm font-semibold text-foreground/60">Flagged Issues — Documented Cause</p>
                <p className="text-xs text-foreground/30 mt-0.5">Real conflicts detected during generation, each with a specific, human-readable reason.</p>
              </div>
              <div className="divide-y divide-white/5">
                {flaggedIssues.length === 0 && (
                  <div className="px-5 py-6 text-center text-sm text-foreground/30">No flagged issues — timetable clean.</div>
                )}
                {flaggedIssues.map(slot => (
                  <div key={slot.id} className="px-5 py-4 hover:bg-foreground/[0.03] transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <AlertTriangle className="w-4 h-4 text-clash shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-foreground/80">
                            {slot.courseCode} — {slot.day} {slot.startTime}–{slot.endTime} · {slot.venue}
                          </div>
                          <div className="text-xs text-foreground/40 mt-1 leading-relaxed">{slot.conflictReason}</div>
                        </div>
                      </div>
                      <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-md bg-clash/10 border border-clash/20 text-clash font-medium">
                        {slot.dept} {slot.level}L
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* System-detected venue/time clashes */}
            <div className="rounded-2xl border border-foreground/10 overflow-hidden">
              <div className="px-5 py-3 border-b border-foreground/10 bg-foreground/[0.03]">
                <p className="text-sm font-semibold text-foreground/60">System-Detected Clashes</p>
                <p className="text-xs text-foreground/30 mt-0.5">Same venue, same time slot — caught automatically before publishing.</p>
              </div>
              <div className="divide-y divide-white/5">
                {systemClashes.length === 0 && (
                  <div className="px-5 py-6 text-center text-sm text-foreground/30">No venue/time clashes detected.</div>
                )}
                {systemClashes.map((slot, i) => (
                  <div key={`${slot.id}-${i}`} className="flex items-center justify-between px-5 py-3 hover:bg-foreground/[0.03] transition-colors gap-4">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-foreground/80 truncate">{slot.courseCode} — {slot.courseTitle}</div>
                      <div className="text-xs text-foreground/35 mt-0.5">{slot.day} {slot.startTime}–{slot.endTime} · {slot.venue}</div>
                    </div>
                    <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-md bg-accent-gold/10 border border-accent-gold/20 text-accent-gold font-medium">
                      {slot.dept}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══ ALL FACULTIES TAB ═════════════════ */}
        {activeTab === "allFaculties" && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-foreground/30 uppercase tracking-widest">
              All 9 Faculties — Department Lists
            </p>
            {/* Focus faculty */}
            <div className="rounded-xl border border-primary/30 bg-primary/5 px-5 py-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                <span className="font-semibold text-primary text-sm">{FOCUS_FACULTY.name}</span>
                <span className="text-xs text-foreground/30">(Full data — see Science tab)</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {DEPARTMENTS.map(d => (
                  <span key={d.code} className="text-xs px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-primary">
                    {d.code}
                  </span>
                ))}
              </div>
            </div>

            {OTHER_FACULTIES.map(f => (
              <OtherFacultyRow key={f.id} faculty={f} />
            ))}
          </div>
        )}

      </div>
    </DemoLayout>
  );
}
