import { NextResponse } from 'next/server'

/**
 * GET /api/v1/integrate
 * 
 * Returns API documentation and available endpoints for the integration mode.
 */
export async function GET() {
  return NextResponse.json({
    name: 'ClashFree Integration API',
    version: '1.0.0',
    description: 'Programmatic access to ClashFree timetable generation engine. Use this to integrate conflict-free scheduling into your existing Student Information System.',
    authentication: {
      type: 'Bearer token',
      header: 'Authorization: Bearer cfk_<your_key>',
      manage: 'POST /api/v1/integrate/keys (requires authenticated session)',
    },
    endpoints: {
      'GET /api/v1/integrate': 'This documentation',
      'GET /api/v1/integrate/data': 'View data summary for your institution',
      'POST /api/v1/integrate/data': 'Bulk import courses, students, rooms, or lecturers',
      'POST /api/v1/integrate/validate': 'Validate data completeness and check for conflicts',
      'POST /api/v1/integrate/generate': 'Generate a conflict-free timetable',
      'GET /api/v1/integrate/timetable': 'Retrieve generated timetable (JSON or CSV)',
      'GET /api/v1/integrate/keys': 'List API keys (requires admin session)',
      'POST /api/v1/integrate/keys': 'Create new API key (requires admin session)',
      'DELETE /api/v1/integrate/keys': 'Revoke an API key (requires admin session)',
    },
    workflow: [
      '1. Create an API key via the ClashFree dashboard or POST /api/v1/integrate/keys',
      '2. Import your institution data: POST /api/v1/integrate/data',
      '3. Validate data completeness: POST /api/v1/integrate/validate',
      '4. Generate timetable: POST /api/v1/integrate/generate',
      '5. Export result: GET /api/v1/integrate/timetable?examPeriodId=...&format=json',
    ],
    dataImportExample: {
      courses: {
        url: 'POST /api/v1/integrate/data',
        body: {
          type: 'courses',
          data: [
            { code: 'CSC101', name: 'Introduction to Computing', departmentCode: 'CSC', level: 100, creditUnits: 3, semester: 1 },
            { code: 'MTH201', name: 'Mathematical Methods I', departmentCode: 'MTH', level: 200, creditUnits: 4, semester: 1 },
          ],
        },
      },
      students: {
        url: 'POST /api/v1/integrate/data',
        body: {
          type: 'students',
          data: [
            { regNumber: 'NSU/2022/CSC/001', name: 'John Doe', departmentCode: 'CSC', level: 200, courseRegistrations: ['CSC201', 'CSC203', 'MTH201'] },
          ],
        },
      },
    },
    generateExample: {
      url: 'POST /api/v1/integrate/generate',
      body: {
        examPeriodId: '<exam_period_id>',
        maxIterations: 10000,
        timeLimitMs: 120000,
        optimizeForSpread: true,
        isolateGSTCourses: true,
      },
    },
    support: {
      contact: 'ClashFree Support',
      docs: 'https://clashfree.app/docs/integration',
    },
  })
}
