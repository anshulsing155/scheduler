'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { exportService, ExportFormat } from '@/services/export-service'
import { DateRange } from '@/services/analytics-service'
import { subDays, startOfMonth, endOfMonth, subMonths, format } from 'date-fns'

interface ExportDialogProps {
  userId: string
  trigger?: React.ReactNode
}

type DateRangePreset = 'last7days' | 'last30days' | 'thisMonth' | 'lastMonth' | 'last90days'

export function ExportDialog({ userId, trigger }: ExportDialogProps) {
  const [open, setOpen] = useState(false)
  const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>('last30days')
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv')
  const [isExporting, setIsExporting] = useState(false)

  const getDateRangeFromPreset = (preset: DateRangePreset): DateRange => {
    const now = new Date()
    
    switch (preset) {
      case 'last7days':
        return { startDate: subDays(now, 7), endDate: now }
      case 'last30days':
        return { startDate: subDays(now, 30), endDate: now }
      case 'last90days':
        return { startDate: subDays(now, 90), endDate: now }
      case 'thisMonth':
        return { startDate: startOfMonth(now), endDate: endOfMonth(now) }
      case 'lastMonth':
        const lastMonth = subMonths(now, 1)
        return { startDate: startOfMonth(lastMonth), endDate: endOfMonth(lastMonth) }
      default:
        return { startDate: subDays(now, 30), endDate: now }
    }
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const dateRange = getDateRangeFromPreset(dateRangePreset)
      
      await exportService.exportAndDownload({
        userId,
        dateRange,
        format: exportFormat,
      })

      setOpen(false)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Failed to export data. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const dateRange = getDateRangeFromPreset(dateRangePreset)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline">Export Data</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Export Booking Data</DialogTitle>
          <DialogDescription>
            Download your booking data in CSV or JSON format
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="date-range">Date Range</Label>
            <Select
              value={dateRangePreset}
              onValueChange={(value) => setDateRangePreset(value as DateRangePreset)}
            >
              <SelectTrigger id="date-range">
                <SelectValue placeholder="Select date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last7days">Last 7 days</SelectItem>
                <SelectItem value="last30days">Last 30 days</SelectItem>
                <SelectItem value="last90days">Last 90 days</SelectItem>
                <SelectItem value="thisMonth">This month</SelectItem>
                <SelectItem value="lastMonth">Last month</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {format(dateRange.startDate, 'MMM dd, yyyy')} -{' '}
              {format(dateRange.endDate, 'MMM dd, yyyy')}
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="format">Export Format</Label>
            <Select
              value={exportFormat}
              onValueChange={(value) => setExportFormat(value as ExportFormat)}
            >
              <SelectTrigger id="format">
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV (Spreadsheet)</SelectItem>
                <SelectItem value="json">JSON (Developer)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {exportFormat === 'csv'
                ? 'Compatible with Excel, Google Sheets, etc.'
                : 'Structured data format for developers'}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? 'Exporting...' : 'Export'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
