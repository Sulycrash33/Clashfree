'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Upload, FileSpreadsheet, FileText, Download, AlertCircle, CheckCircle2, X, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

type UploadType = 'students' | 'courses' | 'lecturers' | 'rooms' | 'departments'
type UploadStatus = 'idle' | 'uploading' | 'processing' | 'success' | 'error'

interface UploadResult {
  total: number
  success: number
  failed: number
  errors: string[]
}

const uploadTemplates = {
  students: {
    fields: ['regNumber', 'name', 'email', 'level', 'admissionYear', 'departmentCode'],
    example: `regNumber,name,email,level,admissionYear,departmentCode
NSUK/2020/CSC/0001,Adamu Ibrahim,adamu@nsuk.edu.ng,300,2020,CSC
NSUK/2020/CSC/0002,Amina Mohammed,amina@nsuk.edu.ng,300,2020,CSC`,
  },
  courses: {
    fields: ['code', 'name', 'creditUnits', 'level', 'semester', 'isShared', 'departmentCode'],
    example: `code,name,creditUnits,level,semester,isShared,departmentCode
CSC 101,Introduction to Computer Science,3,100,1,false,CSC
GST 111,Communication in English,2,100,1,true,CSC`,
  },
  lecturers: {
    fields: ['staffId', 'name', 'email', 'rank', 'departmentCode'],
    example: `staffId,name,email,rank,departmentCode
NSUK/STAFF/0001,Dr. Adamu Ibrahim,ibrahim@nsuk.edu.ng,Senior Lecturer,CSC`,
  },
  rooms: {
    fields: ['code', 'name', 'capacity', 'type', 'hasProjector', 'hasAC'],
    example: `code,name,capacity,type,hasProjector,hasAC
LT1,Lecture Theatre 1,400,LECTURE_HALL,true,true
CSC-LAB,Computer Laboratory,60,COMPUTER_LAB,true,true`,
  },
  departments: {
    fields: ['code', 'name', 'facultyId'],
    example: `code,name,facultyId
CSC,Computer Science,faculty-applied-science
ECO,Economics,faculty-social-science`,
  },
}

interface BulkUploadProps {
  institutionId: string
  onUploadComplete?: () => void
}

