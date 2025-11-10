'use client'

import { useState } from 'react'
import { EventTypeWithRelations } from '@/services/event-type-service'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Clock, MapPin, Video, Phone, Calendar } from 'lucide-react'
import TimeSlotPicker from './TimeSlotPicker'
import TimezoneSelector from './TimezoneSelector'
import BookingForm from './BookingForm'

interface BookingPageProps {
  eventType: EventTypeWithRelations & {
    user: {
      id: string
      username: string
      name: string | null
      avatarUrl: string | null
      timezone: string
      brandColor: string | null
      logoUrl: string | null
    }
  }
}

export default function BookingPage({ eventType }: BookingPageProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedSlot, setSelectedSlot] = useState<{ startTime: string; endTime: string } | null>(null)
  const [guestTimezone, setGuestTimezone] = useState<string>(
    Intl.DateTimeFormat().resolvedOptions().timeZone
  )

  const getLocationIcon = () => {
    switch (eventType.locationType) {
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

  const getLocationLabel = () => {
    switch (eventType.locationType) {
      case 'VIDEO_ZOOM':
        return 'Zoom Meeting'
      case 'VIDEO_GOOGLE_MEET':
        return 'Google Meet'
      case 'VIDEO_TEAMS':
        return 'Microsoft Teams'
      case 'PHONE':
        return 'Phone Call'
      case 'IN_PERSON':
        return eventType.locationDetails || 'In Person'
      case 'CUSTOM':
        return eventType.locationDetails || 'Custom Location'
      default:
        return 'Location TBD'
    }
  }

  const handleSlotSelect = (slot: { startTime: string; endTime: string }) => {
    setSelectedSlot(slot)
  }

  const handleBack = () => {
    setSelectedSlot(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Event Details */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3 mb-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={eventType.user.avatarUrl || undefined} />
                    <AvatarFallback>
                      {eventType.user.name
                        ?.split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase() || eventType.user.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm text-gray-600">{eventType.user.name || eventType.user.username}</p>
                  </div>
                </div>
                <CardTitle className="text-2xl">{eventType.title}</CardTitle>
                {eventType.description && <CardDescription className="mt-2">{eventType.description}</CardDescription>}
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>{eventType.duration} minutes</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  {getLocationIcon()}
                  <span>{getLocationLabel()}</span>
                </div>
                {eventType.price && (
                  <div className="mt-4">
                    <Badge variant="secondary" className="text-base">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: eventType.currency || 'USD',
                      }).format(Number(eventType.price))}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Booking Interface */}
          <div className="lg:col-span-2">
            {!selectedSlot ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Select a Date & Time
                  </CardTitle>
                  <div className="mt-4">
                    <TimezoneSelector value={guestTimezone} onChange={setGuestTimezone} />
                  </div>
                </CardHeader>
                <CardContent>
                  <TimeSlotPicker
                    userId={eventType.userId}
                    eventTypeId={eventType.id}
                    duration={eventType.duration}
                    timezone={guestTimezone}
                    selectedDate={selectedDate}
                    onDateSelect={setSelectedDate}
                    onSlotSelect={handleSlotSelect}
                    minimumNotice={eventType.minimumNotice}
                    maxBookingWindow={eventType.maxBookingWindow}
                  />
                </CardContent>
              </Card>
            ) : (
              <BookingForm
                eventType={eventType}
                selectedSlot={selectedSlot}
                guestTimezone={guestTimezone}
                onBack={handleBack}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
