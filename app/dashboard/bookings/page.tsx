import { requireAuth } from '@/lib/auth/protected-route'
import { serverBookingService } from '@/services/booking-service'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import BookingDashboardClient from './booking-dashboard-client'

export default async function BookingsPage() {
  const user = await requireAuth()
  const bookings = await serverBookingService.getUserBookings(user.id)

  return (
    <DashboardLayout userEmail={user.email || undefined}>
      <div className="p-6 lg:p-8">
        <BookingDashboardClient bookings={bookings} />
      </div>
    </DashboardLayout>
  )
}
