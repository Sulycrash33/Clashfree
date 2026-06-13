"use client";

import { useState } from "react";
import {
  Building2, ShieldAlert, UserPlus, UserMinus, PlusCircle,
  MinusCircle, ChevronRight, ChevronDown, CheckCircle2,
  AlertTriangle, X, Save, RotateCcw, Eye, Lock,
  Unlock, Calendar, BookMarked, Users, FlaskConical,
  Settings, Bell, FileText, BarChart3, GraduationCap,
  ClipboardList, Layers, Pause, Play, Zap, Crown, Database,
  Shield, Globe, Activity, RefreshCw, Trash2, Download, Monitor, Ban,
} from "lucide-react";
import { DemoLayout } from "../_components/DemoLayout";
import { DEPARTMENTS, LECTURE_FACILITIES } from "../_data/fedko-faculties";
import { FEATURED_LECTURERS } from "../_data/fedko-lecturers";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type OverrideType =
  | "timetable_lock"
  | "room_reassignment"
  | "credit_waiver"
  | "lecturer_substitution"
  | "enrollment_cap_override"
  | "exam_date_change"
  | "course_suspension"
  | "dept_merger_notice";

interface Override {
  id: string;
  type: OverrideType;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  badgeColor: string;
  active: boolean;
  details: OverrideDetail;
}

interface OverrideDetail {
  current: string;
  proposedAction: string;
  affectedEntity: string;
  approvedBy: string;
  effectiveDate: string;
  fields: { label: string; value: string; editable?: boolean }[];
}

