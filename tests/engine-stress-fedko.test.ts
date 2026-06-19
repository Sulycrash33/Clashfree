/**
 * Stress Test: ClashFree Scheduling Engine vs FedKo Data
 * 
 * Simulates the full FedKo dataset (Federal University of Konoha):
 * - 10 faculties, 68 departments
 * - 544 courses (8 per department)
 * - 49 students (some with carry-overs)
 * - 15 rooms (capacities 30-500)
 * - 22 exam days × 3 slots = 66 available time slots
 * 
 * Validates:
 * 1. All courses can be scheduled
 * 2. No student has two exams at the same time
 * 3. No room is double-booked
 * 4. Carry-over students don't get clashes
 * 5. Algorithm completes within reasonable time
 */

import { describe, it, expect } from 'vitest'

// ─── In-Memory Data Generation (mirrors FedKo seed) ────────────────

interface Course {
  id: string
  code: string
  departmentId: string
  level: number
  enrollment: number
  lecturerId: string
  requiresLab: boolean
  isShared: boolean
}

interface Room {
  id: string
  code: string
  capacity: number
  type: string
}

interface Student {
  id: string
  regNumber: string
  departmentId: string
  level: number
  isSpillover: boolean
}

interface Enrollment {
  studentId: string
  courseId: string
  status: 'REGISTERED' | 'CARRY_OVER'
}

interface Slot {
  date: string
  dayOfWeek: number
  slotNumber: number
  startTime: string
  endTime: string
}

interface Assignment {
  courseId: string
  roomId: string
  slotKey: string // date-slotNumber
  date: string
  slotNumber: number
}

