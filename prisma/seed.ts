import { PrismaClient, InstitutionType, UserRole, RoomType } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Create Super Admin
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

  // Create NSUK Institution
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

  // Create Faculty of Applied Sciences
  const fas = await prisma.faculty.upsert({
    where: { id: 'faculty-applied-sciences-nsuk' },
    update: {},
    create: {
      id: 'faculty-applied-sciences-nsuk',
      institutionId: nsuk.id,
      name: 'Applied Sciences',
      code: 'FAS',
      description: 'Faculty of Applied Sciences',
    },
  })
  console.log('✅ Created faculty:', fas.code)

  // Create Departments
  const departments = [
    { code: 'CSC', name: 'Computer Science' },
    { code: 'MTH', name: 'Mathematics' },
    { code: 'PHY', name: 'Physics' },
    { code: 'CHM', name: 'Chemistry' },
    { code: 'BCH', name: 'Biochemistry' },
    { code: 'MCB', name: 'Microbiology' },
    { code: 'BOT', name: 'Botany' },
    { code: 'ZOO', name: 'Zoology' },
    { code: 'STA', name: 'Statistics' },
    { code: 'GEO', name: 'Geology' },
    { code: 'SLT', name: 'Science Laboratory Technology' },
  ]

  for (const dept of departments) {
    await prisma.department.upsert({
      where: { id: `dept-${dept.code.toLowerCase()}-nsuk` },
      update: {},
      create: {
        id: `dept-${dept.code.toLowerCase()}-nsuk`,
        facultyId: fas.id,
        code: dept.code,
        name: dept.name,
      },
    })
  }
  console.log('✅ Created', departments.length, 'departments')

  // Create Rooms
  const rooms = [
    { code: 'MPH', name: 'Multi-Purpose Hall', capacity: 1500, type: 'AUDITORIUM' },
    { code: 'AGH', name: 'Assembly Ground Hall', capacity: 800, type: 'EXAM_HALL' },
    { code: 'BLOCK-A-LT1', name: 'Block A Lecture Theatre 1', capacity: 400, type: 'LECTURE_HALL' },
    { code: 'BLOCK-B-LT1', name: 'Block B Lecture Theatre 1', capacity: 350, type: 'LECTURE_HALL' },
    { code: 'CSC-LAB-01', name: 'Computer Lab 1', capacity: 60, type: 'COMPUTER_LAB', hasComputers: true },
    { code: 'CSC-LAB-02', name: 'Computer Lab 2', capacity: 60, type: 'COMPUTER_LAB', hasComputers: true },
    { code: 'PHY-LAB', name: 'Physics Laboratory', capacity: 50, type: 'LABORATORY' },
    { code: 'CHM-LAB', name: 'Chemistry Laboratory', capacity: 50, type: 'LABORATORY' },
    { code: 'BIO-LAB', name: 'Biology Laboratory', capacity: 50, type: 'LABORATORY' },
    { code: 'NH1', name: 'New Hall 1', capacity: 300, type: 'CLASSROOM' },
    { code: 'NH2', name: 'New Hall 2', capacity: 300, type: 'CLASSROOM' },
    { code: 'NH3', name: 'New Hall 3', capacity: 250, type: 'CLASSROOM' },
  ]

  for (const room of rooms) {
    await prisma.room.upsert({
      where: { id: `room-${room.code.toLowerCase()}-nsuk` },
      update: {},
      create: {
        id: `room-${room.code.toLowerCase()}-nsuk`,
        institutionId: nsuk.id,
        facultyId: fas.id,
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

  // Create sample courses
  const cscDept = await prisma.department.findFirst({
    where: { code: 'CSC', facultyId: fas.id },
  })

  if (cscDept) {
    const courses = [
      { code: 'CSC 101', name: 'Introduction to Computer Science', creditUnits: 3, level: 100 },
      { code: 'CSC 102', name: 'Computer Programming I', creditUnits: 3, level: 100 },
      { code: 'CSC 201', name: 'Computer Programming II', creditUnits: 3, level: 200 },
      { code: 'CSC 202', name: 'Data Structures', creditUnits: 3, level: 200 },
      { code: 'CSC 301', name: 'Operating Systems', creditUnits: 3, level: 300 },
      { code: 'CSC 302', name: 'Database Systems', creditUnits: 3, level: 300 },
      { code: 'CSC 401', name: 'Software Engineering', creditUnits: 3, level: 400 },
      { code: 'CSC 402', name: 'Computer Networks', creditUnits: 3, level: 400 },
    ]

    for (const course of courses) {
      await prisma.course.upsert({
        where: { id: `course-${course.code.toLowerCase().replace(' ', '-')}-nsuk` },
        update: {},
        create: {
          id: `course-${course.code.toLowerCase().replace(' ', '-')}-nsuk`,
          institutionId: nsuk.id,
          departmentId: cscDept.id,
          code: course.code,
          name: course.name,
          creditUnits: course.creditUnits,
          level: course.level,
          semester: 1,
        },
      })
    }
    console.log('✅ Created sample courses')
  }

  // Create GST courses (shared across all)
  const gstCourses = [
    { code: 'GST 111', name: 'Communication in English I', creditUnits: 2 },
    { code: 'GST 112', name: 'Nigerian Peoples and Culture', creditUnits: 2 },
    { code: 'GST 113', name: 'Use of Library', creditUnits: 1 },
    { code: 'GST 211', name: 'Philosophy and Logic', creditUnits: 2 },
    { code: 'GST 212', name: 'Peace and Conflict Resolution', creditUnits: 2 },
  ]

  for (const gst of gstCourses) {
    await prisma.course.upsert({
      where: { id: `course-${gst.code.toLowerCase().replace(' ', '-')}-nsuk` },
      update: {},
      create: {
        id: `course-${gst.code.toLowerCase().replace(' ', '-')}-nsuk`,
        institutionId: nsuk.id,
        departmentId: cscDept?.id || '',
        code: gst.code,
        name: gst.name,
        creditUnits: gst.creditUnits,
        level: parseInt(gst.code.split(' ')[1][0] + '00'),
        semester: 1,
        isShared: true,
      },
    })
  }
  console.log('✅ Created GST courses')

  console.log('🎉 Seed completed successfully!')
  console.log('\n📋 Login credentials:')
  console.log('   Email: admin@clashfree.com')
  console.log('   Password: admin123')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
