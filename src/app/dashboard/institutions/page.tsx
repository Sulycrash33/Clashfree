'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { DataTable } from '@/components/data-table'
import { PageHeader } from '@/components/page-header'
import { ColumnDef } from '@tanstack/react-table'
import { Building2, MapPin, Users, Calendar, MoreHorizontal, Pencil, Trash2, Eye, Loader2 } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface Institution {
  id: string
  name: string
  shortName: string
  type: string
  city: string
  state: string
  country: string
  currentSession: string
  currentSemester: number
  isActive: boolean
  createdAt: string
  _count?: { users: number; faculties: number }
}

const institutionTypes: Record<string, string> = {
  FEDERAL_UNI: 'Federal University',
  STATE_UNI: 'State University',
  PRIVATE_UNI: 'Private University',
  POLYTECHNIC: 'Polytechnic',
  MONOTECHNIC: 'Monotechnic',
  COLLEGE_OF_EDUCATION: 'College of Education',
  SCHOOL_OF_NURSING: 'School of Nursing',
  HEALTH_TECH: 'Health Technology School',
}

export default function InstitutionsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingInstitution, setEditingInstitution] = useState<Institution | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    shortName: '',
    type: 'STATE_UNI',
    city: '',
    state: '',
    country: 'Nigeria',
    currentSession: '2025/2026',
    currentSemester: '1',
  })
  const [saving, setSaving] = useState(false)

  const fetchInstitutions = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/institutions')
      if (res.ok) {
        const data = await res.json()
        setInstitutions(data)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch institutions',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    if (session?.user?.role !== 'SA') {
      router.push('/dashboard')
      return
    }
    fetchInstitutions()
  }, [session, router, fetchInstitutions])

  const handleOpenDialog = (institution?: Institution) => {
    if (institution) {
      setEditingInstitution(institution)
      setFormData({
        name: institution.name,
        shortName: institution.shortName,
        type: institution.type,
        city: institution.city,
        state: institution.state,
        country: institution.country,
        currentSession: institution.currentSession,
        currentSemester: institution.currentSemester.toString(),
      })
    } else {
      setEditingInstitution(null)
      setFormData({
        name: '',
        shortName: '',
        type: 'STATE_UNI',
        city: '',
        state: '',
        country: 'Nigeria',
        currentSession: '2025/2026',
        currentSemester: '1',
      })
    }
    setDialogOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const url = editingInstitution
        ? `/api/institutions/${editingInstitution.id}`
        : '/api/institutions'
      const method = editingInstitution ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          currentSemester: parseInt(formData.currentSemester),
        }),
      })

      if (res.ok) {
        toast({
          title: 'Success',
          description: `Institution ${editingInstitution ? 'updated' : 'created'} successfully`,
        })
        setDialogOpen(false)
        fetchInstitutions()
      } else {
        const error = await res.json()
        toast({
          title: 'Error',
          description: error.error || 'Failed to save institution',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this institution?')) return

    try {
      const res = await fetch(`/api/institutions/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'Success', description: 'Institution deleted' })
        fetchInstitutions()
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete institution', variant: 'destructive' })
    }
  }

  const columns: ColumnDef<Institution>[] = [
    {
      accessorKey: 'shortName',
      header: 'Code',
      cell: ({ row }) => (
        <Badge variant="outline" className="border-secondary/20 text-secondary">
          {row.getValue('shortName')}
        </Badge>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Institution Name',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-secondary/20 to-secondary/20 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-secondary" />
          </div>
          <div>
            <div className="font-medium text-foreground">{row.getValue('name')}</div>
            <div className="text-xs text-muted-foreground">{row.original._count?.faculties || 0} faculties</div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => (
        <Badge variant="secondary" className="bg-foreground/10 text-muted-foreground">
          {institutionTypes[row.getValue('type') as string] || row.getValue('type')}
        </Badge>
      ),
    },
    {
      accessorKey: 'city',
      header: 'Location',
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="w-4 h-4" />
          {row.getValue('city')}, {row.original.state}
        </div>
      ),
    },
    {
      accessorKey: 'currentSession',
      header: 'Session',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span className="text-foreground">{row.getValue('currentSession')}</span>
          <Badge variant="outline" className="border-foreground/10 text-muted-foreground">
            Sem {row.original.currentSemester}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => (
        <Badge className={row.getValue('isActive') ? 'bg-success/10 text-success border-success/20' : 'bg-clash/10 text-clash border-clash/20'}>
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
            <DropdownMenuItem onClick={() => handleOpenDialog(row.original)} className="text-muted-foreground focus:text-foreground focus:bg-foreground/5">
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDelete(row.original.id)} className="text-clash focus:text-clash focus:bg-clash/10">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
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
        title="Institutions"
        description="Manage all registered tertiary institutions"
        actionLabel="Add Institution"
        onAction={() => handleOpenDialog()}
        onRefresh={fetchInstitutions}
        loading={loading}
      />

      <Card className="bg-foreground/5 border-foreground/10 backdrop-blur-sm">
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-secondary" />
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={institutions}
              searchKey="name"
              searchPlaceholder="Search institutions..."
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-muted border-foreground/10 text-foreground max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingInstitution ? 'Edit Institution' : 'Add New Institution'}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {editingInstitution ? 'Update institution details' : 'Register a new tertiary institution'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Institution Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-foreground/5 border-foreground/10 text-foreground"
                placeholder="e.g., Nasarawa State University, Keffi"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Short Name</Label>
              <Input
                value={formData.shortName}
                onChange={(e) => setFormData({ ...formData, shortName: e.target.value.toUpperCase() })}
                className="bg-foreground/5 border-foreground/10 text-foreground"
                placeholder="e.g., NSUK"
                maxLength={10}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Institution Type</Label>
              <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                <SelectTrigger className="bg-foreground/5 border-foreground/10 text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-muted border-foreground/10">
                  {Object.entries(institutionTypes).map(([key, label]) => (
                    <SelectItem key={key} value={key} className="text-foreground focus:bg-foreground/5">{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Current Session</Label>
              <Input
                value={formData.currentSession}
                onChange={(e) => setFormData({ ...formData, currentSession: e.target.value })}
                className="bg-foreground/5 border-foreground/10 text-foreground"
                placeholder="e.g., 2025/2026"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">City</Label>
              <Input
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="bg-foreground/5 border-foreground/10 text-foreground"
                placeholder="e.g., Keffi"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">State</Label>
              <Input
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="bg-foreground/5 border-foreground/10 text-foreground"
                placeholder="e.g., Nasarawa"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Country</Label>
              <Input
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="bg-foreground/5 border-foreground/10 text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Current Semester</Label>
              <Select value={formData.currentSemester} onValueChange={(v) => setFormData({ ...formData, currentSemester: v })}>
                <SelectTrigger className="bg-foreground/5 border-foreground/10 text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-muted border-foreground/10">
                  <SelectItem value="1" className="text-foreground focus:bg-foreground/5">First Semester</SelectItem>
                  <SelectItem value="2" className="text-foreground focus:bg-foreground/5">Second Semester</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-foreground/10 text-muted-foreground">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-secondary to-secondary">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {editingInstitution ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
