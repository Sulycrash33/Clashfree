/**
 * Export utilities for ClashFree timetable system
 * Supports PDF, Excel, CSV, and Print exports
 */

export interface ExamSlotExport {
  date: string
  dayOfWeek: number
  slotNumber: number
  startTime: string
  endTime: string
  courseCode: string
  courseName: string
  level: number
  department: string
  room: string
  roomCapacity: number
  studentCount: number
  isShared: boolean
}

export interface TimetableExportData {
  institution: string
  examPeriod: string
  session: string
  semester: number
  generatedAt: string
  slots: ExamSlotExport[]
}

/**
 * Export timetable to CSV format
 */
export function exportToCSV(data: TimetableExportData, filename: string = 'exam-timetable') {
  const headers = [
    'Date',
    'Day',
    'Slot',
    'Time',
    'Course Code',
    'Course Name',
    'Level',
    'Department',
    'Venue',
    'Venue Capacity',
    'Expected Students',
    'Shared Course'
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

  // Add metadata header
  const metadata = [
    `Institution: ${data.institution}`,
    `Exam Period: ${data.examPeriod}`,
    `Session: ${data.session}`,
    `Semester: ${data.semester}`,
    `Generated: ${data.generatedAt}`,
    '',
    ''
  ].join('\n')

  downloadFile(metadata + csvContent, `${filename}.csv`, 'text/csv')
}

/**
 * Export timetable to printable HTML
 */
export function exportToPrint(data: TimetableExportData) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const slotLabels = ['Morning', 'Afternoon', 'Evening']

  // Group slots by date
  const groupedByDate = data.slots.reduce((acc, slot) => {
    if (!acc[slot.date]) acc[slot.date] = {}
    if (!acc[slot.date][slot.slotNumber]) acc[slot.date][slot.slotNumber] = []
    acc[slot.date][slot.slotNumber].push(slot)
    return acc
  }, {} as Record<string, Record<number, ExamSlotExport[]>>)

  const sortedDates = Object.keys(groupedByDate).sort((a, b) => new Date(a).getTime() - new Date(b).getTime())

  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    alert('Please allow popups to print the timetable')
    return
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Exam Timetable - ${data.examPeriod}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      padding: 20px;
      background: #fff;
      color: #1a1a2e;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 3px solid #0ea5e9;
    }
    .institution { font-size: 24px; font-weight: bold; color: #1a1a2e; margin-bottom: 5px; }
    .exam-title { font-size: 18px; color: #0ea5e9; margin-bottom: 10px; }
    .meta { font-size: 12px; color: #64748b; }
    .stats { 
      display: flex; 
      justify-content: center; 
      gap: 30px; 
      margin: 20px 0; 
      padding: 15px;
      background: #f1f5f9;
      border-radius: 8px;
    }
    .stat { text-align: center; }
    .stat-value { font-size: 24px; font-weight: bold; color: #0ea5e9; }
    .stat-label { font-size: 11px; color: #64748b; text-transform: uppercase; }
    
    table { 
      width: 100%; 
      border-collapse: collapse; 
      margin-top: 20px;
      font-size: 11px;
    }
    th { 
      background: linear-gradient(135deg, #0ea5e9, #0284c7);
      color: white;
      padding: 12px 8px;
      text-align: center;
      font-weight: 600;
    }
    td { 
      padding: 10px 8px; 
      border: 1px solid #e2e8f0;
      vertical-align: top;
    }
    tr:nth-child(even) { background: #f8fafc; }
    tr:hover { background: #f1f5f9; }
    
    .date-cell { 
      font-weight: 600; 
      background: #f1f5f9;
      text-align: center;
    }
    .slot-cell { min-height: 60px; }
    .exam-card {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 8px;
      margin: 4px 0;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    }
    .exam-card.shared { border-left: 3px solid #ec4899; }
    .exam-card.regular { border-left: 3px solid #0ea5e9; }
    .course-code { 
      font-weight: 600; 
      color: #0ea5e9;
      font-size: 11px;
    }
    .course-name { 
      color: #334155;
      margin: 4px 0;
      font-size: 10px;
    }
    .course-meta { 
      display: flex; 
      justify-content: space-between;
      color: #64748b;
      font-size: 9px;
    }
    .level-badge {
      display: inline-block;
      background: #e0f2fe;
      color: #0369a1;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 9px;
      font-weight: 600;
    }
    .shared-badge {
      display: inline-block;
      background: #fce7f3;
      color: #be185d;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 9px;
      font-weight: 600;
    }
    .empty-slot {
      color: #94a3b8;
      font-style: italic;
      text-align: center;
      padding: 20px;
    }
    
    .legend {
      margin-top: 30px;
      padding: 15px;
      background: #f8fafc;
      border-radius: 8px;
      display: flex;
      justify-content: center;
      gap: 30px;
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 11px;
    }
    .legend-color {
      width: 16px;
      height: 16px;
      border-radius: 4px;
    }
    
    .footer {
      margin-top: 30px;
      text-align: center;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      font-size: 10px;
      color: #64748b;
    }
    
    @media print {
      body { padding: 10px; }
      .stats { break-inside: avoid; }
      table { break-inside: auto; }
      tr { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="institution">${data.institution}</div>
    <div class="exam-title">${data.examPeriod}</div>
    <div class="meta">
      Session: ${data.session} | Semester: ${data.semester} | Generated: ${data.generatedAt}
    </div>
  </div>
  
  <div class="stats">
    <div class="stat">
      <div class="stat-value">${sortedDates.length}</div>
      <div class="stat-label">Exam Days</div>
    </div>
    <div class="stat">
      <div class="stat-value">${data.slots.length}</div>
      <div class="stat-label">Total Exams</div>
    </div>
    <div class="stat">
      <div class="stat-value">${data.slots.reduce((sum, s) => sum + s.studentCount, 0).toLocaleString()}</div>
      <div class="stat-label">Total Students</div>
    </div>
    <div class="stat">
      <div class="stat-value">${new Set(data.slots.map(s => s.room)).size}</div>
      <div class="stat-label">Venues</div>
    </div>
  </div>
  
  <table>
    <thead>
      <tr>
        <th style="width: 120px;">Date</th>
        <th>Morning</th>
        <th>Afternoon</th>
        <th>Evening</th>
      </tr>
    </thead>
    <tbody>
      ${sortedDates.map(date => `
        <tr>
          <td class="date-cell">
            <div>${date}</div>
            <div style="font-size: 10px; color: #64748b;">${days[new Date(date).getDay()]}</div>
          </td>
          ${[1, 2, 3].map(slotNum => {
            const slots = groupedByDate[date]?.[slotNum] || []
            return `
              <td class="slot-cell">
                ${slots.length > 0 
                  ? slots.map(slot => `
                    <div class="exam-card ${slot.isShared ? 'shared' : 'regular'}">
                      <div>
                        <span class="course-code">${slot.courseCode}</span>
                        ${slot.isShared ? '<span class="shared-badge">GST</span>' : ''}
                        <span class="level-badge">${slot.level}L</span>
                      </div>
                      <div class="course-name">${slot.courseName}</div>
                      <div class="course-meta">
                        <span>📍 ${slot.room}</span>
                        <span>👥 ${slot.studentCount}</span>
                      </div>
                    </div>
                  `).join('')
                  : '<div class="empty-slot">—</div>'
                }
              </td>
            `
          }).join('')}
        </tr>
      `).join('')}
    </tbody>
  </table>
  
  <div class="legend">
    <div class="legend-item">
      <div class="legend-color" style="background: linear-gradient(135deg, #e0f2fe, #bae6fd);"></div>
      <span>Regular Course</span>
    </div>
    <div class="legend-item">
      <div class="legend-color" style="background: linear-gradient(135deg, #fce7f3, #fbcfe8);"></div>
      <span>Shared/GST Course</span>
    </div>
  </div>
  
  <div class="footer">
    <p>Generated by ClashFree - Intelligent Timetable Management System</p>
    <p>This timetable is subject to change. Please verify with your department.</p>
  </div>
  
  <script>
    window.onload = function() {
      window.print();
    }
  </script>
</body>
</html>
  `

  printWindow.document.write(html)
  printWindow.document.close()
}

/**
 * Download file helper
 */
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Generate Excel-compatible format (HTML table that Excel can open)
 */
export function exportToExcel(data: TimetableExportData, filename: string = 'exam-timetable') {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const slotLabels = ['Morning', 'Afternoon', 'Evening']

  // Group slots by date
  const groupedByDate = data.slots.reduce((acc, slot) => {
    if (!acc[slot.date]) acc[slot.date] = {}
    if (!acc[slot.date][slot.slotNumber]) acc[slot.date][slot.slotNumber] = []
    acc[slot.date][slot.slotNumber].push(slot)
    return acc
  }, {} as Record<string, Record<number, ExamSlotExport[]>>)

  const sortedDates = Object.keys(groupedByDate).sort((a, b) => new Date(a).getTime() - new Date(b).getTime())

  const html = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="UTF-8">
  <style>
    table { border-collapse: collapse; }
    th, td { border: 1px solid #000; padding: 8px; text-align: left; }
    th { background-color: #0ea5e9; color: white; font-weight: bold; }
    .header-row { background-color: #f1f5f9; font-weight: bold; }
  </style>
</head>
<body>
  <h2>${data.institution}</h2>
  <h3>${data.examPeriod}</h3>
  <p>Session: ${data.session} | Semester: ${data.semester}</p>
  <p>Generated: ${data.generatedAt}</p>
  <br/>
  <table>
    <tr>
      <th>Date</th>
      <th>Day</th>
      <th>Slot</th>
      <th>Course Code</th>
      <th>Course Name</th>
      <th>Level</th>
      <th>Department</th>
      <th>Venue</th>
      <th>Capacity</th>
      <th>Students</th>
      <th>Shared</th>
    </tr>
    ${sortedDates.flatMap(date => 
      [1, 2, 3].flatMap(slotNum => {
        const slots = groupedByDate[date]?.[slotNum] || []
        if (slots.length === 0) {
          return [[
            `<td>${date}</td>`,
            `<td>${days[new Date(date).getDay()]}</td>`,
            `<td>${slotLabels[slotNum - 1]}</td>`,
            '<td colspan="7" style="text-align: center; color: #94a3b8;">— Free Slot —</td>'
          ].join('')]
        }
        return slots.map(slot => `
          <tr>
            <td>${slot.date}</td>
            <td>${days[slot.dayOfWeek]}</td>
            <td>${slotLabels[slot.slotNumber - 1]}</td>
            <td>${slot.courseCode}</td>
            <td>${slot.courseName}</td>
            <td>${slot.level}L</td>
            <td>${slot.department}</td>
            <td>${slot.room}</td>
            <td>${slot.roomCapacity}</td>
            <td>${slot.studentCount}</td>
            <td>${slot.isShared ? 'Yes' : 'No'}</td>
          </tr>
        `)
      })
    ).join('')}
  </table>
</body>
</html>
  `

  downloadFile(html, `${filename}.xls`, 'application/vnd.ms-excel')
}

/**
 * Format date for display
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

/**
 * Get time slot label
 */
export function getSlotLabel(slotNumber: number, times?: { start?: string; end?: string }): string {
  const labels = ['Morning', 'Afternoon', 'Evening']
  const baseLabel = labels[slotNumber - 1] || 'Unknown'
  
  if (times?.start && times?.end) {
    return `${baseLabel} (${times.start} - ${times.end})`
  }
  
  return baseLabel
}
