import { PrismaClient, InstitutionType, UserRole, RoomType } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

// Helper to generate random reg numbers
function generateRegNumber(year: number, deptCode: string, serial: number): string {
  return `NSUK/${year}/${deptCode}/${serial.toString().padStart(4, '0')}`
}

// Helper to pick random items
function randomPick<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

async function main() {
  console.log('🌱 Starting ClashFree seed...')
  console.log('📋 Creating realistic Nigerian University simulation data...\n')

  // ========================================
  // 1. CREATE USERS
  // ========================================
  const superAdminPassword = await hash('admin123', 12)
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@clashfree.com' },
    update: {},
    create: {
      email: 'admin@clashfree.com',
      passwordHash: superAdminPassword,
      name: 'Super Admin',
      role: 'SA',
    },
  })
  console.log('✅ Created super admin:', superAdmin.email)

  // Institution Admin
  const iaPassword = await hash('admin123', 12)
  const institutionAdmin = await prisma.user.upsert({
    where: { email: 'ia@nsuk.edu.ng' },
    update: {},
    create: {
      email: 'ia@nsuk.edu.ng',
      passwordHash: iaPassword,
      name: 'Dr. Ibrahim Musa',
      role: 'IA',
    },
  })
  console.log('✅ Created institution admin:', institutionAdmin.email)

  // Timetable Officers
  const toPassword = await hash('admin123', 12)
  const timetableOfficer = await prisma.user.upsert({
    where: { email: 'to@nsuk.edu.ng' },
    update: {},
    create: {
      email: 'to@nsuk.edu.ng',
      passwordHash: toPassword,
      name: 'Mrs. Fatima Abdullahi',
      role: 'TO',
    },
  })
  console.log('✅ Created timetable officer:', timetableOfficer.email)

  // Lecturer Demo User
  const lcPassword = await hash('admin123', 12)
  const lecturerUser = await prisma.user.upsert({
    where: { email: 'lecturer@nsuk.edu.ng' },
    update: {},
    create: {
      email: 'lecturer@nsuk.edu.ng',
      passwordHash: lcPassword,
      name: 'Dr. Adamu Ibrahim',
      role: 'LC',
    },
  })
  console.log('✅ Created lecturer user:', lecturerUser.email)

  // Student Demo User
  const stPassword = await hash('admin123', 12)
  const studentUser = await prisma.user.upsert({
    where: { email: 'student@nsuk.edu.ng' },
    update: {},
    create: {
      email: 'student@nsuk.edu.ng',
      passwordHash: stPassword,
      name: 'Chinedu Okafor',
      role: 'ST',
    },
  })
  console.log('✅ Created student user:', studentUser.email)

  // ========================================
  // 2. CREATE INSTITUTION
  // ========================================
  const nsuk = await prisma.institution.upsert({
    where: { shortName: 'NSUK' },
    update: {},
    create: {
      name: 'Nasarawa State University, Keffi',
      shortName: 'NSUK',
      type: 'STATE_UNI',
      city: 'Keffi',
      state: 'Nasarawa',
      country: 'Nigeria',
      currentSession: '2025/2026',
      currentSemester: 1,
    },
  })
  console.log('✅ Created institution:', nsuk.shortName)

  // ========================================
  // 3. CREATE FACULTIES (Applied Science, Social Science, Law)
  // ========================================
  const faculties = [
    { id: 'faculty-applied-science', name: 'Applied Science', code: 'FAS' },
    { id: 'faculty-social-science', name: 'Social Science', code: 'FSS' },
    { id: 'faculty-law', name: 'Law', code: 'FL' },
  ]

  for (const fac of faculties) {
    await prisma.faculty.upsert({
      where: { id: fac.id },
      update: {},
      create: {
        id: fac.id,
        institutionId: nsuk.id,
        name: fac.name,
        code: fac.code,
      },
    })
  }
  console.log('✅ Created', faculties.length, 'faculties')

  // ========================================
  // 4. CREATE DEPARTMENTS
  // ========================================
  const fasFaculty = await prisma.faculty.findUnique({ where: { id: 'faculty-applied-science' } })
  const fssFaculty = await prisma.faculty.findUnique({ where: { id: 'faculty-social-science' } })
  const lawFaculty = await prisma.faculty.findUnique({ where: { id: 'faculty-law' } })

  const departments = [
    // Faculty of Applied Science
    { code: 'CSC', name: 'Computer Science', facultyId: fasFaculty!.id, avgStudents: 220 },
    { code: 'BCH', name: 'Biochemistry', facultyId: fasFaculty!.id, avgStudents: 180 },
    { code: 'MCB', name: 'Microbiology', facultyId: fasFaculty!.id, avgStudents: 160 },
    { code: 'PHY', name: 'Physics with Electronics', facultyId: fasFaculty!.id, avgStudents: 120 },
    { code: 'STA', name: 'Statistics', facultyId: fasFaculty!.id, avgStudents: 140 },
    
    // Faculty of Social Science
    { code: 'ECO', name: 'Economics', facultyId: fssFaculty!.id, avgStudents: 280 },
    { code: 'PSC', name: 'Political Science', facultyId: fssFaculty!.id, avgStudents: 320 },
    { code: 'SOC', name: 'Sociology', facultyId: fssFaculty!.id, avgStudents: 200 },
    { code: 'PSY', name: 'Psychology', facultyId: fssFaculty!.id, avgStudents: 240 },
    
    // Faculty of Law
    { code: 'LAW', name: 'Public Law', facultyId: lawFaculty!.id, avgStudents: 200 },
    { code: 'JIL', name: 'Jurisprudence & International Law', facultyId: lawFaculty!.id, avgStudents: 180 },
    { code: 'PUL', name: 'Private & Commercial Law', facultyId: lawFaculty!.id, avgStudents: 190 },
  ]

  for (const dept of departments) {
    await prisma.department.upsert({
      where: { id: `dept-${dept.code.toLowerCase()}-nsuk` },
      update: {},
      create: {
        id: `dept-${dept.code.toLowerCase()}-nsuk`,
        facultyId: dept.facultyId,
        code: dept.code,
        name: dept.name,
      },
    })
  }
  console.log('✅ Created', departments.length, 'departments')

  // ========================================
  // 5. CREATE ROOMS (Lecture Halls, Classrooms, Labs)
  // ========================================
  const rooms = [
    // Large venues (for GST and large departments)
    { code: 'MPH', name: 'Multi-Purpose Hall', capacity: 1500, type: 'AUDITORIUM', facultyId: null },
    { code: 'AGH', name: 'Assembly Ground Hall', capacity: 1000, type: 'EXAM_HALL', facultyId: null },
    
    // Faculty of Applied Science Rooms
    { code: 'FAS-LT1', name: 'Applied Science Lecture Theatre 1', capacity: 500, type: 'LECTURE_HALL', facultyId: fasFaculty!.id },
    { code: 'FAS-LT2', name: 'Applied Science Lecture Theatre 2', capacity: 400, type: 'LECTURE_HALL', facultyId: fasFaculty!.id },
    { code: 'FAS-HALL', name: 'Applied Science Hall', capacity: 350, type: 'EXAM_HALL', facultyId: fasFaculty!.id },
    { code: 'CSC-LAB1', name: 'Computer Laboratory 1', capacity: 80, type: 'COMPUTER_LAB', facultyId: fasFaculty!.id, hasComputers: true },
    { code: 'CSC-LAB2', name: 'Computer Laboratory 2', capacity: 80, type: 'COMPUTER_LAB', facultyId: fasFaculty!.id, hasComputers: true },
    { code: 'BCH-LAB', name: 'Biochemistry Laboratory', capacity: 60, type: 'LABORATORY', facultyId: fasFaculty!.id },
    { code: 'MCB-LAB', name: 'Microbiology Laboratory', capacity: 60, type: 'LABORATORY', facultyId: fasFaculty!.id },
    { code: 'PHY-LAB', name: 'Physics Laboratory', capacity: 50, type: 'LABORATORY', facultyId: fasFaculty!.id },
    { code: 'STA-LAB', name: 'Statistics Computer Lab', capacity: 50, type: 'COMPUTER_LAB', facultyId: fasFaculty!.id, hasComputers: true },
    
    // Faculty of Social Science Rooms
    { code: 'FSS-LT1', name: 'Social Science Lecture Theatre 1', capacity: 600, type: 'LECTURE_HALL', facultyId: fssFaculty!.id },
    { code: 'FSS-LT2', name: 'Social Science Lecture Theatre 2', capacity: 450, type: 'LECTURE_HALL', facultyId: fssFaculty!.id },
    { code: 'FSS-HALL', name: 'Social Science Hall', capacity: 400, type: 'EXAM_HALL', facultyId: fssFaculty!.id },
    { code: 'ECO-HALL', name: 'Economics Hall', capacity: 250, type: 'CLASSROOM', facultyId: fssFaculty!.id },
    { code: 'PSC-HALL', name: 'Political Science Hall', capacity: 300, type: 'CLASSROOM', facultyId: fssFaculty!.id },
    { code: 'SOC-HALL', name: 'Sociology Hall', capacity: 200, type: 'CLASSROOM', facultyId: fssFaculty!.id },
    { code: 'PSY-LAB', name: 'Psychology Laboratory', capacity: 60, type: 'LABORATORY', facultyId: fssFaculty!.id },
    
    // Faculty of Law Rooms
    { code: 'LAW-LT', name: 'Law Lecture Theatre', capacity: 500, type: 'LECTURE_HALL', facultyId: lawFaculty!.id },
    { code: 'LAW-HALL1', name: 'Law Hall 1', capacity: 300, type: 'EXAM_HALL', facultyId: lawFaculty!.id },
    { code: 'LAW-HALL2', name: 'Law Hall 2', capacity: 250, type: 'CLASSROOM', facultyId: lawFaculty!.id },
    { code: 'MOOT', name: 'Moot Court', capacity: 100, type: 'CLASSROOM', facultyId: lawFaculty!.id },
    
    // General Classrooms
    { code: 'CR101', name: 'Classroom 101', capacity: 150, type: 'CLASSROOM', facultyId: null },
    { code: 'CR102', name: 'Classroom 102', capacity: 150, type: 'CLASSROOM', facultyId: null },
    { code: 'CR103', name: 'Classroom 103', capacity: 120, type: 'CLASSROOM', facultyId: null },
    { code: 'CR104', name: 'Classroom 104', capacity: 100, type: 'CLASSROOM', facultyId: null },
  ]

  for (const room of rooms) {
    await prisma.room.upsert({
      where: { id: `room-${room.code.toLowerCase()}-nsuk` },
      update: {},
      create: {
        id: `room-${room.code.toLowerCase()}-nsuk`,
        institutionId: nsuk.id,
        facultyId: room.facultyId,
        code: room.code,
        name: room.name,
        capacity: room.capacity,
        type: room.type as RoomType,
        hasComputers: (room as any).hasComputers || false,
        hasAC: true,
        hasProjector: true,
      },
    })
  }
  console.log('✅ Created', rooms.length, 'rooms')

  // ========================================
  // 6. CREATE COURSES (Realistic Nigerian University Courses)
  // ========================================
  
  // Get department references
  const cscDept = await prisma.department.findFirst({ where: { code: 'CSC' } })
  const bchDept = await prisma.department.findFirst({ where: { code: 'BCH' } })
  const mcbDept = await prisma.department.findFirst({ where: { code: 'MCB' } })
  const phyDept = await prisma.department.findFirst({ where: { code: 'PHY' } })
  const staDept = await prisma.department.findFirst({ where: { code: 'STA' } })
  const ecoDept = await prisma.department.findFirst({ where: { code: 'ECO' } })
  const pscDept = await prisma.department.findFirst({ where: { code: 'PSC' } })
  const socDept = await prisma.department.findFirst({ where: { code: 'SOC' } })
  const psyDept = await prisma.department.findFirst({ where: { code: 'PSY' } })
  const lawDept = await prisma.department.findFirst({ where: { code: 'LAW' } })
  const jilDept = await prisma.department.findFirst({ where: { code: 'JIL' } })
  const pulDept = await prisma.department.findFirst({ where: { code: 'PUL' } })

  // All courses with realistic Nigerian university data
  const allCourses = [
    // =======================
    // GST COURSES (General Studies - Shared across all departments)
    // =======================
    { code: 'GST 111', name: 'Communication in English I', creditUnits: 2, level: 100, departmentId: cscDept!.id, isShared: true },
    { code: 'GST 112', name: 'Nigerian Peoples and Culture', creditUnits: 2, level: 100, departmentId: cscDept!.id, isShared: true },
    { code: 'GST 113', name: 'Use of Library', creditUnits: 1, level: 100, departmentId: cscDept!.id, isShared: true },
    { code: 'GST 121', name: 'Use of English II', creditUnits: 2, level: 100, departmentId: cscDept!.id, isShared: true },
    { code: 'GST 122', name: 'Introduction to Social Sciences', creditUnits: 2, level: 100, departmentId: cscDept!.id, isShared: true },
    { code: 'GST 211', name: 'Philosophy and Logic', creditUnits: 2, level: 200, departmentId: cscDept!.id, isShared: true },
    { code: 'GST 212', name: 'Peace and Conflict Resolution', creditUnits: 2, level: 200, departmentId: cscDept!.id, isShared: true },
    { code: 'GST 213', name: 'Introduction to Entrepreneurship', creditUnits: 2, level: 200, departmentId: cscDept!.id, isShared: true },
    { code: 'GST 311', name: 'Science, Technology and Society', creditUnits: 2, level: 300, departmentId: cscDept!.id, isShared: true },
    { code: 'GST 312', name: 'Environmental Health', creditUnits: 2, level: 300, departmentId: cscDept!.id, isShared: true },
    
    // =======================
    // COMPUTER SCIENCE COURSES
    // =======================
    { code: 'CSC 101', name: 'Introduction to Computer Science', creditUnits: 3, level: 100, departmentId: cscDept!.id, isShared: false },
    { code: 'CSC 102', name: 'Computer Programming I (Python)', creditUnits: 3, level: 100, departmentId: cscDept!.id, isShared: false },
    { code: 'CSC 111', name: 'Introduction to Problem Solving', creditUnits: 2, level: 100, departmentId: cscDept!.id, isShared: false },
    { code: 'CSC 201', name: 'Computer Programming II (Java)', creditUnits: 3, level: 200, departmentId: cscDept!.id, isShared: false },
    { code: 'CSC 202', name: 'Data Structures and Algorithms', creditUnits: 3, level: 200, departmentId: cscDept!.id, isShared: false },
    { code: 'CSC 203', name: 'Computer Organization and Architecture', creditUnits: 3, level: 200, departmentId: cscDept!.id, isShared: false },
    { code: 'CSC 204', name: 'Discrete Mathematics', creditUnits: 3, level: 200, departmentId: cscDept!.id, isShared: false },
    { code: 'CSC 301', name: 'Operating Systems', creditUnits: 3, level: 300, departmentId: cscDept!.id, isShared: false },
    { code: 'CSC 302', name: 'Database Systems', creditUnits: 3, level: 300, departmentId: cscDept!.id, isShared: false },
    { code: 'CSC 303', name: 'Software Engineering', creditUnits: 3, level: 300, departmentId: cscDept!.id, isShared: false },
    { code: 'CSC 304', name: 'Web Application Development', creditUnits: 3, level: 300, departmentId: cscDept!.id, isShared: false },
    { code: 'CSC 401', name: 'Computer Networks and Data Communication', creditUnits: 3, level: 400, departmentId: cscDept!.id, isShared: false },
    { code: 'CSC 402', name: 'Artificial Intelligence', creditUnits: 3, level: 400, departmentId: cscDept!.id, isShared: false },
    { code: 'CSC 403', name: 'Cybersecurity Fundamentals', creditUnits: 3, level: 400, departmentId: cscDept!.id, isShared: false },
    { code: 'CSC 404', name: 'Mobile Application Development', creditUnits: 3, level: 400, departmentId: cscDept!.id, isShared: false },
    { code: 'CSC 499', name: 'Final Year Project', creditUnits: 6, level: 400, departmentId: cscDept!.id, isShared: false },
    
    // =======================
    // BIOCHEMISTRY COURSES
    // =======================
    { code: 'BCH 101', name: 'Introduction to Biochemistry', creditUnits: 2, level: 100, departmentId: bchDept!.id, isShared: false },
    { code: 'BCH 201', name: 'General Biochemistry I', creditUnits: 3, level: 200, departmentId: bchDept!.id, isShared: false },
    { code: 'BCH 202', name: 'General Biochemistry II', creditUnits: 3, level: 200, departmentId: bchDept!.id, isShared: false },
    { code: 'BCH 203', name: 'Organic Chemistry for Biochemists', creditUnits: 3, level: 200, departmentId: bchDept!.id, isShared: false },
    { code: 'BCH 301', name: 'Enzymology', creditUnits: 3, level: 300, departmentId: bchDept!.id, isShared: false },
    { code: 'BCH 302', name: 'Metabolism of Biomolecules', creditUnits: 3, level: 300, departmentId: bchDept!.id, isShared: false },
    { code: 'BCH 303', name: 'Clinical Biochemistry', creditUnits: 3, level: 300, departmentId: bchDept!.id, isShared: false },
    { code: 'BCH 401', name: 'Molecular Biology', creditUnits: 3, level: 400, departmentId: bchDept!.id, isShared: false },
    { code: 'BCH 402', name: 'Nutritional Biochemistry', creditUnits: 3, level: 400, departmentId: bchDept!.id, isShared: false },
    { code: 'BCH 403', name: 'Pharmacological Biochemistry', creditUnits: 3, level: 400, departmentId: bchDept!.id, isShared: false },
    { code: 'BCH 499', name: 'Research Project', creditUnits: 6, level: 400, departmentId: bchDept!.id, isShared: false },
    
    // =======================
    // MICROBIOLOGY COURSES
    // =======================
    { code: 'MCB 101', name: 'Introduction to Microbiology', creditUnits: 2, level: 100, departmentId: mcbDept!.id, isShared: false },
    { code: 'MCB 201', name: 'General Microbiology I', creditUnits: 3, level: 200, departmentId: mcbDept!.id, isShared: false },
    { code: 'MCB 202', name: 'General Microbiology II', creditUnits: 3, level: 200, departmentId: mcbDept!.id, isShared: false },
    { code: 'MCB 203', name: 'Microbial Physiology', creditUnits: 3, level: 200, departmentId: mcbDept!.id, isShared: false },
    { code: 'MCB 301', name: 'Medical Microbiology', creditUnits: 3, level: 300, departmentId: mcbDept!.id, isShared: false },
    { code: 'MCB 302', name: 'Food and Industrial Microbiology', creditUnits: 3, level: 300, departmentId: mcbDept!.id, isShared: false },
    { code: 'MCB 303', name: 'Environmental Microbiology', creditUnits: 3, level: 300, departmentId: mcbDept!.id, isShared: false },
    { code: 'MCB 401', name: 'Immunology and Immunotechnology', creditUnits: 3, level: 400, departmentId: mcbDept!.id, isShared: false },
    { code: 'MCB 402', name: 'Virology', creditUnits: 3, level: 400, departmentId: mcbDept!.id, isShared: false },
    { code: 'MCB 403', name: 'Biotechnology', creditUnits: 3, level: 400, departmentId: mcbDept!.id, isShared: false },
    { code: 'MCB 499', name: 'Research Project', creditUnits: 6, level: 400, departmentId: mcbDept!.id, isShared: false },
    
    // =======================
    // PHYSICS WITH ELECTRONICS COURSES
    // =======================
    { code: 'PHY 101', name: 'General Physics I (Mechanics)', creditUnits: 3, level: 100, departmentId: phyDept!.id, isShared: true },
    { code: 'PHY 102', name: 'General Physics II (Electricity & Magnetism)', creditUnits: 3, level: 100, departmentId: phyDept!.id, isShared: true },
    { code: 'PHY 103', name: 'Physics Laboratory I', creditUnits: 1, level: 100, departmentId: phyDept!.id, isShared: false },
    { code: 'PHY 201', name: 'Classical Mechanics', creditUnits: 3, level: 200, departmentId: phyDept!.id, isShared: false },
    { code: 'PHY 202', name: 'Electromagnetism', creditUnits: 3, level: 200, departmentId: phyDept!.id, isShared: false },
    { code: 'PHY 203', name: 'Electronics I', creditUnits: 3, level: 200, departmentId: phyDept!.id, isShared: false },
    { code: 'PHY 204', name: 'Mathematical Methods in Physics', creditUnits: 3, level: 200, departmentId: phyDept!.id, isShared: false },
    { code: 'PHY 301', name: 'Quantum Mechanics', creditUnits: 3, level: 300, departmentId: phyDept!.id, isShared: false },
    { code: 'PHY 302', name: 'Electronics II', creditUnits: 3, level: 300, departmentId: phyDept!.id, isShared: false },
    { code: 'PHY 303', name: 'Statistical and Thermal Physics', creditUnits: 3, level: 300, departmentId: phyDept!.id, isShared: false },
    { code: 'PHY 401', name: 'Solid State Physics', creditUnits: 3, level: 400, departmentId: phyDept!.id, isShared: false },
    { code: 'PHY 402', name: 'Digital Electronics and Microprocessors', creditUnits: 3, level: 400, departmentId: phyDept!.id, isShared: false },
    { code: 'PHY 403', name: 'Computational Physics', creditUnits: 3, level: 400, departmentId: phyDept!.id, isShared: false },
    { code: 'PHY 499', name: 'Research Project', creditUnits: 6, level: 400, departmentId: phyDept!.id, isShared: false },
    
    // =======================
    // STATISTICS COURSES
    // =======================
    { code: 'STA 101', name: 'Introduction to Statistics', creditUnits: 3, level: 100, departmentId: staDept!.id, isShared: true },
    { code: 'STA 102', name: 'Elements of Probability', creditUnits: 3, level: 100, departmentId: staDept!.id, isShared: false },
    { code: 'STA 201', name: 'Probability Theory I', creditUnits: 3, level: 200, departmentId: staDept!.id, isShared: false },
    { code: 'STA 202', name: 'Probability Theory II', creditUnits: 3, level: 200, departmentId: staDept!.id, isShared: false },
    { code: 'STA 203', name: 'Statistical Inference I', creditUnits: 3, level: 200, departmentId: staDept!.id, isShared: false },
    { code: 'STA 301', name: 'Statistical Inference II', creditUnits: 3, level: 300, departmentId: staDept!.id, isShared: false },
    { code: 'STA 302', name: 'Regression Analysis', creditUnits: 3, level: 300, departmentId: staDept!.id, isShared: false },
    { code: 'STA 303', name: 'Design and Analysis of Experiments', creditUnits: 3, level: 300, departmentId: staDept!.id, isShared: false },
    { code: 'STA 401', name: 'Multivariate Analysis', creditUnits: 3, level: 400, departmentId: staDept!.id, isShared: false },
    { code: 'STA 402', name: 'Time Series Analysis', creditUnits: 3, level: 400, departmentId: staDept!.id, isShared: false },
    { code: 'STA 403', name: 'Biostatistics', creditUnits: 3, level: 400, departmentId: staDept!.id, isShared: false },
    { code: 'STA 499', name: 'Research Project', creditUnits: 6, level: 400, departmentId: staDept!.id, isShared: false },
    
    // =======================
    // ECONOMICS COURSES
    // =======================
    { code: 'ECO 101', name: 'Introduction to Economics I', creditUnits: 3, level: 100, departmentId: ecoDept!.id, isShared: false },
    { code: 'ECO 102', name: 'Introduction to Economics II', creditUnits: 3, level: 100, departmentId: ecoDept!.id, isShared: false },
    { code: 'ECO 201', name: 'Microeconomic Theory I', creditUnits: 3, level: 200, departmentId: ecoDept!.id, isShared: false },
    { code: 'ECO 202', name: 'Macroeconomic Theory I', creditUnits: 3, level: 200, departmentId: ecoDept!.id, isShared: false },
    { code: 'ECO 203', name: 'Mathematics for Economists I', creditUnits: 3, level: 200, departmentId: ecoDept!.id, isShared: false },
    { code: 'ECO 204', name: 'Statistics for Economists', creditUnits: 3, level: 200, departmentId: ecoDept!.id, isShared: false },
    { code: 'ECO 301', name: 'Microeconomic Theory II', creditUnits: 3, level: 300, departmentId: ecoDept!.id, isShared: false },
    { code: 'ECO 302', name: 'Macroeconomic Theory II', creditUnits: 3, level: 300, departmentId: ecoDept!.id, isShared: false },
    { code: 'ECO 303', name: 'Nigerian Economy', creditUnits: 3, level: 300, departmentId: ecoDept!.id, isShared: false },
    { code: 'ECO 304', name: 'Development Economics', creditUnits: 3, level: 300, departmentId: ecoDept!.id, isShared: false },
    { code: 'ECO 401', name: 'International Economics', creditUnits: 3, level: 400, departmentId: ecoDept!.id, isShared: false },
    { code: 'ECO 402', name: 'Monetary and Banking Theory', creditUnits: 3, level: 400, departmentId: ecoDept!.id, isShared: false },
    { code: 'ECO 403', name: 'Public Finance', creditUnits: 3, level: 400, departmentId: ecoDept!.id, isShared: false },
    { code: 'ECO 404', name: 'Econometrics', creditUnits: 3, level: 400, departmentId: ecoDept!.id, isShared: false },
    { code: 'ECO 499', name: 'Research Project', creditUnits: 6, level: 400, departmentId: ecoDept!.id, isShared: false },
    
    // =======================
    // POLITICAL SCIENCE COURSES
    // =======================
    { code: 'PSC 101', name: 'Introduction to Political Science I', creditUnits: 3, level: 100, departmentId: pscDept!.id, isShared: false },
    { code: 'PSC 102', name: 'Introduction to Political Science II', creditUnits: 3, level: 100, departmentId: pscDept!.id, isShared: false },
    { code: 'PSC 201', name: 'Nigerian Government and Politics', creditUnits: 3, level: 200, departmentId: pscDept!.id, isShared: false },
    { code: 'PSC 202', name: 'Political Analysis', creditUnits: 3, level: 200, departmentId: pscDept!.id, isShared: false },
    { code: 'PSC 203', name: 'Introduction to International Relations', creditUnits: 3, level: 200, departmentId: pscDept!.id, isShared: false },
    { code: 'PSC 204', name: 'Political Thought I', creditUnits: 3, level: 200, departmentId: pscDept!.id, isShared: false },
    { code: 'PSC 301', name: 'Public Administration in Nigeria', creditUnits: 3, level: 300, departmentId: pscDept!.id, isShared: false },
    { code: 'PSC 302', name: 'Comparative Politics', creditUnits: 3, level: 300, departmentId: pscDept!.id, isShared: false },
    { code: 'PSC 303', name: 'International Law and Diplomacy', creditUnits: 3, level: 300, departmentId: pscDept!.id, isShared: false },
    { code: 'PSC 304', name: 'Political Thought II', creditUnits: 3, level: 300, departmentId: pscDept!.id, isShared: false },
    { code: 'PSC 401', name: 'African International Relations', creditUnits: 3, level: 400, departmentId: pscDept!.id, isShared: false },
    { code: 'PSC 402', name: 'Local Government Studies', creditUnits: 3, level: 400, departmentId: pscDept!.id, isShared: false },
    { code: 'PSC 403', name: 'Political Economy of Nigeria', creditUnits: 3, level: 400, departmentId: pscDept!.id, isShared: false },
    { code: 'PSC 404', name: 'Foreign Policy Analysis', creditUnits: 3, level: 400, departmentId: pscDept!.id, isShared: false },
    { code: 'PSC 499', name: 'Research Project', creditUnits: 6, level: 400, departmentId: pscDept!.id, isShared: false },
    
    // =======================
    // SOCIOLOGY COURSES
    // =======================
    { code: 'SOC 101', name: 'Introduction to Sociology I', creditUnits: 3, level: 100, departmentId: socDept!.id, isShared: false },
    { code: 'SOC 102', name: 'Introduction to Sociology II', creditUnits: 3, level: 100, departmentId: socDept!.id, isShared: false },
    { code: 'SOC 141', name: 'Introduction to Anthropology', creditUnits: 2, level: 100, departmentId: socDept!.id, isShared: false },
    { code: 'SOC 201', name: 'Sociological Theory I', creditUnits: 3, level: 200, departmentId: socDept!.id, isShared: false },
    { code: 'SOC 202', name: 'Sociological Theory II', creditUnits: 3, level: 200, departmentId: socDept!.id, isShared: false },
    { code: 'SOC 203', name: 'Social Problems in Nigeria', creditUnits: 3, level: 200, departmentId: socDept!.id, isShared: false },
    { code: 'SOC 204', name: 'Methods of Social Research I', creditUnits: 3, level: 200, departmentId: socDept!.id, isShared: false },
    { code: 'SOC 301', name: 'Social Stratification', creditUnits: 3, level: 300, departmentId: socDept!.id, isShared: false },
    { code: 'SOC 302', name: 'Sociology of Development', creditUnits: 3, level: 300, departmentId: socDept!.id, isShared: false },
    { code: 'SOC 303', name: 'Industrial Sociology', creditUnits: 3, level: 300, departmentId: socDept!.id, isShared: false },
    { code: 'SOC 304', name: 'Methods of Social Research II', creditUnits: 3, level: 300, departmentId: socDept!.id, isShared: false },
    { code: 'SOC 401', name: 'Criminology and Penology', creditUnits: 3, level: 400, departmentId: socDept!.id, isShared: false },
    { code: 'SOC 402', name: 'Sociology of the Family', creditUnits: 3, level: 400, departmentId: socDept!.id, isShared: false },
    { code: 'SOC 403', name: 'Population Studies', creditUnits: 3, level: 400, departmentId: socDept!.id, isShared: false },
    { code: 'SOC 499', name: 'Research Project', creditUnits: 6, level: 400, departmentId: socDept!.id, isShared: false },
    
    // =======================
    // PSYCHOLOGY COURSES
    // =======================
    { code: 'PSY 101', name: 'Introduction to Psychology I', creditUnits: 3, level: 100, departmentId: psyDept!.id, isShared: false },
    { code: 'PSY 102', name: 'Introduction to Psychology II', creditUnits: 3, level: 100, departmentId: psyDept!.id, isShared: false },
    { code: 'PSY 201', name: 'Developmental Psychology', creditUnits: 3, level: 200, departmentId: psyDept!.id, isShared: false },
    { code: 'PSY 202', name: 'Social Psychology', creditUnits: 3, level: 200, departmentId: psyDept!.id, isShared: false },
    { code: 'PSY 203', name: 'Physiological Psychology', creditUnits: 3, level: 200, departmentId: psyDept!.id, isShared: false },
    { code: 'PSY 204', name: 'Research Methods in Psychology', creditUnits: 3, level: 200, departmentId: psyDept!.id, isShared: false },
    { code: 'PSY 301', name: 'Abnormal Psychology', creditUnits: 3, level: 300, departmentId: psyDept!.id, isShared: false },
    { code: 'PSY 302', name: 'Educational Psychology', creditUnits: 3, level: 300, departmentId: psyDept!.id, isShared: false },
    { code: 'PSY 303', name: 'Psychological Testing and Measurement', creditUnits: 3, level: 300, departmentId: psyDept!.id, isShared: false },
    { code: 'PSY 304', name: 'Cognitive Psychology', creditUnits: 3, level: 300, departmentId: psyDept!.id, isShared: false },
    { code: 'PSY 401', name: 'Industrial/Organizational Psychology', creditUnits: 3, level: 400, departmentId: psyDept!.id, isShared: false },
    { code: 'PSY 402', name: 'Counselling Psychology', creditUnits: 3, level: 400, departmentId: psyDept!.id, isShared: false },
    { code: 'PSY 403', name: 'Health Psychology', creditUnits: 3, level: 400, departmentId: psyDept!.id, isShared: false },
    { code: 'PSY 404', name: 'Community Psychology', creditUnits: 3, level: 400, departmentId: psyDept!.id, isShared: false },
    { code: 'PSY 499', name: 'Research Project', creditUnits: 6, level: 400, departmentId: psyDept!.id, isShared: false },
    
    // =======================
    // LAW COURSES (LL.B - 5 Year Programme)
    // =======================
    // 100 Level
    { code: 'LAW 101', name: 'Legal Method I', creditUnits: 4, level: 100, departmentId: lawDept!.id, isShared: false },
    { code: 'LAW 102', name: 'Legal Method II', creditUnits: 4, level: 100, departmentId: lawDept!.id, isShared: false },
    { code: 'LAW 103', name: 'Introduction to Nigerian Legal System I', creditUnits: 3, level: 100, departmentId: lawDept!.id, isShared: false },
    { code: 'LAW 104', name: 'Introduction to Nigerian Legal System II', creditUnits: 3, level: 100, departmentId: lawDept!.id, isShared: false },
    
    // 200 Level
    { code: 'LAW 201', name: 'Constitutional Law I', creditUnits: 4, level: 200, departmentId: lawDept!.id, isShared: false },
    { code: 'LAW 202', name: 'Constitutional Law II', creditUnits: 4, level: 200, departmentId: lawDept!.id, isShared: false },
    { code: 'LAW 203', name: 'Law of Contract I', creditUnits: 4, level: 200, departmentId: lawDept!.id, isShared: false },
    { code: 'LAW 204', name: 'Law of Contract II', creditUnits: 4, level: 200, departmentId: lawDept!.id, isShared: false },
    { code: 'LAW 205', name: 'Criminal Law I', creditUnits: 3, level: 200, departmentId: lawDept!.id, isShared: false },
    { code: 'LAW 206', name: 'Criminal Law II', creditUnits: 3, level: 200, departmentId: lawDept!.id, isShared: false },
    
    // 300 Level
    { code: 'LAW 301', name: 'Law of Torts I', creditUnits: 4, level: 300, departmentId: lawDept!.id, isShared: false },
    { code: 'LAW 302', name: 'Law of Torts II', creditUnits: 4, level: 300, departmentId: lawDept!.id, isShared: false },
    { code: 'LAW 303', name: 'Land Law I', creditUnits: 4, level: 300, departmentId: lawDept!.id, isShared: false },
    { code: 'LAW 304', name: 'Land Law II', creditUnits: 4, level: 300, departmentId: lawDept!.id, isShared: false },
    { code: 'LAW 305', name: 'Commercial Law I', creditUnits: 3, level: 300, departmentId: lawDept!.id, isShared: false },
    { code: 'LAW 306', name: 'Equity and Trusts I', creditUnits: 3, level: 300, departmentId: lawDept!.id, isShared: false },
    
    // 400 Level
    { code: 'LAW 401', name: 'Administrative Law', creditUnits: 4, level: 400, departmentId: lawDept!.id, isShared: false },
    { code: 'LAW 402', name: 'Company Law', creditUnits: 4, level: 400, departmentId: lawDept!.id, isShared: false },
    { code: 'LAW 403', name: 'Law of Evidence I', creditUnits: 3, level: 400, departmentId: lawDept!.id, isShared: false },
    { code: 'LAW 404', name: 'Law of Evidence II', creditUnits: 3, level: 400, departmentId: lawDept!.id, isShared: false },
    { code: 'LAW 405', name: 'Islamic Law I', creditUnits: 3, level: 400, departmentId: lawDept!.id, isShared: false },
    { code: 'LAW 406', name: 'Customary Law I', creditUnits: 3, level: 400, departmentId: lawDept!.id, isShared: false },
    
    // 500 Level
    { code: 'LAW 501', name: 'Civil Procedure I', creditUnits: 4, level: 500, departmentId: lawDept!.id, isShared: false },
    { code: 'LAW 502', name: 'Civil Procedure II', creditUnits: 4, level: 500, departmentId: lawDept!.id, isShared: false },
    { code: 'LAW 503', name: 'Criminal Procedure', creditUnits: 4, level: 500, departmentId: lawDept!.id, isShared: false },
    { code: 'LAW 504', name: 'International Law I', creditUnits: 3, level: 500, departmentId: jilDept!.id, isShared: false },
    { code: 'LAW 505', name: 'International Law II', creditUnits: 3, level: 500, departmentId: jilDept!.id, isShared: false },
    { code: 'LAW 506', name: 'Jurisprudence', creditUnits: 3, level: 500, departmentId: jilDept!.id, isShared: false },
    { code: 'LAW 507', name: 'Banking Law', creditUnits: 3, level: 500, departmentId: pulDept!.id, isShared: false },
    { code: 'LAW 508', name: 'Law of Business Association', creditUnits: 3, level: 500, departmentId: pulDept!.id, isShared: false },
    { code: 'LAW 599', name: 'Long Essay/Project', creditUnits: 6, level: 500, departmentId: lawDept!.id, isShared: false },
  ]

  for (const course of allCourses) {
    await prisma.course.upsert({
      where: { id: `course-${course.code.toLowerCase().replace(' ', '-')}-nsuk` },
      update: {},
      create: {
        id: `course-${course.code.toLowerCase().replace(' ', '-')}-nsuk`,
        institutionId: nsuk.id,
        departmentId: course.departmentId,
        code: course.code,
        name: course.name,
        creditUnits: course.creditUnits,
        level: course.level,
        semester: 1,
        isShared: course.isShared,
      },
    })
  }
  console.log('✅ Created', allCourses.length, 'courses')

  // ========================================
  // 7. CREATE LECTURERS (Realistic Distribution)
  // ========================================
  const lecturerData = [
    // Computer Science
    { name: 'Dr. Adamu Ibrahim', dept: 'CSC', title: 'Senior Lecturer' },
    { name: 'Prof. Amina Mohammed', dept: 'CSC', title: 'Professor' },
    { name: 'Dr. Chukwuemeka Okafor', dept: 'CSC', title: 'Lecturer I' },
    { name: 'Dr. Oluwaseun Adeyemi', dept: 'CSC', title: 'Senior Lecturer' },
    
    // Biochemistry
    { name: 'Prof. John Adeyemi', dept: 'BCH', title: 'Professor' },
    { name: 'Dr. Grace Okonkwo', dept: 'BCH', title: 'Senior Lecturer' },
    { name: 'Dr. Musa Danjuma', dept: 'BCH', title: 'Lecturer I' },
    
    // Microbiology
    { name: 'Prof. Ngozi Eze', dept: 'MCB', title: 'Professor' },
    { name: 'Dr. Emmanuel Bassey', dept: 'MCB', title: 'Senior Lecturer' },
    { name: 'Dr. Aisha Bello', dept: 'MCB', title: 'Lecturer I' },
    
    // Physics with Electronics
    { name: 'Prof. Yakubu Abubakar', dept: 'PHY', title: 'Professor' },
    { name: 'Dr. Fatima Yusuf', dept: 'PHY', title: 'Senior Lecturer' },
    { name: 'Dr. Olumide Ajayi', dept: 'PHY', title: 'Lecturer I' },
    
    // Statistics
    { name: 'Prof. Chinedu Nwosu', dept: 'STA', title: 'Professor' },
    { name: 'Dr. Hadiza Sani', dept: 'STA', title: 'Senior Lecturer' },
    
    // Economics
    { name: 'Prof. Abdullahi Mohammed', dept: 'ECO', title: 'Professor' },
    { name: 'Dr. Blessing Okoro', dept: 'ECO', title: 'Senior Lecturer' },
    { name: 'Dr. Tunde Bakare', dept: 'ECO', title: 'Lecturer I' },
    { name: 'Dr. Maryam Ibrahim', dept: 'ECO', title: 'Lecturer II' },
    
    // Political Science
    { name: 'Prof. Garba Umar', dept: 'PSC', title: 'Professor' },
    { name: 'Dr. Chioma Obi', dept: 'PSC', title: 'Senior Lecturer' },
    { name: 'Dr. Mohammed Salisu', dept: 'PSC', title: 'Lecturer I' },
    { name: 'Dr. Elizabeth Okon', dept: 'PSC', title: 'Lecturer I' },
    
    // Sociology
    { name: 'Prof. Ibrahim Garba', dept: 'SOC', title: 'Professor' },
    { name: 'Dr. Precious Adeleke', dept: 'SOC', title: 'Senior Lecturer' },
    { name: 'Dr. Yusuf Bello', dept: 'SOC', title: 'Lecturer I' },
    
    // Psychology
    { name: 'Prof. Felicia Nwankwo', dept: 'PSY', title: 'Professor' },
    { name: 'Dr. Chibuzor Eze', dept: 'PSY', title: 'Senior Lecturer' },
    { name: 'Dr. Fatimah Abdullahi', dept: 'PSY', title: 'Lecturer I' },
    
    // Law
    { name: 'Prof. SAN Adamu Yunusa', dept: 'LAW', title: 'Professor (SAN)' },
    { name: 'Prof. Amina Suleiman', dept: 'LAW', title: 'Professor' },
    { name: 'Dr. Olusegun Falana', dept: 'LAW', title: 'Senior Lecturer' },
    { name: 'Dr. Chukwuma Nwoko', dept: 'LAW', title: 'Senior Lecturer' },
    { name: 'Dr. Hadiza Usman', dept: 'JIL', title: 'Senior Lecturer' },
    { name: 'Dr. Peter Okoi', dept: 'PUL', title: 'Senior Lecturer' },
  ]

  for (let i = 0; i < lecturerData.length; i++) {
    const lect = lecturerData[i]
    const dept = await prisma.department.findFirst({ where: { code: lect.dept } })
    if (dept) {
      await prisma.lecturer.upsert({
        where: { id: `lecturer-${i + 1}-nsuk` },
        update: {},
        create: {
          id: `lecturer-${i + 1}-nsuk`,
          staffId: `NSUK/STAFF/${(i + 1).toString().padStart(4, '0')}`,
          name: lect.name,
          email: `lecturer${i + 1}@nsuk.edu.ng`,
          departmentId: dept.id,
        },
      })
    }
  }
  console.log('✅ Created', lecturerData.length, 'lecturers')

  // ========================================
  // 8. CREATE STUDENTS (Realistic Distribution)
  // ========================================
  const levels = [100, 200, 300, 400, 500] // 500 for Law
  let createdStudents = 0

  // Nigerian first names
  const firstNames = [
    'Adamu', 'Amina', 'Chinedu', 'Fatima', 'Oluwaseun', 'Ngozi', 'Ibrahim', 'Kemi',
    'Emeka', 'Hadiza', 'Tunde', 'Blessing', 'Yusuf', 'Chioma', 'Musa', 'Grace',
    'Chukwuemeka', 'Aisha', 'Olumide', 'Elizabeth', 'Abdullahi', 'Precious',
    'Oluwadamilola', 'Mohammed', 'Tochukwu', 'Maryam', 'Chibuzor', 'Fatimah',
    'Umar', 'Zainab', 'Oluwafemi', 'Patricia', 'Sani', 'Chidinma', 'Haruna',
    'Nneka', 'Aliyu', 'Obiageli', 'Kabir', 'Temitope', 'Hauwa', 'Nnamdi',
  ]

  // Nigerian last names
  const lastNames = [
    'Adamu', 'Mohammed', 'Okafor', 'Yusuf', 'Adeyemi', 'Eze', 'Ibrahim', 'Okonkwo',
    'Danjuma', 'Bassey', 'Abdullahi', 'Owolabi', 'Nwosu', 'Garba', 'Chukwu',
    'Oyelaran', 'Salisu', 'Adeleke', 'Ngige', 'Bello', 'Umar', 'Adekunle',
    'Ogunleye', 'Nnamdi', 'Suleiman', 'Obi', 'Ahmed', 'Okoro', 'Jacob', 'Elechi',
  ]

  // Student distribution per department (realistic Nigerian university ratios)
  const deptStudentCount: Record<string, { perLevel: number, levels: number[] }> = {
    'CSC': { perLevel: 55, levels: [100, 200, 300, 400] },
    'BCH': { perLevel: 45, levels: [100, 200, 300, 400] },
    'MCB': { perLevel: 40, levels: [100, 200, 300, 400] },
    'PHY': { perLevel: 30, levels: [100, 200, 300, 400] },
    'STA': { perLevel: 35, levels: [100, 200, 300, 400] },
    'ECO': { perLevel: 70, levels: [100, 200, 300, 400] },
    'PSC': { perLevel: 80, levels: [100, 200, 300, 400] },
    'SOC': { perLevel: 50, levels: [100, 200, 300, 400] },
    'PSY': { perLevel: 60, levels: [100, 200, 300, 400] },
    'LAW': { perLevel: 60, levels: [100, 200, 300, 400, 500] },
    'JIL': { perLevel: 45, levels: [100, 200, 300, 400, 500] },
    'PUL': { perLevel: 48, levels: [100, 200, 300, 400, 500] },
  }

  const allDepts = await prisma.department.findMany()
  
  for (const dept of allDepts) {
    const config = deptStudentCount[dept.code] || { perLevel: 40, levels: [100, 200, 300, 400] }
    
    for (const level of config.levels) {
      // Add some variance (+/- 10 students)
      const variance = Math.floor(Math.random() * 21) - 10
      const count = config.perLevel + variance
      
      for (let i = 0; i < count; i++) {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
        const year = 2020 + Math.floor((level - 100) / 100) + Math.floor(Math.random() * 2)
        const regNumber = generateRegNumber(year, dept.code, createdStudents + 1)

        await prisma.student.create({
          data: {
            regNumber,
            name: `${firstName} ${lastName}`,
            email: `${regNumber.toLowerCase().replace(/\//g, '.')}@nsuk.edu.ng`,
            level,
            admissionYear: year,
            departmentId: dept.id,
          },
        })
        createdStudents++
      }
    }
  }
  console.log('✅ Created', createdStudents, 'students')

  // ========================================
  // 9. CREATE STUDENT COURSE REGISTRATIONS (with COs)
  // ========================================
  const students = await prisma.student.findMany()
  const courses = await prisma.course.findMany()

  let registrations = 0
  let coRegistrations = 0

  for (const student of students) {
    // Get courses for student's level and department, plus GST courses
    const studentCourses = courses.filter(c => 
      (c.level === student.level && c.departmentId === student.departmentId) ||
      (c.isShared && c.level <= student.level)
    )

    // Register for 6-9 courses (realistic load)
    const coursesToRegister = randomPick(studentCourses, 8 + Math.floor(Math.random() * 2))
    
    for (const course of coursesToRegister) {
      // Determine if this is a carry-over (realistic rates)
      let status: 'REGISTERED' | 'CARRY_OVER' | 'SPILLOVER' = 'REGISTERED'
      
      // 15% chance for 200L+ students to have COs
      if (student.level >= 200 && Math.random() < 0.15) {
        status = 'CARRY_OVER'
        coRegistrations++
      } 
      // 5% chance for 300L+ students to have spillovers
      else if (student.level >= 300 && Math.random() < 0.05) {
        status = 'SPILLOVER'
        coRegistrations++
      }

      await prisma.studentCourse.create({
        data: {
          studentId: student.id,
          courseId: course.id,
          status,
          semester: 1,
          session: '2025/2026',
        },
      })
      registrations++
    }
  }
  console.log('✅ Created', registrations, 'course registrations')
  console.log('   - Including', coRegistrations, 'carry-over/spillover registrations')

  // ========================================
  // 10. CREATE EXAM PERIOD
  // ========================================
  const examPeriod = await prisma.examPeriod.create({
    data: {
      institutionId: nsuk.id,
      name: 'First Semester Examination 2025/2026',
      session: '2025/2026',
      semester: 1,
      startDate: new Date('2026-06-02'),
      endDate: new Date('2026-06-21'),
      slotsPerDay: 3,
      morningStart: '08:00',
      morningEnd: '11:00',
      afternoonStart: '12:00',
      afternoonEnd: '15:00',
      eveningStart: '16:00',
      eveningEnd: '19:00',
      includeSaturday: true,
      excludeFridays: false,
      status: 'DRAFT',
    },
  })
  console.log('✅ Created exam period:', examPeriod.name)

  // ========================================
  // 11. CREATE SAMPLE CONFLICTS (for demo)
  // ========================================
  // Find a 300L student with potential CO clash
  const sampleStudent = students.find(s => s.level === 300)
  const csc301 = courses.find(c => c.code === 'CSC 301')
  const sta101 = courses.find(c => c.code === 'STA 101')

  if (sampleStudent && csc301 && sta101) {
    // Create CO clash scenario
    await prisma.studentCourse.upsert({
      where: {
        studentId_courseId_session: { studentId: sampleStudent.id, courseId: sta101.id, session: '2025/2026' },
      },
      update: { status: 'CARRY_OVER' },
      create: {
        studentId: sampleStudent.id,
        courseId: sta101.id,
        status: 'CARRY_OVER',
        semester: 1,
        session: '2025/2026',
      },
    })

    await prisma.conflict.create({
      data: {
        examPeriodId: examPeriod.id,
        type: 'CO_CLASH',
        severity: 'CRITICAL',
        status: 'DETECTED',
        description: `Student ${sampleStudent.regNumber} has carry-over exam (STA 101) potentially clashing with current level course (CSC 301)`,
        affectedEntity: sampleStudent.id,
        affectedName: `${sampleStudent.name} (${sampleStudent.regNumber})`,
      },
    })
    console.log('✅ Created sample CO clash for demonstration')
  }

  // Room capacity warning for GST
  const gst111 = courses.find(c => c.code === 'GST 111')
  const mphRoom = await prisma.room.findFirst({ where: { code: 'MPH' } })

  if (gst111 && mphRoom) {
    await prisma.conflict.create({
      data: {
        examPeriodId: examPeriod.id,
        type: 'ROOM_CAPACITY',
        severity: 'WARNING',
        status: 'DETECTED',
        description: `${gst111.code} has high enrollment across all faculties. Verify ${mphRoom.name} capacity is sufficient.`,
        affectedEntity: mphRoom.id,
        affectedName: mphRoom.name,
      },
    })
    console.log('✅ Created sample room capacity warning')
  }

  // ========================================
  // SUMMARY
  // ========================================
  console.log('\n🎉 Seed completed successfully!')
  console.log('\n📊 Summary:')
  console.log(`   - Institution: ${nsuk.name}`)
  console.log(`   - Faculties: ${faculties.length} (Applied Science, Social Science, Law)`)
  console.log(`   - Departments: ${departments.length}`)
  console.log(`   - Rooms: ${rooms.length}`)
  console.log(`   - Courses: ${allCourses.length}`)
  console.log(`   - Lecturers: ${lecturerData.length}`)
  console.log(`   - Students: ${createdStudents}`)
  console.log(`   - CO/Spillover registrations: ${coRegistrations}`)
  console.log('\n📋 Login credentials:')
  console.log('   Super Admin: admin@clashfree.com / admin123')
  console.log('   Institution Admin: ia@nsuk.edu.ng / admin123')
  console.log('   Timetable Officer: to@nsuk.edu.ng / admin123')
  console.log('\n📚 Course Structure:')
  console.log('   - Applied Science: CSC, BCH, MCB, PHY, STA')
  console.log('   - Social Science: ECO, PSC, SOC, PSY')
  console.log('   - Law: LAW, JIL, PUL (LL.B 5-year programme)')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
