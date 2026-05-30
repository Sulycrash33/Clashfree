'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageHeader } from '@/components/page-header'
import { Calendar, Clock, MapPin, Users, AlertTriangle, CheckCircle2, Loader2, Sparkles, Zap, Play, Pause, Download, RefreshCw } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ExamSlot {
  id: string
  date: string
  dayOfWeek: number
  slotNumber: number
  startTime: string
  endTime: string
  course: { code: string; name: string; level: number; department?: { code: string } }
  room: { code: string; name: string; capacity: number }
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
}

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const slotLabels = ['Morning (8:00 - 11:00)', 'Afternoon (12:00 - 15:00)', 'Evening (16:00 - 19:00)']
const slotColors = [
  'from-cyan-500/20 to-blue-500/20 border-cyan-500/30',
  'from-purple-500/20 to-pink-500/20 border-purple-500/30',
  'from-amber-500/20 to-yellow-500/20 border-amber-500/30',
]

export default function ExamTimetablePage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [examPeriods, setExamPeriods] = useState<ExamPeriod[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<string>('')
  const [examSlots, setExamSlots] = useState<ExamSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState(0)

  const fetchExamPeriods = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/exam-periods')
      if (res.ok) {
        const data = await res.json()
        setExamPeriods(data)
        if (data.length > 0) {
          setSelectedPeriod(data[0].id)
        }
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to fetch exam periods', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchExamPeriods()
  }, [fetchExamPeriods])

  const handleGenerate = async () => {
    if (!selectedPeriod) return
    setGenerating(true)
    setProgress(0)

    // Simulate generation progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + 10
      })
    }, 300)

    try {
      const res = await fetch('/api/exam-periods/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examPeriodId: selectedPeriod }),
      })

      if (res.ok) {
        toast({ title: 'Success', description: 'Exam timetable generated successfully!' })
      } else {
        const error = await res.json()
        toast({ title: 'Generation Failed', description: error.error || 'Failed to generate timetable', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'An error occurred', variant: 'destructive' })
    } finally {
      clearInterval(interval)
      setProgress(100)
      setTimeout(() => {
        setGenerating(false)
        setProgress(0)
      }, 500)
    }
  }

  // Group slots by date and slot number for the calendar view
  const groupedSlots = examSlots.reduce((acc, slot) => {
    const dateKey = new Date(slot.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    if (!acc[dateKey]) acc[dateKey] = {}
    if (!acc[dateKey][slot.slotNumber]) acc[dateKey][slot.slotNumber] = []
    acc[dateKey][slot.slotNumber].push(slot)
    return acc
  }, {} as Record<string, Record<number, ExamSlot[]>>)

  // Demo data for visualization
  const demoSlots: Record<string, Record<number, { code: string; name: string; room: string; level: number }[]>> = {
    'Mon, Jun 2': {
      1: [
        { code: 'CSC 201', name: 'Computer Programming II', room: 'MPH', level: 200 },
        { code: 'MTH 101', name: 'General Mathematics I', room: 'AGH', level: 100 },
      ],
      2: [
        { code: 'GST 111', name: 'Communication in English I', room: 'MPH', level: 100 },
      ],
      3: [
        { code: 'PHY 201', name: 'Classical Mechanics', room: 'NH1', level: 200 },
      ],
    },
    'Tue, Jun 3': {
      1: [
        { code: 'CSC 301', name: 'Operating Systems', room: 'MPH', level: 300 },
        { code: 'CHM 101', name: 'General Chemistry I', room: 'AGH', level: 100 },
      ],
      2: [
        { code: 'GST 112', name: 'Nigerian Peoples and Culture', room: 'MPH', level: 100 },
        { code: 'CSC 401', name: 'Software Engineering', room: 'NH2', level: 400 },
      ],
      3: [],
    },
    'Wed, Jun 4': {
      1: [
        { code: 'MTH 201', name: 'Calculus II', room: 'AGH', level: 200 },
      ],
      2: [
        { code: 'CSC 202', name: 'Data Structures', room: 'MPH', level: 200 },
        { code: 'BCH 301', name: 'Biochemistry I', room: 'NH1', level: 300 },
      ],
      3: [
        { code: 'STA 101', name: 'Introduction to Statistics', room: 'NH3', level: 100 },
      ],
    },
    'Thu, Jun 5': {
      1: [
        { code: 'CSC 302', name: 'Database Systems', room: 'MPH', level: 300 },
      ],
      2: [
        { code: 'GST 211', name: 'Philosophy and Logic', room: 'MPH', level: 200 },
      ],
      3: [
        { code: 'PHY 101', name: 'General Physics I', room: 'AGH', level: 100 },
      ],
    },
    'Fri, Jun 6': {
      1: [],
      2: [
        { code: 'CSC 101', name: 'Introduction to Computer Science', room: 'MPH', level: 100 },
      ],
      3: [],
    },
    'Sat, Jun 7': {
      1: [
        { code: 'MCB 201', name: 'General Microbiology', room: 'NH1', level: 200 },
      ],
      2: [
        { code: 'GEO 101', name: 'Introduction to Geology', room: 'NH2', level: 100 },
      ],
      3: [],
    },
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Exam Timetable"
        description="Visual canvas for exam scheduling"
        onRefresh={fetchExamPeriods}
        loading={loading}
      />

      {/* Control Panel */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="space-y-1">
                <label className="text-sm text-slate-400">Exam Period</label>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="w-64 bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select exam period" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10">
                    {examPeriods.map((p) => (
                      <SelectItem key={p.id} value={p.id} className="text-white">
                        {p.name} - Sem {p.semester}
                      </SelectItem>
                    ))}
                    {examPeriods.length === 0 && (
                      <SelectItem value="demo" className="text-white">First Semester 2025/2026 (Demo)</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="border-white/10 text-slate-300 hover:text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={generating}
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
                <span className="text-slate-400">Generating timetable...</span>
                <span className="text-cyan-400">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2 bg-white/10" />
              <p className="text-xs text-slate-500">
                Checking constraints, detecting conflicts, optimizing room allocations...
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white/5 border-white/10">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">6</div>
                <div className="text-xs text-slate-400">Exam Days</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">24</div>
                <div className="text-xs text-slate-400">Exams Scheduled</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/20 to-yellow-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">0</div>
                <div className="text-xs text-slate-400">Conflicts</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">12</div>
                <div className="text-xs text-slate-400">Venues Used</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visual Calendar Canvas */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-cyan-400" />
            Exam Schedule Canvas
          </CardTitle>
          <CardDescription>Visual timetable with drag-drop support (coming soon)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Header */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                <div className="p-3 bg-white/5 rounded-lg">
                  <span className="text-slate-400 text-sm font-medium">Date</span>
                </div>
                {slotLabels.map((label, i) => (
                  <div key={i} className={`p-3 rounded-lg bg-gradient-to-br ${slotColors[i]} border`}>
                    <span className="text-white text-sm font-medium">{label}</span>
                  </div>
                ))}
              </div>

              {/* Rows */}
              {Object.entries(demoSlots).map(([date, slots]) => (
                <div key={date} className="grid grid-cols-4 gap-2 mb-2">
                  <div className="p-3 bg-white/5 rounded-lg flex items-center">
                    <span className="text-white font-medium">{date}</span>
                  </div>
                  {[1, 2, 3].map((slotNum) => (
                    <div key={slotNum} className={`p-2 rounded-lg bg-gradient-to-br ${slotColors[slotNum - 1]} border min-h-[80px]`}>
                      {slots[slotNum]?.length > 0 ? (
                        <div className="space-y-1">
                          {slots[slotNum].map((exam, i) => (
                            <div
                              key={i}
                              className="p-2 bg-slate-900/60 rounded-md cursor-pointer hover:bg-slate-900/80 transition-colors group"
                            >
                              <div className="flex items-center justify-between">
                                <Badge variant="outline" className="border-white/20 text-cyan-400 text-xs font-mono">
                                  {exam.code}
                                </Badge>
                                <Badge variant="secondary" className="bg-white/10 text-slate-300 text-xs">
                                  {exam.level}L
                                </Badge>
                              </div>
                              <p className="text-xs text-white mt-1 truncate group-hover:whitespace-normal">
                                {exam.name}
                              </p>
                              <div className="flex items-center gap-1 mt-1">
                                <MapPin className="w-3 h-3 text-slate-500" />
                                <span className="text-xs text-slate-400">{exam.room}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                          Free Slot
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card className="bg-white/5 border-white/10">
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-center gap-6">
            <span className="text-sm text-slate-400">Legend:</span>
            {slotLabels.map((label, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded bg-gradient-to-br ${slotColors[i].split(' ')[0]} ${slotColors[i].split(' ')[1]}`} />
                <span className="text-sm text-slate-300">{label.split(' ')[0]}</span>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500/20" />
              <span className="text-sm text-slate-300">No Conflicts</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
