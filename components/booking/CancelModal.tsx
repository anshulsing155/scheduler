'use client'

import { useState } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { BookingWithRelations, bookingService } from '@/services/booking-service'
import { useToast } from '@/components/ui/use-toast'

interface CancelModalProps {
  booking: BookingWithRelations
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function CancelModal({ booking, open, onClose, onSuccess }: CancelModalProps) {
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleCancel = async () => {
    setLoading(true)

    try {
      const result = await bookingService.cancelBooking(booking.id, {
        reason: reason.trim() || undefined,
      })

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Booking cancelled successfully',
        })
        onSuccess()
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to cancel booking',
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <DialogTitle>Cancel Booking</DialogTitle>
              <DialogDescription>This action cannot be undone</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Booking Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-sm mb-2">{booking.eventType.title}</h3>
            <p className="text-sm text-gray-600">
              with {booking.eventType.user.name || 'Host'}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Guest: {booking.guestName} ({booking.guestEmail})
            </p>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              Both you and the guest will be notified about this cancellation via email.
            </p>
          </div>

          {/* Reason Input */}
          <div className="space-y-2">
            <Label htmlFor="reason">Cancellation Reason (Optional)</Label>
            <Textarea
              id="reason"
              placeholder="Let the guest know why you're cancelling..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              maxLength={500}
              disabled={loading}
            />
            <p className="text-xs text-gray-500">{reason.length}/500 characters</p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 border-t pt-4">
            <Button onClick={onClose} variant="outline" className="flex-1" disabled={loading}>
              Keep Booking
            </Button>
            <Button
              onClick={handleCancel}
              variant="destructive"
              className="flex-1"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                'Cancel Booking'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
