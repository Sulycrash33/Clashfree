'use client'

import { useState, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'

interface FetchEndpoint {
  url: string
  key: string
}

interface UseCrudOptions<T> {
  endpoints: FetchEndpoint[]
  resourceName: string
  apiBasePath: string
  transformPayload?: (formData: Record<string, unknown>) => Record<string, unknown>
  onDialogOpen?: (item: T | null) => void
}

interface UseCrudReturn<T> {
  data: Record<string, T[]>
  loading: boolean
  saving: boolean
  dialogOpen: boolean
  setDialogOpen: (open: boolean) => void
  editingItem: T | null
  fetchData: () => Promise<void>
  handleSave: (formData: Record<string, unknown>, editingId?: string) => Promise<boolean>
  handleDelete: (id: string) => Promise<void>
  openCreateDialog: () => void
  openEditDialog: (item: T) => void
}

export function useCrud<T extends { id: string }>(
  options: UseCrudOptions<T>,
): UseCrudReturn<T> {
  const { endpoints, resourceName, apiBasePath, transformPayload, onDialogOpen } = options
  const { toast } = useToast()

  const initialData: Record<string, T[]> = {}
  for (const ep of endpoints) {
    initialData[ep.key] = []
  }

  const [data, setData] = useState<Record<string, T[]>>(initialData)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<T | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const responses = await Promise.all(
        endpoints.map((ep) => fetch(ep.url)),
      )
      const newData: Record<string, T[]> = {}
      for (let i = 0; i < endpoints.length; i++) {
        if (responses[i].ok) {
          newData[endpoints[i].key] = await responses[i].json()
        }
      }
      setData((prev) => ({ ...prev, ...newData }))
    } catch {
      toast({ title: 'Error', description: 'Failed to fetch data', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [endpoints, toast])

  const handleSave = useCallback(
    async (formData: Record<string, unknown>, editingId?: string): Promise<boolean> => {
      setSaving(true)
      try {
        const url = editingId ? `${apiBasePath}/${editingId}` : apiBasePath
        const method = editingId ? 'PUT' : 'POST'
        const payload = transformPayload ? transformPayload(formData) : formData

        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (res.ok) {
          toast({
            title: 'Success',
            description: `${resourceName} ${editingId ? 'updated' : 'created'} successfully`,
          })
          setDialogOpen(false)
          await fetchData()
          return true
        } else {
          const error = await res.json()
          toast({
            title: 'Error',
            description: error.error || 'Failed to save',
            variant: 'destructive',
          })
          return false
        }
      } catch {
        toast({ title: 'Error', description: 'An error occurred', variant: 'destructive' })
        return false
      } finally {
        setSaving(false)
      }
    },
    [apiBasePath, resourceName, transformPayload, fetchData, toast],
  )

  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm(`Are you sure you want to delete this ${resourceName.toLowerCase()}?`)) return
      try {
        const res = await fetch(`${apiBasePath}/${id}`, { method: 'DELETE' })
        if (res.ok) {
          toast({ title: 'Success', description: `${resourceName} deleted` })
          await fetchData()
        }
      } catch {
        toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' })
      }
    },
    [apiBasePath, resourceName, fetchData, toast],
  )

  const openCreateDialog = useCallback(() => {
    setEditingItem(null)
    onDialogOpen?.(null)
    setDialogOpen(true)
  }, [onDialogOpen])

  const openEditDialog = useCallback((item: T) => {
    setEditingItem(item)
    onDialogOpen?.(item)
    setDialogOpen(true)
  }, [onDialogOpen])

  return {
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
  }
}
