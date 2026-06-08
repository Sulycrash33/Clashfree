import { db } from '@/lib/db'
import { apiResponse, apiError, handleApiError, requireTimetableOfficer } from '@/lib/api-utils'
import { NextRequest } from 'next/server'

/**
 * POST /api/invigilations/auto-assign
 * Auto-assigns invigilators to all unassigned exam slots in an exam period.
 *
 * Algorithm:
 *  1. Load all exam slots with enrolled student count
 *  2. Load all active lecturers for the institution
 *  3. Required per slot: 1 CHIEF + ceil(students/30) ASSISTANTs (min 1)
 *  4. Exclude: course owner, already-assigned, time-clashing lecturers, unavailable days
 *  5. Priority: same-dept first → fewest assignments (load balance)
 *  6. Skip already-fully-staffed slots
 *
 * Body: { examPeriodId: string, dryRun?: boolean }
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireTimetableOfficer()
    if ('error' in authResult) return apiError(authResult.error, authResult.status)

    const institutionId = authResult.user.institutionId
    if (!institutionId) return apiError('No institution associated with this account', 403)

    const body = await request.json()
    const { examPeriodId, dryRun = false } = body
    if (!examPeriodId) return apiError('examPeriodId is required')

    // Verify period belongs to this institution
    const period = await db.examPeriod.findFirst({
      where: { id: examPeriodId, institutionId },
      select: { id: true, name: true },
    })
    if (!period) return apiError('Exam period not found', 404)

    // 1. Load all exam slots
    const examSlots = await db.examSlot.findMany({
      where: { examPeriodId },
      select: {
        id: true,
        date: true,
        slotNumber: true,
        course: {
          select: {
            id: true,
            code: true,
            departmentId: true,
            lecturerId: true,
            _count: {
              select: {
                studentCourses: {
                  where: { status: { in: ['REGISTERED', 'CARRY_OVER', 'SPILLOVER'] } },
                },
              },
            },
          },
        },
        invigilators: { select: { id: true, lecturerId: true, role: true } },
      },
      orderBy: [{ date: 'asc' }, { slotNumber: 'asc' }],
    })

    // 2. Load all active lecturers for this institution
    const lecturers = await db.lecturer.findMany({
      where: {
        department: { faculty: { institutionId } },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        staffId: true,
        departmentId: true,
        unavailableDays: true,
        invigilations: {
          where: { examSlot: { examPeriodId } },
          select: { examSlotId: true },
        },
      },
    })

    // Build load map: lecturerId → current assignment count this period
    const loadMap = new Map<string, number>()
    for (const lec of lecturers) loadMap.set(lec.id, lec.invigilations.length)

    // Build busy map: lecturerId → Set of "YYYY-MM-DD|slotNumber"
    const busyMap = new Map<string, Set<string>>()
    for (const lec of lecturers) {
      const busy = new Set<string>()
      for (const inv of lec.invigilations) {
        const slot = examSlots.find(s => s.id === inv.examSlotId)
        if (slot) {
          busy.add(`${slot.date.toISOString().split('T')[0]}|${slot.slotNumber}`)
        }
      }
      busyMap.set(lec.id, busy)
    }

    function isBusy(lecId: string, date: Date, slotNum: number): boolean {
      return busyMap.get(lecId)?.has(`${date.toISOString().split('T')[0]}|${slotNum}`) ?? false
    }

    function isUnavailableDay(lec: typeof lecturers[0], date: Date): boolean {
      if (!lec.unavailableDays) return false
      try {
        const days: string[] = JSON.parse(lec.unavailableDays)
        const dayName = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'][date.getDay()]
        return days.includes(dayName)
      } catch {
        return false
      }
    }

    type AssignEntry = { lecturerId: string; name: string; role: string }
    type SlotResult = {
      slotId: string
      courseCode: string
      date: string
      slotNumber: number
      status: 'already_filled' | 'assigned' | 'partial' | 'unfilled'
      assigned: AssignEntry[]
      needed: number
      filled: number
    }

    const results: SlotResult[] = []
    const toCreate: Array<{ examSlotId: string; lecturerId: string; role: string; notes: string }> = []

    for (const slot of examSlots) {
      const enrolled = slot.course._count.studentCourses
      const needChiefs = 1
      const needAssistants = Math.max(1, Math.ceil(enrolled / 30))
      const totalNeeded = needChiefs + needAssistants

      const existingChiefs = slot.invigilators.filter(i => i.role === 'CHIEF').length
      const existingAssistants = slot.invigilators.filter(i => i.role === 'ASSISTANT').length

      // Already fully staffed — skip
      if (existingChiefs >= needChiefs && existingAssistants >= needAssistants) {
        results.push({
          slotId: slot.id, courseCode: slot.course.code,
          date: slot.date.toISOString().split('T')[0], slotNumber: slot.slotNumber,
          status: 'already_filled', assigned: [],
          needed: totalNeeded, filled: slot.invigilators.length,
        })
        continue
      }

      const taken = new Set(slot.invigilators.map(i => i.lecturerId))
      const courseOwner = slot.course.lecturerId
      const slotAssigned: AssignEntry[] = []

      // Get available, sorted candidates
      const candidates = lecturers
        .filter(lec => {
          if (taken.has(lec.id)) return false
          if (courseOwner && lec.id === courseOwner) return false
          if (isBusy(lec.id, slot.date, slot.slotNumber)) return false
          if (isUnavailableDay(lec, slot.date)) return false
          return true
        })
        .sort((a, b) => {
          // Same dept first
          const aDept = a.departmentId === slot.course.departmentId ? 0 : 1
          const bDept = b.departmentId === slot.course.departmentId ? 0 : 1
          if (aDept !== bDept) return aDept - bDept
          // Then fewest assignments
          return (loadMap.get(a.id) ?? 0) - (loadMap.get(b.id) ?? 0)
        })

      let ci = 0

      // Fill CHIEFs
      for (let i = existingChiefs; i < needChiefs && ci < candidates.length; i++) {
        const lec = candidates[ci++]
        const dayKey = `${slot.date.toISOString().split('T')[0]}|${slot.slotNumber}`
        taken.add(lec.id)
        busyMap.get(lec.id)?.add(dayKey) || busyMap.set(lec.id, new Set([dayKey]))
        loadMap.set(lec.id, (loadMap.get(lec.id) ?? 0) + 1)
        slotAssigned.push({ lecturerId: lec.id, name: lec.name, role: 'CHIEF' })
        if (!dryRun) {
          toCreate.push({
            examSlotId: slot.id, lecturerId: lec.id, role: 'CHIEF',
            notes: `Auto-assigned: Chief Invigilator for ${slot.course.code}`,
          })
        }
      }

      // Fill ASSISTANTs
      for (let i = existingAssistants; i < needAssistants && ci < candidates.length; i++) {
        const lec = candidates[ci++]
        const dayKey = `${slot.date.toISOString().split('T')[0]}|${slot.slotNumber}`
        taken.add(lec.id)
        busyMap.get(lec.id)?.add(dayKey) || busyMap.set(lec.id, new Set([dayKey]))
        loadMap.set(lec.id, (loadMap.get(lec.id) ?? 0) + 1)
        slotAssigned.push({ lecturerId: lec.id, name: lec.name, role: 'ASSISTANT' })
        if (!dryRun) {
          toCreate.push({
            examSlotId: slot.id, lecturerId: lec.id, role: 'ASSISTANT',
            notes: `Auto-assigned: Assistant Invigilator for ${slot.course.code}`,
          })
        }
      }

      const totalFilled = slot.invigilators.length + slotAssigned.length
      const status =
        totalFilled >= totalNeeded ? 'assigned' :
        slotAssigned.length > 0 ? 'partial' : 'unfilled'

      results.push({
        slotId: slot.id, courseCode: slot.course.code,
        date: slot.date.toISOString().split('T')[0], slotNumber: slot.slotNumber,
        status, assigned: slotAssigned, needed: totalNeeded, filled: totalFilled,
      })
    }

    // Persist to DB
    if (!dryRun && toCreate.length > 0) {
      await db.invigilatorAssignment.createMany({ data: toCreate, skipDuplicates: true })
    }

    const summary = {
      total: results.length,
      alreadyFilled: results.filter(r => r.status === 'already_filled').length,
      fullyAssigned: results.filter(r => r.status === 'assigned').length,
      partial: results.filter(r => r.status === 'partial').length,
      unfilled: results.filter(r => r.status === 'unfilled').length,
      assignmentsCreated: toCreate.length,
      dryRun,
    }

    return apiResponse({
      summary,
      slots: results,
      message: dryRun
        ? `Dry run: would create ${toCreate.length} invigilation assignments`
        : `✅ Auto-assigned ${toCreate.length} invigilators across ${results.filter(r => r.status !== 'already_filled').length} exam slots`,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
