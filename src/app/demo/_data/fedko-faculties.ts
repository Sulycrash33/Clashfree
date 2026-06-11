// ============================================================
// FEDKO DEMO DATA — FACULTIES & DEPARTMENTS
// Isolated from production. Safe to delete entirely.
// ============================================================

export const FEDKO_NAME = "Federal University of Konoha";
export const FEDKO_SHORT = "FEDKO";
export const FEDKO_CODE = "FEDKO-2024";
export const DEMO_MODE = true;

// ── Faculties not in focus: show dept list only ──────────────
export const OTHER_FACULTIES = [
  {
    id: "fac-admin",
    name: "Faculty of Administration",
    code: "ADMIN",
    departments: [
      "Department of Accounting",
      "Department of Business Administration",
      "Department of Local Government and Development Studies",
      "Department of Public Administration",
    ],
  },
  {
    id: "fac-agric",
    name: "Faculty of Agriculture",
    code: "AGRIC",
    departments: [
      "Department of Agricultural Economics and Rural Sociology",
      "Department of Agronomy",
      "Department of Animal Science",
      "Department of Crop Protection",
      "Department of Plant Science",
      "Department of Soil Science",
      "Department of Agricultural Extension and Rural Development",
    ],
  },
  {
    id: "fac-arts",
    name: "Faculty of Arts",
    code: "ARTS",
    departments: [
      "Department of African Languages and Cultures",
      "Department of Arabic",
      "Department of Archaeology and Heritage Studies",
      "Department of English and Literary Studies",
      "Department of French",
      "Department of History",
      "Department of Philosophy",
      "Department of Theatre and Performing Arts",
    ],
  },
  {
    id: "fac-eng",
    name: "Faculty of Engineering",
    code: "ENG",
    departments: [
      "Department of Agricultural and Bioresources Engineering",
      "Department of Automotive Engineering",
      "Department of Chemical Engineering",
      "Department of Civil Engineering",
      "Department of Communications Engineering",
      "Department of Electrical and Computer Engineering",
      "Department of Glass Technology",
      "Department of Mechanical Engineering",
      "Department of Metallurgical and Materials Engineering",
      "Department of Mechatronics Engineering",
      "Department of Petroleum Engineering",
      "Department of Textile Science and Technology",
      "Department of Water Resources and Environmental Engineering",
    ],
  },
  {
    id: "fac-envd",
    name: "Faculty of Environmental Design",
    code: "ENVD",
    departments: [
      "Department of Architecture",
      "Department of Building",
      "Department of Fine Arts",
      "Department of Geomatics",
      "Department of Industrial Design",
      "Department of Quantity Surveying",
      "Department of Urban and Regional Planning",
    ],
  },
  {
    id: "fac-law",
    name: "Faculty of Law",
    code: "LAW",
    departments: [
      "Department of Islamic Law",
      "Department of Public Law",
      "Department of Commercial Law",
      "Department of Private Law",
    ],
  },
  {
    id: "fac-soc",
    name: "Faculty of Social Sciences",
    code: "SOC",
    departments: [
      "Department of Mass Communication",
      "Department of Political Science and International Studies",
      "Department of Sociology",
    ],
  },
  {
    id: "fac-edu",
    name: "Faculty of Education",
    code: "EDU",
    departments: [
      "Chemistry Education",
      "Physics Education",
      "Biology Education",
      "Mathematics Education",
      "English Education",
      "Economics Education",
      "Geography Education",
      "Home Economics Education",
    ],
  },
];

// ── FOCUS FACULTY ────────────────────────────────────────────
export const FOCUS_FACULTY = {
  id: "fac-sci",
  name: "Faculty of Physical and Applied Sciences",
  code: "SCI",
  deanName: "Prof. Minato Namikaze",
  deanTitle: "Dean, Faculty of Physical and Applied Sciences",
  established: 2003,
  totalRooms: 35,
  totalLabs: 14,
  totalTheatres: 4,
  totalStudents: 2948,  // sum across all dept/levels below
  totalLecturers: 196,  // sum across all depts
};

