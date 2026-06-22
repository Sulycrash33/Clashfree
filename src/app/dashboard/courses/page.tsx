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
import { BookOpen, MoreHorizontal, Pencil, Trash2, Loader2, Users } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'

interface Course {
  id: string
  code: string
  name: string
  creditUnits: number
  level: number
  semester: number
  isShared: boolean
  isActive: boolean
  departmentId: string
  department?: { name: string; code: string }
  lecturer?: { name: string }
  createdAt: string
  _count?: { studentCourses: number }
}

interface Department {
  id: string
  name: string
  code: string
}

export default function CoursesPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [courses, setCourses] = useState<Course[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    creditUnits: '2',
    level: '100',
    semester: '1',
    departmentId: '',
    isShared: false,
  })
  const [saving, setSaving] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [courseRes, deptRes] = await Promise.all([
        fetch('/api/courses'),
        fetch('/api/departments'),
      ])
      if (courseRes.ok) setCourses(await courseRes.json())
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

  const handleOpenDialog = (course?: Course) => {
    if (course) {
      setEditingCourse(course)
      setFormData({
        code: course.code,
        name: course.name,
        creditUnits: course.creditUnits.toString(),
        level: course.level.toString(),
        semester: course.semester.toString(),
        departmentId: course.departmentId,
        isShared: course.isShared,
      })
    } else {
      setEditingCourse(null)
      setFormData({
        code: '',
        name: '',
        creditUnits: '2',
        level: '100',
        semester: '1',
        departmentId: departments[0]?.id || '',
        isShared: false,
      })
    }
    setDialogOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const url = editingCourse ? `/api/courses/${editingCourse.id}` : '/api/courses'
      const method = editingCourse ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          creditUnits: parseInt(formData.creditUnits),
          level: parseInt(formData.level),
          semester: parseInt(formData.semester),
        }),
      })

      if (res.ok) {
        toast({ title: 'Success', description: `Course ${editingCourse ? 'updated' : 'created'} successfully` })
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
    if (!confirm('Are you sure you want to delete this course?')) return
    try {
      const res = await fetch(`/api/courses/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'Success', description: 'Course deleted' })
        fetchData()
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' })
    }
  }

  const levels = [100, 200, 300, 400, 500, 600]

  const columns: ColumnDef<Course>[] = [
    {
      accessorKey: 'code',
      header: 'Code',
      cell: ({ row }) => (
        <Badge variant="outline" className="border-accent-gold/20 text-accent-gold font-mono">
          {row.getValue('code')}
        </Badge>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Course Name',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent-gold/20 to-accent-gold/20 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-accent-gold" />
          </div>
          <div>
            <div className="font-medium text-foreground">{row.getValue('name')}</div>
            <div className="text-xs text-muted-foreground">
              {row.original.department?.code} • {row.original.creditUnits} CU
            </div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'level',
      header: 'Level',
      cell: ({ row }) => (
        <Badge variant="secondary" className="bg-foreground/10 text-muted-foreground">
          {row.getValue('level')} Level
        </Badge>
      ),
    },
    {
      accessorKey: 'isShared',
      header: 'Type',
      cell: ({ row }) => (
        <Badge className={row.getValue('isShared') ? 'bg-primary/10 text-primary' : 'bg-muted/10 text-muted-foreground'}>
          {row.getValue('isShared') ? 'GST/Shared' : 'Core'}
        </Badge>
      ),
    },
    {
      accessorKey: '_count.studentCourses',
      header: 'Enrolled',
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Users className="w-4 h-4" />
          {row.original._count?.studentCourses || 0}
        </div>
      ),
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => (
        <Badge className={row.getValue('isActive') ? 'bg-success/10 text-success' : 'bg-clash/10 text-clash'}>
          {row.getValue('isActive') ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-muted border-foreground/10">
            <DropdownMenuItem onClick={() => handleOpenDialog(row.original)} className="text-muted-foreground">
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
      <PageHeader
        title="Courses"
        description="Manage courses and curriculum"
        actionLabel="Add Course"
        onAction={() => handleOpenDialog()}
        onRefresh={fetchData}
        loading={loading}
      />

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-accent-gold" />
            </div>
          ) : (
            <DataTable columns={columns} data={courses} searchKey="name" searchPlaceholder="Search courses..." />
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-muted border-foreground/10 text-foreground max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingCourse ? 'Edit Course' : 'Add New Course'}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {editingCourse ? 'Update course details' : 'Create a new course'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Course Code</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="bg-foreground/5 border-foreground/10 text-foreground font-mono"
                  placeholder="e.g., CSC 201"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Credit Units</Label>
                <Select value={formData.creditUnits} onValueChange={(v) => setFormData({ ...formData, creditUnits: v })}>
                  <SelectTrigger className="bg-foreground/5 border-foreground/10 text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-muted border-foreground/10">
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <SelectItem key={n} value={n.toString()} className="text-foreground">{n} CU</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Course Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-foreground/5 border-foreground/10 text-foreground"
                placeholder="e.g., Data Structures and Algorithms"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Department</Label>
                <Select value={formData.departmentId} onValueChange={(v) => setFormData({ ...formData, departmentId: v })}>
                  <SelectTrigger className="bg-foreground/5 border-foreground/10 text-foreground">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent className="bg-muted border-foreground/10">
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.id} className="text-foreground">{d.name} ({d.code})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Level</Label>
                <Select value={formData.level} onValueChange={(v) => setFormData({ ...formData, level: v })}>
                  <SelectTrigger className="bg-foreground/5 border-foreground/10 text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-muted border-foreground/10">
                    {levels.map((l) => (
                      <SelectItem key={l} value={l.toString()} className="text-foreground">{l} Level</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Semester</Label>
                <Select value={formData.semester} onValueChange={(v) => setFormData({ ...formData, semester: v })}>
                  <SelectTrigger className="bg-foreground/5 border-foreground/10 text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-muted border-foreground/10">
                    <SelectItem value="1" className="text-foreground">First Semester</SelectItem>
                    <SelectItem value="2" className="text-foreground">Second Semester</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 pt-6">
                <div className="flex items-center justify-between">
                  <Label className="text-muted-foreground">GST/Shared Course</Label>
                  <Switch
                    checked={formData.isShared}
                    onCheckedChange={(v) => setFormData({ ...formData, isShared: v })}
                  />
                </div>
                <p className="text-xs text-muted-foreground">Enable for GST or cross-department courses</p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-foreground/10 text-muted-foreground">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-accent-gold to-accent-gold">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {editingCourse ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
