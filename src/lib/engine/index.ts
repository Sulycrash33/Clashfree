/**
 * ClashFree Timetable Engine
 * 
 * Main entry point for timetable generation and validation
 */

// Export all engine components
export * from './constraints'
export * from './co-detector'
export * from './generator'
export * from './conflict-resolver'

// Re-export types
export type {
  GenerationConfig,
  GenerationResult,
  SlotAssignment,
} from './generator'

export type {
  COClashResult,
  COClashDetail,
  StudentWithCOs,
} from './co-detector'

export type {
  ResolutionSuggestion,
  ResolutionAction,
} from './conflict-resolver'

export type {
  Constraint,
  ConstraintViolation,
  ValidationContext,
} from './constraints'

import { generateExamTimetable, validateTimetable } from './generator'
import { detectCOClashes, predictCOClashes, getCOStatistics } from './co-detector'
import { generateResolutionSuggestions, applyResolution } from './conflict-resolver'

/**
 * Complete timetable generation pipeline
 */
export async function generateTimetablePipeline(config: {
  examPeriodId: string
  maxIterations?: number
  timeLimitMs?: number
  optimizeForSpread?: boolean
  respectLecturerAvailability?: boolean
  isolateGSTCourses?: boolean
}) {
  console.log('🚀 Starting timetable generation pipeline...')

  // 1. Predict CO clashes before generation
  console.log('📊 Step 1: Predicting potential CO clashes...')
  const examPeriod = await import('@/lib/db').then(m => m.db.examPeriod.findUnique({
    where: { id: config.examPeriodId },
    select: { institutionId: true },
  }))

  if (!examPeriod) {
    return { success: false, message: 'Exam period not found' }
  }

  const coPrediction = await predictCOClashes(examPeriod.institutionId)
  console.log(`   Found ${coPrediction.potentialClashes.length} potential CO clashes`)

  // 2. Generate timetable
  console.log('⚙️ Step 2: Generating timetable...')
  const generationResult = await generateExamTimetable({
    examPeriodId: config.examPeriodId,
    maxIterations: config.maxIterations || 10000,
    timeLimitMs: config.timeLimitMs || 120000, // 2 minutes
    optimizeForSpread: config.optimizeForSpread ?? true,
    respectLecturerAvailability: config.respectLecturerAvailability ?? true,
    isolateGSTCourses: config.isolateGSTCourses ?? true,
    includeSaturday: true,
  })

  if (!generationResult.success) {
    console.log('❌ Generation failed:', generationResult.message)
    return {
      success: false,
      message: generationResult.message,
      conflicts: generationResult.conflicts,
      statistics: generationResult.statistics,
    }
  }

  console.log(`✅ Generated ${generationResult.assignments.length} exam slots`)

  // 3. Validate generated timetable
  console.log('🔍 Step 3: Validating timetable...')
  const validation = await validateTimetable(config.examPeriodId)
  console.log(`   Found ${validation.violations.length} violations`)

  // 4. Generate resolution suggestions for any conflicts
  let resolutions: any[] = []
  if (validation.violations.length > 0) {
    console.log('💡 Step 4: Generating resolution suggestions...')
    resolutions = await generateResolutionSuggestions(config.examPeriodId, validation.violations)
  }

  // 5. Save the timetable if valid
  if (validation.valid && generationResult.success) {
    console.log('💾 Saving timetable...')
    // Timetable is already saved during generation
    // Update exam period status
    await import('@/lib/db').then(m => m.db.examPeriod.update({
      where: { id: config.examPeriodId },
      data: { status: 'GENERATED' },
    }))
  }

  console.log('🎉 Pipeline complete!')

  return {
    success: validation.valid,
    message: validation.valid
      ? 'Timetable generated successfully with no conflicts'
      : `Generated with ${validation.violations.length} conflicts`,
    generation: generationResult,
    validation,
    resolutions,
    coPrediction: {
      studentsWithCOs: coPrediction.studentsWithCOs,
      potentialClashes: coPrediction.potentialClashes.length,
      recommendations: coPrediction.recommendations,
    },
  }
}

