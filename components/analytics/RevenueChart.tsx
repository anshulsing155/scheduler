'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RevenueMetrics } from '@/services/analytics-service'

interface RevenueChartProps {
  data: RevenueMetrics
  title?: string
}

export function RevenueChart({ data, title = 'Revenue Analytics' }: RevenueChartProps) {
  const maxRevenue = Math.max(
    ...data.revenueByEventType.map((e) => e.revenue),
    1
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total Revenue</p>
            <p className="text-2xl font-bold">
              {data.currency} {data.totalRevenue.toFixed(2)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Successful</p>
            <p className="text-2xl font-bold text-green-600">
              {data.successfulPayments}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Failed</p>
            <p className="text-2xl font-bold text-red-600">
              {data.failedPayments}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Refunded</p>
            <p className="text-2xl font-bold text-orange-600">
              {data.currency} {data.refundedAmount.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Revenue by Event Type */}
        {data.revenueByEventType.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Revenue by Event Type</h4>
            {data.revenueByEventType.map((eventType) => {
              const percentage = (eventType.revenue / maxRevenue) * 100

              return (
                <div key={eventType.eventTypeId} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">
                      {eventType.eventTypeName}
                    </span>
                    <div className="flex items-center gap-4">
                      <span className="text-muted-foreground">
                        {eventType.bookingCount} bookings
                      </span>
                      <span className="font-semibold">
                        {data.currency} {eventType.revenue.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-600 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {data.revenueByEventType.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            No revenue data available for this period
          </div>
        )}
      </CardContent>
    </Card>
  )
}
