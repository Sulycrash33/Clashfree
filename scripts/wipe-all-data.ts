/**
 * ClashFree - Complete Database Wipe
 * Deletes ALL data from every table.
 * Schema is preserved. No data survives.
 * Run: bun scripts/wipe-all-data.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function wipeAll() {
  console.log('🗑️  ClashFree - Complete Database Wipe')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('⚠️  Deleting ALL data from ALL tables...\n')

  try {
    // Use a single transaction with TRUNCATE CASCADE for speed and safety
    // Order: leaf/dependent tables first, then parent tables
    await prisma.$transaction([

      // ── Leaf nodes (no children) ──────────────────────────────
      prisma.notification.deleteMany(),
      prisma.activityLog.deleteMany(),
      prisma.conflict.deleteMany(),
      prisma.conflictReport.deleteMany(),
      prisma.invigilatorAssignment.deleteMany(),
      prisma.blackoutDate.deleteMany(),

      // ── Timetable slots & lecture slots ──────────────────────
      prisma.lectureSlot.deleteMany(),
      prisma.examSlot.deleteMany(),

      // ── Timetable versions & lecture timetables ───────────────
      prisma.lectureTimetable.deleteMany(),
      prisma.timetableVersion.deleteMany(),

      // ── Exam periods ──────────────────────────────────────────
      prisma.examPeriod.deleteMany(),

      // ── Student ↔ Course junction ─────────────────────────────
      prisma.studentCourse.deleteMany(),

      // ── Course prerequisites (self-referential junction) ──────
      prisma.coursePrerequisite.deleteMany(),

      // ── Students & Lecturers (before User) ────────────────────
      prisma.student.deleteMany(),
      prisma.lecturer.deleteMany(),

      // ── Courses (before Department & Institution) ─────────────
      prisma.course.deleteMany(),

      // ── Rooms (before Faculty & Institution) ──────────────────
      prisma.room.deleteMany(),

      // ── Departments (before Faculty) ──────────────────────────
      prisma.department.deleteMany(),

      // ── Faculties (before Institution) ────────────────────────
      prisma.faculty.deleteMany(),

      // ── Top-level: Users & Institutions ───────────────────────
      prisma.user.deleteMany(),
      prisma.institution.deleteMany(),
    ])

    console.log('✅  All tables wiped successfully:\n')
    const tables = [
      'Notification', 'ActivityLog', 'Conflict', 'ConflictReport',
      'InvigilatorAssignment', 'BlackoutDate', 'LectureSlot', 'ExamSlot',
      'LectureTimetable', 'TimetableVersion', 'ExamPeriod', 'StudentCourse',
      'CoursePrerequisite', 'Student', 'Lecturer', 'Course', 'Room',
      'Department', 'Faculty', 'User', 'Institution'
    ]
    tables.forEach(t => console.log(`   ✓ ${t}`))

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🏁 Database is now completely empty.')
    console.log('   Schema intact. Ready for fresh seed.')

  } catch (error) {
    console.error('\n❌ Wipe failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

wipeAll()
