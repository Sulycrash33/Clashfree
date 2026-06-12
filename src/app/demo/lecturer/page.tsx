"use client";

import { useState, useMemo } from "react";
import {
  GraduationCap, CalendarClock, ChevronRight, Clock, MapPin, BookOpen,
  AlertTriangle, CheckCircle2, X, XCircle, FlaskConical,
  Presentation, Calendar, Award, FileText, Users,
  BarChart3, Bell, ChevronDown, Layers, Star,
  Download, Camera, Settings, Moon, Sun, Printer,
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
// Types
// ─────────────────────────────────────────────
type SlotAction = "none" | "cancel" | "test" | "presentation";
type TabId = "timetable" | "profile" | "exam";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ACTION_CONFIG: Record<SlotAction, { label: string; color: string; bg: string; border: string; icon: any }> = {
  none:         { label: "Lecture",       color: "text-white/60",    bg: "bg-white/5",          border: "border-white/10",     icon: BookOpen },
  cancel:       { label: "Cancelled",     color: "text-red-400",     bg: "bg-red-500/10",       border: "border-red-400/30",   icon: XCircle },
  test:         { label: "CA Test",       color: "text-amber-400",   bg: "bg-amber-500/10",     border: "border-amber-400/30", icon: FlaskConical },
  presentation: { label: "Presentation",  color: "text-violet-400",  bg: "bg-violet-500/10",    border: "border-violet-400/30",icon: Presentation },
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

// Get all slots for a lecturer — matched by lecturerId
function getLecturerSlots(lecturer: Lecturer): TimetableSlot[] {
  return TIMETABLE.filter(s =>
    s.lecturerId === lecturer.id &&
    s.slotType !== "break" &&
    s.slotType !== "jumuah" &&
    s.courseCode !== "BREAK" &&
    s.courseCode !== "JUMUAH"
  );
}

// ─────────────────────────────────────────────
// Rank badge
// ─────────────────────────────────────────────
function RankBadge({ rank }: { rank: Lecturer["rank"] }) {
  const config: Record<Lecturer["rank"], { color: string; bg: string }> = {
    "Professor":           { color: "text-amber-300",   bg: "bg-amber-500/15 border-amber-400/30" },
    "Associate Professor": { color: "text-violet-300",  bg: "bg-violet-500/15 border-violet-400/30" },
    "Senior Lecturer":     { color: "text-sky-300",     bg: "bg-sky-500/15 border-sky-400/30" },
    "Lecturer I":          { color: "text-emerald-300", bg: "bg-emerald-500/15 border-emerald-400/30" },
    "Lecturer II":         { color: "text-teal-300",    bg: "bg-teal-500/15 border-teal-400/30" },
    "Assistant Lecturer":  { color: "text-white/50",    bg: "bg-white/5 border-white/10" },
    "Graduate Assistant":  { color: "text-white/40",    bg: "bg-white/5 border-white/10" },
  };
  const c = config[rank];
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${c.bg} ${c.color}`}>{rank}</span>
  );
}

// ─────────────────────────────────────────────
// Lecturer passport photo placeholder
// ─────────────────────────────────────────────
function LecturerPassport({ lecturer, size = "lg" }: { lecturer: Lecturer; size?: "sm" | "lg" }) {
  const dim  = size === "lg" ? "w-24 h-24" : "w-10 h-10";
  const text = size === "lg" ? "text-2xl" : "text-sm";
  const icon = size === "lg" ? "w-5 h-5" : "w-3 h-3";

  return (
    <div className={`${dim} rounded-2xl ${lecturer.colorClass} relative flex items-center justify-center overflow-hidden border-2 border-white/20 flex-shrink-0 group`}>
      <span className={`font-bold text-white ${text}`}>{lecturer.imageInitials}</span>
      <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
        <Camera className={`${icon} text-white`} />
        {size === "lg" && <span className="text-[9px] text-white/80 mt-1 font-medium">Photo</span>}
      </div>
      <div className="absolute top-1 right-1 w-2 h-2 border-t-2 border-r-2 border-white/40" />
      <div className="absolute bottom-1 left-1 w-2 h-2 border-b-2 border-l-2 border-white/40" />
    </div>
  );
}

// ─────────────────────────────────────────────
// Slot action modal
// ─────────────────────────────────────────────
function SlotActionModal({ slot, currentAction, onApply, onClose }: {
  slot: TimetableSlot; currentAction: SlotAction;
  onApply: (a: SlotAction) => void; onClose: () => void;
}) {
  const [selected, setSelected] = useState<SlotAction>(currentAction);
  const [done, setDone] = useState(false);
  const lc = LEVEL_COLORS[slot.level as Level] ?? LEVEL_COLORS[100];

  const handleApply = () => {
    setDone(true);
    setTimeout(() => { onApply(selected); onClose(); }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-white/15 bg-[#13131f] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div>
            <div className={`font-bold text-sm ${lc.badge.replace("bg-", "text-").replace("-600", "-300")}`}>{slot.courseCode}</div>
            <div className="text-xs text-white/40">{slot.day} · {slot.startTime}–{slot.endTime} · {slot.venue}</div>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white p-1"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-5 py-4 space-y-2">
          <p className="text-xs text-white/40 mb-3">Select action for this lecture slot:</p>
          {(["none","cancel","test","presentation"] as SlotAction[]).map(a => {
            const cfg = ACTION_CONFIG[a];
            const Icon = cfg.icon;
            return (
              <button key={a} onClick={() => setSelected(a)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${
                  selected === a ? `${cfg.bg} ${cfg.border}` : "bg-white/[0.02] border-white/10 hover:bg-white/5"
                }`}>
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
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-white/10 text-sm text-white/50 hover:text-white hover:bg-white/5 transition-colors">Cancel</button>
          <button onClick={handleApply}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              done ? "bg-emerald-600 text-white" : "bg-white text-black hover:bg-white/90"
            }`}>
            {done ? <><CheckCircle2 className="w-4 h-4" /> Applied</> : "Apply"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// PERSONAL TIMETABLE — table-style, bolder fonts, level colours
// Each course slot appears twice per week; all slots filled
// ─────────────────────────────────────────────
const TIME_BANDS = [
  { label: "08:00 – 10:00", start: "08:00", end: "10:00" },
  { label: "10:00 – 12:00", start: "10:00", end: "12:00" },
  { label: "12:00 – 14:00", start: "12:00", end: "14:00" },
  { label: "14:00 – 16:00", start: "14:00", end: "16:00" },
  { label: "16:00 – 18:00", start: "16:00", end: "18:00" },
];

function PersonalTimetable({ slots, slotActions, onSlotClick }: {
  slots: TimetableSlot[];
  slotActions: Record<string, SlotAction>;
  onSlotClick: (s: TimetableSlot) => void;
}) {
  // Build grid: [timeBand][day] → slot[]
  const grid = useMemo(() => {
    const map: Record<string, Record<string, TimetableSlot[]>> = {};
    TIME_BANDS.forEach(tb => {
      map[tb.start] = {};
      DAYS.forEach(d => { map[tb.start][d] = []; });
    });
    slots.forEach(s => {
      const band = TIME_BANDS.find(tb => tb.start === s.startTime);
      if (band) map[band.start][s.day].push(s);
    });
    return map;
  }, [slots]);

  const totalSlots = slots.length;
  const totalHours = slots.reduce((acc, s) => {
    return acc + (timeToMinutes(s.endTime) - timeToMinutes(s.startTime)) / 60;
  }, 0);

  return (
    <div className="space-y-3">
      {/* Stats row */}
      <div className="flex items-center gap-4 flex-wrap text-xs text-white/40">
        <span className="flex items-center gap-1"><CalendarClock className="w-3.5 h-3.5" /> {totalSlots} slots</span>
        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {totalHours}hrs/week</span>
        <span className="text-white/20">Click any slot to manage it</span>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[540px] border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.02]">
              <th className="px-3 py-3 text-left text-[10px] font-bold text-white/35 uppercase tracking-wider w-28 border-r border-white/10">
                Time
              </th>
              {DAYS.map(d => (
                <th key={d} className="px-2 py-3 text-center text-[11px] font-bold text-white/55 uppercase border-r border-white/10 last:border-r-0">
                  {d.slice(0, 3)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TIME_BANDS.map((band, bi) => (
              <tr key={band.start} className={`border-b border-white/5 last:border-b-0 ${bi % 2 === 0 ? "" : "bg-white/[0.01]"}`}>
                {/* Time label */}
                <td className="px-3 py-2.5 border-r border-white/10 align-middle">
                  <div className="font-bold text-white/50 text-[10px] leading-tight whitespace-nowrap">{band.label}</div>
                </td>

                {/* Day cells */}
                {DAYS.map(day => {
                  const cellSlots = grid[band.start]?.[day] ?? [];
                  const isJumaat = day === "Friday" && band.start === "12:00";

                  if (isJumaat) {
                    return (
                      <td key={day} className="px-1.5 py-1.5 border-r border-white/10 last:border-r-0 align-top min-w-[90px] bg-green-500/5">
                        <div className="rounded-lg border border-green-400/20 bg-green-500/10 px-2 py-2 text-center">
                          <div className="text-[9px] font-bold text-green-400">🕌 Jumu'ah</div>
                          <div className="text-[8px] text-green-300/50 mt-0.5">13:00–14:00</div>
                        </div>
                      </td>
                    );
                  }

                  if (cellSlots.length === 0) {
                    return (
                      <td key={day} className="px-1.5 py-1.5 border-r border-white/10 last:border-r-0 align-top min-w-[90px]">
                        <div className="h-12 flex items-center justify-center">
                          <span className="text-[9px] text-white/10">—</span>
                        </div>
                      </td>
                    );
                  }

                  return (
                    <td key={day} className="px-1.5 py-1.5 border-r border-white/10 last:border-r-0 align-top min-w-[90px]">
                      <div className="space-y-1">
                        {cellSlots.map(slot => {
                          const action = slotActions[slot.id] ?? "none";
                          const cfg = ACTION_CONFIG[action];
                          const lc = LEVEL_COLORS[slot.level as Level] ?? LEVEL_COLORS[100];
                          const isModified = action !== "none";

                          return (
                            <button key={slot.id} onClick={() => onSlotClick(slot)}
                              className={`w-full text-left rounded-lg border px-2 py-2 transition-all hover:brightness-110 active:scale-95 ${
                                isModified ? `${cfg.bg} ${cfg.border}` : `${lc.bg} ${lc.border}`
                              }`}>
                              {/* Course code — BOLD */}
                              <div className={`text-[11px] font-black truncate leading-tight ${
                                isModified ? cfg.color : lc.text
                              }`}>
                                {slot.courseCode}
                              </div>
                              {/* Action label or slot type */}
                              <div className={`text-[8px] font-bold mt-0.5 truncate ${
                                isModified ? cfg.color : lc.text + " opacity-70"
                              }`}>
                                {isModified ? cfg.label.toUpperCase() : slot.slotType === "project" ? "PROJECT" : slot.slotType === "practical" ? "PRACTICAL" : "LECTURE"}
                              </div>
                              {/* Venue */}
                              <div className={`text-[8px] mt-0.5 truncate flex items-center gap-0.5 ${
                                isModified ? "text-white/40" : lc.text + " opacity-50"
                              }`}>
                                <MapPin className="w-1.5 h-1.5 inline flex-shrink-0" />
                                {slot.venue.replace("SCI ", "").replace("LAB-", "")}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Level colour legend */}
      <div className="flex flex-wrap gap-3 text-[10px] text-white/35">
        {[
          { bg: "bg-blue-100 border-blue-300",   label: "100L" },
          { bg: "bg-green-100 border-green-300",  label: "200L" },
          { bg: "bg-amber-100 border-amber-300",  label: "300L" },
          { bg: "bg-red-100 border-red-300",      label: "400L" },
          { bg: "bg-red-500/15 border-red-400/30",label: "Cancelled" },
          { bg: "bg-amber-500/15 border-amber-400/30", label: "CA Test" },
          { bg: "bg-violet-500/15 border-violet-400/30", label: "Presentation" },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded border ${l.bg}`} />
            <span>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// EXAM TIMETABLE — invigilation duties
