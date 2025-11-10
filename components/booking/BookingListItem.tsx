'use client'

import { format } from 'date-fns'
import { Calendar, Clock, User, Video, Phone, MapPin } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { BookingWithRelations } from '@/services/booking-service'

interface BookingListItemProps {
  booking: BookingWithRelations
  onClick: () => void
}

export default function BookingListItem({ booking, onClick }: BookingListItemProps) {
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
        return <Video className="h-4 w-4" />
      case 'PHONE':
        return <Phone className="h-4 w-4" />
      case 'IN_PERSON':
        return <MapPin className="h-4 w-4" />
      default:
        return <MapPin className="h-4 w-4" />
    }
  }

  const isPast = new Date(booking.startTime) < new Date()

  return (
    <Card
      className={`p-4 cursor-pointer hover:shadow-md transition-shadow ${
        isPast && booking.status !== 'CANCELLED' ? 'opacity-75' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-lg">{booking.eventType.title}</h3>
              <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                <User className="h-4 w-4" />
                <span>{booking.guestName}</span>
                <span className="text-gray-400">•</span>
                <span>{booking.guestEmail}</span>
              </div>
            </div>
            <Badge className={getStatusColor(booking.status)}>{booking.status}</Badge>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{format(new Date(booking.startTime), 'MMM d, yyyy')}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>
                {format(new Date(booking.startTime), 'h:mm a')} -{' '}
                {format(new Date(booking.endTime), 'h:mm a')}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {getLocationIcon()}
              <span>
                {booking.eventType.locationType === 'VIDEO_ZOOM' && 'Zoom'}
                {booking.eventType.locationType === 'VIDEO_GOOGLE_MEET' && 'Google Meet'}
                {booking.eventType.locationType === 'VIDEO_TEAMS' && 'Teams'}
                {booking.eventType.locationType === 'PHONE' && 'Phone'}
                {booking.eventType.locationType === 'IN_PERSON' && 'In Person'}
                {booking.eventType.locationType === 'CUSTOM' && 'Custom'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
