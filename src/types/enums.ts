/**
 * Shared enums — mirrors prisma/schema.prisma exactly.
 * Import from here instead of @prisma/client (client not generated in CI).
 */

export type UserRole = 'SA' | 'IA' | 'TO' | 'LC' | 'ST'

export type InstitutionType = 'UNIVERSITY' | 'POLYTECHNIC' | 'COE' | 'OTHER'

export type RoomType = 'LECTURE_HALL' | 'LAB' | 'SEMINAR_ROOM' | 'EXAM_HALL' | 'OTHER'

export type ConflictSeverity = 'CRITICAL' | 'WARNING'

export type ConstraintSeverity = 'SOFT' | 'HARD'

export type StudentCourseStatus = 'CURRENT' | 'CARRY_OVER' | 'SPILLOVER'
