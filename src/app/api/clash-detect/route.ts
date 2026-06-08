import { db } from '@/lib/db'
import { apiResponse, apiError, handleApiError, requireAuth } from '@/lib/api-utils'
import { NextRequest } from 'next/server'

/**
 * POST /api/clash-detect
 * Lecture slot clash detection engine.
 *
 * Detects (lecture timetable):
 *  ROOM     — same room, same day, overlapping time window
 *  LECTURER — same lecturer, same day, overlapping time window
 *  STUDENT  — same dept + level, two courses at the same time
 *  JUMUAH   — any slot on Friday overlapping 12:00–14:00
 *  SHARED   — WARNING: shared/GST course vs same-level cross-dept slot
 *
 * Body:
 *   timetableId: string         (required — lecture timetable ID)
 *   scope?: 'full' | 'slot'     (default: 'full')
 *   slotId?: string             (required if scope='slot')
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if ('error' in authResult) return apiError(authResult.error, authResult.status)

    const body = await request.json()
    const { timetableId, scope = 'full', slotId } = body

    if (!timetableId) return apiError('timetableId is required')
    if (scope === 'slot' && !slotId) return apiError('slotId required when scope=slot')

    // Verify timetable exists + belongs to this institution
    const timetable = await db.lectureTimetable.findFirst({
      where: {
        id: timetableId,
        institutionId: authResult.user.institutionId!,
      },
      select: { id: true, name: true, status: true },
    })
    if (!timetable) return apiError('Lecture timetable not found', 404)

    // Load active slots for the specified scope
    const slots = await db.lectureSlot.findMany({
      where: {
        lectureTimetableId: timetableId,
        status: 'ACTIVE',
        ...(scope === 'slot' ? { id: slotId } : {}),
      },
      select: {
        id: true,
        dayOfWeek: true,
        startTime: true,
        endTime: true,
        course: {
          select: {
            id: true, code: true, name: true, level: true,
            departmentId: true, lecturerId: true, isShared: true,
            lecturer: { select: { id: true, name: true, staffId: true } },
            department: { select: { id: true, code: true, name: true } },
          },
        },
        room: { select: { id: true, code: true, name: true } },
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    })

    // For slot-scope we still need all slots to check against
    const allSlots = scope === 'slot'
      ? await db.lectureSlot.findMany({
          where: { lectureTimetableId: timetableId, status: 'ACTIVE' },
          select: {
            id: true, dayOfWeek: true, startTime: true, endTime: true,
            course: {
              select: {
                id: true, code: true, level: true, departmentId: true,
                lecturerId: true, isShared: true,
                department: { select: { id: true, code: true } },
              },
            },
            room: { select: { id: true, code: true } },
          },
        })
      : slots

    type Clash = {
      type: 'ROOM' | 'LECTURER' | 'STUDENT' | 'JUMUAH' | 'SHARED'
      severity: 'ERROR' | 'WARNING'
      slotAId: string
      slotBId?: string
      courseA: string
      courseB?: string
      day: string
      time: string
      description: string
    }

    const clashes: Clash[] = []
    const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

    function overlap(sA: string, eA: string, sB: string, eB: string): boolean {
      const toMin = (t: string) => {
        const [h, m] = t.split(':').map(Number)
        return h * 60 + m
      }
      return toMin(sA) < toMin(eB) && toMin(sB) < toMin(eA)
    }

    const seen = new Set<string>()

    for (const sA of slots) {
      // --- JUMUAH CHECK ---
      if (sA.dayOfWeek === 5 && overlap(sA.startTime, sA.endTime, '12:00', '14:00')) {
        clashes.push({
          type: 'JUMUAH', severity: 'ERROR',
          slotAId: sA.id, courseA: sA.course.code,
          day: 'Friday', time: `${sA.startTime}–${sA.endTime}`,
          description: `${sA.course.code} overlaps Jumu'ah prayer time (Fri 12:00–14:00)`,
        })
      }

      for (const sB of allSlots) {
        if (sA.id === sB.id) continue
        if (sA.dayOfWeek !== sB.dayOfWeek) continue
        if (!overlap(sA.startTime, sA.endTime, sB.startTime, sB.endTime)) continue

        const pairKey = [sA.id, sB.id].sort().join('|')
        if (seen.has(pairKey)) continue
        seen.add(pairKey)

        const day = DAYS[sA.dayOfWeek]
        const time = `${sA.startTime}–${sA.endTime}`

        // --- ROOM CLASH ---
        if (sA.room.id === sB.room.id) {
          clashes.push({
            type: 'ROOM', severity: 'ERROR',
            slotAId: sA.id, slotBId: sB.id,
            courseA: sA.course.code, courseB: sB.course.code,
            day, time,
            description: `Room clash in ${sA.room.code}: ${sA.course.code} + ${sB.course.code} on ${day} ${time}`,
          })
        }

        // --- LECTURER CLASH ---
        if (sA.course.lecturerId && sA.course.lecturerId === sB.course.lecturerId) {
          clashes.push({
            type: 'LECTURER', severity: 'ERROR',
            slotAId: sA.id, slotBId: sB.id,
            courseA: sA.course.code, courseB: sB.course.code,
            day, time,
            description: `Lecturer clash: ${sA.course.lecturer?.name || 'Lecturer'} assigned to both ${sA.course.code} and ${sB.course.code} on ${day} ${time}`,
          })
        }

        // --- STUDENT CLASH (same dept + level) ---
        if (
          sA.course.departmentId === sB.course.departmentId &&
          sA.course.level === sB.course.level
        ) {
          clashes.push({
            type: 'STUDENT', severity: 'ERROR',
            slotAId: sA.id, slotBId: sB.id,
            courseA: sA.course.code, courseB: sB.course.code,
            day, time,
            description: `Student clash: ${sA.course.department.code} L${sA.course.level} students have both ${sA.course.code} and ${sB.course.code} on ${day} ${time}`,
          })
        }

        // --- SHARED COURSE WARNING (cross-dept, same level) ---
        if (
          (sA.course.isShared || sB.course.isShared) &&
          sA.course.level === sB.course.level &&
          sA.course.departmentId !== sB.course.departmentId
        ) {
          const shared = sA.course.isShared ? sA.course.code : sB.course.code
          const other = sA.course.isShared ? sB.course.code : sA.course.code
          clashes.push({
            type: 'SHARED', severity: 'WARNING',
            slotAId: sA.id, slotBId: sB.id,
            courseA: sA.course.code, courseB: sB.course.code,
            day, time,
            description: `Shared course warning: ${shared} (shared) overlaps ${other} — Level ${sA.course.level} students across departments may clash on ${day} ${time}`,
          })
        }
      }
    }

    const summary = {
      totalSlots: scope === 'full' ? allSlots.length : 1,
      clashCount: clashes.length,
      errors: clashes.filter(c => c.severity === 'ERROR').length,
      warnings: clashes.filter(c => c.severity === 'WARNING').length,
      byType: {
        ROOM: clashes.filter(c => c.type === 'ROOM').length,
        LECTURER: clashes.filter(c => c.type === 'LECTURER').length,
        STUDENT: clashes.filter(c => c.type === 'STUDENT').length,
        JUMUAH: clashes.filter(c => c.type === 'JUMUAH').length,
        SHARED: clashes.filter(c => c.type === 'SHARED').length,
      },
      clean: clashes.filter(c => c.severity === 'ERROR').length === 0,
    }

    return apiResponse({
      timetableId,
      timetableName: timetable.name,
      scope,
      summary,
      clashes,
      message: summary.clean
        ? `✅ No hard clashes — timetable is clean${summary.warnings > 0 ? ` (${summary.warnings} warning(s))` : ''}`
        : `⚠️ ${summary.errors} error(s), ${summary.warnings} warning(s) found`,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