// ─────────────────────────────────────────────
// Override definitions
// ─────────────────────────────────────────────
const OVERRIDES: Override[] = [
  {
    id: "ov-01",
    type: "timetable_lock",
    label: "Timetable Lock",
    description: "Lock or unlock timetable editing for the current semester. When locked, Timetable Officers cannot make changes.",
    icon: Lock,
    color: "text-amber-400",
    badgeColor: "bg-amber-500/15 border-amber-400/30 text-amber-300",
    active: false,
    details: {
      current: "Timetable UNLOCKED — editing active",
      proposedAction: "Lock timetable for Semester 1, 2024/2025",
      affectedEntity: "All Timetable Officers, Faculty of Physical & Applied Sciences",
      approvedBy: "IA: Dr. Temari Nara",
      effectiveDate: "2024-11-01",
      fields: [
        { label: "Current Status", value: "Unlocked (Editing Active)", editable: false },
        { label: "Lock Reason", value: "Pre-examination freeze", editable: true },
        { label: "Effective Date", value: "2024-11-01", editable: true },
        { label: "Notify Timetable Officers", value: "Yes — WhatsApp + Email", editable: true },
        { label: "Auto-unlock Date", value: "2025-01-15 (Next Semester)", editable: true },
      ],
    },
  },
  {
    id: "ov-02",
    type: "room_reassignment",
    label: "Venue Reassignment",
    description: "Override a course's assigned venue due to capacity breach, maintenance, or scheduling conflict.",
    icon: Building2,
    color: "text-sky-400",
    badgeColor: "bg-sky-500/15 border-sky-400/30 text-sky-300",
    active: true,
    details: {
      current: "CSC 411 assigned to SCI LH 9 (100 seats) — 118 students registered",
      proposedAction: "Reassign CSC 411 to SCI LH 3 (200 seats)",
      affectedEntity: "CSC 411 — Advanced Algorithms, 400 Level",
      approvedBy: "IA: Dr. Temari Nara",
      effectiveDate: "2024-10-14",
      fields: [
        { label: "Course", value: "CSC 411 — Advanced Algorithms", editable: false },
        { label: "Current Venue", value: "SCI LH 9 (Capacity: 100)", editable: false },
        { label: "Override Venue", value: "SCI LH 3 (Capacity: 200)", editable: true },
        { label: "Reason", value: "Enrollment exceeds capacity by 18 students", editable: true },
        { label: "Notify Students", value: "Yes — WhatsApp broadcast sent", editable: false },
        { label: "Notify Lecturer", value: "Prof. Shikamaru Nara — notified via email", editable: false },
      ],
    },
  },
  {
    id: "ov-03",
    type: "credit_waiver",
    label: "Credit Unit Waiver",
    description: "Grant a student permission to exceed the 24 CU semester cap. Requires CGPA ≥ 4.0 and Senate approval.",
    icon: BookMarked,
    color: "text-violet-400",
    badgeColor: "bg-violet-500/15 border-violet-400/30 text-violet-300",
    active: false,
    details: {
      current: "Standard limit: 24 CU/semester. Waiver allows up to 26 CU.",
      proposedAction: "No active waiver requests pending",
      affectedEntity: "Individual students — case by case",
      approvedBy: "Requires Senate Academic Standards Committee",
      effectiveDate: "Per request",
      fields: [
        { label: "Student Matric", value: "Enter matric number", editable: true },
        { label: "Current CU", value: "Enter current registration CU", editable: true },
        { label: "Requested CU", value: "Enter requested CU (max 26)", editable: true },
        { label: "Student CGPA", value: "Must be ≥ 4.0", editable: false },
        { label: "Senate Approval Ref", value: "Enter approval reference", editable: true },
        { label: "Effective Semester", value: "2024/2025 Semester 1", editable: true },
      ],
    },
  },
  {
    id: "ov-04",
    type: "lecturer_substitution",
    label: "Lecturer Substitution",
    description: "Assign a substitute lecturer to cover a course when the primary lecturer is unavailable.",
    icon: GraduationCap,
    color: "text-emerald-400",
    badgeColor: "bg-emerald-500/15 border-emerald-400/30 text-emerald-300",
    active: true,
    details: {
      current: "PHY 317 (Classical Waves) — primary lecturer on sick leave",
      proposedAction: "Dr. Obito Uchiha to cover PHY 317 for 2 weeks",
      affectedEntity: "PHY 317 — 300 Level Physics, 56 students affected",
      approvedBy: "IA: Dr. Temari Nara + HOD Physics: Prof. Sasuke Uchiha",
      effectiveDate: "2024-10-07",
      fields: [
        { label: "Course", value: "PHY 317 — Classical Waves", editable: false },
        { label: "Primary Lecturer", value: "Dr. Nagato Pain (on sick leave)", editable: false },
        { label: "Substitute Lecturer", value: "Dr. Obito Uchiha", editable: true },
        { label: "Duration", value: "2 weeks (Oct 7 – Oct 18, 2024)", editable: true },
        { label: "Lecture Slots Affected", value: "Mon 14:00–16:00, Thu 10:00–12:00", editable: false },
        { label: "Student Notification", value: "Sent via ClashFree WhatsApp broadcast", editable: false },
      ],
    },
  },
  {
    id: "ov-05",
    type: "enrollment_cap_override",
    label: "Enrollment Cap Override",
    description: "Temporarily raise or lower the enrollment cap for a specific course or department.",
    icon: Users,
    color: "text-rose-400",
    badgeColor: "bg-rose-500/15 border-rose-400/30 text-rose-300",
    active: false,
    details: {
      current: "Default cap: 70 students/course section for CSC; 60 for CHM/PHY",
      proposedAction: "No active cap overrides",
      affectedEntity: "Per-course — specify below",
      approvedBy: "IA + HOD signature required",
      effectiveDate: "Per request",
      fields: [
        { label: "Course Code", value: "Enter course code", editable: true },
        { label: "Current Cap", value: "Auto-populated", editable: false },
        { label: "New Cap", value: "Enter new cap", editable: true },
        { label: "Reason", value: "Enter justification", editable: true },
        { label: "Duration", value: "Entire semester / Specific date range", editable: true },
        { label: "HOD Approval", value: "Pending", editable: false },
      ],
    },
  },
  {
    id: "ov-06",
    type: "exam_date_change",
    label: "Examination Date Change",
    description: "Reschedule an examination date for a specific course. Triggers automatic student and lecturer notification.",
    icon: Calendar,
    color: "text-orange-400",
    badgeColor: "bg-orange-500/15 border-orange-400/30 text-orange-300",
    active: false,
    details: {
      current: "Exam timetable published — changes require IA approval",
      proposedAction: "No active exam date changes",
      affectedEntity: "Per-course",
      approvedBy: "IA + Examinations Officer",
      effectiveDate: "Per request",
      fields: [
        { label: "Course Code", value: "Enter course code", editable: true },
        { label: "Original Exam Date", value: "Auto-populated from exam timetable", editable: false },
        { label: "New Exam Date", value: "Enter new date", editable: true },
        { label: "New Venue", value: "Enter venue (if changed)", editable: true },
        { label: "Change Reason", value: "Enter reason", editable: true },
        { label: "Notification Method", value: "WhatsApp + Email + Notice Board", editable: false },
      ],
    },
  },
  {
    id: "ov-07",
    type: "course_suspension",
    label: "Course Suspension",
    description: "Temporarily suspend a course offering for this semester due to lack of manpower or infrastructure.",
    icon: AlertTriangle,
    color: "text-red-400",
    badgeColor: "bg-red-500/15 border-red-400/30 text-red-300",
    active: false,
    details: {
      current: "No courses currently suspended",
      proposedAction: "Suspend specified course for current semester",
      affectedEntity: "Registered students of the suspended course",
      approvedBy: "Senate Academic Board approval required",
      effectiveDate: "Per request",
      fields: [
        { label: "Course Code", value: "Enter course code", editable: true },
        { label: "Reason", value: "No qualified lecturer / Infrastructure unavailable", editable: true },
        { label: "Student Count", value: "Auto-populated", editable: false },
        { label: "Alternative Course Offered", value: "Enter alternative (if any)", editable: true },
        { label: "Refund Credit Units", value: "Yes — auto-adjusted on SIS", editable: false },
        { label: "Senate Ref No.", value: "Enter Senate approval reference", editable: true },
      ],
    },
  },
  {
    id: "ov-08",
    type: "dept_merger_notice",
    label: "Department Notice / Circular",
    description: "Issue an official circular to one or all departments. Delivered via ClashFree notification system.",
    icon: Bell,
    color: "text-cyan-400",
    badgeColor: "bg-cyan-500/15 border-cyan-400/30 text-cyan-300",
    active: false,
    details: {
      current: "Last circular: 2024-09-30 — Semester 1 Commencement",
      proposedAction: "Draft and send new circular",
      affectedEntity: "Select: All Depts / Specific Dept / Lecturers only / Students only",
      approvedBy: "IA authorization",
      effectiveDate: "Immediate on dispatch",
      fields: [
        { label: "Target Audience", value: "All / Dept / Lecturers / Students", editable: true },
        { label: "Subject", value: "Enter circular subject", editable: true },
        { label: "Body", value: "Enter message body", editable: true },
        { label: "Delivery Channel", value: "WhatsApp + Email + In-app", editable: true },
        { label: "Priority", value: "Normal / Urgent / Critical", editable: true },
        { label: "Sender", value: "Dr. Temari Nara, Institution Admin", editable: false },
      ],
    },
  },
];

