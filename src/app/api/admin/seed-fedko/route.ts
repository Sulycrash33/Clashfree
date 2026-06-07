import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

// GET /api/admin/seed-fedko?secret=YOUR_SEED_SECRET
// This route: purges existing FEDKO, then seeds fresh simplified demo data
// DELETE this file after seeding is confirmed.

const INSTITUTION_DATA = {
  name: "Federal University of Konoha",
  shortName: "FEDKO",
  type: "FEDERAL_UNI" as const,
  city: "Konoha",
  state: "Niger State",
  country: "Nigeria",
  currentSession: "2025/2026",
  currentSemester: 2,
  website: "https://fedko.edu.ng",
  emailDomain: "fedko.edu.ng",
};

const FACULTIES = [
  { code: "FED", name: "Faculty of Education", deanName: "Prof. Kakashi Hatake" }
];

const DEPARTMENTS: Record<string, { code: string; name: string; hod: string }[]> = {
  FED: [
    { code: "EDF", name: "Educational Foundations", hod: "Dr. Iruka Umino" },
    { code: "CUR", name: "Curriculum and Instruction", hod: "Dr. Asuma Sarutobi" },
    { code: "ACE", name: "Adult and Continuing Education", hod: "Dr. Kurenai Yuhi" },
    { code: "EDM", name: "Educational Management", hod: "Dr. Shikamaru Nara" },
    { code: "GUC", name: "Guidance and Counselling", hod: "Dr. Sakura Haruno" },
    { code: "LIS", name: "Library and Information Science", hod: "Dr. Shizune" },
    { code: "HPE", name: "Health and Physical Education", hod: "Dr. Might Guy" },
    { code: "ECCE", name: "Early Childhood Care Education", hod: "Dr. Hinata Hyuga" },
    { code: "SPE", name: "Special Education", hod: "Dr. Temari" },
    { code: "EDT", name: "Educational Technology", hod: "Dr. Ino Yamanaka" },
  ]
};

const COURSES: Record<string, { code: string; name: string; level: number; cu: number; lab?: boolean }[]> = {
  EDF: [{ code: "101", name: "Intro to Education", level: 100, cu: 3 }, { code: "102", name: "Psychology of Education", level: 100, cu: 3 }, { code: "201", name: "History of Education", level: 200, cu: 3 }, { code: "202", name: "Sociology of Education", level: 200, cu: 3 }],
  CUR: [{ code: "101", name: "Intro to Curriculum", level: 100, cu: 3 }, { code: "102", name: "Learning Theories", level: 100, cu: 3 }, { code: "201", name: "Curriculum Design", level: 200, cu: 3 }, { code: "202", name: "Instructional Methods", level: 200, cu: 3 }],
  ACE: [{ code: "101", name: "Intro to Adult Ed", level: 100, cu: 3 }, { code: "102", name: "Principles of Andragogy", level: 100, cu: 3 }, { code: "201", name: "Community Education", level: 200, cu: 3 }, { code: "202", name: "Non-Formal Education", level: 200, cu: 3 }],
  EDM: [{ code: "101", name: "Intro to Ed Management", level: 100, cu: 3 }, { code: "102", name: "School Organization", level: 100, cu: 3 }, { code: "201", name: "Ed Planning", level: 200, cu: 3 }, { code: "202", name: "Personnel Management", level: 200, cu: 3 }],
  GUC: [{ code: "101", name: "Intro to Guidance", level: 100, cu: 3 }, { code: "102", name: "Theories of Counselling", level: 100, cu: 3 }, { code: "201", name: "Group Counselling", level: 200, cu: 3 }, { code: "202", name: "Psychological Testing", level: 200, cu: 3 }],
  LIS: [{ code: "101", name: "Intro to Lib Science", level: 100, cu: 3 }, { code: "102", name: "Reference Services", level: 100, cu: 3 }, { code: "201", name: "Cataloguing", level: 200, cu: 3 }, { code: "202", name: "Classification", level: 200, cu: 3 }],
  HPE: [{ code: "101", name: "Foundations of PE", level: 100, cu: 3 }, { code: "102", name: "Anatomy for PE", level: 100, cu: 3 }, { code: "201", name: "Sports Psychology", level: 200, cu: 3 }, { code: "202", name: "Kinesiology", level: 200, cu: 3 }],
  ECCE: [{ code: "101", name: "Intro to Early Childhood", level: 100, cu: 3 }, { code: "102", name: "Child Development", level: 100, cu: 3 }, { code: "201", name: "Playway Method", level: 200, cu: 3 }, { code: "202", name: "Curriculum for ECCE", level: 200, cu: 3 }],
  SPE: [{ code: "101", name: "Intro to Special Ed", level: 100, cu: 3 }, { code: "102", name: "History of Special Ed", level: 100, cu: 3 }, { code: "201", name: "Inclusive Education", level: 200, cu: 3 }, { code: "202", name: "Braille and Sign Language", level: 200, cu: 3 }],
  EDT: [{ code: "101", name: "Intro to Ed Tech", level: 100, cu: 3 }, { code: "102", name: "Audio-Visual Aids", level: 100, cu: 3 }, { code: "201", name: "Computer in Education", level: 200, cu: 3 }, { code: "202", name: "E-Learning Systems", level: 200, cu: 3 }],
};

