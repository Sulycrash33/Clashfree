"use client";

import { useState, useMemo } from "react";
import {
  CalendarClock, Filter, AlertTriangle, CheckCircle2,
  ChevronDown, ChevronRight, X, Sliders, Wand2,
  Clock, MapPin, User, BookOpen, RefreshCw,
  Download, Eye, EyeOff, Zap, Info,
} from "lucide-react";
import { DemoLayout } from "../_components/DemoLayout";
import {
  TIMETABLE, DAYS, LEVEL_COLORS, filterByDept,
  filterByLevel, filterByDeptAndLevel, getConflictSlots,
  type Day, type Level, type TimetableSlot,
} from "../_data/fedko-timetable";
import { DEPARTMENTS } from "../_data/fedko-faculties";

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const TIME_ROWS = [
  "08:00","09:00","10:00","11:00","12:00",
  "13:00","14:00","15:00","16:00","17:00",
];

const DEPT_OPTIONS = [
  { value: "ALL", label: "All Departments" },
  ...DEPARTMENTS.map(d => ({ value: d.code, label: `${d.code} — ${d.name.replace("Department of ", "")}` })),
];

const LEVEL_OPTIONS: { value: "ALL" | Level; label: string }[] = [
  { value: "ALL", label: "All Levels" },
  { value: 100, label: "100 Level" },
  { value: 200, label: "200 Level" },
  { value: 300, label: "300 Level" },
  { value: 400, label: "400 Level" },
];

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

// Convert a slot's start/end into grid row positions (each row = 60 min, base 08:00)
function slotToGridRows(slot: TimetableSlot) {
  const base = 8 * 60;
  const top = (timeToMinutes(slot.startTime) - base) / 60; // in hours from 08:00
  const height = (timeToMinutes(slot.endTime) - timeToMinutes(slot.startTime)) / 60;
  return { top, height };
}

// ─────────────────────────────────────────────
// Slot card
// ─────────────────────────────────────────────
function SlotCard({
  slot,
  onClick,
  compact = false,
}: {
  slot: TimetableSlot;
  onClick: (s: TimetableSlot) => void;
  compact?: boolean;
}) {
  if (slot.slotType === "break") return null;

  const isJumuah = slot.slotType === "jumuah";
  const isConflict = slot.conflictFlag;
  const isPractical = slot.slotType === "practical";
  const isProject = slot.slotType === "project";

  const baseClass = isJumuah
    ? "bg-emerald-900/40 border-emerald-500/40 text-emerald-300"
    : isConflict
    ? "bg-red-900/40 border-red-500/50 text-red-200 ring-1 ring-red-500/30"
    : isPractical
    ? `${slot.colorClass} opacity-80 border-dashed`
    : isProject
    ? "bg-purple-900/40 border-purple-500/40 text-purple-200"
    : slot.colorClass;

  return (
    <button
      onClick={() => onClick(slot)}
      className={`
        w-full text-left rounded-lg border px-2 py-1.5 text-[11px] leading-tight
        transition-all duration-150 hover:brightness-110 hover:shadow-md
        ${baseClass}
        ${compact ? "min-h-[36px]" : "min-h-[52px]"}
      `}
    >
      {isJumuah ? (
        <div className="flex items-center gap-1 font-medium">
          <span>🕌</span>
          <span className="truncate">Jumuah</span>
        </div>
      ) : (
        <>
          <div className="font-bold truncate">{slot.courseCode}</div>
          {!compact && (
            <div className="truncate opacity-70 mt-0.5 text-[10px]">{slot.courseTitle}</div>
          )}
          {isConflict && (
            <div className="flex items-center gap-0.5 mt-1 text-red-400">
              <AlertTriangle className="w-2.5 h-2.5" />
              <span className="text-[9px] font-bold">CONFLICT</span>
            </div>
          )}
          {isPractical && !compact && (
            <span className="text-[9px] opacity-60">PRACTICAL</span>
          )}
          {isProject && !compact && (
            <span className="text-[9px] opacity-70">PROJECT</span>
          )}
        </>
      )}
    </button>
  );
}

