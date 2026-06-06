import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== PURGING ALL FEDKO DATA ===');
  
  // Find all FEDKO institutions (by shortName)
  const fedkoInsts = await prisma.institution.findMany({ where: { shortName: 'FEDKO' }, select: { id: true } });
  const FEDKO_IDS = fedkoInsts.map(i => i.id);
  
  if (FEDKO_IDS.length === 0) {
    console.log('No FEDKO institutions found. Nothing to purge.');
    return;
  }
  console.log(`Found ${FEDKO_IDS.length} FEDKO institution(s): ${FEDKO_IDS.join(', ')}`);
  
  // Get all user IDs linked to these institutions
  const fedkoUsers = await prisma.user.findMany({ where: { institutionId: { in: FEDKO_IDS } }, select: { id: true } });
  const fedkoUserIds = fedkoUsers.map(u => u.id);
  
  // Delete in reverse dependency order
  const counts: Record<string, number> = {};

  // ExamSlot-related
  counts['InvigilatorAssignment'] = (await prisma.invigilatorAssignment.deleteMany({
    where: { examSlot: { examPeriod: { institutionId: { in: FEDKO_IDS } } } }
  })).count;
  
  counts['Conflict'] = (await prisma.conflict.deleteMany({
    where: { examPeriod: { institutionId: { in: FEDKO_IDS } } }
  })).count;

  counts['ExamSlot'] = (await prisma.examSlot.deleteMany({
    where: { examPeriod: { institutionId: { in: FEDKO_IDS } } }
  })).count;

  counts['BlackoutDate'] = (await prisma.blackoutDate.deleteMany({
    where: { examPeriod: { institutionId: { in: FEDKO_IDS } } }
  })).count;

  counts['ConflictReport'] = (await prisma.conflictReport.deleteMany({
    where: { examPeriod: { institutionId: { in: FEDKO_IDS } } }
  })).count;

  counts['TimetableVersion'] = (await prisma.timetableVersion.deleteMany({
    where: { examPeriod: { institutionId: { in: FEDKO_IDS } } }
  })).count;

  counts['ExamPeriod'] = (await prisma.examPeriod.deleteMany({
    where: { institutionId: { in: FEDKO_IDS } }
  })).count;

  // LectureSlot-related
  counts['LectureSlot'] = (await prisma.lectureSlot.deleteMany({
    where: { lectureTimetable: { institutionId: { in: FEDKO_IDS } } }
  })).count;

  counts['LectureTimetable'] = (await prisma.lectureTimetable.deleteMany({
    where: { institutionId: { in: FEDKO_IDS } }
  })).count;

  // CoursePrerequisite
  counts['CoursePrerequisite'] = (await prisma.coursePrerequisite.deleteMany({
    where: { OR: [
      { course: { institutionId: { in: FEDKO_IDS } } },
      { prerequisite: { institutionId: { in: FEDKO_IDS } } }
    ]}
  })).count;

  // StudentCourse
  counts['StudentCourse'] = (await prisma.studentCourse.deleteMany({
    where: { course: { institutionId: { in: FEDKO_IDS } } }
  })).count;

  // Notification for FEDKO users
  counts['Notification'] = (await prisma.notification.deleteMany({
    where: { userId: { in: fedkoUserIds } }
  })).count;

  // ActivityLog for FEDKO users
  counts['ActivityLog'] = (await prisma.activityLog.deleteMany({
    where: { userId: { in: fedkoUserIds } }
  })).count;

  // Students
  counts['Student'] = (await prisma.student.deleteMany({
    where: { department: { faculty: { institutionId: { in: FEDKO_IDS } } } }
  })).count;

  // Lecturers
  counts['Lecturer'] = (await prisma.lecturer.deleteMany({
    where: { department: { faculty: { institutionId: { in: FEDKO_IDS } } } }
  })).count;

  // Courses
  counts['Course'] = (await prisma.course.deleteMany({
    where: { institutionId: { in: FEDKO_IDS } }
  })).count;

  // Rooms
  counts['Room'] = (await prisma.room.deleteMany({
    where: { institutionId: { in: FEDKO_IDS } }
  })).count;

  // Departments
  counts['Department'] = (await prisma.department.deleteMany({
    where: { faculty: { institutionId: { in: FEDKO_IDS } } }
  })).count;

  // Faculties
  counts['Faculty'] = (await prisma.faculty.deleteMany({
    where: { institutionId: { in: FEDKO_IDS } }
  })).count;

  // FEDKO Users (keep SA - SA has null institutionId)
  counts['User'] = (await prisma.user.deleteMany({
    where: { institutionId: { in: FEDKO_IDS } }
  })).count;

  // Finally, the institutions themselves
  counts['Institution'] = (await prisma.institution.deleteMany({
    where: { id: { in: FEDKO_IDS } }
  })).count;

  console.log('\n=== PURGE RESULTS ===');
  for (const [table, count] of Object.entries(counts)) {
    if (count > 0) console.log(`  ${table}: ${count} deleted`);
  }

  // Verify clean state
  const remaining = await prisma.institution.count({ where: { shortName: 'FEDKO' } });
  console.log(`\nFEDKO institutions remaining: ${remaining}`);
  console.log(`SA user still exists: ${(await prisma.user.count({ where: { role: 'SA' } }))}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
