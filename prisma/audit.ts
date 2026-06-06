import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tables: [string, Promise<number>][] = [
    ['Institution', prisma.institution.count()],
    ['User', prisma.user.count()],
    ['Faculty', prisma.faculty.count()],
    ['Department', prisma.department.count()],
    ['Course', prisma.course.count()],
    ['Student', prisma.student.count()],
    ['Lecturer', prisma.lecturer.count()],
    ['Room', prisma.room.count()],
    ['ExamPeriod', prisma.examPeriod.count()],
    ['ExamSlot', prisma.examSlot.count()],
    ['StudentCourse', prisma.studentCourse.count()],
    ['LectureTimetable', prisma.lectureTimetable.count()],
    ['LectureSlot', prisma.lectureSlot.count()],
    ['Conflict', prisma.conflict.count()],
    ['ConflictReport', prisma.conflictReport.count()],
    ['Notification', prisma.notification.count()],
    ['ActivityLog', prisma.activityLog.count()],
    ['InvigilatorAssignment', prisma.invigilatorAssignment.count()],
    ['BlackoutDate', prisma.blackoutDate.count()],
    ['TimetableVersion', prisma.timetableVersion.count()],
    ['CoursePrerequisite', prisma.coursePrerequisite.count()],
  ];
  
  const results = await Promise.all(tables.map(async ([name, promise]) => {
    const count = await promise;
    return `${name}: ${count}`;
  }));
  
  console.log('=== DATABASE AUDIT ===');
  results.forEach(r => console.log(r));
  
  const insts = await prisma.institution.findMany({ select: { id: true, name: true, shortName: true } });
  console.log('\n=== INSTITUTIONS ===');
  for (const i of insts) console.log(`  ${i.shortName}: ${i.name} (${i.id})`);
  
  const users = await prisma.user.findMany({ select: { id: true, email: true, role: true, name: true, institutionId: true } });
  console.log('\n=== USERS ===');
  for (const u of users) console.log(`  [${u.role}] ${u.email} - ${u.name} (${u.institutionId})`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
