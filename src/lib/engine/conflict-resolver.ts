/**
 * ClashFree Conflict Resolution Service
 * 
 * Provides automated suggestions and resolution strategies
 * for detected timetable conflicts.
 */

import { db } from '@/lib/db'
import { ConstraintViolation, ConstraintType } from './constraints'

export interface ResolutionSuggestion {
  conflictId: string
  type: 'MOVE_SLOT' | 'CHANGE_ROOM' | 'SPLIT_EXAM' | 'SWAP_COURSES' | 'ADD_SLOT' | 'MANUAL'
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  description: string
  actions: ResolutionAction[]
  autoResolvable: boolean
  impactScore: number // 0-100, higher = more impactful change
}

export interface ResolutionAction {
  action: string
  entityId: string
  entityType: 'COURSE' | 'ROOM' | 'SLOT' | 'STUDENT' | 'LECTURER'
  currentValue?: string
  suggestedValue?: string
}

/**
 * Analyze conflicts and generate resolution suggestions
 */
export async function generateResolutionSuggestions(
  examPeriodId: string,
  violations: ConstraintViolation[]
): Promise<ResolutionSuggestion[]> {
  const suggestions: ResolutionSuggestion[] = []

  for (const violation of violations) {
    switch (violation.type) {
      case ConstraintType.NO_ROOM_DOUBLE_BOOKING:
        suggestions.push(...await resolveRoomClash(examPeriodId, violation))
        break
      
      case ConstraintType.NO_STUDENT_DOUBLE_BOOKING:
        suggestions.push(...await resolveStudentClash(examPeriodId, violation))
        break
      
      case ConstraintType.ROOM_CAPACITY:
        suggestions.push(...await resolveCapacityIssue(examPeriodId, violation))
        break
      
      case ConstraintType.CO_CLASH_DETECTION:
        suggestions.push(...await resolveCOClash(examPeriodId, violation))
        break
      
      default:
        suggestions.push(generateManualSuggestion(violation))
    }
  }

  return suggestions.sort((a, b) => {
    const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 }
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })
}

/**
 * Resolve room double-booking conflict
 */
async function resolveRoomClash(
  examPeriodId: string,
  violation: ConstraintViolation
): Promise<ResolutionSuggestion[]> {
  const suggestions: ResolutionSuggestion[] = []
  
  // Get the conflicting slots
  const slots = await db.examSlot.findMany({
    where: { id: { in: [violation.slotA, violation.slotB].filter(Boolean) as string[] } },
    include: { course: true, room: true },
  })

  if (slots.length < 2) {
    return [generateManualSuggestion(violation)]
  }

  const [slotA, slotB] = slots

  // Find alternative rooms for either course
  const allRooms = await db.room.findMany({
    where: {
      institutionId: slotA.course.institutionId,
      isActive: true,
      capacity: { gte: Math.max(
        slotA.course._count?.studentCourses || 0,
        slotB.course._count?.studentCourses || 0
      )},
    },
  })

  // Suggestion 1: Move slotA to different room
  const altRoomsA = allRooms.filter(r => r.id !== slotA.roomId)
  if (altRoomsA.length > 0) {
    suggestions.push({
      conflictId: `${violation.slotA}-${violation.slotB}`,
      type: 'CHANGE_ROOM',
      priority: 'HIGH',
      description: `Move ${slotA.course.code} to different room`,
      actions: [
        {
          action: 'CHANGE_ROOM',
          entityId: slotA.id,
          entityType: 'SLOT',
          currentValue: slotA.room.code,
          suggestedValue: altRoomsA[0].code,
        },
      ],
      autoResolvable: true,
      impactScore: 20,
    })
  }

  // Suggestion 2: Move slotB to different room
  const altRoomsB = allRooms.filter(r => r.id !== slotB.roomId)
  if (altRoomsB.length > 0) {
    suggestions.push({
      conflictId: `${violation.slotA}-${violation.slotB}`,
      type: 'CHANGE_ROOM',
      priority: 'HIGH',
      description: `Move ${slotB.course.code} to different room`,
      actions: [
        {
          action: 'CHANGE_ROOM',
          entityId: slotB.id,
          entityType: 'SLOT',
          currentValue: slotB.room.code,
          suggestedValue: altRoomsB[0].code,
        },
      ],
      autoResolvable: true,
      impactScore: 20,
    })
  }

  // Suggestion 3: Move one course to different time slot
  suggestions.push({
    conflictId: `${violation.slotA}-${violation.slotB}`,
    type: 'MOVE_SLOT',
    priority: 'MEDIUM',
    description: `Reschedule ${slotA.course.code} or ${slotB.course.code} to different time`,
    actions: [
      {
        action: 'RESCHEDULE',
        entityId: slotA.id,
        entityType: 'SLOT',
        currentValue: `${new Date(slotA.date).toLocaleDateString()} Slot ${slotA.slotNumber}`,
        suggestedValue: 'Next available slot',
      },
    ],
    autoResolvable: false,
    impactScore: 50,
  })

  return suggestions
}

