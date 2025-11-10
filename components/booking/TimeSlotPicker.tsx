'use client'

import { useState, useEffect } from 'react'
import { format, addDays, startOfDay, isBefore, isAfter, addMinutes } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import { Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface TimeSlotPickerProps {
  userId: string
  eventTypeId: string
  duration: number
  timezone: string
  selectedDate: Date | undefined
  onDateSelect: (date: Date) => void
  onSlotSelect: (slot: { startTime: string; endTime: string }) => void
  minimumNotice: number
  maxBookingWindow: number
}

interface TimeSlot {
  startTime: string
  endTime: string
  available: boolean
}

export default function TimeSlotPicker({
  userId,
  eventTypeId,
  duration,
  timezone,
  selectedDate,
  onDateSelect,
  onSlotSelect,
  minimumNotice,
  maxBookingWindow,
}: TimeSlotPickerProps) {
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Generate available dates for the next maxBookingWindow days
  const generateAvailableDates = () => {
    const dates: Date[] = []
    const now = new Date()
    const minDate = addMinutes(now, minimumNotice)
    const maxDate = addDays(now, maxBookingWindow)

    for (let i = 0; i <= maxBookingWindow; i++) {
      const date = addDays(startOfDay(now), i)
      if (!isBefore(date, startOfDay(minDate)) && !isAfter(date, maxDate)) {
        dates.push(date)
      }
    }

    return dates
  }

  const availableDates = generateAvailableDates()

  // Fetch available slots when date is selected
  useEffect(() => {
    if (!selectedDate) {
      setAvailableSlots([])
      return
    }

    const fetchSlots = async () => {
      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams({
          date: selectedDate.toISOString(),
          duration: duration.toString(),
          timezone,
          eventTypeId,
        })

        const response = await fetch(`/api/availability/${userId}/slots?${params.toString()}`)

        if (!response.ok) {
          throw new Error('Failed to fetch available slots')
        }

        const data = await response.json()
        setAvailableSlots(data.slots || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
        setAvailableSlots([])
      } finally {
        setLoading(false)
      }
    }

    fetchSlots()
  }, [selectedDate, userId, duration, timezone, eventTypeId])

  const formatTimeSlot = (isoString: string) => {
    const date = new Date(isoString)
    const zonedDate = toZonedTime(date, timezone)
    return format(zonedDate, 'h:mm a')
  }

  const handleDateClick = (date: Date) => {
    onDateSelect(date)
  }

  const handleSlotClick = (slot: TimeSlot) => {
    onSlotSelect({
      startTime: slot.startTime,
      endTime: slot.endTime,
    })
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Date Picker */}
      <div>
        <h3 className="text-sm font-medium mb-3">Select a Date</h3>
        <div className="grid grid-cols-2 gap-2">
          {availableDates.slice(0, 14).map((date) => {
            const isSelected = selectedDate && startOfDay(date).getTime() === startOfDay(selectedDate).getTime()
            const isToday = startOfDay(date).getTime() === startOfDay(new Date()).getTime()

            return (
              <Button
                key={date.toISOString()}
                variant={isSelected ? 'default' : 'outline'}
                className={cn('h-auto py-3 flex flex-col items-center', isSelected && 'ring-2 ring-offset-2')}
                onClick={() => handleDateClick(date)}
              >
                <span className="text-xs text-gray-500">{format(date, 'EEE')}</span>
                <span className="text-lg font-semibold">{format(date, 'd')}</span>
                <span className="text-xs">{format(date, 'MMM')}</span>
                {isToday && <span className="text-xs text-blue-600 mt-1">Today</span>}
              </Button>
            )
          })}
        </div>
      </div>

      {/* Time Slot Picker */}
      <div>
        <h3 className="text-sm font-medium mb-3">
          {selectedDate ? `Available Times - ${format(selectedDate, 'MMMM d, yyyy')}` : 'Select a date to see times'}
        </h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {loading && (
            <div className="text-center py-8 text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-sm">Loading available times...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-8 text-red-500">
              <p className="text-sm">{error}</p>
            </div>
          )}

          {!loading && !error && selectedDate && availableSlots.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No available times for this date</p>
            </div>
          )}

          {!loading && !error && availableSlots.length > 0 && (
            <>
              {availableSlots.map((slot, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="w-full justify-center hover:bg-blue-50 hover:border-blue-500"
                  onClick={() => handleSlotClick(slot)}
                >
                  {formatTimeSlot(slot.startTime)}
                </Button>
              ))}
            </>
          )}

          {!selectedDate && (
            <div className="text-center py-8 text-gray-400">
              <Calendar className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Please select a date first</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
