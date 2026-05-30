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
        <Badge variant="outline" className="border-cyan-500/20 text-cyan-400 font-mono">
          {row.getValue('regNumber')}
        </Badge>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Student Name',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="font-medium text-white">{row.getValue('name')}</div>
            <div className="text-xs text-slate-400">
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
        <div className="text-slate-300">
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
            <Badge className="bg-amber-500/10 text-amber-400">Spillover</Badge>
          )}
          <Badge className={row.getValue('isActive') ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}>
            {row.getValue('isActive') ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: '_count.studentCourses',
      header: 'Courses',
      cell: ({ row }) => (
        <div className="text-slate-400">
          {row.original._count?.studentCourses || 0} registered
        </div>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-slate-900 border-white/10">
            <DropdownMenuItem onClick={() => handleOpenDialog(row.original)} className="text-slate-300">
              <Pencil className="w-4 h-4 mr-2" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDelete(row.original.id)} className="text-red-400">
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  if (!['SA', 'IA', 'TO', 'LC'].includes(session?.user?.role || '')) {
    return (
      <Alert className="bg-red-500/10 border-red-500/20">
        <AlertDescription className="text-red-400">Access denied.</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Students</h1>
          <p className="text-slate-400">Manage student records and registrations</p>
        </div>
        <div className="flex items-center gap-2">
          <BulkUpload institutionId="demo-institution" onUploadComplete={fetchData} />
          <Button onClick={() => handleOpenDialog()} className="bg-gradient-to-r from-cyan-500 to-blue-600">
            Add Student
          </Button>
          <Button variant="outline" onClick={fetchData} disabled={loading} className="border-white/10 text-slate-300">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
            </div>
          ) : (
            <DataTable columns={columns} data={students} searchKey="name" searchPlaceholder="Search students..." />
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-slate-900 border-white/10 text-white max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingStudent ? 'Edit Student' : 'Add New Student'}</DialogTitle>
            <DialogDescription className="text-slate-400">
              {editingStudent ? 'Update student details' : 'Register a new student'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Registration Number</Label>
                <Input
                  value={formData.regNumber}
                  onChange={(e) => setFormData({ ...formData, regNumber: e.target.value.toUpperCase() })}
                  className="bg-white/5 border-white/10 text-white font-mono"
                  placeholder="e.g., NSUK/2021/CSC/001"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Admission Year</Label>
                <Select value={formData.admissionYear} onValueChange={(v) => setFormData({ ...formData, admissionYear: v })}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10">
                    {years.map((y) => (
                      <SelectItem key={y} value={y.toString()} className="text-white">{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Full Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
                placeholder="e.g., John Doe"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Email (Optional)</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                  placeholder="e.g., john@university.edu"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Phone (Optional)</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                  placeholder="e.g., 08012345678"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Department</Label>
                <Select value={formData.departmentId} onValueChange={(v) => setFormData({ ...formData, departmentId: v })}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10">
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.id} className="text-white">{d.name} ({d.code})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Level</Label>
                <Select value={formData.level} onValueChange={(v) => setFormData({ ...formData, level: v })}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10">
                    {levels.map((l) => (
                      <SelectItem key={l} value={l.toString()} className="text-white">{l} Level</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-white/10 text-slate-300">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-cyan-500 to-blue-600">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {editingStudent ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