/**
 * Resolve student double-booking conflict
 */
async function resolveStudentClash(
  examPeriodId: string,
  violation: ConstraintViolation
): Promise<ResolutionSuggestion[]> {
  const suggestions: ResolutionSuggestion[] = []

  // Get affected students
  const affectedStudents = await db.student.findMany({
    where: { id: { in: violation.affectedEntities } },
    include: {
      studentCourses: {
        where: { status: { in: ['REGISTERED', 'CARRY_OVER', 'SPILLOVER'] } },
        include: { course: true },
      },
    },
  })

  if (affectedStudents.length === 0) {
    return [generateManualSuggestion(violation)]
  }

  // Get the conflicting exam slots
  const slots = await db.examSlot.findMany({
    where: { id: { in: [violation.slotA, violation.slotB].filter(Boolean) as string[] } },
    include: { course: true },
  })

  if (slots.length < 2) {
    return [generateManualSuggestion(violation)]
  }

  const [slotA, slotB] = slots

  // For CO clashes, prioritize rescheduling the CO course
  const hasCO = affectedStudents.some(s => 
    s.studentCourses.some(sc => 
      sc.status === 'CARRY_OVER' && 
      (sc.courseId === slotA.courseId || sc.courseId === slotB.courseId)
    )
  )

  const priority = hasCO ? 'HIGH' : 'MEDIUM'
  const courseToMove = hasCO ? 
    (affectedStudents[0].studentCourses.find(sc => sc.status === 'CARRY_OVER')?.courseId === slotA.courseId ? slotA : slotB) :
    slotA

  suggestions.push({
    conflictId: `${violation.slotA}-${violation.slotB}`,
    type: 'MOVE_SLOT',
    priority,
    description: hasCO
      ? `Reschedule CO course ${courseToMove.course.code} to avoid clash`
      : `Reschedule ${courseToMove.course.code} to avoid student clash`,
    actions: [
      {
        action: 'RESCHEDULE',
        entityId: courseToMove.id,
        entityType: 'SLOT',
        currentValue: `${new Date(courseToMove.date).toLocaleDateString()} Slot ${courseToMove.slotNumber}`,
        suggestedValue: 'Next available slot',
      },
    ],
    autoResolvable: true,
    impactScore: hasCO ? 30 : 40,
  })

  // Suggestion: Check if courses can be swapped with another slot
  suggestions.push({
    conflictId: `${violation.slotA}-${violation.slotB}`,
    type: 'SWAP_COURSES',
    priority: 'MEDIUM',
    description: 'Swap one course with another time slot',
    actions: [
      {
        action: 'FIND_SWAP',
        entityId: slotA.courseId,
        entityType: 'COURSE',
        suggestedValue: 'Find compatible swap',
      },
    ],
    autoResolvable: false,
    impactScore: 35,
  })

  return suggestions
}

/**
 * Resolve room capacity issue
 */
