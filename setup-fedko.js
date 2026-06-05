const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Fixing database - Removing NSUK, keeping FEDKO...\n');
  
  // 1. Delete all NSUK-related data
  console.log('🗑️  Deleting NSUK data...');
  
  // Get NSUK institution
  const nsuk = await prisma.institution.findUnique({
    where: { shortName: 'NSUK' }
  });
  
  if (nsuk) {
    // Delete all NSUK data cascading
    await prisma.examSlot.deleteMany({
      where: { examPeriod: { institutionId: nsuk.id } }
    });
    await prisma.examPeriod.deleteMany({
      where: { institutionId: nsuk.id }
    });
    await prisma.lectureSlot.deleteMany({
      where: { lectureTimetable: { institutionId: nsuk.id } }
    });
    await prisma.lectureTimetable.deleteMany({
      where: { institutionId: nsuk.id }
    });
    await prisma.conflict.deleteMany({
      where: { examPeriod: { institutionId: nsuk.id } }
    });
    await prisma.studentCourse.deleteMany({
      where: { student: { department: { faculty: { institutionId: nsuk.id } } } }
    });
    await prisma.student.deleteMany({
      where: { department: { faculty: { institutionId: nsuk.id } } }
    });
    await prisma.lecturer.deleteMany({
      where: { department: { faculty: { institutionId: nsuk.id } } }
    });
    await prisma.course.deleteMany({
      where: { institutionId: nsuk.id }
    });
    await prisma.room.deleteMany({
      where: { institutionId: nsuk.id }
    });
    await prisma.department.deleteMany({
      where: { faculty: { institutionId: nsuk.id } }
    });
    await prisma.faculty.deleteMany({
      where: { institutionId: nsuk.id }
    });
    await prisma.institution.delete({
      where: { id: nsuk.id }
    });
    console.log('✅ NSUK institution deleted');
  } else {
    console.log('⚠️  NSUK institution not found');
  }
  
  // 2. Delete NSUK users
  await prisma.user.deleteMany({
    where: { email: { endsWith: '@nsuk.edu.ng' } }
  });
  console.log('✅ NSUK users deleted');
  
  // 3. Create or update FEDKO institution
  console.log('\n🏫 Setting up FEDKO (Federal University of Konoha)...');
  
  const fedko = await prisma.institution.upsert({
    where: { shortName: 'FEDKO' },
    update: {
      name: 'Federal University of Konoha',
      type: 'FEDERAL_UNI',
      city: 'Konoha',
      state: 'Fire State',
      country: 'Nigeria',
      currentSession: '2025/2026',
      currentSemester: 1,
    },
    create: {
      name: 'Federal University of Konoha',
      shortName: 'FEDKO',
      type: 'FEDERAL_UNI',
      city: 'Konoha',
      state: 'Fire State',
      country: 'Nigeria',
      currentSession: '2025/2026',
      currentSemester: 1,
    },
  });
  console.log('✅ FEDKO institution created/updated');
  
  // 4. Create demo users for FEDKO
  console.log('\n👥 Creating FEDKO demo users...');
  
  const password = await bcrypt.hash('admin123', 12);
  
  const demoUsers = [
    { email: 'admin@clashfree.com', name: 'Super Admin', role: 'SA', institutionId: null },
    { email: 'admin@fedko.edu.ng', name: 'Dr. Sarutobi Hiruzen', role: 'IA', institutionId: fedko.id },
    { email: 'officer@fedko.edu.ng', name: 'Shikamaru Nara', role: 'TO', institutionId: fedko.id },
    { email: 'lecturer@fedko.edu.ng', name: 'Kakashi Hatake', role: 'LC', institutionId: fedko.id },
    { email: 'student@fedko.edu.ng', name: 'Naruto Uzumaki', role: 'ST', institutionId: fedko.id },
  ];
  
  for (const user of demoUsers) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        role: user.role,
        institutionId: user.institutionId,
        isActive: true,
      },
      create: {
        email: user.email,
        passwordHash: password,
        name: user.name,
        role: user.role,
        institutionId: user.institutionId,
        isActive: true,
      },
    });
    console.log(`✅ Created/updated: ${user.email} (${user.role})`);
  }
  
  // 5. Create FEDKO faculties
  console.log('\n📚 Creating FEDKO faculties...');
  
  const faculties = [
    { code: 'FAD', name: 'Faculty of Arts and Design' },
    { code: 'FAG', name: 'Faculty of Agriculture' },
    { code: 'FAR', name: 'Faculty of Architecture' },
    { code: 'FEN', name: 'Faculty of Engineering' },
    { code: 'FED', name: 'Faculty of Education' },
    { code: 'FLW', name: 'Faculty of Law' },
    { code: 'FLS', name: 'Faculty of Life Sciences' },
    { code: 'FPS', name: 'Faculty of Physical Sciences' },
    { code: 'FSS', name: 'Faculty of Social Sciences' },
  ];
  
  for (const fac of faculties) {
    await prisma.faculty.upsert({
      where: {
        institutionId_code: {
          institutionId: fedko.id,
          code: fac.code
        }
      },
      update: { name: fac.name },
      create: {
        institutionId: fedko.id,
        code: fac.code,
        name: fac.name,
      },
    });
    console.log(`✅ Created/updated faculty: ${fac.code} - ${fac.name}`);
  }
  
  // 6. Create some departments
  console.log('\n🏛️ Creating FEDKO departments...');
  
  const fadFaculty = await prisma.faculty.findFirst({ 
    where: { institutionId: fedko.id, code: 'FAD' } 
  });
  const fenFaculty = await prisma.faculty.findFirst({ 
    where: { institutionId: fedko.id, code: 'FEN' } 
  });
  const fpsFaculty = await prisma.faculty.findFirst({ 
    where: { institutionId: fedko.id, code: 'FPS' } 
  });
  const flsFaculty = await prisma.faculty.findFirst({ 
    where: { institutionId: fedko.id, code: 'FLS' } 
  });
  const fssFaculty = await prisma.faculty.findFirst({ 
    where: { institutionId: fedko.id, code: 'FSS' } 
  });
  
  const departments = [
    { code: 'FINE', name: 'Fine Arts', facultyId: fadFaculty?.id },
    { code: 'MUS', name: 'Music', facultyId: fadFaculty?.id },
    { code: 'CSC', name: 'Computer Science', facultyId: fpsFaculty?.id },
    { code: 'MTH', name: 'Mathematics', facultyId: fpsFaculty?.id },
    { code: 'PHY', name: 'Physics', facultyId: fpsFaculty?.id },
    { code: 'CHE', name: 'Chemistry', facultyId: flsFaculty?.id },
    { code: 'BIO', name: 'Biological Sciences', facultyId: flsFaculty?.id },
    { code: 'MEE', name: 'Mechanical Engineering', facultyId: fenFaculty?.id },
    { code: 'ELE', name: 'Electrical Engineering', facultyId: fenFaculty?.id },
    { code: 'CVE', name: 'Civil Engineering', facultyId: fenFaculty?.id },
    { code: 'ECO', name: 'Economics', facultyId: fssFaculty?.id },
    { code: 'PSC', name: 'Political Science', facultyId: fssFaculty?.id },
  ];
  
  for (const dept of departments) {
    if (dept.facultyId) {
      await prisma.department.upsert({
        where: {
          facultyId_code: {
            facultyId: dept.facultyId,
            code: dept.code
          }
        },
        update: { name: dept.name },
        create: {
          facultyId: dept.facultyId,
          code: dept.code,
          name: dept.name,
        },
      });
      console.log(`✅ Created/updated department: ${dept.code} - ${dept.name}`);
    }
  }
  
  // 7. Create some rooms
  console.log('\n🏠 Creating FEDKO rooms...');
  
  const rooms = [
    { code: 'MPH', name: 'Multi-Purpose Hall', capacity: 1500, type: 'AUDITORIUM' },
    { code: 'LT1', name: 'Lecture Theatre 1', capacity: 500, type: 'LECTURE_HALL' },
    { code: 'LT2', name: 'Lecture Theatre 2', capacity: 400, type: 'LECTURE_HALL' },
    { code: 'CR101', name: 'Classroom 101', capacity: 150, type: 'CLASSROOM' },
    { code: 'CR102', name: 'Classroom 102', capacity: 150, type: 'CLASSROOM' },
    { code: 'LAB1', name: 'Computer Laboratory', capacity: 80, type: 'COMPUTER_LAB' },
    { code: 'LAB2', name: 'Science Laboratory', capacity: 60, type: 'LABORATORY' },
  ];
  
  for (const room of rooms) {
    await prisma.room.upsert({
      where: {
        institutionId_code: {
          institutionId: fedko.id,
          code: room.code
        }
      },
      update: { name: room.name, capacity: room.capacity },
      create: {
        institutionId: fedko.id,
        code: room.code,
        name: room.name,
        capacity: room.capacity,
        type: room.type,
        hasProjector: true,
        hasAC: true,
      },
    });
    console.log(`✅ Created/updated room: ${room.code} - ${room.name}`);
  }
  
  console.log('\n✅ Database setup complete!');
  console.log('\n📋 Demo Credentials (password: admin123):');
  console.log('   Super Admin: admin@clashfree.com');
  console.log('   Institution Admin: admin@fedko.edu.ng');
  console.log('   Timetable Officer: officer@fedko.edu.ng');
  console.log('   Lecturer: lecturer@fedko.edu.ng');
  console.log('   Student: student@fedko.edu.ng');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
