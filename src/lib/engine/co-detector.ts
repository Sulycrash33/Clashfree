/**
 * ClashFree CO (Carry-Over) Clash Detection Module
 * 
 * This is a critical module for Nigerian universities where students
 * with carry-over courses must have conflict-free exam schedules.
 * 
 * Problem: A 300-level student with a CO for MTH 101 (100-level course)
 *          might have CSC 301 exam at the same time as MTH 101 resit.
 *          The system must detect this BEFORE timetable is published.
 */

import { db } from '@/lib/db'

export interface COClashResult {
  hasClash: boolean
  studentId: string
  studentName: string
  studentRegNumber: string
  clashes: COClashDetail[]
}

export interface COClashDetail {
  courseA: {
    id: string
    code: string
    name: string
    level: number
    status: 'CURRENT' | 'CARRY_OVER' | 'SPILLOVER'
  }
  courseB: {
    id: string
    code: string
    name: string
    level: number
    status: 'CURRENT' | 'CARRY_OVER' | 'SPILLOVER'
  }
  examSlot?: {
    date: Date
    slotNumber: number
    time: string
  }
  severity: 'CRITICAL' | 'WARNING'
  message: string
}

export interface StudentWithCOs {
  id: string
  regNumber: string
  name: string
  level: number
  department: { code: string; name: string }
  courses: {
    courseId: string
    courseCode: string
    courseName: string
    courseLevel: number
    status: 'CURRENT' | 'CARRY_OVER' | 'SPILLOVER'
  }[]
}

/**
 * Get all students with carry-over or spillover courses
 */
export async function getStudentsWithCOs(institutionId: string): Promise<StudentWithCOs[]> {
  const students = await db.student.findMany({
    where: {
      department: {
        faculty: {
          institutionId,
        },
      },
      studentCourses: {
        some: {
          status: { in: ['CARRY_OVER', 'SPILLOVER'] },
        },
      },
    },
    include: {
      department: { select: { code: true, name: true } },
      studentCourses: {
        where: {
          OR: [
            { status: 'CURRENT' },
            { status: 'CARRY_OVER' },
            { status: 'SPILLOVER' },
          ],
        },
        include: {
          course: {
            select: {
              id: true,
              code: true,
              name: true,
              level: true,
            },
          },
        },
      },
    },
  })

  return students.map((student) => ({
    id: student.id,
    regNumber: student.regNumber,
    name: student.name,
    level: student.level,
    department: student.department,
    courses: student.studentCourses.map((sc) => ({
      courseId: sc.course.id,
      courseCode: sc.course.code,
      courseName: sc.course.name,
      courseLevel: sc.course.level,
      status: sc.status as 'CURRENT' | 'CARRY_OVER' | 'SPILLOVER',
    })),
  }))
}

/**
 * Detect CO clashes for a given exam period
 * This checks if any student has two exams at the same time
 */
export async function detectCOClashes(examPeriodId: string): Promise<COClashResult[]> {
  // Get exam period with slots
  const examPeriod = await db.examPeriod.findUnique({
    where: { id: examPeriodId },
    include: {
      institution: true,
      examSlots: {
        include: {
          course: {
            include: {
              studentCourses: {
                where: {
                  OR: [
                    { status: 'CURRENT' },
                    { status: 'CARRY_OVER' },
                    { status: 'SPILLOVER' },
                  ],
                },
                include: {
                  student: {
                    include: {
                      department: { select: { code: true, name: true } },
                    },
                  },
                },
              },
            },
          },
          room: { select: { code: true, name: true } },
        },
      },
    },
  })

  if (!examPeriod) {
    throw new Error('Exam period not found')
  }

  // Build a map of student -> exam slots they're enrolled in
  const studentExamMap = new Map<string, {
    student: any
    slots: { slot: any; course: any; status: string }[]
  }>()

  for (const slot of examPeriod.examSlots) {
    for (const sc of slot.course.studentCourses) {
      const studentId = sc.student.id
      
      if (!studentExamMap.has(studentId)) {
        studentExamMap.set(studentId, {
          student: sc.student,
          slots: [],
        })
      }
      
      studentExamMap.get(studentId)!.slots.push({
        slot,
        course: slot.course,
        status: sc.status,
      })
    }
  }

  // Detect clashes
  const clashes: COClashResult[] = []

  for (const [studentId, data] of studentExamMap) {
    const studentClashes: COClashDetail[] = []
    
    // Check each pair of slots for the same student
    for (let i = 0; i < data.slots.length; i++) {
      for (let j = i + 1; j < data.slots.length; j++) {
        const slotA = data.slots[i]
        const slotB = data.slots[j]
        
        // Check if same date and slot number
        const dateA = new Date(slotA.slot.date).toDateString()
        const dateB = new Date(slotB.slot.date).toDateString()
        
        if (dateA === dateB && slotA.slot.slotNumber === slotB.slot.slotNumber) {
          // Clash detected!
          const hasCO = slotA.status !== 'CURRENT' || slotB.status !== 'CURRENT'
          
          studentClashes.push({
            courseA: {
              id: slotA.course.id,
              code: slotA.course.code,
              name: slotA.course.name,
              level: slotA.course.level,
              status: slotA.status as any,
            },
            courseB: {
              id: slotB.course.id,
              code: slotB.course.code,
              name: slotB.course.name,
              level: slotB.course.level,
              status: slotB.status as any,
            },
            examSlot: {
              date: new Date(slotA.slot.date),
              slotNumber: slotA.slot.slotNumber,
              time: `${slotA.slot.startTime} - ${slotA.slot.endTime}`,
            },
            severity: hasCO ? 'CRITICAL' : 'WARNING',
            message: hasCO
              ? `CO Clash: ${data.student.name} has ${slotA.status} course ${slotA.course.code} and ${slotB.status} course ${slotB.course.code} at the same time`
              : `Student has two exams at the same time: ${slotA.course.code} and ${slotB.course.code}`,
          })
        }
      }
    }

    if (studentClashes.length > 0) {
      clashes.push({
        hasClash: true,
        studentId: data.student.id,
        studentName: data.student.name,
        studentRegNumber: data.student.regNumber,
        clashes: studentClashes,
      })
    }
  }

  return clashes
}

