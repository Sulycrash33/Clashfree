"use client";

import { useState, useMemo } from "react";
import {
  GraduationCap, CalendarClock, Clock, MapPin, BookOpen,
  XCircle, FlaskConical, Presentation, Calendar, Award, FileText,
  Layers, Star, Download, Camera, Settings, Moon, Sun,
  CheckCircle2, X, ChevronDown, Bell, BarChart3, Printer,
} from "lucide-react";
import { DemoLayout } from "../_components/DemoLayout";
import {
  FEATURED_LECTURERS, SAMPLE_INVIGILATION,
  type Lecturer, type InvigilationDuty,
} from "../_data/fedko-lecturers";
import {
  TIMETABLE, DAYS, LEVEL_COLORS,
  type TimetableSlot, type Level,
} from "../_data/fedko-timetable";

type SlotAction = "none" | "cancel" | "test" | "presentation";
type TabId = "timetable" | "profile" | "exam";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ACTION_CONFIG: Record<SlotAction, { label: string; color: string; bg: string; border: string; icon: any }> = {
  none:         { label: "Lecture",      color: "text-white/60",   bg: "bg-white/5",          border: "border-white/10",      icon: BookOpen },
  cancel:       { label: "Cancelled",    color: "text-red-400",    bg: "bg-red-500/10",       border: "border-red-400/30",    icon: XCircle },
  test:         { label: "CA Test",      color: "text-amber-400",  bg: "bg-amber-500/10",     border: "border-amber-400/30",  icon: FlaskConical },
  presentation: { label: "Presentation", color: "text-violet-400", bg: "bg-violet-500/10",    border: "border-violet-400/30", icon: Presentation },
};

const TIME_BANDS = [
  { label: "08:00 – 10:00", start: "08:00" },
  { label: "10:00 – 12:00", start: "10:00" },
  { label: "12:00 – 14:00", start: "12:00" },
  { label: "14:00 – 16:00", start: "14:00" },
  { label: "16:00 – 18:00", start: "16:00" },
];

