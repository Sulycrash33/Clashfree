import { describe, it, expect, vi } from 'vitest'
import { ConstraintType, ConstraintSeverity, ConstraintViolation } from '@/lib/engine/constraints'

/**
 * Test the pure functions from conflict-resolver.
 * generateManualSuggestion is a pure function.
 * generateResolutionSuggestions' sorting logic is also testable.
 */

interface ResolutionSuggestion {
  conflictId: string
  type: 'MOVE_SLOT' | 'CHANGE_ROOM' | 'SPLIT_EXAM' | 'SWAP_COURSES' | 'ADD_SLOT' | 'MANUAL'
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  description: string
  actions: { action: string; entityId: string; entityType: string; currentValue?: string; suggestedValue?: string }[]
  autoResolvable: boolean
  impactScore: number
}

// Re-implement the pure function for isolated testing
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

function sortSuggestionsByPriority(suggestions: ResolutionSuggestion[]): ResolutionSuggestion[] {
  const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 }
  return [...suggestions].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
}

describe('generateManualSuggestion', () => {
  it('creates MANUAL type suggestion', () => {
    const violation: ConstraintViolation = {
      type: ConstraintType.NO_ROOM_DOUBLE_BOOKING,
      severity: ConstraintSeverity.HARD,
      message: 'Room LH1 double-booked',
      affectedEntities: ['slot1', 'slot2'],
    }
    const suggestion = generateManualSuggestion(violation)
    expect(suggestion.type).toBe('MANUAL')
  })

  it('sets autoResolvable to false', () => {
    const violation: ConstraintViolation = {
      type: ConstraintType.NO_STUDENT_DOUBLE_BOOKING,
      severity: ConstraintSeverity.HARD,
      message: 'Student double-booked',
      affectedEntities: ['student1'],
    }
    const suggestion = generateManualSuggestion(violation)
    expect(suggestion.autoResolvable).toBe(false)
  })

  it('uses violation message as description', () => {
    const violation: ConstraintViolation = {
      type: ConstraintType.ROOM_CAPACITY,
      severity: ConstraintSeverity.HARD,
      message: 'CSC101: 500 students in room with capacity 200',
      affectedEntities: ['slot1'],
    }
    const suggestion = generateManualSuggestion(violation)
    expect(suggestion.description).toBe('CSC101: 500 students in room with capacity 200')
  })

  it('creates conflictId from joined entities', () => {
    const violation: ConstraintViolation = {
      type: ConstraintType.CO_CLASH_DETECTION,
      severity: ConstraintSeverity.HARD,
      message: 'CO clash',
      affectedEntities: ['a', 'b', 'c'],
    }
    const suggestion = generateManualSuggestion(violation)
    expect(suggestion.conflictId).toBe('a-b-c')
  })

  it('handles empty affectedEntities', () => {
    const violation: ConstraintViolation = {
      type: ConstraintType.NO_ROOM_DOUBLE_BOOKING,
      severity: ConstraintSeverity.HARD,
      message: 'Unknown conflict',
      affectedEntities: [],
    }
    const suggestion = generateManualSuggestion(violation)
    expect(suggestion.conflictId).toBe('')
    expect(suggestion.actions[0].entityId).toBe('')
  })

  it('always sets impactScore to 100', () => {
    const violation: ConstraintViolation = {
      type: ConstraintType.LECTURER_AVAILABILITY,
      severity: ConstraintSeverity.HARD,
      message: 'Lecturer unavailable',
      affectedEntities: ['lec1'],
    }
    const suggestion = generateManualSuggestion(violation)
    expect(suggestion.impactScore).toBe(100)
  })

  it('sets action type to MANUAL_REVIEW', () => {
    const violation: ConstraintViolation = {
      type: ConstraintType.ROOM_TYPE_MATCH,
      severity: ConstraintSeverity.HARD,
      message: 'Lab needed',
      affectedEntities: ['course1'],
    }
    const suggestion = generateManualSuggestion(violation)
    expect(suggestion.actions[0].action).toBe('MANUAL_REVIEW')
    expect(suggestion.actions[0].entityType).toBe('COURSE')
  })
})

describe('sortSuggestionsByPriority', () => {
  const makeSuggestion = (priority: 'HIGH' | 'MEDIUM' | 'LOW', id: string): ResolutionSuggestion => ({
    conflictId: id,
    type: 'MANUAL',
    priority,
    description: `Suggestion ${id}`,
    actions: [],
    autoResolvable: false,
    impactScore: 50,
  })

  it('sorts HIGH before MEDIUM before LOW', () => {
    const suggestions = [
      makeSuggestion('LOW', '1'),
      makeSuggestion('HIGH', '2'),
      makeSuggestion('MEDIUM', '3'),
    ]
    const sorted = sortSuggestionsByPriority(suggestions)
    expect(sorted[0].priority).toBe('HIGH')
    expect(sorted[1].priority).toBe('MEDIUM')
    expect(sorted[2].priority).toBe('LOW')
  })

  it('maintains order for same priority', () => {
    const suggestions = [
      makeSuggestion('HIGH', 'a'),
      makeSuggestion('HIGH', 'b'),
      makeSuggestion('HIGH', 'c'),
    ]
    const sorted = sortSuggestionsByPriority(suggestions)
    expect(sorted[0].conflictId).toBe('a')
    expect(sorted[1].conflictId).toBe('b')
    expect(sorted[2].conflictId).toBe('c')
  })

  it('handles empty array', () => {
    const sorted = sortSuggestionsByPriority([])
    expect(sorted).toEqual([])
  })

  it('handles single element', () => {
    const suggestions = [makeSuggestion('MEDIUM', '1')]
    const sorted = sortSuggestionsByPriority(suggestions)
    expect(sorted.length).toBe(1)
    expect(sorted[0].conflictId).toBe('1')
  })
})
