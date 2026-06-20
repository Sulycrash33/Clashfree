# FEDKO Demo Parity Plan

**Goal:** FEDKO demo should showcase every real feature category the main app has, as read-only/simulated views, using the same demo-mode lockdown pattern already in place. Built off existing `/src/app/demo/_data/*` mock data wherever possible — no disconnected fake data.

**Status legend:** ⬜ not started · 🔵 in progress · ✅ done

---

## Gap found (confirmed by direct code comparison, June 2026)

Main app: 17 routes (`/dashboard/*`). Demo: 5 pages, no sub-routes.

**Missing entirely from demo:** Courses mgmt, Lecturers mgmt, Rooms mgmt, Users mgmt, Activity Logs, System Health, Signups queue, standalone Conflicts/Issues screen.

**Present but thin:** Faculties/Departments (IA demo has tabs gesturing at this, not real CRUD-style screens).

---

## Plan (sequenced — do in this order, one at a time)

1. ✅ **Rooms showcase** — new "Rooms & Utilization" tab on Super Admin demo. Derived `fedko-rooms.ts` from real venue names + capacities already used in `fedko-timetable.ts`; weeklySlots computed from actual scheduled-use counts in the data, not invented. Distinct from existing "Facilities" tab (which lists the faculty's room pool/types) — this one shows utilization load per room.

2. ✅ **Courses showcase** — new "Course Catalogue" tab on Institution Admin demo. Uses existing `fedko-courses.ts` (621 lines, real CCMAS-aligned data) via `ALL_DEPT_COURSES`. Filterable by department/level/semester, shows credit units + course type badges.

3. ✅ **Lecturers showcase** — new "Lecturer Directory" tab on Institution Admin demo. Expandable profile cards using existing `fedko-lecturers.ts` `FEATURED_LECTURERS` data (was already imported but only used in a dropdown) — shows bio, specialization, qualifications, current course load, contact details.

4. ✅ **Conflicts & Issues standalone screen** — new "Conflicts & Issues" tab on Super Admin demo. Two real sections: "Flagged Issues" (4 explicitly-flagged slots with documented causes — overcapacity, cross-level spillover clashes) and "System-Detected Clashes" (computed venue/time double-bookings via existing `getConflictSlots()`). Both sourced from real `fedko-timetable.ts` data, nothing invented.

5. ✅ **Users showcase** — new "Users" tab on Super Admin demo. Cross-role directory built entirely from real personas already established elsewhere in the demo (role picker's SA/IA/TO names, FEATURED_LECTURERS, FEATURED_STUDENTS) — no invented strangers. Role-count summary + full list with role badges.

6. ✅ **Activity Logs showcase** — new "Activity Logs" tab on Super Admin demo. 8 log entries, each tied to an action this demo actually simulates elsewhere (TO auto-assign, IA overrides, real flagged conflicts, real lecturer names) — invented timestamps/sequence but grounded content, not disconnected filler.

7. ✅ **System Health showcase** — new "System Health" tab on Super Admin demo. Reflects the actual ClashFree stack (Neon PostgreSQL, API services, Resend email, Meta WhatsApp Cloud API) rather than generic placeholders — matches real `/dashboard/health` concept.

8. ⬜ **Signups queue showcase** — new tab on Super Admin demo. Simulated pending institution signups list, matching real `/dashboard/signups` concept.

9. ⬜ **Final pass** — review all new tabs against Kofar Mata design tokens (no ad hoc colors), confirm demo-mode lockdown CSS applies correctly to new interactive elements, test light/dark mode on every new screen, push + verify Vercel deploy.

---

## How to resume
Say "continue" — pick up at the first ⬜ item in order. Each item gets its own commit + push so progress is never lost even mid-list.
