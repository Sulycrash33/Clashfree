// ============================================================
// FEDKO DEMO DATA — STUDENTS
// 5 featured profiles with escalating conflict scenarios
// + background population per dept/level
// ============================================================

export type ConflictType =
  | "none"
  | "timetable_clash"
  | "credit_overload"
  | "credit_underload"
  | "course_prerequisite_missing"
  | "carryover_spillover"
  | "venue_capacity_exceeded"
  | "lecturer_double_booked"
  | "multiple";

export interface RegisteredCourse {
  code: string;
  title: string;
  creditUnit: number;
  semester: 1 | 2;
  dept: string;
  type: "core" | "elective" | "general" | "practical";
  clashWith?: string;   // course code it clashes with
  isCarryover?: boolean;
}

export interface StudentConflict {
  type: ConflictType;
  severity: "info" | "warning" | "critical";
  title: string;
  description: string;
  affectedCourses: string[];  // course codes
  resolution?: string;
  detectedBy: "ClashFree";
}

export interface Student {
  id: string;
  matric: string;
  name: string;
  level: 100 | 200 | 300 | 400;
  dept: string;
  deptName: string;
  semester: 1 | 2;
  email: string;
  phone: string;
  registeredCourses: RegisteredCourse[];
  totalCreditUnits: number;
  cgpa: number;
  isFeatured?: boolean;
  conflicts: StudentConflict[];
  profileNote?: string;
  imageInitials: string;
  colorClass: string;
}

// ============================================================
// STUDENT 1 — CLEAN PROFILE (no issues)
// CSC 300L, no conflicts
// ============================================================
export const STUDENT_ADAEZE: Student = {
  id: "stu-001",
  matric: "FEDKO/SCI/CSC/2022/0043",
  name: "Adaeze Okonkwo",
  level: 300,
  dept: "CSC",
  deptName: "Department of Computer Science",
  semester: 1,
  email: "a.okonkwo@fedko.edu.ng",
  phone: "+234 806 000 0001",
  cgpa: 4.72,
  isFeatured: true,
  profileNote: "Best Student, 300 Level CSC. Zero detected conflicts. Model registration used in demo onboarding.",
  imageInitials: "AO",
  colorClass: "bg-emerald-600",
  registeredCourses: [
    { code: "CSC 311", title: "Algorithm Analysis and Design", creditUnit: 3, semester: 1, dept: "CSC", type: "core" },
    { code: "CSC 313", title: "Software Engineering I", creditUnit: 3, semester: 1, dept: "CSC", type: "core" },
    { code: "CSC 315", title: "Artificial Intelligence", creditUnit: 3, semester: 1, dept: "CSC", type: "core" },
    { code: "CSC 317", title: "Computer Graphics", creditUnit: 3, semester: 1, dept: "CSC", type: "core" },
    { code: "CSC 319", title: "Systems Lab I", creditUnit: 2, semester: 1, dept: "CSC", type: "practical" },
    { code: "CSC 321", title: "Compiler Construction", creditUnit: 2, semester: 1, dept: "CSC", type: "elective" },
    { code: "CSC 323", title: "Human-Computer Interaction", creditUnit: 2, semester: 1, dept: "CSC", type: "elective" },
    { code: "GST 311", title: "Entrepreneurship II", creditUnit: 2, semester: 1, dept: "GST", type: "general" },
  ],
  totalCreditUnits: 20,
  conflicts: [],
};

