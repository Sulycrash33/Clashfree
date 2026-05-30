'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageHeader } from '@/components/page-header'
import { Calendar, Clock, MapPin, Users, AlertTriangle, CheckCircle2, Loader2, Sparkles, RefreshCw, XCircle, Eye, Filter } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ExportButtons } from '@/components/export-buttons'
import { VersionHistory } from '@/components/version-history'
import { ConflictBadge } from '@/components/notification-badge'
import type { TimetableExportData, ExamSlotExport } from '@/lib/export-utils'

interface ExamSlot {
  id: string
  date: string
  dayOfWeek: number
  slotNumber: number
  startTime: string
  endTime: string
  course: {
    id: string
    code: string
    name: string
    level: number
    isShared: boolean
    department?: { code: string; name: string }
    _count?: { studentCourses: number }
  }
  room: { id: string; code: string; name: string; capacity: number }
  status: string
}

interface ExamPeriod {
  id: string
  name: string
  session: string
  semester: number
  startDate: string
  endDate: string
  status: string
  morningStart?: string
  morningEnd?: string
  afternoonStart?: string
  afternoonEnd?: string
  eveningStart?: string
  eveningEnd?: string
}

interface Conflict {
  id: string
  type: string
  severity: string
  status: string
  description: string
  affectedName: string
}

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const slotLabels = ['Morning', 'Afternoon', 'Evening']
const slotColors = [
  'from-cyan-500/20 to-blue-500/20 border-cyan-500/30',
  'from-purple-500/20 to-pink-500/20 border-purple-500/30',
  'from-amber-500/20 to-yellow-500/20 border-amber-500/30',
]

const levelColors: Record<number, string> = {
  100: 'bg-green-500/20 text-green-400 border-green-500/30',
  200: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  300: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  400: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  500: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
}

