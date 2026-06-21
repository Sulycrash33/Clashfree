'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
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
import { Building2, Loader2 } from 'lucide-react'
import { Suspense } from 'react'
import { Loader2 as SuspenseLoader } from 'lucide-react'
import { useCrud } from '@/hooks/use-crud'
import { StatusBadge } from '@/components/status-badge'
import { createActionsColumn } from '@/components/actions-column'
import { AccessDenied } from '@/components/access-denied'
import { LoadingSpinner } from '@/components/loading-spinner'

interface Department {
  id: string
  name: string
  code: string
  hodName?: string
  isActive: boolean
  facultyId: string
  faculty?: { name: string; code: string }
  createdAt: string
  _count?: { students: number; lecturers: number; courses: number }
}

interface Faculty {
  id: string
  name: string
  code: string
}

function DepartmentsPageInner() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlFacultyId = searchParams.get('facultyId')

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    hodName: '',
    facultyId: '',
  })

  const handleDialogOpen = useCallback((item: Department | null) => {
    if (item) {
      setFormData({
        name: item.name,
        code: item.code,
        hodName: item.hodName || '',
        facultyId: item.facultyId,
      })
    } else {
      setFormData({ name: '', code: '', hodName: '', facultyId: '' })
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
  } = useCrud<Department>({
    endpoints: [
      { url: '/api/departments', key: 'departments' },
      { url: '/api/faculties', key: 'faculties' },
    ],
    resourceName: 'Department',
    apiBasePath: '/api/departments',
    onDialogOpen: handleDialogOpen,
  })

  const departments = (data.departments || []) as Department[]
  const faculties = (data.faculties || []) as unknown as Faculty[]
  const [filterFacultyId, setFilterFacultyId] = useState<string>(urlFacultyId || 'all')

  useEffect(() => {
    if (!session?.user) return
    if (session.user.role === 'ST' || session.user.role === 'LC') {
      router.push('/dashboard')
      return
    }
    fetchData()
  }, [session, router, fetchData])

  const columns: ColumnDef<Department>[] = [
    {
      accessorKey: 'code',
      header: 'Code',
      cell: ({ row }) => (
        <Badge variant="outline" className="border-success/20 text-success">
          {row.getValue('code')}
        </Badge>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Department Name',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-success/20 to-success/20 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-success" />
          </div>
          <div>
            <div className="font-medium text-foreground">{row.getValue('name')}</div>
            {row.original.hodName && <div className="text-xs text-muted-foreground">HOD: {row.original.hodName}</div>}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'faculty',
      header: 'Faculty',
      cell: ({ row }) => (
        <Badge variant="secondary" className="bg-foreground/10 text-muted-foreground">
          {row.original.faculty?.code || 'N/A'}
        </Badge>
      ),
    },
    {
      id: 'stats',
      header: 'Stats',
      cell: ({ row }) => (
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{row.original._count?.students || 0} students</span>
          <span>{row.original._count?.lecturers || 0} lecturers</span>
          <span>{row.original._count?.courses || 0} courses</span>
        </div>
      ),
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => <StatusBadge isActive={row.getValue('isActive')} />,
    },
    createActionsColumn<Department>({
      onEdit: openEditDialog,
      onDelete: (item) => handleDelete(item.id),
    }),
  ]

  if (!['SA', 'IA', 'TO'].includes(session?.user?.role || '')) {
    return <AccessDenied />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Departments"
        description="Manage departments within faculties"
        actionLabel="Add Department"
        onAction={openCreateDialog}
        onRefresh={fetchData}
        loading={loading}
      />

      <Card className="bg-foreground/5 border-foreground/10 backdrop-blur-sm">
        <CardContent className="pt-6">
          {loading ? (
            <LoadingSpinner className="text-success" />
          ) : (
            <>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xs text-muted-foreground">Filter by Faculty:</span>
                <Select value={filterFacultyId} onValueChange={setFilterFacultyId}>
                  <SelectTrigger className="w-56 bg-foreground/5 border-foreground/10 text-foreground text-sm">
                    <SelectValue placeholder="All Faculties" />
                  </SelectTrigger>
                  <SelectContent className="bg-muted border-foreground/10">
                    <SelectItem value="all" className="text-foreground">All Faculties</SelectItem>
                    {faculties.map(f => (
                      <SelectItem key={f.id} value={f.id} className="text-foreground">{f.code} – {f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {filterFacultyId !== 'all' && (
                  <Badge variant="outline" className="text-secondary border-secondary/30">
                    {faculties.find(f => f.id === filterFacultyId)?.code} — {departments.filter(d => d.facultyId === filterFacultyId).length} dept(s)
                  </Badge>
                )}
              </div>
              <DataTable
                columns={columns}
                data={filterFacultyId === 'all' ? departments : departments.filter(d => d.facultyId === filterFacultyId)}
                searchKey="name"
                searchPlaceholder="Search departments..."
              />
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-muted border-foreground/10 text-foreground">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Department' : 'Add New Department'}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {editingItem ? 'Update department details' : 'Create a new department'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Department Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-foreground/5 border-foreground/10 text-foreground"
                  placeholder="e.g., Computer Science"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Code</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="bg-foreground/5 border-foreground/10 text-foreground"
                  placeholder="e.g., CSC"
                  maxLength={10}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Faculty</Label>
              <Select value={formData.facultyId} onValueChange={(v) => setFormData({ ...formData, facultyId: v })}>
                <SelectTrigger className="bg-foreground/5 border-foreground/10 text-foreground">
                  <SelectValue placeholder="Select faculty" />
                </SelectTrigger>
                <SelectContent className="bg-muted border-foreground/10">
                  {faculties.map((f) => (
                    <SelectItem key={f.id} value={f.id} className="text-foreground">{f.name} ({f.code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">HOD Name</Label>
              <Input
                value={formData.hodName}
                onChange={(e) => setFormData({ ...formData, hodName: e.target.value })}
                className="bg-foreground/5 border-foreground/10 text-foreground"
                placeholder="e.g., Dr. Jane Smith"
              />
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

export default function DepartmentsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-12"><SuspenseLoader className="w-8 h-8 animate-spin text-secondary" /></div>}>
      <DepartmentsPageInner />
    </Suspense>
  )
}
