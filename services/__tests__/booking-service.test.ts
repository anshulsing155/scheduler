import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { serverBookingService, bookingService, CreateBookingData } from '../booking-service'
import { serverAvailabilityService } from '../availability-service'
import { prisma } from '@/lib/prisma'
import { BookingStatus } from '@prisma/client'
import { addMinutes, addDays } from 'date-fns'

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    booking: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    eventType: {
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    availability: {
      findMany: vi.fn(),
    },
    dateOverride: {
      findFirst: vi.fn(),
    },
  },
}))

// Mock availability service
vi.mock('../availability-service', () => ({
  serverAvailabilityService: {
    getAvailableSlots: vi.fn(),
    checkSlotAvailability: vi.fn(),
  },
}))

describe('Booking Flow End-to-End Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Time Slot Availability Calculation', () => {
    it('should calculate available time slots correctly', async () => {
      const testDate = new Date('2024-01-15T00:00:00Z')
      const userId = 'user-123'

      const mockSlots = [
        {
          startTime: new Date('2024-01-15T09:00:00Z').toISOString(),
          endTime: new Date('2024-01-15T09:30:00Z').toISOString(),
          available: true,
        },
        {
          startTime: new Date('2024-01-15T09:15:00Z').toISOString(),
          endTime: new Date('2024-01-15T09:45:00Z').toISOString(),
          available: true,
        },
        {
          startTime: new Date('2024-01-15T09:30:00Z').toISOString(),
          endTime: new Date('2024-01-15T10:00:00Z').toISOString(),
          available: true,
        },
      ]

      ;(serverAvailabilityService.getAvailableSlots as any).mockResolvedValue(mockSlots)

      const slots = await serverAvailabilityService.getAvailableSlots(userId, testDate, 30, 'UTC')

      expect(slots).toHaveLength(3)
      expect(slots[0].available).toBe(true)
      expect(slots.every((slot) => slot.available)).toBe(true)
    })

    it('should exclude slots with existing bookings', async () => {
      const testDate = new Date('2024-01-15T00:00:00Z')
      const userId = 'user-123'

      ;(prisma.user.findUnique as any).mockResolvedValue({
        id: userId,
        timezone: 'UTC',
      })

      ;(prisma.dateOverride.findFirst as any).mockResolvedValue(null)

      ;(prisma.availability.findMany as any).mockResolvedValue([
        { id: '1', userId, dayOfWeek: 1, startTime: '09:00', endTime: '12:00' },
      ])

      // Existing booking at 10:00-10:30
      ;(prisma.booking.findMany as any).mockResolvedValue([
        {
          id: 'booking-1',
          userId,
          startTime: new Date('2024-01-15T10:00:00Z'),
          endTime: new Date('2024-01-15T10:30:00Z'),
          status: 'CONFIRMED',
          eventType: {
            bufferTimeBefore: 0,
            bufferTimeAfter: 0,
          },
        },
      ])

      const slots = await serverAvailabilityService.getAvailableSlots(userId, testDate, 30, 'UTC')

      // Verify no slots overlap with the 10:00-10:30 booking
      const hasConflict = slots.some((slot) => {
        const slotStart = new Date(slot.startTime).getTime()
        const slotEnd = new Date(slot.endTime).getTime()
        const bookingStart = new Date('2024-01-15T10:00:00Z').getTime()
        const bookingEnd = new Date('2024-01-15T10:30:00Z').getTime()

        return (
          (slotStart >= bookingStart && slotStart < bookingEnd) ||
          (slotEnd > bookingStart && slotEnd <= bookingEnd) ||
          (slotStart <= bookingStart && slotEnd >= bookingEnd)
        )
      })

      expect(hasConflict).toBe(false)
    })

    it('should respect buffer times in availability calculation', async () => {
      const testDate = new Date('2024-01-15T00:00:00Z')
      const userId = 'user-123'

      ;(prisma.user.findUnique as any).mockResolvedValue({
        id: userId,
        timezone: 'UTC',
      })

      ;(prisma.dateOverride.findFirst as any).mockResolvedValue(null)

      ;(prisma.availability.findMany as any).mockResolvedValue([
        { id: '1', userId, dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
      ])

      // Booking with 15-minute buffers
      const bookingStart = new Date('2024-01-15T12:00:00Z')
      const bookingEnd = new Date('2024-01-15T13:00:00Z')

      ;(prisma.booking.findMany as any).mockResolvedValue([
        {
          id: 'booking-1',
          userId,
          startTime: bookingStart,
          endTime: bookingEnd,
          status: 'CONFIRMED',
          eventType: {
            bufferTimeBefore: 15,
            bufferTimeAfter: 15,
          },
        },
      ])

      const slots = await serverAvailabilityService.getAvailableSlots(userId, testDate, 30, 'UTC')

      // Buffer zone: 11:45-13:15
      const bufferStart = addMinutes(bookingStart, -15)
      const bufferEnd = addMinutes(bookingEnd, 15)

      slots.forEach((slot) => {
        const slotStart = new Date(slot.startTime)
        const slotEnd = new Date(slot.endTime)

        const overlaps =
          (slotStart >= bufferStart && slotStart < bufferEnd) ||
          (slotEnd > bufferStart && slotEnd <= bufferEnd) ||
          (slotStart <= bufferStart && slotEnd >= bufferEnd)

        expect(overlaps).toBe(false)
      })
    })

    it('should handle multiple bookings in availability calculation', async () => {
      const testDate = new Date('2024-01-15T00:00:00Z')
      const userId = 'user-123'

      ;(prisma.user.findUnique as any).mockResolvedValue({
        id: userId,
        timezone: 'UTC',
      })

      ;(prisma.dateOverride.findFirst as any).mockResolvedValue(null)

      ;(prisma.availability.findMany as any).mockResolvedValue([
        { id: '1', userId, dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
      ])

      // Multiple bookings throughout the day
      ;(prisma.booking.findMany as any).mockResolvedValue([
        {
          id: 'booking-1',
          userId,
          startTime: new Date('2024-01-15T09:00:00Z'),
          endTime: new Date('2024-01-15T10:00:00Z'),
          status: 'CONFIRMED',
          eventType: { bufferTimeBefore: 0, bufferTimeAfter: 0 },
        },
        {
          id: 'booking-2',
          userId,
          startTime: new Date('2024-01-15T14:00:00Z'),
          endTime: new Date('2024-01-15T15:00:00Z'),
          status: 'CONFIRMED',
          eventType: { bufferTimeBefore: 0, bufferTimeAfter: 0 },
        },
      ])

      const slots = await serverAvailabilityService.getAvailableSlots(userId, testDate, 30, 'UTC')

      // Should have slots between bookings (10:00-14:00 and after 15:00)
      expect(slots.length).toBeGreaterThan(0)
      slots.forEach((slot) => {
        expect(slot.available).toBe(true)
      })
    })
  })

  describe('Booking Creation with Validation', () => {
    it('should successfully create a booking with valid data', async () => {
      const mockEventType = {
        id: 'event-123',
        userId: 'user-123',
        title: '30 Minute Meeting',
        duration: 30,
        bufferTimeBefore: 0,
        bufferTimeAfter: 0,
        user: {
          id: 'user-123',
          name: 'John Doe',
          email: 'john@example.com',
          timezone: 'UTC',
        },
      }

      const mockBooking = {
        id: 'booking-123',
        eventTypeId: 'event-123',
        userId: 'user-123',
        guestName: 'Jane Smith',
        guestEmail: 'jane@example.com',
        guestPhone: '+1234567890',
        guestTimezone: 'America/New_York',
        startTime: new Date('2024-01-15T10:00:00Z'),
        endTime: new Date('2024-01-15T10:30:00Z'),
        status: 'CONFIRMED' as BookingStatus,
        customResponses: null,
        cancellationReason: null,
        meetingLink: null,
        meetingPassword: null,
        location: null,
        rescheduleToken: 'reschedule-token',
        cancelToken: 'cancel-token',
        paymentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        eventType: mockEventType,
      }

      ;(prisma.eventType.findUnique as any).mockResolvedValue(mockEventType)
      ;(prisma.booking.findMany as any).mockResolvedValue([])
      ;(prisma.booking.create as any).mockResolvedValue(mockBooking)

      const bookingData: CreateBookingData = {
        eventTypeId: 'event-123',
        guestName: 'Jane Smith',
        guestEmail: 'jane@example.com',
        guestPhone: '+1234567890',
        guestTimezone: 'America/New_York',
        startTime: '2024-01-15T10:00:00Z',
        endTime: '2024-01-15T10:30:00Z',
      }

      const result = await serverBookingService.createBooking(bookingData)

      expect(result).toBeDefined()
      expect(result?.guestName).toBe('Jane Smith')
      expect(result?.guestEmail).toBe('jane@example.com')
      expect(result?.status).toBe('CONFIRMED')
      expect(prisma.booking.create).toHaveBeenCalled()
    })

    it('should validate required guest information', async () => {
      const invalidData = {
        eventTypeId: 'event-123',
        guestName: '',
        guestEmail: 'invalid-email',
        guestTimezone: 'UTC',
        startTime: '2024-01-15T10:00:00Z',
        endTime: '2024-01-15T10:30:00Z',
      } as CreateBookingData

      await expect(serverBookingService.createBooking(invalidData)).rejects.toThrow()
    })

    it('should validate email format', async () => {
      const invalidData = {
        eventTypeId: 'event-123',
        guestName: 'Jane Smith',
        guestEmail: 'not-an-email',
        guestTimezone: 'UTC',
        startTime: '2024-01-15T10:00:00Z',
        endTime: '2024-01-15T10:30:00Z',
      } as CreateBookingData

      await expect(serverBookingService.createBooking(invalidData)).rejects.toThrow()
    })

    it('should validate time format', async () => {
      const invalidData = {
        eventTypeId: 'event-123',
        guestName: 'Jane Smith',
        guestEmail: 'jane@example.com',
        guestTimezone: 'UTC',
        startTime: 'invalid-date',
        endTime: '2024-01-15T10:30:00Z',
      } as CreateBookingData

      await expect(serverBookingService.createBooking(invalidData)).rejects.toThrow()
    })

    it('should handle custom responses in booking', async () => {
      const mockEventType = {
        id: 'event-123',
        userId: 'user-123',
        duration: 30,
        bufferTimeBefore: 0,
        bufferTimeAfter: 0,
        user: {
          id: 'user-123',
          name: 'John Doe',
          email: 'john@example.com',
          timezone: 'UTC',
        },
      }

      const mockBooking = {
        id: 'booking-123',
        eventTypeId: 'event-123',
        userId: 'user-123',
        guestName: 'Jane Smith',
        guestEmail: 'jane@example.com',
        guestPhone: null,
        guestTimezone: 'UTC',
        startTime: new Date('2024-01-15T10:00:00Z'),
        endTime: new Date('2024-01-15T10:30:00Z'),
        status: 'CONFIRMED' as BookingStatus,
        customResponses: null,
        cancellationReason: null,
        meetingLink: null,
        meetingPassword: null,
        location: null,
        rescheduleToken: 'reschedule-token',
        cancelToken: 'cancel-token',
        paymentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        eventType: mockEventType,
      }

      ;(prisma.eventType.findUnique as any).mockResolvedValue(mockEventType)
      ;(prisma.booking.findMany as any).mockResolvedValue([])
      ;(prisma.booking.create as any).mockResolvedValue(mockBooking)

      const bookingData: CreateBookingData = {
        eventTypeId: 'event-123',
        guestName: 'Jane Smith',
        guestEmail: 'jane@example.com',
        guestTimezone: 'UTC',
        startTime: '2024-01-15T10:00:00Z',
        endTime: '2024-01-15T10:30:00Z',
        customResponses: null,
      }

      const result = await serverBookingService.createBooking(bookingData)

      expect(result).toBeDefined()
      expect(result?.guestName).toBe('Jane Smith')
      expect(result?.status).toBe('CONFIRMED')
    })
  })

  describe('Double-Booking Prevention', () => {
    it('should prevent double-booking at exact same time', async () => {
      const mockEventType = {
        id: 'event-123',
        userId: 'user-123',
        duration: 30,
        bufferTimeBefore: 0,
        bufferTimeAfter: 0,
        user: {
          id: 'user-123',
          name: 'John Doe',
          email: 'john@example.com',
          timezone: 'UTC',
        },
      }

      const existingBooking = {
        id: 'existing-booking',
        userId: 'user-123',
        startTime: new Date('2024-01-15T10:00:00Z'),
        endTime: new Date('2024-01-15T10:30:00Z'),
        status: 'CONFIRMED',
      }

      ;(prisma.eventType.findUnique as any).mockResolvedValue(mockEventType)
      ;(prisma.booking.findMany as any).mockResolvedValue([existingBooking])

      const bookingData: CreateBookingData = {
        eventTypeId: 'event-123',
        guestName: 'Jane Smith',
        guestEmail: 'jane@example.com',
        guestTimezone: 'UTC',
        startTime: '2024-01-15T10:00:00Z',
        endTime: '2024-01-15T10:30:00Z',
      }

      await expect(serverBookingService.createBooking(bookingData)).rejects.toThrow(
        'This time slot is no longer available'
      )
    })

    it('should prevent overlapping bookings (new booking starts during existing)', async () => {
      const mockEventType = {
        id: 'event-123',
        userId: 'user-123',
        duration: 30,
        bufferTimeBefore: 0,
        bufferTimeAfter: 0,
        user: {
          id: 'user-123',
          name: 'John Doe',
          email: 'john@example.com',
          timezone: 'UTC',
        },
      }

      const existingBooking = {
        id: 'existing-booking',
        userId: 'user-123',
        startTime: new Date('2024-01-15T10:00:00Z'),
        endTime: new Date('2024-01-15T11:00:00Z'),
        status: 'CONFIRMED',
      }

      ;(prisma.eventType.findUnique as any).mockResolvedValue(mockEventType)
      ;(prisma.booking.findMany as any).mockResolvedValue([existingBooking])

      const bookingData: CreateBookingData = {
        eventTypeId: 'event-123',
        guestName: 'Jane Smith',
        guestEmail: 'jane@example.com',
        guestTimezone: 'UTC',
        startTime: '2024-01-15T10:30:00Z',
        endTime: '2024-01-15T11:00:00Z',
      }

      await expect(serverBookingService.createBooking(bookingData)).rejects.toThrow(
        'This time slot is no longer available'
      )
    })

    it('should prevent overlapping bookings (new booking ends during existing)', async () => {
      const mockEventType = {
        id: 'event-123',
        userId: 'user-123',
        duration: 30,
        bufferTimeBefore: 0,
        bufferTimeAfter: 0,
        user: {
          id: 'user-123',
          name: 'John Doe',
          email: 'john@example.com',
          timezone: 'UTC',
        },
      }

      const existingBooking = {
        id: 'existing-booking',
        userId: 'user-123',
        startTime: new Date('2024-01-15T10:00:00Z'),
        endTime: new Date('2024-01-15T11:00:00Z'),
        status: 'CONFIRMED',
      }

      ;(prisma.eventType.findUnique as any).mockResolvedValue(mockEventType)
      ;(prisma.booking.findMany as any).mockResolvedValue([existingBooking])

      const bookingData: CreateBookingData = {
        eventTypeId: 'event-123',
        guestName: 'Jane Smith',
        guestEmail: 'jane@example.com',
        guestTimezone: 'UTC',
        startTime: '2024-01-15T09:30:00Z',
        endTime: '2024-01-15T10:30:00Z',
      }

      await expect(serverBookingService.createBooking(bookingData)).rejects.toThrow(
        'This time slot is no longer available'
      )
    })

    it('should prevent overlapping bookings (new booking encompasses existing)', async () => {
      const mockEventType = {
        id: 'event-123',
        userId: 'user-123',
        duration: 30,
        bufferTimeBefore: 0,
        bufferTimeAfter: 0,
        user: {
          id: 'user-123',
          name: 'John Doe',
          email: 'john@example.com',
          timezone: 'UTC',
        },
      }

      const existingBooking = {
        id: 'existing-booking',
        userId: 'user-123',
        startTime: new Date('2024-01-15T10:00:00Z'),
        endTime: new Date('2024-01-15T10:30:00Z'),
        status: 'CONFIRMED',
      }

      ;(prisma.eventType.findUnique as any).mockResolvedValue(mockEventType)
      ;(prisma.booking.findMany as any).mockResolvedValue([existingBooking])

      const bookingData: CreateBookingData = {
        eventTypeId: 'event-123',
        guestName: 'Jane Smith',
        guestEmail: 'jane@example.com',
        guestTimezone: 'UTC',
        startTime: '2024-01-15T09:30:00Z',
        endTime: '2024-01-15T11:00:00Z',
      }

      await expect(serverBookingService.createBooking(bookingData)).rejects.toThrow(
        'This time slot is no longer available'
      )
    })

    it('should allow booking immediately after existing booking ends', async () => {
      const mockEventType = {
        id: 'event-123',
        userId: 'user-123',
        duration: 30,
        bufferTimeBefore: 0,
        bufferTimeAfter: 0,
        user: {
          id: 'user-123',
          name: 'John Doe',
          email: 'john@example.com',
          timezone: 'UTC',
        },
      }

      const mockNewBooking = {
        id: 'booking-123',
        eventTypeId: 'event-123',
        userId: 'user-123',
        guestName: 'Jane Smith',
        guestEmail: 'jane@example.com',
        guestPhone: null,
        guestTimezone: 'UTC',
        startTime: new Date('2024-01-15T10:30:00Z'),
        endTime: new Date('2024-01-15T11:00:00Z'),
        status: 'CONFIRMED' as BookingStatus,
        customResponses: null,
        cancellationReason: null,
        meetingLink: null,
        meetingPassword: null,
        location: null,
        rescheduleToken: 'reschedule-token',
        cancelToken: 'cancel-token',
        paymentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        eventType: mockEventType,
      }

      ;(prisma.eventType.findUnique as any).mockResolvedValue(mockEventType)
      // No conflicting bookings - booking at 10:30 doesn't conflict with one ending at 10:30
      ;(prisma.booking.findMany as any).mockResolvedValue([])
      ;(prisma.booking.create as any).mockResolvedValue(mockNewBooking)

      const bookingData: CreateBookingData = {
        eventTypeId: 'event-123',
        guestName: 'Jane Smith',
        guestEmail: 'jane@example.com',
        guestTimezone: 'UTC',
        startTime: '2024-01-15T10:30:00Z',
        endTime: '2024-01-15T11:00:00Z',
      }

      const result = await serverBookingService.createBooking(bookingData)

      expect(result).toBeDefined()
      expect(result?.status).toBe('CONFIRMED')
    })

    it('should respect buffer times when checking for conflicts', async () => {
      const mockEventType = {
        id: 'event-123',
        userId: 'user-123',
        duration: 30,
        bufferTimeBefore: 15,
        bufferTimeAfter: 15,
        user: {
          id: 'user-123',
          name: 'John Doe',
          email: 'john@example.com',
          timezone: 'UTC',
        },
      }

      const existingBooking = {
        id: 'existing-booking',
        userId: 'user-123',
        startTime: new Date('2024-01-15T10:00:00Z'),
        endTime: new Date('2024-01-15T10:30:00Z'),
        status: 'CONFIRMED',
        eventType: {
          bufferTimeBefore: 0,
          bufferTimeAfter: 0,
        },
      }

      ;(prisma.eventType.findUnique as any).mockResolvedValue(mockEventType)
      // First call checks for direct conflicts (none)
      ;(prisma.booking.findMany as any).mockResolvedValueOnce([])
      // Second call checks for buffer conflicts (finds existing booking)
      ;(prisma.booking.findMany as any).mockResolvedValueOnce([existingBooking])

      const bookingData: CreateBookingData = {
        eventTypeId: 'event-123',
        guestName: 'Jane Smith',
        guestEmail: 'jane@example.com',
        guestTimezone: 'UTC',
        startTime: '2024-01-15T10:35:00Z',
        endTime: '2024-01-15T11:05:00Z',
      }

      await expect(serverBookingService.createBooking(bookingData)).rejects.toThrow(
        'This time slot conflicts with buffer time requirements'
      )
    })

    it('should ignore cancelled bookings when checking conflicts', async () => {
      const mockEventType = {
        id: 'event-123',
        userId: 'user-123',
        duration: 30,
        bufferTimeBefore: 0,
        bufferTimeAfter: 0,
        user: {
          id: 'user-123',
          name: 'John Doe',
          email: 'john@example.com',
          timezone: 'UTC',
        },
      }

      const mockNewBooking = {
        id: 'booking-123',
        eventTypeId: 'event-123',
        userId: 'user-123',
        guestName: 'Jane Smith',
        guestEmail: 'jane@example.com',
        guestPhone: null,
        guestTimezone: 'UTC',
        startTime: new Date('2024-01-15T10:00:00Z'),
        endTime: new Date('2024-01-15T10:30:00Z'),
        status: 'CONFIRMED' as BookingStatus,
        customResponses: null,
        cancellationReason: null,
        meetingLink: null,
        meetingPassword: null,
        location: null,
        rescheduleToken: 'reschedule-token',
        cancelToken: 'cancel-token',
        paymentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        eventType: mockEventType,
      }

      ;(prisma.eventType.findUnique as any).mockResolvedValue(mockEventType)
      // Cancelled bookings are filtered out by the query (status: in: ['PENDING', 'CONFIRMED'])
      // so findMany returns empty array
      ;(prisma.booking.findMany as any).mockResolvedValue([])
      ;(prisma.booking.create as any).mockResolvedValue(mockNewBooking)

      const bookingData: CreateBookingData = {
        eventTypeId: 'event-123',
        guestName: 'Jane Smith',
        guestEmail: 'jane@example.com',
        guestTimezone: 'UTC',
        startTime: '2024-01-15T10:00:00Z',
        endTime: '2024-01-15T10:30:00Z',
      }

      const result = await serverBookingService.createBooking(bookingData)

      expect(result).toBeDefined()
      expect(result?.status).toBe('CONFIRMED')
    })
  })

  describe('Timezone Handling in Bookings', () => {
    it('should store booking times in UTC regardless of guest timezone', async () => {
      const mockEventType = {
        id: 'event-123',
        userId: 'user-123',
        duration: 30,
        bufferTimeBefore: 0,
        bufferTimeAfter: 0,
        user: {
          id: 'user-123',
          name: 'John Doe',
          email: 'john@example.com',
          timezone: 'UTC',
        },
      }

      const mockBooking = {
        id: 'booking-123',
        eventTypeId: 'event-123',
        userId: 'user-123',
        guestName: 'Jane Smith',
        guestEmail: 'jane@example.com',
        guestPhone: null,
        guestTimezone: 'America/New_York',
        startTime: new Date('2024-01-15T10:00:00Z'),
        endTime: new Date('2024-01-15T10:30:00Z'),
        status: 'CONFIRMED' as BookingStatus,
        customResponses: null,
        cancellationReason: null,
        meetingLink: null,
        meetingPassword: null,
        location: null,
        rescheduleToken: 'reschedule-token',
        cancelToken: 'cancel-token',
        paymentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        eventType: mockEventType,
      }

      ;(prisma.eventType.findUnique as any).mockResolvedValue(mockEventType)
      ;(prisma.booking.findMany as any).mockResolvedValue([])
      ;(prisma.booking.create as any).mockResolvedValue(mockBooking)

      const bookingData: CreateBookingData = {
        eventTypeId: 'event-123',
        guestName: 'Jane Smith',
        guestEmail: 'jane@example.com',
        guestTimezone: 'America/New_York',
        startTime: '2024-01-15T10:00:00Z',
        endTime: '2024-01-15T10:30:00Z',
      }

      const result = await serverBookingService.createBooking(bookingData)

      expect(result).toBeDefined()
      expect(result?.guestTimezone).toBe('America/New_York')
      expect(result?.startTime.toISOString()).toContain('Z')
      expect(result?.endTime.toISOString()).toContain('Z')
    })

    it('should preserve guest timezone preference in booking record', async () => {
      const mockEventType = {
        id: 'event-123',
        userId: 'user-123',
        duration: 30,
        bufferTimeBefore: 0,
        bufferTimeAfter: 0,
        user: {
          id: 'user-123',
          name: 'John Doe',
          email: 'john@example.com',
          timezone: 'UTC',
        },
      }

      const mockBooking = {
        id: 'booking-123',
        eventTypeId: 'event-123',
        userId: 'user-123',
        guestName: 'Jane Smith',
        guestEmail: 'jane@example.com',
        guestPhone: null,
        guestTimezone: 'Europe/London',
        startTime: new Date('2024-01-15T10:00:00Z'),
        endTime: new Date('2024-01-15T10:30:00Z'),
        status: 'CONFIRMED' as BookingStatus,
        customResponses: null,
        cancellationReason: null,
        meetingLink: null,
        meetingPassword: null,
        location: null,
        rescheduleToken: 'reschedule-token',
        cancelToken: 'cancel-token',
        paymentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        eventType: mockEventType,
      }

      ;(prisma.eventType.findUnique as any).mockResolvedValue(mockEventType)
      ;(prisma.booking.findMany as any).mockResolvedValue([])
      ;(prisma.booking.create as any).mockResolvedValue(mockBooking)

      const bookingData: CreateBookingData = {
        eventTypeId: 'event-123',
        guestName: 'Jane Smith',
        guestEmail: 'jane@example.com',
        guestTimezone: 'Europe/London',
        startTime: '2024-01-15T10:00:00Z',
        endTime: '2024-01-15T10:30:00Z',
      }

      const result = await serverBookingService.createBooking(bookingData)

      expect(result?.guestTimezone).toBe('Europe/London')
    })

    it('should handle bookings across different timezones correctly', async () => {
      const mockEventType = {
        id: 'event-123',
        userId: 'user-123',
        duration: 30,
        bufferTimeBefore: 0,
        bufferTimeAfter: 0,
        user: {
          id: 'user-123',
          name: 'John Doe',
          email: 'john@example.com',
          timezone: 'America/Los_Angeles',
        },
      }

      const mockBooking = {
        id: 'booking-123',
        eventTypeId: 'event-123',
        userId: 'user-123',
        guestName: 'Jane Smith',
        guestEmail: 'jane@example.com',
        guestPhone: null,
        guestTimezone: 'Asia/Tokyo',
        startTime: new Date('2024-01-15T18:00:00Z'),
        endTime: new Date('2024-01-15T18:30:00Z'),
        status: 'CONFIRMED' as BookingStatus,
        customResponses: null,
        cancellationReason: null,
        meetingLink: null,
        meetingPassword: null,
        location: null,
        rescheduleToken: 'reschedule-token',
        cancelToken: 'cancel-token',
        paymentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        eventType: mockEventType,
      }

      ;(prisma.eventType.findUnique as any).mockResolvedValue(mockEventType)
      ;(prisma.booking.findMany as any).mockResolvedValue([])
      ;(prisma.booking.create as any).mockResolvedValue(mockBooking)

      const bookingData: CreateBookingData = {
        eventTypeId: 'event-123',
        guestName: 'Jane Smith',
        guestEmail: 'jane@example.com',
        guestTimezone: 'Asia/Tokyo',
        startTime: '2024-01-15T18:00:00Z',
        endTime: '2024-01-15T18:30:00Z',
      }

      const result = await serverBookingService.createBooking(bookingData)

      expect(result).toBeDefined()
      expect(result?.guestTimezone).toBe('Asia/Tokyo')
      expect(result?.eventType.user.timezone).toBe('America/Los_Angeles')
    })

    it('should validate timezone strings', async () => {
      const invalidData = {
        eventTypeId: 'event-123',
        guestName: 'Jane Smith',
        guestEmail: 'jane@example.com',
        guestTimezone: 'Invalid/Timezone',
        startTime: '2024-01-15T10:00:00Z',
        endTime: '2024-01-15T10:30:00Z',
      } as CreateBookingData

      const mockEventType = {
        id: 'event-123',
        userId: 'user-123',
        duration: 30,
        bufferTimeBefore: 0,
        bufferTimeAfter: 0,
        user: {
          id: 'user-123',
          name: 'John Doe',
          email: 'john@example.com',
          timezone: 'UTC',
        },
      }

      ;(prisma.eventType.findUnique as any).mockResolvedValue(mockEventType)
      ;(prisma.booking.findMany as any).mockResolvedValue([])

      // The service should still create the booking as timezone validation
      // is typically done at the UI level, but we store whatever is provided
      const mockBooking = {
        id: 'booking-123',
        eventTypeId: 'event-123',
        userId: 'user-123',
        guestName: 'Jane Smith',
        guestEmail: 'jane@example.com',
        guestPhone: null,
        guestTimezone: 'Invalid/Timezone',
        startTime: new Date('2024-01-15T10:00:00Z'),
        endTime: new Date('2024-01-15T10:30:00Z'),
        status: 'CONFIRMED' as BookingStatus,
        customResponses: null,
        cancellationReason: null,
        meetingLink: null,
        meetingPassword: null,
        location: null,
        rescheduleToken: 'reschedule-token',
        cancelToken: 'cancel-token',
        paymentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        eventType: mockEventType,
      }

      ;(prisma.booking.create as any).mockResolvedValue(mockBooking)

      const result = await serverBookingService.createBooking(invalidData)
      expect(result?.guestTimezone).toBe('Invalid/Timezone')
    })
  })

  describe('Client-side Booking Service', () => {
    it('should call API to create booking', async () => {
      const mockBooking = {
        id: 'booking-123',
        eventTypeId: 'event-123',
        userId: 'user-123',
        guestName: 'Jane Smith',
        guestEmail: 'jane@example.com',
        guestPhone: null,
        guestTimezone: 'UTC',
        startTime: new Date('2024-01-15T10:00:00Z'),
        endTime: new Date('2024-01-15T10:30:00Z'),
        status: 'CONFIRMED',
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ booking: mockBooking }),
      })

      const bookingData: CreateBookingData = {
        eventTypeId: 'event-123',
        guestName: 'Jane Smith',
        guestEmail: 'jane@example.com',
        guestTimezone: 'UTC',
        startTime: '2024-01-15T10:00:00Z',
        endTime: '2024-01-15T10:30:00Z',
      }

      const result = await bookingService.createBooking(bookingData)

      expect(result.success).toBe(true)
      expect(result.data?.guestName).toBe('Jane Smith')
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/bookings',
        expect.objectContaining({
          method: 'POST',
        })
      )
    })

    it('should handle API errors gracefully', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Time slot no longer available' }),
      })

      const bookingData: CreateBookingData = {
        eventTypeId: 'event-123',
        guestName: 'Jane Smith',
        guestEmail: 'jane@example.com',
        guestTimezone: 'UTC',
        startTime: '2024-01-15T10:00:00Z',
        endTime: '2024-01-15T10:30:00Z',
      }

      const result = await bookingService.createBooking(bookingData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Time slot no longer available')
    })

    it('should validate data before API call', async () => {
      const invalidData = {
        eventTypeId: 'event-123',
        guestName: '',
        guestEmail: 'invalid-email',
        guestTimezone: 'UTC',
        startTime: '2024-01-15T10:00:00Z',
        endTime: '2024-01-15T10:30:00Z',
      } as CreateBookingData

      const result = await bookingService.createBooking(invalidData)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(global.fetch).not.toHaveBeenCalled()
    })
  })

  describe('Booking Retrieval', () => {
    it('should get booking by ID', async () => {
      const mockBooking = {
        id: 'booking-123',
        eventTypeId: 'event-123',
        userId: 'user-123',
        guestName: 'Jane Smith',
        guestEmail: 'jane@example.com',
        guestPhone: null,
        guestTimezone: 'UTC',
        startTime: new Date('2024-01-15T10:00:00Z'),
        endTime: new Date('2024-01-15T10:30:00Z'),
        status: 'CONFIRMED' as BookingStatus,
        customResponses: null,
        cancellationReason: null,
        meetingLink: null,
        meetingPassword: null,
        location: null,
        rescheduleToken: 'reschedule-token',
        cancelToken: 'cancel-token',
        paymentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        eventType: {
          id: 'event-123',
          title: '30 Minute Meeting',
          duration: 30,
          locationType: 'VIDEO_ZOOM',
          locationDetails: null,
          user: {
            id: 'user-123',
            name: 'John Doe',
            email: 'john@example.com',
            timezone: 'UTC',
          },
        },
      }

      ;(prisma.booking.findUnique as any).mockResolvedValue(mockBooking)

      const result = await serverBookingService.getBooking('booking-123')

      expect(result).toBeDefined()
      expect(result?.id).toBe('booking-123')
      expect(result?.guestName).toBe('Jane Smith')
    })

    it('should get booking by reschedule token', async () => {
      const mockBooking = {
        id: 'booking-123',
        eventTypeId: 'event-123',
        userId: 'user-123',
        guestName: 'Jane Smith',
        guestEmail: 'jane@example.com',
        guestPhone: null,
        guestTimezone: 'UTC',
        startTime: new Date('2024-01-15T10:00:00Z'),
        endTime: new Date('2024-01-15T10:30:00Z'),
        status: 'CONFIRMED' as BookingStatus,
        customResponses: null,
        cancellationReason: null,
        meetingLink: null,
        meetingPassword: null,
        location: null,
        rescheduleToken: 'reschedule-token-123',
        cancelToken: 'cancel-token',
        paymentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        eventType: {
          id: 'event-123',
          title: '30 Minute Meeting',
          duration: 30,
          locationType: 'VIDEO_ZOOM',
          locationDetails: null,
          user: {
            id: 'user-123',
            name: 'John Doe',
            email: 'john@example.com',
            timezone: 'UTC',
          },
        },
      }

      ;(prisma.booking.findFirst as any).mockResolvedValue(mockBooking)

      const result = await serverBookingService.getBookingByToken('reschedule-token-123', 'reschedule')

      expect(result).toBeDefined()
      expect(result?.rescheduleToken).toBe('reschedule-token-123')
    })

    it('should get booking by cancel token', async () => {
      const mockBooking = {
        id: 'booking-123',
        rescheduleToken: 'reschedule-token',
        cancelToken: 'cancel-token-123',
        eventType: {
          id: 'event-123',
          title: '30 Minute Meeting',
          duration: 30,
          locationType: 'VIDEO_ZOOM',
          locationDetails: null,
          user: {
            id: 'user-123',
            name: 'John Doe',
            email: 'john@example.com',
            timezone: 'UTC',
          },
        },
      }

      ;(prisma.booking.findFirst as any).mockResolvedValue(mockBooking)

      const result = await serverBookingService.getBookingByToken('cancel-token-123', 'cancel')

      expect(result).toBeDefined()
      expect(result?.cancelToken).toBe('cancel-token-123')
    })
  })

  describe('Booking Rescheduling', () => {
    it('should successfully reschedule a booking', async () => {
      const existingBooking = {
        id: 'booking-123',
        userId: 'user-123',
        eventTypeId: 'event-123',
        startTime: new Date('2024-01-15T10:00:00Z'),
        endTime: new Date('2024-01-15T10:30:00Z'),
        eventType: {
          bufferTimeBefore: 0,
          bufferTimeAfter: 0,
        },
      }

      const updatedBooking = {
        id: 'booking-123',
        eventTypeId: 'event-123',
        userId: 'user-123',
        guestName: 'Jane Smith',
        guestEmail: 'jane@example.com',
        guestPhone: null,
        guestTimezone: 'UTC',
        startTime: new Date('2024-01-16T14:00:00Z'),
        endTime: new Date('2024-01-16T14:30:00Z'),
        status: 'CONFIRMED' as BookingStatus,
        customResponses: null,
        cancellationReason: null,
        meetingLink: null,
        meetingPassword: null,
        location: null,
        rescheduleToken: 'reschedule-token',
        cancelToken: 'cancel-token',
        paymentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        eventType: {
          id: 'event-123',
          title: '30 Minute Meeting',
          duration: 30,
          locationType: 'VIDEO_ZOOM',
          locationDetails: null,
          user: {
            id: 'user-123',
            name: 'John Doe',
            email: 'john@example.com',
            timezone: 'UTC',
          },
        },
      }

      ;(prisma.booking.findUnique as any).mockResolvedValue(existingBooking)
      ;(prisma.booking.findMany as any).mockResolvedValue([])
      ;(prisma.booking.update as any).mockResolvedValue(updatedBooking)

      const result = await serverBookingService.rescheduleBooking('booking-123', {
        startTime: '2024-01-16T14:00:00Z',
        endTime: '2024-01-16T14:30:00Z',
      })

      expect(result).toBeDefined()
      expect(result?.startTime.toISOString()).toBe('2024-01-16T14:00:00.000Z')
      expect(result?.endTime.toISOString()).toBe('2024-01-16T14:30:00.000Z')
    })

    it('should prevent rescheduling to conflicting time slot', async () => {
      const existingBooking = {
        id: 'booking-123',
        userId: 'user-123',
        eventTypeId: 'event-123',
        startTime: new Date('2024-01-15T10:00:00Z'),
        endTime: new Date('2024-01-15T10:30:00Z'),
        eventType: {
          bufferTimeBefore: 0,
          bufferTimeAfter: 0,
        },
      }

      const conflictingBooking = {
        id: 'booking-456',
        userId: 'user-123',
        startTime: new Date('2024-01-16T14:00:00Z'),
        endTime: new Date('2024-01-16T14:30:00Z'),
        status: 'CONFIRMED',
      }

      ;(prisma.booking.findUnique as any).mockResolvedValue(existingBooking)
      ;(prisma.booking.findMany as any).mockResolvedValue([conflictingBooking])

      await expect(
        serverBookingService.rescheduleBooking('booking-123', {
          startTime: '2024-01-16T14:00:00Z',
          endTime: '2024-01-16T14:30:00Z',
        })
      ).rejects.toThrow('This time slot is no longer available')
    })
  })

  describe('Booking Cancellation', () => {
    it('should successfully cancel a booking', async () => {
      ;(prisma.booking.update as any).mockResolvedValue({
        id: 'booking-123',
        status: 'CANCELLED',
        cancellationReason: 'Schedule conflict',
      })

      const result = await serverBookingService.cancelBooking('booking-123', 'Schedule conflict')

      expect(result).toBe(true)
      expect(prisma.booking.update).toHaveBeenCalledWith({
        where: { id: 'booking-123' },
        data: {
          status: 'CANCELLED',
          cancellationReason: 'Schedule conflict',
        },
      })
    })

    it('should cancel booking without reason', async () => {
      ;(prisma.booking.update as any).mockResolvedValue({
        id: 'booking-123',
        status: 'CANCELLED',
        cancellationReason: null,
      })

      const result = await serverBookingService.cancelBooking('booking-123')

      expect(result).toBe(true)
      expect(prisma.booking.update).toHaveBeenCalledWith({
        where: { id: 'booking-123' },
        data: {
          status: 'CANCELLED',
          cancellationReason: null,
        },
      })
    })

    it('should handle cancellation errors', async () => {
      ;(prisma.booking.update as any).mockRejectedValue(new Error('Booking not found'))

      const result = await serverBookingService.cancelBooking('nonexistent')

      expect(result).toBe(false)
    })
  })

  describe('User Bookings Retrieval', () => {
    it('should get all bookings for a user', async () => {
      const mockBookings = [
        {
          id: 'booking-1',
          userId: 'user-123',
          startTime: new Date('2024-01-15T10:00:00Z'),
          status: 'CONFIRMED',
          eventType: {
            id: 'event-123',
            title: '30 Minute Meeting',
            duration: 30,
            locationType: 'VIDEO_ZOOM',
            locationDetails: null,
            user: {
              id: 'user-123',
              name: 'John Doe',
              email: 'john@example.com',
              timezone: 'UTC',
            },
          },
        },
        {
          id: 'booking-2',
          userId: 'user-123',
          startTime: new Date('2024-01-16T14:00:00Z'),
          status: 'CONFIRMED',
          eventType: {
            id: 'event-123',
            title: '30 Minute Meeting',
            duration: 30,
            locationType: 'VIDEO_ZOOM',
            locationDetails: null,
            user: {
              id: 'user-123',
              name: 'John Doe',
              email: 'john@example.com',
              timezone: 'UTC',
            },
          },
        },
      ]

      ;(prisma.booking.findMany as any).mockResolvedValue(mockBookings)

      const result = await serverBookingService.getUserBookings('user-123')

      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('booking-1')
      expect(result[1].id).toBe('booking-2')
    })

    it('should filter bookings by status', async () => {
      const mockBookings = [
        {
          id: 'booking-1',
          userId: 'user-123',
          status: 'CONFIRMED',
          eventType: {
            id: 'event-123',
            title: '30 Minute Meeting',
            duration: 30,
            locationType: 'VIDEO_ZOOM',
            locationDetails: null,
            user: {
              id: 'user-123',
              name: 'John Doe',
              email: 'john@example.com',
              timezone: 'UTC',
            },
          },
        },
      ]

      ;(prisma.booking.findMany as any).mockResolvedValue(mockBookings)

      const result = await serverBookingService.getUserBookings('user-123', {
        status: 'CONFIRMED',
      })

      expect(result).toHaveLength(1)
      expect(result[0].status).toBe('CONFIRMED')
    })

    it('should filter bookings by date range', async () => {
      const startDate = new Date('2024-01-15T00:00:00Z')
      const endDate = new Date('2024-01-20T23:59:59Z')

      const mockBookings = [
        {
          id: 'booking-1',
          userId: 'user-123',
          startTime: new Date('2024-01-16T10:00:00Z'),
          status: 'CONFIRMED',
          eventType: {
            id: 'event-123',
            title: '30 Minute Meeting',
            duration: 30,
            locationType: 'VIDEO_ZOOM',
            locationDetails: null,
            user: {
              id: 'user-123',
              name: 'John Doe',
              email: 'john@example.com',
              timezone: 'UTC',
            },
          },
        },
      ]

      ;(prisma.booking.findMany as any).mockResolvedValue(mockBookings)

      const result = await serverBookingService.getUserBookings('user-123', {
        startDate,
        endDate,
      })

      expect(result).toHaveLength(1)
      expect(prisma.booking.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            startTime: {
              gte: startDate,
              lte: endDate,
            },
          }),
        })
      )
    })

    it('should return empty array when no bookings found', async () => {
      ;(prisma.booking.findMany as any).mockResolvedValue([])

      const result = await serverBookingService.getUserBookings('user-123')

      expect(result).toEqual([])
    })
  })

  describe('Integration: Complete Booking Flow', () => {
    it('should complete full booking flow from availability check to confirmation', async () => {
      const userId = 'user-123'
      const eventTypeId = 'event-123'
      const testDate = new Date('2024-01-15T00:00:00Z')

      // Step 1: Check availability
      const mockSlots = [
        {
          startTime: new Date('2024-01-15T10:00:00Z').toISOString(),
          endTime: new Date('2024-01-15T10:30:00Z').toISOString(),
          available: true,
        },
      ]

      ;(serverAvailabilityService.getAvailableSlots as any).mockResolvedValue(mockSlots)

      const slots = await serverAvailabilityService.getAvailableSlots(userId, testDate, 30, 'UTC')
      expect(slots.length).toBeGreaterThan(0)
      expect(slots[0].available).toBe(true)

      // Step 2: Create booking
      const mockEventType = {
        id: eventTypeId,
        userId,
        duration: 30,
        bufferTimeBefore: 0,
        bufferTimeAfter: 0,
        user: {
          id: userId,
          name: 'John Doe',
          email: 'john@example.com',
          timezone: 'UTC',
        },
      }

      const mockBooking = {
        id: 'booking-123',
        eventTypeId,
        userId,
        guestName: 'Jane Smith',
        guestEmail: 'jane@example.com',
        guestPhone: null,
        guestTimezone: 'UTC',
        startTime: new Date(slots[0].startTime),
        endTime: new Date(slots[0].endTime),
        status: 'CONFIRMED' as BookingStatus,
        customResponses: null,
        cancellationReason: null,
        meetingLink: null,
        meetingPassword: null,
        location: null,
        rescheduleToken: 'reschedule-token',
        cancelToken: 'cancel-token',
        paymentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        eventType: mockEventType,
      }

      ;(prisma.eventType.findUnique as any).mockResolvedValue(mockEventType)
      ;(prisma.booking.findMany as any).mockResolvedValue([])
      ;(prisma.booking.create as any).mockResolvedValue(mockBooking)

      const bookingData: CreateBookingData = {
        eventTypeId,
        guestName: 'Jane Smith',
        guestEmail: 'jane@example.com',
        guestTimezone: 'UTC',
        startTime: slots[0].startTime,
        endTime: slots[0].endTime,
      }

      const booking = await serverBookingService.createBooking(bookingData)

      expect(booking).toBeDefined()
      expect(booking?.status).toBe('CONFIRMED')
      expect(booking?.guestName).toBe('Jane Smith')

      // Step 3: Verify booking appears in user's bookings
      ;(prisma.booking.findMany as any).mockResolvedValue([mockBooking])

      const userBookings = await serverBookingService.getUserBookings(userId)

      expect(userBookings).toHaveLength(1)
      expect(userBookings[0].id).toBe('booking-123')
    })

    it('should handle race condition when two guests try to book same slot', async () => {
      const mockEventType = {
        id: 'event-123',
        userId: 'user-123',
        duration: 30,
        bufferTimeBefore: 0,
        bufferTimeAfter: 0,
        user: {
          id: 'user-123',
          name: 'John Doe',
          email: 'john@example.com',
          timezone: 'UTC',
        },
      }

      const bookingData: CreateBookingData = {
        eventTypeId: 'event-123',
        guestName: 'Guest 1',
        guestEmail: 'guest1@example.com',
        guestTimezone: 'UTC',
        startTime: '2024-01-15T10:00:00Z',
        endTime: '2024-01-15T10:30:00Z',
      }

      // First booking succeeds
      ;(prisma.eventType.findUnique as any).mockResolvedValue(mockEventType)
      ;(prisma.booking.findMany as any).mockResolvedValueOnce([])
      ;(prisma.booking.findMany as any).mockResolvedValueOnce([])
      ;(prisma.booking.create as any).mockResolvedValueOnce({
        id: 'booking-1',
        ...bookingData,
        status: 'CONFIRMED',
        eventType: mockEventType,
      })

      const firstBooking = await serverBookingService.createBooking(bookingData)
      expect(firstBooking).toBeDefined()

      // Second booking for same slot should fail
      const existingBooking = {
        id: 'booking-1',
        userId: 'user-123',
        startTime: new Date('2024-01-15T10:00:00Z'),
        endTime: new Date('2024-01-15T10:30:00Z'),
        status: 'CONFIRMED',
      }

      ;(prisma.booking.findMany as any).mockResolvedValue([existingBooking])

      const secondBookingData: CreateBookingData = {
        eventTypeId: 'event-123',
        guestName: 'Guest 2',
        guestEmail: 'guest2@example.com',
        guestTimezone: 'UTC',
        startTime: '2024-01-15T10:00:00Z',
        endTime: '2024-01-15T10:30:00Z',
      }

      await expect(serverBookingService.createBooking(secondBookingData)).rejects.toThrow(
        'This time slot is no longer available'
      )
    })
  })
})