/**
 * Predict CO clashes BEFORE generating timetable
 * This helps identify potential issues early
 */
export async function predictCOClashes(institutionId: string): Promise<{
  totalStudents: number
  studentsWithCOs: number
  potentialClashes: COClashDetail[]
  recommendations: string[]
}> {
  const studentsWithCOs = await getStudentsWithCOs(institutionId)
  
  // Find students with multiple CO/Spillover courses at different levels
  const potentialClashes: COClashDetail[] = []
  const recommendations: string[] = []
  
  for (const student of studentsWithCOs) {
    const coCourses = student.courses.filter(c => c.status === 'CARRY_OVER' || c.status === 'SPILLOVER')
    const currentCourses = student.courses.filter(c => c.status === 'CURRENT')
    
    // Flag if student has both CO and current level courses
    if (coCourses.length > 0 && currentCourses.length > 0) {
      for (const coCourse of coCourses) {
        for (const currentCourse of currentCourses) {
          // These courses could potentially clash
          potentialClashes.push({
            courseA: {
              id: coCourse.courseId,
              code: coCourse.courseCode,
              name: coCourse.courseName,
              level: coCourse.courseLevel,
              status: coCourse.status,
            },
            courseB: {
              id: currentCourse.courseId,
              code: currentCourse.courseCode,
              name: currentCourse.courseName,
              level: currentCourse.courseLevel,
              status: 'CURRENT',
            },
            severity: 'WARNING',
            message: `Potential clash: ${student.regNumber} has CO ${coCourse.courseCode} (${coCourse.courseLevel}L) and ${currentCourse.courseCode} (${currentCourse.courseLevel}L)`,
          })
        }
      }
    }
  }

  // Generate recommendations
  if (potentialClashes.length > 0) {
    recommendations.push(`Found ${potentialClashes.length} potential CO clash scenarios`)
    recommendations.push('Ensure CO courses are scheduled in different time slots from current level courses')
    recommendations.push('Consider creating dedicated slots for carry-over exams')
  }

  return {
    totalStudents: await db.student.count({
      where: {
        department: { faculty: { institutionId } },
      },
    }),
    studentsWithCOs: studentsWithCOs.length,
    potentialClashes,
    recommendations,
  }
}

/**
 * Get CO statistics for an institution
 */
export async function getCOStatistics(institutionId: string): Promise<{
  totalStudents: number
  studentsWithCOs: number
  studentsWithSpillover: number
  coCoursesBreakdown: { courseCode: string; count: number }[]
  levelBreakdown: { level: number; coCount: number; spilloverCount: number }[]
}> {
  const studentCourses = await db.studentCourse.findMany({
    where: {
      student: {
        department: {
          faculty: {
            institutionId,
          },
        },
      },
      status: { in: ['CARRY_OVER', 'SPILLOVER'] },
    },
    include: {
      student: true,
      course: true,
    },
  })

  const studentsWithCOs = new Set(
    studentCourses
      .filter(sc => sc.status === 'CARRY_OVER')
      .map(sc => sc.studentId)
  )

  const studentsWithSpillover = new Set(
    studentCourses
      .filter(sc => sc.status === 'SPILLOVER')
      .map(sc => sc.studentId)
  )

  // Course breakdown
  const courseCounts = new Map<string, number>()
  for (const sc of studentCourses) {
    const code = sc.course.code
    courseCounts.set(code, (courseCounts.get(code) || 0) + 1)
  }

  const coCoursesBreakdown = Array.from(courseCounts.entries())
    .map(([courseCode, count]) => ({ courseCode, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20)

  // Level breakdown
  const levelCounts = new Map<number, { co: number; spill: number }>()
  for (const sc of studentCourses) {
    const level = sc.student.level
    if (!levelCounts.has(level)) {
      levelCounts.set(level, { co: 0, spill: 0 })
    }
    const counts = levelCounts.get(level)!
    if (sc.status === 'CARRY_OVER') counts.co++
    else counts.spill++
  }

  const levelBreakdown = Array.from(levelCounts.entries())
    .map(([level, counts]) => ({
      level,
      coCount: counts.co,
      spilloverCount: counts.spill,
    }))
    .sort((a, b) => a.level - b.level)

  const totalStudents = await db.student.count({
    where: {
      department: { faculty: { institutionId } },
    },
  })

  return {
    totalStudents,
    studentsWithCOs: studentsWithCOs.size,
    studentsWithSpillover: studentsWithSpillover.size,
    coCoursesBreakdown,
    levelBreakdown,
  }
}