/**
 * Quick validation of existing timetable
 */
export async function quickValidate(examPeriodId: string) {
  const validation = await validateTimetable(examPeriodId)
  const coClashes = await detectCOClashes(examPeriodId)

  return {
    valid: validation.valid && coClashes.length === 0,
    violations: validation.violations,
    coClashes,
    statistics: validation.statistics,
  }
}

/**
 * Get comprehensive timetable statistics
 */
export async function getTimetableStatistics(examPeriodId: string) {
  const db = (await import('@/lib/db')).db

  const examPeriod = await db.examPeriod.findUnique({
    where: { id: examPeriodId },
    include: {
      _count: { select: { examSlots: true, blackoutDates: true } },
    },
  })

  if (!examPeriod) return null

  const slots = await db.examSlot.findMany({
    where: { examPeriodId },
    include: {
      course: { include: { department: true } },
      room: true,
    },
  })

  // Group by date
  const byDate = slots.reduce((acc, slot) => {
    const date = new Date(slot.date).toDateString()
    if (!acc[date]) acc[date] = []
    acc[date].push(slot)
    return acc
  }, {} as Record<string, typeof slots>)

  // Group by slot number
  const bySlot = slots.reduce((acc, slot) => {
    if (!acc[slot.slotNumber]) acc[slot.slotNumber] = []
    acc[slot.slotNumber].push(slot)
    return acc
  }, {} as Record<number, typeof slots>)

  // Rooms used
  const roomsUsed = new Set(slots.map(s => s.roomId))

  // Departments involved
  const departments = new Set(slots.map(s => s.course.departmentId))

  // CO statistics
  const coStats = await getCOStatistics(examPeriod.institutionId)

  // F8: Room capacity ratio per slot
  const roomRatios = await Promise.all(slots.map(async (slot) => {
    const enrollment = await db.studentCourse.count({
      where: { courseId: slot.courseId, status: { in: ['REGISTERED', 'CARRY_OVER', 'SPILLOVER'] } },
    })
    const ratio = slot.room.capacity > 0 ? enrollment / slot.room.capacity : 0
    const percentage = Math.round(ratio * 100)
    // Traffic light: <70% green, 70-90% amber, >90% red
    const status = ratio < 0.7 ? 'green' : ratio < 0.9 ? 'amber' : 'red'
    return {
      slotId: slot.id,
      courseCode: slot.course.code,
      courseName: slot.course.name,
      roomCode: slot.room.code,
      roomName: slot.room.name,
      roomCapacity: slot.room.capacity,
      enrollment,
      ratio: percentage,
      status,
    }
  }))

  // Room summary stats
  const greenCount = roomRatios.filter(r => r.status === 'green').length
  const amberCount = roomRatios.filter(r => r.status === 'amber').length
  const redCount = roomRatios.filter(r => r.status === 'red').length

  return {
    examPeriod: {
      name: examPeriod.name,
      session: examPeriod.session,
      semester: examPeriod.semester,
      status: examPeriod.status,
    },
    scheduling: {
      totalExams: slots.length,
      uniqueCourses: new Set(slots.map(s => s.courseId)).size,
      examDays: Object.keys(byDate).length,
      roomsUsed: roomsUsed.size,
      departmentsInvolved: departments.size,
    },
    slots: {
      morning: bySlot[1]?.length || 0,
      afternoon: bySlot[2]?.length || 0,
      evening: bySlot[3]?.length || 0,
    },
    carryOver: {
      studentsWithCOs: coStats.studentsWithCOs,
      studentsWithSpillover: coStats.studentsWithSpillover,
      topCOCourses: coStats.coCoursesBreakdown.slice(0, 5),
    },
    roomCapacity: {
      summary: { green: greenCount, amber: amberCount, red: redCount, total: roomRatios.length },
      details: roomRatios.filter(r => r.status !== 'green').slice(0, 20),
    },
  }
}
