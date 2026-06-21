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
import { BookOpen, Loader2, Users } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { useCrud } from '@/hooks/use-crud'
import { StatusBadge } from '@/components/status-badge'
import { createActionsColumn } from '@/components/actions-column'
import { AccessDenied } from '@/components/access-denied'
import { LoadingSpinner } from '@/components/loading-spinner'

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

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    creditUnits: '2',
    level: '100',
    semester: '1',
    departmentId: '',
    isShared: false,
  })

  const handleDialogOpen = useCallback((item: Course | null) => {
    if (item) {
      setFormData({
        code: item.code,
        name: item.name,
        creditUnits: item.creditUnits.toString(),
        level: item.level.toString(),
        semester: item.semester.toString(),
        departmentId: item.departmentId,
        isShared: item.isShared,
      })
    } else {
      setFormData({
        code: '',
        name: '',
        creditUnits: '2',
        level: '100',
        semester: '1',
        departmentId: '',
        isShared: false,
      })
    }
  }, [])

  const {
    data,
    loading,
    saving,
    dialogOpen,
    setDialogOpen,
    editingItem,
    fetchData,
    handleSave,
    handleDelete,
    openCreateDialog,
    openEditDialog,
  } = useCrud<Course>({
    endpoints: [
      { url: '/api/courses', key: 'courses' },
      { url: '/api/departments', key: 'departments' },
    ],
    resourceName: 'Course',
    apiBasePath: '/api/courses',
    onDialogOpen: handleDialogOpen,
    transformPayload: (fd) => ({
      ...fd,
      creditUnits: parseInt(fd.creditUnits as string),
      level: parseInt(fd.level as string),
      semester: parseInt(fd.semester as string),
    }),
  })

  const courses = (data.courses || []) as Course[]
  const departments = (data.departments || []) as unknown as Department[]

  useEffect(() => {
    if (!session?.user) return
    if (session.user.role === 'ST') {
      router.push('/dashboard')
      return
    }
    fetchData()
  }, [session, router, fetchData])

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
      cell: ({ row }) => <StatusBadge isActive={row.getValue('isActive')} />,
    },
    createActionsColumn<Course>({
      onEdit: openEditDialog,
      onDelete: (item) => handleDelete(item.id),
    }),
  ]

  if (!['SA', 'IA', 'TO', 'LC'].includes(session?.user?.role || '')) {
    return <AccessDenied />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Courses"
        description="Manage courses and curriculum"
        actionLabel="Add Course"
        onAction={openCreateDialog}
        onRefresh={fetchData}
        loading={loading}
      />

      <Card className="bg-foreground/5 border-foreground/10 backdrop-blur-sm">
        <CardContent className="pt-6">
          {loading ? (
            <LoadingSpinner className="text-accent-gold" />
          ) : (
            <DataTable columns={columns} data={courses} searchKey="name" searchPlaceholder="Search courses..." />
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-muted border-foreground/10 text-foreground max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Course' : 'Add New Course'}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {editingItem ? 'Update course details' : 'Create a new course'}
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
            <Button onClick={() => handleSave(formData as unknown as Record<string, unknown>, editingItem?.id)} disabled={saving} className="bg-gradient-to-r from-accent-gold to-accent-gold">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {editingItem ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
