"use client";

import { useState, useMemo } from "react";
import {
  CalendarClock, Filter, AlertTriangle, CheckCircle2,
  ChevronDown, ChevronRight, X, Wand2, Clock, MapPin,
  User, BookOpen, RefreshCw, Download, Zap, Info,
  ShieldAlert, ShieldCheck, Gavel, Ban, RotateCcw,
  Bell, Search, Layers,
} from "lucide-react";
import { DemoLayout } from "../_components/DemoLayout";
import {
  TIMETABLE, DAYS, LEVEL_COLORS,
  filterByDept, filterByLevel, filterByDeptAndLevel, getConflictSlots,
  type Day, type Level, type TimetableSlot,
} from "../_data/fedko-timetable";
import { DEPARTMENTS } from "../_data/fedko-faculties";

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const TIME_BANDS = [
  { label: "08:00 – 10:00", start: "08:00", end: "10:00" },
  { label: "10:00 – 12:00", start: "10:00", end: "12:00" },
  { label: "12:00 – 14:00", start: "12:00", end: "14:00" },
  { label: "14:00 – 16:00", start: "14:00", end: "16:00" },
  { label: "16:00 – 18:00", start: "16:00", end: "18:00" },
];

const DEPT_OPTIONS = [
  { value: "ALL", label: "All Departments" },
  ...DEPARTMENTS.map(d => ({ value: d.code, label: `${d.code} — ${d.name.replace("Department of ", "")}` })),
];

const LEVEL_OPTIONS: { value: "ALL" | Level; label: string }[] = [
  { value: "ALL",  label: "All Levels" },
  { value: 100,    label: "100 Level" },
  { value: 200,    label: "200 Level" },
  { value: 300,    label: "300 Level" },
  { value: 400,    label: "400 Level" },
];

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type AdminAction = "override" | "enforce" | "waive" | "reschedule" | "cancel";
type ToastMsg = { text: string; color: string };

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

// Build grid: timeBand.start → day → TimetableSlot[]
function buildGrid(slots: TimetableSlot[]) {
  const map: Record<string, Record<string, TimetableSlot[]>> = {};
  TIME_BANDS.forEach(tb => {
    map[tb.start] = {};
    DAYS.forEach(d => { map[tb.start][d] = []; });
  });
  slots.forEach(slot => {
    if (slot.slotType === "break") return;
    const band = TIME_BANDS.find(tb => tb.start === slot.startTime);
    if (band && map[band.start]?.[slot.day] !== undefined) {
      map[band.start][slot.day].push(slot);
    }
  });
  return map;
}

// Conflict suggestion for a slot
function suggestResolution(slot: TimetableSlot): string {
  if (slot.conflictReason?.includes("venue")) {
    return `Move ${slot.courseCode} to an alternate venue (e.g. SCI LH 10 or LAB-GEN-01) on the same day and time.`;
  }
  if (slot.conflictReason?.includes("lecturer")) {
    return `Reassign ${slot.lecturerName}'s secondary course to a different time band on a day with no existing booking.`;
  }
  return `Reschedule ${slot.courseCode} from ${slot.day} ${slot.startTime} to an unoccupied band — e.g. ${slot.day} 16:00–18:00 in ${slot.venue}.`;
}

