import { describe, it, expect } from 'vitest'
import {
  ConstraintType,
  ConstraintSeverity,
  CONSTRAINT_DEFINITIONS,
} from '@/lib/engine/constraints'

describe('ConstraintType enum', () => {
  it('defines all hard constraints', () => {
    const hardConstraints = [
      ConstraintType.NO_STUDENT_DOUBLE_BOOKING,
      ConstraintType.NO_LECTURER_DOUBLE_BOOKING,
      ConstraintType.NO_ROOM_DOUBLE_BOOKING,
      ConstraintType.ROOM_CAPACITY,
      ConstraintType.ROOM_TYPE_MATCH,
      ConstraintType.LECTURER_AVAILABILITY,
      ConstraintType.CO_CLASH_DETECTION,
    ]
    expect(hardConstraints.length).toBe(7)
    hardConstraints.forEach((c) => expect(c).toBeDefined())
  })

  it('defines all soft constraints', () => {
    const softConstraints = [
      ConstraintType.SPREAD_EXAMS,
      ConstraintType.BALANCE_SLOTS,
      ConstraintType.MINIMIZE_MOVEMENT,
      ConstraintType.PREFERRED_TIMES,
      ConstraintType.SAME_LEVEL_GROUPING,
      ConstraintType.GST_ISOLATED_SLOTS,
    ]
    expect(softConstraints.length).toBe(6)
    softConstraints.forEach((c) => expect(c).toBeDefined())
  })

  it('has 13 total constraint types', () => {
    expect(Object.keys(ConstraintType).length).toBe(13)
  })
})

describe('CONSTRAINT_DEFINITIONS', () => {
  it('has a definition for every ConstraintType', () => {
    const types = Object.values(ConstraintType)
    types.forEach((type) => {
      expect(CONSTRAINT_DEFINITIONS[type]).toBeDefined()
      expect(CONSTRAINT_DEFINITIONS[type].type).toBe(type)
    })
  })

  it('hard constraints have severity HARD', () => {
    const hardTypes = [
      ConstraintType.NO_STUDENT_DOUBLE_BOOKING,
      ConstraintType.NO_LECTURER_DOUBLE_BOOKING,
      ConstraintType.NO_ROOM_DOUBLE_BOOKING,
      ConstraintType.ROOM_CAPACITY,
      ConstraintType.ROOM_TYPE_MATCH,
      ConstraintType.LECTURER_AVAILABILITY,
      ConstraintType.CO_CLASH_DETECTION,
    ]
    hardTypes.forEach((type) => {
      expect(CONSTRAINT_DEFINITIONS[type].severity).toBe(ConstraintSeverity.HARD)
    })
  })

  it('soft constraints have severity SOFT', () => {
    const softTypes = [
      ConstraintType.SPREAD_EXAMS,
      ConstraintType.BALANCE_SLOTS,
      ConstraintType.MINIMIZE_MOVEMENT,
      ConstraintType.PREFERRED_TIMES,
      ConstraintType.SAME_LEVEL_GROUPING,
      ConstraintType.GST_ISOLATED_SLOTS,
    ]
    softTypes.forEach((type) => {
      expect(CONSTRAINT_DEFINITIONS[type].severity).toBe(ConstraintSeverity.SOFT)
    })
  })

  it('all hard constraints have weight >= 9', () => {
    Object.values(CONSTRAINT_DEFINITIONS)
      .filter((c) => c.severity === ConstraintSeverity.HARD)
      .forEach((c) => {
        expect(c.weight).toBeGreaterThanOrEqual(9)
      })
  })

  it('all soft constraints have weight between 1 and 10', () => {
    Object.values(CONSTRAINT_DEFINITIONS)
      .filter((c) => c.severity === ConstraintSeverity.SOFT)
      .forEach((c) => {
        expect(c.weight).toBeGreaterThanOrEqual(1)
        expect(c.weight).toBeLessThanOrEqual(10)
      })
  })

  it('every definition has a non-empty description', () => {
    Object.values(CONSTRAINT_DEFINITIONS).forEach((c) => {
      expect(c.description).toBeTruthy()
      expect(c.description.length).toBeGreaterThan(10)
    })
  })

  it('GST_ISOLATED_SLOTS has highest soft weight', () => {
    const softConstraints = Object.values(CONSTRAINT_DEFINITIONS).filter(
      (c) => c.severity === ConstraintSeverity.SOFT
    )
    const maxWeight = Math.max(...softConstraints.map((c) => c.weight))
    expect(CONSTRAINT_DEFINITIONS[ConstraintType.GST_ISOLATED_SLOTS].weight).toBe(maxWeight)
  })
})
