'use client'

import { format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import { CheckCircle, Calendar, Clock, MapPin, Video, Phone, Mail, User, Globe } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BookingWithRelations } from '@/services/booking-service'

interface BookingConfirmationProps {
  booking: BookingWithRelations
}

export default function BookingConfirmation({ booking }: BookingConfirmationProps) {
  const formatDateTime = (date: Date, timezone: string) => {
    const zonedDate = toZonedTime(date, timezone)
    return {
      date: format(zonedDate, 'EEEE, MMMM d, yyyy'),
      time: format(zonedDate, 'h:mm a'),
      timezone: timezone,
    }
  }

  const startDateTime = formatDateTime(booking.startTime, booking.guestTimezone)
  const endDateTime = formatDateTime(booking.endTime, booking.guestTimezone)

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
        return booking.eventType.locationDetails || 'In Person'
      case 'CUSTOM':
        return booking.eventType.locationDetails || 'Custom Location'
      default:
        return 'Location TBD'
    }
  }

  const addToCalendar = () => {
    // Generate .ics file content
    const startDate = format(booking.startTime, "yyyyMMdd'T'HHmmss'Z'")
    const endDate = format(booking.endTime, "yyyyMMdd'T'HHmmss'Z'")
    const now = format(new Date(), "yyyyMMdd'T'HHmmss'Z'")

    // Build description with video link if available
    let description = `Meeting with ${booking.eventType.user.name || 'host'}`
    if (booking.meetingLink) {
      description += `\\n\\nJoin Meeting: ${booking.meetingLink}`
      if (booking.meetingPassword) {
        description += `\\nPassword: ${booking.meetingPassword}`
      }
    }

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Calendly Scheduler//EN',
      'BEGIN:VEVENT',
      `UID:${booking.id}@scheduler.com`,
      `DTSTAMP:${now}`,
      `DTSTART:${startDate}`,
      `DTEND:${endDate}`,
      `SUMMARY:${booking.eventType.title}`,
      `DESCRIPTION:${description}`,
      `LOCATION:${booking.meetingLink || getLocationLabel()}`,
      `ORGANIZER;CN=${booking.eventType.user.name || 'Host'}:mailto:${booking.eventType.user.email}`,
      `ATTENDEE;CN=${booking.guestName}:mailto:${booking.guestEmail}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')

    // Create blob and download
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
    const link = document.createElement('a')
    link.href = window.URL.createObjectURL(blob)
    link.download = `booking-${booking.id}.ics`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
          <p className="text-lg text-gray-600">
            A confirmation email has been sent to <span className="font-medium">{booking.guestEmail}</span>
          </p>
        </div>

        {/* Booking Details Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">{booking.eventType.title}</CardTitle>
            <CardDescription>
              with {booking.eventType.user.name || 'Host'}
              <Badge variant="secondary" className="ml-2">
                {booking.status}
              </Badge>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
                  <div className="mt-1 space-y-1">
                    <a
                      href={booking.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline block"
                    >
                      Join meeting
                    </a>
                    {booking.meetingPassword && (
                      <p className="text-sm text-gray-600">
                        Password: <span className="font-mono font-medium">{booking.meetingPassword}</span>
                      </p>
                    )}
                  </div>
                )}
                {!booking.meetingLink && booking.location && (
                  <p className="text-sm text-gray-600 mt-1">{booking.location}</p>
                )}
              </div>
            </div>

            {/* Guest Info */}
            <div className="border-t pt-4 mt-4">
              <h3 className="font-semibold text-gray-900 mb-3">Your Information</h3>
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
              <div className="border-t pt-4 mt-4">
                <h3 className="font-semibold text-gray-900 mb-3">Additional Information</h3>
                <div className="space-y-2 text-sm">
                  {Object.entries(booking.customResponses).map(([key, value]) => (
                    <div key={key}>
                      <span className="text-gray-600">{key}: </span>
                      <span className="text-gray-900">{JSON.stringify(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Button onClick={addToCalendar} variant="outline" size="lg" className="w-full">
            <Calendar className="h-4 w-4 mr-2" />
            Add to Calendar
          </Button>
          <Button
            onClick={() => (window.location.href = `/booking/${booking.id}/reschedule?token=${booking.rescheduleToken}`)}
            variant="outline"
            size="lg"
            className="w-full"
          >
            Reschedule
          </Button>
        </div>

        {/* Manage Booking Links */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Manage Your Booking</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-600">
              You can reschedule or cancel this booking using the links sent to your email, or use the buttons above.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => (window.location.href = `/booking/${booking.id}/cancel?token=${booking.cancelToken}`)}
              >
                Cancel Booking
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Booking Reference */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Booking Reference: {booking.id}</p>
        </div>
      </div>
    </div>
  )
}
