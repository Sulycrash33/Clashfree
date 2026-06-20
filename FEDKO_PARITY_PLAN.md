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

2. ⬜ **Courses showcase** — new tab on Institution Admin or Timetable Officer demo, pulling from existing `fedko-courses.ts` (already has 621 lines of real CCMAS-aligned course data). Filterable table by dept/level/semester.

3. ⬜ **Lecturers showcase** — new tab using existing `fedko-lecturers.ts` (284 lines). Table view: name, dept, courses assigned, weekly load.

4. ⬜ **Conflicts & Issues standalone screen** — currently only inline on TO's timetable grid. Build a dedicated demo view listing conflict types/resolutions, matching the real app's `/dashboard/conflicts` concept, using conflict flags already in `fedko-timetable.ts`.

5. ⬜ **Users showcase** — new tab on Super Admin demo. Simulated user list across roles (SA/IA/TO/LC/ST) with role badges — this one needs lightweight invented data since no user dataset exists yet; keep it small and clearly demo-labeled.

6. ⬜ **Activity Logs showcase** — new tab, simulated log entries (timetable published, conflict resolved, override applied, etc.) — invented but realistic, tied to actions already simulated elsewhere in the demo (e.g. IA's pause/resume, overrides).

7. ⬜ **System Health showcase** — new tab on Super Admin demo. Simulated status cards (DB, email service, WhatsApp API, etc.) — cosmetic/static, just needs to exist so panel sees the concept.

8. ⬜ **Signups queue showcase** — new tab on Super Admin demo. Simulated pending institution signups list, matching real `/dashboard/signups` concept.

9. ⬜ **Final pass** — review all new tabs against Kofar Mata design tokens (no ad hoc colors), confirm demo-mode lockdown CSS applies correctly to new interactive elements, test light/dark mode on every new screen, push + verify Vercel deploy.

---

## How to resume
Say "continue" — pick up at the first ⬜ item in order. Each item gets its own commit + push so progress is never lost even mid-list.