// ─────────────────────────────────────────────
// Slot detail modal
// ─────────────────────────────────────────────
function SlotModal({ slot, onClose }: { slot: TimetableSlot; onClose: () => void }) {
  const lc = LEVEL_COLORS[slot.level as Level] ?? LEVEL_COLORS[100];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[#13131f] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className={`px-6 py-4 border-b border-white/10 ${slot.conflictFlag ? "bg-red-900/20" : "bg-white/[0.02]"}`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${lc.badge} text-white`}>
                  {slot.level} Level
                </span>
                {slot.conflictFlag && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-red-600 text-white flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> CONFLICT
                  </span>
                )}
                {slot.slotType === "practical" && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-purple-600/70 text-white">PRACTICAL</span>
                )}
                {slot.slotType === "project" && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-violet-600/70 text-white">PROJECT</span>
                )}
              </div>
              <div className="text-lg font-bold text-white mt-2">{slot.courseCode}</div>
              <div className="text-sm text-white/60 mt-0.5">{slot.courseTitle}</div>
            </div>
            <button onClick={onClose} className="text-white/30 hover:text-white p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Details */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Clock, label: "Time", value: `${slot.startTime} – ${slot.endTime}` },
              { icon: CalendarClock, label: "Day", value: slot.day },
              { icon: MapPin, label: "Venue", value: slot.venue },
              { icon: User, label: "Lecturer", value: slot.lecturerName },
              { icon: BookOpen, label: "Department", value: slot.dept },
              { icon: Filter, label: "Capacity", value: `${slot.venueCapacity} seats` },
            ].map(d => {
              const Icon = d.icon;
              return (
                <div key={d.label} className="rounded-xl bg-white/5 border border-white/10 p-3 space-y-1">
                  <div className="flex items-center gap-1.5 text-white/40">
                    <Icon className="w-3 h-3" />
                    <span className="text-[10px] uppercase tracking-wide">{d.label}</span>
                  </div>
                  <div className="text-sm font-medium text-white/80 truncate">{d.value}</div>
                </div>
              );
            })}
          </div>

          {/* Conflict detail */}
          {slot.conflictFlag && slot.conflictReason && (
            <div className="rounded-xl bg-red-500/10 border border-red-400/20 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span className="text-sm font-semibold text-red-300">Conflict Detected by ClashFree</span>
              </div>
              <p className="text-sm text-white/55 leading-relaxed">{slot.conflictReason}</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white/60 hover:bg-white/10 hover:text-white transition-colors">
              <RefreshCw className="w-3.5 h-3.5" />
              Reschedule
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white/60 hover:bg-white/10 hover:text-white transition-colors">
              <MapPin className="w-3.5 h-3.5" />
              Change Venue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Generate Timetable Wizard
// ─────────────────────────────────────────────
function GenerateWizard({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [done, setDone] = useState(false);

  const [params, setParams] = useState({
    semester: "1",
    session: "2024/2025",
    timeFrom: "08:00",
    timeTo: "18:00",
    periodLength: "2",
    breakAfter: "2",
    breakDuration: "60",
    jumuah: true,
    depts: ["ALL"],
    levels: ["100", "200", "300", "400"],
    avoidMonday: false,
    distribute3CU: true,
    prioritiseLabs: true,
  });

  const STEPS = [
    { n: 1, label: "Time Frame" },
    { n: 2, label: "Departments & Levels" },
    { n: 3, label: "Rules & Constraints" },
    { n: 4, label: "Generate" },
  ];

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => { setGenerating(false); setDone(true); }, 2200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-white/15 bg-[#13131f] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-violet-400" />
            <span className="font-semibold text-white text-sm">Generate Timetable</span>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center px-6 py-3 border-b border-white/10 gap-2">
          {STEPS.map((s, i) => (
            <div key={s.n} className="flex items-center gap-2 flex-1">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                step > s.n ? "bg-emerald-600 text-white"
                : step === s.n ? "bg-violet-600 text-white"
                : "bg-white/10 text-white/30"
              }`}>
                {step > s.n ? <CheckCircle2 className="w-3.5 h-3.5" /> : s.n}
              </div>
              <span className={`text-xs hidden sm:block transition-colors ${
                step === s.n ? "text-white" : "text-white/30"
              }`}>{s.label}</span>
              {i < STEPS.length - 1 && <div className="flex-1 h-px bg-white/10 hidden sm:block" />}
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 max-h-[55vh] overflow-y-auto">
          {/* Step 1: Time Frame */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-white">Time Frame & Session</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Academic Session", key: "session", type: "select", options: ["2024/2025", "2025/2026"] },
                  { label: "Semester", key: "semester", type: "select", options: ["1", "2"] },
                  { label: "Start Time", key: "timeFrom", type: "select", options: ["07:00", "08:00", "09:00"] },
                  { label: "End Time", key: "timeTo", type: "select", options: ["17:00", "18:00", "19:00"] },
                  { label: "Period Length (hrs)", key: "periodLength", type: "select", options: ["1", "2", "3"] },
                  { label: "Break After (periods)", key: "breakAfter", type: "select", options: ["1", "2", "3"] },
                ].map(f => (
                  <div key={f.key} className="space-y-1">
                    <label className="text-xs text-white/50">{f.label}</label>
                    <select
                      value={(params as any)[f.key]}
                      onChange={e => setParams(p => ({ ...p, [f.key]: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                    >
                      {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                <div>
                  <div className="text-sm text-white/70">Include Friday Jumuah break</div>
                  <div className="text-xs text-white/35">13:00–14:00 reserved for prayers</div>
                </div>
                <button
                  onClick={() => setParams(p => ({ ...p, jumuah: !p.jumuah }))}
                  className={`w-10 h-5 rounded-full transition-colors relative ${params.jumuah ? "bg-emerald-600" : "bg-white/20"}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${params.jumuah ? "left-[22px]" : "left-0.5"}`} />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Departments & Levels */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-white">Departments & Levels to Schedule</h3>
              <div className="space-y-2">
                <label className="text-xs text-white/50">Departments</label>
                <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                  {[{ value: "ALL", label: "All Departments" }, ...DEPARTMENTS.map(d => ({ value: d.code, label: d.code }))].map(d => {
                    const sel = params.depts.includes(d.value);
                    return (
                      <button
                        key={d.value}
                        onClick={() => setParams(p => ({
                          ...p,
                          depts: sel
                            ? p.depts.filter(x => x !== d.value)
                            : [...p.depts.filter(x => x !== "ALL"), d.value],
                        }))}
                        className={`px-3 py-2 rounded-xl border text-xs font-medium text-left transition-colors ${
                          sel ? "bg-violet-600/20 border-violet-400/30 text-violet-300" : "bg-white/5 border-white/10 text-white/40 hover:text-white/70"
                        }`}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-white/50">Levels</label>
                <div className="grid grid-cols-4 gap-2">
                  {(["100", "200", "300", "400"] as const).map(lv => {
                    const sel = params.levels.includes(lv);
                    const lvNum = parseInt(lv) as Level;
                    const lc = LEVEL_COLORS[lvNum];
                    return (
                      <button
                        key={lv}
                        onClick={() => setParams(p => ({
                          ...p,
                          levels: sel ? p.levels.filter(x => x !== lv) : [...p.levels, lv],
                        }))}
                        className={`px-3 py-2 rounded-xl border text-xs font-bold transition-colors ${
                          sel ? `${lc.badge} border-transparent text-white` : "bg-white/5 border-white/10 text-white/40"
                        }`}
                      >
                        {lv}L
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Rules */}
          {step === 3 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-white">Scheduling Rules & Constraints</h3>
              {[
                {
                  key: "distribute3CU",
                  label: "Distribute 3CU courses across non-consecutive days",
                  sub: "Prevents 3 back-to-back lectures for same course",
                },
                {
                  key: "prioritiseLabs",
                  label: "Prioritise lab rooms for practical courses",
                  sub: "Auto-assign practicals to available lab venues",
                },
                {
                  key: "avoidMonday",
                  label: "Avoid scheduling on Monday mornings (optional)",
                  sub: "Leaves Monday 08:00–10:00 open for admin",
                },
              ].map(r => (
                <div key={r.key} className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 border border-white/10">
                  <div>
                    <div className="text-sm text-white/70">{r.label}</div>
                    <div className="text-xs text-white/30 mt-0.5">{r.sub}</div>
                  </div>
                  <button
                    onClick={() => setParams(p => ({ ...p, [r.key]: !(p as any)[r.key] }))}
                    className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${(params as any)[r.key] ? "bg-emerald-600" : "bg-white/20"}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${(params as any)[r.key] ? "left-[22px]" : "left-0.5"}`} />
                  </button>
                </div>
              ))}
              <div className="rounded-xl bg-amber-500/5 border border-amber-400/20 p-3 flex gap-2">
                <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-white/50">
                  ClashFree enforces the NUC rule: no student or lecturer has 3 consecutive 2-hour lectures without a break.
                  This is automatic and cannot be disabled.
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Generate */}
          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-white">Review & Generate</h3>
              <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/40">Session</span>
                  <span className="text-white">{params.session} · Sem {params.semester}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Time Window</span>
                  <span className="text-white">{params.timeFrom} – {params.timeTo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Jumuah Break</span>
                  <span className={params.jumuah ? "text-emerald-400" : "text-white/40"}>
                    {params.jumuah ? "Enabled (Fri 13:00–14:00)" : "Disabled"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Departments</span>
                  <span className="text-white">{params.depts.includes("ALL") ? "All 12" : params.depts.join(", ")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Levels</span>
                  <span className="text-white">{params.levels.map(l => `${l}L`).join(", ")}</span>
                </div>
              </div>

              {done ? (
                <div className="rounded-xl bg-emerald-500/10 border border-emerald-400/20 p-4 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <div>
                    <div className="text-sm font-semibold text-emerald-300">Timetable Generated Successfully</div>
                    <div className="text-xs text-white/40 mt-0.5">
                      No conflicts detected. 768 courses scheduled across 5 days.
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    generating
                      ? "bg-violet-600/50 text-white/60 cursor-not-allowed"
                      : "bg-gradient-to-r from-violet-600 to-blue-600 text-white hover:opacity-90"
                  }`}
                >
                  {generating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Generating — analysing 768 courses…
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      Generate Timetable
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10">
          <button
            onClick={() => step > 1 ? setStep(s => s - 1) : onClose()}
            className="px-4 py-2 rounded-xl border border-white/10 text-sm text-white/50 hover:text-white hover:bg-white/5 transition-colors"
          >
            {step === 1 ? "Cancel" : "← Back"}
          </button>
          {step < 4 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-white text-black text-sm font-semibold hover:bg-white/90 transition-colors"
            >
              Next →
            </button>
          ) : done ? (
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500 transition-colors"
            >
              Close
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main timetable grid
// ─────────────────────────────────────────────
function TimetableGrid({
  slots,
  onSlotClick,
}: {
  slots: TimetableSlot[];
  onSlotClick: (s: TimetableSlot) => void;
}) {
  // Group slots by day
  const byDay = useMemo(() => {
    const map: Record<Day, TimetableSlot[]> = {
      Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [],
    };
    slots.forEach(s => {
      if (s.slotType !== "break" && map[s.day]) map[s.day].push(s);
    });
    return map;
  }, [slots]);

  const ROW_HEIGHT = 56; // px per hour
  const TOTAL_HOURS = 10; // 08:00–18:00

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10">
      <div className="min-w-[700px]">
        {/* Day headers */}
        <div className="grid grid-cols-[60px_repeat(5,1fr)] border-b border-white/10">
          <div className="py-3 px-2 border-r border-white/10" />
          {DAYS.map(d => (
            <div key={d} className="py-3 px-3 text-center border-r border-white/10 last:border-r-0">
              <span className="text-xs font-semibold text-white/60 uppercase tracking-wide">{d.slice(0, 3)}</span>
            </div>
          ))}
        </div>

        {/* Grid body */}
        <div className="grid grid-cols-[60px_repeat(5,1fr)] relative" style={{ height: `${TOTAL_HOURS * ROW_HEIGHT}px` }}>
          {/* Time axis */}
          <div className="border-r border-white/10 relative">
            {TIME_ROWS.map((t, i) => (
              <div
                key={t}
                className="absolute right-0 left-0 flex items-center justify-end pr-2 border-t border-white/5"
                style={{ top: `${i * ROW_HEIGHT}px`, height: `${ROW_HEIGHT}px` }}
              >
                <span className="text-[10px] text-white/25">{t}</span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {DAYS.map(day => {
            const daySlots = byDay[day];
            return (
              <div
                key={day}
                className="relative border-r border-white/10 last:border-r-0"
                style={{ height: `${TOTAL_HOURS * ROW_HEIGHT}px` }}
              >
                {/* Hour grid lines */}
                {TIME_ROWS.map((_, i) => (
                  <div
                    key={i}
                    className="absolute inset-x-0 border-t border-white/5"
                    style={{ top: `${i * ROW_HEIGHT}px` }}
                  />
                ))}

                {/* Slots */}
                {daySlots.map(slot => {
                  const { top, height } = slotToGridRows(slot);
                  // clamp to grid
                  const clampedTop = Math.max(0, top);
                  const clampedH = Math.min(height, TOTAL_HOURS - clampedTop);
                  if (clampedH <= 0) return null;

                  return (
                    <div
                      key={slot.id}
                      className="absolute inset-x-1 z-10"
                      style={{
                        top: `${clampedTop * ROW_HEIGHT + 2}px`,
                        height: `${clampedH * ROW_HEIGHT - 4}px`,
                      }}
                    >
                      <SlotCard slot={slot} onClick={onSlotClick} compact={clampedH < 1.5} />
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────
export default function TimetableOfficerPage() {
  const [deptFilter, setDeptFilter] = useState<string>("ALL");
  const [levelFilter, setLevelFilter] = useState<"ALL" | Level>("ALL");
  const [showConflictsOnly, setShowConflictsOnly] = useState(false);
  const [showJumuah, setShowJumuah] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<TimetableSlot | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [view, setView] = useState<"grid" | "list">("grid");

  // Filter logic
  const filteredSlots = useMemo(() => {
    let slots = [...TIMETABLE];

    if (!showJumuah) slots = slots.filter(s => s.slotType !== "jumuah");
    if (showConflictsOnly) slots = slots.filter(s => s.conflictFlag);
    if (deptFilter !== "ALL") slots = slots.filter(s => s.dept === deptFilter || s.dept === "ALL");
    if (levelFilter !== "ALL") slots = slots.filter(s => s.level === levelFilter);

    return slots;
  }, [deptFilter, levelFilter, showConflictsOnly, showJumuah]);

  const conflictSlots = useMemo(() => getConflictSlots(), []);
  const totalSlots = filteredSlots.filter(s => s.slotType !== "break").length;

  return (
    <DemoLayout
      activeRole="to"
      roleName="Mr. Konohamaru Sarutobi"
      roleSubtitle="Timetable Officer · Faculty of Physical & Applied Sciences"
      conflictCount={conflictSlots.length}
    >
      {selectedSlot && <SlotModal slot={selectedSlot} onClose={() => setSelectedSlot(null)} />}
      {showWizard && <GenerateWizard onClose={() => setShowWizard(false)} />}

      <div className="px-4 sm:px-6 py-8 space-y-6 max-w-full">

        {/* ── Header ──────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CalendarClock className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-widest">Timetable Officer</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Weekly Timetable</h1>
            <p className="text-white/40 text-sm mt-1">
              Faculty of Physical & Applied Sciences · Semester 1, 2024/2025 · Mon–Fri 08:00–18:00
            </p>
          </div>
          <button
            onClick={() => setShowWizard(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg"
          >
            <Wand2 className="w-4 h-4" />
            Generate Timetable
          </button>
        </div>

        {/* ── Conflict alert ──────────────────── */}
        {conflictSlots.length > 0 && (
          <div className="rounded-2xl border border-red-400/20 bg-red-500/5 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-sm font-semibold text-red-300">
                {conflictSlots.length} Timetable Conflicts Detected by ClashFree
              </span>
            </div>
            <div className="space-y-1">
              {conflictSlots.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSlot(s)}
                  className="w-full flex items-center justify-between text-left px-3 py-2 rounded-lg hover:bg-red-500/10 transition-colors group"
                >
                  <span className="text-sm text-white/60 group-hover:text-white transition-colors">
                    <span className="font-semibold text-red-300">{s.courseCode}</span>
                    {" — "}{s.conflictReason?.slice(0, 70)}…
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-red-400/60 flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Controls ────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Dept filter */}
          <div className="relative">
            <select
              value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}
              className="appearance-none bg-white/5 border border-white/10 rounded-xl pl-3 pr-8 py-2 text-sm text-white/70 focus:outline-none focus:border-white/30 cursor-pointer"
            >
              {DEPT_OPTIONS.map(o => (
                <option key={o.value} value={o.value} className="bg-[#13131f]">{o.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
          </div>

          {/* Level filter */}
          <div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
            {LEVEL_OPTIONS.map(opt => {
              const isActive = levelFilter === opt.value;
              const lc = opt.value !== "ALL" ? LEVEL_COLORS[opt.value as Level] : null;
              return (
                <button
                  key={opt.value}
                  onClick={() => setLevelFilter(opt.value as typeof levelFilter)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? lc ? `${lc.badge} text-white` : "bg-white/15 text-white"
                      : "text-white/35 hover:text-white/60"
                  }`}
                >
                  {opt.value === "ALL" ? "All" : `${opt.value}L`}
                </button>
              );
            })}
          </div>

          {/* Toggles */}
          <button
            onClick={() => setShowConflictsOnly(!showConflictsOnly)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-colors ${
              showConflictsOnly
                ? "bg-red-500/15 border-red-400/30 text-red-300"
                : "bg-white/5 border-white/10 text-white/40 hover:text-white/70"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Conflicts Only
          </button>

          <button
            onClick={() => setShowJumuah(!showJumuah)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-colors ${
              showJumuah
                ? "bg-emerald-500/15 border-emerald-400/30 text-emerald-300"
                : "bg-white/5 border-white/10 text-white/40"
            }`}
          >
            🕌 Jumuah
          </button>

          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-white/30">{totalSlots} slots</span>
            <button
              onClick={() => setView(v => v === "grid" ? "list" : "grid")}
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white transition-colors"
            >
              {view === "grid" ? <Filter className="w-3.5 h-3.5" /> : <CalendarClock className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* ── Level legend ────────────────────── */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(LEVEL_COLORS).map(([level, colors]) => (
            <div key={level} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${colors.bg} ${colors.border}`}>
              <div className={`w-2 h-2 rounded-full ${colors.badge}`} />
              <span className={`text-xs font-semibold ${colors.text}`}>{level} Level</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border bg-red-100/10 border-red-300/20">
            <AlertTriangle className="w-3 h-3 text-red-400" />
            <span className="text-xs font-semibold text-red-300">Conflict</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border bg-emerald-100/10 border-emerald-300/20">
            <span className="text-xs">🕌</span>
            <span className="text-xs font-semibold text-emerald-300">Jumuah</span>
          </div>
        </div>

        {/* ── Timetable grid ──────────────────── */}
        {view === "grid" ? (
          <TimetableGrid slots={filteredSlots} onSlotClick={setSelectedSlot} />
        ) : (
          /* List view */
          <div className="rounded-2xl border border-white/10 overflow-hidden">
            <div className="px-5 py-3 border-b border-white/10 bg-white/[0.02]">
              <p className="text-sm font-semibold text-white/60">All Scheduled Slots — List View</p>
            </div>
            <div className="divide-y divide-white/5">
              {filteredSlots
                .filter(s => s.slotType !== "break")
                .sort((a, b) => {
                  const dayOrder = DAYS.indexOf(a.day) - DAYS.indexOf(b.day);
                  if (dayOrder !== 0) return dayOrder;
                  return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
                })
                .map(s => {
                  const lc = LEVEL_COLORS[s.level as Level] ?? LEVEL_COLORS[100];
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSelectedSlot(s)}
                      className={`w-full flex items-center gap-4 px-5 py-3 text-left hover:bg-white/[0.03] transition-colors ${
                        s.conflictFlag ? "border-l-2 border-red-500" : ""
                      }`}
                    >
                      <div className={`w-1.5 h-8 rounded-full ${lc.badge} flex-shrink-0`} />
                      <div className="w-28 flex-shrink-0">
                        <div className="text-xs text-white/35">{s.day}</div>
                        <div className="text-sm font-medium text-white/70">{s.startTime}–{s.endTime}</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-white text-sm">{s.courseCode}</div>
                        <div className="text-xs text-white/40 truncate">{s.courseTitle}</div>
                      </div>
                      <div className="hidden sm:block flex-shrink-0 text-right">
                        <div className="text-xs text-white/50">{s.venue}</div>
                        <div className="text-xs text-white/30">{s.lecturerName}</div>
                      </div>
                      {s.conflictFlag && (
                        <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                      )}
                      <ChevronRight className="w-4 h-4 text-white/20 flex-shrink-0" />
                    </button>
                  );
                })}
            </div>
          </div>
        )}

        {/* ── Stats bar ───────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Slots Shown", value: totalSlots, color: "text-white" },
            { label: "Conflicts", value: conflictSlots.length, color: "text-red-400" },
            { label: "Practical Sessions", value: filteredSlots.filter(s => s.slotType === "practical").length, color: "text-purple-400" },
            { label: "Project Slots", value: filteredSlots.filter(s => s.slotType === "project").length, color: "text-violet-400" },
          ].map(s => (
            <div key={s.label} className="rounded-xl bg-white/[0.03] border border-white/10 px-4 py-3 flex items-center justify-between">
              <span className="text-xs text-white/35">{s.label}</span>
              <span className={`text-lg font-bold ${s.color}`}>{s.value}</span>
            </div>
          ))}
        </div>

      </div>
    </DemoLayout>
  );
}
