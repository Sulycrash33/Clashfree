"use client";

import { useState } from "react";
import {
  ChevronDown, ChevronRight, Building2, Users, BookMarked,
  FlaskConical, Monitor, BarChart3, AlertTriangle,
  ShieldCheck, Layers, GraduationCap, CheckCircle2,
} from "lucide-react";
import { DemoLayout } from "../_components/DemoLayout";
import {
  FOCUS_FACULTY, OTHER_FACULTIES, DEPARTMENTS, LECTURE_FACILITIES,
  FACILITY_SUMMARY, getStudentDistribution,
} from "../_data/fedko-faculties";
import { POPULATION_SUMMARY, getFacultyTotals } from "../_data/fedko-students";

// ── Helpers ───────────────────────────────────────────────────
function StatCard({
  label, value, sub, icon: Icon, color,
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-3">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <div>
        <div className="text-2xl font-bold text-white">{value}</div>
        <div className="text-sm text-white/50 mt-0.5">{label}</div>
        {sub && <div className="text-xs text-white/30 mt-1">{sub}</div>}
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
    <div className="rounded-xl border border-white/10 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
            <Building2 className="w-4 h-4 text-white/40" />
          </div>
          <div>
            <div className="font-medium text-white/80 text-sm">{faculty.name}</div>
            <div className="text-xs text-white/35 mt-0.5">{faculty.departments.length} departments</div>
          </div>
        </div>
        {open ? (
          <ChevronDown className="w-4 h-4 text-white/30 flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-white/30 flex-shrink-0" />
        )}
      </button>
      {open && (
        <div className="border-t border-white/10 px-5 py-3 bg-white/[0.02]">
          <ul className="space-y-1.5">
            {faculty.departments.map((d) => (
              <li key={d} className="flex items-center gap-2 text-sm text-white/45">
                <span className="w-1 h-1 rounded-full bg-white/20" />
                {d}
              </li>
            ))}
          </ul>
          <p className="text-xs text-white/20 mt-3 italic">
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
    <div className="rounded-2xl border border-white/10 overflow-hidden bg-white/[0.02]">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600/30 to-blue-600/30 border border-violet-400/20 flex items-center justify-center">
            <BookMarked className="w-4 h-4 text-violet-300" />
          </div>
          <div>
            <div className="font-semibold text-white text-sm">{dept.name}</div>
            <div className="text-xs text-white/40 mt-0.5">
              {dept.code} · {dept.hodTitle}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm font-semibold text-white">{totalStudents}</span>
            <span className="text-xs text-white/35">students</span>
          </div>
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm font-semibold text-white">{dept.totalLecturers}</span>
            <span className="text-xs text-white/35">lecturers</span>
          </div>
          <div className="hidden md:flex flex-col items-end">
            <span className={`text-sm font-semibold ${
              parseInt(lecturerRatio) <= 7 ? "text-emerald-400" : "text-amber-400"
            }`}>{lecturerRatio}</span>
            <span className="text-xs text-white/35">ratio</span>
          </div>
          {open ? (
            <ChevronDown className="w-4 h-4 text-white/30" />
          ) : (
            <ChevronRight className="w-4 h-4 text-white/30" />
          )}
        </div>
      </button>

      {open && (
        <div className="border-t border-white/10 px-5 py-5 bg-white/[0.01] space-y-5">
          {/* HOD */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-xs font-bold text-white">
              {dept.hod.split(" ").slice(-1)[0][0]}
            </div>
            <div>
              <div className="text-sm font-medium text-white">{dept.hod}</div>
              <div className="text-xs text-white/40">Head of Department · {dept.code}</div>
            </div>
          </div>

          {/* Student distribution by level */}
          <div>
            <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">Student Distribution</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.entries(distribution).map(([level, count]) => {
                const colors: Record<string, string> = {
                  "100 Level": "from-blue-600/20 to-blue-700/10 border-blue-400/20 text-blue-300",
                  "200 Level": "from-green-600/20 to-green-700/10 border-green-400/20 text-green-300",
                  "300 Level": "from-amber-600/20 to-amber-700/10 border-amber-400/20 text-amber-300",
                  "400 Level": "from-red-600/20 to-red-700/10 border-red-400/20 text-red-300",
                };
                const conflicts = popRows.find(
                  p => p.level === parseInt(level) as 100|200|300|400
                )?.conflictsDetected ?? 0;
                return (
                  <div key={level} className={`rounded-xl bg-gradient-to-br border p-3 ${colors[level]}`}>
                    <div className="text-lg font-bold text-white">{count}</div>
                    <div className="text-xs text-white/50">{level}</div>
                    {conflicts > 0 && (
                      <div className="mt-1.5 flex items-center gap-1 text-amber-400 text-[10px]">
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
            <div className="rounded-xl bg-white/5 border border-white/10 p-3 space-y-1">
              <div className="text-xs text-white/40">Courses Offered</div>
              <div className="text-xl font-bold text-white">64</div>
              <div className="text-xs text-white/30">8 per sem × 2 × 4 yrs</div>
            </div>
            <div className="rounded-xl bg-white/5 border border-white/10 p-3 space-y-1">
              <div className="text-xs text-white/40">Degree Awarded</div>
              <div className="text-sm font-semibold text-white">{dept.degreeAwarded}</div>
              <div className="text-xs text-white/30">4-year programme</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function SuperAdminPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "science" | "facilities" | "allFaculties">(
    "overview"
  );

  const { totalStudents, totalConflicts } = getFacultyTotals();

  const TABS = [
    { id: "overview", label: "Overview" },
    { id: "science", label: "Faculty of Science (SCI)" },
    { id: "facilities", label: "Facilities" },
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
              <ShieldCheck className="w-5 h-5 text-violet-400" />
              <span className="text-xs font-semibold text-violet-400 uppercase tracking-widest">Super Admin</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Institutional Overview</h1>
            <p className="text-white/40 text-sm mt-1">Federal University of Konoha · 2024/2025 Session</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-500/10 border border-violet-400/20">
            <ShieldCheck className="w-4 h-4 text-violet-400" />
            <span className="text-sm font-medium text-violet-300">Full Access</span>
          </div>
        </div>

        {/* ── Tabs ─────────────────────────────── */}
        <div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1 w-fit flex-wrap">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === t.id
                  ? "bg-white/10 text-white shadow"
                  : "text-white/40 hover:text-white/70"
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
              <StatCard label="Faculties" value={9} icon={Building2} color="bg-violet-600" />
              <StatCard label="Departments" value={64} icon={Layers} color="bg-sky-600" />
              <StatCard label="Students (SCI)" value={totalStudents.toLocaleString()} sub="Focus faculty" icon={Users} color="bg-emerald-600" />
              <StatCard label="Lecturers (SCI)" value={FOCUS_FACULTY.totalLecturers} sub="7:1 ratio maintained" icon={GraduationCap} color="bg-amber-600" />
              <StatCard label="Facilities (SCI)" value={FACILITY_SUMMARY.total} sub="Halls, labs, theatres" icon={FlaskConical} color="bg-rose-600" />
              <StatCard label="Conflicts Detected" value={totalConflicts} sub="ClashFree active" icon={AlertTriangle} color="bg-red-700" />
            </div>

            {/* Ratio enforcement banner */}
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 flex items-start gap-4">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-emerald-300 text-sm">Student–Lecturer Ratio: 7:1 Enforced</div>
                <p className="text-sm text-white/50 mt-1">
                  All 12 departments in Faculty of Physical &amp; Applied Sciences maintain the NUC-mandated 7:1
                  student-to-lecturer ratio. ClashFree monitors this in real time and alerts Institution Admin
                  when any department breaches the threshold.
                </p>
              </div>
            </div>

            {/* Faculty grid (all 9) */}
            <div>
              <h2 className="text-sm font-semibold text-white/40 uppercase tracking-widest mb-4">All Faculties — Quick View</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* Focus faculty card */}
                <button
                  onClick={() => setActiveTab("science")}
                  className="rounded-2xl border border-violet-400/30 bg-violet-500/10 p-4 text-left hover:bg-violet-500/15 transition-colors group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-violet-400 uppercase tracking-wide">FOCUS</span>
                    <ChevronRight className="w-4 h-4 text-violet-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <div className="font-semibold text-white text-sm">{FOCUS_FACULTY.name}</div>
                  <div className="text-xs text-white/40 mt-1">12 departments · Full data available</div>
                  <div className="mt-3 flex gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-md bg-white/10 text-white/50">{totalStudents} students</span>
                    <span className="text-xs px-2 py-0.5 rounded-md bg-white/10 text-white/50">{FOCUS_FACULTY.totalLecturers} lecturers</span>
                  </div>
                </button>

                {OTHER_FACULTIES.map(f => (
                  <div key={f.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                    <div className="font-semibold text-white/70 text-sm">{f.name}</div>
                    <div className="text-xs text-white/30 mt-1">{f.departments.length} departments</div>
                    <div className="mt-2 text-[10px] text-white/20 italic">Click "All Faculties" tab to expand</div>
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
            <div className="rounded-2xl border border-violet-400/20 bg-violet-500/5 p-6 space-y-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h2 className="text-lg font-bold text-white">{FOCUS_FACULTY.name}</h2>
                  <p className="text-sm text-white/40 mt-1">Dean: {FOCUS_FACULTY.deanName} · Est. {FOCUS_FACULTY.established}</p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Depts", v: DEPARTMENTS.length },
                    { label: "Students", v: totalStudents.toLocaleString() },
                    { label: "Lecturers", v: FOCUS_FACULTY.totalLecturers },
                  ].map(s => (
                    <div key={s.label} className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
                      <div className="text-lg font-bold text-white">{s.v}</div>
                      <div className="text-xs text-white/35">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Dept cards */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-white/30 uppercase tracking-widest">
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
                { label: "Lecture Halls", value: FACILITY_SUMMARY.lectureHalls, icon: BarChart3, color: "bg-sky-600" },
                { label: "Laboratories", value: FACILITY_SUMMARY.laboratories, icon: FlaskConical, color: "bg-emerald-600" },
                { label: "Computer Labs", value: FACILITY_SUMMARY.computerLabs, icon: Monitor, color: "bg-violet-600" },
                { label: "Theatres", value: FACILITY_SUMMARY.theatres, icon: Users, color: "bg-amber-600" },
              ].map(s => (
                <StatCard key={s.label} label={s.label} value={s.value} icon={s.icon} color={s.color} />
              ))}
            </div>

            {/* Facility list */}
            <div className="rounded-2xl border border-white/10 overflow-hidden">
              <div className="px-5 py-3 border-b border-white/10 bg-white/[0.02]">
                <p className="text-sm font-semibold text-white/60">All Facilities — Faculty of Physical &amp; Applied Sciences</p>
                <p className="text-xs text-white/30 mt-0.5">Shared faculty pool. Not assigned at department level.</p>
              </div>
              <div className="divide-y divide-white/5">
                {LECTURE_FACILITIES.map(f => (
                  <div key={f.id} className="flex items-center justify-between px-5 py-3 hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        f.type === "Lecture Hall" ? "bg-sky-400" :
                        f.type === "Laboratory" ? "bg-emerald-400" :
                        f.type === "Computer Lab" ? "bg-violet-400" : "bg-amber-400"
                      }`} />
                      <div>
                        <div className="text-sm font-medium text-white/80">{f.name}</div>
                        <div className="text-xs text-white/35">{f.type} · {f.floor} Floor</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {f.dept && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-white/40">
                          {f.dept}
                        </span>
                      )}
                      <span className="text-sm font-semibold text-white/60">{f.capacity}</span>
                      <span className="text-xs text-white/30">seats</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══ ALL FACULTIES TAB ═════════════════ */}
        {activeTab === "allFaculties" && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-white/30 uppercase tracking-widest">
              All 9 Faculties — Department Lists
            </p>
            {/* Focus faculty */}
            <div className="rounded-xl border border-violet-400/30 bg-violet-500/5 px-5 py-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-violet-400" />
                <span className="font-semibold text-violet-300 text-sm">{FOCUS_FACULTY.name}</span>
                <span className="text-xs text-white/30">(Full data — see Science tab)</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {DEPARTMENTS.map(d => (
                  <span key={d.code} className="text-xs px-2 py-0.5 rounded-md bg-violet-500/10 border border-violet-400/20 text-violet-300">
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