export default function ExamTimetablePage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [examPeriods, setExamPeriods] = useState<ExamPeriod[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<string>('')
  const [selectedPeriodData, setSelectedPeriodData] = useState<ExamPeriod | null>(null)
  const [examSlots, setExamSlots] = useState<ExamSlot[]>([])
  const [conflicts, setConflicts] = useState<Conflict[]>([])
  const [stats, setStats] = useState({ totalExams: 0, uniqueCourses: 0, roomsUsed: 0, totalStudents: 0 })
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressMessage, setProgressMessage] = useState('')
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')
  const [filterLevel, setFilterLevel] = useState<string>('all')
  const [filterDept, setFilterDept] = useState<string>('all')
  const [currentVersion, setCurrentVersion] = useState(0)

  const fetchExamPeriods = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/exam-periods')
      if (res.ok) {
        const data = await res.json()
        setExamPeriods(data)
        if (data.length > 0) {
          setSelectedPeriod(data[0].id)
          setSelectedPeriodData(data[0])
        }
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to fetch exam periods', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const fetchExamSlots = useCallback(async () => {
    if (!selectedPeriod) return

    try {
      const res = await fetch(`/api/exam-slots?examPeriodId=${selectedPeriod}`)
      if (res.ok) {
        const data = await res.json()
        setExamSlots(data.slots || [])
        setStats(data.stats || { totalExams: 0, uniqueCourses: 0, roomsUsed: 0, totalStudents: 0 })
      }
    } catch (error) {
      console.error('Failed to fetch exam slots:', error)
    }
  }, [selectedPeriod])

  const fetchConflicts = useCallback(async () => {
    if (!selectedPeriod) return

    try {
      const res = await fetch(`/api/conflicts?examPeriodId=${selectedPeriod}`)
      if (res.ok) {
        const data = await res.json()
        setConflicts(data.conflicts || [])
      }
    } catch (error) {
      console.error('Failed to fetch conflicts:', error)
    }
  }, [selectedPeriod])

  useEffect(() => {
    fetchExamPeriods()
  }, [fetchExamPeriods])

  useEffect(() => {
    fetchExamSlots()
    fetchConflicts()
  }, [fetchExamSlots, fetchConflicts])

  useEffect(() => {
    if (selectedPeriod) {
      const period = examPeriods.find(p => p.id === selectedPeriod)
      setSelectedPeriodData(period || null)
    }
  }, [selectedPeriod, examPeriods])

  const handleGenerate = async () => {
    if (!selectedPeriod) return
    setGenerating(true)
    setProgress(0)
    setProgressMessage('Initializing...')

    const progressSteps = [
      { progress: 10, message: 'Loading courses and students...' },
      { progress: 25, message: 'Checking constraints...' },
      { progress: 40, message: 'Predicting CO clashes...' },
      { progress: 55, message: 'Generating timetable...' },
      { progress: 70, message: 'Validating assignments...' },
      { progress: 85, message: 'Checking for conflicts...' },
      { progress: 95, message: 'Finalizing...' },
    ]

    let stepIndex = 0
    const interval = setInterval(() => {
      if (stepIndex < progressSteps.length) {
        setProgress(progressSteps[stepIndex].progress)
        setProgressMessage(progressSteps[stepIndex].message)
        stepIndex++
      }
    }, 500)

    try {
      const res = await fetch('/api/exam-periods/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examPeriodId: selectedPeriod }),
      })

      clearInterval(interval)

      if (res.ok) {
        const result = await res.json()
        setProgress(100)
        setProgressMessage('Complete!')

        if (result.success) {
          toast({
            title: 'Success!',
            description: `Generated timetable with ${result.generation?.assignments?.length || 0} exam slots`,
          })
          fetchExamSlots()
          fetchConflicts()
          setCurrentVersion(prev => prev + 1)
        } else {
          toast({
            title: 'Generation Completed with Issues',
            description: result.message || 'Some conflicts were detected',
            variant: 'destructive',
          })
        }
      } else {
        const error = await res.json()
        toast({ title: 'Generation Failed', description: error.error || 'Failed to generate timetable', variant: 'destructive' })
      }
    } catch (error) {
      clearInterval(interval)
      toast({ title: 'Error', description: 'An error occurred during generation', variant: 'destructive' })
    } finally {
      setTimeout(() => {
        setGenerating(false)
        setProgress(0)
        setProgressMessage('')
      }, 1000)
    }
  }

  const handleClearTimetable = async () => {
    if (!selectedPeriod) return

    if (!confirm('Are you sure you want to clear all exam slots for this period?')) return

    try {
      const res = await fetch(`/api/exam-slots?examPeriodId=${selectedPeriod}`, { method: 'DELETE' })
      if (res.ok) {
        setExamSlots([])
        setStats({ totalExams: 0, uniqueCourses: 0, roomsUsed: 0, totalStudents: 0 })
        toast({ title: 'Success', description: 'Timetable cleared' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to clear timetable', variant: 'destructive' })
    }
  }

  // Filter slots
  const filteredSlots = useMemo(() => {
    return examSlots.filter(slot => {
      if (filterLevel !== 'all' && slot.course.level !== parseInt(filterLevel)) return false
      if (filterDept !== 'all' && slot.course.department?.code !== filterDept) return false
      return true
    })
  }, [examSlots, filterLevel, filterDept])

  // Get unique departments for filter
  const departments = useMemo(() => {
    const depts = new Map()
    examSlots.forEach(slot => {
      if (slot.course.department) {
        depts.set(slot.course.department.code, slot.course.department.name)
      }
    })
    return Array.from(depts.entries())
  }, [examSlots])

  // Group slots by date and slot number for the calendar view
  const groupedSlots = useMemo(() => {
    return filteredSlots.reduce((acc, slot) => {
      const dateKey = new Date(slot.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
      if (!acc[dateKey]) acc[dateKey] = {}
      if (!acc[dateKey][slot.slotNumber]) acc[dateKey][slot.slotNumber] = []
      acc[dateKey][slot.slotNumber].push(slot)
      return acc
    }, {} as Record<string, Record<number, ExamSlot[]>>)
  }, [filteredSlots])

  // Sort dates
  const sortedDates = useMemo(() => {
    return Object.keys(groupedSlots).sort((a, b) => {
      const dateA = new Date(a)
      const dateB = new Date(b)
      return dateA.getTime() - dateB.getTime()
    })
  }, [groupedSlots])

  // Get slot times from exam period
  const getSlotTime = (slotNum: number) => {
    if (!selectedPeriodData) return slotLabels[slotNum - 1]
    switch (slotNum) {
      case 1: return `Morning (${selectedPeriodData.morningStart || '8:00'} - ${selectedPeriodData.morningEnd || '11:00'})`
      case 2: return `Afternoon (${selectedPeriodData.afternoonStart || '12:00'} - ${selectedPeriodData.afternoonEnd || '15:00'})`
      case 3: return `Evening (${selectedPeriodData.eveningStart || '16:00'} - ${selectedPeriodData.eveningEnd || '19:00'})`
      default: return slotLabels[slotNum - 1]
    }
  }

  // Prepare export data
  const exportData: TimetableExportData = useMemo(() => {
    return {
      institution: 'Nasarawa State University, Keffi',
      examPeriod: selectedPeriodData?.name || 'Exam Timetable',
      session: selectedPeriodData?.session || '2025/2026',
      semester: selectedPeriodData?.semester || 1,
      generatedAt: new Date().toLocaleString(),
      slots: examSlots.map(slot => ({
        date: new Date(slot.date).toLocaleDateString(),
        dayOfWeek: slot.dayOfWeek,
        slotNumber: slot.slotNumber,
        startTime: slot.startTime,
        endTime: slot.endTime,
        courseCode: slot.course.code,
        courseName: slot.course.name,
        level: slot.course.level,
        department: slot.course.department?.name || 'General',
        room: slot.room.name,
        roomCapacity: slot.room.capacity,
        studentCount: slot.course._count?.studentCourses || 0,
        isShared: slot.course.isShared,
      })),
    }
  }, [examSlots, selectedPeriodData])

  const criticalConflicts = conflicts.filter(c => c.severity === 'CRITICAL').length
  const warningConflicts = conflicts.filter(c => c.severity === 'WARNING').length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Exam Timetable"
        description="Visual canvas for exam scheduling with CO clash detection"
        onRefresh={fetchExamSlots}
        loading={loading}
      />

      {/* Control Panel */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="space-y-1">
                <label className="text-sm text-slate-400">Exam Period</label>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="w-72 bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select exam period" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10">
                    {examPeriods.map((p) => (
                      <SelectItem key={p.id} value={p.id} className="text-white">
                        {p.name} - {p.session} Sem {p.semester}
                      </SelectItem>
                    ))}
                    {examPeriods.length === 0 && (
                      <SelectItem value="demo" className="text-white" disabled>No exam periods available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              {selectedPeriodData && (
                <Badge variant="outline" className={`border-white/10 ${
                  selectedPeriodData.status === 'GENERATED' ? 'text-green-400' :
                  selectedPeriodData.status === 'PUBLISHED' ? 'text-blue-400' :
                  selectedPeriodData.status === 'SETUP' ? 'text-amber-400' : 'text-slate-400'
                }`}>
                  {selectedPeriodData.status}
                </Badge>
              )}
              
              {/* Version Badge */}
              <VersionHistory examPeriodId={selectedPeriod} currentVersion={currentVersion} />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <ExportButtons data={exportData} disabled={examSlots.length === 0} />
              
              {examSlots.length > 0 && (
                <Button
                  variant="outline"
                  onClick={handleClearTimetable}
                  className="border-red-500/20 text-red-400 hover:bg-red-500/10"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Clear
                </Button>
              )}
              <Button
                onClick={handleGenerate}
                disabled={generating || !selectedPeriod}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white border-0"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Timetable
                  </>
                )}
              </Button>
            </div>
          </div>

          {generating && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">{progressMessage}</span>
                <span className="text-cyan-400">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2 bg-white/10" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white/5 border-white/10 hover:bg-white/[0.07] transition-colors">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{sortedDates.length}</div>
                <div className="text-xs text-slate-400">Exam Days</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10 hover:bg-white/[0.07] transition-colors">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{stats.totalExams}</div>
                <div className="text-xs text-slate-400">Exams Scheduled</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10 hover:bg-white/[0.07] transition-colors">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/20 to-yellow-500/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{stats.totalStudents.toLocaleString()}</div>
                <div className="text-xs text-slate-400">Students</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10 hover:bg-white/[0.07] transition-colors">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{stats.roomsUsed}</div>
                <div className="text-xs text-slate-400">Venues Used</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conflicts Alert */}
      {conflicts.length > 0 && (
        <Card className="bg-red-500/5 border-red-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <ConflictBadge 
                count={conflicts.length} 
                critical={criticalConflicts}
                warnings={warningConflicts}
              />
              <Button 
                variant="link" 
                className="text-red-400 hover:text-red-300"
                onClick={() => window.location.href = '/dashboard/conflicts'}
              >
                View All Conflicts →
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      {examSlots.length > 0 && (
        <Card className="bg-white/5 border-white/10">
          <CardContent className="pt-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-400">Filter:</span>
              </div>
              <Select value={filterLevel} onValueChange={setFilterLevel}>
                <SelectTrigger className="w-32 bg-white/5 border-white/10 text-white text-sm">
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10">
                  <SelectItem value="all" className="text-white">All Levels</SelectItem>
                  {[100, 200, 300, 400, 500].map(lvl => (
                    <SelectItem key={lvl} value={lvl.toString()} className="text-white">{lvl}L</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={filterDept} onValueChange={setFilterDept}>
                <SelectTrigger className="w-48 bg-white/5 border-white/10 text-white text-sm">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10">
                  <SelectItem value="all" className="text-white">All Departments</SelectItem>
                  {departments.map(([code, name]) => (
                    <SelectItem key={code} value={code} className="text-white">{code} - {name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-sm text-slate-400">View:</span>
                <div className="flex bg-white/5 rounded-lg p-1">
                  <Button
                    variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('calendar')}
                    className={viewMode === 'calendar' ? 'bg-cyan-500 text-white' : 'text-slate-400'}
                  >
                    Calendar
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className={viewMode === 'list' ? 'bg-cyan-500 text-white' : 'text-slate-400'}
                  >
                    List
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Visual Calendar Canvas */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-cyan-400" />
            Exam Schedule Canvas
          </CardTitle>
          <CardDescription>
            {filteredSlots.length > 0
              ? `${filteredSlots.length} exams across ${sortedDates.length} days`
              : 'Generate a timetable to see the visual schedule'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredSlots.length === 0 ? (
            <div className="py-16 text-center">
              <Calendar className="w-16 h-16 mx-auto text-slate-600 mb-4" />
              <p className="text-white font-medium mb-2">No exams scheduled yet</p>
              <p className="text-sm text-slate-400 mb-4">Click "Generate Timetable" to automatically create a clash-free schedule</p>
              <Button
                onClick={handleGenerate}
                disabled={generating || !selectedPeriod}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white border-0"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Timetable
              </Button>
            </div>
          ) : viewMode === 'calendar' ? (
            <div className="overflow-x-auto">
              <div className="min-w-[900px]">
                {/* Header */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                  <div className="p-3 bg-white/5 rounded-lg">
                    <span className="text-slate-400 text-sm font-medium">Date</span>
                  </div>
                  {[1, 2, 3].map((slotNum) => (
                    <div key={slotNum} className={`p-3 rounded-lg bg-gradient-to-br ${slotColors[slotNum - 1]} border`}>
                      <span className="text-white text-sm font-medium">{getSlotTime(slotNum)}</span>
                    </div>
                  ))}
                </div>

                {/* Rows */}
                {sortedDates.map((date) => (
                  <div key={date} className="grid grid-cols-4 gap-2 mb-2">
                    <div className="p-3 bg-white/5 rounded-lg flex items-center">
                      <span className="text-white font-medium">{date}</span>
                    </div>
                    {[1, 2, 3].map((slotNum) => {
                      const slotsForTime = groupedSlots[date]?.[slotNum] || []
                      return (
                        <div key={slotNum} className={`p-2 rounded-lg bg-gradient-to-br ${slotColors[slotNum - 1]} border min-h-[80px]`}>
                          {slotsForTime.length > 0 ? (
                            <div className="space-y-1">
                              {slotsForTime.map((slot) => (
                                <div
                                  key={slot.id}
                                  className="p-2 bg-slate-900/60 rounded-md cursor-pointer hover:bg-slate-900/80 transition-colors group"
                                >
                                  <div className="flex items-center justify-between">
                                    <Badge variant="outline" className={`border-white/20 ${slot.course.isShared ? 'text-pink-400' : 'text-cyan-400'} text-xs font-mono`}>
                                      {slot.course.code}
                                      {slot.course.isShared && ' (GST)'}
                                    </Badge>
                                    <Badge variant="secondary" className={`${levelColors[slot.course.level] || 'bg-white/10 text-slate-300'} text-xs`}>
                                      {slot.course.level}L
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-white mt-1 truncate group-hover:whitespace-normal">
                                    {slot.course.name}
                                  </p>
                                  <div className="flex items-center justify-between mt-1">
                                    <div className="flex items-center gap-1">
                                      <MapPin className="w-3 h-3 text-slate-500" />
                                      <span className="text-xs text-slate-400">{slot.room.code}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Users className="w-3 h-3 text-slate-500" />
                                      <span className="text-xs text-slate-400">{slot.course._count?.studentCourses || 0}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="h-full flex items-center justify-center text-slate-500 text-xs py-4">
                              Free Slot
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* List View */
            <div className="space-y-2">
              {sortedDates.map((date) => (
                <div key={date} className="space-y-2">
                  <h3 className="text-white font-medium sticky top-0 bg-slate-900/80 py-2">{date}</h3>
                  {[1, 2, 3].map((slotNum) => {
                    const slotsForTime = groupedSlots[date]?.[slotNum] || []
                    if (slotsForTime.length === 0) return null
                    
                    return (
                      <div key={slotNum} className="pl-4 border-l-2 border-white/10">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-300">{getSlotTime(slotNum)}</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {slotsForTime.map((slot) => (
                            <div
                              key={slot.id}
                              className="p-3 bg-white/5 rounded-lg border border-white/10 hover:border-cyan-500/30 transition-colors"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <Badge variant="outline" className="text-cyan-400 text-xs font-mono">
                                  {slot.course.code}
                                </Badge>
                                <Badge variant="secondary" className={`${levelColors[slot.course.level] || 'bg-white/10 text-slate-300'} text-xs`}>
                                  {slot.course.level}L
                                </Badge>
                              </div>
                              <p className="text-sm text-white mb-2">{slot.course.name}</p>
                              <div className="flex items-center justify-between text-xs text-slate-400">
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {slot.room.name}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  {slot.course._count?.studentCourses || 0} students
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      {filteredSlots.length > 0 && (
        <Card className="bg-white/5 border-white/10">
          <CardContent className="pt-4">
            <div className="flex flex-wrap items-center gap-6">
              <span className="text-sm text-slate-400">Legend:</span>
              {[1, 2, 3].map((slotNum) => (
                <div key={slotNum} className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded bg-gradient-to-br ${slotColors[slotNum - 1].split(' ')[0]} ${slotColors[slotNum - 1].split(' ')[1]}`} />
                  <span className="text-sm text-slate-300">{slotLabels[slotNum - 1]}</span>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-pink-400/20 text-pink-400 text-xs">GST</Badge>
                <span className="text-sm text-slate-300">Shared Course</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
