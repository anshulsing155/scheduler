'use client'

import type { Booking, EventType, User, Payment, Reminder, BookingStatus } from '@prisma/client'

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
  startTime: string
  endTime: string
  customResponses?: Record<string, any>
  notes?: string
}

export type RescheduleBookingData = {
  startTime: string
  endTime: string
}

export type CancelBookingData = {
  reason?: string
}

/**
 * Client-side booking service
 * Makes API calls to server endpoints
 */
export const bookingService = {
  /**
   * Create a new booking
   */
  async createBooking(data: CreateBookingData) {
    const response = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create booking')
    }

    return response.json()
  },

  /**
   * Get booking by ID
   */
  async getBooking(bookingId: string): Promise<BookingWithRelations> {
    const response = await fetch(`/api/bookings/${bookingId}`)

    if (!response.ok) {
      throw new Error('Failed to fetch booking')
    }

    const data = await response.json()
    return data.booking
  },

  /**
   * Reschedule a booking
   */
  async rescheduleBooking(bookingId: string, data: RescheduleBookingData) {
    const response = await fetch(`/api/bookings/${bookingId}/reschedule`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to reschedule booking')
    }

    return response.json()
  },

  /**
   * Cancel a booking
   */
  async cancelBooking(bookingId: string, reason?: string) {
    const response = await fetch(`/api/bookings/${bookingId}/cancel`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to cancel booking')
    }

    return response.json()
  },

  /**
   * Get booking by token (for reschedule/cancel links)
   */
  async getBookingByToken(token: string, type: 'reschedule' | 'cancel'): Promise<BookingWithRelations> {
    const response = await fetch(`/api/bookings/token/${token}?type=${type}`)

    if (!response.ok) {
      throw new Error('Failed to fetch booking')
    }

    const data = await response.json()
    return data.booking
  },
}
