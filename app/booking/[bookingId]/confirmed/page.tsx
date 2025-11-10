import { notFound } from 'next/navigation'
import { serverBookingService } from '@/services/booking-service'
import BookingConfirmation from '@/components/booking/BookingConfirmation'

interface BookingConfirmationPageProps {
  params: {
    bookingId: string
  }
}

export default async function BookingConfirmationPage({ params }: BookingConfirmationPageProps) {
  const { bookingId } = params

  const booking = await serverBookingService.getBooking(bookingId)

  if (!booking) {
    notFound()
  }

  return <BookingConfirmation booking={booking} />
}