async function resolveCapacityIssue(
  examPeriodId: string,
  violation: ConstraintViolation
): Promise<ResolutionSuggestion[]> {
  const suggestions: ResolutionSuggestion[] = []

  const slot = await db.examSlot.findFirst({
    where: { id: violation.affectedEntities[0] },
    include: {
      course: {
        include: {
          _count: { select: { studentCourses: true } },
        },
      },
      room: true,
    },
  })

  if (!slot) {
    return [generateManualSuggestion(violation)]
  }

  const enrollment = slot.course._count?.studentCourses || 0
  const capacity = slot.room.capacity
  const overflow = enrollment - capacity

  // Find larger rooms
  const largerRooms = await db.room.findMany({
    where: {
      institutionId: slot.course.institutionId,
      capacity: { gte: enrollment },
      isActive: true,
    },
  })

  if (largerRooms.length > 0) {
    suggestions.push({
      conflictId: slot.id,
      type: 'CHANGE_ROOM',
      priority: 'HIGH',
      description: `Move ${slot.course.code} to larger venue (${enrollment} students, current room: ${capacity})`,
      actions: [
        {
          action: 'CHANGE_ROOM',
          entityId: slot.id,
          entityType: 'SLOT',
          currentValue: slot.room.code,
          suggestedValue: largerRooms[0].code,
        },
      ],
      autoResolvable: true,
      impactScore: 25,
    })
  }

  // If no single room is large enough, suggest splitting
  if (largerRooms.length === 0) {
    suggestions.push({
      conflictId: slot.id,
      type: 'SPLIT_EXAM',
      priority: 'HIGH',
      description: `Split ${slot.course.code} into multiple venues (${enrollment} students)`,
      actions: [
        {
          action: 'SPLIT',
          entityId: slot.courseId,
          entityType: 'COURSE',
          currentValue: `${enrollment} students`,
          suggestedValue: `Split across ${Math.ceil(enrollment / capacity)} rooms`,
        },
      ],
      autoResolvable: false,
      impactScore: 60,
    })
  }

  return suggestions
}

/**
 * Resolve CO (Carry-Over) clash
 */
async function resolveCOClash(
  examPeriodId: string,
  violation: ConstraintViolation
): Promise<ResolutionSuggestion[]> {
  const suggestions: ResolutionSuggestion[] = []

  // CO clashes are critical - the CO course must be rescheduled
  suggestions.push({
    conflictId: violation.affectedEntities.join('-'),
    type: 'MOVE_SLOT',
    priority: 'HIGH',
    description: `CRITICAL: Carry-over clash detected. Reschedule one of the conflicting courses.`,
    actions: [
      {
        action: 'RESCHEDULE_CO',
        entityId: violation.slotA || '',
        entityType: 'SLOT',
        suggestedValue: 'Isolated CO slot',
      },
    ],
    autoResolvable: true,
    impactScore: 40,
  })

  // Suggest creating a dedicated CO exam session
  suggestions.push({
    conflictId: violation.affectedEntities.join('-'),
    type: 'ADD_SLOT',
    priority: 'MEDIUM',
    description: 'Create dedicated carry-over exam session',
    actions: [
      {
        action: 'CREATE_CO_SLOT',
        entityId: examPeriodId,
        entityType: 'SLOT',
        suggestedValue: 'New slot for CO courses only',
      },
    ],
    autoResolvable: false,
    impactScore: 70,
  })

  return suggestions
}

/**
 * Generate manual resolution suggestion
 */
function generateManualSuggestion(violation: ConstraintViolation): ResolutionSuggestion {
  return {
    conflictId: violation.affectedEntities.join('-'),
    type: 'MANUAL',
    priority: 'HIGH',
    description: violation.message,
    actions: [
      {
        action: 'MANUAL_REVIEW',
        entityId: violation.affectedEntities[0] || '',
        entityType: 'COURSE',
      },
    ],
    autoResolvable: false,
    impactScore: 100,
  }
}

/**
 * Auto-apply a resolution suggestion
 */
export async function applyResolution(
  suggestion: ResolutionSuggestion
): Promise<{ success: boolean; message: string }> {
  if (!suggestion.autoResolvable) {
    return { success: false, message: 'This conflict requires manual resolution' }
  }

  try {
    for (const action of suggestion.actions) {
      switch (action.action) {
        case 'CHANGE_ROOM':
          const newRoom = await db.room.findFirst({
            where: { code: action.suggestedValue },
          })
          if (newRoom) {
            await db.examSlot.update({
              where: { id: action.entityId },
              data: { roomId: newRoom.id },
            })
          }
          break

        case 'RESCHEDULE':
        case 'RESCHEDULE_CO':
          // This would require finding the next available slot
          // For now, return a message indicating manual action needed
          return { success: false, message: 'Rescheduling requires selecting a new slot' }

        default:
          return { success: false, message: 'Action not implemented' }
      }
    }

    return { success: true, message: 'Resolution applied successfully' }
  } catch (error) {
    return { success: false, message: `Failed to apply resolution: ${error}` }
  }
}
