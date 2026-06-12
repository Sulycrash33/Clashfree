"use client";

import { useState, useMemo } from "react";
import {
  GraduationCap, CalendarClock, ChevronRight, Clock, MapPin, BookOpen,
  AlertTriangle, CheckCircle2, X, XCircle, FlaskConical,
  Presentation, Calendar, Award, FileText, Users,
  BarChart3, Bell, ChevronDown, Layers, Star,
} from "lucide-react";
import { DemoLayout } from "../_components/DemoLayout";
import {
  FEATURED_LECTURERS, SAMPLE_INVIGILATION,
  type Lecturer, type InvigilationDuty,
} from "../_data/fedko-lecturers";
import {
  TIMETABLE, DAYS, LEVEL_COLORS,
  type TimetableSlot, type Day, type Level,
} from "../_data/fedko-timetable";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
type SlotAction = "none" | "cancel" | "test" | "presentation";

const ACTION_CONFIG: Record<SlotAction, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
  none: { label: "Lecture", color: "text-white/60", bg: "bg-white/5", border: "border-white/10", icon: BookOpen },
  cancel: { label: "Cancelled", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-400/30", icon: XCircle },
  test: { label: "CA Test", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-400/30", icon: FlaskConical },
  presentation: { label: "Presentation", color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-400/30", icon: Presentation },
};

function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

// Get lecturer's timetable slots by matching coursesCurrent to TIMETABLE
function getLecturerSlots(lecturer: Lecturer): TimetableSlot[] {
  return TIMETABLE.filter(s =>
    s.lecturerId === lecturer.id ||
    lecturer.coursesCurrent.some(code => s.courseCode === code && s.dept === lecturer.dept)
  );
}

// Rank badge
function RankBadge({ rank }: { rank: Lecturer["rank"] }) {
  const config: Record<Lecturer["rank"], { color: string; bg: string }> = {
    "Professor":          { color: "text-amber-300", bg: "bg-amber-500/15 border-amber-400/30" },
    "Associate Professor":{ color: "text-violet-300", bg: "bg-violet-500/15 border-violet-400/30" },
    "Senior Lecturer":    { color: "text-sky-300",  bg: "bg-sky-500/15 border-sky-400/30" },
    "Lecturer I":         { color: "text-emerald-300", bg: "bg-emerald-500/15 border-emerald-400/30" },
    "Lecturer II":        { color: "text-teal-300", bg: "bg-teal-500/15 border-teal-400/30" },
    "Assistant Lecturer": { color: "text-white/50", bg: "bg-white/5 border-white/10" },
    "Graduate Assistant": { color: "text-white/40", bg: "bg-white/5 border-white/10" },
  };
  const c = config[rank];
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${c.bg} ${c.color}`}>
      {rank}
    </span>
  );
}

// ─────────────────────────────────────────────
// Slot action modal
// ─────────────────────────────────────────────
function SlotActionModal({
  slot,
  currentAction,
  onApply,
  onClose,
}: {
  slot: TimetableSlot;
  currentAction: SlotAction;
  onApply: (a: SlotAction) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<SlotAction>(currentAction);
  const [done, setDone] = useState(false);

  const handleApply = () => {
    setDone(true);
    setTimeout(() => { onApply(selected); onClose(); }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-white/15 bg-[#13131f] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div>
            <div className="font-semibold text-white text-sm">{slot.courseCode}</div>
            <div className="text-xs text-white/40">{slot.day} · {slot.startTime}–{slot.endTime}</div>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white p-1"><X className="w-4 h-4" /></button>
        </div>

        <div className="px-5 py-4 space-y-2">
          <p className="text-xs text-white/40 mb-3">Select action for this lecture slot:</p>
          {(["none", "cancel", "test", "presentation"] as SlotAction[]).map(a => {
            const cfg = ACTION_CONFIG[a];
            const Icon = cfg.icon;
            return (
              <button
                key={a}
                onClick={() => setSelected(a)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${
                  selected === a ? `${cfg.bg} ${cfg.border}` : "bg-white/[0.02] border-white/10 hover:bg-white/5"
                }`}
              >
                <Icon className={`w-4 h-4 ${selected === a ? cfg.color : "text-white/30"}`} />
                <div>
                  <div className={`text-sm font-medium ${selected === a ? cfg.color : "text-white/60"}`}>{cfg.label}</div>
                  <div className="text-xs text-white/30 mt-0.5">
                    {a === "none" && "Keep as regular lecture"}
                    {a === "cancel" && "Cancel — students notified via WhatsApp"}
                    {a === "test" && "Convert to Continuous Assessment test"}
                    {a === "presentation" && "Convert to student presentation session"}
                  </div>
                </div>
                {selected === a && <CheckCircle2 className="w-4 h-4 text-emerald-400 ml-auto flex-shrink-0" />}
              </button>
            );
          })}
        </div>

        <div className="flex gap-3 px-5 py-4 border-t border-white/10">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-white/10 text-sm text-white/50 hover:text-white hover:bg-white/5 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleApply}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              done ? "bg-emerald-600 text-white" : "bg-white text-black hover:bg-white/90"
            }`}
          >
            {done ? <><CheckCircle2 className="w-4 h-4" /> Applied</> : "Apply"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Personal timetable — week grid
// ─────────────────────────────────────────────
function PersonalTimetable({
  slots,
  slotActions,
  onSlotClick,
}: {
  slots: TimetableSlot[];
  slotActions: Record<string, SlotAction>;
  onSlotClick: (s: TimetableSlot) => void;
}) {
  const byDay = useMemo(() => {
    const map: Record<Day, TimetableSlot[]> = {
      Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [],
    };
    slots.forEach(s => { if (s.slotType !== "break" && map[s.day]) map[s.day].push(s); });
    return map;
  }, [slots]);

  const ROW_H = 52;
  const HOURS = 10; // 08:00–18:00

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10">
      <div className="min-w-[560px]">
        {/* Day headers */}
        <div className="grid grid-cols-[52px_repeat(5,1fr)] border-b border-white/10">
          <div className="py-2 border-r border-white/10" />
          {DAYS.map(d => (
            <div key={d} className="py-2 px-2 text-center border-r border-white/10 last:border-r-0">
              <span className="text-[11px] font-semibold text-white/50 uppercase">{d.slice(0, 3)}</span>
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="grid grid-cols-[52px_repeat(5,1fr)] relative" style={{ height: `${HOURS * ROW_H}px` }}>
          {/* Time axis */}
          <div className="border-r border-white/10 relative">
            {["08","09","10","11","12","13","14","15","16","17"].map((h, i) => (
              <div
                key={h}
                className="absolute inset-x-0 flex items-center justify-end pr-1.5 border-t border-white/5"
                style={{ top: `${i * ROW_H}px`, height: `${ROW_H}px` }}
              >
                <span className="text-[9px] text-white/20">{h}:00</span>
              </div>
            ))}
          </div>

          {DAYS.map(day => {
            const daySlots = byDay[day];
            return (
              <div key={day} className="relative border-r border-white/10 last:border-r-0" style={{ height: `${HOURS * ROW_H}px` }}>
                {[...Array(HOURS)].map((_, i) => (
                  <div key={i} className="absolute inset-x-0 border-t border-white/5" style={{ top: `${i * ROW_H}px` }} />
                ))}
                {daySlots.map(slot => {
                  const base = 8 * 60;
                  const top = (timeToMinutes(slot.startTime) - base) / 60;
                  const height = (timeToMinutes(slot.endTime) - timeToMinutes(slot.startTime)) / 60;
                  const action = slotActions[slot.id] ?? "none";
                  const cfg = ACTION_CONFIG[action];
                  const lc = LEVEL_COLORS[slot.level as Level] ?? LEVEL_COLORS[100];

                  return (
                    <div
                      key={slot.id}
                      className="absolute inset-x-1 z-10"
                      style={{ top: `${top * ROW_H + 2}px`, height: `${height * ROW_H - 4}px` }}
                    >
                      <button
                        onClick={() => onSlotClick(slot)}
                        className={`w-full h-full text-left rounded-lg border px-2 py-1 text-[10px] transition-all hover:brightness-110 ${
                          action !== "none" ? `${cfg.bg} ${cfg.border}` : `${lc.bg} ${lc.border}`
                        }`}
                      >
                        <div className="font-bold truncate">{slot.courseCode}</div>
                        {height >= 1.5 && (
                          <div className={`text-[9px] mt-0.5 truncate ${action !== "none" ? cfg.color : lc.text}`}>
                            {action !== "none" ? cfg.label : slot.courseTitle.split(" ").slice(0, 3).join(" ")}
                          </div>
                        )}
                        {action !== "none" && (
                          <div className={`text-[8px] font-bold mt-0.5 ${cfg.color}`}>{cfg.label.toUpperCase()}</div>
                        )}
                      </button>
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
// Invigilation table
// ─────────────────────────────────────────────
function InvigilationTable({ lecturerId }: { lecturerId: string }) {
  const duties = SAMPLE_INVIGILATION.filter(d => d.lecturerId === lecturerId);

  if (duties.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 p-6 text-center text-white/30 text-sm">
        No invigilation duties assigned for this semester.
      </div>
    );
  }

  const roleColor: Record<InvigilationDuty["role"], string> = {
    "Chief Invigilator": "bg-amber-500/15 border-amber-400/30 text-amber-300",
    "Invigilator": "bg-sky-500/15 border-sky-400/30 text-sky-300",
    "Relief Invigilator": "bg-white/10 border-white/10 text-white/40",
  };

  return (
    <div className="rounded-2xl border border-white/10 overflow-hidden">
      <div className="px-5 py-3 border-b border-white/10 bg-white/[0.02] flex items-center gap-2">
        <Award className="w-4 h-4 text-amber-400" />
        <span className="text-sm font-semibold text-white/60">Invigilation Duties — Semester 1 Examinations</span>
      </div>
      <div className="divide-y divide-white/5">
        {duties.map(d => (
          <div key={d.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 hover:bg-white/[0.02] transition-colors">
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white text-sm">{d.courseCode}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleColor[d.role]}`}>
                  {d.role}
                </span>
              </div>
              <div className="text-xs text-white/45">{d.courseTitle}</div>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-white/40 flex-shrink-0">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(d.date).toDateString().slice(4)}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {d.startTime}–{d.endTime}
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {d.venue}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Profile selector
// ─────────────────────────────────────────────
function ProfileSelector({
  selected,
  onSelect,
}: {
  selected: Lecturer;
  onSelect: (l: Lecturer) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 transition-colors w-full sm:w-auto text-left"
      >
        <div className={`w-8 h-8 rounded-full ${selected.colorClass} flex items-center justify-center text-xs font-bold text-white flex-shrink-0`}>
          {selected.imageInitials}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-white truncate">{selected.name}</div>
          <div className="text-xs text-white/40 truncate">{selected.dept} · {selected.rank}</div>
        </div>
        <ChevronDown className={`w-4 h-4 text-white/30 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 w-72 rounded-2xl border border-white/15 bg-[#13131f] shadow-2xl z-40 overflow-hidden">
          <div className="px-4 py-2 border-b border-white/10">
            <p className="text-xs text-white/30 font-medium">Select Lecturer Profile</p>
          </div>
          <div className="py-1">
            {FEATURED_LECTURERS.map(l => (
              <button
                key={l.id}
                onClick={() => { onSelect(l); setOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left ${
                  l.id === selected.id ? "bg-white/[0.04]" : ""
                }`}
              >
                <div className={`w-9 h-9 rounded-full ${l.colorClass} flex items-center justify-center text-xs font-bold text-white flex-shrink-0`}>
                  {l.imageInitials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-white truncate">{l.name}</div>
                  <div className="text-xs text-white/40 truncate">{l.dept} · {l.rank}</div>
                </div>
                {l.id === selected.id && <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────
export default function LecturerPage() {
  const [lecturer, setLecturer] = useState<Lecturer>(FEATURED_LECTURERS[0]);
  const [activeTab, setActiveTab] = useState<"timetable" | "profile" | "invigilation">("timetable");
  const [slotActions, setSlotActions] = useState<Record<string, SlotAction>>({});
  const [actionModal, setActionModal] = useState<TimetableSlot | null>(null);

  const mySlots = useMemo(() => getLecturerSlots(lecturer), [lecturer]);

  // Reset slot actions when lecturer changes
  const handleSelectLecturer = (l: Lecturer) => {
    setLecturer(l);
    setSlotActions({});
    setActiveTab("timetable");
  };

  const handleApplyAction = (action: SlotAction) => {
    if (!actionModal) return;
    setSlotActions(prev => ({ ...prev, [actionModal.id]: action }));
  };

  const cancelledCount = Object.values(slotActions).filter(a => a === "cancel").length;
  const testCount = Object.values(slotActions).filter(a => a === "test").length;
  const presentationCount = Object.values(slotActions).filter(a => a === "presentation").length;

  const TABS = [
    { id: "timetable", label: "My Timetable", icon: CalendarClock },
    { id: "profile", label: "Profile", icon: GraduationCap },
    { id: "invigilation", label: "Invigilation", icon: Award },
  ] as const;

  // Compute weekly hours per day for distribution check
  const slotsByDay = useMemo(() => {
    const map: Record<Day, number> = { Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0 };
    mySlots.forEach(s => {
      if (s.slotType === "break") return;
      const hrs = (timeToMinutes(s.endTime) - timeToMinutes(s.startTime)) / 60;
      map[s.day] += hrs;
    });
    return map;
  }, [mySlots]);

  return (
    <DemoLayout
      activeRole="lc"
      roleName={lecturer.name}
      roleSubtitle={`${lecturer.rank} · ${lecturer.dept}`}
      conflictCount={cancelledCount}
    >
      {actionModal && (
        <SlotActionModal
          slot={actionModal}
          currentAction={slotActions[actionModal.id] ?? "none"}
          onApply={handleApplyAction}
          onClose={() => setActionModal(null)}
        />
      )}

      <div className="px-4 sm:px-6 py-8 space-y-6 max-w-5xl mx-auto">

        {/* ── Header ──────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <GraduationCap className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">Lecturer Portal</span>
            </div>
            <h1 className="text-2xl font-bold text-white">My Dashboard</h1>
            <p className="text-white/40 text-sm mt-1">Semester 1, 2024/2025 · Click any slot to cancel, set as test or presentation</p>
          </div>
          <ProfileSelector selected={lecturer} onSelect={handleSelectLecturer} />
        </div>

        {/* ── Slot action summary ─────────────── */}
        {(cancelledCount + testCount + presentationCount) > 0 && (
          <div className="flex flex-wrap gap-2">
            {cancelledCount > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/15 border border-red-400/30 text-xs font-semibold text-red-300">
                <XCircle className="w-3.5 h-3.5" />
                {cancelledCount} Cancelled
              </div>
            )}
            {testCount > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-400/30 text-xs font-semibold text-amber-300">
                <FlaskConical className="w-3.5 h-3.5" />
                {testCount} CA Test
              </div>
            )}
            {presentationCount > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-500/15 border border-violet-400/30 text-xs font-semibold text-violet-300">
                <Presentation className="w-3.5 h-3.5" />
                {presentationCount} Presentation
              </div>
            )}
            <div className="text-xs text-white/30 flex items-center">
              Students notified via WhatsApp + Email
            </div>
          </div>
        )}

        {/* ── Tabs ────────────────────────────── */}
        <div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1 w-fit">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === t.id ? "bg-white/10 text-white shadow" : "text-white/40 hover:text-white/70"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* ══ TIMETABLE TAB ═══════════════════════ */}
        {activeTab === "timetable" && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-white/40">
                {mySlots.filter(s => s.slotType !== "break").length} lectures scheduled · Click a slot to manage it
              </p>
              {/* Weekly load bar */}
              <div className="hidden sm:flex items-center gap-3">
                {DAYS.map(d => (
                  <div key={d} className="flex flex-col items-center gap-1">
                    <div className="text-[9px] text-white/20 uppercase">{d.slice(0, 2)}</div>
                    <div className="w-1.5 bg-white/10 rounded-full h-8 overflow-hidden flex flex-col-reverse">
                      <div
                        className="bg-emerald-500 rounded-full transition-all"
                        style={{ height: `${Math.min(100, (slotsByDay[d] / 8) * 100)}%` }}
                      />
                    </div>
                    <div className="text-[9px] text-white/20">{slotsByDay[d]}h</div>
                  </div>
                ))}
              </div>
            </div>

            {mySlots.filter(s => s.slotType !== "break").length === 0 ? (
              <div className="rounded-2xl border border-white/10 p-12 text-center space-y-2">
                <CalendarClock className="w-8 h-8 text-white/20 mx-auto" />
                <p className="text-white/30 text-sm">No lectures scheduled for this lecturer in the demo timetable.</p>
                <p className="text-white/20 text-xs">Courses assigned: {lecturer.coursesCurrent.join(", ")}</p>
              </div>
            ) : (
              <PersonalTimetable
                slots={mySlots}
                slotActions={slotActions}
                onSlotClick={setActionModal}
              />
            )}

            {/* Course list with action buttons */}
            <div className="rounded-2xl border border-white/10 overflow-hidden">
              <div className="px-5 py-3 border-b border-white/10 bg-white/[0.02]">
                <p className="text-sm font-semibold text-white/60">Assigned Courses — Quick Actions</p>
              </div>
              <div className="divide-y divide-white/5">
                {lecturer.coursesCurrent.map(code => {
                  const courseSlots = mySlots.filter(s => s.courseCode === code);
                  return (
                    <div key={code} className="px-5 py-4 flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-white text-sm">{code}</div>
                        <div className="text-xs text-white/35 mt-0.5">
                          {courseSlots.length} slot{courseSlots.length !== 1 ? "s" : ""} this week
                          {courseSlots.length > 0 && ` · ${courseSlots.map(s => s.day.slice(0,3)).join(", ")}`}
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        {courseSlots.slice(0, 2).map(slot => {
                          const action = slotActions[slot.id] ?? "none";
                          const cfg = ACTION_CONFIG[action];
                          const Icon = cfg.icon;
                          return (
                            <button
                              key={slot.id}
                              onClick={() => setActionModal(slot)}
                              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition-colors ${cfg.bg} ${cfg.border} ${cfg.color} hover:brightness-110`}
                              title={`${slot.day} ${slot.startTime}`}
                            >
                              <Icon className="w-3 h-3" />
                              {slot.day.slice(0, 3)} {slot.startTime}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ══ PROFILE TAB ════════════════════════ */}
        {activeTab === "profile" && (
          <div className="space-y-5">
            {/* Profile card */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-5">
              <div className="flex items-start gap-5">
                <div className={`w-16 h-16 rounded-2xl ${lecturer.colorClass} flex items-center justify-center text-xl font-bold text-white flex-shrink-0`}>
                  {lecturer.imageInitials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 flex-wrap">
                    <h2 className="text-xl font-bold text-white">{lecturer.name}</h2>
                    <RankBadge rank={lecturer.rank} />
                  </div>
                  <p className="text-white/50 text-sm mt-1">{lecturer.title} · {lecturer.deptName}</p>
                  <p className="text-white/35 text-xs mt-1">{lecturer.specialization}</p>
                </div>
              </div>

              {lecturer.bio && (
                <p className="text-sm text-white/55 leading-relaxed border-t border-white/10 pt-4">
                  {lecturer.bio}
                </p>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Publications", value: lecturer.publications ?? "—", icon: FileText, color: "text-sky-400" },
                { label: "Years of Service", value: lecturer.yearsService ? `${lecturer.yearsService} yrs` : "—", icon: Award, color: "text-amber-400" },
                { label: "Courses (Current)", value: lecturer.coursesCurrent.length, icon: BookOpen, color: "text-emerald-400" },
                { label: "Weekly Hours", value: `${lecturer.weeklyHours}h`, icon: Clock, color: "text-violet-400" },
              ].map(s => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-2">
                    <Icon className={`w-4 h-4 ${s.color}`} />
                    <div className="text-xl font-bold text-white">{s.value}</div>
                    <div className="text-xs text-white/35">{s.label}</div>
                  </div>
                );
              })}
            </div>

            {/* Qualifications */}
            {lecturer.qualifications && (
              <div className="rounded-2xl border border-white/10 p-5 space-y-3">
                <h3 className="text-sm font-semibold text-white/50 flex items-center gap-2">
                  <Layers className="w-4 h-4" /> Qualifications
                </h3>
                <ul className="space-y-2">
                  {lecturer.qualifications.map(q => (
                    <li key={q} className="flex items-start gap-2 text-sm text-white/60">
                      <Star className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                      {q}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Contact */}
            <div className="rounded-2xl border border-white/10 p-5 space-y-3">
              <h3 className="text-sm font-semibold text-white/50">Contact & Office</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: "Staff ID", value: lecturer.staffId },
                  { label: "Email", value: lecturer.email },
                  { label: "Phone", value: lecturer.phone },
                  { label: "Office", value: lecturer.office },
                ].map(c => (
                  <div key={c.label} className="rounded-xl bg-white/5 border border-white/10 p-3">
                    <div className="text-xs text-white/35">{c.label}</div>
                    <div className="text-sm text-white/70 mt-0.5 truncate">{c.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══ INVIGILATION TAB ═══════════════════ */}
        {activeTab === "invigilation" && (
          <div className="space-y-5">
            <p className="text-sm text-white/40">
              Invigilation duties are assigned by the Examinations Officer and approved by the Institution Admin.
              Duties below are for the Semester 1, 2024/2025 examination period.
            </p>
            <InvigilationTable lecturerId={lecturer.id} />

            {/* Invigilation summary */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Total Duties", value: SAMPLE_INVIGILATION.filter(d => d.lecturerId === lecturer.id).length },
                { label: "Chief Invigilator", value: SAMPLE_INVIGILATION.filter(d => d.lecturerId === lecturer.id && d.role === "Chief Invigilator").length },
                { label: "Invigilator", value: SAMPLE_INVIGILATION.filter(d => d.lecturerId === lecturer.id && d.role === "Invigilator").length },
              ].map(s => (
                <div key={s.label} className="rounded-xl bg-white/5 border border-white/10 p-4 text-center">
                  <div className="text-2xl font-bold text-white">{s.value}</div>
                  <div className="text-xs text-white/35 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </DemoLayout>
  );
}