// ─────────────────────────────────────────────
// Reusable modal
// ─────────────────────────────────────────────
function OverrideModal({
  override,
  onClose,
}: {
  override: Override;
  onClose: () => void;
}) {
  const [saved, setSaved] = useState(false);
  const Icon = override.icon;

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 1400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-white/15 bg-[#13131f] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <Icon className={`w-4 h-4 ${override.color}`} />
            </div>
            <div>
              <div className="font-semibold text-white text-sm">{override.label}</div>
              <div className="text-xs text-white/40">IA Override Control</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/30 hover:text-white transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Status */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm ${override.badgeColor}`}>
            {override.active ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            )}
            <span>{override.details.current}</span>
          </div>

          {/* Fields */}
          <div className="space-y-3">
            {override.details.fields.map((f) => (
              <div key={f.label} className="space-y-1">
                <label className="text-xs font-medium text-white/50">{f.label}</label>
                {f.editable ? (
                  <input
                    defaultValue={f.value}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors"
                  />
                ) : (
                  <div className="w-full bg-white/[0.02] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white/50">
                    {f.value}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Meta */}
          <div className="rounded-xl bg-white/[0.02] border border-white/10 p-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/35">Approved By</span>
              <span className="text-white/60">{override.details.approvedBy}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/35">Affected Entity</span>
              <span className="text-white/60 text-right max-w-[60%]">{override.details.affectedEntity}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/35">Effective Date</span>
              <span className="text-white/60">{override.details.effectiveDate}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-6 py-4 border-t border-white/10">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-sm text-white/50 hover:text-white hover:bg-white/5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Cancel
          </button>
          <button
            onClick={handleSave}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              saved
                ? "bg-emerald-600 text-white"
                : "bg-white text-black hover:bg-white/90"
            }`}
          >
            {saved ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Applied Successfully
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Apply Override
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Add/Remove modal
// ─────────────────────────────────────────────
function AddRemoveModal({
  type,
  action,
  onClose,
}: {
  type: "faculty" | "department" | "admin" | "lecturer";
  action: "add" | "remove";
  onClose: () => void;
}) {
  const [done, setDone] = useState(false);

  const labels: Record<typeof type, { singular: string; fields: { label: string; placeholder: string }[] }> = {
    faculty: {
      singular: "Faculty",
      fields: [
        { label: "Faculty Name", placeholder: "e.g. Faculty of Veterinary Medicine" },
        { label: "Faculty Code", placeholder: "e.g. VET" },
        { label: "Dean Name", placeholder: "e.g. Prof. John Doe" },
        { label: "Number of Departments", placeholder: "e.g. 5" },
      ],
    },
    department: {
      singular: "Department",
      fields: [
        { label: "Department Name", placeholder: "e.g. Department of Biochemistry" },
        { label: "Department Code", placeholder: "e.g. BCH" },
        { label: "Parent Faculty", placeholder: "Faculty of Physical & Applied Sciences" },
        { label: "HOD Name", placeholder: "e.g. Dr. Jane Smith" },
      ],
    },
    admin: {
      singular: "Admin",
      fields: [
        { label: "Full Name", placeholder: "e.g. Dr. Shikamaru Nara" },
        { label: "Staff ID", placeholder: "e.g. FEDKO/SCI/ADM/004" },
        { label: "Email", placeholder: "e.g. s.nara@fedko.edu.ng" },
        { label: "Role", placeholder: "Institution Admin / Timetable Officer" },
      ],
    },
    lecturer: {
      singular: "Lecturer",
      fields: [
        { label: "Full Name", placeholder: "e.g. Dr. New Lecturer" },
        { label: "Staff ID", placeholder: "e.g. FEDKO/SCI/CHM/017" },
        { label: "Department", placeholder: "e.g. Chemistry" },
        { label: "Rank", placeholder: "e.g. Lecturer I" },
        { label: "Specialization", placeholder: "e.g. Organic Chemistry" },
        { label: "Email", placeholder: "e.g. n.lecturer@fedko.edu.ng" },
      ],
    },
  };

  const config = labels[type];
  const isRemove = action === "remove";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[#13131f] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isRemove ? "bg-red-500/20" : "bg-emerald-500/20"}`}>
              {isRemove
                ? <MinusCircle className="w-4 h-4 text-red-400" />
                : <PlusCircle className="w-4 h-4 text-emerald-400" />
              }
            </div>
            <span className="font-semibold text-white text-sm">
              {isRemove ? "Remove" : "Add"} {config.singular}
            </span>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[55vh] overflow-y-auto">
          {isRemove ? (
            <div className="space-y-3">
              <div className="rounded-xl bg-red-500/10 border border-red-400/20 p-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-white/60">
                  Removing a {config.singular.toLowerCase()} is irreversible in this demo.
                  All associated data will be unlinked.
                </p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-white/50">Select {config.singular} to Remove</label>
                <select className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30">
                  <option value="">— Choose {config.singular} —</option>
                  {type === "department" && DEPARTMENTS.map(d => (
                    <option key={d.code} value={d.code}>{d.name}</option>
                  ))}
                  {type === "lecturer" && FEATURED_LECTURERS.map(l => (
                    <option key={l.id} value={l.id}>{l.name} ({l.dept})</option>
                  ))}
                  {type === "admin" && (
                    <>
                      <option>Dr. Temari Nara — Institution Admin</option>
                      <option>Mr. Konohamaru Sarutobi — Timetable Officer</option>
                    </>
                  )}
                  {type === "faculty" && (
                    <>
                      <option>Faculty of Administration</option>
                      <option>Faculty of Agriculture</option>
                    </>
                  )}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-white/50">Reason for Removal</label>
                <textarea
                  rows={3}
                  placeholder="Enter reason..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30 resize-none"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {config.fields.map(f => (
                <div key={f.label} className="space-y-1">
                  <label className="text-xs font-medium text-white/50">{f.label}</label>
                  <input
                    placeholder={f.placeholder}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-white/10">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-white/10 text-sm text-white/50 hover:text-white hover:bg-white/5 transition-colors">
            Cancel
          </button>
          <button
            onClick={() => { setDone(true); setTimeout(onClose, 1200); }}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              done
                ? "bg-emerald-600 text-white"
                : isRemove
                ? "bg-red-600 hover:bg-red-500 text-white"
                : "bg-white text-black hover:bg-white/90"
            }`}
          >
            {done ? (
              <><CheckCircle2 className="w-4 h-4" /> Done</>
            ) : isRemove ? (
              <><UserMinus className="w-4 h-4" /> Confirm Remove</>
            ) : (
              <><UserPlus className="w-4 h-4" /> Add {config.singular}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────
export default function InstitutionAdminPage() {
  const [activeTab, setActiveTab] = useState<"overrides" | "manage" | "summary" | "control" | "system">("overrides");
  const [selectedOverride, setSelectedOverride] = useState<Override | null>(null);
  const [addRemoveModal, setAddRemoveModal] = useState<{
    type: "faculty" | "department" | "admin" | "lecturer";
    action: "add" | "remove";
  } | null>(null);

  const activeOverrides = OVERRIDES.filter(o => o.active);

  // Pause / Resume timetable
  const [timetableStatus, setTimetableStatus] = useState<"active" | "paused" | "suspended">("active");
  const [pauseReason, setPauseReason] = useState("ASUU strike action");
  const [pauseToast, setPauseToast] = useState<string | null>(null);
  const [systemToast, setSystemToast] = useState<string | null>(null);

  const showPauseToast = (msg: string) => {
    setPauseToast(msg);
    setTimeout(() => setPauseToast(null), 3000);
  };
  const showSystemToast = (msg: string) => {
    setSystemToast(msg);
    setTimeout(() => setSystemToast(null), 3000);
  };

  const TABS = [
    { id: "overrides", label: "Override Controls", icon: ShieldAlert },
    { id: "manage", label: "Add / Remove", icon: Settings },
    { id: "summary", label: "Faculty Summary", icon: BarChart3 },
    { id: "control", label: "Timetable Control", icon: Pause },
    { id: "system", label: "System Powers", icon: Crown },
  ] as const;

  return (
    <DemoLayout
      activeRole="ia"
      roleName="Dr. Temari Nara"
      roleSubtitle="Institution Admin · Faculty of Physical & Applied Sciences"
      conflictCount={activeOverrides.length}
    >

      {/* Pause toast */}
      {pauseToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-[#13131f] border border-white/15 shadow-2xl">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span className="text-sm font-semibold text-white">{pauseToast}</span>
        </div>
      )}
      {/* System toast */}
      {systemToast && (
        <div className="fixed bottom-6 left-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-violet-900/90 border border-violet-400/20 shadow-2xl">
          <Zap className="w-4 h-4 text-violet-300 flex-shrink-0" />
          <span className="text-sm font-semibold text-violet-100">{systemToast}</span>
        </div>
      )}

      {/* Modals */}
      {selectedOverride && (
        <OverrideModal override={selectedOverride} onClose={() => setSelectedOverride(null)} />
      )}
      {addRemoveModal && (
        <AddRemoveModal
          type={addRemoveModal.type}
          action={addRemoveModal.action}
          onClose={() => setAddRemoveModal(null)}
        />
      )}

      <div className="px-4 sm:px-6 py-8 space-y-8 max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-4 h-4 text-sky-400" />
              <span className="text-xs font-semibold text-sky-400 uppercase tracking-widest">Institution Admin</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Faculty Control Panel</h1>
            <p className="text-white/40 text-sm mt-1">Faculty of Physical and Applied Sciences · 2024/2025 S1</p>
          </div>
          {activeOverrides.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-400/20">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-medium text-amber-300">
                {activeOverrides.length} active override{activeOverrides.length > 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1 w-fit">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === t.id
                    ? "bg-white/10 text-white shadow"
                    : "text-white/40 hover:text-white/70"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* ══ OVERRIDES TAB ═══════════════════════ */}
        {activeTab === "overrides" && (
          <div className="space-y-4">
            <p className="text-sm text-white/40">
              Click any override control to view its specific details and apply changes.
              Active overrides are highlighted.
            </p>

            {/* Active overrides banner */}
            {activeOverrides.length > 0 && (
              <div className="rounded-2xl border border-amber-400/20 bg-amber-500/5 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-semibold text-amber-300">Active Overrides</span>
                </div>
                <div className="space-y-1">
                  {activeOverrides.map(o => (
                    <button
                      key={o.id}
                      onClick={() => setSelectedOverride(o)}
                      className="w-full flex items-center justify-between text-left px-3 py-2 rounded-lg hover:bg-amber-500/10 transition-colors group"
                    >
                      <span className="text-sm text-white/70 group-hover:text-white transition-colors">
                        {o.label} — {o.details.proposedAction}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-amber-400/60" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* All override cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {OVERRIDES.map(o => {
                const Icon = o.icon;
                return (
                  <button
                    key={o.id}
                    onClick={() => setSelectedOverride(o)}
                    className={`
                      group rounded-2xl border p-5 text-left transition-all duration-200 hover:scale-[1.01] hover:shadow-xl
                      ${o.active
                        ? "border-amber-400/30 bg-amber-500/5 hover:bg-amber-500/10"
                        : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05]"
                      }
                    `}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center`}>
                          <Icon className={`w-4 h-4 ${o.color}`} />
                        </div>
                        <div>
                          <div className="font-semibold text-white text-sm">{o.label}</div>
                          {o.active && (
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border mt-1 ${o.badgeColor}`}>
                              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                              ACTIVE
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/50 group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-1" />
                    </div>
                    <p className="text-xs text-white/45 mt-3 leading-relaxed">{o.description}</p>
                    {o.active && (
                      <div className="mt-3 text-xs text-amber-300/70 bg-amber-500/10 rounded-lg px-2 py-1.5 leading-relaxed">
                        {o.details.proposedAction}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ══ MANAGE TAB ══════════════════════════ */}
        {activeTab === "manage" && (
          <div className="space-y-6">
            <p className="text-sm text-white/40">
              Add or remove faculties, departments, administrators, and lecturers.
              All actions are logged and trigger ClashFree notifications.
            </p>

            {[
              {
                label: "Faculty",
                icon: Building2,
                color: "text-violet-400",
                bg: "bg-violet-500/10",
                border: "border-violet-400/20",
                type: "faculty" as const,
                description: "Add a new faculty or remove an existing one from the institution registry.",
              },
              {
                label: "Department",
                icon: Layers,
                color: "text-sky-400",
                bg: "bg-sky-500/10",
                border: "border-sky-400/20",
                type: "department" as const,
                description: "Add a new department under a faculty or remove a department.",
              },
              {
                label: "Admin / Officer",
                icon: ShieldAlert,
                color: "text-amber-400",
                bg: "bg-amber-500/10",
                border: "border-amber-400/20",
                type: "admin" as const,
                description: "Add or remove Institution Admins and Timetable Officers.",
              },
              {
                label: "Lecturer",
                icon: GraduationCap,
                color: "text-emerald-400",
                bg: "bg-emerald-500/10",
                border: "border-emerald-400/20",
                type: "lecturer" as const,
                description: "Add a new lecturer or remove one from a department.",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.type} className={`rounded-2xl border ${item.border} ${item.bg} p-5 space-y-4`}>
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${item.color}`} />
                    <div>
                      <div className="font-semibold text-white text-sm">{item.label}</div>
                      <div className="text-xs text-white/40 mt-0.5">{item.description}</div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setAddRemoveModal({ type: item.type, action: "add" })}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                    >
                      <PlusCircle className="w-4 h-4 text-emerald-400" />
                      Add {item.label}
                    </button>
                    <button
                      onClick={() => setAddRemoveModal({ type: item.type, action: "remove" })}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white/70 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                    >
                      <MinusCircle className="w-4 h-4 text-red-400" />
                      Remove {item.label}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ══ SUMMARY TAB ════════════════════════ */}
        {activeTab === "summary" && (
          <div className="space-y-6">
            {/* Quick stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Departments", value: DEPARTMENTS.length, icon: Layers, color: "bg-sky-600" },
                { label: "Total Lecturers", value: DEPARTMENTS.reduce((s, d) => s + d.totalLecturers, 0), icon: GraduationCap, color: "bg-emerald-600" },
                { label: "Lecture Facilities", value: LECTURE_FACILITIES.length, icon: FlaskConical, color: "bg-violet-600" },
                { label: "Active Overrides", value: activeOverrides.length, icon: ShieldAlert, color: "bg-amber-600" },
              ].map(s => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-2">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${s.color}`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-xl font-bold text-white">{s.value}</div>
                    <div className="text-xs text-white/40">{s.label}</div>
                  </div>
                );
              })}
            </div>

            {/* Per-dept lecturer table */}
            <div className="rounded-2xl border border-white/10 overflow-hidden">
              <div className="px-5 py-3 border-b border-white/10 bg-white/[0.02]">
                <p className="text-sm font-semibold text-white/60">Department Staffing — Ratio Check</p>
              </div>
              <div className="divide-y divide-white/5">
                {DEPARTMENTS.map(d => {
                  const students = d.studentsPerLevel * 4;
                  const ratio = Math.round(students / d.totalLecturers);
                  const ok = ratio <= 7;
                  return (
                    <div key={d.code} className="flex items-center justify-between px-5 py-3 hover:bg-white/[0.02] transition-colors">
                      <div>
                        <div className="text-sm font-medium text-white/80">{d.name}</div>
                        <div className="text-xs text-white/35 mt-0.5">{d.hod}</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                          <div className="text-sm text-white/60">{students}</div>
                          <div className="text-xs text-white/30">students</div>
                        </div>
                        <div className="text-right hidden sm:block">
                          <div className="text-sm text-white/60">{d.totalLecturers}</div>
                          <div className="text-xs text-white/30">lecturers</div>
                        </div>
                        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${
                          ok
                            ? "bg-emerald-500/10 border-emerald-400/20 text-emerald-300"
                            : "bg-red-500/10 border-red-400/20 text-red-300"
                        }`}>
                          {ok ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                          {ratio}:1
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}


        {/* ══ TIMETABLE CONTROL TAB ══════════════════ */}
        {activeTab === "control" && (
          <div className="space-y-6">
            <p className="text-sm text-white/40">
              Pause or resume the timetable system for this institution. Use this during strikes, emergencies, or semester breaks.
              All students and lecturers are notified automatically via WhatsApp when status changes.
            </p>

            {/* Current status */}
            <div className={`rounded-2xl border p-6 space-y-4 ${
              timetableStatus === "active"
                ? "border-emerald-400/20 bg-emerald-500/5"
                : timetableStatus === "paused"
                ? "border-amber-400/20 bg-amber-500/5"
                : "border-red-400/20 bg-red-500/5"
            }`}>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    timetableStatus === "active" ? "bg-emerald-600" : timetableStatus === "paused" ? "bg-amber-600" : "bg-red-600"
                  }`}>
                    {timetableStatus === "active"
                      ? <Play className="w-5 h-5 text-white" />
                      : timetableStatus === "paused"
                      ? <Pause className="w-5 h-5 text-white" />
                      : <Shield className="w-5 h-5 text-white" />
                    }
                  </div>
                  <div>
                    <div className={`text-lg font-bold ${
                      timetableStatus === "active" ? "text-emerald-300" : timetableStatus === "paused" ? "text-amber-300" : "text-red-300"
                    }`}>
                      Timetable {timetableStatus === "active" ? "Active" : timetableStatus === "paused" ? "Paused" : "Suspended"}
                    </div>
                    <div className="text-sm text-white/40 mt-0.5">
                      {timetableStatus === "active"
                        ? "All lectures running as scheduled — Semester 1, 2024/2025"
                        : timetableStatus === "paused"
                        ? `Paused — Reason: ${pauseReason}`
                        : "Suspended indefinitely — awaiting institution directive"
                      }
                    </div>
                  </div>
                </div>
                <div className={`text-xs font-bold px-3 py-1.5 rounded-full border ${
                  timetableStatus === "active"
                    ? "bg-emerald-500/15 border-emerald-400/30 text-emerald-300"
                    : timetableStatus === "paused"
                    ? "bg-amber-500/15 border-amber-400/30 text-amber-300"
                    : "bg-red-500/15 border-red-400/30 text-red-300"
                } flex items-center gap-1.5`}>
                  <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                  {timetableStatus.toUpperCase()}
                </div>
              </div>

              {/* Pause reason input */}
              {timetableStatus !== "active" && (
                <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-2">
                  <label className="text-xs text-white/50 font-medium">Pause Reason (displayed to all users)</label>
                  <input
                    value={pauseReason}
                    onChange={e => setPauseReason(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30"
                    placeholder="e.g. ASUU strike action, public holiday, maintenance..."
                  />
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => { setTimetableStatus("active"); showPauseToast("✓ Timetable resumed — students and lecturers notified"); }}
                disabled={timetableStatus === "active"}
                className={`flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-semibold text-sm transition-all ${
                  timetableStatus === "active"
                    ? "bg-emerald-600/30 border border-emerald-400/20 text-emerald-400/50 cursor-not-allowed"
                    : "bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg"
                }`}>
                <Play className="w-4 h-4" />
                Resume Timetable
              </button>

              <button
                onClick={() => { setTimetableStatus("paused"); showPauseToast("⏸ Timetable paused — all parties notified via WhatsApp"); }}
                disabled={timetableStatus === "paused"}
                className={`flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-semibold text-sm transition-all ${
                  timetableStatus === "paused"
                    ? "bg-amber-600/30 border border-amber-400/20 text-amber-400/50 cursor-not-allowed"
                    : "bg-amber-600 text-white hover:bg-amber-500 shadow-lg"
                }`}>
                <Pause className="w-4 h-4" />
                Pause Timetable
              </button>

              <button
                onClick={() => { setTimetableStatus("suspended"); showPauseToast("⛔ Timetable suspended — full institution notified"); }}
                disabled={timetableStatus === "suspended"}
                className={`flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-semibold text-sm transition-all ${
                  timetableStatus === "suspended"
                    ? "bg-red-600/30 border border-red-400/20 text-red-400/50 cursor-not-allowed"
                    : "bg-red-700 text-white hover:bg-red-600 shadow-lg"
                }`}>
                <Shield className="w-4 h-4" />
                Suspend (Emergency)
              </button>
            </div>

            {/* Info cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  icon: Pause,
                  color: "text-amber-400",
                  bg: "bg-amber-500/10 border-amber-400/20",
                  title: "Pause",
                  desc: "Temporarily halts all scheduled lectures. Students and lecturers are notified. Timetable data is preserved. Use for short interruptions like strikes or public holidays.",
                },
                {
                  icon: Play,
                  color: "text-emerald-400",
                  bg: "bg-emerald-500/10 border-emerald-400/20",
                  title: "Resume",
                  desc: "Restores the timetable to its active state. All previously scheduled lectures continue from the next applicable date. WhatsApp notifications sent to all parties.",
                },
                {
                  icon: Shield,
                  color: "text-red-400",
                  bg: "bg-red-500/10 border-red-400/20",
                  title: "Emergency Suspend",
                  desc: "Full suspension — no lectures, no access updates. Reserved for serious situations (security, force majeure). Requires Super Admin acknowledgement to lift.",
                },
                {
                  icon: Bell,
                  color: "text-sky-400",
                  bg: "bg-sky-500/10 border-sky-400/20",
                  title: "Notifications",
                  desc: "Every status change automatically triggers WhatsApp messages to all registered students, lecturers, and timetable officers via the Meta Cloud API integration.",
                },
              ].map(c => {
                const Icon = c.icon;
                return (
                  <div key={c.title} className={`rounded-xl border ${c.bg} p-4 space-y-2`}>
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${c.color}`} />
                      <span className={`text-sm font-semibold ${c.color}`}>{c.title}</span>
                    </div>
                    <p className="text-xs text-white/45 leading-relaxed">{c.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══ SYSTEM POWERS TAB ══════════════════════ */}
        {activeTab === "system" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-amber-400/20 bg-amber-500/5 p-4 flex items-start gap-3">
              <Crown className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-amber-300">Institution Admin — Elevated System Powers</div>
                <p className="text-xs text-white/40 mt-1 leading-relaxed">
                  These powers were previously restricted to Super Admin. They are now available to Institution Admins
                  for operational efficiency. Super Admin retains platform-level oversight and audit logs.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  label: "Bulk Enrolment Override",
                  desc: "Force-enrol or remove multiple students from courses in a single batch operation.",
                  icon: Users,
                  color: "text-sky-400",
                  bg: "bg-sky-500/10 border-sky-400/20",
                  action: "Apply Bulk Override",
                },
                {
                  label: "Course Suspension",
                  desc: "Suspend a course for the semester — removes from all student and lecturer timetables.",
                  icon: Ban,
                  color: "text-red-400",
                  bg: "bg-red-500/10 border-red-400/20",
                  action: "Suspend Course",
                },
                {
                  label: "Lecturer Substitution",
                  desc: "Assign a substitute lecturer to all sessions of a course for a defined period.",
                  icon: RefreshCw,
                  color: "text-violet-400",
                  bg: "bg-violet-500/10 border-violet-400/20",
                  action: "Set Substitution",
                },
                {
                  label: "Export Full Dataset",
                  desc: "Export complete institution timetable, student enrolment, and lecturer data as CSV/PDF.",
                  icon: Download,
                  color: "text-emerald-400",
                  bg: "bg-emerald-500/10 border-emerald-400/20",
                  action: "Export All Data",
                },
                {
                  label: "Broadcast Announcement",
                  desc: "Send a system-wide WhatsApp message to all students and lecturers in this institution.",
                  icon: Bell,
                  color: "text-amber-400",
                  bg: "bg-amber-500/10 border-amber-400/20",
                  action: "Send Broadcast",
                },
                {
                  label: "Audit Log",
                  desc: "View full log of all admin actions, overrides, and system changes for this institution.",
                  icon: ClipboardList,
                  color: "text-white/50",
                  bg: "bg-white/5 border-white/10",
                  action: "View Audit Log",
                },
                {
                  label: "Flush Clash Cache",
                  desc: "Force ClashFree to re-detect all clashes from scratch. Run after bulk data changes.",
                  icon: Zap,
                  color: "text-fuchsia-400",
                  bg: "bg-fuchsia-500/10 border-fuchsia-400/20",
                  action: "Run Detection",
                },
                {
                  label: "Session Rollover",
                  desc: "Archive the current academic session and initialise the next one — 2025/2026.",
                  icon: Globe,
                  color: "text-teal-400",
                  bg: "bg-teal-500/10 border-teal-400/20",
                  action: "Begin Rollover",
                },
              ].map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    onClick={() => showSystemToast(`${item.label} action triggered — processing...`)}
                    className={`rounded-2xl border ${item.bg} p-5 text-left space-y-3 hover:brightness-110 transition-all group`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl border ${item.bg} flex items-center justify-center`}>
                          <Icon className={`w-4 h-4 ${item.color}`} />
                        </div>
                        <span className="text-sm font-semibold text-white">{item.label}</span>
                      </div>
                      <Zap className={`w-3.5 h-3.5 ${item.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
                    </div>
                    <p className="text-xs text-white/40 leading-relaxed">{item.desc}</p>
                    <div className={`text-xs font-semibold ${item.color} flex items-center gap-1.5`}>
                      <span>{item.action}</span>
                      <ChevronRight className="w-3 h-3" />
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="rounded-xl bg-white/[0.02] border border-white/10 p-4 flex items-start gap-3">
              <Monitor className="w-4 h-4 text-white/30 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-white/40">Super Admin Oversight</div>
                <p className="text-xs text-white/25 mt-1 leading-relaxed">
                  All system-level actions are logged and visible to the Super Admin in the platform audit trail.
                  Super Admin can reverse any Institution Admin action within 72 hours.
                  Platform health, billing, and multi-institution management remain Super Admin exclusive.
                </p>
              </div>
            </div>
          </div>
        )}

      </div>
    </DemoLayout>
  );
}
