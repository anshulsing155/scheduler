import { requireAuth } from '@/lib/auth/protected-route'
import { serverBookingService } from '@/services/booking-service'
import BookingDashboardClient from './booking-dashboard-client'

export default async function BookingsPage() {
  const user = await requireAuth()

  // Fetch user's bookings
  const bookings = await serverBookingService.getUserBookings(user.id)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BookingDashboardClient bookings={bookings} />
      </div>
    </div>
  )
}
