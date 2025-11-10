'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EventTypeStats } from '@/services/analytics-service'
import { Badge } from '@/components/ui/badge'

interface EventTypePerformanceProps {
  data: EventTypeStats[]
  title?: string
}

export function EventTypePerformance({
  data,
  title = 'Event Type Performance',
}: EventTypePerformanceProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            No event type data available
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((eventType) => (
            <div
              key={eventType.eventTypeId}
              className="border rounded-lg p-4 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold">{eventType.eventTypeName}</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {eventType.totalBookings} total bookings
                  </p>
                </div>
                <Badge variant="secondary">
                  {eventType.conversionRate}% conversion
                </Badge>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Confirmed</p>
                  <p className="font-medium text-green-600">
                    {eventType.confirmedBookings}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Cancelled</p>
                  <p className="font-medium text-red-600">
                    {eventType.cancelledBookings}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Avg Lead Time</p>
                  <p className="font-medium">
                    {Math.round(eventType.averageLeadTime)}h
                  </p>
                </div>
                {eventType.revenue !== undefined && (
                  <div>
                    <p className="text-muted-foreground">Revenue</p>
                    <p className="font-medium">
                      ${eventType.revenue.toFixed(2)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