function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function getLecturerSlots(lecturer: Lecturer): TimetableSlot[] {
  return TIMETABLE.filter(s =>
    s.lecturerId === lecturer.id &&
    s.slotType !== "break" &&
    s.slotType !== "jumuah" &&
    s.courseCode !== "BREAK" &&
    s.courseCode !== "JUMUAH"
  );
}

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
  const c = config[rank] ?? config["Lecturer I"];
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${c.bg} ${c.color}`}>{rank}</span>;
}

function LecturerPassport({ lecturer, size = "lg" }: { lecturer: Lecturer; size?: "sm" | "lg" }) {
  const dim  = size === "lg" ? "w-24 h-24" : "w-10 h-10";
  const text = size === "lg" ? "text-2xl"  : "text-sm";
  const iconSz = size === "lg" ? "w-5 h-5" : "w-3 h-3";
  return (
    <div className={`${dim} rounded-2xl ${lecturer.colorClass} relative flex items-center justify-center overflow-hidden border-2 border-white/20 flex-shrink-0 group`}>
      <span className={`font-bold text-white ${text}`}>{lecturer.imageInitials}</span>
      <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
        <Camera className={`${iconSz} text-white`} />
        {size === "lg" && <span className="text-[9px] text-white/80 mt-1 font-medium">Photo</span>}
      </div>
      <div className="absolute top-1 right-1 w-2 h-2 border-t-2 border-r-2 border-white/40" />
      <div className="absolute bottom-1 left-1 w-2 h-2 border-b-2 border-l-2 border-white/40" />
    </div>
  );
}

function SlotActionModal({ slot, currentAction, onApply, onClose }: {
  slot: TimetableSlot; currentAction: SlotAction;
  onApply: (a: SlotAction) => void; onClose: () => void;
}) {
  const [selected, setSelected] = useState<SlotAction>(currentAction);
  const [done, setDone] = useState(false);
  const lc = LEVEL_COLORS[slot.level as Level] ?? LEVEL_COLORS[100];

  const handleApply = () => {
    setDone(true);
    setTimeout(() => { onApply(selected); onClose(); }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-white/15 bg-[#13131f] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div>
            <div className={`font-bold text-sm ${lc.text}`}>{slot.courseCode}</div>
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
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${selected === a ? `${cfg.bg} ${cfg.border}` : "bg-white/[0.02] border-white/10 hover:bg-white/5"}`}>
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
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${done ? "bg-emerald-600 text-white" : "bg-white text-black hover:bg-white/90"}`}>
            {done ? <><CheckCircle2 className="w-4 h-4" /> Applied</> : "Apply"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PersonalTimetable({ slots, slotActions, onSlotClick }: {
  slots: TimetableSlot[];
  slotActions: Record<string, SlotAction>;
  onSlotClick: (s: TimetableSlot) => void;
}) {
  const grid = useMemo(() => {
    const map: Record<string, Record<string, TimetableSlot[]>> = {};
    TIME_BANDS.forEach(tb => {
      map[tb.start] = {};
      DAYS.forEach(d => { map[tb.start][d] = []; });
    });
    slots.forEach(s => {
      const band = TIME_BANDS.find(tb => tb.start === s.startTime);
      if (band && map[band.start]?.[s.day] !== undefined) {
        map[band.start][s.day].push(s);
      }
    });
    return map;
  }, [slots]);

  const totalHours = slots.reduce((acc, s) => acc + (timeToMinutes(s.endTime) - timeToMinutes(s.startTime)) / 60, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 flex-wrap text-xs text-white/40">
        <span className="flex items-center gap-1"><CalendarClock className="w-3.5 h-3.5" /> {slots.length} slots</span>
        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {totalHours}hrs/week</span>
        <span className="text-white/20">Click any slot to manage it</span>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[540px] border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.02]">
              <th className="px-3 py-3 text-left text-[10px] font-bold text-white/35 uppercase tracking-wider w-28 border-r border-white/10">Time</th>
              {DAYS.map(d => (
                <th key={d} className="px-2 py-3 text-center text-[11px] font-bold text-white/55 uppercase border-r border-white/10 last:border-r-0">{d.slice(0, 3)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TIME_BANDS.map((band, bi) => (
              <tr key={band.start} className={`border-b border-white/5 last:border-b-0 ${bi % 2 === 0 ? "" : "bg-white/[0.01]"}`}>
                <td className="px-3 py-2.5 border-r border-white/10 align-middle">
                  <div className="font-bold text-white/50 text-[10px] leading-tight whitespace-nowrap">{band.label}</div>
                </td>
                {DAYS.map(day => {
                  const cellSlots = grid[band.start]?.[day] ?? [];
                  const isJumaat = day === "Friday" && band.start === "12:00";

                  if (isJumaat) {
                    return (
                      <td key={day} className="px-1.5 py-1.5 border-r border-white/10 last:border-r-0 align-top min-w-[90px] bg-green-500/5">
                        <div className="rounded-lg border border-green-400/20 bg-green-500/10 px-2 py-2 text-center">
                          <div className="text-[9px] font-bold text-green-400">🕌 Jumu&apos;ah</div>
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
                              className={`w-full text-left rounded-lg border px-2 py-2 transition-all hover:brightness-110 active:scale-95 ${isModified ? `${cfg.bg} ${cfg.border}` : `${lc.bg} ${lc.border}`}`}>
                              <div className={`text-[11px] font-black truncate leading-tight ${isModified ? cfg.color : lc.text}`}>
                                {slot.courseCode}
                              </div>
                              <div className={`text-[8px] font-bold mt-0.5 truncate ${isModified ? cfg.color : lc.text}`}>
                                {isModified ? cfg.label.toUpperCase() : slot.slotType === "project" ? "PROJECT" : slot.slotType === "practical" ? "PRACTICAL" : "LECTURE"}
                              </div>
                              <div className={`text-[8px] mt-0.5 truncate flex items-center gap-0.5 ${isModified ? "text-white/40" : lc.text}`}>
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

      <div className="flex flex-wrap gap-3 text-[10px] text-white/35">
        {[
          { bg: "bg-blue-100 border-blue-300",             label: "100L" },
          { bg: "bg-green-100 border-green-300",           label: "200L" },
          { bg: "bg-amber-100 border-amber-300",           label: "300L" },
          { bg: "bg-red-100 border-red-300",               label: "400L" },
          { bg: "bg-red-500/15 border-red-400/30",         label: "Cancelled" },
          { bg: "bg-amber-500/15 border-amber-400/30",     label: "CA Test" },
          { bg: "bg-violet-500/15 border-violet-400/30",   label: "Presentation" },
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

function ExamInvigilationPanel({ lecturerId }: { lecturerId: string }) {
  const duties = SAMPLE_INVIGILATION.filter((d: InvigilationDuty) => d.lecturerId === lecturerId);
  const roleColor: Record<InvigilationDuty["role"], string> = {
    "Chief Invigilator":  "bg-amber-500/15 border-amber-400/30 text-amber-300",
    "Invigilator":        "bg-sky-500/15 border-sky-400/30 text-sky-300",
    "Relief Invigilator": "bg-white/10 border-white/10 text-white/40",
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-sm font-semibold text-white/60 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" /> Examination Invigilation Duties
          </h3>
          <p className="text-xs text-white/35 mt-0.5">Semester 1, 2024/2025 — assigned by Examinations Officer</p>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/10 border border-sky-400/20 text-sky-300 text-xs hover:bg-sky-500/20 transition-colors">
          <Download className="w-3 h-3" /> Download Schedule
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Duties",      value: duties.length,                                                             color: "text-white" },
          { label: "Chief Invigilator", value: duties.filter((d: InvigilationDuty) => d.role === "Chief Invigilator").length, color: "text-amber-300" },
          { label: "Invigilator",       value: duties.filter((d: InvigilationDuty) => d.role === "Invigilator").length,       color: "text-sky-300" },
        ].map(s => (
          <div key={s.label} className="rounded-xl bg-white/5 border border-white/10 p-4 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-[10px] text-white/35 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {duties.length === 0 ? (
        <div className="rounded-2xl border border-white/10 p-10 text-center space-y-3">
          <Calendar className="w-8 h-8 text-white/15 mx-auto" />
          <div className="text-white/25 text-sm">No invigilation duties assigned yet.</div>
          <div className="text-white/15 text-xs">Duties are assigned 4 weeks before examination period.</div>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 overflow-hidden">
          <div className="px-5 py-3 border-b border-white/10 bg-white/[0.02]">
            <div className="grid grid-cols-[1fr_90px_90px_100px_120px] gap-3 text-[10px] font-bold text-white/25 uppercase">
              <span>Course</span><span>Date</span><span>Time</span><span>Venue</span><span>Role</span>
            </div>
          </div>
          <div className="divide-y divide-white/5">
            {duties.map((d: InvigilationDuty) => (
              <div key={d.id} className="px-5 py-4 grid grid-cols-[1fr_90px_90px_100px_120px] gap-3 items-center hover:bg-white/[0.02] transition-colors">
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
                  {d.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileSelector({ selected, onSelect }: { selected: Lecturer; onSelect: (l: Lecturer) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 transition-colors w-full sm:w-auto text-left">
        <LecturerPassport lecturer={selected} size="sm" />
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
              <button key={l.id} onClick={() => { onSelect(l); setOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left ${l.id === selected.id ? "bg-white/[0.04]" : ""}`}>
                <LecturerPassport lecturer={l} size="sm" />
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