// ─────────────────────────────────────────────
// Slot chip — compact card inside each cell
// ─────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SlotChip({ slot, onClick, overridden }: { slot: TimetableSlot; onClick: (s: TimetableSlot) => void; overridden?: boolean }) {
  if (slot.slotType === "break") return null;

  const isJumuah   = slot.slotType === "jumuah";
  const isConflict = slot.conflictFlag;
  const lc         = LEVEL_COLORS[slot.level as Level] ?? LEVEL_COLORS[100];

  if (isJumuah) {
    return (
      <div className="rounded-md border border-success/20 bg-success/10 px-1.5 py-1 text-center">
        <div className="text-[9px] font-bold text-success">🕌 Jumu&apos;ah</div>
      </div>
    );
  }

  return (
    <button
      onClick={() => onClick(slot)}
      style={isConflict && !overridden ? {
        backgroundImage: "repeating-linear-gradient(45deg, rgba(255,255,255,0.07) 0px, rgba(255,255,255,0.07) 2px, transparent 2px, transparent 10px)",
        backgroundColor: "rgba(156,59,48,0.22)",
      } : undefined}
      className={`w-full text-left rounded-md border px-1.5 py-1 transition-all hover:brightness-110 hover:scale-[1.01] active:scale-95 ${
        overridden
          ? "bg-success/15 border-success/30"
          : isConflict
          ? "border-clash/50 ring-1 ring-clash/30"
          : `${lc.bg} ${lc.border}`
      }`}
    >
      <div className={`text-[10px] font-black truncate leading-tight ${
        overridden ? "text-success" : isConflict ? "text-clash" : lc.text
      }`}>
        {slot.courseCode}
      </div>
      <div className={`text-[8px] truncate mt-0.5 ${
        overridden ? "text-success/60" : isConflict ? "text-clash/70" : lc.text + " opacity-60"
      }`}>
        {slot.lecturerName.split(" ").slice(-1)[0]}
      </div>
      {isConflict && !overridden && (
        <div className="text-[8px] font-bold text-clash flex items-center gap-0.5 mt-0.5">
          <AlertTriangle className="w-2 h-2" /> CLASH
        </div>
      )}
      {overridden && (
        <div className="text-[8px] font-bold text-success mt-0.5">✓ OVERRIDDEN</div>
      )}
    </button>
  );
}

