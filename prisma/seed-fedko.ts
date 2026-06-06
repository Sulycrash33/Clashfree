import { PrismaClient, RoomType, ConflictType, ConflictSeverity, ConflictStatus, NotificationType } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const t0 = Date.now()
  console.log('=== FEDKO Demo Seed ===')
  console.log('Cleaning...')

  // Clean using deleteMany in order
  await prisma.notification.deleteMany()
  await prisma.activityLog.deleteMany()
  await prisma.invigilatorAssignment.deleteMany()
  await prisma.conflict.deleteMany()
  await prisma.conflictReport.deleteMany()
  await prisma.examSlot.deleteMany()
  await prisma.blackoutDate.deleteMany()
  await prisma.timetableVersion.deleteMany()
  await prisma.lectureSlot.deleteMany()
  await prisma.lectureTimetable.deleteMany()
  await prisma.examPeriod.deleteMany()
  await prisma.studentCourse.deleteMany()
  await prisma.coursePrerequisite.deleteMany()
  await prisma.lecturer.deleteMany()
  await prisma.student.deleteMany()
  await prisma.course.deleteMany()
  await prisma.room.deleteMany()
  await prisma.department.deleteMany()
  await prisma.faculty.deleteMany()
  await prisma.institution.deleteMany()

  // Keep only super admin
  const sa = await prisma.user.findUnique({ where: { email: 'admin@clashfree.com' } })
  if (!sa) {
    await prisma.user.create({ data: { email: 'admin@clashfree.com', passwordHash: await hash('admin123', 12), name: 'Super Admin', role: 'SA' } })
  } else {
    await prisma.user.deleteMany({ where: { id: { not: sa.id } } })
  }
  console.log('Cleaned:', Date.now() - t0, 'ms')

  // INSTITUTION
  const fedko = await prisma.institution.create({
    data: { name: 'Federal University of Development and Knowledge', shortName: 'FEDKO', type: 'FEDERAL_UNI', city: 'Abuja', state: 'FCT', country: 'Nigeria', currentSession: '2025/2026', currentSemester: 2, website: 'https://fedko.edu.ng', emailDomain: 'fedko.edu.ng' }
  })

  // USERS
  const pw = await hash('admin123', 12)
  const ia = await prisma.user.create({ data: { email: 'admin@fedko.edu.ng', passwordHash: pw, name: 'Prof. Adebayo Ogunleye', role: 'IA', institutionId: fedko.id } })
  const toUser = await prisma.user.create({ data: { email: 'officer@fedko.edu.ng', passwordHash: pw, name: 'Dr. Halima Bello', role: 'TO', institutionId: fedko.id } })
  const lc = await prisma.user.create({ data: { email: 'lecturer@fedko.edu.ng', passwordHash: pw, name: 'Dr. Emeka Nwankwo', role: 'LC', institutionId: fedko.id } })
  const st = await prisma.user.create({ data: { email: 'student@fedko.edu.ng', passwordHash: pw, name: 'Aisha Mohammed', role: 'ST', institutionId: fedko.id } })

  // FACULTIES
  const facBatch = [
    { name: 'Faculty of Computing & IT', code: 'FCIT' },
    { name: 'Faculty of Engineering', code: 'FENG' },
    { name: 'Faculty of Management & Social Sciences', code: 'FMSS' },
    { name: 'Faculty of Natural & Applied Sciences', code: 'FNAS' },
    { name: 'Faculty of Arts & Humanities', code: 'FAH' },
  ].map(f => ({ ...f, institutionId: fedko.id }))
  await prisma.faculty.createMany({ data: facBatch })
  const facR = await prisma.faculty.findMany({ where: { institutionId: fedko.id } })
  const facMap: Record<string, string> = {}
  facR.forEach(f => { facMap[f.code] = f.id })

  // DEPARTMENTS
  const deptBatch = [
    { code: 'CSC', name: 'Computer Science', f: 'FCIT' },
    { code: 'INF', name: 'Information Technology', f: 'FCIT' },
    { code: 'CYB', name: 'Cybersecurity', f: 'FCIT' },
    { code: 'SWE', name: 'Software Engineering', f: 'FCIT' },
    { code: 'ECE', name: 'Electrical & Computer Engineering', f: 'FENG' },
    { code: 'CVE', name: 'Civil Engineering', f: 'FENG' },
    { code: 'MCE', name: 'Mechanical Engineering', f: 'FENG' },
    { code: 'CHE', name: 'Chemical Engineering', f: 'FENG' },
    { code: 'ACC', name: 'Accounting', f: 'FMSS' },
    { code: 'ECO', name: 'Economics', f: 'FMSS' },
    { code: 'MGT', name: 'Business Administration', f: 'FMSS' },
    { code: 'POL', name: 'Political Science', f: 'FMSS' },
    { code: 'SOC', name: 'Sociology', f: 'FMSS' },
    { code: 'MTH', name: 'Mathematics', f: 'FNAS' },
    { code: 'PHY', name: 'Physics', f: 'FNAS' },
    { code: 'CHM', name: 'Chemistry', f: 'FNAS' },
    { code: 'BIO', name: 'Biology', f: 'FNAS' },
    { code: 'STA', name: 'Statistics', f: 'FNAS' },
    { code: 'ENG', name: 'English Language', f: 'FAH' },
    { code: 'HIS', name: 'History & Diplomatic Studies', f: 'FAH' },
    { code: 'PHL', name: 'Philosophy', f: 'FAH' },
  ].map(d => ({ code: d.code, name: d.name, facultyId: facMap[d.f], hodName: 'Prof. Ogunleye' }))
  await prisma.department.createMany({ data: deptBatch })
  const deptR = await prisma.department.findMany()
  const deptMap: Record<string, string> = {}
  deptR.forEach(d => { deptMap[d.code] = d.id })

  // ROOMS
  const roomBatch = [
    { code: 'MPH', name: 'Main Multipurpose Hall', cap: 2000, type: 'AUDITORIUM' as RoomType, facId: null, comp: false },
    { code: 'AGH', name: 'Assembly Ground Hall', cap: 1500, type: 'EXAM_HALL' as RoomType, facId: null, comp: false },
    { code: 'FCIT-LT1', name: 'FCIT Lecture Theatre 1', cap: 500, type: 'LECTURE_HALL' as RoomType, facId: facMap.FCIT, comp: false },
    { code: 'FCIT-LT2', name: 'FCIT Lecture Theatre 2', cap: 400, type: 'LECTURE_HALL' as RoomType, facId: facMap.FCIT, comp: false },
    { code: 'FCIT-HALL', name: 'FCIT Exam Hall', cap: 350, type: 'EXAM_HALL' as RoomType, facId: facMap.FCIT, comp: false },
    { code: 'CSC-LAB1', name: 'Computer Lab 1', cap: 80, type: 'COMPUTER_LAB' as RoomType, facId: facMap.FCIT, comp: true },
    { code: 'CSC-LAB2', name: 'Computer Lab 2', cap: 80, type: 'COMPUTER_LAB' as RoomType, facId: facMap.FCIT, comp: true },
    { code: 'CYB-LAB', name: 'Cybersecurity Lab', cap: 50, type: 'COMPUTER_LAB' as RoomType, facId: facMap.FCIT, comp: true },
    { code: 'FCIT-CR1', name: 'FCIT Classroom 1', cap: 120, type: 'CLASSROOM' as RoomType, facId: facMap.FCIT, comp: false },
    { code: 'FCIT-CR2', name: 'FCIT Classroom 2', cap: 100, type: 'CLASSROOM' as RoomType, facId: facMap.FCIT, comp: false },
    { code: 'FENG-LT1', name: 'Engineering LT 1', cap: 600, type: 'LECTURE_HALL' as RoomType, facId: facMap.FENG, comp: false },
    { code: 'FENG-LT2', name: 'Engineering LT 2', cap: 450, type: 'LECTURE_HALL' as RoomType, facId: facMap.FENG, comp: false },
    { code: 'FENG-HALL', name: 'Engineering Exam Hall', cap: 400, type: 'EXAM_HALL' as RoomType, facId: facMap.FENG, comp: false },
    { code: 'ECE-LAB1', name: 'Electronics Lab 1', cap: 60, type: 'LABORATORY' as RoomType, facId: facMap.FENG, comp: false },
    { code: 'ECE-LAB2', name: 'Electronics Lab 2', cap: 60, type: 'LABORATORY' as RoomType, facId: facMap.FENG, comp: false },
    { code: 'CVE-LAB', name: 'Civil Eng Lab', cap: 50, type: 'LABORATORY' as RoomType, facId: facMap.FENG, comp: false },
    { code: 'MCE-LAB', name: 'Mechanical Workshop', cap: 40, type: 'LABORATORY' as RoomType, facId: facMap.FENG, comp: false },
    { code: 'CHE-LAB', name: 'Chemical Eng Lab', cap: 50, type: 'LABORATORY' as RoomType, facId: facMap.FENG, comp: false },
    { code: 'FENG-CR1', name: 'Engineering CR 1', cap: 120, type: 'CLASSROOM' as RoomType, facId: facMap.FENG, comp: false },
    { code: 'FENG-CR2', name: 'Engineering CR 2', cap: 100, type: 'CLASSROOM' as RoomType, facId: facMap.FENG, comp: false },
    { code: 'FMSS-LT1', name: 'Mgt Sciences LT', cap: 500, type: 'LECTURE_HALL' as RoomType, facId: facMap.FMSS, comp: false },
    { code: 'FMSS-LT2', name: 'Social Sciences LT', cap: 400, type: 'LECTURE_HALL' as RoomType, facId: facMap.FMSS, comp: false },
    { code: 'FMSS-HALL', name: 'Mgt Sciences Exam Hall', cap: 350, type: 'EXAM_HALL' as RoomType, facId: facMap.FMSS, comp: false },
    { code: 'FMSS-CR1', name: 'Mgt CR 1', cap: 120, type: 'CLASSROOM' as RoomType, facId: facMap.FMSS, comp: false },
    { code: 'FMSS-CR2', name: 'Mgt CR 2', cap: 100, type: 'CLASSROOM' as RoomType, facId: facMap.FMSS, comp: false },
    { code: 'FMSS-CR3', name: 'Mgt CR 3', cap: 100, type: 'CLASSROOM' as RoomType, facId: facMap.FMSS, comp: false },
    { code: 'FNAS-LT1', name: 'Science LT 1', cap: 500, type: 'LECTURE_HALL' as RoomType, facId: facMap.FNAS, comp: false },
    { code: 'FNAS-LT2', name: 'Science LT 2', cap: 400, type: 'LECTURE_HALL' as RoomType, facId: facMap.FNAS, comp: false },
    { code: 'FNAS-HALL', name: 'Science Exam Hall', cap: 350, type: 'EXAM_HALL' as RoomType, facId: facMap.FNAS, comp: false },
    { code: 'PHY-LAB', name: 'Physics Lab', cap: 60, type: 'LABORATORY' as RoomType, facId: facMap.FNAS, comp: false },
    { code: 'CHM-LAB1', name: 'Chemistry Lab', cap: 60, type: 'LABORATORY' as RoomType, facId: facMap.FNAS, comp: false },
    { code: 'BIO-LAB', name: 'Biology Lab', cap: 60, type: 'LABORATORY' as RoomType, facId: facMap.FNAS, comp: false },
    { code: 'MTH-LAB', name: 'Maths Computing Lab', cap: 50, type: 'COMPUTER_LAB' as RoomType, facId: facMap.FNAS, comp: true },
    { code: 'FNAS-CR1', name: 'Science CR 1', cap: 100, type: 'CLASSROOM' as RoomType, facId: facMap.FNAS, comp: false },
    { code: 'FNAS-CR2', name: 'Science CR 2', cap: 100, type: 'CLASSROOM' as RoomType, facId: facMap.FNAS, comp: false },
    { code: 'FAH-LT1', name: 'Arts LT 1', cap: 450, type: 'LECTURE_HALL' as RoomType, facId: facMap.FAH, comp: false },
    { code: 'FAH-LT2', name: 'Arts LT 2', cap: 350, type: 'LECTURE_HALL' as RoomType, facId: facMap.FAH, comp: false },
    { code: 'FAH-HALL', name: 'Arts Exam Hall', cap: 300, type: 'EXAM_HALL' as RoomType, facId: facMap.FAH, comp: false },
    { code: 'FAH-CR1', name: 'Arts CR 1', cap: 100, type: 'CLASSROOM' as RoomType, facId: facMap.FAH, comp: false },
    { code: 'FAH-CR2', name: 'Arts CR 2', cap: 100, type: 'CLASSROOM' as RoomType, facId: facMap.FAH, comp: false },
    { code: 'LANG-LAB', name: 'Language Lab', cap: 60, type: 'COMPUTER_LAB' as RoomType, facId: facMap.FAH, comp: true },
    { code: 'CR101', name: 'Classroom 101', cap: 150, type: 'CLASSROOM' as RoomType, facId: null, comp: false },
    { code: 'CR102', name: 'Classroom 102', cap: 150, type: 'CLASSROOM' as RoomType, facId: null, comp: false },
    { code: 'CR103', name: 'Classroom 103', cap: 120, type: 'CLASSROOM' as RoomType, facId: null, comp: false },
  ].map(r => ({
    institutionId: fedko.id, facultyId: r.facId,
    code: r.code, name: r.name, capacity: r.cap, type: r.type,
    hasProjector: true, hasAC: true, hasComputers: r.comp,
    building: 'Main Campus',
  }))
  await prisma.room.createMany({ data: roomBatch })
  const roomR = await prisma.room.findMany()
  const roomMap: Record<string, string> = {}
  roomR.forEach(r => { roomMap[r.code] = r.id })

  // COURSES
  const cDefs = [
    { c: 'GST 111', n: 'Communication in English I', u: 2, l: 100, d: 'CSC', s: true, lab: false },
    { c: 'GST 112', n: 'Nigerian Peoples and Culture', u: 2, l: 100, d: 'CSC', s: true, lab: false },
    { c: 'GST 113', n: 'Use of Library', u: 1, l: 100, d: 'CSC', s: true, lab: false },
    { c: 'GST 121', n: 'Use of English II', u: 2, l: 100, d: 'CSC', s: true, lab: false },
    { c: 'GST 122', n: 'Intro to Social Sciences', u: 2, l: 100, d: 'CSC', s: true, lab: false },
    { c: 'GST 211', n: 'Philosophy and Logic', u: 2, l: 200, d: 'CSC', s: true, lab: false },
    { c: 'GST 212', n: 'Peace and Conflict Resolution', u: 2, l: 200, d: 'CSC', s: true, lab: false },
    { c: 'GST 213', n: 'Intro to Entrepreneurship', u: 2, l: 200, d: 'CSC', s: true, lab: false },
    { c: 'GST 311', n: 'Science, Technology & Society', u: 2, l: 300, d: 'CSC', s: true, lab: false },
    { c: 'CSC 101', n: 'Intro to Computer Science', u: 3, l: 100, d: 'CSC', s: false, lab: false },
    { c: 'CSC 102', n: 'Programming I (Python)', u: 3, l: 100, d: 'CSC', s: false, lab: true },
    { c: 'CSC 201', n: 'Programming II (Java)', u: 3, l: 200, d: 'CSC', s: false, lab: true },
    { c: 'CSC 202', n: 'Data Structures & Algorithms', u: 3, l: 200, d: 'CSC', s: false, lab: false },
    { c: 'CSC 203', n: 'Computer Org & Architecture', u: 3, l: 200, d: 'CSC', s: false, lab: false },
    { c: 'CSC 301', n: 'Operating Systems', u: 3, l: 300, d: 'CSC', s: false, lab: true },
    { c: 'CSC 302', n: 'Database Systems', u: 3, l: 300, d: 'CSC', s: false, lab: true },
    { c: 'CSC 303', n: 'Software Engineering', u: 3, l: 300, d: 'CSC', s: false, lab: false },
    { c: 'CSC 304', n: 'Web Application Dev', u: 3, l: 300, d: 'CSC', s: false, lab: true },
    { c: 'CSC 401', n: 'Computer Networks', u: 3, l: 400, d: 'CSC', s: false, lab: false },
    { c: 'CSC 402', n: 'Artificial Intelligence', u: 3, l: 400, d: 'CSC', s: false, lab: true },
    { c: 'CSC 403', n: 'Cybersecurity Fundamentals', u: 3, l: 400, d: 'CSC', s: false, lab: false },
    { c: 'CSC 499', n: 'Final Year Project', u: 6, l: 400, d: 'CSC', s: false, lab: false },
    { c: 'INF 101', n: 'Intro to IT', u: 3, l: 100, d: 'INF', s: false, lab: false },
    { c: 'INF 201', n: 'Systems Analysis & Design', u: 3, l: 200, d: 'INF', s: false, lab: false },
    { c: 'INF 202', n: 'Networking Fundamentals', u: 3, l: 200, d: 'INF', s: false, lab: true },
    { c: 'INF 301', n: 'Information Security', u: 3, l: 300, d: 'INF', s: false, lab: true },
    { c: 'INF 401', n: 'Cloud Computing', u: 3, l: 400, d: 'INF', s: false, lab: true },
    { c: 'CYB 101', n: 'Intro to Cybersecurity', u: 3, l: 100, d: 'CYB', s: false, lab: false },
    { c: 'CYB 201', n: 'Network Security', u: 3, l: 200, d: 'CYB', s: false, lab: true },
    { c: 'CYB 301', n: 'Ethical Hacking', u: 3, l: 300, d: 'CYB', s: false, lab: true },
    { c: 'CYB 401', n: 'Penetration Testing', u: 3, l: 400, d: 'CYB', s: false, lab: true },
    { c: 'SWE 101', n: 'Intro to Software Eng', u: 3, l: 100, d: 'SWE', s: false, lab: false },
    { c: 'SWE 201', n: 'Requirements Engineering', u: 3, l: 200, d: 'SWE', s: false, lab: false },
    { c: 'SWE 301', n: 'DevOps & CI/CD', u: 3, l: 300, d: 'SWE', s: false, lab: true },
    { c: 'SWE 401', n: 'Microservices Architecture', u: 3, l: 400, d: 'SWE', s: false, lab: false },
    { c: 'ECE 101', n: 'Intro to Electrical Eng', u: 3, l: 100, d: 'ECE', s: false, lab: true },
    { c: 'ECE 102', n: 'Circuit Theory I', u: 3, l: 100, d: 'ECE', s: false, lab: true },
    { c: 'ECE 201', n: 'Circuit Theory II', u: 3, l: 200, d: 'ECE', s: false, lab: true },
    { c: 'ECE 202', n: 'Electronics I', u: 3, l: 200, d: 'ECE', s: false, lab: true },
    { c: 'ECE 301', n: 'Power Systems', u: 3, l: 300, d: 'ECE', s: false, lab: false },
    { c: 'ECE 401', n: 'Digital Signal Processing', u: 3, l: 400, d: 'ECE', s: false, lab: false },
    { c: 'CVE 101', n: 'Intro to Civil Eng', u: 3, l: 100, d: 'CVE', s: false, lab: true },
    { c: 'CVE 201', n: 'Structural Analysis', u: 3, l: 200, d: 'CVE', s: false, lab: true },
    { c: 'CVE 301', n: 'Structural Design', u: 3, l: 300, d: 'CVE', s: false, lab: false },
    { c: 'MCE 101', n: 'Intro to Mechanical Eng', u: 3, l: 100, d: 'MCE', s: false, lab: true },
    { c: 'MCE 201', n: 'Thermodynamics', u: 3, l: 200, d: 'MCE', s: false, lab: false },
    { c: 'CHE 101', n: 'Intro to Chemical Eng', u: 3, l: 100, d: 'CHE', s: false, lab: true },
    { c: 'CHE 201', n: 'Chemical Processes', u: 3, l: 200, d: 'CHE', s: false, lab: true },
    { c: 'ACC 101', n: 'Principles of Accounting I', u: 3, l: 100, d: 'ACC', s: false, lab: false },
    { c: 'ACC 102', n: 'Principles of Accounting II', u: 3, l: 100, d: 'ACC', s: false, lab: false },
    { c: 'ACC 201', n: 'Financial Accounting', u: 3, l: 200, d: 'ACC', s: false, lab: false },
    { c: 'ACC 301', n: 'Taxation', u: 3, l: 300, d: 'ACC', s: false, lab: false },
    { c: 'ACC 401', n: 'Management Accounting', u: 3, l: 400, d: 'ACC', s: false, lab: false },
    { c: 'ECO 101', n: 'Intro to Economics I', u: 3, l: 100, d: 'ECO', s: false, lab: false },
    { c: 'ECO 102', n: 'Intro to Economics II', u: 3, l: 100, d: 'ECO', s: false, lab: false },
    { c: 'ECO 201', n: 'Microeconomic Theory', u: 3, l: 200, d: 'ECO', s: false, lab: false },
    { c: 'ECO 301', n: 'Econometrics', u: 3, l: 300, d: 'ECO', s: false, lab: false },
    { c: 'ECO 401', n: 'International Economics', u: 3, l: 400, d: 'ECO', s: false, lab: false },
    { c: 'MGT 101', n: 'Intro to Business Admin', u: 3, l: 100, d: 'MGT', s: false, lab: false },
    { c: 'MGT 201', n: 'Principles of Management', u: 3, l: 200, d: 'MGT', s: false, lab: false },
    { c: 'MGT 301', n: 'Human Resource Mgmt', u: 3, l: 300, d: 'MGT', s: false, lab: false },
    { c: 'MGT 401', n: 'Strategic Management', u: 3, l: 400, d: 'MGT', s: false, lab: false },
    { c: 'POL 101', n: 'Intro to Political Science', u: 3, l: 100, d: 'POL', s: false, lab: false },
    { c: 'POL 201', n: 'Nigerian Government', u: 3, l: 200, d: 'POL', s: false, lab: false },
    { c: 'POL 301', n: 'Comparative Politics', u: 3, l: 300, d: 'POL', s: false, lab: false },
    { c: 'SOC 101', n: 'Intro to Sociology', u: 3, l: 100, d: 'SOC', s: false, lab: false },
    { c: 'SOC 201', n: 'Sociological Theory', u: 3, l: 200, d: 'SOC', s: false, lab: false },
    { c: 'SOC 301', n: 'Industrial Sociology', u: 3, l: 300, d: 'SOC', s: false, lab: false },
    { c: 'MTH 101', n: 'General Mathematics I', u: 3, l: 100, d: 'MTH', s: true, lab: false },
    { c: 'MTH 102', n: 'General Mathematics II', u: 3, l: 100, d: 'MTH', s: true, lab: false },
    { c: 'MTH 201', n: 'Linear Algebra', u: 3, l: 200, d: 'MTH', s: false, lab: false },
    { c: 'MTH 301', n: 'Real Analysis', u: 3, l: 300, d: 'MTH', s: false, lab: false },
    { c: 'PHY 101', n: 'General Physics I', u: 3, l: 100, d: 'PHY', s: true, lab: true },
    { c: 'PHY 102', n: 'General Physics II', u: 3, l: 100, d: 'PHY', s: true, lab: true },
    { c: 'PHY 201', n: 'Classical Mechanics', u: 3, l: 200, d: 'PHY', s: false, lab: true },
    { c: 'PHY 301', n: 'Quantum Mechanics', u: 3, l: 300, d: 'PHY', s: false, lab: false },
    { c: 'CHM 101', n: 'General Chemistry I', u: 3, l: 100, d: 'CHM', s: true, lab: true },
    { c: 'CHM 102', n: 'General Chemistry II', u: 3, l: 100, d: 'CHM', s: true, lab: true },
    { c: 'CHM 201', n: 'Organic Chemistry', u: 3, l: 200, d: 'CHM', s: false, lab: true },
    { c: 'CHM 301', n: 'Analytical Chemistry', u: 3, l: 300, d: 'CHM', s: false, lab: true },
    { c: 'BIO 101', n: 'General Biology I', u: 3, l: 100, d: 'BIO', s: true, lab: true },
    { c: 'BIO 102', n: 'General Biology II', u: 3, l: 100, d: 'BIO', s: true, lab: true },
    { c: 'BIO 201', n: 'Cell Biology', u: 3, l: 200, d: 'BIO', s: false, lab: true },
    { c: 'STA 101', n: 'Intro to Statistics', u: 3, l: 100, d: 'STA', s: true, lab: false },
    { c: 'STA 201', n: 'Probability Theory', u: 3, l: 200, d: 'STA', s: false, lab: false },
    { c: 'ENG 101', n: 'English Grammar & Usage', u: 3, l: 100, d: 'ENG', s: false, lab: false },
    { c: 'ENG 201', n: 'African Literature', u: 3, l: 200, d: 'ENG', s: false, lab: false },
    { c: 'HIS 101', n: 'Intro to History', u: 3, l: 100, d: 'HIS', s: false, lab: false },
    { c: 'HIS 201', n: 'Nigerian History', u: 3, l: 200, d: 'HIS', s: false, lab: false },
    { c: 'PHL 101', n: 'Intro to Philosophy', u: 3, l: 100, d: 'PHL', s: false, lab: false },
    { c: 'PHL 201', n: 'Logic & Critical Thinking', u: 3, l: 200, d: 'PHL', s: false, lab: false },
  ]

  const courseBatch = cDefs.map(c => ({
    institutionId: fedko.id, departmentId: deptMap[c.d],
    code: c.c, name: c.n, creditUnits: c.u, level: c.l,
    semester: c.l <= 200 ? 1 : 2,
    isShared: c.s, requiresLab: c.lab,
  }))
  await prisma.course.createMany({ data: courseBatch })
  const courseR = await prisma.course.findMany()
  const courseMap: Record<string, string> = {}
  courseR.forEach(c => { courseMap[c.code] = c.id })

  // LECTURERS
  const demoLec = await prisma.lecturer.create({
    data: { departmentId: deptMap.CSC, userId: lc.id, staffId: 'FEDKO/CSC/0001', name: 'Dr. Emeka Nwankwo', email: 'lecturer@fedko.edu.ng', phone: '+2348012345678', rank: 'Senior Lecturer', specialization: 'AI & Machine Learning', unavailableDays: '["friday"]' }
  })

  const lecBatch = [
    'Prof. Funke Adeyemi|FEDKO/CSC/0002|CSC|f.adeyemi@fedko.edu.ng',
    'Dr. Yusuf Abdullahi|FEDKO/INF/0001|INF|y.abdullahi@fedko.edu.ng',
    'Dr. Grace Okonkwo|FEDKO/CYB/0001|CYB|g.okonkwo@fedko.edu.ng',
    'Prof. Ibrahim Musa|FEDKO/SWE/0001|SWE|i.musa@fedko.edu.ng',
    'Dr. Chioma Eze|FEDKO/ECE/0001|ECE|c.eze@fedko.edu.ng',
    'Dr. Tunde Bakare|FEDKO/CVE/0001|CVE|t.bakare@fedko.edu.ng',
    'Prof. Amina Sule|FEDKO/ACC/0001|ACC|a.sule@fedko.edu.ng',
    'Dr. Obi Nwosu|FEDKO/ECO/0001|ECO|o.nwosu@fedko.edu.ng',
    'Dr. Fatima Bello|FEDKO/MGT/0001|MGT|f.bello@fedko.edu.ng',
    'Prof. Segun Adebanjo|FEDKO/POL/0001|POL|s.adebanjo@fedko.edu.ng',
    'Dr. Kemi Olatunji|FEDKO/SOC/0001|SOC|k.olatunji@fedko.edu.ng',
    'Dr. Ahmed Goni|FEDKO/MTH/0001|MTH|a.goni@fedko.edu.ng',
    'Dr. Ngozi Anyanwu|FEDKO/PHY/0001|PHY|n.anyanwu@fedko.edu.ng',
    'Dr. Sani Bello|FEDKO/CHM/0001|CHM|s.bello@fedko.edu.ng',
    'Dr. Blessing Okoro|FEDKO/BIO/0001|BIO|b.okoro@fedko.edu.ng',
  ].map(l => {
    const [name, staffId, dept, email] = l.split('|')
    return { departmentId: deptMap[dept], staffId, name, email, phone: '+2348099999999', rank: 'Senior Lecturer', specialization: 'General' }
  })
  await prisma.lecturer.createMany({ data: lecBatch })

  // Assign demo lecturer to courses
  for (const code of ['CSC 301', 'CSC 401', 'CSC 402']) {
    if (courseMap[code]) await prisma.course.update({ where: { id: courseMap[code] }, data: { lecturerId: demoLec.id } })
  }

  // STUDENTS
  await prisma.student.create({
    data: { departmentId: deptMap.CSC, userId: st.id, regNumber: 'FEDKO/2022/CSC/0001', name: 'Aisha Mohammed', email: 'student@fedko.edu.ng', level: 300, admissionYear: 2022 }
  })

  const fnames = ['Chinedu', 'Fatima', 'Emeka', 'Blessing', 'Abubakar', 'Chioma', 'Yusuf', 'Ngozi', 'Ibrahim', 'Tunde', 'Halima', 'Obi', 'Amina', 'Sani', 'Bukola', 'Kabiru', 'Yetunde', 'Mustapha', 'Nike', 'Uche']
  const lnames = ['Okafor', 'Bello', 'Nwankwo', 'Okoro', 'Abdullahi', 'Eze', 'Bakare', 'Sule', 'Nwosu', 'Adeyemi', 'Goni', 'Anyanwu', 'Ogundimu', 'Madu', 'Lawal', 'Taylor']
  const dcodes = Object.keys(deptMap)
  let sIdx = 1
  const studentBatch: any[] = []
  for (const dc of dcodes) {
    for (const level of [100, 200, 300, 400]) {
      for (let i = 0; i < 2; i++) {
        sIdx++
        studentBatch.push({
          departmentId: deptMap[dc],
          regNumber: `FEDKO/${2025 - level / 100}/${dc}/${sIdx.toString().padStart(4, '0')}`,
          name: `${fnames[sIdx % fnames.length]} ${lnames[sIdx % lnames.length]}`,
          level, admissionYear: 2025 - level / 100,
          isSpillover: Math.random() > 0.9,
        })
      }
    }
  }
  // Insert students in chunks
  for (let i = 0; i < studentBatch.length; i += 10) {
    await prisma.student.createMany({ data: studentBatch.slice(i, i + 10) })
  }
  console.log(`Students: ${studentBatch.length + 1}`)

  // EXAM PERIOD
  const ep = await prisma.examPeriod.create({
    data: {
      institutionId: fedko.id, name: 'Second Semester Examination 2025/2026',
      session: '2025/2026', semester: 2,
      startDate: new Date('2026-06-15'), endDate: new Date('2026-07-20'),
      slotsPerDay: 3, slotDuration: 180,
      morningStart: '08:00', morningEnd: '11:00', afternoonStart: '12:00', afternoonEnd: '15:00', eveningStart: '16:00', eveningEnd: '19:00',
      includeSaturday: true, excludeFridays: true,
      status: 'PUBLISHED', publishedAt: new Date('2026-06-01'),
    }
  })

  await prisma.blackoutDate.createMany({
    data: [
      { examPeriodId: ep.id, date: new Date('2026-06-18'), reason: 'Democracy Day' },
      { examPeriodId: ep.id, date: new Date('2026-06-25'), reason: 'Eid ul-Adha' },
    ]
  })

  // EXAM SLOTS
  const examCourses = courseR.filter(c => c.level >= 200)
  const examRooms = roomR.filter(r => ['EXAM_HALL', 'AUDITORIUM', 'LECTURE_HALL', 'CLASSROOM'].includes(r.type))
  const edates = ['2026-06-15', '2026-06-16', '2026-06-17', '2026-06-19', '2026-06-20', '2026-06-21', '2026-06-22', '2026-06-23', '2026-06-24', '2026-06-26', '2026-06-27', '2026-06-28', '2026-06-29', '2026-06-30', '2026-07-01', '2026-07-02', '2026-07-03', '2026-07-04', '2026-07-06', '2026-07-07']
  const examSlotBatch: any[] = []
  for (let i = 0; i < examCourses.length; i++) {
    const ds = edates[Math.floor(i / 3) % edates.length]
    const sn = (i % 3) + 1
    const st = sn === 1 ? '08:00' : sn === 2 ? '12:00' : '16:00'
    const et = sn === 1 ? '11:00' : sn === 2 ? '15:00' : '19:00'
    examSlotBatch.push({ examPeriodId: ep.id, courseId: examCourses[i].id, roomId: examRooms[i % examRooms.length].id, date: new Date(ds), dayOfWeek: new Date(ds).getDay(), slotNumber: sn, startTime: st, endTime: et, status: i < 10 ? 'COMPLETED' : 'SCHEDULED' })
  }
  for (let i = 0; i < examSlotBatch.length; i += 20) {
    await prisma.examSlot.createMany({ data: examSlotBatch.slice(i, i + 20) })
  }
  console.log(`Exam slots: ${examSlotBatch.length}`)

  // LECTURE TIMETABLE
  const lt = await prisma.lectureTimetable.create({
    data: { institutionId: fedko.id, name: 'Second Semester 2025/2026', session: '2025/2026', semester: 2, startDate: new Date('2026-02-15'), endDate: new Date('2026-06-14'), status: 'PUBLISHED', publishedAt: new Date('2026-02-10') }
  })

  const days = [1, 2, 3, 4, 6]
  const ts = [{ s: '08:00', e: '10:00' }, { s: '10:00', e: '12:00' }, { s: '14:00', e: '16:00' }]
  const lecSlotBatch: any[] = []
  for (let i = 0; i < courseR.length; i++) {
    lecSlotBatch.push({ lectureTimetableId: lt.id, courseId: courseR[i].id, roomId: roomR[i % roomR.length].id, dayOfWeek: days[i % days.length], startTime: ts[i % ts.length].s, endTime: ts[i % ts.length].e, status: 'ACTIVE' })
  }
  for (let i = 0; i < lecSlotBatch.length; i += 20) {
    await prisma.lectureSlot.createMany({ data: lecSlotBatch.slice(i, i + 20) })
  }
  console.log(`Lecture slots: ${lecSlotBatch.length}`)

  // CONFLICTS, REPORTS, VERSIONS, NOTIFICATIONS
  await prisma.conflict.createMany({
    data: [
      { examPeriodId: ep.id, type: 'STUDENT_CLASH', severity: 'CRITICAL', status: 'DETECTED', description: 'Student has CSC 301 and MTH 201 at same time', affectedEntity: 'demo-student', affectedName: 'Aisha Mohammed' },
      { examPeriodId: ep.id, type: 'ROOM_CLASH', severity: 'WARNING', status: 'RESOLVED', description: 'FCIT-LT1 double-booked', affectedEntity: 'room-fcit-lt1', affectedName: 'FCIT LT1' },
      { examPeriodId: ep.id, type: 'LECTURER_CLASH', severity: 'CRITICAL', status: 'ACKNOWLEDGED', description: 'Dr. Nwankwo has two invigilations', affectedEntity: demoLec.id, affectedName: 'Dr. Emeka Nwankwo' },
      { examPeriodId: ep.id, type: 'ROOM_CAPACITY', severity: 'WARNING', status: 'DETECTED', description: 'ECO 201 exceeds room capacity', affectedEntity: 'room-fmss-cr1', affectedName: 'Mgt CR 1' },
      { examPeriodId: ep.id, type: 'CO_CLASH', severity: 'INFO', status: 'DETECTED', description: 'Carry-over students clash detected', affectedEntity: 'dept-csc', affectedName: 'Computer Science' },
    ]
  })

  await prisma.conflictReport.create({ data: { examPeriodId: ep.id, totalConflicts: 5, criticalCount: 2, warningCount: 2, infoCount: 1, status: 'REVIEWED', reviewedBy: ia.id, reviewedAt: new Date('2026-06-02'), notes: 'Room clashes resolved.' } })
  await prisma.timetableVersion.create({ data: { examPeriodId: ep.id, version: 1, changes: JSON.stringify({ desc: 'Initial timetable' }), publishedBy: ia.id, publishedAt: new Date('2026-06-01'), isCurrent: true } })

  await prisma.notification.createMany({
    data: [
      { userId: ia.id, title: 'Exam Timetable Published', message: 'Second semester exam timetable published.', type: 'SUCCESS' as NotificationType, actionUrl: '/dashboard/exam-timetable' },
      { userId: ia.id, title: 'Critical Conflicts Detected', message: '2 critical conflicts need attention.', type: 'CONFLICT_DETECTED' as NotificationType, actionUrl: '/dashboard/conflicts' },
      { userId: toUser.id, title: 'New Exam Period', message: 'Review and generate schedule.', type: 'INFO' as NotificationType, actionUrl: '/dashboard/exam-timetable' },
      { userId: lc.id, title: 'Schedule Updated', message: 'Invigilation schedule updated.', type: 'SCHEDULE_CHANGE' as NotificationType, actionUrl: '/dashboard/lecturer-schedule' },
      { userId: st.id, title: 'Exam Timetable Available', message: 'Your personal timetable is ready.', type: 'INFO' as NotificationType, actionUrl: '/dashboard/my-timetable' },
    ]
  })

  // SUMMARY
  console.log(`\n=== Done in ${Date.now() - t0}ms ===`)
  const c = await Promise.all([
    prisma.institution.count(), prisma.user.count(), prisma.faculty.count(),
    prisma.department.count(), prisma.course.count(), prisma.room.count(),
    prisma.lecturer.count(), prisma.student.count(), prisma.examSlot.count(),
    prisma.lectureSlot.count(), prisma.conflict.count(), prisma.notification.count(),
  ])
  console.log(`Inst:${c[0]} Users:${c[1]} Facs:${c[2]} Depts:${c[3]} Courses:${c[4]} Rooms:${c[5]} Lec:${c[6]} Stu:${c[7]} ExamSlots:${c[8]} LecSlots:${c[9]} Conflicts:${c[10]} Notif:${c[11]}`)
  console.log('\nAccounts: admin@clashfree.com / admin@fedko.edu.ng / officer@fedko.edu.ng / lecturer@fedko.edu.ng / student@fedko.edu.ng (all: admin123)')
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