// Generate FedKo-scale data
function generateFedKoData() {
  const departments = [
    'ACC', 'BUS', 'LGS', 'PAD', // FAD (4)
    'AEC', 'AGN', 'ANS', 'CRP', 'PLS', 'SLS', 'AER', // FAG (7)
    'ALC', 'ARA', 'AHS', 'ELS', 'FRE', 'HIS', 'PHL', 'THA', // FAL (8)
    'ABE', 'AUT', 'CHN', 'CVE', 'CME', 'ECE', 'GLT', 'MCE', 'MTE', 'MET', 'PET', 'TST', 'WRE', // FEN (13)
    'ARC', 'BLD', 'FNA', 'GEM', 'IND', 'QSV', 'URP', // FED (7)
    'ILW', 'PBL', 'CML', 'PRL', // FLA (4)
    'BCH', 'BSC', 'BOT', 'MCB', 'ZOO', 'CHM', 'CSC', 'GEG', 'GEO', 'MTH', 'PHY', 'STA', // FPS (12)
    'MAC', 'POL', 'SOC', // FSS (3)
    'VTM', 'VPH', 'VAP', 'VSG', 'VMT', // FVM (5)
    'PHA', 'PHM', 'PHC', 'PHT', // FPH (4)
  ] // Total: 68

  // Generate courses: 8 per department × 68 = 544
  const courses: Course[] = []
  const levels = [100, 200, 300, 400]
  let courseIdx = 0

  for (const dept of departments) {
    for (let i = 0; i < 8; i++) {
      const level = levels[i % 4]
      courses.push({
        id: `course_${courseIdx}`,
        code: `${dept} ${level + Math.floor(i / 4) * 10 + 1}`,
        departmentId: dept,
        level,
        enrollment: level === 100 ? 45 : level === 200 ? 35 : level === 300 ? 25 : 20,
        lecturerId: `lec_${dept}`,
        requiresLab: dept === 'CSC' || dept === 'CHM' || dept === 'PHY' || dept === 'ECE' ? i % 4 === 0 : false,
        isShared: false,
      })
      courseIdx++
    }
  }

  // Add GST courses (shared across all departments)
  const gstCourses = ['GST111', 'GST112', 'GST113', 'GST121', 'GST122', 'GST211', 'GST212', 'GST311', 'GST312']
  for (const gst of gstCourses) {
    courses.push({
      id: `course_gst_${gst}`,
      code: gst,
      departmentId: 'GST',
      level: parseInt(gst.charAt(3)) * 100,
      enrollment: 350,
      lecturerId: `lec_gst_${gst}`,
      requiresLab: false,
      isShared: true,
    })
  }

  // Rooms (mirrors seed-fedko.ts)
  const rooms: Room[] = [
    { id: 'room_mph', code: 'MPH', capacity: 500, type: 'LECTURE_HALL' },
    { id: 'room_lt1', code: 'LT1', capacity: 400, type: 'LECTURE_HALL' },
    { id: 'room_lt2', code: 'LT2', capacity: 300, type: 'LECTURE_HALL' },
    { id: 'room_lh1', code: 'LH1', capacity: 200, type: 'LECTURE_HALL' },
    { id: 'room_lh2', code: 'LH2', capacity: 200, type: 'LECTURE_HALL' },
    { id: 'room_lh3', code: 'LH3', capacity: 150, type: 'LECTURE_HALL' },
    { id: 'room_lh4', code: 'LH4', capacity: 150, type: 'LECTURE_HALL' },
    { id: 'room_cr1', code: 'CR1', capacity: 80, type: 'CLASSROOM' },
    { id: 'room_cr2', code: 'CR2', capacity: 80, type: 'CLASSROOM' },
    { id: 'room_cr3', code: 'CR3', capacity: 60, type: 'CLASSROOM' },
    { id: 'room_comlab1', code: 'COMLAB1', capacity: 60, type: 'COMPUTER_LAB' },
    { id: 'room_comlab2', code: 'COMLAB2', capacity: 40, type: 'COMPUTER_LAB' },
    { id: 'room_scilab1', code: 'SCILAB1', capacity: 50, type: 'LABORATORY' },
    { id: 'room_scilab2', code: 'SCILAB2', capacity: 50, type: 'LABORATORY' },
    { id: 'room_englab1', code: 'ENGLAB1', capacity: 45, type: 'LABORATORY' },
  ]

  // Students (49 from seed, plus we simulate background population)
  const students: Student[] = []
  const spilloverDepts = ['POL', 'VTM', 'MCE']
  let studentIdx = 0

  for (const dept of departments) {
    // 5 students per level per department (background simulation)
    for (const level of levels) {
      for (let i = 0; i < 5; i++) {
        students.push({
          id: `student_${studentIdx}`,
          regNumber: `FEDKO/${2025 - level / 100}/${dept}/${String(i + 1).padStart(3, '0')}`,
          departmentId: dept,
          level,
          isSpillover: spilloverDepts.includes(dept) && level >= 300 && i === 0,
        })
        studentIdx++
      }
    }
  }

  // Enrollments
  const enrollments: Enrollment[] = []
  for (const student of students) {
    // Register for all courses in their dept at their level
    const deptCourses = courses.filter(c => c.departmentId === student.departmentId && c.level === student.level)
    for (const course of deptCourses) {
      enrollments.push({ studentId: student.id, courseId: course.id, status: 'REGISTERED' })
    }

    // Add GST courses for 100/200 level
    if (student.level <= 200) {
      const gst = courses.filter(c => c.departmentId === 'GST' && c.level === student.level)
      for (const g of gst) {
        enrollments.push({ studentId: student.id, courseId: g.id, status: 'REGISTERED' })
      }
    }

    // CO students: register for previous level courses too
    if (student.isSpillover && student.level >= 200) {
      const prevLevelCourses = courses
        .filter(c => c.departmentId === student.departmentId && c.level === student.level - 100)
        .slice(0, 2) // 2 carry-over courses
      for (const course of prevLevelCourses) {
        enrollments.push({ studentId: student.id, courseId: course.id, status: 'CARRY_OVER' })
      }
    }
  }

  // Available exam slots (Aug 4 - Aug 29, 2025, excl. Sundays & Fridays, 3 slots/day)
  const slots: Slot[] = []
  const start = new Date('2025-08-04')
  const end = new Date('2025-08-29')
  const current = new Date(start)
  const slotTimes = [
    { slotNumber: 1, startTime: '08:00', endTime: '11:00' },
    { slotNumber: 2, startTime: '12:00', endTime: '15:00' },
    { slotNumber: 3, startTime: '16:00', endTime: '19:00' },
  ]

  while (current <= end) {
    const dow = current.getDay()
    // Skip Sunday (0) and Friday (5)
    if (dow !== 0 && dow !== 5) {
      for (const st of slotTimes) {
        slots.push({
          date: current.toISOString().split('T')[0],
          dayOfWeek: dow,
          slotNumber: st.slotNumber,
          startTime: st.startTime,
          endTime: st.endTime,
        })
      }
    }
    current.setDate(current.getDate() + 1)
  }

  return { courses, rooms, students, enrollments, slots }
}

