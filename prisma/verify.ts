import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Check conflicts
  const conflicts = await prisma.conflict.count();
  console.log(`Conflicts: ${conflicts}`);

  // Verify no student has 2 exams at same time
  const inst = await prisma.institution.findFirst({ where: { shortName: 'FEDKO' } });
  const ep = await prisma.examPeriod.findFirst({ where: { institutionId: inst!.id } });
  const slots = await prisma.examSlot.findMany({
    where: { examPeriodId: ep!.id },
    include: { course: true, room: true },
  });

  // Check room capacity violations
  const enrollments = await prisma.studentCourse.findMany({
    where: { session: '2025/2026', semester: 2 },
    select: { courseId: true, studentId: true },
  });
  const courseEnroll: Record<string, number> = {};
  for (const e of enrollments) {
    courseEnroll[e.courseId] = (courseEnroll[e.courseId] || 0) + 1;
  }

  let capViolations = 0;
  for (const slot of slots) {
    const enrollment = courseEnroll[slot.courseId] || 0;
    if (enrollment > slot.room.capacity) {
      console.log(`  CAP VIOLATION: ${slot.course.code} (${enrollment} students) in ${slot.room.name} (cap: ${slot.room.capacity})`);
      capViolations++;
    }
  }
  console.log(`Capacity violations: ${capViolations}`);

  // Check student-time clashes
  const sc = await prisma.studentCourse.findMany({
    where: { session: '2025/2026', semester: 2 },
    select: { studentId: true, courseId: true },
  });
  const studentCourses: Record<string, string[]> = {};
  for (const e of sc) {
    if (!studentCourses[e.studentId]) studentCourses[e.studentId] = [];
    studentCourses[e.studentId].push(e.courseId);
  }

  const courseSlots: Record<string, { date: Date; slotNumber: number; code: string }[]> = {};
  for (const s of slots) {
    if (!courseSlots[s.courseId]) courseSlots[s.courseId] = [];
    courseSlots[s.courseId].push({ date: s.date, slotNumber: s.slotNumber, code: s.course.code });
  }

  let studentClashes = 0;
  for (const [sid, cids] of Object.entries(studentCourses)) {
    const mySlots = cids.filter(id => courseSlots[id]).flatMap(id => courseSlots[id]);
    for (let i = 0; i < mySlots.length; i++) {
      for (let j = i + 1; j < mySlots.length; j++) {
        if (mySlots[i].date.getTime() === mySlots[j].date.getTime() && mySlots[i].slotNumber === mySlots[j].slotNumber) {
          console.log(`  CLASH: Student ${sid} — ${mySlots[i].code} vs ${mySlots[j].code}`);
          studentClashes++;
        }
      }
    }
  }
  console.log(`Student clashes: ${studentClashes}`);
  console.log(`\nConclusion: ${conflicts === 0 && capViolations === 0 && studentClashes === 0 ? 'CLASH-FREE ✅' : 'HAS ISSUES ❌'}`);

  // Show sample exam slots
  console.log('\nSample exam slots (first 10):');
  for (const s of slots.slice(0, 10)) {
    const enrollment = courseEnroll[s.courseId] || 0;
    console.log(`  ${s.date.toISOString().split('T')[0]} Slot${s.slotNumber} | ${s.course.code} in ${s.room.name} (${enrollment} students)`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
