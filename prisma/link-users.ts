import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Find FEDKO institution
  const inst = await prisma.institution.findFirst({ where: { shortName: 'FEDKO' } });
  if (!inst) { console.log('No FEDKO'); return; }

  // Find demo users
  const users = await prisma.user.findMany({
    where: { institutionId: inst.id },
    select: { id: true, email: true, role: true },
  });
  const userMap = Object.fromEntries(users.map(u => [u.email, u]));

  // Link LC user (lecturer@fedko.edu.ng) to Kakashi Hatake's lecturer record
  // Kakashi is HOD of ELS dept
  const kakashiLec = await prisma.lecturer.findFirst({
    where: { name: 'Kakashi Hatake', department: { faculty: { institutionId: inst.id } } },
  });
  if (kakashiLec && userMap['lecturer@fedko.edu.ng']) {
    await prisma.lecturer.update({
      where: { id: kakashiLec.id },
      data: { userId: userMap['lecturer@fedko.edu.ng'].id },
    });
    console.log(`✅ Linked lecturer@fedko.edu.ng → Kakashi Hatake (${kakashiLec.staffId})`);
  }

  // Link ST user (student@fedko.edu.ng) to Naruto Uzumaki's student record
  const narutoStu = await prisma.student.findFirst({
    where: { regNumber: 'FEDKO/2022/001' },
  });
  if (narutoStu && userMap['student@fedko.edu.ng']) {
    await prisma.student.update({
      where: { id: narutoStu.id },
      data: { userId: userMap['student@fedko.edu.ng'].id },
    });
    console.log(`✅ Linked student@fedko.edu.ng → Naruto Uzumaki (${narutoStu.regNumber})`);
  }

  // Link IA user to a faculty (Iruka Umino is TO, Hiruzen is IA)
  // Hiruzen is dean of FPS — link IA user to FPS faculty
  const fpsFac = await prisma.faculty.findFirst({
    where: { code: 'FPS', institutionId: inst.id },
  });
  if (fpsFac && userMap['admin@fedko.edu.ng']) {
    await prisma.user.update({
      where: { id: userMap['admin@fedko.edu.ng'].id },
      data: { facultyId: fpsFac.id },
    });
    console.log(`✅ Linked admin@fedko.edu.ng → FPS Faculty (IA)`);
  }

  // Link TO user to a faculty (Iruka Umino is TO — link to FAG where he's a lecturer in SLS)
  const fagFac = await prisma.faculty.findFirst({
    where: { code: 'FAG', institutionId: inst.id },
  });
  if (fagFac && userMap['officer@fedko.edu.ng']) {
    await prisma.user.update({
      where: { id: userMap['officer@fedko.edu.ng'].id },
      data: { facultyId: fagFac.id },
    });
    console.log(`✅ Linked officer@fedko.edu.ng → FAG Faculty (TO)`);
  }

  console.log('\nDone!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
