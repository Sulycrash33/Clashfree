'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { DataTable } from '@/components/data-table'
import { PageHeader } from '@/components/page-header'
import { ColumnDef } from '@tanstack/react-table'
import { GraduationCap, MoreHorizontal, Pencil, Trash2, Loader2, Upload, Download } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { BulkUpload } from '@/components/bulk-upload'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { BookOpen, Eye } from 'lucide-react'

interface Student {
  id: string
  regNumber: string
  name: string
  email?: string
  phone?: string
  level: number
  admissionYear: number
  isSpillover: boolean
  isActive: boolean
  departmentId: string
  department?: { name: string; code: string; faculty?: { code: string } }
  createdAt: string
  _count?: { studentCourses: number }
}

interface Department {
  id: string
  name: string
  code: string
}

export default function StudentsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [students, setStudents] = useState<Student[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [formData, setFormData] = useState({
    regNumber: '',
    name: '',
    email: '',
    phone: '',
    level: '100',
    admissionYear: new Date().getFullYear().toString(),
    departmentId: '',
    isSpillover: false,
  })
  const [saving, setSaving] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailStudent, setDetailStudent] = useState<Student | null>(null)
  const [studentCourses, setStudentCourses] = useState<any[]>([])
  const [courseSummary, setCourseSummary] = useState<any>(null)
  const [coursesLoading, setCoursesLoading] = useState(false)
  const [allCourses, setAllCourses] = useState<any[]>([])
  const [addCourseId, setAddCourseId] = useState('')
  const [addingCourse, setAddingCourse] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [studentRes, deptRes] = await Promise.all([
        fetch('/api/students'),
        fetch('/api/departments'),
      ])
      if (studentRes.ok) setStudents(await studentRes.json())
      if (deptRes.ok) setDepartments(await deptRes.json())
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to fetch data', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const fetchStudentCourses = async (student: Student) => {
    setCoursesLoading(true)
    try {
      const res = await fetch(`/api/students/courses?studentId=${student.id}`)
      if (res.ok) {
        const data = await res.json()
        setStudentCourses(data.courses || [])
        setCourseSummary(data.summary || null)
      }
    } catch {}
    finally { setCoursesLoading(false) }
  }

  const handleOpenDetail = async (student: Student) => {
    setDetailStudent(student)
    setDetailOpen(true)
    await fetchStudentCourses(student)
    // fetch all courses for picker
    try {
      const res = await fetch(`/api/courses?level=${student.level}`)
      if (res.ok) setAllCourses(await res.json())
    } catch {}
  }

  const handleAddCourse = async () => {
    if (!detailStudent || !addCourseId) return
    setAddingCourse(true)
    try {
      const res = await fetch('/api/students/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: detailStudent.id, courseId: addCourseId }),
      })
      if (res.ok) {
        toast({ title: 'Course added' })
        setAddCourseId('')
        await fetchStudentCourses(detailStudent)
        fetchData()
      } else {
        const err = await res.json()
        toast({ title: 'Error', description: err.error, variant: 'destructive' })
      }
    } catch {}
    finally { setAddingCourse(false) }
  }

  const handleRemoveCourse = async (regId: string) => {
    if (!confirm('Remove this course from student?')) return
    try {
      const res = await fetch(`/api/students/courses?regId=${regId}`, { method: 'DELETE' })
      if (res.ok && detailStudent) {
        toast({ title: 'Course removed' })
        await fetchStudentCourses(detailStudent)
        fetchData()
      }
    } catch {}
  }

  useEffect(() => {
    if (!session?.user) return
    if (session.user.role === 'ST') {
      router.push('/dashboard')
      return
    }
    fetchData()
  }, [session, router, fetchData])

  const handleOpenDialog = (student?: Student) => {
    if (student) {
      setEditingStudent(student)
      setFormData({
        regNumber: student.regNumber,
        name: student.name,
        email: student.email || '',
        phone: student.phone || '',
        level: student.level.toString(),
        admissionYear: student.admissionYear.toString(),
        departmentId: student.departmentId,
        isSpillover: student.isSpillover,
      })
    } else {
      setEditingStudent(null)
      setFormData({
        regNumber: '',
        name: '',
        email: '',
        phone: '',
        level: '100',
        admissionYear: new Date().getFullYear().toString(),
        departmentId: departments[0]?.id || '',
        isSpillover: false,
      })
    }
    setDialogOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const url = editingStudent ? `/api/students/${editingStudent.id}` : '/api/students'
      const method = editingStudent ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          level: parseInt(formData.level),
          admissionYear: parseInt(formData.admissionYear),
        }),
      })

      if (res.ok) {
        toast({ title: 'Success', description: `Student ${editingStudent ? 'updated' : 'created'} successfully` })
        setDialogOpen(false)
        fetchData()
      } else {
        const error = await res.json()
        toast({ title: 'Error', description: error.error || 'Failed to save', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'An error occurred', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this student?')) return
    try {
      const res = await fetch(`/api/students/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'Success', description: 'Student deleted' })
        fetchData()
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' })
    }
  }

  const levels = [100, 200, 300, 400, 500, 600]
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i)

  const columns: ColumnDef<Student>[] = [
    {
      accessorKey: 'regNumber',
      header: 'Reg Number',
      cell: ({ row }) => (
        <Badge variant="outline" className="border-secondary/20 text-secondary font-mono">
          {row.getValue('regNumber')}
        </Badge>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Student Name',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-secondary/20 to-secondary/20 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-secondary" />
          </div>
          <div>
            <div className="font-medium text-white">{row.getValue('name')}</div>
            <div className="text-xs text-muted">
              {row.original.department?.code} • {row.original.level} Level
            </div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'department',
      header: 'Department',
      cell: ({ row }) => (
        <div className="text-muted">
          {row.original.department?.name || 'N/A'}
        </div>
      ),
    },
    {
      accessorKey: 'isSpillover',
      header: 'Status',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.original.isSpillover && (
            <Badge className="bg-accent-gold/10 text-accent-gold">Spillover</Badge>
          )}
          <Badge className={row.getValue('isActive') ? 'bg-success/10 text-success' : 'bg-clash/10 text-clash'}>
            {row.getValue('isActive') ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: '_count.studentCourses',
      header: 'Courses',
      cell: ({ row }) => (
        <div className="text-muted">
          {row.original._count?.studentCourses || 0} registered
        </div>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-muted border-foreground/10">
            <DropdownMenuItem onClick={() => handleOpenDetail(row.original)} className="text-muted">
              <Eye className="w-4 h-4 mr-2" /> View Courses
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleOpenDialog(row.original)} className="text-muted">
              <Pencil className="w-4 h-4 mr-2" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDelete(row.original.id)} className="text-clash">
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  if (!['SA', 'IA', 'TO', 'LC'].includes(session?.user?.role || '')) {
    return (
      <Alert className="bg-clash/10 border-clash/20">
        <AlertDescription className="text-clash">Access denied.</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Students</h1>
          <p className="text-muted">Manage student records and registrations</p>
        </div>
        <div className="flex items-center gap-2">
          <BulkUpload institutionId="demo-institution" onUploadComplete={fetchData} />
          <Button onClick={() => handleOpenDialog()} className="bg-gradient-to-r from-secondary to-secondary">
            Add Student
          </Button>
          <Button variant="outline" onClick={fetchData} disabled={loading} className="border-foreground/10 text-muted">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      <Card className="bg-foreground/5 border-foreground/10 backdrop-blur-sm">
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-secondary" />
            </div>
          ) : (
            <DataTable columns={columns} data={students} searchKey="name" searchPlaceholder="Search students..." />
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-muted border-foreground/10 text-white max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingStudent ? 'Edit Student' : 'Add New Student'}</DialogTitle>
            <DialogDescription className="text-muted">
              {editingStudent ? 'Update student details' : 'Register a new student'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-muted">Registration Number</Label>
                <Input
                  value={formData.regNumber}
                  onChange={(e) => setFormData({ ...formData, regNumber: e.target.value.toUpperCase() })}
                  className="bg-foreground/5 border-foreground/10 text-white font-mono"
                  placeholder="e.g., NSUK/2021/CSC/001"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-muted">Admission Year</Label>
                <Select value={formData.admissionYear} onValueChange={(v) => setFormData({ ...formData, admissionYear: v })}>
                  <SelectTrigger className="bg-foreground/5 border-foreground/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-muted border-foreground/10">
                    {years.map((y) => (
                      <SelectItem key={y} value={y.toString()} className="text-white">{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-muted">Full Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-foreground/5 border-foreground/10 text-white"
                placeholder="e.g., John Doe"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-muted">Email (Optional)</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-foreground/5 border-foreground/10 text-white"
                  placeholder="e.g., john@university.edu"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-muted">Phone (Optional)</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="bg-foreground/5 border-foreground/10 text-white"
                  placeholder="e.g., 08012345678"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-muted">Department</Label>
                <Select value={formData.departmentId} onValueChange={(v) => setFormData({ ...formData, departmentId: v })}>
                  <SelectTrigger className="bg-foreground/5 border-foreground/10 text-white">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent className="bg-muted border-foreground/10">
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.id} className="text-white">{d.name} ({d.code})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-muted">Level</Label>
                <Select value={formData.level} onValueChange={(v) => setFormData({ ...formData, level: v })}>
                  <SelectTrigger className="bg-foreground/5 border-foreground/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-muted border-foreground/10">
                    {levels.map((l) => (
                      <SelectItem key={l} value={l.toString()} className="text-white">{l} Level</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-foreground/10 text-muted">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-secondary to-secondary">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {editingStudent ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Student Detail Sheet */}
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent className="bg-muted border-foreground/10 text-white w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-secondary" />
              {detailStudent?.name}
            </SheetTitle>
            <SheetDescription className="text-muted">
              {detailStudent?.regNumber} · {detailStudent?.department?.code} · {detailStudent?.level}L
            </SheetDescription>
          </SheetHeader>

          {/* Summary badges */}
          {courseSummary && (
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="outline" className="text-secondary border-secondary/30">{courseSummary.total} Courses</Badge>
              <Badge variant="outline" className="text-muted border-foreground/10">{courseSummary.totalCreditUnits} CU</Badge>
              {courseSummary.carryOver > 0 && <Badge className="bg-accent-gold/20 text-accent-gold">{courseSummary.carryOver} CO</Badge>}
              {courseSummary.spillover > 0 && <Badge className="bg-clash/20 text-clash">{courseSummary.spillover} Spillover</Badge>}
              {courseSummary.fyp > 0 && <Badge className="bg-primary/20 text-primary">{courseSummary.fyp} FYP</Badge>}
              {detailStudent?.isSpillover && <Badge className="bg-accent-gold/20 text-accent-gold">Spillover Student</Badge>}
            </div>
          )}

          {/* Course Picker */}
          {(session?.user?.role === 'TO' || session?.user?.role === 'IA' || session?.user?.role === 'SA') && (
            <div className="flex gap-2 mb-4">
              <Select value={addCourseId} onValueChange={setAddCourseId}>
                <SelectTrigger className="flex-1 bg-foreground/5 border-foreground/10 text-white text-sm">
                  <SelectValue placeholder="Add a course..." />
                </SelectTrigger>
                <SelectContent className="bg-muted border-foreground/10 max-h-48">
                  {allCourses
                    .filter(c => !studentCourses.some(sc => sc.course.id === c.id))
                    .map(c => (
                      <SelectItem key={c.id} value={c.id} className="text-white text-sm">
                        {c.code} – {c.name} ({c.level}L)
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleAddCourse}
                disabled={!addCourseId || addingCourse}
                size="sm"
                className="bg-gradient-to-r from-secondary to-secondary text-white border-0"
              >
                {addingCourse ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add'}
              </Button>
            </div>
          )}

          {/* Course list */}
          {coursesLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-secondary" /></div>
          ) : (
            <div className="space-y-2">
              {studentCourses.map(reg => (
                <div
                  key={reg.id}
                  className={`p-3 rounded-lg border ${
                    reg.isCO ? 'border-accent-gold/30 bg-accent-gold/5'
                    : reg.isSpillover ? 'border-clash/30 bg-clash/5'
                    : reg.isFYP ? 'border-primary/30 bg-primary/5'
                    : 'border-foreground/10 bg-foreground/5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-secondary border-secondary/20 font-mono text-xs">
                        {reg.course.code}
                      </Badge>
                      {reg.isCO && <Badge className="bg-accent-gold/20 text-accent-gold text-xs">CO</Badge>}
                      {reg.isSpillover && <Badge className="bg-clash/20 text-clash text-xs">Spillover</Badge>}
                      {reg.isFYP && <Badge className="bg-primary/20 text-primary text-xs">FYP</Badge>}
                      {reg.course.isShared && <Badge className="bg-clash/20 text-clash text-xs">GST</Badge>}
                    </div>
                    <div className="flex items-center gap-2">
                      {reg.roomSplitNeeded && (
                        <Badge className="bg-accent-gold/20 text-accent-gold text-xs" title="Large class — multiple rooms needed">
                          ✂ Split ({reg.totalEnrolled})
                        </Badge>
                      )}
                      {(session?.user?.role === 'TO' || session?.user?.role === 'IA' || session?.user?.role === 'SA') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveCourse(reg.id)}
                          className="h-6 w-6 p-0 text-clash hover:text-clash"
                        >
                          ×
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="mt-1 text-sm text-white">{reg.course.name}</div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted">
                    <span>{reg.course.level}L · Sem {reg.course.semester}</span>
                    <span>{reg.course.creditUnits} CU</span>
                    <span>{reg.course.department?.code}</span>
                    <span className="text-muted">{reg.totalEnrolled} enrolled total</span>
                  </div>
                </div>
              ))}
              {studentCourses.length === 0 && (
                <div className="text-center py-8 text-muted">No courses registered</div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