// ─────────────────────────────────────────────
function ExamInvigilationPanel({ lecturerId }: { lecturerId: string }) {
  const duties = SAMPLE_INVIGILATION.filter(d => d.lecturerId === lecturerId);

  const roleColor: Record<InvigilationDuty["role"], string> = {
    "Chief Invigilator": "bg-amber-500/15 border-amber-400/30 text-amber-300",
    "Invigilator":       "bg-sky-500/15 border-sky-400/30 text-sky-300",
    "Relief Invigilator":"bg-white/10 border-white/10 text-white/40",
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-sm font-semibold text-white/60 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" /> Examination Invigilation Duties
          </h3>
          <p className="text-xs text-white/35 mt-0.5">Semester 1, 2024/2025 Examinations — assigned by Examinations Officer</p>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/10 border border-sky-400/20 text-sky-300 text-xs hover:bg-sky-500/20 transition-colors">
          <Download className="w-3 h-3" /> Download Schedule
        </button>
      </div>

      {/* Summary badges */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Duties",       value: duties.length,                                                              color: "text-white" },
          { label: "Chief Invigilator",  value: duties.filter(d => d.role === "Chief Invigilator").length,  color: "text-amber-300" },
          { label: "Invigilator",        value: duties.filter(d => d.role === "Invigilator").length,        color: "text-sky-300" },
        ].map(s => (
          <div key={s.label} className="rounded-xl bg-white/5 border border-white/10 p-4 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-[10px] text-white/35 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Duties table */}
      {duties.length === 0 ? (
        <div className="rounded-2xl border border-white/10 p-10 text-center space-y-3">
          <Calendar className="w-8 h-8 text-white/15 mx-auto" />
          <div className="text-white/25 text-sm">No invigilation duties assigned yet.</div>
          <div className="text-white/15 text-xs">Duties are assigned 4 weeks before examination period.</div>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 overflow-hidden">
          <div className="px-5 py-3 border-b border-white/10 bg-white/[0.02]">
            <div className="grid grid-cols-[1fr_90px_90px_100px_110px] gap-3 text-[10px] font-bold text-white/25 uppercase">
              <span>Course</span><span>Date</span><span>Time</span><span>Venue</span><span>Role</span>
            </div>
          </div>
          <div className="divide-y divide-white/5">
            {duties.map(d => (
              <div key={d.id} className="px-5 py-4 grid grid-cols-[1fr_90px_90px_100px_110px] gap-3 items-center hover:bg-white/[0.02] transition-colors">
                <div>
                  <div className="font-bold text-white text-sm">{d.courseCode}</div>
                  <div className="text-xs text-white/40 mt-0.5 truncate">{d.courseTitle}</div>
                </div>
                <div className="text-xs text-white/50 flex items-center gap-1">
                  <Calendar className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{new Date(d.date).toDateString().slice(4, 10)}</span>
                </div>
                <div className="text-xs text-white/50 flex items-center gap-1">
                  <Clock className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{d.startTime}–{d.endTime}</span>
                </div>
                <div className="text-xs text-white/50 flex items-center gap-1">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{d.venue}</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleColor[d.role]} text-center`}>
                  {d.
