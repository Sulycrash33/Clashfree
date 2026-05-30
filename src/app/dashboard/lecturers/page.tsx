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
import { Users, MoreHorizontal, Pencil, Trash2, Loader2, Mail, Phone } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface Lecturer {
  id: string
  staffId: string
  name: string
  email: string
  phone?: string
  rank?: string
  specialization?: string
  isActive: boolean
  departmentId: string
  department?: { name: string; code: string }
  createdAt: string
  _count?: { courses: number; invigilations: number }
}

interface Department {
  id: string
  name: string
  code: string
}

const academicRanks = [
  'Graduate Assistant',
  'Assistant Lecturer',
  'Lecturer II',
  'Lecturer I',
  'Senior Lecturer',
  'Reader',
  'Professor',
]

export default function LecturersPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [lecturers, setLecturers] = useState<Lecturer[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingLecturer, setEditingLecturer] = useState<Lecturer | null>(null)
  const [formData, setFormData] = useState({
    staffId: '',
    name: '',
    email: '',
    phone: '',
    rank: '',
    specialization: '',
    departmentId: '',
  })
  const [saving, setSaving] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [lectRes, deptRes] = await Promise.all([
        fetch('/api/lecturers'),
        fetch('/api/departments'),
      ])
      if (lectRes.ok) setLecturers(await lectRes.json())
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

  const handleOpenDialog = (lecturer?: Lecturer) => {
    if (lecturer) {
      setEditingLecturer(lecturer)
      setFormData({
        staffId: lecturer.staffId,
        name: lecturer.name,
        email: lecturer.email,
        phone: lecturer.phone || '',
        rank: lecturer.rank || '',
        specialization: lecturer.specialization || '',
        departmentId: lecturer.departmentId,
      })
    } else {
      setEditingLecturer(null)
      setFormData({
        staffId: '',
        name: '',
        email: '',
        phone: '',
        rank: '',
        specialization: '',
        departmentId: departments[0]?.id || '',
      })
    }
    setDialogOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const url = editingLecturer ? `/api/lecturers/${editingLecturer.id}` : '/api/lecturers'
      const method = editingLecturer ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        toast({ title: 'Success', description: `Lecturer ${editingLecturer ? 'updated' : 'created'} successfully` })
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
    if (!confirm('Are you sure you want to delete this lecturer?')) return
    try {
      const res = await fetch(`/api/lecturers/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'Success', description: 'Lecturer deleted' })
        fetchData()
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' })
    }
  }

  const columns: ColumnDef<Lecturer>[] = [
    {
      accessorKey: 'staffId',
      header: 'Staff ID',
      cell: ({ row }) => (
        <Badge variant="outline" className="border-green-500/20 text-green-400 font-mono">
          {row.getValue('staffId')}
        </Badge>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
            <Users className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <div className="font-medium text-white">{row.getValue('name')}</div>
            <div className="text-xs text-slate-400">
              {row.original.rank || 'N/A'} • {row.original.department?.code}
            </div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Contact',
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-slate-400">
            <Mail className="w-3 h-3" />
            <span className="text-sm">{row.getValue('email')}</span>
          </div>
          {row.original.phone && (
            <div className="flex items-center gap-2 text-slate-500">
              <Phone className="w-3 h-3" />
              <span className="text-xs">{row.original.phone}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'specialization',
      header: 'Specialization',
      cell: ({ row }) => (
        <span className="text-slate-400">{row.getValue('specialization') || 'N/A'}</span>
      ),
    },
    {
      accessorKey: '_count.courses',
      header: 'Assignments',
      cell: ({ row }) => (
        <div className="text-slate-400">
          {row.original._count?.courses || 0} courses • {row.original._count?.invigilations || 0} invigilations
        </div>
      ),
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => (
        <Badge className={row.getValue('isActive') ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}>
          {row.getValue('isActive') ? 'Active' : 'Inactive'}
        </Badge>
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
      <PageHeader
        title="Lecturers"
        description="Manage academic staff and their assignments"
        actionLabel="Add Lecturer"
        onAction={() => handleOpenDialog()}
        onRefresh={fetchData}
        loading={loading}
      />

      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-green-500" />
            </div>
          ) : (
            <DataTable columns={columns} data={lecturers} searchKey="name" searchPlaceholder="Search lecturers..." />
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-slate-900 border-white/10 text-white max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingLecturer ? 'Edit Lecturer' : 'Add New Lecturer'}</DialogTitle>
            <DialogDescription className="text-slate-400">
              {editingLecturer ? 'Update lecturer details' : 'Register a new lecturer'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Staff ID</Label>
                <Input
                  value={formData.staffId}
                  onChange={(e) => setFormData({ ...formData, staffId: e.target.value.toUpperCase() })}
                  className="bg-white/5 border-white/10 text-white font-mono"
                  placeholder="e.g., NSUK/STF/001"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Academic Rank</Label>
                <Select value={formData.rank} onValueChange={(v) => setFormData({ ...formData, rank: v })}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select rank" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10">
                    {academicRanks.map((r) => (
                      <SelectItem key={r} value={r} className="text-white">{r}</SelectItem>
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
                placeholder="e.g., Prof. John Doe"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                  placeholder="e.g., john@university.edu"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Phone</Label>
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
                <Label className="text-slate-300">Specialization</Label>
                <Input
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                  placeholder="e.g., Machine Learning"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-white/10 text-slate-300">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-green-500 to-emerald-600">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {editingLecturer ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
