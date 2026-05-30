import { PrismaClient, InstitutionType, UserRole, RoomType } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

// Helper to generate random reg numbers
function generateRegNumber(year: number, deptCode: string, serial: number): string {
  return `NSUK/${year}/${deptCode}/${serial.toString().padStart(3, '0')}`
}

// Helper to pick random items
function randomPick<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

async function main() {
  console.log('🌱 Starting ClashFree seed...')
  console.log('📋 Creating NSUK simulation data...\n')

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
  // 3. CREATE FACULTIES
  // ========================================
  const faculties = [
    { id: 'faculty-applied-sciences-nsuk', name: 'Applied Sciences', code: 'FAS' },
    { id: 'faculty-natural-sciences-nsuk', name: 'Natural Sciences', code: 'FNS' },
    { id: 'faculty-social-sciences-nsuk', name: 'Social Sciences', code: 'FSS' },
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
  const fasFaculty = await prisma.faculty.findUnique({ where: { id: 'faculty-applied-sciences-nsuk' } })
  const fnsFaculty = await prisma.faculty.findUnique({ where: { id: 'faculty-natural-sciences-nsuk' } })
  const fssFaculty = await prisma.faculty.findUnique({ where: { id: 'faculty-social-sciences-nsuk' } })

  const departments = [
    // Applied Sciences
    { code: 'CSC', name: 'Computer Science', facultyId: fasFaculty!.id },
    { code: 'MTH', name: 'Mathematics', facultyId: fasFaculty!.id },
    { code: 'STA', name: 'Statistics', facultyId: fasFaculty!.id },
    { code: 'GEO', name: 'Geology', facultyId: fasFaculty!.id },
    // Natural Sciences
    { code: 'PHY', name: 'Physics', facultyId: fnsFaculty!.id },
    { code: 'CHM', name: 'Chemistry', facultyId: fnsFaculty!.id },
    { code: 'BCH', name: 'Biochemistry', facultyId: fnsFaculty!.id },
    { code: 'MCB', name: 'Microbiology', facultyId: fnsFaculty!.id },
    { code: 'BOT', name: 'Botany', facultyId: fnsFaculty!.id },
    { code: 'ZOO', name: 'Zoology', facultyId: fnsFaculty!.id },
    { code: 'SLT', name: 'Science Laboratory Technology', facultyId: fnsFaculty!.id },
    // Social Sciences
    { code: 'ECO', name: 'Economics', facultyId: fssFaculty!.id },
    { code: 'POL', name: 'Political Science', facultyId: fssFaculty!.id },
    { code: 'SOC', name: 'Sociology', facultyId: fssFaculty!.id },
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
  // 5. CREATE ROOMS
  // ========================================
  const rooms = [
    // Large venues
    { code: 'MPH', name: 'Multi-Purpose Hall', capacity: 1500, type: 'AUDITORIUM' },
    { code: 'AGH', name: 'Assembly Ground Hall', capacity: 800, type: 'EXAM_HALL' },
    // Lecture theatres
    { code: 'FLT', name: 'Faculty Lecture Theatre', capacity: 500, type: 'LECTURE_HALL' },
    { code: 'LT1', name: 'Lecture Theatre 1', capacity: 400, type: 'LECTURE_HALL' },
    { code: 'LT2', name: 'Lecture Theatre 2', capacity: 350, type: 'LECTURE_HALL' },
    { code: 'LT3', name: 'Lecture Theatre 3', capacity: 300, type: 'LECTURE_HALL' },
    // Classrooms
    { code: 'NH1', name: 'New Hall 1', capacity: 300, type: 'CLASSROOM' },
    { code: 'NH2', name: 'New Hall 2', capacity: 300, type: 'CLASSROOM' },
    { code: 'NH3', name: 'New Hall 3', capacity: 250, type: 'CLASSROOM' },
    { code: 'CR101', name: 'Classroom 101', capacity: 150, type: 'CLASSROOM' },
    { code: 'CR102', name: 'Classroom 102', capacity: 150, type: 'CLASSROOM' },
    { code: 'CR103', name: 'Classroom 103', capacity: 120, type: 'CLASSROOM' },
    // Labs
    { code: 'CSC-LAB1', name: 'Computer Lab 1', capacity: 60, type: 'COMPUTER_LAB', hasComputers: true },
    { code: 'CSC-LAB2', name: 'Computer Lab 2', capacity: 60, type: 'COMPUTER_LAB', hasComputers: true },
    { code: 'PHY-LAB', name: 'Physics Laboratory', capacity: 50, type: 'LABORATORY' },
    { code: 'CHM-LAB', name: 'Chemistry Laboratory', capacity: 50, type: 'LABORATORY' },
    { code: 'BIO-LAB', name: 'Biology Laboratory', capacity: 50, type: 'LABORATORY' },
    { code: 'GEO-LAB', name: 'Geology Laboratory', capacity: 40, type: 'LABORATORY' },
  ]

  for (const room of rooms) {
    await prisma.room.upsert({
      where: { id: `room-${room.code.toLowerCase()}-nsuk` },
      update: {},
      create: {
        id: `room-${room.code.toLowerCase()}-nsuk`,
        institutionId: nsuk.id,
        facultyId: fasFaculty!.id,
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
  // 6. CREATE COURSES
  // ========================================
  const cscDept = await prisma.department.findFirst({ where: { code: 'CSC' } })
  const mthDept = await prisma.department.findFirst({ where: { code: 'MTH' } })
  const phyDept = await prisma.department.findFirst({ where: { code: 'PHY' } })
  const chmDept = await prisma.department.findFirst({ where: { code: 'CHM' } })
  const bchDept = await prisma.department.findFirst({ where: { code: 'BCH' } })
  const mcbDept = await prisma.department.findFirst({ where: { code: 'MCB' } })
  const staDept = await prisma.department.findFirst({ where: { code: 'STA' } })
  const geoDept = await prisma.department.findFirst({ where: { code: 'GEO' } })

  // Define all courses
  const allCourses = [
    // CSC courses
    { code: 'CSC 101', name: 'Introduction to Computer Science', creditUnits: 3, level: 100, departmentId: cscDept!.id, isShared: false },
    { code: 'CSC 102', name: 'Computer Programming I', creditUnits: 3, level: 100, departmentId: cscDept!.id, isShared: false },
    { code: 'CSC 201', name: 'Computer Programming II', creditUnits: 3, level: 200, departmentId: cscDept!.id, isShared: false },
    { code: 'CSC 202', name: 'Data Structures & Algorithms', creditUnits: 3, level: 200, departmentId: cscDept!.id, isShared: false },
    { code: 'CSC 301', name: 'Operating Systems', creditUnits: 3, level: 300, departmentId: cscDept!.id, isShared: false },
    { code: 'CSC 302', name: 'Database Systems', creditUnits: 3, level: 300, departmentId: cscDept!.id, isShared: false },
    { code: 'CSC 401', name: 'Software Engineering', creditUnits: 3, level: 400, departmentId: cscDept!.id, isShared: false },
    { code: 'CSC 402', name: 'Computer Networks', creditUnits: 3, level: 400, departmentId: cscDept!.id, isShared: false },
    
    // MTH courses
    { code: 'MTH 101', name: 'General Mathematics I', creditUnits: 3, level: 100, departmentId: mthDept!.id, isShared: true },
    { code: 'MTH 102', name: 'General Mathematics II', creditUnits: 3, level: 100, departmentId: mthDept!.id, isShared: true },
    { code: 'MTH 201', name: 'Calculus I', creditUnits: 3, level: 200, departmentId: mthDept!.id, isShared: false },
    { code: 'MTH 202', name: 'Linear Algebra', creditUnits: 3, level: 200, departmentId: mthDept!.id, isShared: false },
    { code: 'MTH 301', name: 'Abstract Algebra', creditUnits: 3, level: 300, departmentId: mthDept!.id, isShared: false },
    
    // PHY courses
    { code: 'PHY 101', name: 'General Physics I', creditUnits: 3, level: 100, departmentId: phyDept!.id, isShared: true },
    { code: 'PHY 102', name: 'General Physics II', creditUnits: 3, level: 100, departmentId: phyDept!.id, isShared: true },
    { code: 'PHY 201', name: 'Classical Mechanics', creditUnits: 3, level: 200, departmentId: phyDept!.id, isShared: false },
    { code: 'PHY 301', name: 'Electromagnetism', creditUnits: 3, level: 300, departmentId: phyDept!.id, isShared: false },
    
    // CHM courses
    { code: 'CHM 101', name: 'General Chemistry I', creditUnits: 3, level: 100, departmentId: chmDept!.id, isShared: true },
    { code: 'CHM 102', name: 'General Chemistry II', creditUnits: 3, level: 100, departmentId: chmDept!.id, isShared: true },
    { code: 'CHM 201', name: 'Organic Chemistry I', creditUnits: 3, level: 200, departmentId: chmDept!.id, isShared: false },
    
    // BCH courses
    { code: 'BCH 201', name: 'General Biochemistry', creditUnits: 3, level: 200, departmentId: bchDept!.id, isShared: false },
    { code: 'BCH 301', name: 'Enzymology', creditUnits: 3, level: 300, departmentId: bchDept!.id, isShared: false },
    
    // MCB courses
    { code: 'MCB 201', name: 'General Microbiology', creditUnits: 3, level: 200, departmentId: mcbDept!.id, isShared: false },
    { code: 'MCB 301', name: 'Medical Microbiology', creditUnits: 3, level: 300, departmentId: mcbDept!.id, isShared: false },
    
    // STA courses
    { code: 'STA 101', name: 'Introduction to Statistics', creditUnits: 3, level: 100, departmentId: staDept!.id, isShared: false },
    { code: 'STA 201', name: 'Probability Theory', creditUnits: 3, level: 200, departmentId: staDept!.id, isShared: false },
    
    // GEO courses
    { code: 'GEO 101', name: 'Introduction to Geology', creditUnits: 3, level: 100, departmentId: geoDept!.id, isShared: false },
    { code: 'GEO 201', name: 'Mineralogy', creditUnits: 3, level: 200, departmentId: geoDept!.id, isShared: false },
    
    // GST courses (shared across all departments)
    { code: 'GST 111', name: 'Communication in English I', creditUnits: 2, level: 100, departmentId: cscDept!.id, isShared: true },
    { code: 'GST 112', name: 'Nigerian Peoples and Culture', creditUnits: 2, level: 100, departmentId: cscDept!.id, isShared: true },
    { code: 'GST 113', name: 'Use of Library', creditUnits: 1, level: 100, departmentId: cscDept!.id, isShared: true },
    { code: 'GST 121', name: 'Use of English II', creditUnits: 2, level: 100, departmentId: cscDept!.id, isShared: true },
    { code: 'GST 211', name: 'Philosophy and Logic', creditUnits: 2, level: 200, departmentId: cscDept!.id, isShared: true },
    { code: 'GST 212', name: 'Peace and Conflict Resolution', creditUnits: 2, level: 200, departmentId: cscDept!.id, isShared: true },
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
  // 7. CREATE LECTURERS
  // ========================================
  const lecturerNames = [
    { name: 'Dr. Adamu Ibrahim', dept: 'CSC' },
    { name: 'Prof. Amina Mohammed', dept: 'CSC' },
    { name: 'Dr. Chukwuemeka Okafor', dept: 'MTH' },
    { name: 'Dr. Fatima Yusuf', dept: 'PHY' },
    { name: 'Prof. John Adeyemi', dept: 'CHM' },
    { name: 'Dr. Grace Okonkwo', dept: 'BCH' },
    { name: 'Dr. Musa Danjuma', dept: 'MCB' },
    { name: 'Prof. Ngozi Eze', dept: 'STA' },
    { name: 'Dr. Emmanuel Bassey', dept: 'GEO' },
  ]

  for (let i = 0; i < lecturerNames.length; i++) {
    const lect = lecturerNames[i]
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
  console.log('✅ Created', lecturerNames.length, 'lecturers')

  // ========================================
  // 8. CREATE STUDENTS (with some having COs)
  // ========================================
  const levels = [100, 200, 300, 400]
  const studentCount = 200 // Total students to create
  let createdStudents = 0

  // Nigerian first names
  const firstNames = [
    'Adamu', 'Amina', 'Chinedu', 'Fatima', 'Oluwaseun', 'Ngozi', 'Ibrahim', 'Kemi',
    'Emeka', 'Hadiza', 'Tunde', 'Blessing', 'Yusuf', 'Chioma', 'Musa', 'Grace',
    'Chukwuemeka', 'Aisha', 'Olumide', 'Elizabeth', 'Abdullahi', 'Precious',
    'Oluwadamilola', 'Mohammed', 'Tochukwu', 'Maryam', 'Chibuzor', 'Fatimah',
  ]

  // Nigerian last names
  const lastNames = [
    'Adamu', 'Mohammed', 'Okafor', 'Yusuf', 'Adeyemi', 'Eze', 'Ibrahim', 'Okonkwo',
    'Danjuma', 'Bassey', ' Abdullahi', 'Owolabi', 'Nwosu', 'Garba', 'Chukwu',
    'Oyelaran', 'Salisu', 'Adeleke', 'Ngige', 'Bello', 'Umar', 'Adekunle',
  ]

  for (const dept of await prisma.department.findMany()) {
    for (const level of levels) {
      // Create 15-20 students per department per level
      const count = 15 + Math.floor(Math.random() * 6)
      
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
  // Get all students and courses
  const students = await prisma.student.findMany()
  const courses = await prisma.course.findMany()

  let registrations = 0
  let coRegistrations = 0

  for (const student of students) {
    // Get courses for student's level and department
    const studentCourses = courses.filter(c => 
      (c.level === student.level && c.departmentId === student.departmentId) ||
      c.isShared
    )

    // Register for 5-8 courses
    const coursesToRegister = randomPick(studentCourses, 5 + Math.floor(Math.random() * 4))
    
    for (const course of coursesToRegister) {
      // Determine if this is a carry-over (10% chance for higher level students)
      let status: 'REGISTERED' | 'CARRY_OVER' | 'SPILLOVER' = 'REGISTERED'
      
      if (student.level > 100 && Math.random() < 0.12) {
        // This student has a CO for this course
        status = 'CARRY_OVER'
        coRegistrations++
      } else if (student.level >= 300 && Math.random() < 0.05) {
        // Spillover (rare)
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
      name: 'First Semester Examination',
      session: '2025/2026',
      semester: 1,
      startDate: new Date('2026-06-02'),
      endDate: new Date('2026-06-14'),
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
  // Create a sample CO clash for demonstration
  const sampleStudent = students.find(s => s.level === 300)
  const csc301 = courses.find(c => c.code === 'CSC 301')
  const mth101 = courses.find(c => c.code === 'MTH 101')

  if (sampleStudent && csc301 && mth101) {
    // Ensure this student has both courses (creating a potential CO clash)
    await prisma.studentCourse.upsert({
      where: {
        studentId_courseId_session: { studentId: sampleStudent.id, courseId: csc301.id, session: '2025/2026' },
      },
      update: { status: 'REGISTERED' },
      create: {
        studentId: sampleStudent.id,
        courseId: csc301.id,
        status: 'REGISTERED',
        semester: 1,
        session: '2025/2026',
      },
    })

    await prisma.studentCourse.upsert({
      where: {
        studentId_courseId_session: { studentId: sampleStudent.id, courseId: mth101.id, session: '2025/2026' },
      },
      update: { status: 'CARRY_OVER' },
      create: {
        studentId: sampleStudent.id,
        courseId: mth101.id,
        status: 'CARRY_OVER',
        semester: 1,
        session: '2025/2026',
      },
    })

    // Create a conflict record
    await prisma.conflict.create({
      data: {
        examPeriodId: examPeriod.id,
        type: 'CO_CLASH',
        severity: 'CRITICAL',
        status: 'DETECTED',
        description: `Student ${sampleStudent.regNumber} has carry-over exam (MTH 101) potentially clashing with current level course (CSC 301)`,
        affectedEntity: sampleStudent.id,
        affectedName: `${sampleStudent.name} (${sampleStudent.regNumber})`,
      },
    })
    console.log('✅ Created sample CO clash for demonstration')
  }

  // Create a room capacity conflict
  const gst111 = courses.find(c => c.code === 'GST 111')
  const mphRoom = await prisma.room.findFirst({ where: { code: 'MPH' } })

  if (gst111 && mphRoom) {
    await prisma.conflict.create({
      data: {
        examPeriodId: examPeriod.id,
        type: 'ROOM_CAPACITY',
        severity: 'WARNING',
        status: 'DETECTED',
        description: `${gst111.code} has high enrollment but may exceed ${mphRoom.name} capacity`,
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
  console.log(`   - Faculties: ${faculties.length}`)
  console.log(`   - Departments: ${departments.length}`)
  console.log(`   - Rooms: ${rooms.length}`)
  console.log(`   - Courses: ${allCourses.length}`)
  console.log(`   - Students: ${createdStudents}`)
  console.log(`   - CO/Spillover registrations: ${coRegistrations}`)
  console.log('\n📋 Login credentials:')
  console.log('   Super Admin: admin@clashfree.com / admin123')
  console.log('   Institution Admin: ia@nsuk.edu.ng / admin123')
  console.log('   Timetable Officer: to@nsuk.edu.ng / admin123')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