// ============================================================
// STUDENT 2 — TIMETABLE CLASH (2 core courses overlap)
// CHM 200L, Mon 10am–12pm clash
// ============================================================
export const STUDENT_IBRAHIM: Student = {
  id: "stu-002",
  matric: "FEDKO/SCI/CHM/2023/0071",
  name: "Ibrahim Musa Aliyu",
  level: 200,
  dept: "CHM",
  deptName: "Department of Chemistry",
  semester: 1,
  email: "i.aliyu@fedko.edu.ng",
  phone: "+234 806 000 0002",
  cgpa: 3.41,
  isFeatured: true,
  profileNote: "Registered CHM 211 and CHM 213 which both occupy Monday 10:00–12:00. ClashFree flags direct lecture time overlap.",
  imageInitials: "IA",
  colorClass: "bg-orange-600",
  registeredCourses: [
    { code: "CHM 211", title: "Organic Chemistry I", creditUnit: 3, semester: 1, dept: "CHM", type: "core", clashWith: "CHM 213" },
    { code: "CHM 213", title: "Inorganic Chemistry I", creditUnit: 3, semester: 1, dept: "CHM", type: "core", clashWith: "CHM 211" },
    { code: "CHM 215", title: "Physical Chemistry I", creditUnit: 3, semester: 1, dept: "CHM", type: "core" },
    { code: "CHM 217", title: "Analytical Chemistry I", creditUnit: 2, semester: 1, dept: "CHM", type: "core" },
    { code: "CHM 219", title: "Practical Chemistry III", creditUnit: 2, semester: 1, dept: "CHM", type: "practical" },
    { code: "MTH 211", title: "Mathematical Methods I", creditUnit: 3, semester: 1, dept: "CHM", type: "core" },
    { code: "BCH 201", title: "Introduction to Biochemistry", creditUnit: 2, semester: 1, dept: "BCH", type: "elective" },
    { code: "GST 211", title: "Entrepreneurship I", creditUnit: 2, semester: 1, dept: "GST", type: "general" },
  ],
  totalCreditUnits: 20,
  conflicts: [
    {
      type: "timetable_clash",
      severity: "critical",
      title: "Direct Timetable Clash Detected",
      description: "CHM 211 (Organic Chemistry I) and CHM 213 (Inorganic Chemistry I) are both scheduled for Monday 10:00–12:00 in SCI LH 5 and SCI LH 7 respectively. Student cannot attend both simultaneously.",
      affectedCourses: ["CHM 211", "CHM 213"],
      resolution: "Timetable Officer should reschedule CHM 213 to Wednesday 10:00–12:00 (slot currently available). ClashFree has identified 3 alternative slots.",
      detectedBy: "ClashFree",
    },
  ],
};

// ============================================================
// STUDENT 3 — CREDIT UNIT OVERLOAD (>24 CU in a semester)
// PHY 300L, registered 26 CU
// ============================================================
export const STUDENT_FATIMA: Student = {
  id: "stu-003",
  matric: "FEDKO/SCI/PHY/2022/0018",
  name: "Fatima Abdullahi Maiduguri",
  level: 300,
  dept: "PHY",
  deptName: "Department of Physics",
  semester: 1,
  email: "f.maiduguri@fedko.edu.ng",
  phone: "+234 806 000 0003",
  cgpa: 3.85,
  isFeatured: true,
  profileNote: "Attempted to register 9 courses totalling 26 CU. NUC CCMAS cap is 24 CU/semester. ClashFree blocks submission and highlights the 2 excess CU.",
  imageInitials: "FA",
  colorClass: "bg-violet-600",
  registeredCourses: [
    { code: "PHY 311", title: "Quantum Mechanics I", creditUnit: 3, semester: 1, dept: "PHY", type: "core" },
    { code: "PHY 313", title: "Solid State Physics I", creditUnit: 3, semester: 1, dept: "PHY", type: "core" },
    { code: "PHY 315", title: "Optics and Photonics", creditUnit: 3, semester: 1, dept: "PHY", type: "core" },
    { code: "PHY 317", title: "Classical Waves", creditUnit: 3, semester: 1, dept: "PHY", type: "core" },
    { code: "PHY 319", title: "Physics Practical V", creditUnit: 2, semester: 1, dept: "PHY", type: "practical" },
    { code: "PHY 321", title: "Introduction to Geophysics", creditUnit: 2, semester: 1, dept: "PHY", type: "elective" },
    { code: "PHY 323", title: "Fluid Mechanics", creditUnit: 2, semester: 1, dept: "PHY", type: "elective" },
    { code: "GST 311", title: "Entrepreneurship II", creditUnit: 2, semester: 1, dept: "GST", type: "general" },
    { code: "MTH 317", title: "Mathematical Methods I", creditUnit: 3, semester: 1, dept: "MTH", type: "elective" }, // extra — pushes to 23... + GST = 25
    // NOTE: extra PHY 325 below pushes to 26
    { code: "PHY 325", title: "Introduction to Plasma Physics (Extra)", creditUnit: 3, semester: 1, dept: "PHY", type: "elective" },
  ],
  totalCreditUnits: 26,  // over 24 CU cap
  conflicts: [
    {
      type: "credit_overload",
      severity: "critical",
      title: "Credit Unit Overload: 26 CU (Max 24)",
      description: "Student has attempted to register 26 credit units this semester. FEDKO Academic Regulations (Section 4.2) and NUC CCMAS guidelines cap normal load at 24 CU per semester. The last two courses (PHY 325 + MTH 317) collectively push the load 2 CU over the limit.",
      affectedCourses: ["PHY 325", "MTH 317"],
      resolution: "Drop either PHY 325 or MTH 317. If CGPA > 4.0, student may apply for Senate Overload Approval (max 26 CU allowed by waiver). CGPA is 3.85 — waiver not automatically granted.",
      detectedBy: "ClashFree",
    },
  ],
};

