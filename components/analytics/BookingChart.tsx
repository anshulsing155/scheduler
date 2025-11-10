'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BookingTrend } from '@/services/analytics-service'
import { format, parseISO } from 'date-fns'

interface BookingChartProps {
  data: BookingTrend[]
  title?: string
}

export function BookingChart({ data, title = 'Booking Trends' }: BookingChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            No booking data available for this period
          </div>
        </CardContent>
      </Card>
    )
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {data.map((trend) => {
            const date = parseISO(trend.date)
            const percentage = (trend.count / maxCount) * 100

            return (
              <div key={trend.date} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {format(date, 'MMM dd')}
                  </span>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-muted-foreground">
                      Confirmed: {trend.confirmed}
                    </span>
                    {trend.cancelled > 0 && (
                      <span className="text-xs text-red-600">
                        Cancelled: {trend.cancelled}
                      </span>
                    )}
                    <span className="font-medium">{trend.count}</span>
                  </div>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
