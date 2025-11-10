import { analyticsService, DateRange } from './analytics-service'

export type ExportFormat = 'csv' | 'json'

export interface ExportOptions {
  userId: string
  dateRange: DateRange
  format: ExportFormat
  includePayments?: boolean
}

export const exportService = {
  /**
   * Convert data to CSV format
   */
  convertToCSV(data: Array<Record<string, any>>): string {
    if (data.length === 0) {
      return ''
    }

    // Get headers from first object
    const headers = Object.keys(data[0])
    const csvHeaders = headers.join(',')

    // Convert rows
    const csvRows = data.map((row) => {
      return headers
        .map((header) => {
          const value = row[header]
          // Escape values that contain commas or quotes
          if (
            typeof value === 'string' &&
            (value.includes(',') || value.includes('"') || value.includes('\n'))
          ) {
            return `"${value.replace(/"/g, '""')}"`
          }
          return value ?? ''
        })
        .join(',')
    })

    return [csvHeaders, ...csvRows].join('\n')
  },

  /**
   * Export booking data
   */
  async exportBookings(options: ExportOptions): Promise<string> {
    const { userId, dateRange, format } = options

    const data = await analyticsService.exportBookingData(userId, dateRange)

    if (format === 'csv') {
      return this.convertToCSV(data)
    } else {
      return JSON.stringify(data, null, 2)
    }
  },

  /**
   * Download file in browser
   */
  downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  },

  /**
   * Export and download bookings
   */
  async exportAndDownload(options: ExportOptions): Promise<void> {
    const { format } = options
    const content = await this.exportBookings(options)

    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `bookings-export-${timestamp}.${format}`
    const mimeType = format === 'csv' ? 'text/csv' : 'application/json'

    this.downloadFile(content, filename, mimeType)
  },

  /**
   * Generate export for large datasets (background processing)
   * This would typically be handled by a background job queue
   */
  async generateLargeExport(options: ExportOptions): Promise<string> {
    // For now, this is the same as regular export
    // In production, this would create a background job and return a job ID
    return this.exportBookings(options)
  },
}