const ROOMS = [
  { code: "EDLT1", name: "Education Lecture Theatre 1", capacity: 200, type: "EXAM_HALL" as const, building: "Faculty of Education", hasProjector: true, hasAC: true, hasComputers: false },
  { code: "EDLT2", name: "Education Lecture Theatre 2", capacity: 150, type: "LECTURE_HALL" as const, building: "Faculty of Education", hasProjector: true, hasAC: true, hasComputers: false },
  { code: "EDCR1", name: "Education Classroom 1", capacity: 50, type: "CLASSROOM" as const, building: "Faculty of Education", hasProjector: false, hasAC: false, hasComputers: false },
  { code: "EDCR2", name: "Education Classroom 2", capacity: 50, type: "CLASSROOM" as const, building: "Faculty of Education", hasProjector: false, hasAC: false, hasComputers: false },
  { code: "EDLAB1", name: "Ed Tech Computer Lab", capacity: 40, type: "COMPUTER_LAB" as const, building: "Faculty of Education", hasProjector: true, hasAC: true, hasComputers: true },
];

const STUDENTS = [
  { regNumber: "FEDKO/2024/001", name: "Boruto Uzumaki", deptCode: "EDF", level: 100, admissionYear: 2024, isSpillover: false },
  { regNumber: "FEDKO/2024/002", name: "Sarada Uchiha", deptCode: "CUR", level: 100, admissionYear: 2024, isSpillover: false },
  { regNumber: "FEDKO/2024/003", name: "Mitsuki", deptCode: "ACE", level: 100, admissionYear: 2024, isSpillover: false },
  { regNumber: "FEDKO/2023/001", name: "Gaara", deptCode: "EDM", level: 200, admissionYear: 2023, isSpillover: false },
  { regNumber: "FEDKO/2023/002", name: "Temari", deptCode: "GUC", level: 200, admissionYear: 2023, isSpillover: false },
  { regNumber: "FEDKO/2023/003", name: "Kankuro", deptCode: "LIS", level: 200, admissionYear: 2023, isSpillover: false },
  { regNumber: "FEDKO/2022/001", name: "Naruto Uzumaki", deptCode: "HPE", level: 300, admissionYear: 2022, isSpillover: true },
  { regNumber: "FEDKO/2022/002", name: "Sasuke Uchiha", deptCode: "ECCE", level: 300, admissionYear: 2022, isSpillover: false },
  { regNumber: "FEDKO/2021/001", name: "Shikamaru Nara", deptCode: "SPE", level: 400, admissionYear: 2021, isSpillover: false },
  { regNumber: "FEDKO/2021/002", name: "Ino Yamanaka", deptCode: "EDT", level: 400, admissionYear: 2021, isSpillover: false },
];

