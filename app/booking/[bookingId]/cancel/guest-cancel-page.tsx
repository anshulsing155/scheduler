'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { format } from 'date-fns'
import { Calendar, Clock, Loader2, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { BookingWithRelations, bookingService } from '@/services/booking-service'

export default function GuestCancelPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const bookingId = params.bookingId as string
  const token = searchParams.get('token')

  const [booking, setBooking] = useState<BookingWithRelations | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const [success, setSuccess] = useState(false)

  // Fetch booking by token
  useEffect(() => {
    const fetchBooking = async () => {
      if (!token) {
        setError('Invalid or missing token')
        setLoading(false)
        return
      }

      try {
        const result = await bookingService.getBookingByToken(token, 'cancel')

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

  const handleCancel = async () => {
    if (!booking) return

    setCancelling(true)

    try {
      const result = await bookingService.cancelBooking(booking.id, {
        reason: reason.trim() || undefined,
      })

      if (result.success) {
        setSuccess(true)
      } else {
        setError(result.error || 'Failed to cancel booking')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setCancelling(false)
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
                <CardTitle>Unable to Cancel</CardTitle>
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
                <CardTitle>Booking Cancelled</CardTitle>
                <CardDescription>Your meeting has been successfully cancelled</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">{booking.eventType.title}</h3>
              <p className="text-sm text-gray-600">
                with {booking.eventType.user.name || 'Host'}
              </p>
              <div className="space-y-1 mt-2 text-sm">
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
              A cancellation confirmation has been sent to <strong>{booking.guestEmail}</strong> and
              the host has been notified.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!booking) return null

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <CardTitle>Cancel Your Booking</CardTitle>
                <CardDescription>This action cannot be undone</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Booking Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">{booking.eventType.title}</h3>
              <p className="text-sm text-gray-600 mb-2">
                with {booking.eventType.user.name || 'Host'}
              </p>
              <div className="space-y-1 text-sm">
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

            {/* Warning */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                The host will be notified about this cancellation via email.
              </p>
            </div>

            {/* Reason Input */}
            <div className="space-y-2">
              <Label htmlFor="reason">Cancellation Reason (Optional)</Label>
              <Textarea
                id="reason"
                placeholder="Let the host know why you're cancelling..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                maxLength={500}
                disabled={cancelling}
              />
              <p className="text-xs text-gray-500">{reason.length}/500 characters</p>
            </div>

            {/* Actions */}
            <div className="flex gap-2 border-t pt-4">
              <Button
                onClick={handleCancel}
                variant="destructive"
                className="flex-1"
                disabled={cancelling}
              >
                {cancelling ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  'Cancel Booking'
                )}
              </Button>
            </div>

            <p className="text-xs text-gray-500 text-center">
              Need to reschedule instead?{' '}
              <a
                href={`/booking/${booking.id}/reschedule?token=${booking.rescheduleToken}`}
                className="text-blue-600 hover:underline"
              >
                Reschedule this booking
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
