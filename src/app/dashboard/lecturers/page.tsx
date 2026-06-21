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
import { Users, Loader2, Mail, Phone } from 'lucide-react'
import { useCrud } from '@/hooks/use-crud'
import { StatusBadge } from '@/components/status-badge'
import { createActionsColumn } from '@/components/actions-column'
import { AccessDenied } from '@/components/access-denied'
import { LoadingSpinner } from '@/components/loading-spinner'

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

  const [formData, setFormData] = useState({
    staffId: '',
    name: '',
    email: '',
    phone: '',
    rank: '',
    specialization: '',
    departmentId: '',
  })

  const handleDialogOpen = useCallback((item: Lecturer | null) => {
    if (item) {
      setFormData({
        staffId: item.staffId,
        name: item.name,
        email: item.email,
        phone: item.phone || '',
        rank: item.rank || '',
        specialization: item.specialization || '',
        departmentId: item.departmentId,
      })
    } else {
      setFormData({
        staffId: '',
        name: '',
        email: '',
        phone: '',
        rank: '',
        specialization: '',
        departmentId: '',
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
  } = useCrud<Lecturer>({
    endpoints: [
      { url: '/api/lecturers', key: 'lecturers' },
      { url: '/api/departments', key: 'departments' },
    ],
    resourceName: 'Lecturer',
    apiBasePath: '/api/lecturers',
    onDialogOpen: handleDialogOpen,
  })

  const lecturers = (data.lecturers || []) as Lecturer[]
  const departments = (data.departments || []) as unknown as Department[]

  useEffect(() => {
    if (!session?.user) return
    if (session.user.role === 'ST') {
      router.push('/dashboard')
      return
    }
    fetchData()
  }, [session, router, fetchData])

  const columns: ColumnDef<Lecturer>[] = [
    {
      accessorKey: 'staffId',
      header: 'Staff ID',
      cell: ({ row }) => (
        <Badge variant="outline" className="border-success/20 text-success font-mono">
          {row.getValue('staffId')}
        </Badge>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-success/20 to-success/20 flex items-center justify-center">
            <Users className="w-5 h-5 text-success" />
          </div>
          <div>
            <div className="font-medium text-foreground">{row.getValue('name')}</div>
            <div className="text-xs text-muted-foreground">
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
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="w-3 h-3" />
            <span className="text-sm">{row.getValue('email')}</span>
          </div>
          {row.original.phone && (
            <div className="flex items-center gap-2 text-muted-foreground">
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
        <span className="text-muted-foreground">{row.getValue('specialization') || 'N/A'}</span>
      ),
    },
    {
      accessorKey: '_count.courses',
      header: 'Assignments',
      cell: ({ row }) => (
        <div className="text-muted-foreground">
          {row.original._count?.courses || 0} courses • {row.original._count?.invigilations || 0} invigilations
        </div>
      ),
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => <StatusBadge isActive={row.getValue('isActive')} />,
    },
    createActionsColumn<Lecturer>({
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
        title="Lecturers"
        description="Manage academic staff and their assignments"
        actionLabel="Add Lecturer"
        onAction={openCreateDialog}
        onRefresh={fetchData}
        loading={loading}
      />

      <Card className="bg-foreground/5 border-foreground/10 backdrop-blur-sm">
        <CardContent className="pt-6">
          {loading ? (
            <LoadingSpinner className="text-success" />
          ) : (
            <DataTable columns={columns} data={lecturers} searchKey="name" searchPlaceholder="Search lecturers..." />
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-muted border-foreground/10 text-foreground max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Lecturer' : 'Add New Lecturer'}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {editingItem ? 'Update lecturer details' : 'Register a new lecturer'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Staff ID</Label>
                <Input
                  value={formData.staffId}
                  onChange={(e) => setFormData({ ...formData, staffId: e.target.value.toUpperCase() })}
                  className="bg-foreground/5 border-foreground/10 text-foreground font-mono"
                  placeholder="e.g., NSUK/STF/001"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Academic Rank</Label>
                <Select value={formData.rank} onValueChange={(v) => setFormData({ ...formData, rank: v })}>
                  <SelectTrigger className="bg-foreground/5 border-foreground/10 text-foreground">
                    <SelectValue placeholder="Select rank" />
                  </SelectTrigger>
                  <SelectContent className="bg-muted border-foreground/10">
                    {academicRanks.map((r) => (
                      <SelectItem key={r} value={r} className="text-foreground">{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Full Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-foreground/5 border-foreground/10 text-foreground"
                placeholder="e.g., Prof. John Doe"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-foreground/5 border-foreground/10 text-foreground"
                  placeholder="e.g., john@university.edu"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="bg-foreground/5 border-foreground/10 text-foreground"
                  placeholder="e.g., 08012345678"
                />
              </div>
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
                <Label className="text-muted-foreground">Specialization</Label>
                <Input
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  className="bg-foreground/5 border-foreground/10 text-foreground"
                  placeholder="e.g., Machine Learning"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-foreground/10 text-muted-foreground">
              Cancel
            </Button>
            <Button onClick={() => handleSave(formData, editingItem?.id)} disabled={saving} className="bg-gradient-to-r from-success to-success">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {editingItem ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
