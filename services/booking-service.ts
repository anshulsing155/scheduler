import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { BookingStatus } from '@prisma/client'
import { addMinutes } from 'date-fns'
import { videoService, VideoService } from './video-service'
import { notificationService } from './notification-service'

/**
 * Validation Schemas
 */

export const createBookingSchema = z.object({
  eventTypeId: z.string().min(1, 'Event type is required'),
  guestName: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  guestEmail: z.string().email('Invalid email address'),
  guestPhone: z.string().optional(),
  guestTimezone: z.string().min(1, 'Timezone is required'),
  startTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid start time',
  }),
  endTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid end time',
  }),
  customResponses: z.record(z.string(), z.any()).nullable().optional(),
  notes: z.string().max(500, 'Notes are too long').optional(),
})

export const rescheduleBookingSchema = z.object({
  startTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid start time',
  }),
  endTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid end time',
  }),
})

export const cancelBookingSchema = z.object({
  reason: z.string().max(500, 'Reason is too long').optional(),
})

export type CreateBookingData = z.infer<typeof createBookingSchema>
export type RescheduleBookingData = z.infer<typeof rescheduleBookingSchema>
export type CancelBookingData = z.infer<typeof cancelBookingSchema>

export type BookingWithRelations = {
  id: string
  eventTypeId: string
  userId: string
  guestName: string
  guestEmail: string
  guestPhone: string | null
  guestTimezone: string
  customResponses: any
  startTime: Date
  endTime: Date
  status: BookingStatus
  cancellationReason: string | null
  meetingLink: string | null
  meetingPassword: string | null
  location: string | null
  rescheduleToken: string
  cancelToken: string
  paymentId: string | null
  createdAt: Date
  updatedAt: Date
  eventType: {
    id: string
    title: string
    duration: number
    locationType: string
    locationDetails: string | null
    user: {
      id: string
      name: string | null
      email: string
      timezone: string
    }
  }
}

export type ServiceResult<T = any> = {
  success: boolean
  data?: T
  error?: string
}

/**
 * Client-side booking service
 */
export const bookingService = {
  /**
   * Create a new booking
   */
  async createBooking(data: CreateBookingData): Promise<ServiceResult<BookingWithRelations>> {
    try {
      // Validate data
      const validatedData = createBookingSchema.parse(data)

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validatedData),
      })

      if (!response.ok) {
        const error = await response.json()
        return {
          success: false,
          error: error.error || 'Failed to create booking',
        }
      }

      const result = await response.json()

      return {
        success: true,
        data: result.booking,
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: error.issues[0].message,
        }
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      }
    }
  },

  /**
   * Get a booking by ID
   */
  async getBooking(bookingId: string): Promise<ServiceResult<BookingWithRelations>> {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`)

      if (!response.ok) {
        const error = await response.json()
        return {
          success: false,
          error: error.error || 'Failed to fetch booking',
        }
      }

      const result = await response.json()

      return {
        success: true,
        data: result.booking,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      }
    }
  },

  /**
   * Get booking by token (for guest access)
   */
  async getBookingByToken(token: string, type: 'reschedule' | 'cancel'): Promise<ServiceResult<BookingWithRelations>> {
    try {
      const response = await fetch(`/api/bookings/token/${token}?type=${type}`)

      if (!response.ok) {
        const error = await response.json()
        return {
          success: false,
          error: error.error || 'Failed to fetch booking',
        }
      }

      const result = await response.json()

      return {
        success: true,
        data: result.booking,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      }
    }
  },

  /**
   * Reschedule a booking
   */
  async rescheduleBooking(
    bookingId: string,
    data: RescheduleBookingData
  ): Promise<ServiceResult<BookingWithRelations>> {
    try {
      // Validate data
      const validatedData = rescheduleBookingSchema.parse(data)

      const response = await fetch(`/api/bookings/${bookingId}/reschedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validatedData),
      })

      if (!response.ok) {
        const error = await response.json()
        return {
          success: false,
          error: error.error || 'Failed to reschedule booking',
        }
      }

      const result = await response.json()

      return {
        success: true,
        data: result.booking,
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: error.issues[0].message,
        }
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      }
    }
  },

  /**
   * Cancel a booking
   */
  async cancelBooking(bookingId: string, data?: CancelBookingData): Promise<ServiceResult<void>> {
    try {
      const response = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data || {}),
      })

      if (!response.ok) {
        const error = await response.json()
        return {
          success: false,
          error: error.error || 'Failed to cancel booking',
        }
      }

      return {
        success: true,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      }
    }
  },

  /**
   * Get user's bookings
   */
  async getUserBookings(
    userId: string,
    filters?: {
      status?: BookingStatus
      startDate?: Date
      endDate?: Date
    }
  ): Promise<ServiceResult<BookingWithRelations[]>> {
    try {
      const params = new URLSearchParams({ userId })

      if (filters?.status) params.append('status', filters.status)
      if (filters?.startDate) params.append('startDate', filters.startDate.toISOString())
      if (filters?.endDate) params.append('endDate', filters.endDate.toISOString())

      const response = await fetch(`/api/bookings?${params.toString()}`)

      if (!response.ok) {
        const error = await response.json()
        return {
          success: false,
          error: error.error || 'Failed to fetch bookings',
        }
      }

      const result = await response.json()

      return {
        success: true,
        data: result.bookings,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      }
    }
  },
}

