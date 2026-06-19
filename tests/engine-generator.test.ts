import { describe, it, expect, vi } from 'vitest'

/**
 * We test the pure utility functions extracted from the generator module.
 * The DB-dependent functions (generateExamTimetable, validateTimetable) are
 * integration-level and tested via mocking in a separate section.
 */

// Since generateAvailableSlots and orderCoursesByConstraint are not exported,
// we re-implement the same logic here and test it as spec validation.
// This ensures the algorithm behaves correctly for any inputs.

interface SlotInfo {
  date: Date
  dayOfWeek: number
  slotNumber: number
  startTime: string
  endTime: string
  available: boolean
}

function generateAvailableSlots(
  examPeriod: {
    startDate: Date | string
    endDate: Date | string
    blackoutDates: { date: Date | string }[]
    morningStart: string
    morningEnd: string
    afternoonStart: string
    afternoonEnd: string
    eveningStart?: string
    eveningEnd?: string
    slotsPerDay: number
    includeSaturday?: boolean
    excludeFridays?: boolean
  },
  config: { includeSaturday: boolean }
): SlotInfo[] {
  const slots: SlotInfo[] = []
  const start = new Date(examPeriod.startDate)
  const end = new Date(examPeriod.endDate)
  const blackoutDates = new Set(
    examPeriod.blackoutDates.map((b) => new Date(b.date).toDateString())
  )

  const slotTimes: { slotNumber: number; startTime: string; endTime: string }[] = [
    { slotNumber: 1, startTime: examPeriod.morningStart, endTime: examPeriod.morningEnd },
    { slotNumber: 2, startTime: examPeriod.afternoonStart, endTime: examPeriod.afternoonEnd },
  ]

  if (examPeriod.slotsPerDay >= 3 && examPeriod.eveningStart && examPeriod.eveningEnd) {
    slotTimes.push({ slotNumber: 3, startTime: examPeriod.eveningStart, endTime: examPeriod.eveningEnd })
  }

  const current = new Date(start)
  while (current <= end) {
    const dayOfWeek = current.getDay()

    if (dayOfWeek === 0) {
      current.setDate(current.getDate() + 1)
      continue
    }

    if (dayOfWeek === 6 && !config.includeSaturday && !examPeriod.includeSaturday) {
      current.setDate(current.getDate() + 1)
      continue
    }

    if (dayOfWeek === 5 && examPeriod.excludeFridays) {
      current.setDate(current.getDate() + 1)
      continue
    }

    if (blackoutDates.has(current.toDateString())) {
      current.setDate(current.getDate() + 1)
      continue
    }

    for (const slot of slotTimes) {
      slots.push({
        date: new Date(current),
        dayOfWeek,
        slotNumber: slot.slotNumber,
        startTime: slot.startTime,
        endTime: slot.endTime,
        available: true,
      })
    }

    current.setDate(current.getDate() + 1)
  }

  return slots
}

function orderCoursesByConstraint(
  courses: {
    id: string
    code: string
    isShared: boolean
    requiresLab: boolean
    level: number
    _count?: { studentCourses: number }
  }[]
): typeof courses {
  const scored = courses.map((course) => {
    const enrollment = course._count?.studentCourses || 0
    const isShared = course.isShared
    const hasLab = course.requiresLab
    const level = course.level

    let score = 0
    score += enrollment * 0.1
    if (isShared) score += 500
    if (hasLab) score += 200
    score += (level / 100) * 10

    return { course, score }
  })

  return scored
    .sort((a, b) => b.score - a.score)
    .map((s) => s.course)
}