export function BulkUpload({ institutionId, onUploadComplete }: BulkUploadProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [uploadType, setUploadType] = useState<UploadType>('students')
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<UploadStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<UploadResult | null>(null)
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }, [])

  const handleFile = (selectedFile: File) => {
    const validTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
    
    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.endsWith('.csv') && !selectedFile.name.endsWith('.xlsx')) {
      toast({
        title: 'Invalid File',
        description: 'Please upload a CSV or Excel file',
        variant: 'destructive',
      })
      return
    }
    
    setFile(selectedFile)
    setStatus('idle')
    setResult(null)
  }

  const handleUpload = async () => {
    if (!file) return

    setStatus('uploading')
    setProgress(0)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', uploadType)
    formData.append('institutionId', institutionId)

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      const response = await fetch('/api/bulk-upload', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)
      setProgress(100)

      const data = await response.json()

      if (response.ok) {
        setStatus('success')
        setResult({
          total: data.total || 0,
          success: data.success || 0,
          failed: data.failed || 0,
          errors: data.errors || [],
        })
        
        toast({
          title: 'Upload Complete',
          description: `Successfully imported ${data.success} records`,
        })
        
        onUploadComplete?.()
      } else {
        setStatus('error')
        setResult({
          total: 0,
          success: 0,
          failed: data.total || 0,
          errors: [data.error || 'Upload failed'],
        })
        
        toast({
          title: 'Upload Failed',
          description: data.error || 'An error occurred during upload',
          variant: 'destructive',
        })
      }
    } catch (error) {
      setStatus('error')
      setResult({
        total: 0,
        success: 0,
        failed: 0,
        errors: ['Network error occurred'],
      })
      
      toast({
        title: 'Error',
        description: 'Failed to upload file',
        variant: 'destructive',
      })
    }
  }

  const downloadTemplate = () => {
    const template = uploadTemplates[uploadType]
    const blob = new Blob([template.example], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${uploadType}_template.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const resetUpload = () => {
    setFile(null)
    setStatus('idle')
    setProgress(0)
    setResult(null)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white border-0">
          <Upload className="w-4 h-4 mr-2" />
          Bulk Upload
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-900 border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-cyan-400" />
            Bulk Data Upload
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Upload CSV or Excel files to import data in bulk
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Upload Type Selection */}
          <div className="space-y-2">
            <label className="text-sm text-slate-400">What are you uploading?</label>
            <Select value={uploadType} onValueChange={(v) => { setUploadType(v as UploadType); resetUpload() }}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/10">
                <SelectItem value="students" className="text-white">Students</SelectItem>
                <SelectItem value="courses" className="text-white">Courses</SelectItem>
                <SelectItem value="lecturers" className="text-white">Lecturers</SelectItem>
                <SelectItem value="rooms" className="text-white">Rooms/Venues</SelectItem>
                <SelectItem value="departments" className="text-white">Departments</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Template Download */}
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
            <div>
              <p className="text-sm text-white">Download Template</p>
              <p className="text-xs text-slate-400">
                Required fields: {uploadTemplates[uploadType].fields.join(', ')}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadTemplate}
              className="border-white/10 text-slate-300"
            >
              <Download className="w-4 h-4 mr-2" />
              Template
            </Button>
          </div>

          {/* Drop Zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-cyan-500 bg-cyan-500/10'
                : 'border-white/10 hover:border-white/20'
            }`}
          >
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <FileSpreadsheet className="w-8 h-8 text-green-400" />
                <div className="text-left">
                  <p className="text-white font-medium">{file.name}</p>
                  <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => { e.stopPropagation(); resetUpload() }}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div>
                <Upload className="w-12 h-12 mx-auto text-slate-500 mb-4" />
                <p className="text-white mb-1">Drag & drop your file here</p>
                <p className="text-sm text-slate-400">or click to browse (CSV, XLS, XLSX)</p>
              </div>
            )}
          </div>

          {/* Progress */}
          {(status === 'uploading' || status === 'processing') && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">
                  {status === 'uploading' ? 'Uploading...' : 'Processing...'}
                </span>
                <span className="text-cyan-400">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2 bg-white/10" />
            </div>
          )}

          {/* Result */}
          {status === 'success' && result && (
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <span className="text-green-400 font-medium">Upload Complete</span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-white">{result.total}</div>
                  <div className="text-xs text-slate-400">Total</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-400">{result.success}</div>
                  <div className="text-xs text-slate-400">Success</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-400">{result.failed}</div>
                  <div className="text-xs text-slate-400">Failed</div>
                </div>
              </div>
              {result.errors.length > 0 && (
                <div className="mt-3 p-2 bg-white/5 rounded max-h-32 overflow-y-auto">
                  {result.errors.map((err, i) => (
                    <p key={i} className="text-xs text-red-400">{err}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {status === 'error' && result && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <span className="text-red-400 font-medium">Upload Failed</span>
              </div>
              {result.errors.map((err, i) => (
                <p key={i} className="text-sm text-red-400 mt-2">{err}</p>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-white/10 text-slate-300"
            >
              Close
            </Button>
            {file && status !== 'uploading' && status !== 'processing' && (
              <Button
                onClick={handleUpload}
                disabled={!file || status === 'uploading'}
                className="bg-gradient-to-r from-cyan-500 to-blue-600"
              >
                {status === 'uploading' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload {uploadType.charAt(0).toUpperCase() + uploadType.slice(1)}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Alternative simple upload button for inline use
export function SimpleUploadButton({ 
  institutionId, 
  type = 'students',
  onComplete 
}: { 
  institutionId: string
  type?: UploadType
  onComplete?: () => void 
}) {
  const [uploading, setUploading] = useState(false)
  const { toast } = useToast()

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)
    formData.append('institutionId', institutionId)

    try {
      const res = await fetch('/api/bulk-upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (res.ok) {
        toast({
          title: 'Upload Complete',
          description: `Successfully imported ${data.success} ${type}`,
        })
        onComplete?.()
      } else {
        toast({
          title: 'Upload Failed',
          description: data.error,
          variant: 'destructive',
        })
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Upload failed',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="relative">
      <input
        type="file"
        accept=".csv,.xlsx,.xls"
        onChange={handleFile}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        disabled={uploading}
      />
      <Button
        variant="outline"
        className="border-white/10 text-slate-300"
        disabled={uploading}
      >
        {uploading ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Upload className="w-4 h-4 mr-2" />
        )}
        {uploading ? 'Uploading...' : 'Import CSV'}
      </Button>
    </div>
  )
}