// ─────────────────────────────────────────────
// Slot detail + admin actions modal
// ─────────────────────────────────────────────
function SlotModal({
  slot, onClose, onAction, overridden,
}: {
  slot: TimetableSlot;
  onClose: () => void;
  onAction: (id: string, action: AdminAction) => void;
  overridden: boolean;
}) {
  const lc = LEVEL_COLORS[slot.level as Level] ?? LEVEL_COLORS[100];
  const [done, setDone] = useState<AdminAction | null>(null);

  const handleAction = (action: AdminAction) => {
    setDone(action);
    setTimeout(() => { onAction(slot.id, action); onClose(); }, 900);
  };

  const ADMIN_ACTIONS: { id: AdminAction; label: string; desc: string; icon: typeof Gavel; color: string; bg: string }[] = [
    { id: "override",   label: "Override Conflict",   desc: "Force this slot through despite the detected conflict", icon: Gavel,      color: "text-accent-gold",   bg: "bg-accent-gold/10 border-accent-gold/30" },
    { id: "enforce",    label: "Enforce Original",    desc: "Lock slot — no further changes allowed without SO approval", icon: ShieldCheck, color: "text-success", bg: "bg-success/10 border-success/30" },
    { id: "waive",      label: "Waive Conflict",      desc: "Acknowledge conflict but allow both slots to coexist", icon: ShieldAlert,  color: "text-secondary",     bg: "bg-secondary/10 border-secondary/30" },
    { id: "reschedule", label: "Reschedule Slot",     desc: "Move to next available band in same venue",            icon: RotateCcw,   color: "text-primary",  bg: "bg-primary/10 border-primary/30" },
    { id: "cancel",     label: "Cancel This Slot",    desc: "Remove from timetable — students notified via WhatsApp", icon: Ban,        color: "text-clash",     bg: "bg-clash/10 border-clash/30" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/15 bg-muted shadow-2xl overflow-hidden">
        {/* Header */}
        <div className={`px-6 py-4 border-b border-white/10 ${slot.conflictFlag ? "bg-clash/20" : "bg-white/[0.02]"}`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${lc.badge} text-white`}>{slot.level} Level</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-white/10 text-white/60">{slot.dept}</span>
                {slot.conflictFlag && !overridden && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-clash text-white flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> CONFLICT
                  </span>
                )}
                {overridden && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-success text-white flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> OVERRIDDEN
                  </span>
                )}
              </div>
              <div className="text-lg font-bold text-white mt-2">{slot.courseCode}</div>
              <div className="text-sm text-white/60 mt-0.5">{slot.courseTitle}</div>
            </div>
            <button onClick={onClose} className="text-white/30 hover:text-white p-1 flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
          {/* Slot details */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: Clock,    label: "Time",       value: `${slot.startTime} – ${slot.endTime}` },
              { icon: CalendarClock, label: "Day",   value: slot.day },
              { icon: MapPin,   label: "Venue",      value: slot.venue },
              { icon: User,     label: "Lecturer",   value: slot.lecturerName },
              { icon: BookOpen, label: "Dept",       value: slot.dept },
              { icon: Layers,   label: "Capacity",   value: `${slot.venueCapacity} seats` },
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

          {/* Conflict + suggestion */}
          {slot.conflictFlag && !overridden && (
            <div className="rounded-xl bg-clash/8 border border-clash/20 p-4 space-y-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-clash flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-semibold text-clash">ClashFree Conflict Detected</div>
                  <p className="text-xs text-white/50 mt-1 leading-relaxed">{slot.conflictReason ?? "Scheduling conflict at this time and venue."}</p>
                </div>
              </div>
              <div className="rounded-lg bg-success/8 border border-success/15 p-3 space-y-1">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-success" />
                  <span className="text-[10px] font-semibold text-success">Suggested Resolution</span>
                </div>
                <p className="text-xs text-white/50 leading-relaxed">{suggestResolution(slot)}</p>
              </div>
            </div>
          )}

          {/* Admin powers */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-accent-gold" />
              <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Timetable Officer Powers</span>
            </div>
            {ADMIN_ACTIONS.filter(a => !overridden || a.id !== "override").map(action => {
              const Icon = action.icon;
              const isDone = done === action.id;
              return (
                <button
                  key={action.id}
                  onClick={() => handleAction(action.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all hover:brightness-110 ${
                    isDone ? "bg-success/20 border-success/30" : `${action.bg} hover:scale-[1.005]`
                  }`}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isDone ? "text-success" : action.color}`} />
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-semibold ${isDone ? "text-success" : action.color}`}>
                      {isDone ? "✓ Applied" : action.label}
                    </div>
                    <div className="text-xs text-white/35 mt-0.5 leading-relaxed">{action.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>

          <p className="text-[10px] text-white/20 text-center">
            All actions are logged and reversible within 24 hours. Students notified automatically via WhatsApp.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Generate Wizard
// ─────────────────────────────────────────────
function GenerateWizard({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [done, setDone] = useState(false);
  const [params, setParams] = useState({
    semester: "1", session: "2024/2025",
    timeFrom: "08:00", timeTo: "18:00",
    periodLength: "2", jumuah: true,
    depts: ["ALL"],
    levels: ["100", "200", "300", "400"],
    distribute3CU: true, prioritiseLabs: true, avoidMonday: false,
  });

  const STEPS = [
    { n: 1, label: "Time Frame" },
    { n: 2, label: "Departments" },
    { n: 3, label: "Rules" },
    { n: 4, label: "Generate" },
  ];

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => { setGenerating(false); setDone(true); }, 2400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-white/15 bg-muted shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-primary" />
            <span className="font-semibold text-white text-sm">Generate Timetable</span>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white p-1"><X className="w-4 h-4" /></button>
        </div>

        {/* Steps */}
        <div className="flex items-center px-6 py-3 border-b border-white/10 gap-1">
          {STEPS.map((s, i) => (
            <div key={s.n} className="flex items-center gap-1 flex-1">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                step > s.n ? "bg-success text-white" : step === s.n ? "bg-primary text-white" : "bg-white/10 text-white/30"
              }`}>
                {step > s.n ? <CheckCircle2 className="w-3.5 h-3.5" /> : s.n}
              </div>
              <span className={`text-xs hidden sm:block ${step === s.n ? "text-white" : "text-white/30"}`}>{s.label}</span>
              {i < STEPS.length - 1 && <div className="flex-1 h-px bg-white/10 mx-1 hidden sm:block" />}
            </div>
          ))}
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[55vh] overflow-y-auto">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-white">Time Frame and Session</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Academic Session", key: "session",       options: ["2024/2025", "2025/2026"] },
                  { label: "Semester",         key: "semester",      options: ["1", "2"] },
                  { label: "Start Time",       key: "timeFrom",      options: ["07:00", "08:00"] },
                  { label: "End Time",         key: "timeTo",        options: ["17:00", "18:00"] },
                  { label: "Period Length (hrs)", key: "periodLength", options: ["1", "2", "3"] },
                ].map(f => (
                  <div key={f.key} className="space-y-1">
                    <label className="text-xs text-white/50">{f.label}</label>
                    <select
                      value={(params as unknown as Record<string, string>)[f.key]}
                      onChange={e => setParams(p => ({ ...p, [f.key]: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                    >
                      {f.options.map(o => <option key={o} value={o} className="bg-muted">{o}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                <div>
                  <div className="text-sm text-white/70">Include Friday Jumu&apos;ah break</div>
                  <div className="text-xs text-white/35">13:00–14:00 reserved for prayers</div>
                </div>
                <button onClick={() => setParams(p => ({ ...p, jumuah: !p.jumuah }))}
                  className={`w-10 h-5 rounded-full transition-colors relative ${params.jumuah ? "bg-success" : "bg-white/20"}`}>
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${params.jumuah ? "left-[22px]" : "left-0.5"}`} />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-white">Departments and Levels</h3>
              <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                {[{ value: "ALL", label: "All Departments" }, ...DEPARTMENTS.map(d => ({ value: d.code, label: d.code }))].map(d => {
                  const sel = params.depts.includes(d.value);
                  return (
                    <button key={d.value}
                      onClick={() => setParams(p => ({ ...p, depts: sel ? p.depts.filter(x => x !== d.value) : [...p.depts.filter(x => x !== "ALL"), d.value] }))}
                      className={`px-3 py-2 rounded-xl border text-xs font-medium text-left transition-colors ${
                        sel ? "bg-primary/20 border-primary/30 text-primary" : "bg-white/5 border-white/10 text-white/40 hover:text-white/70"
                      }`}>
                      {d.label}
                    </button>
                  );
                })}
              </div>
              <div className="grid grid-cols-4 gap-2">
                {(["100", "200", "300", "400"] as const).map(lv => {
                  const sel = params.levels.includes(lv);
                  const lc = LEVEL_COLORS[parseInt(lv) as Level];
                  return (
                    <button key={lv}
                      onClick={() => setParams(p => ({ ...p, levels: sel ? p.levels.filter(x => x !== lv) : [...p.levels, lv] }))}
                      className={`px-3 py-2 rounded-xl border text-xs font-bold transition-colors ${
                        sel ? `${lc.badge} border-transparent text-white` : "bg-white/5 border-white/10 text-white/40"
                      }`}>
                      {lv}L
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-white">Scheduling Rules</h3>
              {[
                { key: "distribute3CU", label: "Distribute 3CU courses across non-consecutive days", sub: "Prevents back-to-back lectures for same course" },
                { key: "prioritiseLabs", label: "Prioritise lab rooms for practical courses", sub: "Auto-assign practicals to available lab venues" },
                { key: "avoidMonday",  label: "Avoid Monday 08:00–10:00 (admin window)", sub: "Leaves first slot open for HOD meetings" },
              ].map(r => (
                <div key={r.key} className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 border border-white/10">
                  <div>
                    <div className="text-sm text-white/70">{r.label}</div>
                    <div className="text-xs text-white/30 mt-0.5">{r.sub}</div>
                  </div>
                  <button
                    onClick={() => setParams(p => ({ ...p, [r.key]: !(p as Record<string, unknown>)[r.key] }))}
                    className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${(params as Record<string, unknown>)[r.key] ? "bg-success" : "bg-white/20"}`}>
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${(params as Record<string, unknown>)[r.key] ? "left-[22px]" : "left-0.5"}`} />
                  </button>
                </div>
              ))}
              <div className="rounded-xl bg-accent-gold/5 border border-accent-gold/20 p-3 flex gap-2">
                <Info className="w-4 h-4 text-accent-gold flex-shrink-0 mt-0.5" />
                <p className="text-xs text-white/50">NUC rule: no student or lecturer has 3 consecutive 2-hour lectures without a break. This is enforced automatically.</p>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-white">Review and Generate</h3>
              <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-2 text-sm">
                {[
                  { label: "Session",       value: `${params.session} · Sem ${params.semester}` },
                  { label: "Time Window",   value: `${params.timeFrom} – ${params.timeTo}` },
                  { label: "Period Length", value: `${params.periodLength}hrs` },
                  { label: "Jumu\u02bbah",  value: params.jumuah ? "Enabled (Fri 13:00–14:00)" : "Disabled" },
                  { label: "Departments",   value: params.depts.includes("ALL") ? "All departments" : params.depts.join(", ") },
                  { label: "Levels",        value: params.levels.map(l => `${l}L`).join(", ") },
                ].map(row => (
                  <div key={row.label} className="flex justify-between">
                    <span className="text-white/40">{row.label}</span>
                    <span className="text-white text-right">{row.value}</span>
                  </div>
                ))}
              </div>

              {done ? (
                <div className="rounded-xl bg-success/10 border border-success/20 p-4 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-success" />
                  <div>
                    <div className="text-sm font-semibold text-success">Timetable Generated Successfully</div>
                    <div className="text-xs text-white/40 mt-0.5">No conflicts detected. 768 courses scheduled across 5 days.</div>
                  </div>
                </div>
              ) : (
                <button onClick={handleGenerate} disabled={generating}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    generating ? "bg-primary/50 text-white/60 cursor-not-allowed" : "bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90"
                  }`}>
                  {generating ? <><RefreshCw className="w-4 h-4 animate-spin" /> Generating…</> : <><Wand2 className="w-4 h-4" /> Generate Timetable</>}
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10">
          <button onClick={() => step > 1 ? setStep(s => s - 1) : onClose()}
            className="px-4 py-2 rounded-xl border border-white/10 text-sm text-white/50 hover:text-white hover:bg-white/5 transition-colors">
            {step === 1 ? "Cancel" : "← Back"}
          </button>
          {step < 4 ? (
            <button onClick={() => setStep(s => s + 1)}
              className="px-5 py-2 rounded-xl bg-white text-black text-sm font-semibold hover:bg-white/90 transition-colors">
              Next →
            </button>
          ) : done ? (
            <button onClick={onClose}
              className="px-5 py-2 rounded-xl bg-success text-white text-sm font-semibold hover:bg-success transition-colors">
              Close
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MASTER TIMETABLE GRID — table style, time bands as rows
// All slots shown by default; filter narrows it
// Large cells so all lectures in each period are visible
// ─────────────────────────────────────────────
function MasterGrid({
  slots, onSlotClick, overrides,
}: {
  slots: TimetableSlot[];
  onSlotClick: (s: TimetableSlot) => void;
  overrides: Record<string, AdminAction>;
}) {
  const grid = useMemo(() => buildGrid(slots), [slots]);

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10">
      <table className="w-full min-w-[700px] border-collapse">
        <thead>
          <tr className="border-b border-white/10 bg-white/[0.02]">
            <th className="px-3 py-3 text-left text-[10px] font-bold text-white/35 uppercase tracking-wider w-32 border-r border-white/10 sticky left-0 bg-card z-10">
              Time Band
            </th>
            {DAYS.map(d => (
              <th key={d} className="px-2 py-3 text-center text-[11px] font-bold text-white/55 uppercase border-r border-white/10 last:border-r-0 min-w-[120px]">
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {TIME_BANDS.map((band, bi) => (
            <tr key={band.start} className={`border-b border-white/5 last:border-b-0 ${bi % 2 === 0 ? "" : "bg-white/[0.01]"}`}>
              {/* Time label column — sticky */}
              <td className="px-3 py-2 border-r border-white/10 align-top sticky left-0 bg-card z-10">
                <div className="font-bold text-white/55 text-[10px] leading-tight whitespace-nowrap">{band.label}</div>
                {band.start === "12:00" && (
                  <div className="text-[8px] text-success/60 mt-1">incl. Jumu&apos;ah 13:00</div>
                )}
              </td>

              {/* Day cells */}
              {DAYS.map(day => {
                const cellSlots = grid[band.start]?.[day] ?? [];
                const isJumaat  = day === "Friday" && band.start === "12:00";
                const hasConflict = cellSlots.some(s => s.conflictFlag && !overrides[s.id]);

                return (
                  <td
                    key={day}
                    className={`px-1.5 py-1.5 border-r border-white/10 last:border-r-0 align-top min-w-[120px] ${
                      hasConflict ? "bg-clash/5" : isJumaat ? "bg-success/5" : ""
                    }`}
                  >
                    {/* Jumu'ah marker always present on Fri 12:00 band */}
                    {isJumaat && (
                      <div className="rounded-md border border-success/20 bg-success/10 px-1.5 py-1 text-center mb-1">
                        <div className="text-[9px] font-bold text-success">🕌 Jumu&apos;ah 13:00</div>
                      </div>
                    )}

                    {cellSlots.length === 0 && !isJumaat ? (
                      <div className="h-10 flex items-center justify-center">
                        <span className="text-[8px] text-white/10">—</span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {cellSlots.map(slot => (
                          <SlotChip
                            key={slot.id}
                            slot={slot}
                            onClick={onSlotClick}
                            overridden={!!overrides[slot.id]}
                          />
                        ))}
                      </div>
                    )}

                    {/* Conflict count badge */}
                    {hasConflict && (
                      <div className="text-[8px] font-bold text-clash text-center mt-1 flex items-center justify-center gap-0.5">
                        <AlertTriangle className="w-2 h-2" />
                        {cellSlots.filter(s => s.conflictFlag && !overrides[s.id]).length} clash
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────
export default function TimetableOfficerPage() {
  const [deptFilter,   setDeptFilter]   = useState<string>("ALL");
  const [levelFilter,  setLevelFilter]  = useState<"ALL" | Level>("ALL");
  const [conflictsOnly, setConflictsOnly] = useState(false);
  const [showWizard,   setShowWizard]   = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimetableSlot | null>(null);
  const [overrides,    setOverrides]    = useState<Record<string, AdminAction>>({});
  const [toast,        setToast]        = useState<ToastMsg | null>(null);
  const [search,       setSearch]       = useState("");

  const showToast = (text: string, color: string) => {
    setToast({ text, color });
    setTimeout(() => setToast(null), 3200);
  };

  const handleAction = (id: string, action: AdminAction) => {
    setOverrides(prev => ({ ...prev, [id]: action }));
    const labels: Record<AdminAction, string> = {
      override:   "Conflict overridden — slot locked in",
      enforce:    "Slot enforced — locked against changes",
      waive:      "Conflict waived — both slots coexist",
      reschedule: "Slot marked for rescheduling",
      cancel:     "Slot cancelled — students notified via WhatsApp",
    };
    const colors: Record<AdminAction, string> = {
      override:   "bg-accent-gold", enforce: "bg-success",
      waive:      "bg-secondary",   reschedule: "bg-primary", cancel: "bg-clash",
    };
    showToast(labels[action], colors[action]);
  };

  // Filter logic
  const filteredSlots = useMemo(() => {
    let slots = [...TIMETABLE].filter(s => s.slotType !== "break");

    if (deptFilter  !== "ALL") slots = slots.filter(s => s.dept === deptFilter);
    if (levelFilter !== "ALL") slots = slots.filter(s => s.level === levelFilter);
    if (conflictsOnly)         slots = slots.filter(s => s.conflictFlag);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      slots = slots.filter(s =>
        s.courseCode.toLowerCase().includes(q) ||
        s.courseTitle.toLowerCase().includes(q) ||
        s.lecturerName.toLowerCase().includes(q) ||
        s.venue.toLowerCase().includes(q)
      );
    }
    return slots;
  }, [deptFilter, levelFilter, conflictsOnly, search]);

  const conflictSlots = useMemo(() => getConflictSlots(), []);
  const activeConflicts = conflictSlots.filter(s => !overrides[s.id]);
  const resolvedCount   = Object.keys(overrides).length;

  // Stat counts
  const totalSlots      = filteredSlots.filter(s => s.slotType !== "jumuah").length;
  const practicalCount  = filteredSlots.filter(s => s.slotType === "practical").length;
  const conflictCount   = filteredSlots.filter(s => s.conflictFlag && !overrides[s.id]).length;

  return (
    <DemoLayout
      activeRole="to"
      roleName="Mr. Konohamaru Sarutobi"
      roleSubtitle="Timetable Officer · Faculty of Physical & Applied Sciences"
      conflictCount={activeConflicts.length}
    >
      {selectedSlot && (
        <SlotModal
          slot={selectedSlot}
          onClose={() => setSelectedSlot(null)}
          onAction={handleAction}
          overridden={!!overrides[selectedSlot.id]}
        />
      )}
      {showWizard && <GenerateWizard onClose={() => setShowWizard(false)} />}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl ${toast.color} text-white shadow-2xl`}>
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm font-semibold">{toast.text}</span>
        </div>
      )}

      <div className="px-4 sm:px-6 py-8 space-y-6 max-w-full">

        {/* ── Header ──────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CalendarClock className="w-4 h-4 text-accent-gold" />
              <span className="text-[10px] font-semibold text-accent-gold uppercase tracking-widest">Timetable Officer</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Faculty Master Timetable</h1>
            <p className="text-white/40 text-sm mt-1">
              Faculty of Physical &amp; Applied Sciences · Semester 1, 2024/2025 · Mon–Fri 08:00–18:00
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => showToast("Timetable exported as PDF", "bg-secondary")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm hover:bg-white/10 transition-colors">
              <Download className="w-3.5 h-3.5" /> Export PDF
            </button>
            <button onClick={() => setShowWizard(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg">
              <Wand2 className="w-4 h-4" /> Generate Timetable
            </button>
          </div>
        </div>

        {/* ── Stats row ────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Slots Showing",   value: totalSlots,     color: "text-white" },
            { label: "Active Conflicts", value: conflictCount,  color: conflictCount > 0 ? "text-clash" : "text-success" },
            { label: "Resolved",        value: resolvedCount,  color: "text-success" },
            { label: "Practical Slots", value: practicalCount, color: "text-primary" },
          ].map(s => (
            <div key={s.label} className="rounded-xl bg-white/[0.03] border border-white/10 px-4 py-3 flex items-center justify-between">
              <span className="text-xs text-white/35">{s.label}</span>
              <span className={`text-xl font-bold ${s.color}`}>{s.value}</span>
            </div>
          ))}
        </div>

        {/* ── Active conflicts banner ───────────── */}
        {activeConflicts.length > 0 && (
          <div className="rounded-2xl border border-clash/20 bg-clash/5 p-4 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-clash" />
                <span className="text-sm font-semibold text-clash">
                  {activeConflicts.length} Unresolved Conflict{activeConflicts.length > 1 ? "s" : ""} — Action Required
                </span>
              </div>
              <button onClick={() => setConflictsOnly(true)}
                className="text-xs text-clash hover:text-clash underline transition-colors">
                Show conflicts only
              </button>
            </div>
            <div className="space-y-1">
              {activeConflicts.slice(0, 4).map(s => (
                <button key={s.id} onClick={() => setSelectedSlot(s)}
                  className="w-full flex items-center justify-between text-left px-3 py-2 rounded-lg hover:bg-clash/10 transition-colors group">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-bold text-clash flex-shrink-0">{s.courseCode}</span>
                    <span className="text-xs text-white/40 truncate">{s.day} {s.startTime} · {s.conflictReason?.slice(0, 55)}…</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <span className="text-[10px] text-accent-gold hidden sm:block">Click to resolve</span>
                    <ChevronRight className="w-3.5 h-3.5 text-clash/60" />
                  </div>
                </button>
              ))}
              {activeConflicts.length > 4 && (
                <div className="text-xs text-white/30 text-center pt-1">
                  +{activeConflicts.length - 4} more — use filter to view all
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Filters + search ─────────────────── */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
            <input
              type="text"
              placeholder="Search course, lecturer, venue…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white/70 placeholder:text-white/25 focus:outline-none focus:border-white/30 w-56"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Dept filter */}
          <div className="relative">
            <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
              className="appearance-none bg-white/5 border border-white/10 rounded-xl pl-3 pr-8 py-2 text-sm text-white/70 focus:outline-none focus:border-white/30 cursor-pointer">
              {DEPT_OPTIONS.map(o => (
                <option key={o.value} value={o.value} className="bg-muted">{o.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
          </div>

          {/* Level pills */}
          <div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
            {LEVEL_OPTIONS.map(opt => {
              const isActive = levelFilter === opt.value;
              const lc = opt.value !== "ALL" ? LEVEL_COLORS[opt.value as Level] : null;
              return (
                <button key={String(opt.value)}
                  onClick={() => setLevelFilter(opt.value as typeof levelFilter)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive ? lc ? `${lc.badge} text-white` : "bg-white/15 text-white" : "text-white/35 hover:text-white/60"
                  }`}>
                  {opt.value === "ALL" ? "All" : `${opt.value}L`}
                </button>
              );
            })}
          </div>

          {/* Conflicts toggle */}
          <button onClick={() => setConflictsOnly(!conflictsOnly)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-colors ${
              conflictsOnly ? "bg-clash/15 border-clash/30 text-clash" : "bg-white/5 border-white/10 text-white/40 hover:text-white/70"
            }`}>
            <AlertTriangle className="w-3.5 h-3.5" />
            Conflicts Only
          </button>

          {/* Reset filters */}
          {(deptFilter !== "ALL" || levelFilter !== "ALL" || conflictsOnly || search) && (
            <button onClick={() => { setDeptFilter("ALL"); setLevelFilter("ALL"); setConflictsOnly(false); setSearch(""); }}
              className="flex items-center gap-1.5 text-xs text-white/35 hover:text-white/60 transition-colors">
              <X className="w-3 h-3" /> Reset
            </button>
          )}

          <div className="ml-auto text-xs text-white/25">{totalSlots} slots shown</div>
        </div>

        {/* ── Level legend ─────────────────────── */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(LEVEL_COLORS).map(([level, colors]) => (
            <button key={level} onClick={() => setLevelFilter(parseInt(level) as Level)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all hover:brightness-110 ${colors.bg} ${colors.border} ${levelFilter === parseInt(level) ? "ring-1 ring-white/30" : ""}`}>
              <div className={`w-2 h-2 rounded-full ${colors.badge}`} />
              <span className={`text-xs font-semibold ${colors.text}`}>{level}L</span>
            </button>
          ))}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border bg-clash/10 border-clash/20">
            <AlertTriangle className="w-3 h-3 text-clash" />
            <span className="text-xs font-semibold text-clash">Conflict</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border bg-success/10 border-success/20">
            <CheckCircle2 className="w-3 h-3 text-success" />
            <span className="text-xs font-semibold text-success">Overridden</span>
          </div>
        </div>

        {/* ── Empty state when filter returns nothing ── */}
        {totalSlots === 0 ? (
          <div className="rounded-2xl border border-white/10 p-12 text-center space-y-3">
            <Filter className="w-8 h-8 text-white/15 mx-auto" />
            <div className="text-white/30 text-sm">No slots match the current filter.</div>
            <button onClick={() => { setDeptFilter("ALL"); setLevelFilter("ALL"); setConflictsOnly(false); setSearch(""); }}
              className="text-xs text-primary hover:text-primary underline">
              Reset all filters
            </button>
          </div>
        ) : (
          <MasterGrid slots={filteredSlots} onSlotClick={setSelectedSlot} overrides={overrides} />
        )}

        {/* ── Admin powers summary ─────────────── */}
        {resolvedCount > 0 && (
          <div className="rounded-2xl border border-success/20 bg-success/5 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Gavel className="w-4 h-4 text-success" />
              <span className="text-sm font-semibold text-success">Admin Actions Applied — {resolvedCount} slot{resolvedCount > 1 ? "s" : ""}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(["override", "enforce", "waive", "reschedule", "cancel"] as AdminAction[]).map(action => {
                const count = Object.values(overrides).filter(a => a === action).length;
                if (count === 0) return null;
                const config = {
                  override:   { label: "Overridden",   color: "text-accent-gold",   bg: "bg-accent-gold/10 border-accent-gold/20" },
                  enforce:    { label: "Enforced",      color: "text-success", bg: "bg-success/10 border-success/20" },
                  waive:      { label: "Waived",        color: "text-secondary",     bg: "bg-secondary/10 border-secondary/20" },
                  reschedule: { label: "Rescheduled",   color: "text-primary",  bg: "bg-primary/10 border-primary/20" },
                  cancel:     { label: "Cancelled",     color: "text-clash",     bg: "bg-clash/10 border-clash/20" },
                };
                const c = config[action];
                return (
                  <div key={action} className={`rounded-xl border ${c.bg} px-3 py-2 flex items-center justify-between`}>
                    <span className={`text-xs font-semibold ${c.color}`}>{c.label}</span>
                    <span className={`text-sm font-bold ${c.color}`}>{count}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-2">
              <Bell className="w-3.5 h-3.5 text-white/30" />
              <span className="text-xs text-white/30">Affected students and lecturers have been notified via WhatsApp.</span>
            </div>
          </div>
        )}

      </div>
    </DemoLayout>
  );
}
