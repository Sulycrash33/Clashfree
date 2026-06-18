'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Download, FileSpreadsheet, FileText, Printer, Loader2 } from 'lucide-react'
import { exportToCSV, exportToExcel, exportToPrint, type TimetableExportData, type ExamSlotExport } from '@/lib/export-utils'

interface ExportButtonsProps {
  data: TimetableExportData
  disabled?: boolean
}

export function ExportButtons({ data, disabled = false }: ExportButtonsProps) {
  const [exporting, setExporting] = useState<string | null>(null)

  const handleExport = async (type: 'csv' | 'excel' | 'print') => {
    setExporting(type)
    
    try {
      // Small delay for UX feedback
      await new Promise(resolve => setTimeout(resolve, 300))
      
      switch (type) {
        case 'csv':
          exportToCSV(data, `exam-timetable-${data.session.replace('/', '-')}-sem${data.semester}`)
          break
        case 'excel':
          exportToExcel(data, `exam-timetable-${data.session.replace('/', '-')}-sem${data.semester}`)
          break
        case 'print':
          exportToPrint(data)
          break
      }
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setExporting(null)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="border-foreground/10 text-muted hover:text-white"
          disabled={disabled || data.slots.length === 0}
        >
          {exporting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Export
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-muted border-foreground/10">
        <DropdownMenuLabel className="text-white">Export Options</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-foreground/10" />
        
        <DropdownMenuItem
          onClick={() => handleExport('excel')}
          disabled={exporting !== null}
          className="text-muted hover:text-white hover:bg-foreground/5 cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4 mr-2 text-success" />
          Export to Excel
        </DropdownMenuItem>
        
        <DropdownMenuItem
          onClick={() => handleExport('csv')}
          disabled={exporting !== null}
          className="text-muted hover:text-white hover:bg-foreground/5 cursor-pointer"
        >
          <FileText className="w-4 h-4 mr-2 text-secondary" />
          Export to CSV
        </DropdownMenuItem>
        
        <DropdownMenuSeparator className="bg-foreground/10" />
        
        <DropdownMenuItem
          onClick={() => handleExport('print')}
          disabled={exporting !== null}
          className="text-muted hover:text-white hover:bg-foreground/5 cursor-pointer"
        >
          <Printer className="w-4 h-4 mr-2 text-primary" />
          Print / PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Standalone export button for simple cases
interface SimpleExportButtonProps {
  onClick: () => void
  label?: string
  disabled?: boolean
  loading?: boolean
  icon?: 'download' | 'print'
}

export function SimpleExportButton({ 
  onClick, 
  label = 'Export', 
  disabled = false, 
  loading = false,
  icon = 'download' 
}: SimpleExportButtonProps) {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      disabled={disabled || loading}
      className="border-foreground/10 text-muted hover:text-white"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : icon === 'print' ? (
        <Printer className="w-4 h-4 mr-2" />
      ) : (
        <Download className="w-4 h-4 mr-2" />
      )}
      {loading ? 'Exporting...' : label}
    </Button>
  )
}
