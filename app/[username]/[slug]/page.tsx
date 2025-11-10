import { notFound } from 'next/navigation'
import { serverEventTypeService } from '@/services/event-type-service'
import BookingPage from '@/components/booking/BookingPage'

interface BookingPageProps {
  params: {
    username: string
    slug: string
  }
}

export default async function PublicBookingPage({ params }: BookingPageProps) {
  const { username, slug } = params

  // Fetch the public event type
  const eventType = await serverEventTypeService.getPublicEventType(username, slug)

  if (!eventType) {
    notFound()
  }

  // Type assertion since getPublicEventType includes user data
  return <BookingPage eventType={eventType as any} />
}
