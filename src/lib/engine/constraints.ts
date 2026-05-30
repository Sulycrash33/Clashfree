/**
 * ClashFree Constraint Engine
 * Defines all hard and soft constraints for timetable generation
 */

export enum ConstraintType {
  // Hard Constraints (MUST be satisfied)
  NO_STUDENT_DOUBLE_BOOKING = 'NO_STUDENT_DOUBLE_BOOKING',
  NO_LECTURER_DOUBLE_BOOKING = 'NO_LECTURER_DOUBLE_BOOKING',
  NO_ROOM_DOUBLE_BOOKING = 'NO_ROOM_DOUBLE_BOOKING',
  ROOM_CAPACITY = 'ROOM_CAPACITY',
  ROOM_TYPE_MATCH = 'ROOM_TYPE_MATCH',
  LECTURER_AVAILABILITY = 'LECTURER_AVAILABILITY',
  CO_CLASH_DETECTION = 'CO_CLASH_DETECTION',
  
  // Soft Constraints (PREFERRED but not required)
  SPREAD_EXAMS = 'SPREAD_EXAMS',
  BALANCE_SLOTS = 'BALANCE_SLOTS',
  MINIMIZE_MOVEMENT = 'MINIMIZE_MOVEMENT',
  PREFERRED_TIMES = 'PREFERRED_TIMES',
  SAME_LEVEL_GROUPING = 'SAME_LEVEL_GROUPING',
  GST_ISOLATED_SLOTS = 'GST_ISOLATED_SLOTS',
}

export enum ConstraintSeverity {
  HARD = 'HARD',      // Must be satisfied - timetable invalid if violated
  SOFT = 'SOFT',      // Preferred - affects optimization score
}

export interface Constraint {
  type: ConstraintType
  severity: ConstraintSeverity
  description: string
  weight: number // For soft constraints, how important (1-10)
}

// All constraint definitions
export const CONSTRAINT_DEFINITIONS: Record<ConstraintType, Constraint> = {
  // === HARD CONSTRAINTS ===
  [ConstraintType.NO_STUDENT_DOUBLE_BOOKING]: {
    type: ConstraintType.NO_STUDENT_DOUBLE_BOOKING,
    severity: ConstraintSeverity.HARD,
    description: 'A student cannot have two exams at the same time',
    weight: 10,
  },
  [ConstraintType.NO_LECTURER_DOUBLE_BOOKING]: {
    type: ConstraintType.NO_LECTURER_DOUBLE_BOOKING,
    severity: ConstraintSeverity.HARD,
    description: 'A lecturer cannot invigilate/teach two exams at the same time',
    weight: 10,
  },
  [ConstraintType.NO_ROOM_DOUBLE_BOOKING]: {
    type: ConstraintType.NO_ROOM_DOUBLE_BOOKING,
    severity: ConstraintSeverity.HARD,
    description: 'A room cannot host two exams at the same time',
    weight: 10,
  },
  [ConstraintType.ROOM_CAPACITY]: {
    type: ConstraintType.ROOM_CAPACITY,
    severity: ConstraintSeverity.HARD,
    description: 'Room capacity must accommodate all enrolled students',
    weight: 10,
  },
  [ConstraintType.ROOM_TYPE_MATCH]: {
    type: ConstraintType.ROOM_TYPE_MATCH,
    severity: ConstraintSeverity.HARD,
    description: 'Lab courses must be scheduled in labs, etc.',
    weight: 9,
  },
  [ConstraintType.LECTURER_AVAILABILITY]: {
    type: ConstraintType.LECTURER_AVAILABILITY,
    severity: ConstraintSeverity.HARD,
    description: 'Lecturer must be available during scheduled time',
    weight: 10,
  },
  [ConstraintType.CO_CLASH_DETECTION]: {
    type: ConstraintType.CO_CLASH_DETECTION,
    severity: ConstraintSeverity.HARD,
    description: 'Carry-over students cannot have exam conflicts with current courses',
    weight: 10,
  },
  
  // === SOFT CONSTRAINTS ===
  [ConstraintType.SPREAD_EXAMS]: {
    type: ConstraintType.SPREAD_EXAMS,
    severity: ConstraintSeverity.SOFT,
    description: 'Exams should be spread out (not back-to-back for students)',
    weight: 6,
  },
  [ConstraintType.BALANCE_SLOTS]: {
    type: ConstraintType.BALANCE_SLOTS,
    severity: ConstraintSeverity.SOFT,
    description: 'Balance exams across morning/afternoon/evening slots',
    weight: 5,
  },
  [ConstraintType.MINIMIZE_MOVEMENT]: {
    type: ConstraintType.MINIMIZE_MOVEMENT,
    severity: ConstraintSeverity.SOFT,
    description: 'Minimize venue changes for students on same day',
    weight: 4,
  },
  [ConstraintType.PREFERRED_TIMES]: {
    type: ConstraintType.PREFERRED_TIMES,
    severity: ConstraintSeverity.SOFT,
    description: 'Respect preferred exam times if specified',
    weight: 3,
  },
  [ConstraintType.SAME_LEVEL_GROUPING]: {
    type: ConstraintType.SAME_LEVEL_GROUPING,
    severity: ConstraintSeverity.SOFT,
    description: 'Same level exams should be grouped together',
    weight: 5,
  },
  [ConstraintType.GST_ISOLATED_SLOTS]: {
    type: ConstraintType.GST_ISOLATED_SLOTS,
    severity: ConstraintSeverity.SOFT,
    description: 'GST/Shared courses should have isolated slots (many students)',
    weight: 7,
  },
}

/**
 * Constraint Validation Result
 */
export interface ConstraintViolation {
  type: ConstraintType
  severity: ConstraintSeverity
  message: string
  affectedEntities: string[]
  slotA?: string
  slotB?: string
  suggestion?: string
}

/**
 * Validation Context - All data needed for constraint checking
 */
export interface ValidationContext {
  institutionId: string
  examPeriodId?: string
  lectureTimetableId?: string
  
  // Entities to validate
  courses: CourseData[]
  students: StudentData[]
  lecturers: LecturerData[]
  rooms: RoomData[]
  examSlots?: ExamSlotData[]
  lectureSlots?: LectureSlotData[]
}

export interface CourseData {
  id: string
  code: string
  name: string
  level: number
  isShared: boolean
  requiresLab: boolean
  departmentId: string
  lecturerId?: string
  enrollment: number
}

export interface StudentData {
  id: string
  regNumber: string
  name: string
  level: number
  departmentId: string
  courses: {
    courseId: string
    status: 'REGISTERED' | 'CARRY_OVER' | 'SPILLOVER' | 'COMPLETED'
  }[]
}

export interface LecturerData {
  id: string
  staffId: string
  name: string
  departmentId: string
  unavailableDays: string[]
  unavailableDates: Date[]
}

export interface RoomData {
  id: string
  code: string
  name: string
  capacity: number
  type: 'LECTURE_HALL' | 'AUDITORIUM' | 'CLASSROOM' | 'LABORATORY' | 'COMPUTER_LAB' | 'EXAM_HALL'
  hasComputers: boolean
}

export interface ExamSlotData {
  id: string
  courseId: string
  roomId: string
  date: Date
  slotNumber: number
  startTime: string
  endTime: string
}

export interface LectureSlotData {
  id: string
  courseId: string
  roomId: string
  dayOfWeek: number
  startTime: string
  endTime: string
}
