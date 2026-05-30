'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageHeader } from '@/components/page-header'
import { Clock, MapPin, Users, AlertTriangle, CheckCircle2, Loader2, Sparkles, Download, BookOpen } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Progress } from '@/components/ui/progress'

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const timeSlots = [
  { time: '08:00 - 10:00', label: '8 AM' },
  { time: '10:00 - 12:00', label: '10 AM' },
  { time: '12:00 - 14:00', label: '12 PM' },
  { time: '14:00 - 16:00', label: '2 PM' },
  { time: '16:00 - 18:00', label: '4 PM' },
]

const slotColors = [
  'from-cyan-500/20 to-blue-500/20 border-cyan-500/30',
  'from-purple-500/20 to-pink-500/20 border-purple-500/30',
  'from-green-500/20 to-emerald-500/20 border-green-500/30',
  'from-amber-500/20 to-yellow-500/20 border-amber-500/30',
  'from-red-500/20 to-rose-500/20 border-red-500/30',
]

// Demo lecture schedule
const demoSchedule: Record<string, Record<string, { code: string; name: string; room: string; lecturer: string }[]>> = {
  'Monday': {
    '08:00 - 10:00': [
      { code: 'CSC 201', name: 'Computer Programming II', room: 'LT1', lecturer: 'Dr. Adamu' },
      { code: 'MTH 101', name: 'General Mathematics I', room: 'MPH', lecturer: 'Prof. Ibrahim' },
    ],
    '10:00 - 12:00': [
      { code: 'GST 111', name: 'Communication in English', room: 'AGH', lecturer: 'Dr. Amina' },
    ],
    '14:00 - 16:00': [
      { code: 'PHY 201', name: 'Classical Mechanics', room: 'LT2', lecturer: 'Dr. Musa' },
    ],
  },
  'Tuesday': {
    '08:00 - 10:00': [
      { code: 'CSC 301', name: 'Operating Systems', room: 'LT1', lecturer: 'Dr. Adamu' },
    ],
    '10:00 - 12:00': [
      { code: 'MTH 201', name: 'Calculus II', room: 'MPH', lecturer: 'Prof. Ibrahim' },
      { code: 'CHM 101', name: 'General Chemistry I', room: 'LT3', lecturer: 'Dr. Grace' },
    ],
    '16:00 - 18:00': [
      { code: 'CSC 101', name: 'Intro to Computer Science', room: 'LAB1', lecturer: 'Mr. John' },
    ],
  },
  'Wednesday': {
    '08:00 - 10:00': [
      { code: 'CSC 202', name: 'Data Structures', room: 'LT1', lecturer: 'Dr. Adamu' },
    ],
    '12:00 - 14:00': [
      { code: 'GST 211', name: 'Philosophy and Logic', room: 'AGH', lecturer: 'Dr. Bello' },
    ],
    '14:00 - 16:00': [
      { code: 'PHY 101', name: 'General Physics I', room: 'MPH', lecturer: 'Dr. Musa' },
    ],
  },
  'Thursday': {
    '10:00 - 12:00': [
      { code: 'CSC 302', name: 'Database Systems', room: 'LT1', lecturer: 'Dr. Adamu' },
      { code: 'BCH 301', name: 'Biochemistry I', room: 'LT2', lecturer: 'Dr. Amina' },
    ],
    '14:00 - 16:00': [
      { code: 'MTH 301', name: 'Linear Algebra', room: 'MPH', lecturer: 'Prof. Ibrahim' },
    ],
  },
  'Friday': {
    '08:00 - 10:00': [
      { code: 'GST 112', name: 'Nigerian Peoples & Culture', room: 'AGH', lecturer: 'Dr. Bello' },
    ],
    '12:00 - 14:00': [
      { code: 'STA 101', name: 'Introduction to Statistics', room: 'LT3', lecturer: 'Dr. Faith' },
    ],
  },
}

