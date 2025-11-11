'use client'

import { useState, useEffect } from 'react'
import { format, addDays, startOfDay } from 'date-fns'
import { Calendar, Clock, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { BookingWithRelations, bookingService } from '@/services/booking-service.client'
import { availabilityService } from '@/services/availability-service'
import { useToast } from '@/components/ui/use-toast'

interface RescheduleModalProps {
  booking: BookingWithRelations
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

interface TimeSlot {
  startTime: string
  endTime: string
}

export default function RescheduleModal({
  booking,
  open,
  onClose,
  onSuccess,
}: RescheduleModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const { toast } = useToast()

  // Generate next 14 days for date selection
  const availableDates = Array.from({ length: 14 }, (_, i) => addDays(startOfDay(new Date()), i))

  // Fetch available slots when date changes
  useEffect(() => {
    const fetchSlots = async () => {
      setLoadingSlots(true)
      setSelectedSlot(null)

      try {
        const result = await availabilityService.getAvailableSlots(
          booking.userId,
          selectedDate,
          booking.eventType.duration,
          booking.guestTimezone
        )

        if (result.success && result.data) {
          setAvailableSlots(result.data)
        } else {
          setAvailableSlots([])
          toast({
            title: 'Error',
            description: result.error || 'Failed to fetch available slots',
            variant: 'destructive',
          })
        }
      } catch (error) {
        setAvailableSlots([])
        toast({
          title: 'Error',
          description: 'Failed to fetch available slots',
          variant: 'destructive',
        })
      } finally {
        setLoadingSlots(false)
      }
    }

    fetchSlots()
  }, [selectedDate, booking.userId, booking.eventTypeId, toast])

  const handleReschedule = async () => {
    if (!selectedSlot) return

    setLoading(true)

    try {
      const result = await bookingService.rescheduleBooking(booking.id, {
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
      })

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Booking rescheduled successfully',
        })
        onSuccess()
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to reschedule booking',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reschedule Booking</DialogTitle>
          <DialogDescription>
            Select a new date and time for your meeting with {booking.eventType.user.name || 'Host'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Current Booking Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-sm text-gray-700 mb-2">Current Booking</h3>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span>{format(new Date(booking.startTime), 'EEEE, MMMM d, yyyy')}</span>
            </div>
            <div className="flex items-center gap-2 text-sm mt-1">
              <Clock className="h-4 w-4 text-gray-500" />
              <span>
                {format(new Date(booking.startTime), 'h:mm a')} -{' '}
                {format(new Date(booking.endTime), 'h:mm a')}
              </span>
            </div>
          </div>

          {/* Date Selection */}
          <div>
            <h3 className="font-semibold text-sm text-gray-700 mb-3">Select a Date</h3>
            <div className="grid grid-cols-7 gap-2">
              {availableDates.map((date) => {
                const isSelected = format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => setSelectedDate(date)}
                    className={`p-2 rounded-lg border text-center transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white hover:bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="text-xs font-medium">{format(date, 'EEE')}</div>
                    <div className="text-lg font-semibold">{format(date, 'd')}</div>
                    <div className="text-xs">{format(date, 'MMM')}</div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Time Slot Selection */}
          <div>
            <h3 className="font-semibold text-sm text-gray-700 mb-3">
              Available Times on {format(selectedDate, 'MMMM d, yyyy')}
            </h3>

            {loadingSlots ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No available time slots for this date</p>
                <p className="text-sm text-gray-400 mt-1">Please select a different date</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-64 overflow-y-auto">
                {availableSlots.map((slot, index) => {
                  const isSelected = selectedSlot?.startTime === slot.startTime
                  return (
                    <button
                      key={index}
                      onClick={() => setSelectedSlot(slot)}
                      className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white hover:bg-gray-50 border-gray-200'
                      }`}
                    >
                      {format(new Date(slot.startTime), 'h:mm a')}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 border-t pt-4">
            <Button onClick={onClose} variant="outline" className="flex-1" disabled={loading}>
              Cancel
            </Button>
            <Button
              onClick={handleReschedule}
              className="flex-1"
              disabled={!selectedSlot || loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Rescheduling...
                </>
              ) : (
                'Confirm Reschedule'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