// ============================================================
// STUDENT 4 — PREREQUISITE VIOLATION + CARRYOVER
// BCH 300L — registered BCH 311 without passing BCH 211
// ============================================================
export const STUDENT_EMEKA: Student = {
  id: "stu-004",
  matric: "FEDKO/SCI/BCH/2021/0092",
  name: "Emeka Chibuike Okafor",
  level: 300,
  dept: "BCH",
  deptName: "Department of Biochemistry",
  semester: 1,
  email: "e.okafor@fedko.edu.ng",
  phone: "+234 806 000 0004",
  cgpa: 2.18,
  isFeatured: true,
  profileNote: "Student failed BCH 211 (Physical Biochemistry) in 200L. He is retaking it as carryover AND has registered BCH 311 which has BCH 211 as a prerequisite. ClashFree flags prerequisite violation.",
  imageInitials: "EO",
  colorClass: "bg-red-600",
  registeredCourses: [
    // Carryover from 200L
    { code: "BCH 211", title: "Physical Biochemistry (CARRYOVER)", creditUnit: 3, semester: 1, dept: "BCH", type: "core", isCarryover: true },
    // 300L courses — BCH 311 prereq is BCH 211 (not yet passed)
    { code: "BCH 311", title: "Molecular Biology I (prereq MISSING)", creditUnit: 3, semester: 1, dept: "BCH", type: "core", clashWith: "BCH 211" },
    { code: "BCH 313", title: "Metabolism I", creditUnit: 3, semester: 1, dept: "BCH", type: "core" },
    { code: "BCH 315", title: "Biochemistry Practical III", creditUnit: 2, semester: 1, dept: "BCH", type: "practical" },
    { code: "BCH 317", title: "Immunochemistry", creditUnit: 3, semester: 1, dept: "BCH", type: "core" },
    { code: "BCH 319", title: "Clinical Biochemistry I", creditUnit: 3, semester: 1, dept: "BCH", type: "core" },
    { code: "BCH 321", title: "Toxicology", creditUnit: 2, semester: 1, dept: "BCH", type: "elective" },
    { code: "GST 311", title: "Entrepreneurship II", creditUnit: 2, semester: 1, dept: "GST", type: "general" },
  ],
  totalCreditUnits: 21,
  conflicts: [
    {
      type: "course_prerequisite_missing",
      severity: "critical",
      title: "Prerequisite Violation: BCH 311 requires BCH 211",
      description: "BCH 311 (Molecular Biology I) has BCH 211 (Physical Biochemistry) as a mandatory prerequisite. Student has not yet passed BCH 211 — it appears on his record as a carryover (F grade, 2022/2023 session). Registration of BCH 311 is invalid under FEDKO Academic Regulations Section 6.1.",
      affectedCourses: ["BCH 311", "BCH 211"],
      resolution: "BCH 311 must be deregistered. Student should focus on clearing BCH 211 carryover this semester before attempting BCH 311 in the next session.",
      detectedBy: "ClashFree",
    },
    {
      type: "carryover_spillover",
      severity: "warning",
      title: "Carryover Course Timetable Overlap Risk",
      description: "BCH 211 (200L carryover) and BCH 313 (300L current) are scheduled for overlapping periods on Tuesday 08:00–10:00. A carryover student attending both classes at different levels creates a schedule conflict that traditional systems miss — ClashFree cross-level detection flags this automatically.",
      affectedCourses: ["BCH 211", "BCH 313"],
      resolution: "Timetable Officer should confirm separate venues and times. Student should be advised to attend BCH 211 (carryover) as priority.",
      detectedBy: "ClashFree",
    },
  ],
};

