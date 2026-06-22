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
import { Building2, Users, MoreHorizontal, Pencil, Trash2, Loader2 } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'
import { Alert, AlertDescription } from '@/components/ui/alert'

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
  const { toast } = useToast()
  const [faculties, setFaculties] = useState<Faculty[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingFaculty, setEditingFaculty] = useState<Faculty | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    deanName: '',
  })
  const [saving, setSaving] = useState(false)

  const fetchFaculties = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/faculties')
      if (res.ok) {
        const data = await res.json()
        setFaculties(data)
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to fetch faculties', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    if (!session?.user) return
    if (session.user.role === 'ST' || session.user.role === 'LC') {
      router.push('/dashboard')
      return
    }
    fetchFaculties()
  }, [session, router, fetchFaculties])

  const handleOpenDialog = (faculty?: Faculty) => {
    if (faculty) {
      setEditingFaculty(faculty)
      setFormData({
        name: faculty.name,
        code: faculty.code,
        description: faculty.description || '',
        deanName: faculty.deanName || '',
      })
    } else {
      setEditingFaculty(null)
      setFormData({ name: '', code: '', description: '', deanName: '' })
    }
    setDialogOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const url = editingFaculty ? `/api/faculties/${editingFaculty.id}` : '/api/faculties'
      const method = editingFaculty ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        toast({ title: 'Success', description: `Faculty ${editingFaculty ? 'updated' : 'created'} successfully` })
        setDialogOpen(false)
        fetchFaculties()
      } else {
        const error = await res.json()
        toast({ title: 'Error', description: error.error || 'Failed to save faculty', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'An error occurred', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this faculty?')) return
    try {
      const res = await fetch(`/api/faculties/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'Success', description: 'Faculty deleted' })
        fetchFaculties()
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete faculty', variant: 'destructive' })
    }
  }

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
            <DropdownMenuItem onClick={() => handleOpenDialog(row.original)} className="text-muted-foreground focus:text-foreground">
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDelete(row.original.id)} className="text-clash">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  if (!['SA', 'IA'].includes(session?.user?.role || '')) {
    return (
      <Alert className="bg-clash/10 border-clash/20">
        <AlertDescription className="text-clash">Access denied. Admin role required.</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Faculties"
        description="Manage faculties within your institution"
        actionLabel="Add Faculty"
        onAction={() => handleOpenDialog()}
        onRefresh={fetchFaculties}
        loading={loading}
      />

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <DataTable columns={columns} data={faculties} searchKey="name" searchPlaceholder="Search faculties..." />
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-muted border-foreground/10 text-foreground">
          <DialogHeader>
            <DialogTitle>{editingFaculty ? 'Edit Faculty' : 'Add New Faculty'}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {editingFaculty ? 'Update faculty details' : 'Create a new faculty'}
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
              <Label className="text-muted-foreground">Dean's Name</Label>
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
            <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-primary to-clash">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {editingFaculty ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