export default function LectureTimetablePage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [selectedLevel, setSelectedLevel] = useState('all')
  const [selectedDept, setSelectedDept] = useState('all')

  const handleGenerate = async () => {
    setGenerating(true)
    setProgress(0)

    const interval = setInterval(() => {
      setProgress((prev) => prev >= 100 ? 100 : prev + 10)
    }, 300)

    setTimeout(() => {
      clearInterval(interval)
      setProgress(100)
      setTimeout(() => {
        setGenerating(false)
        setProgress(0)
        toast({ title: 'Success', description: 'Lecture timetable generated!' })
      }, 500)
    }, 3500)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lecture Timetable"
        description="Weekly lecture schedule canvas"
        loading={loading}
      />

      {/* Control Panel */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="space-y-1">
                <label className="text-sm text-slate-400">Department</label>
                <Select value={selectedDept} onValueChange={setSelectedDept}>
                  <SelectTrigger className="w-48 bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10">
                    <SelectItem value="all" className="text-white">All Departments</SelectItem>
                    <SelectItem value="CSC" className="text-white">Computer Science</SelectItem>
                    <SelectItem value="MTH" className="text-white">Mathematics</SelectItem>
                    <SelectItem value="PHY" className="text-white">Physics</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-sm text-slate-400">Level</label>
                <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                  <SelectTrigger className="w-32 bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10">
                    <SelectItem value="all" className="text-white">All Levels</SelectItem>
                    <SelectItem value="100" className="text-white">100 Level</SelectItem>
                    <SelectItem value="200" className="text-white">200 Level</SelectItem>
                    <SelectItem value="300" className="text-white">300 Level</SelectItem>
                    <SelectItem value="400" className="text-white">400 Level</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" className="border-white/10 text-slate-300 hover:text-white">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={generating}
                className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white border-0"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Auto-Generate
                  </>
                )}
              </Button>
            </div>
          </div>

          {generating && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Optimizing schedule...</span>
                <span className="text-purple-400">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2 bg-white/10" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white/5 border-white/10">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">18</div>
                <div className="text-xs text-slate-400">Lectures/Week</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">45</div>
                <div className="text-xs text-slate-400">Hours/Week</div>
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
                <div className="text-2xl font-bold text-white">0</div>
                <div className="text-xs text-slate-400">Room Clashes</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/20 to-yellow-500/20 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">8</div>
                <div className="text-xs text-slate-400">Venues Used</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Grid Canvas */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-400" />
            Weekly Schedule Canvas
          </CardTitle>
          <CardDescription>Drag and drop to adjust (coming soon)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="min-w-[900px]">
              {/* Header Row */}
              <div className="grid grid-cols-6 gap-2 mb-2">
                <div className="p-3 bg-white/5 rounded-lg">
                  <span className="text-slate-400 text-sm font-medium">Time</span>
                </div>
                {days.map((day, i) => (
                  <div key={day} className={`p-3 rounded-lg bg-gradient-to-br ${slotColors[i]} border`}>
                    <span className="text-white text-sm font-medium">{day}</span>
                  </div>
                ))}
              </div>

              {/* Time Slots */}
              {timeSlots.map((slot, slotIdx) => (
                <div key={slot.time} className="grid grid-cols-6 gap-2 mb-2">
                  <div className="p-3 bg-white/5 rounded-lg flex items-center justify-center">
                    <span className="text-slate-400 text-sm">{slot.label}</span>
                  </div>
                  {days.map((day, dayIdx) => {
                    const lectures = demoSchedule[day]?.[slot.time] || []
                    return (
                      <div
                        key={`${day}-${slot.time}`}
                        className={`p-2 rounded-lg bg-gradient-to-br ${slotColors[dayIdx]} border min-h-[80px]`}
                      >
                        {lectures.length > 0 ? (
                          <div className="space-y-1">
                            {lectures.map((lecture, i) => (
                              <div
                                key={i}
                                className="p-2 bg-slate-900/60 rounded-md cursor-pointer hover:bg-slate-900/80 transition-colors group"
                              >
                                <div className="flex items-center justify-between">
                                  <Badge variant="outline" className="border-purple-500/30 text-purple-400 text-xs font-mono">
                                    {lecture.code}
                                  </Badge>
                                  <MapPin className="w-3 h-3 text-slate-500" />
                                </div>
                                <p className="text-xs text-white mt-1 truncate">{lecture.name}</p>
                                <div className="flex items-center justify-between mt-1">
                                  <span className="text-xs text-slate-500">{lecture.lecturer}</span>
                                  <span className="text-xs text-slate-400">{lecture.room}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                            Free
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <div className="font-medium text-white">Check Conflicts</div>
                <div className="text-xs text-slate-400">Scan for scheduling issues</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <div className="font-medium text-white">Lecturer Availability</div>
                <div className="text-xs text-slate-400">Manage teaching windows</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <div className="font-medium text-white">Publish Schedule</div>
                <div className="text-xs text-slate-400">Make visible to all users</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