// ============================================================
// STUDENT 5 — COMPLEX: SPILLOVER + VENUE OVERCAPACITY + MULTI-CLASH
// CSC 400L student with final year complexity + systemic issues
// ============================================================
export const STUDENT_ZAINAB: Student = {
  id: "stu-005",
  matric: "FEDKO/SCI/CSC/2020/0011",
  name: "Zainab Lawal Sokoto",
  level: 400,
  dept: "CSC",
  deptName: "Department of Computer Science",
  semester: 1,
  email: "z.sokoto@fedko.edu.ng",
  phone: "+234 806 000 0005",
  cgpa: 2.61,
  isFeatured: true,
  profileNote: "Final year student with spillover from 300L (CSC 316 & CSC 318 not passed), plus 400L courses, plus venue overcapacity flag. Most complex profile in demo — showcases full power of ClashFree.",
  imageInitials: "ZL",
  colorClass: "bg-fuchsia-600",
  registeredCourses: [
    // Spillover carryovers from 300L
    { code: "CSC 316", title: "Computer Networks II (SPILLOVER)", creditUnit: 3, semester: 1, dept: "CSC", type: "core", isCarryover: true },
    { code: "CSC 318", title: "Formal Languages & Automata (SPILLOVER)", creditUnit: 3, semester: 1, dept: "CSC", type: "core", isCarryover: true },
    // 400L current
    { code: "CSC 411", title: "Advanced Algorithms", creditUnit: 3, semester: 1, dept: "CSC", type: "core" },
    { code: "CSC 413", title: "Distributed Systems", creditUnit: 3, semester: 1, dept: "CSC", type: "core" },
    { code: "CSC 415", title: "Cloud Computing", creditUnit: 3, semester: 1, dept: "CSC", type: "core" },
    { code: "CSC 419", title: "Advanced Programming Lab", creditUnit: 2, semester: 1, dept: "CSC", type: "practical" },
    { code: "CSC 423", title: "Research Methods in Computing", creditUnit: 2, semester: 1, dept: "CSC", type: "core" },
    { code: "CSC 491", title: "Project I", creditUnit: 3, semester: 1, dept: "CSC", type: "core" },
    { code: "GST 311", title: "Entrepreneurship II", creditUnit: 2, semester: 1, dept: "GST", type: "general" },
  ],
  totalCreditUnits: 24,
  conflicts: [
    {
      type: "carryover_spillover",
      severity: "critical",
      title: "Final Year Spillover: 2 Courses from 300L Outstanding",
      description: "Student is in 400L but has CSC 316 (Computer Networks II) and CSC 318 (Formal Languages & Automata) as spillover courses from 300L. Both are prerequisite core courses. Unless cleared this semester, student cannot graduate in 2024/2025 session.",
      affectedCourses: ["CSC 316", "CSC 318"],
      resolution: "Student must register and pass both spillover courses this semester. Graduation clearance will be blocked by Academic Records until F grades are converted. Adviser (Prof. Shikamaru Nara) must sign off on graduation eligibility.",
      detectedBy: "ClashFree",
    },
    {
      type: "timetable_clash",
      severity: "critical",
      title: "Level Mix Clash: 300L & 400L Courses Same Time Slot",
      description: "CSC 316 (300L, Tue 12:00–14:00) clashes with CSC 413 (400L, Tue 12:00–14:00). Since this student spans two levels due to spillover, the standard timetable designed for a single cohort creates an unavoidable clash. Traditional systems don't detect cross-level conflicts — ClashFree does.",
      affectedCourses: ["CSC 316", "CSC 413"],
      resolution: "Timetable Officer must create a dedicated spillover-student conflict resolution slot. Suggested: move CSC 316 to Thursday 14:00–16:00 (currently free). Notify affected students via ClashFree WhatsApp alert.",
      detectedBy: "ClashFree",
    },
    {
      type: "venue_capacity_exceeded",
      severity: "warning",
      title: "Venue Overcapacity: CSC 411 in SCI LH 9 (100 seats, 118 registered)",
      description: "CSC 411 (Advanced Algorithms) has 118 registered students but is assigned to SCI LH 9 which holds only 100. This exceeds capacity by 18 seats. Fire safety and examination regulation violations flagged.",
      affectedCourses: ["CSC 411"],
      resolution: "Reassign to SCI LH 3 (capacity 200) or SCI Theatre 2 (capacity 300). ClashFree has automatically suggested SCI LH 3 as optimal based on current room bookings.",
      detectedBy: "ClashFree",
    },
    {
      type: "multiple",
      severity: "warning",
      title: "Cumulative Credit Unit Risk",
      description: "With spillover courses added, student is at 24 CU — the maximum. Any late addition to registration (e.g. GST repeat) will push into overload territory. Monitor closely.",
      affectedCourses: ["CSC 316", "CSC 318", "CSC 491"],
      resolution: "No action needed now. Flag is preventive. Student should not add any elective without dropping another.",
      detectedBy: "ClashFree",
    },
  ],
};