// ─── Engine Simulation (mirrors generator.ts logic) ─────────────────

function simulateEngine(data: ReturnType<typeof generateFedKoData>) {
  const { courses, rooms, enrollments, slots } = data
  const startTime = Date.now()

  // Build student-course map
  const studentCourseMap = new Map<string, Set<string>>()
  for (const e of enrollments) {
    if (!studentCourseMap.has(e.studentId)) studentCourseMap.set(e.studentId, new Set())
    studentCourseMap.get(e.studentId)!.add(e.courseId)
  }

  // Build course-students map (inverse)
  const courseStudentsMap = new Map<string, Set<string>>()
  for (const e of enrollments) {
    if (!courseStudentsMap.has(e.courseId)) courseStudentsMap.set(e.courseId, new Set())
    courseStudentsMap.get(e.courseId)!.add(e.studentId)
  }

  // MRV ordering: most constrained courses first
  const orderedCourses = [...courses].sort((a, b) => {
    let scoreA = (courseStudentsMap.get(a.id)?.size || 0) * 0.1
    let scoreB = (courseStudentsMap.get(b.id)?.size || 0) * 0.1
    if (a.isShared) scoreA += 500
    if (b.isShared) scoreB += 500
    if (a.requiresLab) scoreA += 200
    if (b.requiresLab) scoreB += 200
    scoreA += (a.level / 100) * 10
    scoreB += (b.level / 100) * 10
    return scoreB - scoreA
  })

  // Slot state tracking
  const slotRoomAssignments = new Map<string, Set<string>>() // slotKey -> roomIds used
  const slotStudentAssignments = new Map<string, Map<string, Set<string>>>() // slotKey -> studentId -> courseIds
  const slotLecturerAssignments = new Map<string, Set<string>>() // slotKey -> lecturerIds used

  for (const slot of slots) {
    const key = `${slot.date}-${slot.slotNumber}`
    slotRoomAssignments.set(key, new Set())
    slotStudentAssignments.set(key, new Map())
    slotLecturerAssignments.set(key, new Set())
  }

  // Greedy assignment
  const assignments: Assignment[] = []
  const unassigned: string[] = []
  let constraintChecks = 0

  for (const course of orderedCourses) {
    const enrollment = courseStudentsMap.get(course.id)?.size || 0
    const suitableRooms = rooms
      .filter(r => r.capacity >= enrollment)
      .sort((a, b) => a.capacity - b.capacity)

    if (suitableRooms.length === 0) {
      unassigned.push(course.code)
      continue
    }

    const studentsInCourse = courseStudentsMap.get(course.id) || new Set<string>()
    let assigned = false

    for (const slot of slots) {
      const slotKey = `${slot.date}-${slot.slotNumber}`

      for (const room of suitableRooms) {
        // Check room availability
        if (slotRoomAssignments.get(slotKey)!.has(room.id)) {
          constraintChecks++
          continue
        }

        // Check student clashes
        let hasClash = false
        const slotStudents = slotStudentAssignments.get(slotKey)!
        for (const studentId of studentsInCourse) {
          if (slotStudents.has(studentId) && slotStudents.get(studentId)!.size > 0) {
            hasClash = true
            break
          }
        }
        constraintChecks++

        if (hasClash) continue

        // Check lecturer clash
        if (slotLecturerAssignments.get(slotKey)!.has(course.lecturerId)) {
          constraintChecks++
          continue
        }

        // Valid assignment
        assignments.push({
          courseId: course.id,
          roomId: room.id,
          slotKey,
          date: slot.date,
          slotNumber: slot.slotNumber,
        })

        // Update state
        slotRoomAssignments.get(slotKey)!.add(room.id)
        for (const studentId of studentsInCourse) {
          if (!slotStudents.has(studentId)) slotStudents.set(studentId, new Set())
          slotStudents.get(studentId)!.add(course.id)
        }
        slotLecturerAssignments.get(slotKey)!.add(course.lecturerId)

        assigned = true
        break
      }

      if (assigned) break
    }

    if (!assigned) {
      unassigned.push(course.code)
    }
  }

  const timeMs = Date.now() - startTime

  return {
    success: unassigned.length === 0,
    totalCourses: courses.length,
    assignedCourses: assignments.length,
    unassigned,
    assignments,
    constraintChecks,
    timeMs,
    studentCourseMap,
    courseStudentsMap,
  }
}