async function purge() {
  const insts = await db.institution.findMany({ where: { shortName: 'FEDKO' }, select: { id: true } });
  const ids = insts.map(i => i.id);
  if (!ids.length) return { purged: 0 };

  const users = await db.user.findMany({ where: { institutionId: { in: ids } }, select: { id: true } });
  const uids = users.map(u => u.id);

  let n = 0;
  n += (await db.invigilatorAssignment.deleteMany({ where: { examSlot: { examPeriod: { institutionId: { in: ids } } } } })).count;
  n += (await db.conflict.deleteMany({ where: { examPeriod: { institutionId: { in: ids } } } })).count;
  n += (await db.examSlot.deleteMany({ where: { examPeriod: { institutionId: { in: ids } } } })).count;
  n += (await db.blackoutDate.deleteMany({ where: { examPeriod: { institutionId: { in: ids } } } })).count;
  n += (await db.conflictReport.deleteMany({ where: { examPeriod: { institutionId: { in: ids } } } })).count;
  n += (await db.timetableVersion.deleteMany({ where: { examPeriod: { institutionId: { in: ids } } } })).count;
  n += (await db.examPeriod.deleteMany({ where: { institutionId: { in: ids } } })).count;
  n += (await db.lectureSlot.deleteMany({ where: { lectureTimetable: { institutionId: { in: ids } } } })).count;
  n += (await db.lectureTimetable.deleteMany({ where: { institutionId: { in: ids } } })).count;
  n += (await db.coursePrerequisite.deleteMany({ where: { OR: [{ course: { institutionId: { in: ids } } }, { prerequisite: { institutionId: { in: ids } } }] } })).count;
  n += (await db.studentCourse.deleteMany({ where: { course: { institutionId: { in: ids } } } })).count;
  n += (await db.notification.deleteMany({ where: { userId: { in: uids } } })).count;
  n += (await db.activityLog.deleteMany({ where: { userId: { in: uids } } })).count;
  n += (await db.student.deleteMany({ where: { department: { faculty: { institutionId: { in: ids } } } } })).count;
  n += (await db.lecturer.deleteMany({ where: { department: { faculty: { institutionId: { in: ids } } } } })).count;
  n += (await db.course.deleteMany({ where: { institutionId: { in: ids } } })).count;
  n += (await db.room.deleteMany({ where: { institutionId: { in: ids } } })).count;
  n += (await db.department.deleteMany({ where: { faculty: { institutionId: { in: ids } } } })).count;
  n += (await db.faculty.deleteMany({ where: { institutionId: { in: ids } } })).count;
  n += (await db.user.deleteMany({ where: { institutionId: { in: ids } } })).count;
  n += (await db.institution.deleteMany({ where: { id: { in: ids } } })).count;

  return { purged: n };
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  if (!secret || secret !== process.env.SEED_SECRET) {
    return NextResponse.json({ error: 'Unauthorized. Please provide ?secret=YOUR_SEED_SECRET in the URL.' }, { status: 401 });
  }

  const log: string[] = [];

  try {
    const { purged } = await purge();
    log.push(`Purged ${purged} records`);

    const inst = await db.institution.create({ data: INSTITUTION_DATA });
    const iid = inst.id;
    log.push(`Institution: ${inst.shortName}`);

    const pw = await bcrypt.hash('demo1234', 10);
    await db.user.createMany({
      data: [
        { email: 'admin@fedko.edu.ng', name: 'Hiruzen Sarutobi', role: 'IA', passwordHash: pw, institutionId: iid, isActive: true },
        { email: 'officer@fedko.edu.ng', name: 'Iruka Umino', role: 'TO', passwordHash: pw, institutionId: iid, isActive: true },
        { email: 'lecturer@fedko.edu.ng', name: 'Kakashi Hatake', role: 'LC', passwordHash: pw, institutionId: iid, isActive: true },
        { email: 'student@fedko.edu.ng', name: 'Naruto Uzumaki', role: 'ST', passwordHash: pw, institutionId: iid, isActive: true },
      ]
    });
    log.push('Users: 4');

    await db.faculty.createMany({ data: FACULTIES.map(f => ({ institutionId: iid, ...f })) });
    log.push(`Faculties: ${FACULTIES.length}`);

    const facs = await db.faculty.findMany({ where: { institutionId: iid } });
    const fm = Object.fromEntries(facs.map(f => [f.code, f.id]));

    const depts = Object.entries(DEPARTMENTS).flatMap(([fc, ds]) => ds.map(d => ({ facultyId: fm[fc], code: d.code, name: d.name, hodName: d.hod })));
    await db.department.createMany({ data: depts });
    log.push(`Departments: ${depts.length}`);

    const deps = await db.department.findMany({ where: { faculty: { institutionId: iid } } });
    const dm = Object.fromEntries(deps.map(d => [d.code, d.id]));

    const courseRows: { institutionId: string; departmentId: string; code: string; name: string; creditUnits: number; level: number; semester: number; requiresLab: boolean; maxStudents: number }[] = [];
    for (const [dc, ts] of Object.entries(COURSES)) {
      const did = dm[dc]; if (!did) continue;
      for (const t of ts) courseRows.push({ institutionId: iid, departmentId: did, code: `FUK-${dc}${t.code}`, name: t.name, creditUnits: t.cu, level: t.level, semester: 2, requiresLab: t.lab || false, maxStudents: t.level === 100 ? 200 : t.level === 200 ? 150 : t.level === 300 ? 100 : 80 });
    }
    for (let i = 0; i < courseRows.length; i += 100) await db.course.createMany({ data: courseRows.slice(i, i + 100) });
    log.push(`Courses: ${courseRows.length}`);

    const lecRows = deps.map(d => ({ departmentId: d.id, staffId: `FUK/${d.code}/HOD`, name: d.hodName || 'TBD', email: `${d.code.toLowerCase()}.hod@fedko.edu.ng`, rank: 'Senior Lecturer', unavailableDays: JSON.stringify([]) }));
    await db.lecturer.createMany({ data: lecRows });
    const lecs = await db.lecturer.findMany({ where: { department: { faculty: { institutionId: iid } } } });
    for (const l of lecs) await db.course.updateMany({ where: { departmentId: l.departmentId, institutionId: iid }, data: { lecturerId: l.id } });
    log.push(`Lecturers: ${lecRows.length}`);

    await db.room.createMany({ data: ROOMS.map(r => ({ institutionId: iid, ...r })) });
    log.push(`Rooms: ${ROOMS.length}`);

    const stdRows = STUDENTS.map(s => ({ departmentId: dm[s.deptCode], regNumber: s.regNumber, name: s.name, email: `${s.regNumber.replace(/\//g, '.').toLowerCase()}@fedko.edu.ng`, level: s.level, admissionYear: s.admissionYear, isSpillover: s.isSpillover }));
    await db.student.createMany({ data: stdRows });
    log.push(`Students: ${stdRows.length}`);

    const courses = await db.course.findMany({ where: { institutionId: iid } });
    const stds = await db.student.findMany({ where: { department: { faculty: { institutionId: iid } } } });
    const sm = Object.fromEntries(stds.map(s => [s.regNumber, s.id]));

    const session = '2025/2026'; const sem = 2;
    const enrRows: { studentId: string; courseId: string; status: string; semester: number; session: string }[] = [];
    for (const s of STUDENTS) {
      const sid = sm[s.regNumber]; if (!sid) continue;
      const cur = courses.filter(c => c.departmentId === dm[s.deptCode] && c.level === s.level && c.semester === sem);
      for (const c of cur) enrRows.push({ studentId: sid, courseId: c.id, status: 'REGISTERED', semester: sem, session });
      if (s.isSpillover && s.level >= 200) {
        const co = courses.filter(c => c.departmentId === dm[s.deptCode] && c.level === s.level - 100 && c.semester === sem).slice(0, 2);
        for (const c of co) if (!enrRows.find(e => e.studentId === sid && e.courseId === c.id)) enrRows.push({ studentId: sid, courseId: c.id, status: 'CARRY_OVER', semester: sem, session });
      }
    }
    for (let i = 0; i < enrRows.length; i += 100) await db.studentCourse.createMany({ data: enrRows.slice(i, i + 100) });
    log.push(`Enrollments: ${enrRows.length} (${enrRows.filter(e => e.status === 'CARRY_OVER').length} carry-over)`);

    const ep = await db.examPeriod.create({
      data: {
        institutionId: iid, name: 'Second Semester Examination 2025/2026', session, semester: sem,
        startDate: new Date('2025-08-04'), endDate: new Date('2025-08-29'), slotsPerDay: 3, slotDuration: 180,
        morningStart: '08:00', morningEnd: '11:00', afternoonStart: '12:00', afternoonEnd: '15:00', eveningStart: '16:00', eveningEnd: '19:00',
        includeSaturday: true, excludeFridays: true, status: 'GENERATED'
      }
    });

    const allEnr = await db.studentCourse.findMany({ where: { session, semester: sem }, select: { studentId: true, courseId: true } });
    const cs: Record<string, Set<string>> = {};
    for (const e of allEnr) { if (!cs[e.courseId]) cs[e.courseId] = new Set(); cs[e.courseId].add(e.studentId); }

    const allRms = await db.room.findMany({ where: { institutionId: iid }, orderBy: { capacity: 'desc' } });
    const rb = Object.fromEntries(allRms.map(r => [r.code, r.id]));

    const dates: Date[] = [];
    const c2 = new Date('2025-08-04'); const e2 = new Date('2025-08-29');
    while (c2 <= e2) { const d = c2.getDay(); if (d >= 1 && d <= 6 && d !== 5) dates.push(new Date(c2)); c2.setDate(c2.getDate() + 1); }

    const socc: Record<string, string[]> = {};
    const slots: { examPeriodId: string; courseId: string; roomId: string; date: Date; dayOfWeek: number; slotNumber: number; startTime: string; endTime: string; status: string }[] = [];
    const sc = courses.filter(c => c.semester === sem).sort((a, b) => (cs[b.id]?.size || 0) - (cs[a.id]?.size || 0));

    for (const course of sc) {
      const enr = cs[course.id]?.size || 0;
      let rid = enr > 350 ? rb['EDLT1'] : enr > 150 ? rb['EDLT2'] : enr > 60 ? rb['EDCR1'] || rb['EDCR2'] : course.requiresLab ? rb['EDLAB1'] : rb['EDCR1'] || rb['EDCR2'];
      if (!rid) rid = allRms[0].id;

      const myS = cs[course.id] || new Set();
      let ok = false;

      for (let di = 0; di < dates.length && !ok; di++) for (let sn = 1; sn <= 3 && !ok; sn++) {
        const k = `${di}-${sn}`; const occ = socc[k] || []; let cl = false;
        for (const oid of occ) { const os = cs[oid]; if (!os) continue; for (const sid of myS) { if (os.has(sid)) { cl = true; break; } } if (cl) break; }
        if (!cl) {
          const d = dates[di]; const t = [['08:00', '11:00'], ['12:00', '15:00'], ['16:00', '19:00']][sn - 1];
          slots.push({ examPeriodId: ep.id, courseId: course.id, roomId: rid, date: d, dayOfWeek: d.getDay(), slotNumber: sn, startTime: t[0], endTime: t[1], status: 'SCHEDULED' });
          socc[k] = [...occ, course.id]; ok = true;
        }
      }
    }
    for (let i = 0; i < slots.length; i += 50) await db.examSlot.createMany({ data: slots.slice(i, i + 50) });
    log.push(`Exam Slots: ${slots.length}`);

    const lt = await db.lectureTimetable.create({
      data: { institutionId: iid, name: 'Second Semester Lecture Timetable 2025/2026', session, semester: sem, startDate: new Date('2025-02-17'), endDate: new Date('2025-06-28'), status: 'PUBLISHED' }
    });

    const lcRows: { lectureTimetableId: string; courseId: string; roomId: string; dayOfWeek: number; startTime: string; endTime: string; isRecurring: boolean; status: string }[] = [];
    const locc: Record<string, string[]> = {};

    for (const course of courses.filter(c => c.level <= 200 && c.semester === sem)) {
      const enr = cs[course.id]?.size || 0;
      const rid = enr > 150 ? rb['EDLT2'] : enr > 80 ? rb['EDCR1'] : course.requiresLab ? rb['EDLAB1'] : rb['EDCR1'];
      if (!rid) continue;

      const myS = cs[course.id] || new Set();
      for (let day = 1; day <= 6; day++) {
        for (const time of ['08:00', '10:00', '12:00', '14:00']) {
          const k = `${day}-${time}`; const occ = locc[k] || []; let cl = false;
          for (const oid of occ) { const os = cs[oid]; if (!os) continue; for (const sid of myS) { if (os.has(sid)) { cl = true; break; } } if (cl) break; }
          if (!cl) {
            const eh = parseInt(time.split(':')[0]) + 2;
            lcRows.push({ lectureTimetableId: lt.id, courseId: course.id, roomId: rid, dayOfWeek: day, startTime: time, endTime: `${String(eh).padStart(2, '0')}:00`, isRecurring: true, status: 'ACTIVE' });
            locc[k] = [...occ, course.id]; break;
          }
        }
        if (lcRows.find(s => s.courseId === course.id)) break;
      }
    }
    for (let i = 0; i < lcRows.length; i += 50) await db.lectureSlot.createMany({ data: lcRows.slice(i, i + 50) });
    log.push(`Lecture Slots: ${lcRows.length}`);

    await db.conflictReport.create({ data: { examPeriodId: ep.id, totalConflicts: 0, criticalCount: 0, warningCount: 0, infoCount: 0, status: 'APPROVED' } });
    await db.timetableVersion.create({ data: { examPeriodId: ep.id, version: 1, isCurrent: true, publishedAt: new Date(), changes: JSON.stringify({ action: 'Seed v4 — Simplified Demo (1 Faculty, 10 Depts)', slots: slots.length }) } });

    const fedUsers = await db.user.findMany({ where: { institutionId: iid }, select: { id: true } });
    await db.notification.createMany({ data: fedUsers.map(u => ({ userId: u.id, title: 'Exam Timetable Published', message: 'Second Semester 2025/2026 exam timetable is now available.', type: 'SCHEDULE_CHANGE', actionUrl: '/dashboard' })) });
    log.push('Notifications sent');

    return NextResponse.json({ success: true, log, summary: { faculties: FACULTIES.length, departments: depts.length, courses: courseRows.length, students: STUDENTS.length, rooms: ROOMS.length, examSlots: slots.length, lectureSlots: lcRows.length } });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message, log }, { status: 500 });
  }
}