function LecturerSettings({ onClose }: { onClose: () => void }) {
  const [notifs, setNotifs] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-white/15 bg-[#13131f] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-white/40" />
            <span className="font-semibold text-white text-sm">Lecturer Settings</span>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-3">
              {darkMode ? <Moon className="w-4 h-4 text-violet-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
              <div>
                <div className="text-sm font-medium text-white">{darkMode ? "Dark" : "Light"} Mode</div>
                <div className="text-xs text-white/35">Interface appearance</div>
              </div>
            </div>
            <button onClick={() => setDarkMode(!darkMode)}
              className={`w-11 h-6 rounded-full transition-colors relative ${darkMode ? "bg-violet-600" : "bg-white/20"}`}>
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${darkMode ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-3">
              <Bell className="w-4 h-4 text-sky-400" />
              <div>
                <div className="text-sm font-medium text-white">WhatsApp Alerts</div>
                <div className="text-xs text-white/35">Slot changes and exam notices</div>
              </div>
            </div>
            <button onClick={() => setNotifs(!notifs)}
              className={`w-11 h-6 rounded-full transition-colors relative ${notifs ? "bg-sky-600" : "bg-white/20"}`}>
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${notifs ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2">
            <div className="text-sm font-medium text-white">Default Landing Tab</div>
            <div className="grid grid-cols-3 gap-1.5">
              {["Timetable", "Profile", "Exam"].map(tab => (
                <button key={tab}
                  className={`text-xs px-2 py-1.5 rounded-lg border transition-colors ${tab === "Timetable" ? "bg-emerald-500/15 border-emerald-400/30 text-emerald-300" : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10"}`}>
                  {tab}
                </button>
              ))}
            </div>
          </div>
          <p className="text-[10px] text-white/25 text-center">Settings applied to your ClashFree lecturer profile.</p>
        </div>
      </div>
    </div>
  );
}

export default function LecturerPage() {
  const [lecturer, setLecturer] = useState<Lecturer>(FEATURED_LECTURERS[0]);
  const [activeTab, setActiveTab] = useState<TabId>("timetable");
  const [slotActions, setSlotActions] = useState<Record<string, SlotAction>>({});
  const [actionModal, setActionModal] = useState<TimetableSlot | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [downloadToast, setDownloadToast] = useState<string | null>(null);

  const mySlots = useMemo(() => getLecturerSlots(lecturer), [lecturer]);

  const handleSelectLecturer = (l: Lecturer) => {
    setLecturer(l);
    setSlotActions({});
    setActiveTab("timetable");
  };

  const handleApplyAction = (action: SlotAction) => {
    if (!actionModal) return;
    setSlotActions(prev => ({ ...prev, [actionModal.id]: action }));
  };

  const handleDownload = (type: string) => {
    setDownloadToast(type);
    setTimeout(() => setDownloadToast(null), 3200);
  };

  const cancelledCount    = Object.values(slotActions).filter(a => a === "cancel").length;
  const testCount         = Object.values(slotActions).filter(a => a === "test").length;
  const presentationCount = Object.values(slotActions).filter(a => a === "presentation").length;
  const totalHours        = mySlots.reduce((acc, s) => acc + (timeToMinutes(s.endTime) - timeToMinutes(s.startTime)) / 60, 0);

  const TABS = [
    { id: "timetable" as TabId, label: "My Timetable",         icon: CalendarClock },
    { id: "exam"      as TabId, label: "Exam & Invigilation",  icon: Award },
    { id: "profile"   as TabId, label: "Profile",              icon: GraduationCap },
  ];

  return (
    <DemoLayout activeRole="lc" roleName={lecturer.name} roleSubtitle={`${lecturer.rank} · ${lecturer.dept}`} conflictCount={cancelledCount}>
      {actionModal && (
        <SlotActionModal slot={actionModal} currentAction={slotActions[actionModal.id] ?? "none"}
          onApply={handleApplyAction} onClose={() => setActionModal(null)} />
      )}
      {showSettings && <LecturerSettings onClose={() => setShowSettings(false)} />}

      <div className="px-4 sm:px-6 py-8 space-y-6 max-w-5xl mx-auto">
        {/* Hero */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <div className="flex flex-col items-center gap-1.5">
              <LecturerPassport lecturer={lecturer} size="lg" />
              <span className="text-[9px] text-white/25">Tap to upload photo</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-widest">Lecturer Portal</span>
                  </div>
                  <h1 className="text-2xl font-bold text-white">{lecturer.name}</h1>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <RankBadge rank={lecturer.rank} />
                    <span className="text-white/30 text-xs">·</span>
                    <span className="text-white/40 text-xs">{lecturer.deptName}</span>
                  </div>
                  <p className="text-white/25 text-xs mt-0.5">{lecturer.staffId}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleDownload("timetable")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-xs text-white/50">
                    <Download className="w-3 h-3" /> Export
                  </button>
                  <button onClick={() => setShowSettings(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-xs text-white/50">
                    <Settings className="w-3 h-3" /> Settings
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-4">
                {[
                  { label: "Courses",  value: lecturer.coursesCurrent.length },
                  { label: "Hrs/Week", value: `${totalHours}h` },
                  { label: "Slots",    value: mySlots.length },
                  { label: "Pubs",     value: lecturer.publications ?? "—" },
                  { label: "Yrs Svc",  value: lecturer.yearsService ? `${lecturer.yearsService}y` : "—" },
                  { label: "Modified", value: Object.values(slotActions).filter(a => a !== "none").length },
                ].map(s => (
                  <div key={s.label} className="rounded-lg bg-white/5 border border-white/10 p-2 text-center">
                    <div className="text-sm font-bold text-white">{s.value}</div>
                    <div className="text-[9px] text-white/30">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <ProfileSelector selected={lecturer} onSelect={handleSelectLecturer} />
          </div>
        </div>

        {/* Action status */}
        {(cancelledCount + testCount + presentationCount) > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            {cancelledCount > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/15 border border-red-400/30 text-xs font-semibold text-red-300">
                <XCircle className="w-3.5 h-3.5" /> {cancelledCount} Cancelled
              </div>
            )}
            {testCount > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-400/30 text-xs font-semibold text-amber-300">
                <FlaskConical className="w-3.5 h-3.5" /> {testCount} CA Test
              </div>
            )}
            {presentationCount > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-500/15 border border-violet-400/30 text-xs font-semibold text-violet-300">
                <Presentation className="w-3.5 h-3.5" /> {presentationCount} Presentation
              </div>
            )}
            <span className="text-xs text-white/25 ml-1">Students notified via WhatsApp</span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1 flex-wrap">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === t.id ? "bg-white/10 text-white shadow" : "text-white/40 hover:text-white/70"}`}>
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* TIMETABLE TAB */}
        {activeTab === "timetable" && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-white/10 overflow-hidden">
              <div className="px-5 py-3 border-b border-white/10 bg-white/[0.02]">
                <p className="text-sm font-semibold text-white/60">Assigned Courses — Weekly Slot Distribution</p>
              </div>
              <div className="divide-y divide-white/5">
                {lecturer.coursesCurrent.map(code => {
                  const courseSlots = mySlots.filter(s => s.courseCode === code);
                  const hrs = courseSlots.reduce((acc, s) => acc + (timeToMinutes(s.endTime) - timeToMinutes(s.startTime)) / 60, 0);
                  const lc = courseSlots[0] ? LEVEL_COLORS[courseSlots[0].level as Level] ?? LEVEL_COLORS[400] : LEVEL_COLORS[400];
                  return (
                    <div key={code} className="px-5 py-4 flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-xl flex-shrink-0 flex flex-col items-center justify-center font-black text-[10px] ${lc.bg} ${lc.border} border ${lc.text} leading-none gap-0.5`}>
                        {code.split(" ").map((part, i) => <span key={i}>{part}</span>)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-white text-sm">{code}</div>
                        <div className="text-xs text-white/35 mt-0.5">{courseSlots.length} slot{courseSlots.length !== 1 ? "s" : ""} · {hrs}hrs/week</div>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {courseSlots.map(s => (
                            <button key={s.id} onClick={() => setActionModal(s)}
                              className={`text-[9px] font-bold px-2 py-0.5 rounded border hover:brightness-110 transition-all ${
                                (slotActions[s.id] ?? "none") !== "none"
                                  ? `${ACTION_CONFIG[slotActions[s.id]].bg} ${ACTION_CONFIG[slotActions[s.id]].border} ${ACTION_CONFIG[slotActions[s.id]].color}`
                                  : `${lc.bg} ${lc.border} ${lc.text}`
                              }`}>
                              {s.day.slice(0,3)} {s.startTime}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-lg font-black text-white">{hrs}</div>
                        <div className="text-[9px] text-white/30">hrs/wk</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="px-5 py-3 border-t border-white/10 bg-white/[0.02] flex items-center justify-between">
                <span className="text-xs text-white/35">{lecturer.coursesCurrent.length} courses · {mySlots.length} total slots</span>
                <span className="text-sm font-bold text-emerald-400">{totalHours} hrs/week</span>
              </div>
            </div>

            {mySlots.length === 0 ? (
              <div className="rounded-2xl border border-white/10 p-12 text-center space-y-2">
                <CalendarClock className="w-8 h-8 text-white/20 mx-auto" />
                <p className="text-white/30 text-sm">No timetable slots for this lecturer in the demo data.</p>
                <p className="text-white/20 text-xs">Courses: {lecturer.coursesCurrent.join(", ")}</p>
              </div>
            ) : (
              <PersonalTimetable slots={mySlots} slotActions={slotActions} onSlotClick={setActionModal} />
            )}

            <div className="flex gap-2 flex-wrap">
              <button onClick={() => handleDownload("timetable")}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500/10 border border-sky-400/20 text-sky-300 text-sm hover:bg-sky-500/20 transition-colors">
                <Download className="w-3.5 h-3.5" /> Download Timetable PDF
              </button>
              <button onClick={() => handleDownload("print")}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/50 text-sm hover:bg-white/10 transition-colors">
                <Printer className="w-3.5 h-3.5" /> Print
              </button>
            </div>
          </div>
        )}

        {/* EXAM TAB */}
        {activeTab === "exam" && <ExamInvigilationPanel lecturerId={lecturer.id} />}

        {/* PROFILE TAB */}
        {activeTab === "profile" && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-5">
              <div className="flex items-start gap-5">
                <LecturerPassport lecturer={lecturer} size="lg" />
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
                <p className="text-sm text-white/55 leading-relaxed border-t border-white/10 pt-4">{lecturer.bio}</p>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Publications",     value: lecturer.publications ?? "—",                              icon: FileText,  color: "text-sky-400" },
                { label: "Years of Service", value: lecturer.yearsService ? `${lecturer.yearsService} yrs` : "—", icon: Award,     color: "text-amber-400" },
                { label: "Current Courses",  value: lecturer.coursesCurrent.length,                           icon: BookOpen,  color: "text-emerald-400" },
                { label: "Weekly Hours",     value: `${totalHours}h`,                                         icon: Clock,     color: "text-violet-400" },
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

            <div className="rounded-2xl border border-white/10 p-5 space-y-3">
              <h3 className="text-sm font-semibold text-white/50">Contact and Office</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: "Staff ID", value: lecturer.staffId },
                  { label: "Email",    value: lecturer.email },
                  { label: "Phone",    value: lecturer.phone },
                  { label: "Office",   value: lecturer.office },
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
      </div>

      {downloadToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-[#13131f] border border-white/15 shadow-2xl">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <div>
            <div className="text-sm font-semibold text-white capitalize">{downloadToast} ready</div>
            <div className="text-xs text-white/40">Demo: file would download to your device</div>
          </div>
          <button onClick={() => setDownloadToast(null)} className="ml-2 text-white/30 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
      )}
    </DemoLayout>
  );
}
