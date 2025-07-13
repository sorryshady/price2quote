'use client'

import { useState } from 'react'

import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import {
  type AnalyticsExportData,
  type ExportFormat,
  exportAnalytics,
} from '@/lib/export-utils'

interface ExportDropdownProps {
  data: AnalyticsExportData
  disabled?: boolean
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
}

const exportOptions = [
  {
    format: 'csv' as ExportFormat,
    label: 'CSV File',
    description: 'Comma-separated values for spreadsheet apps',
    icon: FileText,
  },
  {
    format: 'excel' as ExportFormat,
    label: 'Excel File',
    description: 'Microsoft Excel workbook with multiple sheets',
    icon: FileSpreadsheet,
  },
  {
    format: 'pdf' as ExportFormat,
    label: 'PDF Report',
    description: 'Professional formatted report document',
    icon: FileText,
  },
]

export function ExportDropdown({
  data,
  disabled = false,
  variant = 'outline',
  size = 'sm',
}: ExportDropdownProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(
    null,
  )

  const handleExport = async (format: ExportFormat) => {
    if (!data || isExporting) return

    setIsExporting(true)
    setExportingFormat(format)

    try {
      // Add current date and time to the export data
      const exportData = {
        ...data,
        exportedAt: new Date(),
      }

      // Call the export function
      exportAnalytics(exportData, format)

      // Add a small delay to show the loading state
      await new Promise((resolve) => setTimeout(resolve, 1000))
    } catch (error) {
      console.error('Export failed:', error)
      // You might want to show a toast notification here
    } finally {
      setIsExporting(false)
      setExportingFormat(null)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          disabled={disabled || isExporting}
        >
          {isExporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Export
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Export Analytics</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {exportOptions.map((option) => {
          const Icon = option.icon
          const isCurrentlyExporting = exportingFormat === option.format

          return (
            <DropdownMenuItem
              key={option.format}
              onClick={() => handleExport(option.format)}
              disabled={isExporting}
              className="flex flex-col items-start gap-1 p-3"
            >
              <div className="flex items-center gap-2">
                {isCurrentlyExporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
                <span className="font-medium">{option.label}</span>
              </div>
              <span className="text-muted-foreground text-xs">
                {option.description}
              </span>
            </DropdownMenuItem>
          )
        })}
        <DropdownMenuSeparator />
        <div className="px-3 py-2">
          <p className="text-muted-foreground text-xs">
            Reports include summary metrics, revenue analysis, quote
            performance, and client insights for the selected time period.
          </p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