// ── DEPARTMENT IDs ───────────────────────────────────────────
export type DeptCode =
  | "BCH" | "BIO" | "BOT" | "MCB" | "ZOO"
  | "CHM" | "CSC" | "GEO" | "GLG" | "MTH" | "PHY" | "STA";

export interface DeptMeta {
  id: string;
  code: DeptCode;
  name: string;
  hod: string;
  hodTitle: string;
  isBioGroup: boolean;       // Biochem, Bio, Microbiology → +5% students
  studentsPerLevel: number;  // base count per level (100-400)
  totalLecturers: number;
  yearsOfStudy: number;
  degreeAwarded: string;
}

export const DEPARTMENTS: DeptMeta[] = [
  {
    id: "dept-bch",
    code: "BCH",
    name: "Department of Biochemistry",
    hod: "Prof. Sakura Haruno",
    hodTitle: "Professor of Molecular Biochemistry",
    isBioGroup: true,
    studentsPerLevel: 65,
    totalLecturers: 17,
    yearsOfStudy: 4,
    degreeAwarded: "B.Sc. Biochemistry",
  },
  {
    id: "dept-bio",
    code: "BIO",
    name: "Department of Biological Sciences",
    hod: "Prof. Yamato Tenzo",
    hodTitle: "Professor of Cell Biology",
    isBioGroup: true,
    studentsPerLevel: 65,
    totalLecturers: 17,
    yearsOfStudy: 4,
    degreeAwarded: "B.Sc. Biological Sciences",
  },
  {
    id: "dept-bot",
    code: "BOT",
    name: "Department of Botany",
    hod: "Dr. Ino Yamanaka",
    hodTitle: "Associate Professor of Plant Biology",
    isBioGroup: false,
    studentsPerLevel: 60,
    totalLecturers: 15,
    yearsOfStudy: 4,
    degreeAwarded: "B.Sc. Botany",
  },
  {
    id: "dept-mcb",
    code: "MCB",
    name: "Department of Microbiology",
    hod: "Prof. Tsunade Senju",
    hodTitle: "Professor of Medical Microbiology",
    isBioGroup: true,
    studentsPerLevel: 65,
    totalLecturers: 17,
    yearsOfStudy: 4,
    degreeAwarded: "B.Sc. Microbiology",
  },
  {
    id: "dept-zoo",
    code: "ZOO",
    name: "Department of Zoology",
    hod: "Dr. Kiba Inuzuka",
    hodTitle: "Senior Lecturer in Animal Physiology",
    isBioGroup: false,
    studentsPerLevel: 60,
    totalLecturers: 15,
    yearsOfStudy: 4,
    degreeAwarded: "B.Sc. Zoology",
  },
  {
    id: "dept-chm",
    code: "CHM",
    name: "Department of Chemistry",
    hod: "Prof. Kakashi Hatake",
    hodTitle: "Professor of Organic Chemistry",
    isBioGroup: false,
    studentsPerLevel: 58,
    totalLecturers: 16,
    yearsOfStudy: 4,
    degreeAwarded: "B.Sc. Chemistry",
  },
  {
    id: "dept-csc",
    code: "CSC",
    name: "Department of Computer Science",
    hod: "Prof. Shikamaru Nara",
    hodTitle: "Professor of Artificial Intelligence",
    isBioGroup: false,
    studentsPerLevel: 70,
    totalLecturers: 18,
    yearsOfStudy: 4,
    degreeAwarded: "B.Sc. Computer Science",
  },
  {
    id: "dept-geo",
    code: "GEO",
    name: "Department of Geography",
    hod: "Dr. Temari Nara",
    hodTitle: "Senior Lecturer in Physical Geography",
    isBioGroup: false,
    studentsPerLevel: 55,
    totalLecturers: 15,
    yearsOfStudy: 4,
    degreeAwarded: "B.Sc. Geography",
  },
  {
    id: "dept-glg",
    code: "GLG",
    name: "Department of Geology",
    hod: "Dr. Gaara Sabaku",
    hodTitle: "Associate Professor of Structural Geology",
    isBioGroup: false,
    studentsPerLevel: 55,
    totalLecturers: 15,
    yearsOfStudy: 4,
    degreeAwarded: "B.Sc. Geology",
  },
  {
    id: "dept-mth",
    code: "MTH",
    name: "Department of Mathematics",
    hod: "Prof. Neji Hyuga",
    hodTitle: "Professor of Applied Mathematics",
    isBioGroup: false,
    studentsPerLevel: 60,
    totalLecturers: 16,
    yearsOfStudy: 4,
    degreeAwarded: "B.Sc. Mathematics",
  },
  {
    id: "dept-phy",
    code: "PHY",
    name: "Department of Physics",
    hod: "Prof. Sasuke Uchiha",
    hodTitle: "Professor of Theoretical Physics",
    isBioGroup: false,
    studentsPerLevel: 58,
    totalLecturers: 16,
    yearsOfStudy: 4,
    degreeAwarded: "B.Sc. Physics",
  },
  {
    id: "dept-sta",
    code: "STA",
    name: "Department of Statistics",
    hod: "Dr. Shino Aburame",
    hodTitle: "Senior Lecturer in Biostatistics",
    isBioGroup: false,
    studentsPerLevel: 55,
    totalLecturers: 15,
    yearsOfStudy: 4,
    degreeAwarded: "B.Sc. Statistics",
  },
];

