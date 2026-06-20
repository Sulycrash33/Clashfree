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

8. ✅ **Signups queue showcase** — new "Signups" tab on Super Admin demo. 5 realistic Nigerian institution requests (Niger State context, matching real institution-type categories from the actual signup form) — PENDING/APPROVED/REJECTED states with full contact details.

9. ✅ **Final pass** — audited all new code: zero ad hoc hex colors, theme tokens only (primary/secondary/accent-gold/success/clash/foreground). No `dark:` overrides anywhere — light/dark inherits automatically via CSS variables, same as rest of demo. Checked demo-mode lockdown CSS (`main[data-demo-mode="true"]`) — confirmed it's never actually set anywhere in the codebase, so it doesn't affect any new tabs (flagged as dead code below, not blocking). Brace/paren balance verified clean across all 3 touched files.

---

## How to resume
Say "continue" — pick up at the first ⬜ item in order. Each item gets its own commit + push so progress is never lost even mid-list.

---

## ✅ ALL 9 ITEMS COMPLETE

Super Admin demo now has 9 tabs (was 4): Overview, Faculty of Science, Facilities, Rooms & Utilization, Conflicts & Issues, Users, Activity Logs, System Health, Signups, All Faculties.
Institution Admin demo now has 7 tabs (was 5): added Course Catalogue and Lecturer Directory.

All new data is either derived from real existing demo datasets (rooms from timetable venues, courses from CCMAS data, lecturers from featured profiles, conflicts from flagged slots) or — where genuinely new (Users, Logs, Signups) — built from real personas/names already established in the demo rather than invented strangers.

**Flagged, not fixed (separate from this task):** `main[data-demo-mode="true"]` lockdown CSS exists in `globals.css` but is never actually applied anywhere in the codebase — dead code. Not blocking, didn't touch it, mentioning in case it matters for a future feature.

**Recommended next step:** hard-refresh after Vercel deploys, click through every new tab on both SA and IA demo, confirm light/dark mode looks right on each, then decide if Timetable Officer/Lecturer/Student demo pages need similar depth additions (not yet audited against the main app's `/dashboard/lecture-timetable`, `/dashboard/my-timetable`, `/dashboard/lecturer-schedule`, `/dashboard/exam-timetable`).
