'use client'

import { useState, useCallback, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Upload, FileSpreadsheet, Download, AlertCircle, CheckCircle2,
  X, Loader2, Users, BookOpen, Home, Building2, GraduationCap,
  CalendarClock, ClipboardList, ChevronRight, ArrowLeft,
  FileWarning, Sparkles, TableProperties, Info,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

// ─── Types ────────────────────────────────────────────────────────────────────

type UploadType =
  | 'students'
  | 'courses'
  | 'lecturers'
  | 'rooms'
  | 'departments'
  | 'exam-slots'
  | 'timetable-slots'

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error'

interface UploadResult {
  total: number
  success: number
  failed: number
  errors: string[]
}

// ─── Entity Config ─────────────────────────────────────────────────────────────

interface EntityConfig {
  label: string
  icon: React.ElementType
  color: string        // tailwind text colour
  bg: string          // card bg
  border: string      // card border
  accent: string      // badge / progress colour
  description: string
  fields: string[]
  requiredFields: string[]
  example: string
  tip: string
}

const ENTITY_CONFIG: Record<UploadType, EntityConfig> = {
  students: {
    label: 'Students',
    icon: GraduationCap,
    color: 'text-success',
    bg: 'bg-success/8',
    border: 'border-success/20',
    accent: 'bg-success',
    description: 'Register multiple students at once',
    fields: ['regNumber', 'name', 'email', 'level', 'admissionYear', 'departmentCode'],
    requiredFields: ['regNumber', 'name', 'level', 'departmentCode'],
    example: `regNumber,name,email,level,admissionYear,departmentCode
COE/2021/CSC/001,Abubakar Musa,abubakar@coeminna.edu.ng,300,2021,CSC
COE/2021/MTH/002,Fatima Umar,fatima@coeminna.edu.ng,300,2021,MTH
COE/2022/PHY/003,Ibrahim Sani,,200,2022,PHY`,
    tip: 'Email is optional. Level must be 100/200/300/400.',
  },
  courses: {
    label: 'Courses',
    icon: BookOpen,
    color: 'text-primary',
    bg: 'bg-primary/8',
    border: 'border-primary/20',
    accent: 'bg-primary',
    description: 'Import course catalogue in bulk',
    fields: ['code', 'name', 'creditUnits', 'level', 'semester', 'isShared', 'departmentCode'],
    requiredFields: ['code', 'name', 'creditUnits', 'level', 'semester', 'departmentCode'],
    example: `code,name,creditUnits,level,semester,isShared,departmentCode
CSC 101,Introduction to Computing,3,100,1,false,CSC
GST 111,Communication in English,2,100,1,true,CSC
MTH 201,Mathematical Methods,3,200,1,false,MTH`,
    tip: 'Set isShared=true for GST/cross-department courses. creditUnits: 1–6.',
  },
  lecturers: {
    label: 'Lecturers',
    icon: Users,
    color: 'text-secondary',
    bg: 'bg-secondary/8',
    border: 'border-secondary/20',
    accent: 'bg-secondary',
    description: 'Add lecturer profiles for scheduling',
    fields: ['staffId', 'name', 'email', 'rank', 'departmentCode'],
    requiredFields: ['staffId', 'name', 'email', 'departmentCode'],
    example: `staffId,name,email,rank,departmentCode
COE/STAFF/001,Dr. Suleiman Abdullahi,s.abdullahi@coeminna.edu.ng,Senior Lecturer,CSC
COE/STAFF/002,Prof. Musa Ibrahim,m.ibrahim@coeminna.edu.ng,Professor,MTH`,
    tip: 'Rank options: Lecturer II, Lecturer I, Senior Lecturer, Associate Professor, Professor.',
  },
  rooms: {
    label: 'Rooms / Venues',
    icon: Home,
    color: 'text-accent-gold',
    bg: 'bg-accent-gold/8',
    border: 'border-accent-gold/20',
    accent: 'bg-accent-gold',
    description: 'Add lecture halls, labs, and exam venues',
    fields: ['code', 'name', 'capacity', 'type', 'hasProjector', 'hasAC'],
    requiredFields: ['code', 'name', 'capacity', 'type'],
    example: `code,name,capacity,type,hasProjector,hasAC
LT1,Lecture Theatre 1,400,LECTURE_HALL,true,false
CSC-LAB,Computer Science Laboratory,60,COMPUTER_LAB,true,true
GH-A,General Hall A,200,LECTURE_HALL,true,false`,
    tip: 'Type options: LECTURE_HALL, COMPUTER_LAB, SCIENCE_LAB, CLASSROOM, SEMINAR_ROOM.',
  },
  departments: {
    label: 'Departments',
    icon: Building2,
    color: 'text-clash',
    bg: 'bg-clash/8',
    border: 'border-clash/20',
    accent: 'bg-clash',
    description: 'Create departments under faculties',
    fields: ['code', 'name', 'facultyId'],
    requiredFields: ['code', 'name', 'facultyId'],
    example: `code,name,facultyId
CSC,Computer Science,faculty-applied-sciences
MTH,Mathematics,faculty-applied-sciences
ECO,Economics,faculty-social-sciences`,
    tip: 'Get facultyId values from the Faculties page before uploading.',
  },
  'exam-slots': {
    label: 'Exam Timetable',
    icon: ClipboardList,
    color: 'text-clash',
    bg: 'bg-clash/8',
    border: 'border-clash/20',
    accent: 'bg-clash',
    description: 'Import exam schedule directly',
    fields: ['courseCode', 'date', 'startTime', 'endTime', 'roomCode', 'examPeriodId'],
    requiredFields: ['courseCode', 'date', 'startTime', 'endTime', 'roomCode'],
    example: `courseCode,date,startTime,endTime,roomCode,examPeriodId
CSC 101,2025-01-15,09:00,12:00,LT1,period-001
MTH 201,2025-01-16,09:00,12:00,GH-A,period-001
CSC 201,2025-01-17,14:00,17:00,LT1,period-001`,
    tip: 'Date format: YYYY-MM-DD. Time format: HH:MM (24hr). Get examPeriodId from Exam Periods.',
  },
  'timetable-slots': {
    label: 'Lecture Timetable',
    icon: CalendarClock,
    color: 'text-secondary',
    bg: 'bg-secondary/8',
    border: 'border-secondary/20',
    accent: 'bg-secondary',
    description: 'Bulk-load semester lecture schedule',
    fields: ['courseCode', 'day', 'startTime', 'endTime', 'roomCode', 'lecturerStaffId', 'departmentCode', 'level'],
    requiredFields: ['courseCode', 'day', 'startTime', 'endTime', 'roomCode'],
    example: `courseCode,day,startTime,endTime,roomCode,lecturerStaffId,departmentCode,level
CSC 101,Monday,08:00,10:00,LT1,COE/STAFF/001,CSC,100
MTH 201,Tuesday,10:00,12:00,GH-A,COE/STAFF/002,MTH,200
CSC 301,Wednesday,14:00,16:00,CSC-LAB,COE/STAFF/001,CSC,300`,
    tip: 'Day: Monday–Saturday. Clash detection runs automatically after upload.',
  },
}

const UPLOAD_ORDER: UploadType[] = [
  'departments',
  'rooms',
  'lecturers',
  'courses',
  'students',
  'timetable-slots',
  'exam-slots',
]

// ─── Sub-components ────────────────────────────────────────────────────────────

function EntityCard({
  type,
  selected,
  onClick,
}: {
  type: UploadType
  selected: boolean
  onClick: () => void
}) {
  const cfg = ENTITY_CONFIG[type]
  const Icon = cfg.icon
  return (
    <button
      onClick={onClick}
      className={`w-full text-left flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all duration-150 group ${
        selected
          ? `${cfg.bg} ${cfg.border} ring-1 ring-white/10`
          : 'bg-foreground/[0.03] border-white/[0.06] hover:bg-foreground/5 hover:border-foreground/10'
      }`}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${selected ? cfg.bg : 'bg-foreground/5'} border ${selected ? cfg.border : 'border-foreground/10'}`}>
        <Icon className={`w-4 h-4 ${selected ? cfg.color : 'text-foreground/30 group-hover:text-foreground/50'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-semibold ${selected ? cfg.color : 'text-foreground/60 group-hover:text-foreground/80'}`}>
          {cfg.label}
        </div>
        <div className="text-[10px] text-foreground/25 leading-tight mt-0.5 truncate">{cfg.description}</div>
      </div>
      {selected && <ChevronRight className={`w-3.5 h-3.5 flex-shrink-0 ${cfg.color}`} />}
    </button>
  )
}

function DropZone({
  file,
  dragActive,
  onDrag,
  onDrop,
  onFile,
  onClear,
  cfg,
}: {
  file: File | null
  dragActive: boolean
  onDrag: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  onFile: (f: File) => void
  onClear: () => void
  cfg: EntityConfig
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div
      onDragEnter={onDrag}
      onDragLeave={onDrag}
      onDragOver={onDrag}
      onDrop={onDrop}
      onClick={() => !file && inputRef.current?.click()}
      className={`relative border-2 border-dashed rounded-2xl transition-all duration-200 ${
        file
          ? `${cfg.bg} ${cfg.border} cursor-default`
          : dragActive
          ? `border-foreground/30 bg-foreground/5 cursor-copy`
          : 'border-foreground/10 hover:border-foreground/20 hover:bg-foreground/[0.03] cursor-pointer'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
        className="sr-only"
      />

      <div className="p-8">
        {file ? (
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl ${cfg.bg} border ${cfg.border} flex items-center justify-center flex-shrink-0`}>
              <FileSpreadsheet className={`w-6 h-6 ${cfg.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-foreground truncate">{file.name}</div>
              <div className="text-xs text-foreground/35 mt-0.5">
                {file.size < 1024
                  ? `${file.size} B`
                  : file.size < 1024 * 1024
                  ? `${(file.size / 1024).toFixed(1)} KB`
                  : `${(file.size / (1024 * 1024)).toFixed(1)} MB`}
                {' · '}
                {file.name.endsWith('.csv') ? 'CSV' : 'Excel'}
              </div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onClear() }}
              className="w-8 h-8 rounded-lg bg-foreground/5 hover:bg-foreground/10 border border-foreground/10 flex items-center justify-center text-foreground/40 hover:text-foreground transition-colors flex-shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-foreground/[0.03] border border-foreground/10 flex items-center justify-center mx-auto">
              <Upload className="w-7 h-7 text-foreground/20" />
            </div>
            <div>
              <div className="text-sm font-medium text-foreground/60">
                {dragActive ? 'Drop it here' : 'Drag & drop your file'}
              </div>
              <div className="text-xs text-foreground/25 mt-1">or click to browse · CSV, XLS, XLSX</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function FieldPills({ fields, required }: { fields: string[]; required: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {fields.map((f) => {
        const isReq = required.includes(f)
        return (
          <span
            key={f}
            className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md border ${
              isReq
                ? 'bg-foreground/8 border-foreground/15 text-foreground/70'
                : 'bg-foreground/[0.03] border-foreground/8 text-foreground/30'
            }`}
          >
            {f}
            {isReq && <span className="text-clash">*</span>}
          </span>
        )
      })}
    </div>
  )
}

function ResultPanel({ result, cfg }: { result: UploadResult; cfg: EntityConfig }) {
  const allOk = result.failed === 0
  return (
    <div className={`rounded-2xl border p-5 space-y-4 ${allOk ? 'bg-success/8 border-success/20' : 'bg-accent-gold/8 border-accent-gold/20'}`}>
      <div className="flex items-center gap-3">
        {allOk
          ? <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
          : <FileWarning className="w-5 h-5 text-accent-gold flex-shrink-0" />
        }
        <div>
          <div className={`text-sm font-semibold ${allOk ? 'text-success' : 'text-accent-gold'}`}>
            {allOk ? 'All records imported successfully' : 'Import completed with warnings'}
          </div>
          <div className="text-xs text-foreground/35 mt-0.5">
            {result.success} of {result.total} {cfg.label.toLowerCase()} added
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total',   value: result.total,   color: 'text-foreground' },
          { label: 'Imported', value: result.success, color: 'text-success' },
          { label: 'Failed',  value: result.failed,  color: result.failed > 0 ? 'text-clash' : 'text-foreground/30' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl bg-foreground/5 border border-foreground/10 py-3 text-center">
            <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-[10px] text-foreground/30 mt-0.5 uppercase tracking-wide">{s.label}</div>
          </div>
        ))}
      </div>

      {result.errors.length > 0 && (
        <div className="rounded-xl bg-clash/8 border border-clash/15 p-3 max-h-36 overflow-y-auto space-y-1">
          {result.errors.map((err, i) => (
            <div key={i} className="flex items-start gap-2">
              <AlertCircle className="w-3 h-3 text-clash flex-shrink-0 mt-0.5" />
              <span className="text-[11px] text-clash/80">{err}</span>
            </div>
          ))}
          {result.errors.length >= 10 && (
            <div className="text-[10px] text-foreground/25 text-center pt-1">Showing first 10 errors only</div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

interface BulkUploadProps {
  institutionId: string
  onUploadComplete?: (type: UploadType, result: UploadResult) => void
  /** If provided, only these entity types are shown */
  allowedTypes?: UploadType[]
  /** Show as a trigger button (default) or render panel inline */
  variant?: 'dialog' | 'inline'
}

export function BulkUpload({
  institutionId,
  onUploadComplete,
  allowedTypes,
  variant = 'dialog',
}: BulkUploadProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [selectedType, setSelectedType] = useState<UploadType>('courses')
  const [file, setFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [status, setStatus] = useState<UploadStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<UploadResult | null>(null)
  const [showExample, setShowExample] = useState(false)

  const visibleTypes = allowedTypes ?? UPLOAD_ORDER
  const cfg = ENTITY_CONFIG[selectedType]

  // ── Drag handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(e.type === 'dragenter' || e.type === 'dragover')
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) handleFile(dropped)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleFile = (f: File) => {
    const ok = f.name.endsWith('.csv') || f.name.endsWith('.xlsx') || f.name.endsWith('.xls')
    if (!ok) {
      toast({ title: 'Unsupported file', description: 'Please upload a CSV or Excel file (.csv, .xlsx, .xls)', variant: 'destructive' })
      return
    }
    setFile(f)
    setStatus('idle')
    setResult(null)
  }

  const resetUpload = () => {
    setFile(null)
    setStatus('idle')
    setProgress(0)
    setResult(null)
  }

  const handleTypeChange = (type: UploadType) => {
    setSelectedType(type)
    resetUpload()
    setShowExample(false)
  }

  // ── Download template CSV
  const downloadTemplate = () => {
    const blob = new Blob([cfg.example], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `clashfree_${selectedType}_template.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast({ title: 'Template downloaded', description: `${cfg.label} CSV template saved` })
  }

  // ── Upload
  const handleUpload = async () => {
    if (!file) return
    setStatus('uploading')
    setProgress(10)

    const fd = new FormData()
    fd.append('file', file)
    fd.append('type', selectedType)
    fd.append('institutionId', institutionId)

    const ticker = setInterval(() => {
      setProgress((p) => Math.min(p + 8, 88))
    }, 250)

    try {
      const res = await fetch('/api/bulk-upload', { method: 'POST', body: fd })
      clearInterval(ticker)
      setProgress(100)
      const data = await res.json()

      if (res.ok) {
        const uploadResult: UploadResult = {
          total: data.total ?? 0,
          success: data.success ?? 0,
          failed: data.failed ?? 0,
          errors: data.errors ?? [],
        }
        setStatus('success')
        setResult(uploadResult)
        onUploadComplete?.(selectedType, uploadResult)
        toast({
          title: 'Upload complete',
          description: `${data.success} ${cfg.label.toLowerCase()} imported`,
        })
      } else {
        setStatus('error')
        setResult({ total: 0, success: 0, failed: 0, errors: [data.error ?? 'Upload failed'] })
        toast({ title: 'Upload failed', description: data.error, variant: 'destructive' })
      }
    } catch {
      clearInterval(ticker)
      setStatus('error')
      setResult({ total: 0, success: 0, failed: 0, errors: ['Network error — check your connection'] })
      toast({ title: 'Network error', description: 'Could not reach the server', variant: 'destructive' })
    }
  }

  // ── Inner panel
  const Panel = () => (
    <div className="flex flex-col sm:flex-row gap-0 h-full min-h-[520px]">

      {/* ── Left sidebar: entity selector */}
      <div className="sm:w-52 flex-shrink-0 border-b sm:border-b-0 sm:border-r border-foreground/8 p-4 space-y-1.5 bg-foreground/[0.03]">
        <div className="text-[10px] font-semibold text-foreground/25 uppercase tracking-widest px-1 pb-1">
          What to upload
        </div>
        {visibleTypes.map((t) => (
          <EntityCard
            key={t}
            type={t}
            selected={selectedType === t}
            onClick={() => handleTypeChange(t)}
          />
        ))}
      </div>

      {/* ── Right: upload area */}
      <div className="flex-1 flex flex-col overflow-y-auto">

        {/* Entity header */}
        <div className={`px-6 py-4 border-b border-foreground/8 flex items-center justify-between gap-3 ${cfg.bg}`}>
          <div className="flex items-center gap-3">
            <cfg.icon className={`w-5 h-5 ${cfg.color}`} />
            <div>
              <div className={`text-sm font-bold ${cfg.color}`}>{cfg.label}</div>
              <div className="text-[11px] text-foreground/35 mt-0.5">{cfg.description}</div>
            </div>
          </div>
          <button
            onClick={downloadTemplate}
            className={`flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-lg border transition-colors ${cfg.bg} ${cfg.border} ${cfg.color} hover:brightness-110`}
          >
            <Download className="w-3 h-3" />
            Template
          </button>
        </div>

        <div className="flex-1 px-6 py-5 space-y-5">

          {/* Field reference */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-semibold text-foreground/30 uppercase tracking-widest">
                Required columns
              </div>
              <button
                onClick={() => setShowExample(!showExample)}
                className="flex items-center gap-1 text-[10px] text-foreground/30 hover:text-foreground/60 transition-colors"
              >
                <TableProperties className="w-3 h-3" />
                {showExample ? 'Hide' : 'Preview'} example
              </button>
            </div>
            <FieldPills fields={cfg.fields} required={cfg.requiredFields} />
          </div>

          {/* Example preview */}
          {showExample && (
            <div className="rounded-xl bg-black/30 border border-foreground/8 overflow-hidden">
              <div className="px-3 py-2 border-b border-foreground/8 flex items-center gap-2">
                <FileSpreadsheet className="w-3.5 h-3.5 text-foreground/30" />
                <span className="text-[10px] text-foreground/30 font-mono">example.csv</span>
              </div>
              <pre className="px-4 py-3 text-[10px] text-foreground/50 font-mono overflow-x-auto leading-relaxed whitespace-pre">
                {cfg.example}
              </pre>
            </div>
          )}

          {/* Tip */}
          <div className={`flex items-start gap-2.5 px-3 py-2.5 rounded-xl border ${cfg.bg} ${cfg.border}`}>
            <Info className={`w-3.5 h-3.5 ${cfg.color} flex-shrink-0 mt-0.5`} />
            <p className="text-[11px] text-foreground/45 leading-relaxed">{cfg.tip}</p>
          </div>

          {/* Drop zone */}
          <DropZone
            file={file}
            dragActive={dragActive}
            onDrag={handleDrag}
            onDrop={handleDrop}
            onFile={handleFile}
            onClear={resetUpload}
            cfg={cfg}
          />

          {/* Progress */}
          {status === 'uploading' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-foreground/40 flex items-center gap-1.5">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Uploading {cfg.label.toLowerCase()}…
                </span>
                <span className={cfg.color}>{progress}%</span>
              </div>
              <Progress value={progress} className="h-1.5 bg-foreground/8" />
            </div>
          )}

          {/* Result */}
          {(status === 'success' || status === 'error') && result && (
            status === 'success'
              ? <ResultPanel result={result} cfg={cfg} />
              : (
                <div className="rounded-2xl bg-clash/8 border border-clash/20 p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-clash" />
                    <div className="text-sm font-semibold text-clash">Upload failed</div>
                  </div>
                  {result.errors.map((e, i) => (
                    <p key={i} className="text-xs text-clash/70 pl-8">{e}</p>
                  ))}
                </div>
              )
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-foreground/8 bg-foreground/[0.03] flex items-center justify-between gap-3">
          <div className="text-[10px] text-foreground/20">
            {file ? `${file.name} ready` : 'No file selected'}
          </div>
          <div className="flex items-center gap-2">
            {(status === 'success' || status === 'error') && (
              <button
                onClick={resetUpload}
                className="flex items-center gap-1.5 text-xs text-foreground/40 hover:text-foreground/70 px-3 py-2 rounded-lg hover:bg-foreground/5 transition-colors"
              >
                <ArrowLeft className="w-3 h-3" />
                Upload another
              </button>
            )}
            {file && status === 'idle' && (
              <button
                onClick={handleUpload}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95 shadow-lg ${cfg.accent}`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Import {cfg.label}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  if (variant === 'inline') {
    return (
      <div className="rounded-2xl border border-foreground/10 bg-card overflow-hidden">
        <Panel />
      </div>
    )
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-secondary to-secondary text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-blue-900/30"
      >
        <Upload className="w-4 h-4" />
        Bulk Upload
      </button>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetUpload() }}>
        <DialogContent className="bg-card border-foreground/10 text-foreground p-0 max-w-3xl w-full max-h-[90vh] overflow-hidden rounded-2xl">
          <DialogHeader className="px-6 py-4 border-b border-foreground/8">
            <DialogTitle className="flex items-center gap-2.5 text-base">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-secondary/20 to-secondary/20 border border-secondary/20 flex items-center justify-center">
                <Upload className="w-3.5 h-3.5 text-secondary" />
              </div>
              Bulk Upload
              <span className="text-foreground/25 font-normal text-sm ml-1">— Import data via CSV or Excel</span>
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[calc(90vh-60px)]">
            <Panel />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ─── Simple inline upload button (for table headers, etc.) ────────────────────

export function QuickUploadButton({
  institutionId,
  type,
  onComplete,
  label,
}: {
  institutionId: string
  type: UploadType
  onComplete?: () => void
  label?: string
}) {
  const { toast } = useToast()
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const cfg = ENTITY_CONFIG[type]
  const Icon = cfg.icon

  const handle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', f)
    fd.append('type', type)
    fd.append('institutionId', institutionId)
    try {
      const res = await fetch('/api/bulk-upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (res.ok) {
        toast({ title: 'Import complete', description: `${data.success} ${cfg.label.toLowerCase()} added` })
        onComplete?.()
      } else {
        toast({ title: 'Import failed', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Network error', variant: 'destructive' })
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="relative">
      <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls" onChange={handle} className="sr-only" disabled={uploading} />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
          uploading
            ? 'bg-foreground/5 border-foreground/8 text-foreground/30 cursor-not-allowed'
            : `${cfg.bg} ${cfg.border} ${cfg.color} hover:brightness-110`
        }`}
      >
        {uploading
          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
          : <Icon className="w-3.5 h-3.5" />
        }
        {uploading ? 'Importing…' : (label ?? `Import ${cfg.label}`)}
      </button>
    </div>
  )
}

// ─── Re-export SimpleUploadButton alias for backwards compat ──────────────────
export { QuickUploadButton as SimpleUploadButton }
