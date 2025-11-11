import { Booking, EventType, User, Payment, Reminder } from '@prisma/client'

export type BookingWithRelations = Booking & {
  eventType: EventType
  user: User
  payment?: Payment | null
  reminders: Reminder[]
}

export type CreateBookingData = {
  eventTypeId: string
  guestName: string
  guestEmail: string
  guestPhone?: string
  guestTimezone: string
  startTime: Date
  endTime: Date
  customResponses?: Record<string, any>
  location?: string
}

export type UpdateBookingData = {
  startTime?: Date
  endTime?: Date
  status?: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW'
  cancellationReason?: string
  location?: string
}
