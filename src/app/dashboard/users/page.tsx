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
import { Users, MoreHorizontal, Pencil, Trash2, Loader2, Shield, Building2, Calendar, BookOpen, GraduationCap, Mail, Eye, EyeOff } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface User {
  id: string
  email: string
  name: string
  role: string
  isActive: boolean
  lastLoginAt?: string
  institutionId?: string
  facultyId?: string
  institution?: { name: string; shortName: string }
  faculty?: { name: string; code: string }
  createdAt: string
}

interface Institution {
  id: string
  name: string
  shortName: string
}

interface Faculty {
  id: string
  name: string
  code: string
}

const roleLabels: Record<string, { label: string; icon: any; color: string }> = {
  SA: { label: 'Super Admin', icon: Shield, color: 'from-clash to-accent-gold' },
  IA: { label: 'Institution Admin', icon: Building2, color: 'from-secondary to-secondary' },
  TO: { label: 'Timetable Officer', icon: Calendar, color: 'from-primary to-clash' },
  LC: { label: 'Lecturer', icon: BookOpen, color: 'from-success to-success' },
  ST: { label: 'Student', icon: GraduationCap, color: 'from-accent-gold to-accent-gold' },
}

export default function UsersPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [faculties, setFaculties] = useState<Faculty[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'IA',
    institutionId: '',
    facultyId: '',
  })
  const [saving, setSaving] = useState(false)
  const [showNewUserPassword, setShowNewUserPassword] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [userRes, instRes, facRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/institutions'),
        fetch('/api/faculties'),
      ])
      if (userRes.ok) setUsers(await userRes.json())
      if (instRes.ok) setInstitutions(await instRes.json())
      if (facRes.ok) setFaculties(await facRes.json())
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to fetch data', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    if (!session?.user) return
    if (session.user.role !== 'SA') {
      router.push('/dashboard')
      return
    }
    fetchData()
  }, [session, router, fetchData])

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setEditingUser(user)
      setFormData({
        name: user.name,
        email: user.email,
        password: '',
        role: user.role,
        institutionId: user.institutionId || '',
        facultyId: user.facultyId || '',
      })
    } else {
      setEditingUser(null)
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'IA',
        institutionId: institutions[0]?.id || '',
        facultyId: '',
      })
    }
    setDialogOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users'
      const method = editingUser ? 'PUT' : 'POST'

      const body: any = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        institutionId: formData.institutionId || null,
        facultyId: formData.facultyId || null,
      }

      if (!editingUser && formData.password) {
        body.password = formData.password
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        toast({ title: 'Success', description: `User ${editingUser ? 'updated' : 'created'} successfully` })
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
    if (!confirm('Are you sure you want to delete this user?')) return
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'Success', description: 'User deleted' })
        fetchData()
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' })
    }
  }

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'name',
      header: 'User',
      cell: ({ row }) => {
        const role = roleLabels[row.original.role] || roleLabels.ST
        return (
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${role.color} flex items-center justify-center`}>
              <role.icon className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <div className="font-medium text-foreground">{row.getValue('name')}</div>
              <div className="text-xs text-muted-foreground">{row.original.email}</div>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => {
        const role = roleLabels[row.getValue('role') as string] || roleLabels.ST
        return (
          <Badge className={`bg-gradient-to-r ${role.color} text-white`}>
            {role.label}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'institution',
      header: 'Institution',
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.institution?.shortName || 'Platform'}
        </span>
      ),
    },
    {
      accessorKey: 'lastLoginAt',
      header: 'Last Login',
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {row.original.lastLoginAt
            ? new Date(row.original.lastLoginAt).toLocaleDateString()
            : 'Never'}
        </span>
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

  if (session?.user?.role !== 'SA') {
    return (
      <Alert className="bg-clash/10 border-clash/20">
        <AlertDescription className="text-clash">Access denied. Super Admin role required.</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Manage platform users and their roles"
        actionLabel="Add User"
        onAction={() => handleOpenDialog()}
        onRefresh={fetchData}
        loading={loading}
      />

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-clash" />
            </div>
          ) : (
            <DataTable columns={columns} data={users} searchKey="name" searchPlaceholder="Search users..." />
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-muted border-foreground/10 text-foreground max-w-md">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {editingUser ? 'Update user details' : 'Create a new user account'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Full Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-foreground/5 border-foreground/10 text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-foreground/5 border-foreground/10 text-foreground"
              />
            </div>
            {!editingUser && (
              <div className="space-y-2">
                <Label className="text-muted-foreground">Password</Label>
                <div className="relative">
                  <Input
                    type={showNewUserPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="bg-foreground/5 border-foreground/10 text-foreground pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewUserPassword(!showNewUserPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                    aria-label={showNewUserPassword ? 'Hide password' : 'Show password'}
                  >
                    {showNewUserPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-muted-foreground">Role</Label>
              <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v })}>
                <SelectTrigger className="bg-foreground/5 border-foreground/10 text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-muted border-foreground/10">
                  {Object.entries(roleLabels).map(([key, { label }]) => (
                    <SelectItem key={key} value={key} className="text-foreground">{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {formData.role !== 'SA' && (
              <div className="space-y-2">
                <Label className="text-muted-foreground">Institution</Label>
                <Select value={formData.institutionId} onValueChange={(v) => setFormData({ ...formData, institutionId: v })}>
                  <SelectTrigger className="bg-foreground/5 border-foreground/10 text-foreground">
                    <SelectValue placeholder="Select institution" />
                  </SelectTrigger>
                  <SelectContent className="bg-muted border-foreground/10">
                    {institutions.map((i) => (
                      <SelectItem key={i.id} value={i.id} className="text-foreground">{i.name} ({i.shortName})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-foreground/10 text-muted-foreground">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-clash to-accent-gold">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {editingUser ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
  }
