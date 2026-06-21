'use client'

import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'

interface ActionItem<T> {
  label: string
  icon: React.ReactNode
  onClick: (item: T) => void
  className?: string
}

interface ActionsDropdownProps<T> {
  item: T
  onEdit?: (item: T) => void
  onDelete?: (item: T & { id: string }) => void
  extraActions?: ActionItem<T>[]
}

export function ActionsDropdown<T extends { id: string }>({
  item,
  onEdit,
  onDelete,
  extraActions,
}: ActionsDropdownProps<T>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground">
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-muted border-foreground/10">
        {extraActions?.map((action, i) => (
          <DropdownMenuItem key={i} onClick={() => action.onClick(item)} className={action.className || 'text-muted-foreground'}>
            {action.icon}
            {action.label}
          </DropdownMenuItem>
        ))}
        {onEdit && (
          <DropdownMenuItem onClick={() => onEdit(item)} className="text-muted-foreground">
            <Pencil className="w-4 h-4 mr-2" /> Edit
          </DropdownMenuItem>
        )}
        {onDelete && (
          <DropdownMenuItem onClick={() => onDelete(item)} className="text-clash">
            <Trash2 className="w-4 h-4 mr-2" /> Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function createActionsColumn<T extends { id: string }>(options: {
  onEdit?: (item: T) => void
  onDelete?: (item: T) => void
  extraActions?: ActionItem<T>[]
}): ColumnDef<T> {
  return {
    id: 'actions',
    cell: ({ row }) => (
      <ActionsDropdown
        item={row.original}
        onEdit={options.onEdit}
        onDelete={options.onDelete ? (item) => options.onDelete!(item) : undefined}
        extraActions={options.extraActions}
      />
    ),
  }
}
