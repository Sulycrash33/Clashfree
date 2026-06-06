import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const faculties = await prisma.faculty.findMany({ select: { code: true, name: true, deanName: true }, orderBy: { name: 'asc' } });
  console.log('=== FACULTIES ===');
  for (const f of faculties) console.log(`  ${f.code}: ${f.name} (Dean: ${f.deanName})`);

  const depts = await prisma.department.findMany({ select: { code: true, name: true, hodName: true }, orderBy: { name: 'asc' } });
  console.log(`\n=== DEPARTMENTS (${depts.length}) ===`);
  for (const d of depts) console.log(`  ${d.code}: ${d.name} (HOD: ${d.hodName})`);

  const sampleCourses = await prisma.course.findMany({ select: { code: true, name: true, level: true }, take: 15, orderBy: { code: 'asc' } });
  console.log('\n=== SAMPLE COURSES (first 15) ===');
  for (const c of sampleCourses) console.log(`  ${c.code}: ${c.name} (L${c.level})`);

  const rooms = await prisma.room.findMany({ select: { code: true, name: true, capacity: true, type: true } });
  console.log('\n=== ROOMS ===');
  for (const r of rooms) console.log(`  ${r.code}: ${r.name} (cap: ${r.capacity}, type: ${r.type})`);

  const students = await prisma.student.findMany({ select: { regNumber: true, name: true, level: true, isSpillover: true }, orderBy: { regNumber: 'asc' } });
  console.log(`\n=== STUDENTS (${students.length}) ===`);
  for (const s of students) console.log(`  ${s.regNumber}: ${s.name} (L${s.level}, spillover: ${s.isSpillover})`);

  const lecturers = await prisma.lecturer.findMany({ select: { staffId: true, name: true, rank: true }, orderBy: { name: 'asc' } });
  console.log(`\n=== LECTURERS (${lecturers.length}) ===`);
  for (const l of lecturers) console.log(`  ${l.staffId}: ${l.name} (${l.rank})`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
