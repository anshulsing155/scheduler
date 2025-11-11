'use client'

import { useRouter } from 'next/navigation'
import { BookingWithRelations } from '@/services/booking-service.client'
import BookingDashboard from '@/components/booking/BookingDashboard'

interface BookingDashboardClientProps {
  bookings: BookingWithRelations[]
}

export default function BookingDashboardClient({ bookings }: BookingDashboardClientProps) {
  const router = useRouter()

  const handleRefresh = () => {
    router.refresh()
  }

  return <BookingDashboard bookings={bookings} onRefresh={handleRefresh} />
}
