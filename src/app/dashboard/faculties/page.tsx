'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { DataTable } from '@/components/data-table'
import { PageHeader } from '@/components/page-header'
import { ColumnDef } from '@tanstack/react-table'
import { Building2, Users, Loader2 } from 'lucide-react'
import { useCrud } from '@/hooks/use-crud'
import { StatusBadge } from '@/components/status-badge'
import { createActionsColumn } from '@/components/actions-column'
import { AccessDenied } from '@/components/access-denied'
import { LoadingSpinner } from '@/components/loading-spinner'

interface Faculty {
  id: string
  name: string
  code: string
  description?: string
  deanName?: string
  isActive: boolean
  institutionId: string
  createdAt: string
  _count?: { departments: number }
}

export default function FacultiesPage() {
  const { data: session } = useSession()
  const router = useRouter()

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    deanName: '',
  })

  const handleDialogOpen = useCallback((item: Faculty | null) => {
    if (item) {
      setFormData({
        name: item.name,
        code: item.code,
        description: item.description || '',
        deanName: item.deanName || '',
      })
    } else {
      setFormData({ name: '', code: '', description: '', deanName: '' })
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
  } = useCrud<Faculty>({
    endpoints: [{ url: '/api/faculties', key: 'faculties' }],
    resourceName: 'Faculty',
    apiBasePath: '/api/faculties',
    onDialogOpen: handleDialogOpen,
  })

  const faculties = data.faculties || []

  useEffect(() => {
    if (!session?.user) return
    if (session.user.role === 'ST' || session.user.role === 'LC') {
      router.push('/dashboard')
      return
    }
    fetchData()
  }, [session, router, fetchData])

  const columns: ColumnDef<Faculty>[] = [
    {
      accessorKey: 'code',
      header: 'Code',
      cell: ({ row }) => (
        <Badge variant="outline" className="border-primary/20 text-primary">
          {row.getValue('code')}
        </Badge>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Faculty Name',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-clash/20 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="font-medium text-foreground">{row.getValue('name')}</div>
            {row.original.deanName && <div className="text-xs text-muted-foreground">Dean: {row.original.deanName}</div>}
          </div>
        </div>
      ),
    },
    {
      accessorKey: '_count.departments',
      header: 'Departments',
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Users className="w-4 h-4" />
          <span>{row.original._count?.departments || 0} departments</span>
        </div>
      ),
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => <StatusBadge isActive={row.getValue('isActive')} />,
    },
    createActionsColumn<Faculty>({
      onEdit: openEditDialog,
      onDelete: (item) => handleDelete(item.id),
    }),
  ]

  if (!['SA', 'IA'].includes(session?.user?.role || '')) {
    return <AccessDenied message="Access denied. Admin role required." />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Faculties"
        description="Manage faculties within your institution"
        actionLabel="Add Faculty"
        onAction={openCreateDialog}
        onRefresh={fetchData}
        loading={loading}
      />

      <Card className="bg-foreground/5 border-foreground/10 backdrop-blur-sm">
        <CardContent className="pt-6">
          {loading ? (
            <LoadingSpinner className="text-primary" />
          ) : (
            <DataTable columns={columns} data={faculties} searchKey="name" searchPlaceholder="Search faculties..." />
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-muted border-foreground/10 text-foreground">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Faculty' : 'Add New Faculty'}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {editingItem ? 'Update faculty details' : 'Create a new faculty'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Faculty Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-foreground/5 border-foreground/10 text-foreground"
                  placeholder="e.g., Faculty of Applied Sciences"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Code</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="bg-foreground/5 border-foreground/10 text-foreground"
                  placeholder="e.g., FAS"
                  maxLength={10}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Dean&apos;s Name</Label>
              <Input
                value={formData.deanName}
                onChange={(e) => setFormData({ ...formData, deanName: e.target.value })}
                className="bg-foreground/5 border-foreground/10 text-foreground"
                placeholder="e.g., Prof. John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Description</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-foreground/5 border-foreground/10 text-foreground"
                placeholder="Optional description"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-foreground/10 text-muted-foreground">
              Cancel
            </Button>
            <Button onClick={() => handleSave(formData, editingItem?.id)} disabled={saving} className="bg-gradient-to-r from-primary to-clash">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {editingItem ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
