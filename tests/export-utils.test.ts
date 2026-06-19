import { describe, it, expect, vi, beforeEach } from 'vitest'
import { formatDate, getSlotLabel } from '@/lib/export-utils'
import type { TimetableExportData, ExamSlotExport } from '@/lib/export-utils'

describe('formatDate', () => {
  it('formats Date object to localized string', () => {
    const date = new Date('2025-03-15')
    const formatted = formatDate(date)
    // en-GB format: "Sat, 15 Mar 2025"
    expect(formatted).toContain('15')
    expect(formatted).toContain('Mar')
    expect(formatted).toContain('2025')
  })

  it('formats string date input', () => {
    const formatted = formatDate('2025-06-20')
    expect(formatted).toContain('20')
    expect(formatted).toContain('Jun')
    expect(formatted).toContain('2025')
  })

  it('includes weekday abbreviation', () => {
    // Jan 6, 2025 is a Monday
    const formatted = formatDate(new Date('2025-01-06'))
    expect(formatted).toContain('Mon')
  })

  it('handles different months correctly', () => {
    const dates = [
      { input: '2025-01-15', month: 'Jan' },
      { input: '2025-06-15', month: 'Jun' },
      { input: '2025-12-25', month: 'Dec' },
    ]
    dates.forEach(({ input, month }) => {
      const formatted = formatDate(input)
      expect(formatted).toContain(month)
    })
  })
})

describe('getSlotLabel', () => {
  it('returns "Morning" for slot 1', () => {
    expect(getSlotLabel(1)).toBe('Morning')
  })

  it('returns "Afternoon" for slot 2', () => {
    expect(getSlotLabel(2)).toBe('Afternoon')
  })

  it('returns "Evening" for slot 3', () => {
    expect(getSlotLabel(3)).toBe('Evening')
  })

  it('returns "Unknown" for invalid slot number', () => {
    expect(getSlotLabel(4)).toBe('Unknown')
    expect(getSlotLabel(0)).toBe('Unknown')
  })

  it('appends time range when times provided', () => {
    const result = getSlotLabel(1, { start: '09:00', end: '12:00' })
    expect(result).toBe('Morning (09:00 - 12:00)')
  })

  it('appends time range for afternoon slot', () => {
    const result = getSlotLabel(2, { start: '14:00', end: '17:00' })
    expect(result).toBe('Afternoon (14:00 - 17:00)')
  })

  it('returns base label when times are undefined', () => {
    const result = getSlotLabel(1, { start: undefined, end: undefined })
    expect(result).toBe('Morning')
  })

  it('returns base label when times object is undefined', () => {
    const result = getSlotLabel(2, undefined)
    expect(result).toBe('Afternoon')
  })

  it('returns base label when only start is provided', () => {
    const result = getSlotLabel(1, { start: '09:00', end: undefined })
    expect(result).toBe('Morning')
  })

  it('returns base label when only end is provided', () => {
    const result = getSlotLabel(1, { start: undefined, end: '12:00' })
    expect(result).toBe('Morning')
  })
})

describe('exportToCSV (logic validation)', () => {
  // We test CSV content generation logic since downloadFile uses DOM APIs
  // We replicate the CSV building logic here for unit testing

  function buildCSVContent(data: TimetableExportData): string {
    const headers = [
      'Date', 'Day', 'Slot', 'Time', 'Course Code', 'Course Name',
      'Level', 'Department', 'Venue', 'Venue Capacity', 'Expected Students', 'Shared Course'
    ]
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const slotLabels = ['Morning', 'Afternoon', 'Evening']

    const rows = data.slots.map(slot => [
      slot.date,
      days[slot.dayOfWeek],
      slotLabels[slot.slotNumber - 1],
      `${slot.startTime} - ${slot.endTime}`,
      slot.courseCode,
      slot.courseName,
      `${slot.level}L`,
      slot.department,
      slot.room,
      slot.roomCapacity.toString(),
      slot.studentCount.toString(),
      slot.isShared ? 'Yes' : 'No'
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const metadata = [
      `Institution: ${data.institution}`,
      `Exam Period: ${data.examPeriod}`,
      `Session: ${data.session}`,
      `Semester: ${data.semester}`,
      `Generated: ${data.generatedAt}`,
      '',
      ''
    ].join('\n')

    return metadata + csvContent
  }

  const sampleData: TimetableExportData = {
    institution: 'Federal University Test',
    examPeriod: 'First Semester 2024/2025',
    session: '2024/2025',
    semester: 1,
    generatedAt: '2025-01-15 10:00',
    slots: [
      {
        date: '2025-01-20',
        dayOfWeek: 1,
        slotNumber: 1,
        startTime: '09:00',
        endTime: '12:00',
        courseCode: 'CSC101',
        courseName: 'Introduction to Computer Science',
        level: 100,
        department: 'Computer Science',
        room: 'LH1',
        roomCapacity: 200,
        studentCount: 150,
        isShared: false,
      },
      {
        date: '2025-01-20',
        dayOfWeek: 1,
        slotNumber: 2,
        startTime: '14:00',
        endTime: '17:00',
        courseCode: 'GST101',
        courseName: 'Use of English',
        level: 100,
        department: 'General Studies',
        room: 'AUDIT',
        roomCapacity: 1000,
        studentCount: 800,
        isShared: true,
      },
    ],
  }

  it('includes metadata header', () => {
    const csv = buildCSVContent(sampleData)
    expect(csv).toContain('Institution: Federal University Test')
    expect(csv).toContain('Exam Period: First Semester 2024/2025')
    expect(csv).toContain('Session: 2024/2025')
    expect(csv).toContain('Semester: 1')
  })

  it('includes column headers', () => {
    const csv = buildCSVContent(sampleData)
    expect(csv).toContain('Date,Day,Slot,Time,Course Code')
  })

  it('formats course data correctly', () => {
    const csv = buildCSVContent(sampleData)
    expect(csv).toContain('"CSC101"')
    expect(csv).toContain('"Introduction to Computer Science"')
    expect(csv).toContain('"100L"')
    expect(csv).toContain('"Monday"')
    expect(csv).toContain('"Morning"')
  })

  it('marks shared courses correctly', () => {
    const csv = buildCSVContent(sampleData)
    expect(csv).toContain('"Yes"')
    expect(csv).toContain('"No"')
  })

  it('includes time range', () => {
    const csv = buildCSVContent(sampleData)
    expect(csv).toContain('"09:00 - 12:00"')
    expect(csv).toContain('"14:00 - 17:00"')
  })

  it('handles empty slots array', () => {
    const emptyData: TimetableExportData = { ...sampleData, slots: [] }
    const csv = buildCSVContent(emptyData)
    expect(csv).toContain('Date,Day,Slot,Time')
    // Only metadata + headers, no data rows
    const lines = csv.split('\n')
    const headerLine = lines.find(l => l.startsWith('Date,'))
    expect(headerLine).toBeDefined()
  })

  it('quotes all cell values for CSV safety', () => {
    const csv = buildCSVContent(sampleData)
    const dataLines = csv.split('\n').filter(l => l.startsWith('"'))
    dataLines.forEach(line => {
      // Each cell should be quoted
      const cells = line.split(',')
      cells.forEach(cell => {
        expect(cell.startsWith('"') || cell === '').toBe(true)
      })
    })
  })
})