// ── All featured students ─────────────────────────────────────
export const FEATURED_STUDENTS: Student[] = [
  STUDENT_ADAEZE,
  STUDENT_IBRAHIM,
  STUDENT_FATIMA,
  STUDENT_EMEKA,
  STUDENT_ZAINAB,
];

// ── Background population summary per dept/level ──────────────
export interface PopulationEntry {
  dept: string;
  level: 100 | 200 | 300 | 400;
  count: number;
  avgCGPA: number;
  conflictsDetected: number;
}

export const POPULATION_SUMMARY: PopulationEntry[] = [
  // BCH
  { dept: "BCH", level: 100, count: 67, avgCGPA: 3.12, conflictsDetected: 4 },
  { dept: "BCH", level: 200, count: 65, avgCGPA: 3.08, conflictsDetected: 6 },
  { dept: "BCH", level: 300, count: 63, avgCGPA: 3.21, conflictsDetected: 3 },
  { dept: "BCH", level: 400, count: 61, avgCGPA: 3.35, conflictsDetected: 2 },
  // BIO
  { dept: "BIO", level: 100, count: 67, avgCGPA: 3.05, conflictsDetected: 5 },
  { dept: "BIO", level: 200, count: 65, avgCGPA: 3.11, conflictsDetected: 4 },
  { dept: "BIO", level: 300, count: 63, avgCGPA: 3.18, conflictsDetected: 3 },
  { dept: "BIO", level: 400, count: 61, avgCGPA: 3.29, conflictsDetected: 1 },
  // BOT
  { dept: "BOT", level: 100, count: 62, avgCGPA: 3.01, conflictsDetected: 3 },
  { dept: "BOT", level: 200, count: 60, avgCGPA: 2.98, conflictsDetected: 4 },
  { dept: "BOT", level: 300, count: 58, avgCGPA: 3.09, conflictsDetected: 2 },
  { dept: "BOT", level: 400, count: 56, avgCGPA: 3.22, conflictsDetected: 1 },
  // MCB
  { dept: "MCB", level: 100, count: 67, avgCGPA: 3.15, conflictsDetected: 5 },
  { dept: "MCB", level: 200, count: 65, avgCGPA: 3.09, conflictsDetected: 7 },
  { dept: "MCB", level: 300, count: 63, avgCGPA: 3.24, conflictsDetected: 3 },
  { dept: "MCB", level: 400, count: 61, avgCGPA: 3.38, conflictsDetected: 2 },
  // ZOO
  { dept: "ZOO", level: 100, count: 62, avgCGPA: 3.00, conflictsDetected: 4 },
  { dept: "ZOO", level: 200, count: 60, avgCGPA: 2.96, conflictsDetected: 3 },
  { dept: "ZOO", level: 300, count: 58, avgCGPA: 3.07, conflictsDetected: 2 },
  { dept: "ZOO", level: 400, count: 56, avgCGPA: 3.19, conflictsDetected: 1 },
  // CHM
  { dept: "CHM", level: 100, count: 60, avgCGPA: 3.22, conflictsDetected: 6 },
  { dept: "CHM", level: 200, count: 58, avgCGPA: 3.15, conflictsDetected: 8 },
  { dept: "CHM", level: 300, count: 56, avgCGPA: 3.28, conflictsDetected: 4 },
  { dept: "CHM", level: 400, count: 54, avgCGPA: 3.41, conflictsDetected: 2 },
  // CSC
  { dept: "CSC", level: 100, count: 72, avgCGPA: 3.31, conflictsDetected: 7 },
  { dept: "CSC", level: 200, count: 70, avgCGPA: 3.25, conflictsDetected: 9 },
  { dept: "CSC", level: 300, count: 68, avgCGPA: 3.37, conflictsDetected: 5 },
  { dept: "CSC", level: 400, count: 66, avgCGPA: 3.48, conflictsDetected: 3 },
  // GEO
  { dept: "GEO", level: 100, count: 57, avgCGPA: 2.97, conflictsDetected: 3 },
  { dept: "GEO", level: 200, count: 55, avgCGPA: 2.91, conflictsDetected: 4 },
  { dept: "GEO", level: 300, count: 53, avgCGPA: 3.02, conflictsDetected: 2 },
  { dept: "GEO", level: 400, count: 51, avgCGPA: 3.15, conflictsDetected: 1 },
  // GLG
  { dept: "GLG", level: 100, count: 57, avgCGPA: 2.99, conflictsDetected: 3 },
  { dept: "GLG", level: 200, count: 55, avgCGPA: 2.93, conflictsDetected: 4 },
  { dept: "GLG", level: 300, count: 53, avgCGPA: 3.05, conflictsDetected: 2 },
  { dept: "GLG", level: 400, count: 51, avgCGPA: 3.18, conflictsDetected: 1 },
  // MTH
  { dept: "MTH", level: 100, count: 62, avgCGPA: 3.19, conflictsDetected: 5 },
  { dept: "MTH", level: 200, count: 60, avgCGPA: 3.12, conflictsDetected: 6 },
  { dept: "MTH", level: 300, count: 58, avgCGPA: 3.24, conflictsDetected: 3 },
  { dept: "MTH", level: 400, count: 56, avgCGPA: 3.38, conflictsDetected: 2 },
  // PHY
  { dept: "PHY", level: 100, count: 60, avgCGPA: 3.14, conflictsDetected: 6 },
  { dept: "PHY", level: 200, count: 58, avgCGPA: 3.08, conflictsDetected: 7 },
  { dept: "PHY", level: 300, count: 56, avgCGPA: 3.22, conflictsDetected: 4 },
  { dept: "PHY", level: 400, count: 54, avgCGPA: 3.35, conflictsDetected: 2 },
  // STA
  { dept: "STA", level: 100, count: 57, avgCGPA: 3.09, conflictsDetected: 4 },
  { dept: "STA", level: 200, count: 55, avgCGPA: 3.03, conflictsDetected: 5 },
  { dept: "STA", level: 300, count: 53, avgCGPA: 3.16, conflictsDetected: 2 },
  { dept: "STA", level: 400, count: 51, avgCGPA: 3.29, conflictsDetected: 1 },
];

export function getFacultyTotals() {
  const totalStudents = POPULATION_SUMMARY.reduce((s, e) => s + e.count, 0);
  const totalConflicts = POPULATION_SUMMARY.reduce((s, e) => s + e.conflictsDetected, 0);
  return { totalStudents, totalConflicts };
}
