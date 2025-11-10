'use client'

import { Card } from '@/components/ui/card'
import { WeeklySchedule } from '@/services/availability-service'
import { format, addDays, startOfWeek } from 'date-fns'

interface AvailabilityPreviewProps {
  schedule: WeeklySchedule[]
  weekStart?: number
}

const DAYS = [
  { value: 0, label: 'Sunday', short: 'Sun' },
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
]

export function AvailabilityPreview({ schedule, weekStart = 0 }: AvailabilityPreviewProps) {
  // Reorder days based on week start
  const orderedDays = [...DAYS.slice(weekStart), ...DAYS.slice(0, weekStart)]

  // Group schedule by day
  const scheduleByDay = schedule.reduce((acc, item) => {
    if (!acc[item.dayOfWeek]) {
      acc[item.dayOfWeek] = []
    }
    acc[item.dayOfWeek].push(item)
    return acc
  }, {} as Record<number, WeeklySchedule[]>)

  // Get current week dates for display
  const today = new Date()
  const weekStartDate = startOfWeek(today, { weekStartsOn: weekStart as 0 | 1 | 2 | 3 | 4 | 5 | 6 })

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">Availability Preview</h3>
        <p className="text-sm text-muted-foreground">
          This is how your availability looks for the current week
        </p>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {orderedDays.map((day, index) => {
          const daySchedule = scheduleByDay[day.value] || []
          const isAvailable = daySchedule.length > 0
          const dayDate = addDays(weekStartDate, index)

          return (
            <Card
              key={day.value}
              className={`p-3 ${isAvailable ? 'bg-primary/5 border-primary/20' : 'bg-muted/50'}`}
            >
              <div className="space-y-2">
                <div className="text-center">
                  <div className="text-xs font-medium text-muted-foreground">{day.short}</div>
                  <div className="text-lg font-semibold">{format(dayDate, 'd')}</div>
                </div>

                {isAvailable ? (
                  <div className="space-y-1">
                    {daySchedule.map((slot, slotIndex) => (
                      <div
                        key={slotIndex}
                        className="text-xs text-center bg-primary/10 rounded px-1 py-0.5"
                      >
                        {slot.startTime}
                        <br />
                        {slot.endTime}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-center text-muted-foreground">Unavailable</div>
                )}
              </div>
            </Card>
          )
        })}
      </div>

      <Card className="p-4 bg-muted/50">
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Summary</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Available days:</span>{' '}
              <span className="font-medium">
                {Object.keys(scheduleByDay).length} / 7
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Total hours:</span>{' '}
              <span className="font-medium">
                {schedule.reduce((total, slot) => {
                  const [startHour, startMinute] = slot.startTime.split(':').map(Number)
                  const [endHour, endMinute] = slot.endTime.split(':').map(Number)
                  const hours = endHour - startHour + (endMinute - startMinute) / 60
                  return total + hours
                }, 0).toFixed(1)}{' '}
                hrs/week
              </span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
