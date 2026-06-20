// ============================================================
// FEDKO DEMO DATA — ROOMS
// Derived directly from venues used in fedko-timetable.ts —
// not invented. weeklySlots = actual count of scheduled uses.
// ============================================================

export type RoomType = "Lecture Hall" | "Lecture Theatre" | "Laboratory" | "Other";

export interface Room {
  code: string;
  type: RoomType;
  capacity: number;
  building: string;
  weeklySlots: number; // scheduled uses/week, from real timetable data
}

export const FEDKO_ROOMS: Room[] = [
  { code: "SCI Theatre 1", type: "Lecture Theatre", capacity: 500, building: "Science Complex", weeklySlots: 4 },
  { code: "SCI Theatre 2", type: "Lecture Theatre", capacity: 300, building: "Science Complex", weeklySlots: 2 },
  { code: "SCI Theatre 3", type: "Lecture Theatre", capacity: 200, building: "Science Complex", weeklySlots: 1 },
  { code: "SCI LH 1",  type: "Lecture Hall", capacity: 350, building: "Science Complex", weeklySlots: 2 },
  { code: "SCI LH 2",  type: "Lecture Hall", capacity: 250, building: "Science Complex", weeklySlots: 2 },
  { code: "SCI LH 3",  type: "Lecture Hall", capacity: 200, building: "Science Complex", weeklySlots: 2 },
  { code: "SCI LH 4",  type: "Lecture Hall", capacity: 200, building: "Science Complex", weeklySlots: 2 },
  { code: "SCI LH 5",  type: "Lecture Hall", capacity: 150, building: "Science Complex", weeklySlots: 8 },
  { code: "SCI LH 6",  type: "Lecture Hall", capacity: 150, building: "Science Complex", weeklySlots: 7 },
  { code: "SCI LH 7",  type: "Lecture Hall", capacity: 120, building: "Science Complex", weeklySlots: 6 },
  { code: "SCI LH 8",  type: "Lecture Hall", capacity: 120, building: "Science Complex", weeklySlots: 5 },
  { code: "SCI LH 9",  type: "Lecture Hall", capacity: 100, building: "Science Complex", weeklySlots: 11 },
  { code: "SCI LH 10", type: "Lecture Hall", capacity: 100, building: "Science Complex", weeklySlots: 6 },
  { code: "SCI LH 11", type: "Lecture Hall", capacity: 80,  building: "Science Complex", weeklySlots: 12 },
  { code: "SCI LH 12", type: "Lecture Hall", capacity: 80,  building: "Science Complex", weeklySlots: 7 },
  { code: "LAB-CSC-01", type: "Laboratory", capacity: 50, building: "Computer Science Block", weeklySlots: 4 },
  { code: "LAB-CSC-02", type: "Laboratory", capacity: 50, building: "Computer Science Block", weeklySlots: 5 },
  { code: "LAB-CSC-03", type: "Laboratory", capacity: 40, building: "Computer Science Block", weeklySlots: 4 },
  { code: "LAB-CHM-01", type: "Laboratory", capacity: 40, building: "Chemistry Block", weeklySlots: 1 },
  { code: "LAB-CHM-02", type: "Laboratory", capacity: 40, building: "Chemistry Block", weeklySlots: 1 },
  { code: "LAB-CHM-05", type: "Laboratory", capacity: 35, building: "Chemistry Block", weeklySlots: 1 },
  { code: "LAB-BCH-01", type: "Laboratory", capacity: 30, building: "Biochemistry Block", weeklySlots: 6 },
  { code: "LAB-PHY-01", type: "Laboratory", capacity: 40, building: "Physics Block", weeklySlots: 1 },
];

// Max weekly slots available per room (Mon–Fri, 08:00–18:00 in 2hr blocks ≈ 25 slots/wk ceiling used for utilization %)
export const MAX_WEEKLY_SLOTS = 25;

export function utilizationPercent(room: Room): number {
  return Math.round((room.weeklySlots / MAX_WEEKLY_SLOTS) * 100);
}
