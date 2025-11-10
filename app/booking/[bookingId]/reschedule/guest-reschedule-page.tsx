'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { format, addDays, startOfDay } from 'date-fns'
import { Calendar, Clock, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BookingWithRelations, bookingService } from '@/services/booking-service'
import { availabilityService } from '@/services/availability-service'

interface TimeSlot {
  startTime: string
  endTime: string
}

export default function GuestReschedulePage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const bookingId = params.bookingId as string
  const token = searchParams.get('token')

  const [booking, setBooking] = useState<BookingWithRelations | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [rescheduling, setRescheduling] = useState(false)
  const [success, setSuccess] = useState(false)

  // Generate next 14 days for date selection
  const availableDates = Array.from({ length: 14 }, (_, i) => addDays(startOfDay(new Date()), i))

  // Fetch booking by token
  useEffect(() => {
    const fetchBooking = async () => {
      if (!token) {
        setError('Invalid or missing token')
        setLoading(false)
        return
      }

      try {
        const result = await bookingService.getBookingByToken(token, 'reschedule')

        if (result.success && result.data) {
          setBooking(result.data)
        } else {
          setError(result.error || 'Failed to load booking')
        }
      } catch (err) {
        setError('An unexpected error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchBooking()
  }, [token])

  // Fetch available slots when date changes
  useEffect(() => {
    if (!booking) return

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
        }
      } catch (err) {
        setAvailableSlots([])
      } finally {
        setLoadingSlots(false)
      }
    }

    fetchSlots()
  }, [selectedDate, booking])

  const handleReschedule = async () => {
    if (!selectedSlot || !booking) return

    setRescheduling(true)

    try {
      const result = await bookingService.rescheduleBooking(booking.id, {
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
      })

      if (result.success) {
        setSuccess(true)
        setBooking(result.data!)
      } else {
        setError(result.error || 'Failed to reschedule booking')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setRescheduling(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <CardTitle>Unable to Reschedule</CardTitle>
                <CardDescription>{error}</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (success && booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardHeader>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <CardTitle>Booking Rescheduled!</CardTitle>
                <CardDescription>Your meeting has been successfully rescheduled</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">{booking.eventType.title}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span>{format(new Date(booking.startTime), 'EEEE, MMMM d, yyyy')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span>
                    {format(new Date(booking.startTime), 'h:mm a')} -{' '}
                    {format(new Date(booking.endTime), 'h:mm a')}
                  </span>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              A confirmation email has been sent to <strong>{booking.guestEmail}</strong> with the
              updated meeting details.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!booking) return null

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Reschedule Your Booking</CardTitle>
            <CardDescription>
              Select a new date and time for your meeting with {booking.eventType.user.name || 'Host'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Current Booking Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-sm text-gray-700 mb-2">Current Booking</h3>
              <div className="space-y-1">
                <p className="font-medium">{booking.eventType.title}</p>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span>{format(new Date(booking.startTime), 'EEEE, MMMM d, yyyy')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span>
                    {format(new Date(booking.startTime), 'h:mm a')} -{' '}
                    {format(new Date(booking.endTime), 'h:mm a')}
                  </span>
                </div>
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
              <Button
                onClick={handleReschedule}
                className="flex-1"
                disabled={!selectedSlot || rescheduling}
              >
                {rescheduling ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Rescheduling...
                  </>
                ) : (
                  'Confirm Reschedule'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
