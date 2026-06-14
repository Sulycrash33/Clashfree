// ============================================================
// FEDKO DEMO DATA — TIMETABLE
// Mon–Fri 08:00–18:00 | All SCI dept courses scheduled
// Jumuah (Friday 13:00–14:00) optional prayer break
// No student/lecturer has 3 consecutive lectures without break
// Colour coded by level: 100=blue 200=green 300=amber 400=red
// ============================================================

export type Day = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday";
export type Level = 100 | 200 | 300 | 400;

export interface TimetableSlot {
  id: string;
  day: Day;
  startTime: string;   // "08:00"
  endTime: string;     // "10:00"
  courseCode: string;
  courseTitle: string;
  dept: string;
  level: Level;
  semester: 1 | 2;
  venue: string;
  venueCapacity: number;
  lecturerId: string;
  lecturerName: string;
  slotType: "lecture" | "practical" | "break" | "jumuah" | "project";
  colorClass: string;  // level-based
  conflictFlag?: boolean;
  conflictReason?: string;
}

// Level colour mapping
export const LEVEL_COLORS: Record<Level, { bg: string; text: string; border: string; badge: string }> = {
  100: { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-300", badge: "bg-blue-600" },
  200: { bg: "bg-green-100", text: "text-green-800", border: "border-green-300", badge: "bg-green-600" },
  300: { bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-300", badge: "bg-amber-600" },
  400: { bg: "bg-red-100", text: "text-red-800", border: "border-red-300", badge: "bg-red-600" },
};

// Time slots available (each = 2 hrs lecture or 1 hr break)
export const TIME_SLOTS = [
  "08:00","10:00","12:00","13:00","14:00","16:00",
];
// Fri 13:00–14:00 = Jumuah slot (optional)

// ── FULL WEEKLY TIMETABLE (Semester 1, SCI Focus) ────────────
// Rule: no dept/level has lectures in 3 consecutive 2-hr blocks without a break

export const TIMETABLE: TimetableSlot[] = [

  // ════════════════════════════════════════
  // MONDAY
  // ════════════════════════════════════════

  // — CHM 100L Monday —
  { id: "TT-001", day: "Monday", startTime: "08:00", endTime: "10:00", courseCode: "CHM 101", courseTitle: "General Chemistry I", dept: "CHM", level: 100, semester: 1, venue: "SCI LH 1", venueCapacity: 350, lecturerId: "lec-chm-04", lecturerName: "Mr. Rock Lee", slotType: "lecture", colorClass: "bg-blue-100 border-blue-300 text-blue-800" },
  { id: "TT-002", day: "Monday", startTime: "10:00", endTime: "12:00", courseCode: "MTH 101", courseTitle: "Elementary Mathematics I", dept: "CHM", level: 100, semester: 1, venue: "SCI LH 1", venueCapacity: 350, lecturerId: "lec-mth-04", lecturerName: "Mr. Shikadai Nara", slotType: "lecture", colorClass: "bg-blue-100 border-blue-300 text-blue-800" },
  // Break 12–13
  { id: "TT-003", day: "Monday", startTime: "16:00", endTime: "18:00", courseCode: "PHY 101", courseTitle: "General Physics I", dept: "CHM", level: 100, semester: 1, venue: "SCI LH 2", venueCapacity: 250, lecturerId: "lec-phy-04", lecturerName: "Mr. Minato Namikaze", slotType: "lecture", colorClass: "bg-blue-100 border-blue-300 text-blue-800" },
  { id: "TT-004", day: "Monday", startTime: "16:00", endTime: "18:00", courseCode: "GST 111", courseTitle: "Communication in English I", dept: "CHM", level: 100, semester: 1, venue: "SCI Theatre 1", venueCapacity: 500, lecturerId: "lec-chm-08", lecturerName: "Mr. Sai Yamanaka", slotType: "lecture", colorClass: "bg-blue-100 border-blue-300 text-blue-800" },

  // — CHM 200L Monday —
  { id: "TT-010", day: "Tuesday", startTime: "10:00", endTime: "12:00", courseCode: "CHM 211", courseTitle: "Organic Chemistry I", dept: "CHM", level: 200, semester: 1, venue: "SCI LH 5", venueCapacity: 150, lecturerId: "lec-chm-03", lecturerName: "Dr. Asuma Sarutobi", slotType: "lecture", colorClass: "bg-green-100 border-green-300 text-green-800" },
  { id: "TT-011", day: "Wednesday", startTime: "10:00", endTime: "12:00", courseCode: "CHM 215", courseTitle: "Physical Chemistry I", dept: "CHM", level: 200, semester: 1, venue: "SCI LH 6", venueCapacity: 150, lecturerId: "lec-chm-06", lecturerName: "Dr. Yamato Tenzo", slotType: "lecture", colorClass: "bg-green-100 border-green-300 text-green-800" },
  { id: "TT-012", day: "Monday", startTime: "16:00", endTime: "18:00", courseCode: "MTH 211", courseTitle: "Mathematical Methods I", dept: "CHM", level: 200, semester: 1, venue: "SCI LH 7", venueCapacity: 120, lecturerId: "lec-mth-06", lecturerName: "Dr. Gaara Sabaku", slotType: "lecture", colorClass: "bg-green-100 border-green-300 text-green-800" },
  { id: "TT-013", day: "Thursday", startTime: "10:00", endTime: "12:00", courseCode: "GST 211", courseTitle: "Entrepreneurship I", dept: "CHM", level: 200, semester: 1, venue: "SCI Theatre 2", venueCapacity: 300, lecturerId: "lec-chm-09", lecturerName: "Mr. Suigetsu Hozuki", slotType: "lecture", colorClass: "bg-green-100 border-green-300 text-green-800" },

  // — CHM 300L Monday —
  { id: "TT-020", day: "Tuesday", startTime: "14:00", endTime: "16:00", courseCode: "CHM 311", courseTitle: "Organic Chemistry III", dept: "CHM", level: 300, semester: 1, venue: "SCI LH 9", venueCapacity: 100, lecturerId: "lec-chm-02", lecturerName: "Dr. Kurenai Yuhi", slotType: "lecture", colorClass: "bg-amber-100 border-amber-300 text-amber-800" },
  { id: "TT-021", day: "Thursday", startTime: "08:00", endTime: "10:00", courseCode: "CHM 315", courseTitle: "Physical Chemistry III", dept: "CHM", level: 300, semester: 1, venue: "SCI LH 9", venueCapacity: 100, lecturerId: "lec-chm-07", lecturerName: "Dr. Konan Amegakure", slotType: "lecture", colorClass: "bg-amber-100 border-amber-300 text-amber-800" },
  { id: "TT-022", day: "Monday", startTime: "16:00", endTime: "18:00", courseCode: "CHM 321", courseTitle: "Industrial Chemistry I", dept: "CHM", level: 300, semester: 1, venue: "SCI LH 10", venueCapacity: 100, lecturerId: "lec-chm-15", lecturerName: "Dr. Tsunade Senju", slotType: "lecture", colorClass: "bg-amber-100 border-amber-300 text-amber-800" },
  { id: "TT-023", day: "Wednesday", startTime: "16:00", endTime: "18:00", courseCode: "GST 311", courseTitle: "Entrepreneurship II", dept: "CHM", level: 300, semester: 1, venue: "SCI Theatre 3", venueCapacity: 200, lecturerId: "lec-chm-13", lecturerName: "Mr. Choji Akimichi", slotType: "lecture", colorClass: "bg-amber-100 border-amber-300 text-amber-800" },

  // — CHM 400L Monday —
  { id: "TT-030", day: "Wednesday", startTime: "14:00", endTime: "16:00", courseCode: "CHM 411", courseTitle: "Advanced Organic Chemistry", dept: "CHM", level: 400, semester: 1, venue: "SCI LH 11", venueCapacity: 80, lecturerId: "lec-001", lecturerName: "Prof. Kakashi Hatake", slotType: "lecture", colorClass: "bg-red-100 border-red-300 text-red-800" },
  { id: "TT-031", day: "Friday", startTime: "10:00", endTime: "12:00", courseCode: "CHM 415", courseTitle: "Advanced Physical Chemistry", dept: "CHM", level: 400, semester: 1, venue: "SCI LH 12", venueCapacity: 80, lecturerId: "lec-chm-14", lecturerName: "Prof. Jiraiya Namikaze", slotType: "lecture", colorClass: "bg-red-100 border-red-300 text-red-800" },
  { id: "TT-032", day: "Thursday", startTime: "16:00", endTime: "18:00", courseCode: "CHM 421", courseTitle: "Petroleum Chemistry", dept: "CHM", level: 400, semester: 1, venue: "SCI LH 12", venueCapacity: 80, lecturerId: "lec-chm-14", lecturerName: "Prof. Jiraiya Namikaze", slotType: "lecture", colorClass: "bg-red-100 border-red-300 text-red-800" },

  // — PHY 100L Monday —
  { id: "TT-040", day: "Monday", startTime: "08:00", endTime: "10:00", courseCode: "PHY 101", courseTitle: "General Physics I", dept: "PHY", level: 100, semester: 1, venue: "SCI LH 2", venueCapacity: 250, lecturerId: "lec-phy-04", lecturerName: "Mr. Minato Namikaze", slotType: "lecture", colorClass: "bg-blue-100 border-blue-300 text-blue-800" },
  { id: "TT-041", day: "Wednesday", startTime: "08:00", endTime: "10:00", courseCode: "PHY 103", courseTitle: "Heat, Waves and Optics", dept: "PHY", level: 100, semester: 1, venue: "SCI LH 3", venueCapacity: 200, lecturerId: "lec-phy-05", lecturerName: "Mrs. Kushina Uzumaki", slotType: "lecture", colorClass: "bg-blue-100 border-blue-300 text-blue-800" },
  { id: "TT-042", day: "Monday", startTime: "14:00", endTime: "16:00", courseCode: "MTH 101", courseTitle: "Elementary Mathematics I", dept: "PHY", level: 100, semester: 1, venue: "SCI LH 4", venueCapacity: 200, lecturerId: "lec-mth-04", lecturerName: "Mr. Shikadai Nara", slotType: "lecture", colorClass: "bg-blue-100 border-blue-300 text-blue-800" },
  { id: "TT-043", day: "Thursday", startTime: "14:00", endTime: "16:00", courseCode: "GST 111", courseTitle: "Communication in English I", dept: "PHY", level: 100, semester: 1, venue: "SCI Theatre 1", venueCapacity: 500, lecturerId: "lec-phy-11", lecturerName: "Ms. Karui Kumogakure", slotType: "lecture", colorClass: "bg-blue-100 border-blue-300 text-blue-800" },

  // — PHY 300L Monday —
  { id: "TT-050", day: "Tuesday", startTime: "16:00", endTime: "18:00", courseCode: "PHY 311", courseTitle: "Quantum Mechanics I", dept: "PHY", level: 300, semester: 1, venue: "SCI LH 8", venueCapacity: 120, lecturerId: "lec-002", lecturerName: "Prof. Sasuke Uchiha", slotType: "lecture", colorClass: "bg-amber-100 border-amber-300 text-amber-800" },
  { id: "TT-051", day: "Thursday", startTime: "10:00", endTime: "12:00", courseCode: "PHY 315", courseTitle: "Optics and Photonics", dept: "PHY", level: 300, semester: 1, venue: "SCI LH 8", venueCapacity: 120, lecturerId: "lec-phy-06", lecturerName: "Dr. Nagato Pain", slotType: "lecture", colorClass: "bg-amber-100 border-amber-300 text-amber-800" },
  { id: "TT-052", day: "Monday", startTime: "16:00", endTime: "18:00", courseCode: "PHY 321", courseTitle: "Introduction to Geophysics", dept: "PHY", level: 300, semester: 1, venue: "SCI LH 8", venueCapacity: 120, lecturerId: "lec-phy-07", lecturerName: "Dr. Konan Amegakure-Phy", slotType: "lecture", colorClass: "bg-amber-100 border-amber-300 text-amber-800" },

  // — CSC 100L Monday —
  { id: "TT-060", day: "Tuesday", startTime: "08:00", endTime: "10:00", courseCode: "CSC 101", courseTitle: "Introduction to Computer Science", dept: "CSC", level: 100, semester: 1, venue: "SCI LH 3", venueCapacity: 200, lecturerId: "lec-csc-04", lecturerName: "Mr. Konohamaru Sarutobi", slotType: "lecture", colorClass: "bg-blue-100 border-blue-300 text-blue-800" },
  { id: "TT-061", day: "Friday", startTime: "14:00", endTime: "16:00", courseCode: "CSC 103", courseTitle: "Fundamentals of Programming", dept: "CSC", level: 100, semester: 1, venue: "LAB-CSC-01", venueCapacity: 50, lecturerId: "lec-csc-04", lecturerName: "Mr. Konohamaru Sarutobi", slotType: "practical", colorClass: "bg-blue-100 border-blue-300 text-blue-800" },
  { id: "TT-062", day: "Monday", startTime: "16:00", endTime: "18:00", courseCode: "MTH 101", courseTitle: "Elementary Mathematics I", dept: "CSC", level: 100, semester: 1, venue: "SCI LH 4", venueCapacity: 200, lecturerId: "lec-mth-05", lecturerName: "Dr. Temari Sunagakure", slotType: "lecture", colorClass: "bg-blue-100 border-blue-300 text-blue-800" },

  // — CSC 300L Monday —
  { id: "TT-070", day: "Wednesday", startTime: "08:00", endTime: "10:00", courseCode: "CSC 311", courseTitle: "Algorithm Analysis and Design", dept: "CSC", level: 300, semester: 1, venue: "LAB-CSC-02", venueCapacity: 50, lecturerId: "lec-003", lecturerName: "Prof. Shikamaru Nara", slotType: "lecture", colorClass: "bg-amber-100 border-amber-300 text-amber-800" },
  { id: "TT-071", day: "Wednesday", startTime: "10:00", endTime: "12:00", courseCode: "CSC 313", courseTitle: "Software Engineering I", dept: "CSC", level: 300, semester: 1, venue: "LAB-CSC-02", venueCapacity: 50, lecturerId: "lec-csc-02", lecturerName: "Dr. Temari Nara", slotType: "lecture", colorClass: "bg-amber-100 border-amber-300 text-amber-800" },
  { id: "TT-072", day: "Monday", startTime: "16:00", endTime: "18:00", courseCode: "CSC 315", courseTitle: "Artificial Intelligence", dept: "CSC", level: 300, semester: 1, venue: "SCI LH 7", venueCapacity: 120, lecturerId: "lec-003", lecturerName: "Prof. Shikamaru Nara", slotType: "lecture", colorClass: "bg-amber-100 border-amber-300 text-amber-800" },
  { id: "TT-073", day: "Friday", startTime: "16:00", endTime: "18:00", courseCode: "GST 311", courseTitle: "Entrepreneurship II", dept: "CSC", level: 300, semester: 1, venue: "SCI Theatre 2", venueCapacity: 300, lecturerId: "lec-csc-17", lecturerName: "Dr. Tsubaki Kurotuchi", slotType: "lecture", colorClass: "bg-amber-100 border-amber-300 text-amber-800" },

  // — CSC 400L Monday —
  { id: "TT-080", day: "Monday", startTime: "08:00", endTime: "10:00", courseCode: "CSC 411", courseTitle: "Advanced Algorithms", dept: "CSC", level: 400, semester: 1, venue: "SCI LH 9", venueCapacity: 100, lecturerId: "lec-003", lecturerName: "Prof. Shikamaru Nara", slotType: "lecture", colorClass: "bg-red-100 border-red-300 text-red-800", conflictFlag: true, conflictReason: "118 students registered, venue capacity 100 — overcapacity by 18" },
  { id: "TT-081", day: "Thursday", startTime: "14:00", endTime: "16:00", courseCode: "CSC 413", courseTitle: "Distributed Systems", dept: "CSC", level: 400, semester: 1, venue: "SCI LH 10", venueCapacity: 100, lecturerId: "lec-csc-10", lecturerName: "Dr. Kawaki Uzumaki", slotType: "lecture", colorClass: "bg-red-100 border-red-300 text-red-800" },

  // ════════════════════════════════════════
  // TUESDAY
  // ════════════════════════════════════════

  // — BCH 200L Tuesday —
  { id: "TT-100", day: "Monday", startTime: "08:00", endTime: "10:00", courseCode: "BCH 211", courseTitle: "Physical Biochemistry", dept: "BCH", level: 200, semester: 1, venue: "SCI LH 5", venueCapacity: 150, lecturerId: "lec-bch-03", lecturerName: "Dr. Shizune Kato", slotType: "lecture", colorClass: "bg-green-100 border-green-300 text-green-800" },
  { id: "TT-101", day: "Monday", startTime: "10:00", endTime: "12:00", courseCode: "BCH 213", courseTitle: "Carbohydrate Biochemistry", dept: "BCH", level: 200, semester: 1, venue: "SCI LH 5", venueCapacity: 150, lecturerId: "lec-bch-05", lecturerName: "Dr. Ino Yamanaka-BCH", slotType: "lecture", colorClass: "bg-green-100 border-green-300 text-green-800" },
  { id: "TT-102", day: "Tuesday", startTime: "14:00", endTime: "16:00", courseCode: "BCH 215", courseTitle: "Enzyme Kinetics", dept: "BCH", level: 200, semester: 1, venue: "SCI LH 6", venueCapacity: 150, lecturerId: "lec-bch-05", lecturerName: "Dr. Ino Yamanaka-BCH", slotType: "lecture", colorClass: "bg-green-100 border-green-300 text-green-800" },
  { id: "TT-103", day: "Tuesday", startTime: "16:00", endTime: "18:00", courseCode: "STA 211", courseTitle: "Biostatistics I", dept: "BCH", level: 200, semester: 1, venue: "SCI LH 6", venueCapacity: 150, lecturerId: "lec-sta-02", lecturerName: "Dr. Sta Lecturer 2", slotType: "lecture", colorClass: "bg-green-100 border-green-300 text-green-800" },

  // — BCH 300L Tuesday (Emeka's spillover issue here) —
  { id: "TT-104", day: "Tuesday", startTime: "08:00", endTime: "10:00", courseCode: "BCH 311", courseTitle: "Molecular Biology I", dept: "BCH", level: 300, semester: 1, venue: "SCI LH 9", venueCapacity: 100, lecturerId: "lec-004", lecturerName: "Dr. Sakura Haruno", slotType: "lecture", colorClass: "bg-amber-100 border-amber-300 text-amber-800", conflictFlag: true, conflictReason: "BCH 211 carryover also scheduled Tue 08:00–10:00 (LH-5) — cross-level clash for repeat students" },
  { id: "TT-105", day: "Tuesday", startTime: "10:00", endTime: "12:00", courseCode: "BCH 313", courseTitle: "Metabolism I", dept: "BCH", level: 300, semester: 1, venue: "SCI LH 9", venueCapacity: 100, lecturerId: "lec-004", lecturerName: "Dr. Sakura Haruno", slotType: "lecture", colorClass: "bg-amber-100 border-amber-300 text-amber-800" },
  { id: "TT-106", day: "Tuesday", startTime: "16:00", endTime: "18:00", courseCode: "BCH 317", courseTitle: "Immunochemistry", dept: "BCH", level: 300, semester: 1, venue: "SCI LH 10", venueCapacity: 100, lecturerId: "lec-bch-06", lecturerName: "Dr. Kurenai Yuhi-BCH", slotType: "lecture", colorClass: "bg-amber-100 border-amber-300 text-amber-800" },

  // — PHY 200L Tuesday —
  { id: "TT-110", day: "Monday", startTime: "08:00", endTime: "10:00", courseCode: "PHY 211", courseTitle: "Classical Mechanics", dept: "PHY", level: 200, semester: 1, venue: "SCI LH 7", venueCapacity: 120, lecturerId: "lec-phy-03", lecturerName: "Dr. Obito Uchiha", slotType: "lecture", colorClass: "bg-green-100 border-green-300 text-green-800" },
  { id: "TT-111", day: "Friday", startTime: "08:00", endTime: "10:00", courseCode: "PHY 213", courseTitle: "Electromagnetism I", dept: "PHY", level: 200, semester: 1, venue: "SCI LH 7", venueCapacity: 120, lecturerId: "lec-phy-03", lecturerName: "Dr. Obito Uchiha", slotType: "lecture", colorClass: "bg-green-100 border-green-300 text-green-800" },
  { id: "TT-112", day: "Tuesday", startTime: "16:00", endTime: "18:00", courseCode: "PHY 217", courseTitle: "Electronics I", dept: "PHY", level: 200, semester: 1, venue: "SCI LH 8", venueCapacity: 120, lecturerId: "lec-phy-09", lecturerName: "Mr. Darui Kumogakure", slotType: "lecture", colorClass: "bg-green-100 border-green-300 text-green-800" },

  // — MTH 200L Tuesday —
  { id: "TT-120", day: "Monday", startTime: "14:00", endTime: "16:00", courseCode: "MTH 211", courseTitle: "Mathematical Analysis I", dept: "MTH", level: 200, semester: 1, venue: "SCI LH 6", venueCapacity: 150, lecturerId: "lec-mth-02", lecturerName: "Dr. Hinata Hyuga-MTH", slotType: "lecture", colorClass: "bg-green-100 border-green-300 text-green-800" },
  { id: "TT-121", day: "Friday", startTime: "10:00", endTime: "12:00", courseCode: "MTH 213", courseTitle: "Linear Algebra I", dept: "MTH", level: 200, semester: 1, venue: "SCI LH 6", venueCapacity: 150, lecturerId: "lec-mth-06", lecturerName: "Dr. Gaara Sabaku", slotType: "lecture", colorClass: "bg-green-100 border-green-300 text-green-800" },
  { id: "TT-122", day: "Tuesday", startTime: "16:00", endTime: "18:00", courseCode: "MTH 215", courseTitle: "Abstract Algebra I", dept: "MTH", level: 200, semester: 1, venue: "SCI LH 5", venueCapacity: 150, lecturerId: "lec-mth-07", lecturerName: "Dr. Kankuro Sabaku", slotType: "lecture", colorClass: "bg-green-100 border-green-300 text-green-800" },

  // — CSC 200L Tuesday —
  { id: "TT-130", day: "Friday", startTime: "08:00", endTime: "10:00", courseCode: "CSC 211", courseTitle: "Data Structures and Algorithms", dept: "CSC", level: 200, semester: 1, venue: "LAB-CSC-01", venueCapacity: 50, lecturerId: "lec-csc-03", lecturerName: "Dr. Naruto Uzumaki", slotType: "lecture", colorClass: "bg-green-100 border-green-300 text-green-800" },
  { id: "TT-131", day: "Friday", startTime: "14:00", endTime: "16:00", courseCode: "CSC 213", courseTitle: "Object-Oriented Programming", dept: "CSC", level: 200, semester: 1, venue: "LAB-CSC-01", venueCapacity: 50, lecturerId: "lec-csc-03", lecturerName: "Dr. Naruto Uzumaki", slotType: "practical", colorClass: "bg-green-100 border-green-300 text-green-800" },
  { id: "TT-132", day: "Tuesday", startTime: "16:00", endTime: "18:00", courseCode: "CSC 215", courseTitle: "Computer Organization", dept: "CSC", level: 200, semester: 1, venue: "SCI LH 7", venueCapacity: 120, lecturerId: "lec-csc-06", lecturerName: "Dr. Udon Sarutobi", slotType: "lecture", colorClass: "bg-green-100 border-green-300 text-green-800" },

  // — CSC 300L Tuesday (CSC 316 clash for spillover student Zainab) —
  { id: "TT-133", day: "Tuesday", startTime: "12:00", endTime: "13:00", courseCode: "BREAK", courseTitle: "Lunch Break", dept: "CSC", level: 300, semester: 1, venue: "-", venueCapacity: 0, lecturerId: "-", lecturerName: "-", slotType: "break", colorClass: "bg-gray-100 border-gray-200 text-gray-500" },
  { id: "TT-134", day: "Tuesday", startTime: "12:00", endTime: "14:00", courseCode: "CSC 316", courseTitle: "Computer Networks II (300L — also attended by spillover 400L)", dept: "CSC", level: 300, semester: 1, venue: "SCI LH 9", venueCapacity: 100, lecturerId: "lec-csc-15", lecturerName: "Dr. Rock Lee Jr", slotType: "lecture", colorClass: "bg-amber-100 border-amber-300 text-amber-800", conflictFlag: true, conflictReason: "CSC 413 (400L) also scheduled Tue 12:00–14:00 — clash for final-year spillover student Zainab" },
  { id: "TT-135", day: "Tuesday", startTime: "12:00", endTime: "14:00", courseCode: "CSC 413", courseTitle: "Distributed Systems (400L)", dept: "CSC", level: 400, semester: 1, venue: "SCI LH 10", venueCapacity: 100, lecturerId: "lec-csc-10", lecturerName: "Dr. Kawaki Uzumaki", slotType: "lecture", colorClass: "bg-red-100 border-red-300 text-red-800", conflictFlag: true, conflictReason: "Clashes with CSC 316 (300L) for spillover student Zainab Sokoto" },

  // ════════════════════════════════════════
  // WEDNESDAY
  // ════════════════════════════════════════

  // — CHM 200L Wed (second run of courses) —
  { id: "TT-200", day: "Wednesday", startTime: "08:00", endTime: "10:00", courseCode: "CHM 213", courseTitle: "Inorganic Chemistry I", dept: "CHM", level: 200, semester: 1, venue: "SCI LH 5", venueCapacity: 150, lecturerId: "lec-chm-03", lecturerName: "Dr. Asuma Sarutobi", slotType: "lecture", colorClass: "bg-green-100 border-green-300 text-green-800" },
  { id: "TT-201", day: "Wednesday", startTime: "10:00", endTime: "12:00", courseCode: "CHM 217", courseTitle: "Analytical Chemistry I", dept: "CHM", level: 200, semester: 1, venue: "SCI LH 6", venueCapacity: 150, lecturerId: "lec-chm-07", lecturerName: "Dr. Konan Amegakure", slotType: "lecture", colorClass: "bg-green-100 border-green-300 text-green-800" },
  { id: "TT-202", day: "Wednesday", startTime: "14:00", endTime: "16:00", courseCode: "BCH 201", courseTitle: "Introduction to Biochemistry", dept: "CHM", level: 200, semester: 1, venue: "SCI LH 5", venueCapacity: 150, lecturerId: "lec-bch-04", lecturerName: "Mr. Kabuto Yakushi", slotType: "lecture", colorClass: "bg-green-100 border-green-300 text-green-800" },

  // — PHY 400L Wednesday —
  { id: "TT-210", day: "Wednesday", startTime: "08:00", endTime: "10:00", courseCode: "PHY 411", courseTitle: "Advanced Quantum Mechanics", dept: "PHY", level: 400, semester: 1, venue: "SCI LH 11", venueCapacity: 80, lecturerId: "lec-002", lecturerName: "Prof. Sasuke Uchiha", slotType: "lecture", colorClass: "bg-red-100 border-red-300 text-red-800" },
  { id: "TT-211", day: "Wednesday", startTime: "10:00", endTime: "12:00", courseCode: "PHY 415", courseTitle: "Plasma Physics", dept: "PHY", level: 400, semester: 1, venue: "SCI LH 11", venueCapacity: 80, lecturerId: "lec-phy-10", lecturerName: "Dr. Killer Bee", slotType: "lecture", colorClass: "bg-red-100 border-red-300 text-red-800" },
  { id: "TT-212", day: "Wednesday", startTime: "14:00", endTime: "16:00", courseCode: "PHY 491", courseTitle: "Project I (PHY)", dept: "PHY", level: 400, semester: 1, venue: "SCI LH 12", venueCapacity: 80, lecturerId: "lec-002", lecturerName: "Prof. Sasuke Uchiha", slotType: "project", colorClass: "bg-red-100 border-red-300 text-red-800" },

  // — MTH 300L Wednesday —
  { id: "TT-220", day: "Wednesday", startTime: "08:00", endTime: "10:00", courseCode: "MTH 311", courseTitle: "Functional Analysis", dept: "MTH", level: 300, semester: 1, venue: "SCI LH 5", venueCapacity: 150, lecturerId: "lec-mth-03", lecturerName: "Dr. Ino Yamanaka", slotType: "lecture", colorClass: "bg-amber-100 border-amber-300 text-amber-800" },
  { id: "TT-221", day: "Wednesday", startTime: "10:00", endTime: "12:00", courseCode: "MTH 315", courseTitle: "Numerical Analysis I", dept: "MTH", level: 300, semester: 1, venue: "SCI LH 5", venueCapacity: 150, lecturerId: "lec-mth-10", lecturerName: "Dr. Chiyo Sunagakure", slotType: "lecture", colorClass: "bg-amber-100 border-amber-300 text-amber-800" },
  { id: "TT-222", day: "Wednesday", startTime: "14:00", endTime: "16:00", courseCode: "MTH 317", courseTitle: "Mathematical Methods I", dept: "MTH", level: 300, semester: 1, venue: "SCI LH 6", venueCapacity: 150, lecturerId: "lec-mth-03", lecturerName: "Dr. Ino Yamanaka", slotType: "lecture", colorClass: "bg-amber-100 border-amber-300 text-amber-800" },

  // — STA 200L Wednesday —
  { id: "TT-230", day: "Wednesday", startTime: "08:00", endTime: "10:00", courseCode: "STA 211", courseTitle: "Probability Theory I", dept: "STA", level: 200, semester: 1, venue: "SCI LH 9", venueCapacity: 100, lecturerId: "lec-sta-01", lecturerName: "Prof. STA Staff", slotType: "lecture", colorClass: "bg-green-100 border-green-300 text-green-800" },
  { id: "TT-231", day: "Wednesday", startTime: "10:00", endTime: "12:00", courseCode: "STA 213", courseTitle: "Statistical Inference I", dept: "STA", level: 200, semester: 1, venue: "SCI LH 9", venueCapacity: 100, lecturerId: "lec-sta-02", lecturerName: "STA Staff 2", slotType: "lecture", colorClass: "bg-green-100 border-green-300 text-green-800" },
  { id: "TT-232", day: "Wednesday", startTime: "14:00", endTime: "16:00", courseCode: "STA 215", courseTitle: "Regression Analysis I", dept: "STA", level: 200, semester: 1, venue: "SCI LH 10", venueCapacity: 100, lecturerId: "lec-sta-03", lecturerName: "STA Staff 3", slotType: "lecture", colorClass: "bg-green-100 border-green-300 text-green-800" },

  // ════════════════════════════════════════
  // THURSDAY
  // ════════════════════════════════════════

  // — BCH 400L Thursday —
  { id: "TT-300", day: "Thursday", startTime: "08:00", endTime: "10:00", courseCode: "BCH 411", courseTitle: "Advanced Molecular Biology", dept: "BCH", level: 400, semester: 1, venue: "LAB-BCH-01", venueCapacity: 30, lecturerId: "lec-bch-02", lecturerName: "Prof. Tsunade Senju", slotType: "lecture", colorClass: "bg-red-100 border-red-300 text-red-800" },
  { id: "TT-301", day: "Thursday", startTime: "10:00", endTime: "12:00", courseCode: "BCH 413", courseTitle: "Advanced Enzymology", dept: "BCH", level: 400, semester: 1, venue: "LAB-BCH-01", venueCapacity: 30, lecturerId: "lec-004", lecturerName: "Dr. Sakura Haruno", slotType: "lecture", colorClass: "bg-red-100 border-red-300 text-red-800" },
  { id: "TT-302", day: "Thursday", startTime: "14:00", endTime: "16:00", courseCode: "BCH 491", courseTitle: "Project I (BCH)", dept: "BCH", level: 400, semester: 1, venue: "LAB-BCH-01", venueCapacity: 30, lecturerId: "lec-004", lecturerName: "Dr. Sakura Haruno", slotType: "project", colorClass: "bg-red-100 border-red-300 text-red-800" },
  { id: "TT-303", day: "Thursday", startTime: "16:00", endTime: "18:00", courseCode: "BCH 415", courseTitle: "Genetic Engineering", dept: "BCH", level: 400, semester: 1, venue: "LAB-BCH-01", venueCapacity: 30, lecturerId: "lec-bch-09", lecturerName: "Dr. Deidara Iwagakure", slotType: "lecture", colorClass: "bg-red-100 border-red-300 text-red-800" },

  // — CSC 400L Thursday —
  { id: "TT-310", day: "Thursday", startTime: "08:00", endTime: "10:00", courseCode: "CSC 415", courseTitle: "Cloud Computing", dept: "CSC", level: 400, semester: 1, venue: "LAB-CSC-03", venueCapacity: 40, lecturerId: "lec-003", lecturerName: "Prof. Shikamaru Nara", slotType: "lecture", colorClass: "bg-red-100 border-red-300 text-red-800" },
  { id: "TT-311", day: "Thursday", startTime: "10:00", endTime: "12:00", courseCode: "CSC 491", courseTitle: "Project I (CSC)", dept: "CSC", level: 400, semester: 1, venue: "LAB-CSC-03", venueCapacity: 40, lecturerId: "lec-003", lecturerName: "Prof. Shikamaru Nara", slotType: "project", colorClass: "bg-red-100 border-red-300 text-red-800" },
  { id: "TT-312", day: "Thursday", startTime: "14:00", endTime: "16:00", courseCode: "CSC 423", courseTitle: "Research Methods in Computing", dept: "CSC", level: 400, semester: 1, venue: "SCI LH 10", venueCapacity: 100, lecturerId: "lec-csc-14", lecturerName: "Prof. Shino Aburame-CS", slotType: "lecture", colorClass: "bg-red-100 border-red-300 text-red-800" },

  // — PHY 200L Thursday (second run) —
  { id: "TT-320", day: "Thursday", startTime: "08:00", endTime: "10:00", courseCode: "PHY 215", courseTitle: "Mathematical Methods for Physics I", dept: "PHY", level: 200, semester: 1, venue: "SCI LH 7", venueCapacity: 120, lecturerId: "lec-phy-03", lecturerName: "Dr. Obito Uchiha", slotType: "lecture", colorClass: "bg-green-100 border-green-300 text-green-800" },
  { id: "TT-321", day: "Thursday", startTime: "10:00", endTime: "12:00", courseCode: "PHY 219", courseTitle: "Physics Practical III", dept: "PHY", level: 200, semester: 1, venue: "LAB-PHY-01", venueCapacity: 40, lecturerId: "lec-phy-11", lecturerName: "Ms. Karui Kumogakure", slotType: "practical", colorClass: "bg-green-100 border-green-300 text-green-800" },
  { id: "TT-322", day: "Thursday", startTime: "14:00", endTime: "16:00", courseCode: "CSC 201", courseTitle: "Intro to Computer Science (PHY elective)", dept: "PHY", level: 200, semester: 1, venue: "SCI LH 8", venueCapacity: 120, lecturerId: "lec-csc-05", lecturerName: "Mrs. Moegi Kazamatsuri", slotType: "lecture", colorClass: "bg-green-100 border-green-300 text-green-800" },

  // — MTH 400L Thursday —
  { id: "TT-330", day: "Thursday", startTime: "08:00", endTime: "10:00", courseCode: "MTH 411", courseTitle: "Advanced Real Analysis", dept: "MTH", level: 400, semester: 1, venue: "SCI LH 11", venueCapacity: 80, lecturerId: "lec-mth-01", lecturerName: "Prof. Neji Hyuga", slotType: "lecture", colorClass: "bg-red-100 border-red-300 text-red-800" },
  { id: "TT-331", day: "Thursday", startTime: "10:00", endTime: "12:00", courseCode: "MTH 413", courseTitle: "Algebraic Topology", dept: "MTH", level: 400, semester: 1, venue: "SCI LH 11", venueCapacity: 80, lecturerId: "lec-mth-14", lecturerName: "Prof. Yugito Nii", slotType: "lecture", colorClass: "bg-red-100 border-red-300 text-red-800" },
  { id: "TT-332", day: "Thursday", startTime: "14:00", endTime: "16:00", courseCode: "MTH 491", courseTitle: "Project I (MTH)", dept: "MTH", level: 400, semester: 1, venue: "SCI LH 12", venueCapacity: 80, lecturerId: "lec-mth-03", lecturerName: "Dr. Ino Yamanaka", slotType: "project", colorClass: "bg-red-100 border-red-300 text-red-800" },

  // ════════════════════════════════════════
  // FRIDAY
  // ════════════════════════════════════════

  // — All depts 100L Friday morning —
  { id: "TT-400", day: "Friday", startTime: "08:00", endTime: "10:00", courseCode: "GST 112", courseTitle: "Logic, Philosophy & Human Existence", dept: "ALL", level: 100, semester: 1, venue: "SCI Theatre 1", venueCapacity: 500, lecturerId: "lec-chm-16", lecturerName: "Mr. Shino Aburame", slotType: "lecture", colorClass: "bg-blue-100 border-blue-300 text-blue-800" },
  { id: "TT-401", day: "Friday", startTime: "10:00", endTime: "12:00", courseCode: "GST 113", courseTitle: "Nigerian Peoples and Culture", dept: "ALL", level: 100, semester: 1, venue: "SCI Theatre 1", venueCapacity: 500, lecturerId: "lec-chm-13", lecturerName: "Mr. Choji Akimichi", slotType: "lecture", colorClass: "bg-blue-100 border-blue-300 text-blue-800" },

  // — JUMUAH BREAK (optional) —
  { id: "TT-410", day: "Friday", startTime: "13:00", endTime: "14:00", courseCode: "JUMUAH", courseTitle: "Jumuah (Friday Prayer) — Optional Break", dept: "ALL", level: 100, semester: 1, venue: "Campus Mosque / Off-campus", venueCapacity: 0, lecturerId: "-", lecturerName: "-", slotType: "jumuah", colorClass: "bg-emerald-100 border-emerald-300 text-emerald-800" },

  // — CHM 300L Friday afternoon —
  { id: "TT-420", day: "Friday", startTime: "14:00", endTime: "16:00", courseCode: "CHM 317", courseTitle: "Instrumental Methods of Analysis", dept: "CHM", level: 300, semester: 1, venue: "LAB-CHM-05", venueCapacity: 35, lecturerId: "lec-chm-07", lecturerName: "Dr. Konan Amegakure", slotType: "lecture", colorClass: "bg-amber-100 border-amber-300 text-amber-800" },
  { id: "TT-421", day: "Friday", startTime: "16:00", endTime: "18:00", courseCode: "CHM 319", courseTitle: "Practical Chemistry V", dept: "CHM", level: 300, semester: 1, venue: "LAB-CHM-01", venueCapacity: 40, lecturerId: "lec-chm-08", lecturerName: "Mr. Sai Yamanaka", slotType: "practical", colorClass: "bg-amber-100 border-amber-300 text-amber-800" },

  // — CSC 300L Friday —
  { id: "TT-430", day: "Friday", startTime: "14:00", endTime: "16:00", courseCode: "CSC 317", courseTitle: "Computer Graphics", dept: "CSC", level: 300, semester: 1, venue: "LAB-CSC-02", venueCapacity: 50, lecturerId: "lec-csc-06", lecturerName: "Dr. Udon Sarutobi", slotType: "lecture", colorClass: "bg-amber-100 border-amber-300 text-amber-800" },
  { id: "TT-431", day: "Friday", startTime: "16:00", endTime: "18:00", courseCode: "CSC 319", courseTitle: "Systems Lab I", dept: "CSC", level: 300, semester: 1, venue: "LAB-CSC-01", venueCapacity: 50, lecturerId: "lec-csc-11", lecturerName: "Ms. Himawari Uzumaki", slotType: "practical", colorClass: "bg-amber-100 border-amber-300 text-amber-800" },

  // — BCH 200L Friday —
  { id: "TT-440", day: "Friday", startTime: "14:00", endTime: "16:00", courseCode: "BCH 217", courseTitle: "Biochemistry Practical I", dept: "BCH", level: 200, semester: 1, venue: "LAB-BCH-01", venueCapacity: 30, lecturerId: "lec-bch-11", lecturerName: "Ms. Konan Amegakure-BCH", slotType: "practical", colorClass: "bg-green-100 border-green-300 text-green-800" },
  { id: "TT-441", day: "Friday", startTime: "16:00", endTime: "18:00", courseCode: "BCH 219", courseTitle: "Practical Chemistry III (BCH)", dept: "BCH", level: 200, semester: 1, venue: "LAB-CHM-02", venueCapacity: 40, lecturerId: "lec-bch-11", lecturerName: "Ms. Konan Amegakure-BCH", slotType: "practical", colorClass: "bg-green-100 border-green-300 text-green-800" },

  // ═══════════════════════════════════════════════════════════
  // SECOND-RUN SLOTS — FEATURED LECTURERS (lec-001 to lec-005)
  // Each course appears TWICE per week (2hrs x 2 = 4hrs/course)
  // 3 courses = 12hrs/wk | 2 courses = 8hrs/wk | 1 = 4hrs/wk
  // ═══════════════════════════════════════════════════════════

  // lec-001: Prof. Kakashi Hatake (CHM) — CHM411x2, CHM413x2, CHM491x2
  { id: "TT-F001A", day: "Tuesday", startTime: "10:00", endTime: "12:00", courseCode: "CHM 411", courseTitle: "Advanced Organic Chemistry",   dept: "CHM", level: 400, semester: 1, venue: "SCI LH 11",  venueCapacity: 80,  lecturerId: "lec-001",    lecturerName: "Prof. Kakashi Hatake",  slotType: "lecture", colorClass: "bg-red-100 border-red-300 text-red-800" },
  { id: "TT-F001B", day: "Tuesday",   startTime: "08:00", endTime: "10:00", courseCode: "CHM 413", courseTitle: "Advanced Inorganic Chemistry", dept: "CHM", level: 400, semester: 1, venue: "SCI LH 11",  venueCapacity: 80,  lecturerId: "lec-001",    lecturerName: "Prof. Kakashi Hatake",  slotType: "lecture", colorClass: "bg-red-100 border-red-300 text-red-800" },
  { id: "TT-F001C", day: "Thursday",  startTime: "14:00", endTime: "16:00", courseCode: "CHM 413", courseTitle: "Advanced Inorganic Chemistry", dept: "CHM", level: 400, semester: 1, venue: "SCI LH 11",  venueCapacity: 80,  lecturerId: "lec-001",    lecturerName: "Prof. Kakashi Hatake",  slotType: "lecture", colorClass: "bg-red-100 border-red-300 text-red-800" },
  { id: "TT-F001D", day: "Friday",    startTime: "08:00", endTime: "10:00", courseCode: "CHM 411", courseTitle: "Advanced Organic Chemistry",   dept: "CHM", level: 400, semester: 1, venue: "SCI LH 11",  venueCapacity: 80,  lecturerId: "lec-001",    lecturerName: "Prof. Kakashi Hatake",  slotType: "lecture", colorClass: "bg-red-100 border-red-300 text-red-800" },
  { id: "TT-F001E", day: "Friday", startTime: "16:00", endTime: "18:00", courseCode: "CHM 491", courseTitle: "Project I (CHM)",              dept: "CHM", level: 400, semester: 1, venue: "SCI LH 12",  venueCapacity: 80,  lecturerId: "lec-001",    lecturerName: "Prof. Kakashi Hatake",  slotType: "project", colorClass: "bg-red-100 border-red-300 text-red-800" },
  { id: "TT-F001F", day: "Friday",    startTime: "10:00", endTime: "12:00", courseCode: "CHM 491", courseTitle: "Project I (CHM)",              dept: "CHM", level: 400, semester: 1, venue: "SCI LH 12",  venueCapacity: 80,  lecturerId: "lec-001",    lecturerName: "Prof. Kakashi Hatake",  slotType: "project", colorClass: "bg-red-100 border-red-300 text-red-800" },

  // lec-002: Prof. Sasuke Uchiha (PHY) — PHY411x2, PHY413x2, PHY491x2
  { id: "TT-F002A", day: "Tuesday",    startTime: "10:00", endTime: "12:00", courseCode: "PHY 413", courseTitle: "Nuclear Physics",              dept: "PHY", level: 400, semester: 1, venue: "SCI LH 11",  venueCapacity: 80,  lecturerId: "lec-002",    lecturerName: "Prof. Sasuke Uchiha",   slotType: "lecture", colorClass: "bg-red-100 border-red-300 text-red-800" },
  { id: "TT-F002B", day: "Tuesday",   startTime: "14:00", endTime: "16:00", courseCode: "PHY 411", courseTitle: "Advanced Quantum Mechanics",   dept: "PHY", level: 400, semester: 1, venue: "SCI LH 11",  venueCapacity: 80,  lecturerId: "lec-002",    lecturerName: "Prof. Sasuke Uchiha",   slotType: "lecture", colorClass: "bg-red-100 border-red-300 text-red-800" },
  { id: "TT-F002C", day: "Thursday",  startTime: "14:00", endTime: "16:00", courseCode: "PHY 413", courseTitle: "Nuclear Physics",              dept: "PHY", level: 400, semester: 1, venue: "SCI LH 11",  venueCapacity: 80,  lecturerId: "lec-002",    lecturerName: "Prof. Sasuke Uchiha",   slotType: "lecture", colorClass: "bg-red-100 border-red-300 text-red-800" },
  { id: "TT-F002D", day: "Friday",    startTime: "14:00", endTime: "16:00", courseCode: "PHY 491", courseTitle: "Project I (PHY)",              dept: "PHY", level: 400, semester: 1, venue: "SCI LH 12",  venueCapacity: 80,  lecturerId: "lec-002",    lecturerName: "Prof. Sasuke Uchiha",   slotType: "project", colorClass: "bg-red-100 border-red-300 text-red-800" },

  // lec-003: Prof. Shikamaru Nara (CSC) — CSC411x2, CSC415x2, CSC491x2
  { id: "TT-F003A", day: "Tuesday",   startTime: "16:00", endTime: "18:00", courseCode: "CSC 411", courseTitle: "Advanced Algorithms",          dept: "CSC", level: 400, semester: 1, venue: "SCI LH 9",   venueCapacity: 100, lecturerId: "lec-003",    lecturerName: "Prof. Shikamaru Nara",  slotType: "lecture", colorClass: "bg-red-100 border-red-300 text-red-800" },
  { id: "TT-F003B", day: "Wednesday", startTime: "16:00", endTime: "18:00", courseCode: "CSC 415", courseTitle: "Cloud Computing",              dept: "CSC", level: 400, semester: 1, venue: "LAB-CSC-03", venueCapacity: 40,  lecturerId: "lec-003",    lecturerName: "Prof. Shikamaru Nara",  slotType: "lecture", colorClass: "bg-red-100 border-red-300 text-red-800" },
  { id: "TT-F003C", day: "Friday",    startTime: "16:00", endTime: "18:00", courseCode: "CSC 491", courseTitle: "Project I (CSC)",              dept: "CSC", level: 400, semester: 1, venue: "LAB-CSC-03", venueCapacity: 40,  lecturerId: "lec-003",    lecturerName: "Prof. Shikamaru Nara",  slotType: "project", colorClass: "bg-red-100 border-red-300 text-red-800" },

  // lec-004: Dr. Sakura Haruno (BCH) — BCH311x2, BCH313x2, BCH491x2
  { id: "TT-F004A", day: "Monday",    startTime: "16:00", endTime: "18:00", courseCode: "BCH 311", courseTitle: "Molecular Biology I",          dept: "BCH", level: 300, semester: 1, venue: "SCI LH 9",   venueCapacity: 100, lecturerId: "lec-004",    lecturerName: "Dr. Sakura Haruno",     slotType: "lecture", colorClass: "bg-amber-100 border-amber-300 text-amber-800" },
  { id: "TT-F004B", day: "Wednesday", startTime: "14:00", endTime: "16:00", courseCode: "BCH 313", courseTitle: "Metabolism I",                 dept: "BCH", level: 300, semester: 1, venue: "SCI LH 9",   venueCapacity: 100, lecturerId: "lec-004",    lecturerName: "Dr. Sakura Haruno",     slotType: "lecture", colorClass: "bg-amber-100 border-amber-300 text-amber-800" },
  { id: "TT-F004C", day: "Friday",    startTime: "14:00", endTime: "16:00", courseCode: "BCH 491", courseTitle: "Project I (BCH)",              dept: "BCH", level: 400, semester: 1, venue: "LAB-BCH-01", venueCapacity: 30,  lecturerId: "lec-004",    lecturerName: "Dr. Sakura Haruno",     slotType: "project", colorClass: "bg-red-100 border-red-300 text-red-800" },

  // lec-csc-02: Dr. Temari Nara (CSC) — CSC313x2 (2 courses = 8hrs/wk)
  { id: "TT-F005A", day: "Monday",    startTime: "14:00", endTime: "16:00", courseCode: "CSC 313", courseTitle: "Software Engineering I",       dept: "CSC", level: 300, semester: 1, venue: "LAB-CSC-02", venueCapacity: 50,  lecturerId: "lec-csc-02", lecturerName: "Dr. Temari Nara",       slotType: "lecture", colorClass: "bg-amber-100 border-amber-300 text-amber-800" },
  { id: "TT-F005B", day: "Monday", startTime: "10:00", endTime: "12:00", courseCode: "CSC 313", courseTitle: "Software Engineering I",       dept: "CSC", level: 300, semester: 1, venue: "LAB-CSC-02", venueCapacity: 50,  lecturerId: "lec-csc-02", lecturerName: "Dr. Temari Nara",       slotType: "lecture", colorClass: "bg-amber-100 border-amber-300 text-amber-800" },
];

// ── Timetable filter helpers ─────────────────────────────────
export function filterByDept(dept: string): TimetableSlot[] {
  return TIMETABLE.filter(s => s.dept === dept || s.dept === "ALL");
}

export function filterByLevel(level: Level): TimetableSlot[] {
  return TIMETABLE.filter(s => s.level === level);
}

export function filterByDay(day: Day): TimetableSlot[] {
  return TIMETABLE.filter(s => s.day === day);
}

export function filterByDeptAndLevel(dept: string, level: Level): TimetableSlot[] {
  return TIMETABLE.filter(s => (s.dept === dept || s.dept === "ALL") && s.level === level);
}

export function getConflictSlots(): TimetableSlot[] {
  const seen: Record<string, TimetableSlot> = {};
  const conflicts: TimetableSlot[] = [];
  TIMETABLE.forEach(slot => {
    if (slot.slotType === "break" || slot.slotType === "jumuah") return;
    const key = `${slot.day}-${slot.startTime}-${slot.venue}`;
    if (seen[key]) { conflicts.push(seen[key], slot); } else { seen[key] = slot; }
  });
  return conflicts;
}

export function getLecturerSchedule(lecturerId: string): TimetableSlot[] {
  return TIMETABLE.filter(s => s.lecturerId === lecturerId);
}

export const DAYS: Day[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
export const TIME_LABELS = ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00"];
