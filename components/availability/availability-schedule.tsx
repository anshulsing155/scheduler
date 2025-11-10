'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { WeeklySchedule } from '@/services/availability-service'

interface AvailabilityScheduleProps {
  schedule: WeeklySchedule[]
  onChange: (schedule: WeeklySchedule[]) => void
  weekStart?: number // 0 = Sunday, 1 = Monday
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

export function AvailabilitySchedule({
  schedule,
  onChange,
  weekStart = 0,
}: AvailabilityScheduleProps) {
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

  const handleDayToggle = (dayOfWeek: number, enabled: boolean) => {
    if (enabled) {
      // Add default time slot for the day
      const newSchedule = [
        ...schedule,
        {
          dayOfWeek,
          startTime: '09:00',
          endTime: '17:00',
        },
      ]
      onChange(newSchedule)
    } else {
      // Remove all time slots for the day
      const newSchedule = schedule.filter((item) => item.dayOfWeek !== dayOfWeek)
      onChange(newSchedule)
    }
  }

  const handleTimeChange = (
    dayOfWeek: number,
    index: number,
    field: 'startTime' | 'endTime',
    value: string
  ) => {
    const daySchedule = scheduleByDay[dayOfWeek] || []
    const updatedSlot = { ...daySchedule[index], [field]: value }

    const newSchedule = schedule.map((item) => {
      if (
        item.dayOfWeek === dayOfWeek &&
        item.startTime === daySchedule[index].startTime &&
        item.endTime === daySchedule[index].endTime
      ) {
        return updatedSlot
      }
      return item
    })

    onChange(newSchedule)
  }

  const handleAddTimeSlot = (dayOfWeek: number) => {
    const daySchedule = scheduleByDay[dayOfWeek] || []
    const lastSlot = daySchedule[daySchedule.length - 1]

    // Add a new slot after the last one
    const newSlot: WeeklySchedule = {
      dayOfWeek,
      startTime: lastSlot?.endTime || '09:00',
      endTime: '17:00',
    }

    onChange([...schedule, newSlot])
  }

  const handleRemoveTimeSlot = (dayOfWeek: number, index: number) => {
    const daySchedule = scheduleByDay[dayOfWeek] || []
    const slotToRemove = daySchedule[index]

    const newSchedule = schedule.filter(
      (item) =>
        !(
          item.dayOfWeek === dayOfWeek &&
          item.startTime === slotToRemove.startTime &&
          item.endTime === slotToRemove.endTime
        )
    )

    onChange(newSchedule)
  }

  const handleCopyToAll = (dayOfWeek: number) => {
    const daySchedule = scheduleByDay[dayOfWeek] || []

    if (daySchedule.length === 0) return

    // Remove all existing schedules
    const newSchedule: WeeklySchedule[] = []

    // Copy the schedule to all days
    DAYS.forEach((day) => {
      daySchedule.forEach((slot) => {
        newSchedule.push({
          dayOfWeek: day.value,
          startTime: slot.startTime,
          endTime: slot.endTime,
        })
      })
    })

    onChange(newSchedule)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Weekly Hours</h3>
      </div>

      <div className="space-y-2">
        {orderedDays.map((day) => {
          const daySchedule = scheduleByDay[day.value] || []
          const isEnabled = daySchedule.length > 0

          return (
            <Card key={day.value} className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={(checked: boolean) => handleDayToggle(day.value, checked)}
                    />
                    <Label className="text-base font-medium">{day.label}</Label>
                  </div>

                  {isEnabled && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyToAll(day.value)}
                    >
                      Copy to all
                    </Button>
                  )}
                </div>

                {isEnabled && (
                  <div className="ml-11 space-y-2">
                    {daySchedule.map((slot, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          type="time"
                          value={slot.startTime}
                          onChange={(e) =>
                            handleTimeChange(day.value, index, 'startTime', e.target.value)
                          }
                          className="w-32"
                        />
                        <span className="text-muted-foreground">to</span>
                        <Input
                          type="time"
                          value={slot.endTime}
                          onChange={(e) =>
                            handleTimeChange(day.value, index, 'endTime', e.target.value)
                          }
                          className="w-32"
                        />

                        {daySchedule.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveTimeSlot(day.value, index)}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    ))}

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddTimeSlot(day.value)}
                    >
                      Add hours
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