/**
 * Server-side booking service
 */
export const serverBookingService = {
  /**
   * Create a new booking with double-booking prevention
   */
  async createBooking(data: CreateBookingData): Promise<BookingWithRelations | null> {
    try {
      // Validate data
      const validatedData = createBookingSchema.parse(data)

      // Get event type with user info
      const eventType = await prisma.eventType.findUnique({
        where: { id: validatedData.eventTypeId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              timezone: true,
            },
          },
        },
      })

      if (!eventType) {
        throw new Error('Event type not found')
      }

      const startTime = new Date(validatedData.startTime)
      const endTime = new Date(validatedData.endTime)

      // Check for double-booking
      const conflictingBookings = await prisma.booking.findMany({
        where: {
          userId: eventType.userId,
          status: {
            in: ['PENDING', 'CONFIRMED'],
          },
          OR: [
            {
              AND: [{ startTime: { lte: startTime } }, { endTime: { gt: startTime } }],
            },
            {
              AND: [{ startTime: { lt: endTime } }, { endTime: { gte: endTime } }],
            },
            {
              AND: [{ startTime: { gte: startTime } }, { endTime: { lte: endTime } }],
            },
          ],
        },
      })

      if (conflictingBookings.length > 0) {
        throw new Error('This time slot is no longer available')
      }

      // Check buffer times
      const bufferStart = addMinutes(startTime, -eventType.bufferTimeBefore)
      const bufferEnd = addMinutes(endTime, eventType.bufferTimeAfter)

      const bufferConflicts = await prisma.booking.findMany({
        where: {
          userId: eventType.userId,
          status: {
            in: ['PENDING', 'CONFIRMED'],
          },
          OR: [
            {
              AND: [{ startTime: { lte: bufferStart } }, { endTime: { gt: bufferStart } }],
            },
            {
              AND: [{ startTime: { lt: bufferEnd } }, { endTime: { gte: bufferEnd } }],
            },
          ],
        },
      })

      if (bufferConflicts.length > 0) {
        throw new Error('This time slot conflicts with buffer time requirements')
      }

      // Generate video meeting link if needed
      let meetingLink: string | null = null
      let meetingPassword: string | null = null
      let location: string | null = null

      if (VideoService.isVideoLocationType(eventType.locationType)) {
        try {
          const videoMeeting = await videoService.createMeetingForBooking(
            eventType.locationType,
            {
              title: eventType.title,
              startTime,
              endTime,
              hostEmail: eventType.user.email,
              hostName: eventType.user.name || 'Host',
              guestEmail: validatedData.guestEmail,
              guestName: validatedData.guestName,
              description: eventType.description || undefined,
            }
          )

          if (videoMeeting) {
            meetingLink = videoMeeting.meetingLink
            meetingPassword = videoMeeting.meetingPassword || null
            location = videoMeeting.provider
          }
        } catch (error) {
          console.error('Error creating video meeting:', error)
          // Continue with booking creation even if video meeting fails
        }
      } else if (eventType.locationDetails) {
        // Use custom location details for non-video meetings
        location = eventType.locationDetails
      }

      // Create the booking
      const booking = await prisma.booking.create({
        data: {
          eventTypeId: validatedData.eventTypeId,
          userId: eventType.userId,
          guestName: validatedData.guestName,
          guestEmail: validatedData.guestEmail,
          guestPhone: validatedData.guestPhone || null,
          guestTimezone: validatedData.guestTimezone,
          startTime,
          endTime,
          customResponses: validatedData.customResponses as any,
          status: 'CONFIRMED',
          meetingLink,
          meetingPassword,
          location,
        },
        include: {
          eventType: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  timezone: true,
                },
              },
            },
          },
        },
      })

      // Schedule reminders for the booking (don't block on this)
      notificationService.scheduleReminders(booking.id).catch((error) => {
        console.error('Failed to schedule reminders:', error)
      })

      return booking as any
    } catch (error) {
      console.error('Error creating booking:', error)
      throw error
    }
  },

  /**
   * Get a booking by ID
   */
  async getBooking(bookingId: string): Promise<BookingWithRelations | null> {
    try {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          eventType: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  timezone: true,
                },
              },
            },
          },
        },
      })

      return booking as any
    } catch (error) {
      console.error('Error fetching booking:', error)
      return null
    }
  },

  /**
   * Get booking by token
   */
  async getBookingByToken(token: string, type: 'reschedule' | 'cancel'): Promise<BookingWithRelations | null> {
    try {
      const where = type === 'reschedule' ? { rescheduleToken: token } : { cancelToken: token }

      const booking = await prisma.booking.findFirst({
        where,
        include: {
          eventType: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  timezone: true,
                },
              },
            },
          },
        },
      })

      return booking as any
    } catch (error) {
      console.error('Error fetching booking by token:', error)
      return null
    }
  },

  /**
   * Reschedule a booking
   */
  async rescheduleBooking(bookingId: string, data: RescheduleBookingData): Promise<BookingWithRelations | null> {
    try {
      // Validate data
      const validatedData = rescheduleBookingSchema.parse(data)

      const startTime = new Date(validatedData.startTime)
      const endTime = new Date(validatedData.endTime)

      // Get existing booking
      const existingBooking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { eventType: true },
      })

      if (!existingBooking) {
        throw new Error('Booking not found')
      }

      // Check for conflicts (excluding current booking)
      const conflictingBookings = await prisma.booking.findMany({
        where: {
          userId: existingBooking.userId,
          id: { not: bookingId },
          status: {
            in: ['PENDING', 'CONFIRMED'],
          },
          OR: [
            {
              AND: [{ startTime: { lte: startTime } }, { endTime: { gt: startTime } }],
            },
            {
              AND: [{ startTime: { lt: endTime } }, { endTime: { gte: endTime } }],
            },
            {
              AND: [{ startTime: { gte: startTime } }, { endTime: { lte: endTime } }],
            },
          ],
        },
      })

      if (conflictingBookings.length > 0) {
        throw new Error('This time slot is no longer available')
      }

      // Update the booking
      const booking = await prisma.booking.update({
        where: { id: bookingId },
        data: {
          startTime,
          endTime,
        },
        include: {
          eventType: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  timezone: true,
                },
              },
            },
          },
        },
      })

      // Reschedule reminders (don't block on this)
      notificationService.rescheduleReminders(bookingId).catch((error) => {
        console.error('Failed to reschedule reminders:', error)
      })

      return booking as any
    } catch (error) {
      console.error('Error rescheduling booking:', error)
      throw error
    }
  },

  /**
   * Cancel a booking
   */
  async cancelBooking(bookingId: string, reason?: string): Promise<boolean> {
    try {
      await prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: 'CANCELLED',
          cancellationReason: reason || null,
        },
      })

      // Cancel pending reminders (don't block on this)
      notificationService.cancelReminders(bookingId).catch((error) => {
        console.error('Failed to cancel reminders:', error)
      })

      return true
    } catch (error) {
      console.error('Error cancelling booking:', error)
      return false
    }
  },

  /**
   * Get user's bookings
   */
  async getUserBookings(
    userId: string,
    filters?: {
      status?: BookingStatus
      startDate?: Date
      endDate?: Date
    }
  ): Promise<BookingWithRelations[]> {
    try {
      const where: any = { userId }

      if (filters?.status) {
        where.status = filters.status
      }

      if (filters?.startDate || filters?.endDate) {
        where.startTime = {}
        if (filters.startDate) where.startTime.gte = filters.startDate
        if (filters.endDate) where.startTime.lte = filters.endDate
      }

      const bookings = await prisma.booking.findMany({
        where,
        include: {
          eventType: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  timezone: true,
                },
              },
            },
          },
        },
        orderBy: {
          startTime: 'desc',
        },
      })

      return bookings as any
    } catch (error) {
      console.error('Error fetching user bookings:', error)
      return []
    }
  },
}