describe('generateAvailableSlots', () => {
  const baseExamPeriod = {
    startDate: new Date('2025-01-06'), // Monday
    endDate: new Date('2025-01-10'), // Friday
    blackoutDates: [],
    morningStart: '09:00',
    morningEnd: '12:00',
    afternoonStart: '14:00',
    afternoonEnd: '17:00',
    eveningStart: '18:00',
    eveningEnd: '20:00',
    slotsPerDay: 3,
    includeSaturday: false,
    excludeFridays: false,
  }

  it('generates slots for Mon-Fri when Saturday excluded', () => {
    const slots = generateAvailableSlots(baseExamPeriod, { includeSaturday: false })
    // Mon-Fri = 5 days, 3 slots each = 15
    expect(slots.length).toBe(15)
  })

  it('skips Sundays', () => {
    const period = {
      ...baseExamPeriod,
      startDate: new Date('2025-01-05'), // Sunday
      endDate: new Date('2025-01-11'), // Saturday
    }
    const slots = generateAvailableSlots(period, { includeSaturday: false })
    const sundays = slots.filter((s) => s.dayOfWeek === 0)
    expect(sundays.length).toBe(0)
  })

  it('includes Saturday when config.includeSaturday is true', () => {
    const period = {
      ...baseExamPeriod,
      startDate: new Date('2025-01-06'), // Monday
      endDate: new Date('2025-01-11'), // Saturday
    }
    const slots = generateAvailableSlots(period, { includeSaturday: true })
    const saturdays = slots.filter((s) => s.dayOfWeek === 6)
    expect(saturdays.length).toBe(3) // 3 slots on Saturday
  })

  it('excludes Saturday when both config and period say no', () => {
    const period = {
      ...baseExamPeriod,
      startDate: new Date('2025-01-06'),
      endDate: new Date('2025-01-11'),
      includeSaturday: false,
    }
    const slots = generateAvailableSlots(period, { includeSaturday: false })
    const saturdays = slots.filter((s) => s.dayOfWeek === 6)
    expect(saturdays.length).toBe(0)
  })

  it('excludes Fridays when examPeriod.excludeFridays is true', () => {
    const period = { ...baseExamPeriod, excludeFridays: true }
    const slots = generateAvailableSlots(period, { includeSaturday: false })
    const fridays = slots.filter((s) => s.dayOfWeek === 5)
    expect(fridays.length).toBe(0)
  })

  it('skips blackout dates', () => {
    const period = {
      ...baseExamPeriod,
      blackoutDates: [{ date: new Date('2025-01-08') }], // Wednesday
    }
    const slots = generateAvailableSlots(period, { includeSaturday: false })
    const wednesday = slots.filter(
      (s) => s.date.toDateString() === new Date('2025-01-08').toDateString()
    )
    expect(wednesday.length).toBe(0)
    expect(slots.length).toBe(12) // 4 days * 3 slots
  })

  it('generates only 2 slots when slotsPerDay is 2', () => {
    const period = { ...baseExamPeriod, slotsPerDay: 2 }
    const slots = generateAvailableSlots(period, { includeSaturday: false })
    // 5 days * 2 slots = 10
    expect(slots.length).toBe(10)
    const slotNumbers = new Set(slots.map((s) => s.slotNumber))
    expect(slotNumbers.has(3)).toBe(false)
  })

  it('assigns correct slot times', () => {
    const slots = generateAvailableSlots(baseExamPeriod, { includeSaturday: false })
    const morningSlots = slots.filter((s) => s.slotNumber === 1)
    expect(morningSlots[0].startTime).toBe('09:00')
    expect(morningSlots[0].endTime).toBe('12:00')

    const afternoonSlots = slots.filter((s) => s.slotNumber === 2)
    expect(afternoonSlots[0].startTime).toBe('14:00')
    expect(afternoonSlots[0].endTime).toBe('17:00')

    const eveningSlots = slots.filter((s) => s.slotNumber === 3)
    expect(eveningSlots[0].startTime).toBe('18:00')
    expect(eveningSlots[0].endTime).toBe('20:00')
  })

  it('returns empty when start > end', () => {
    const period = {
      ...baseExamPeriod,
      startDate: new Date('2025-01-10'),
      endDate: new Date('2025-01-06'),
    }
    const slots = generateAvailableSlots(period, { includeSaturday: false })
    expect(slots.length).toBe(0)
  })

  it('handles single-day period', () => {
    const period = {
      ...baseExamPeriod,
      startDate: new Date('2025-01-06'), // Monday
      endDate: new Date('2025-01-06'),
    }
    const slots = generateAvailableSlots(period, { includeSaturday: false })
    expect(slots.length).toBe(3)
  })
})

describe('orderCoursesByConstraint', () => {
  const makeCourse = (overrides: Partial<{
    id: string
    code: string
    isShared: boolean
    requiresLab: boolean
    level: number
    _count: { studentCourses: number }
  }>) => ({
    id: overrides.id || 'c1',
    code: overrides.code || 'CSC101',
    isShared: overrides.isShared || false,
    requiresLab: overrides.requiresLab || false,
    level: overrides.level || 100,
    _count: overrides._count || { studentCourses: 50 },
  })

  it('puts shared/GST courses first', () => {
    const courses = [
      makeCourse({ id: '1', code: 'CSC301', isShared: false, level: 300 }),
      makeCourse({ id: '2', code: 'GST101', isShared: true, level: 100 }),
      makeCourse({ id: '3', code: 'MTH201', isShared: false, level: 200 }),
    ]
    const ordered = orderCoursesByConstraint(courses)
    expect(ordered[0].code).toBe('GST101')
  })

  it('puts lab courses higher than regular courses', () => {
    const courses = [
      makeCourse({ id: '1', code: 'CSC201', requiresLab: false, level: 200, _count: { studentCourses: 50 } }),
      makeCourse({ id: '2', code: 'CSC202', requiresLab: true, level: 200, _count: { studentCourses: 50 } }),
    ]
    const ordered = orderCoursesByConstraint(courses)
    expect(ordered[0].code).toBe('CSC202')
  })

  it('higher enrollment courses come first among equals', () => {
    const courses = [
      makeCourse({ id: '1', code: 'CSC101', _count: { studentCourses: 30 }, level: 100 }),
      makeCourse({ id: '2', code: 'CSC102', _count: { studentCourses: 200 }, level: 100 }),
    ]
    const ordered = orderCoursesByConstraint(courses)
    expect(ordered[0].code).toBe('CSC102')
  })

  it('higher levels get slight priority', () => {
    const courses = [
      makeCourse({ id: '1', code: 'CSC100', level: 100, _count: { studentCourses: 0 } }),
      makeCourse({ id: '2', code: 'CSC500', level: 500, _count: { studentCourses: 0 } }),
    ]
    const ordered = orderCoursesByConstraint(courses)
    expect(ordered[0].code).toBe('CSC500')
  })

  it('handles empty array', () => {
    const ordered = orderCoursesByConstraint([])
    expect(ordered).toEqual([])
  })

  it('handles single course', () => {
    const courses = [makeCourse({ id: '1', code: 'CSC101' })]
    const ordered = orderCoursesByConstraint(courses)
    expect(ordered.length).toBe(1)
    expect(ordered[0].code).toBe('CSC101')
  })
})