// ── STUDENT DISTRIBUTION (per dept, per level) ───────────────
// Level: 100 | 200 | 300 | 400
export function getStudentDistribution(dept: DeptMeta): Record<string, number> {
  const base = dept.studentsPerLevel;
  return {
    "100 Level": base + 2,
    "200 Level": base,
    "300 Level": base - 2,
    "400 Level": base - 4,
  };
}

// ── LECTURE FACILITIES (Faculty-level, not dept) ─────────────
export const LECTURE_FACILITIES = [
  // Lecture Halls
  { id: "LH-01", name: "SCI LH 1 (Main Auditorium)", type: "Lecture Hall", capacity: 350, floor: "Ground" },
  { id: "LH-02", name: "SCI LH 2", type: "Lecture Hall", capacity: 250, floor: "Ground" },
  { id: "LH-03", name: "SCI LH 3", type: "Lecture Hall", capacity: 200, floor: "First" },
  { id: "LH-04", name: "SCI LH 4", type: "Lecture Hall", capacity: 200, floor: "First" },
  { id: "LH-05", name: "SCI LH 5", type: "Lecture Hall", capacity: 150, floor: "Second" },
  { id: "LH-06", name: "SCI LH 6", type: "Lecture Hall", capacity: 150, floor: "Second" },
  { id: "LH-07", name: "SCI LH 7", type: "Lecture Hall", capacity: 120, floor: "Ground" },
  { id: "LH-08", name: "SCI LH 8", type: "Lecture Hall", capacity: 120, floor: "Ground" },
  { id: "LH-09", name: "SCI LH 9", type: "Lecture Hall", capacity: 100, floor: "First" },
  { id: "LH-10", name: "SCI LH 10", type: "Lecture Hall", capacity: 100, floor: "First" },
  { id: "LH-11", name: "SCI LH 11 (Seminar Room A)", type: "Lecture Hall", capacity: 80, floor: "Third" },
  { id: "LH-12", name: "SCI LH 12 (Seminar Room B)", type: "Lecture Hall", capacity: 80, floor: "Third" },
  // Chemistry Labs
  { id: "LAB-CHM-01", name: "Organic Chemistry Lab 1", type: "Laboratory", capacity: 40, floor: "Ground", dept: "CHM" },
  { id: "LAB-CHM-02", name: "Organic Chemistry Lab 2", type: "Laboratory", capacity: 40, floor: "Ground", dept: "CHM" },
  { id: "LAB-CHM-03", name: "Inorganic Chemistry Lab", type: "Laboratory", capacity: 40, floor: "First", dept: "CHM" },
  { id: "LAB-CHM-04", name: "Physical Chemistry Lab", type: "Laboratory", capacity: 35, floor: "First", dept: "CHM" },
  { id: "LAB-CHM-05", name: "Analytical Chemistry Lab", type: "Laboratory", capacity: 35, floor: "Second", dept: "CHM" },
  // Physics Labs
  { id: "LAB-PHY-01", name: "General Physics Lab 1", type: "Laboratory", capacity: 40, floor: "Ground", dept: "PHY" },
  { id: "LAB-PHY-02", name: "General Physics Lab 2", type: "Laboratory", capacity: 40, floor: "Ground", dept: "PHY" },
  { id: "LAB-PHY-03", name: "Electronics Lab", type: "Laboratory", capacity: 35, floor: "First", dept: "PHY" },
  // Biochemistry / Biology Labs
  { id: "LAB-BCH-01", name: "Biochemistry Research Lab", type: "Laboratory", capacity: 30, floor: "First", dept: "BCH" },
  { id: "LAB-BIO-01", name: "Cell Biology Lab", type: "Laboratory", capacity: 35, floor: "Ground", dept: "BIO" },
  { id: "LAB-MCB-01", name: "Microbiology Lab 1", type: "Laboratory", capacity: 35, floor: "Second", dept: "MCB" },
  { id: "LAB-MCB-02", name: "Microbiology Lab 2", type: "Laboratory", capacity: 35, floor: "Second", dept: "MCB" },
  // Computer Labs
  { id: "LAB-CSC-01", name: "Computer Lab 1 (50 Nodes)", type: "Computer Lab", capacity: 50, floor: "Ground", dept: "CSC" },
  { id: "LAB-CSC-02", name: "Computer Lab 2 (50 Nodes)", type: "Computer Lab", capacity: 50, floor: "Ground", dept: "CSC" },
  { id: "LAB-CSC-03", name: "Programming Lab", type: "Computer Lab", capacity: 40, floor: "First", dept: "CSC" },
  // Geology/Geography Labs
  { id: "LAB-GLG-01", name: "Geology/Petrology Lab", type: "Laboratory", capacity: 30, floor: "First", dept: "GLG" },
  { id: "LAB-GEO-01", name: "GIS & Remote Sensing Lab", type: "Computer Lab", capacity: 35, floor: "Second", dept: "GEO" },
  // Theatres
  { id: "TH-01", name: "SCI Theatre 1 (Amphitheatre)", type: "Theatre", capacity: 500, floor: "Ground" },
  { id: "TH-02", name: "SCI Theatre 2", type: "Theatre", capacity: 300, floor: "Ground" },
  { id: "TH-03", name: "SCI Theatre 3", type: "Theatre", capacity: 200, floor: "First" },
  { id: "TH-04", name: "SCI Examination Hall", type: "Theatre", capacity: 400, floor: "Ground" },
  // Extras
  { id: "LH-13", name: "SCI LH 13", type: "Lecture Hall", capacity: 80, floor: "Second" },
];

export const FACILITY_SUMMARY = {
  lectureHalls: LECTURE_FACILITIES.filter(f => f.type === "Lecture Hall").length,
  laboratories: LECTURE_FACILITIES.filter(f => f.type === "Laboratory").length,
  computerLabs: LECTURE_FACILITIES.filter(f => f.type === "Computer Lab").length,
  theatres: LECTURE_FACILITIES.filter(f => f.type === "Theatre").length,
  total: LECTURE_FACILITIES.length,
};
