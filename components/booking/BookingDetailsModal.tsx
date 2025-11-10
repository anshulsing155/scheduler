'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import {
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  MapPin,
  Video,
  Globe,
  X,
  ExternalLink,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BookingWithRelations } from '@/services/booking-service'
import RescheduleModal from './RescheduleModal'
import CancelModal from './CancelModal'

interface BookingDetailsModalProps {
  booking: BookingWithRelations
  open: boolean
  onClose: () => void
  onRefresh?: () => void
}

export default function BookingDetailsModal({
  booking,
  open,
  onClose,
  onRefresh,
}: BookingDetailsModalProps) {
  const [showReschedule, setShowReschedule] = useState(false)
  const [showCancel, setShowCancel] = useState(false)

  const formatDateTime = (date: Date, timezone: string) => {
    const zonedDate = toZonedTime(date, timezone)
    return {
      date: format(zonedDate, 'EEEE, MMMM d, yyyy'),
      time: format(zonedDate, 'h:mm a'),
    }
  }

  const startDateTime = formatDateTime(booking.startTime, booking.guestTimezone)
  const endDateTime = formatDateTime(booking.endTime, booking.guestTimezone)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800'
      case 'NO_SHOW':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getLocationIcon = () => {
    switch (booking.eventType.locationType) {
      case 'VIDEO_ZOOM':
      case 'VIDEO_GOOGLE_MEET':
      case 'VIDEO_TEAMS':
        return <Video className="h-5 w-5" />
      case 'PHONE':
        return <Phone className="h-5 w-5" />
      case 'IN_PERSON':
        return <MapPin className="h-5 w-5" />
      default:
        return <MapPin className="h-5 w-5" />
    }
  }

  const getLocationLabel = () => {
    switch (booking.eventType.locationType) {
      case 'VIDEO_ZOOM':
        return 'Zoom Meeting'
      case 'VIDEO_GOOGLE_MEET':
        return 'Google Meet'
      case 'VIDEO_TEAMS':
        return 'Microsoft Teams'
      case 'PHONE':
        return 'Phone Call'
      case 'IN_PERSON':
        return 'In Person'
      case 'CUSTOM':
        return 'Custom Location'
      default:
        return 'Location TBD'
    }
  }

  const canModify = booking.status !== 'CANCELLED' && new Date(booking.startTime) > new Date()

  const handleRescheduleSuccess = () => {
    setShowReschedule(false)
    onRefresh?.()
    onClose()
  }

  const handleCancelSuccess = () => {
    setShowCancel(false)
    onRefresh?.()
    onClose()
  }

  return (
    <>
      <Dialog open={open && !showReschedule && !showCancel} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <DialogTitle className="text-2xl">{booking.eventType.title}</DialogTitle>
                <DialogDescription className="mt-2">
                  with {booking.eventType.user.name || 'Host'}
                </DialogDescription>
              </div>
              <Badge className={getStatusColor(booking.status)}>{booking.status}</Badge>
            </div>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Date & Time */}
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-gray-500 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">{startDateTime.date}</p>
                <p className="text-sm text-gray-600">
                  {startDateTime.time} - {endDateTime.time}
                </p>
              </div>
            </div>

            {/* Duration */}
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-gray-500 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">{booking.eventType.duration} minutes</p>
              </div>
            </div>

            {/* Timezone */}
            <div className="flex items-start gap-3">
              <Globe className="h-5 w-5 text-gray-500 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">{booking.guestTimezone}</p>
              </div>
            </div>

            {/* Location */}
            <div className="flex items-start gap-3">
              {getLocationIcon()}
              <div className="flex-1">
                <p className="font-medium text-gray-900">{getLocationLabel()}</p>
                {booking.meetingLink && (
                  <div className="mt-2 space-y-2">
                    <a
                      href={booking.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                    >
                      Join meeting <ExternalLink className="h-3 w-3" />
                    </a>
                    {booking.meetingPassword && (
                      <p className="text-sm text-gray-600">
                        Password:{' '}
                        <span className="font-mono font-medium bg-gray-100 px-2 py-0.5 rounded">
                          {booking.meetingPassword}
                        </span>
                      </p>
                    )}
                  </div>
                )}
                {!booking.meetingLink && booking.location && (
                  <p className="text-sm text-gray-600 mt-1">{booking.location}</p>
                )}
              </div>
            </div>

            {/* Guest Information */}
            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-900 mb-3">Guest Information</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-gray-500" />
                  <span>{booking.guestName}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span>{booking.guestEmail}</span>
                </div>
                {booking.guestPhone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span>{booking.guestPhone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Custom Responses */}
            {booking.customResponses && Object.keys(booking.customResponses).length > 0 && (
              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-900 mb-3">Additional Information</h3>
                <div className="space-y-2 text-sm">
                  {Object.entries(booking.customResponses).map(([key, value]) => (
                    <div key={key}>
                      <span className="text-gray-600 font-medium">{key}: </span>
                      <span className="text-gray-900">{JSON.stringify(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cancellation Reason */}
            {booking.status === 'CANCELLED' && booking.cancellationReason && (
              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-900 mb-2">Cancellation Reason</h3>
                <p className="text-sm text-gray-600">{booking.cancellationReason}</p>
              </div>
            )}

            {/* Booking Reference */}
            <div className="border-t pt-4">
              <p className="text-xs text-gray-500">Booking Reference: {booking.id}</p>
              <p className="text-xs text-gray-500 mt-1">
                Created: {format(new Date(booking.createdAt), 'MMM d, yyyy h:mm a')}
              </p>
            </div>

            {/* Actions */}
            {canModify && (
              <div className="flex flex-col sm:flex-row gap-2 border-t pt-4">
                <Button onClick={() => setShowReschedule(true)} className="flex-1">
                  Reschedule
                </Button>
                <Button
                  onClick={() => setShowCancel(true)}
                  variant="outline"
                  className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Cancel Booking
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Reschedule Modal */}
      {showReschedule && (
        <RescheduleModal
          booking={booking}
          open={showReschedule}
          onClose={() => setShowReschedule(false)}
          onSuccess={handleRescheduleSuccess}
        />
      )}

      {/* Cancel Modal */}
      {showCancel && (
        <CancelModal
          booking={booking}
          open={showCancel}
          onClose={() => setShowCancel(false)}
          onSuccess={handleCancelSuccess}
        />
      )}
    </>
  )
}
