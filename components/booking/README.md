# Booking Management Components

This directory contains all components related to booking management functionality.

## Components

### BookingDashboard
Main dashboard component for viewing and managing bookings. Features:
- List and calendar views
- Filtering by status (all, upcoming, past, cancelled)
- Search functionality by guest name, email, or event title
- Sorting by date, guest, or event
- Statistics cards showing booking counts

### BookingListItem
Individual booking item component used in the list view. Displays:
- Event title and type
- Guest information
- Date, time, and location
- Booking status badge

### BookingDetailsModal
Modal dialog showing full booking details. Features:
- Complete booking information
- Guest details
- Meeting links and passwords
- Custom question responses
- Actions to reschedule or cancel (for future bookings)

### RescheduleModal
Modal for rescheduling bookings. Features:
- Current booking information
- Date picker for next 14 days
- Available time slots based on host availability
- Real-time availability checking

### CancelModal
Modal for cancelling bookings. Features:
- Booking confirmation details
- Optional cancellation reason input
- Warning about notification to both parties
- Audit trail support

### BookingConfirmation
Confirmation page shown after successful booking. Features:
- Booking details display
- Calendar invite download (.ics file)
- Meeting links and access information
- Reschedule and cancel links

## Guest-Facing Pages

### /booking/[bookingId]/reschedule
Public page for guests to reschedule their bookings using a token. Features:
- Token-based authentication
- Date and time selection
- Availability checking
- Success confirmation

### /booking/[bookingId]/cancel
Public page for guests to cancel their bookings using a token. Features:
- Token-based authentication
- Optional cancellation reason
- Confirmation flow
- Success notification

## API Routes

### GET /api/bookings
Get user's bookings with optional filters (status, date range)

### POST /api/bookings
Create a new booking with double-booking prevention

### GET /api/bookings/[bookingId]
Get a specific booking by ID

### POST /api/bookings/[bookingId]/reschedule
Reschedule a booking to a new time slot

### POST /api/bookings/[bookingId]/cancel
Cancel a booking with optional reason

### GET /api/bookings/token/[token]
Get booking by reschedule or cancel token (for guest access)

## Usage

### Dashboard Page
```tsx
import { serverBookingService } from '@/services/booking-service'
import BookingDashboardClient from './booking-dashboard-client'

export default async function BookingsPage() {
  const user = await requireAuth()
  const bookings = await serverBookingService.getUserBookings(user.id)
  
  return <BookingDashboardClient bookings={bookings} />
}
```

### Client Component
```tsx
'use client'

import BookingDashboard from '@/components/booking/BookingDashboard'

export default function BookingDashboardClient({ bookings }) {
  const router = useRouter()
  
  return (
    <BookingDashboard 
      bookings={bookings} 
      onRefresh={() => router.refresh()} 
    />
  )
}
```

## Requirements Satisfied

This implementation satisfies the following requirements from the design document:

- **Requirement 5.1**: Dashboard displaying all upcoming, past, and cancelled bookings
- **Requirement 5.2**: Users can cancel bookings with automatic notification
- **Requirement 5.3**: Guests can reschedule bookings via unique links
- **Requirement 5.4**: Guests can cancel bookings via unique links
- **Requirement 5.6**: Complete audit log of all booking modifications (via cancellation reasons and database timestamps)

## Features

- ✅ List and calendar views
- ✅ Advanced filtering and search
- ✅ Sorting capabilities
- ✅ Booking details modal
- ✅ Reschedule functionality with availability checking
- ✅ Cancel functionality with reason collection
- ✅ Token-based guest access
- ✅ Real-time availability updates
- ✅ Responsive design
- ✅ Loading states and error handling
- ✅ Toast notifications for user feedback