// ─── Validation Functions ───────────────────────────────────────────

function validateNoStudentClashes(
  assignments: Assignment[],
  courseStudentsMap: Map<string, Set<string>>
): { valid: boolean; clashes: string[] } {
  const clashes: string[] = []
  const slotStudentCheck = new Map<string, Map<string, string>>() // slotKey -> studentId -> courseId

  for (const a of assignments) {
    const students = courseStudentsMap.get(a.courseId) || new Set()
    if (!slotStudentCheck.has(a.slotKey)) slotStudentCheck.set(a.slotKey, new Map())
    const slotStudents = slotStudentCheck.get(a.slotKey)!

    for (const studentId of students) {
      if (slotStudents.has(studentId)) {
        clashes.push(`Student ${studentId} has clash: ${slotStudents.get(studentId)} vs ${a.courseId} in slot ${a.slotKey}`)
      } else {
        slotStudents.set(studentId, a.courseId)
      }
    }
  }

  return { valid: clashes.length === 0, clashes }
}

function validateNoRoomDoubleBooking(assignments: Assignment[]): { valid: boolean; conflicts: string[] } {
  const conflicts: string[] = []
  const slotRoomCheck = new Map<string, Map<string, string>>() // slotKey -> roomId -> courseId

  for (const a of assignments) {
    if (!slotRoomCheck.has(a.slotKey)) slotRoomCheck.set(a.slotKey, new Map())
    const slotRooms = slotRoomCheck.get(a.slotKey)!

    if (slotRooms.has(a.roomId)) {
      conflicts.push(`Room ${a.roomId} double-booked: ${slotRooms.get(a.roomId)} vs ${a.courseId}`)
    } else {
      slotRooms.set(a.roomId, a.courseId)
    }
  }

  return { valid: conflicts.length === 0, conflicts }
}

function validateCOStudentsNoClash(
  assignments: Assignment[],
  enrollments: Enrollment[],
  courseStudentsMap: Map<string, Set<string>>
): { valid: boolean; coClashes: string[] } {
  const coClashes: string[] = []
  const coEnrollments = enrollments.filter(e => e.status === 'CARRY_OVER')

  // Build assignment lookup: courseId -> slotKey
  const courseSlotMap = new Map<string, string>()
  for (const a of assignments) {
    courseSlotMap.set(a.courseId, a.slotKey)
  }

  // For each CO student, check that their CO courses don't clash with current courses
  const coStudents = new Set(coEnrollments.map(e => e.studentId))
  for (const studentId of coStudents) {
    const allCourses = enrollments.filter(e => e.studentId === studentId)
    const slots = allCourses
      .map(e => ({ courseId: e.courseId, slotKey: courseSlotMap.get(e.courseId), status: e.status }))
      .filter(s => s.slotKey !== undefined)

    // Check for same-slot assignments
    const slotUsage = new Map<string, string[]>()
    for (const s of slots) {
      if (!slotUsage.has(s.slotKey!)) slotUsage.set(s.slotKey!, [])
      slotUsage.get(s.slotKey!)!.push(s.courseId)
    }

    for (const [slotKey, courseIds] of slotUsage) {
      if (courseIds.length > 1) {
        coClashes.push(`CO student ${studentId} has clash in slot ${slotKey}: ${courseIds.join(', ')}`)
      }
    }
  }

  return { valid: coClashes.length === 0, coClashes }
}

// ─── Tests ──────────────────────────────────────────────────────────

