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
import { MapPin, Loader2, Users, Monitor, Snowflake } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { useCrud } from '@/hooks/use-crud'
import { StatusBadge } from '@/components/status-badge'
import { createActionsColumn } from '@/components/actions-column'
import { AccessDenied } from '@/components/access-denied'
import { LoadingSpinner } from '@/components/loading-spinner'

interface Room {
  id: string
  code: string
  name: string
  building?: string
  capacity: number
  type: string
  hasProjector: boolean
  hasAC: boolean
  hasComputers: boolean
  isAccessible: boolean
  isActive: boolean
  institutionId: string
  facultyId?: string
  faculty?: { name: string; code: string }
  createdAt: string
}

interface Faculty {
  id: string
  name: string
  code: string
}

const roomTypes: Record<string, string> = {
  LECTURE_HALL: 'Lecture Hall',
  AUDITORIUM: 'Auditorium',
  CLASSROOM: 'Classroom',
  LABORATORY: 'Laboratory',
  COMPUTER_LAB: 'Computer Lab',
  EXAM_HALL: 'Exam Hall',
  OUTDOOR: 'Outdoor',
}

export default function RoomsPage() {
  const { data: session } = useSession()
  const router = useRouter()

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    building: '',
    capacity: '100',
    type: 'CLASSROOM',
    hasProjector: false,
    hasAC: false,
    hasComputers: false,
    isAccessible: true,
    facultyId: '',
  })

  const handleDialogOpen = useCallback((item: Room | null) => {
    if (item) {
      setFormData({
        code: item.code,
        name: item.name,
        building: item.building || '',
        capacity: item.capacity.toString(),
        type: item.type,
        hasProjector: item.hasProjector,
        hasAC: item.hasAC,
        hasComputers: item.hasComputers,
        isAccessible: item.isAccessible,
        facultyId: item.facultyId || '',
      })
    } else {
      setFormData({
        code: '',
        name: '',
        building: '',
        capacity: '100',
        type: 'CLASSROOM',
        hasProjector: false,
        hasAC: false,
        hasComputers: false,
        isAccessible: true,
        facultyId: '',
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
  } = useCrud<Room>({
    endpoints: [
      { url: '/api/rooms', key: 'rooms' },
      { url: '/api/faculties', key: 'faculties' },
    ],
    resourceName: 'Room',
    apiBasePath: '/api/rooms',
    onDialogOpen: handleDialogOpen,
    transformPayload: (fd) => ({
      ...fd,
      capacity: parseInt(fd.capacity as string),
      facultyId: (fd.facultyId as string) || null,
    }),
  })

  const rooms = (data.rooms || []) as Room[]
  const faculties = (data.faculties || []) as unknown as Faculty[]

  useEffect(() => {
    if (!session?.user) return
    if (session.user.role === 'ST') {
      router.push('/dashboard')
      return
    }
    fetchData()
  }, [session, router, fetchData])

  const columns: ColumnDef<Room>[] = [
    {
      accessorKey: 'code',
      header: 'Code',
      cell: ({ row }) => (
        <Badge variant="outline" className="border-clash/20 text-clash font-mono">
          {row.getValue('code')}
        </Badge>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Room Name',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-clash/20 to-clash/20 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-clash" />
          </div>
          <div>
            <div className="font-medium text-foreground">{row.getValue('name')}</div>
            <div className="text-xs text-muted-foreground">
              {row.original.building || 'No building'} • {row.original.faculty?.code || 'Central'}
            </div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => (
        <Badge variant="secondary" className="bg-foreground/10 text-muted-foreground">
          {roomTypes[row.getValue('type') as string] || row.getValue('type')}
        </Badge>
      ),
    },
    {
      accessorKey: 'capacity',
      header: 'Capacity',
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Users className="w-4 h-4" />
          <span>{row.getValue('capacity')}</span>
        </div>
      ),
    },
    {
      id: 'features',
      header: 'Features',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.original.hasProjector && (
            <div className="w-6 h-6 rounded bg-secondary/10 flex items-center justify-center" title="Projector">
              <Monitor className="w-3 h-3 text-secondary" />
            </div>
          )}
          {row.original.hasAC && (
            <div className="w-6 h-6 rounded bg-secondary/10 flex items-center justify-center" title="AC">
              <Snowflake className="w-3 h-3 text-secondary" />
            </div>
          )}
          {row.original.hasComputers && (
            <Badge className="bg-primary/10 text-primary text-xs">Lab</Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => <StatusBadge isActive={row.getValue('isActive')} />,
    },
    createActionsColumn<Room>({
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
        title="Rooms & Venues"
        description="Manage lecture halls, labs, and exam venues"
        actionLabel="Add Room"
        onAction={openCreateDialog}
        onRefresh={fetchData}
        loading={loading}
      />

      <Card className="bg-foreground/5 border-foreground/10 backdrop-blur-sm">
        <CardContent className="pt-6">
          {loading ? (
            <LoadingSpinner className="text-clash" />
          ) : (
            <DataTable columns={columns} data={rooms} searchKey="name" searchPlaceholder="Search rooms..." />
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-muted border-foreground/10 text-foreground max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Room' : 'Add New Room'}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {editingItem ? 'Update room details' : 'Add a new venue'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Room Code</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="bg-foreground/5 border-foreground/10 text-foreground font-mono"
                  placeholder="e.g., MPH, LT1"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Room Type</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                  <SelectTrigger className="bg-foreground/5 border-foreground/10 text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-muted border-foreground/10">
                    {Object.entries(roomTypes).map(([key, label]) => (
                      <SelectItem key={key} value={key} className="text-foreground">{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Room Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-foreground/5 border-foreground/10 text-foreground"
                placeholder="e.g., Multi-Purpose Hall"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Building</Label>
                <Input
                  value={formData.building}
                  onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                  className="bg-foreground/5 border-foreground/10 text-foreground"
                  placeholder="e.g., Block A"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Capacity</Label>
                <Input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  className="bg-foreground/5 border-foreground/10 text-foreground"
                  placeholder="e.g., 500"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Faculty (Optional - leave empty for central)</Label>
              <Select value={formData.facultyId} onValueChange={(v) => setFormData({ ...formData, facultyId: v })}>
                <SelectTrigger className="bg-foreground/5 border-foreground/10 text-foreground">
                  <SelectValue placeholder="Central / All Faculties" />
                </SelectTrigger>
                <SelectContent className="bg-muted border-foreground/10">
                  <SelectItem value="" className="text-foreground">Central / All Faculties</SelectItem>
                  {faculties.map((f) => (
                    <SelectItem key={f.id} value={f.id} className="text-foreground">{f.name} ({f.code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 gap-4 pt-2">
              <div className="flex items-center justify-between p-3 rounded-lg bg-foreground/5">
                <Label className="text-xs text-muted-foreground">Projector</Label>
                <Switch checked={formData.hasProjector} onCheckedChange={(v) => setFormData({ ...formData, hasProjector: v })} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-foreground/5">
                <Label className="text-xs text-muted-foreground">AC</Label>
                <Switch checked={formData.hasAC} onCheckedChange={(v) => setFormData({ ...formData, hasAC: v })} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-foreground/5">
                <Label className="text-xs text-muted-foreground">Computers</Label>
                <Switch checked={formData.hasComputers} onCheckedChange={(v) => setFormData({ ...formData, hasComputers: v })} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-foreground/5">
                <Label className="text-xs text-muted-foreground">Accessible</Label>
                <Switch checked={formData.isAccessible} onCheckedChange={(v) => setFormData({ ...formData, isAccessible: v })} />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-foreground/10 text-muted-foreground">
              Cancel
            </Button>
            <Button onClick={() => handleSave(formData as unknown as Record<string, unknown>, editingItem?.id)} disabled={saving} className="bg-gradient-to-r from-clash to-clash">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {editingItem ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