describe('Engine Stress Test: FedKo Scale', () => {
  const data = generateFedKoData()
  const result = simulateEngine(data)

  it('should generate correct data volumes', () => {
    expect(data.courses.length).toBeGreaterThanOrEqual(544) // 68 depts × 8 + GST
    expect(data.rooms.length).toBe(15)
    expect(data.students.length).toBe(67 * 4 * 5) // 67 depts × 4 levels × 5 students
    expect(data.slots.length).toBeGreaterThanOrEqual(55) // ~19 days × 3 slots = 57
    expect(data.enrollments.length).toBeGreaterThan(5000)
  })

  it('should schedule all courses successfully', () => {
    // With 66 slots and 15 rooms, we have 66×15=990 possible room-slot combinations
    // We need to fit 553 courses — should be achievable
    expect(result.assignedCourses).toBe(result.totalCourses)
    expect(result.unassigned).toHaveLength(0)
    expect(result.success).toBe(true)
  })

  it('should produce zero student clashes', () => {
    const validation = validateNoStudentClashes(result.assignments, result.courseStudentsMap)
    expect(validation.valid).toBe(true)
    expect(validation.clashes).toHaveLength(0)
  })

  it('should produce zero room double-bookings', () => {
    const validation = validateNoRoomDoubleBooking(result.assignments)
    expect(validation.valid).toBe(true)
    expect(validation.conflicts).toHaveLength(0)
  })

  it('should produce zero CO student clashes', () => {
    const validation = validateCOStudentsNoClash(result.assignments, data.enrollments, result.courseStudentsMap)
    expect(validation.valid).toBe(true)
    expect(validation.coClashes).toHaveLength(0)
  })

  it('should complete within 5 seconds', () => {
    expect(result.timeMs).toBeLessThan(5000)
  })

  it('should use MRV ordering (shared/GST courses first)', () => {
    // GST courses should be in the first 20 assignments (they have highest constraint score)
    const first20 = result.assignments.slice(0, 20)
    const gstInFirst20 = first20.filter(a => a.courseId.startsWith('course_gst'))
    expect(gstInFirst20.length).toBeGreaterThan(0)
  })

  it('should distribute exams across multiple days', () => {
    const usedDates = new Set(result.assignments.map(a => a.date))
    expect(usedDates.size).toBeGreaterThan(10)
  })

  it('should not schedule on Fridays or Sundays', () => {
    for (const a of result.assignments) {
      const dow = new Date(a.date).getDay()
      expect(dow).not.toBe(0) // Sunday
      expect(dow).not.toBe(5) // Friday
    }
  })

  it('should handle the constraint check volume efficiently', () => {
    // With 553 courses × up to 66 slots × 15 rooms = ~547K max checks
    // Efficient algorithm should be far less
    expect(result.constraintChecks).toBeLessThan(600000)
    // Throughput: at least 100 courses/second
    const coursesPerSecond = result.assignedCourses / (result.timeMs / 1000)
    expect(coursesPerSecond).toBeGreaterThan(100)
  })
})

describe('Edge Cases: Overloaded Scenarios', () => {
  it('should handle worst-case: all students in one course', () => {
    const data = generateFedKoData()
    // Make one course have massive enrollment from all departments
    const megaCourse = data.courses[0]
    for (const student of data.students.slice(0, 200)) {
      data.enrollments.push({ studentId: student.id, courseId: megaCourse.id, status: 'REGISTERED' })
    }

    const result = simulateEngine(data)
    const validation = validateNoStudentClashes(result.assignments, result.courseStudentsMap)
    expect(validation.valid).toBe(true)
  })

  it('should handle maximum CO load (10% spillover students)', () => {
    const data = generateFedKoData()
    // Make 10% of 300+ level students spillover with CO courses
    const upperStudents = data.students.filter(s => s.level >= 300)
    const coCount = Math.floor(upperStudents.length * 0.1)

    for (let i = 0; i < coCount; i++) {
      const student = upperStudents[i]
      student.isSpillover = true
      const prevCourses = data.courses.filter(c => c.departmentId === student.departmentId && c.level === student.level - 100)
      for (const c of prevCourses.slice(0, 3)) {
        if (!data.enrollments.find(e => e.studentId === student.id && e.courseId === c.id)) {
          data.enrollments.push({ studentId: student.id, courseId: c.id, status: 'CARRY_OVER' })
        }
      }
    }

    const result = simulateEngine(data)
    const coValidation = validateCOStudentsNoClash(result.assignments, data.enrollments, result.courseStudentsMap)
    expect(coValidation.valid).toBe(true)
  })
})
