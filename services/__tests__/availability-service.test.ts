import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { serverAvailabilityService, WeeklySchedule, DateOverride } from '../availability-service'
import { prisma } from '@/lib/prisma'
import { addMinutes, startOfDay } from 'date-fns'
import { toZonedTime, fromZonedTime } from 'date-fns-tz'

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    availability: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    dateOverride: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    booking: {
      findMany: vi.fn(),
    },
    eventType: {
      findUnique: vi.fn(),
    },
  },
}))

describe('serverAvailabilityService - Availability Calculation Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Weekly Schedule Parsing', () => {
    it('should parse and return weekly schedule correctly', async () => {
      const mockSchedule = [
        { id: '1', userId: 'user-123', dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
        { id: '2', userId: 'user-123', dayOfWeek: 2, startTime: '09:00', endTime: '17:00' },
        { id: '3', userId: 'user-123', dayOfWeek: 3, startTime: '10:00', endTime: '16:00' },
      ]

      ;(prisma.availability.findMany as any).mockResolvedValue(mockSchedule)

      const result = await serverAvailabilityService.getWeeklySchedule('user-123')

      expect(result).toHaveLength(3)
      expect(result[0]).toEqual({
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '17:00',
      })
      expect(result[2]).toEqual({
        dayOfWeek: 3,
        startTime: '10:00',
        endTime: '16:00',
      })
    })

    it('should handle empty weekly schedule', async () => {
      ;(prisma.availability.findMany as any).mockResolvedValue([])

      const result = await serverAvailabilityService.getWeeklySchedule('user-123')

      expect(result).toEqual([])
    })

    it('should set weekly schedule and replace existing', async () => {
      const newSchedule: WeeklySchedule[] = [
        { dayOfWeek: 1, startTime: '08:00', endTime: '12:00' },
        { dayOfWeek: 1, startTime: '13:00', endTime: '17:00' },
        { dayOfWeek: 3, startTime: '09:00', endTime: '15:00' },
      ]

      ;(prisma.availability.deleteMany as any).mockResolvedValue({ count: 5 })
      ;(prisma.availability.createMany as any).mockResolvedValue({ count: 3 })

      const result = await serverAvailabilityService.setWeeklySchedule('user-123', newSchedule)

      expect(prisma.availability.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
      })
      expect(prisma.availability.createMany).toHaveBeenCalledWith({
        data: newSchedule.map((item) => ({
          userId: 'user-123',
          dayOfWeek: item.dayOfWeek,
          startTime: item.startTime,
          endTime: item.endTime,
        })),
      })
      expect(result).toEqual(newSchedule)
    })

    it('should handle multiple time slots for same day', async () => {
      const mockSchedule = [
        { id: '1', userId: 'user-123', dayOfWeek: 1, startTime: '09:00', endTime: '12:00' },
        { id: '2', userId: 'user-123', dayOfWeek: 1, startTime: '14:00', endTime: '17:00' },
      ]

      ;(prisma.availability.findMany as any).mockResolvedValue(mockSchedule)

      const result = await serverAvailabilityService.getWeeklySchedule('user-123')

      expect(result).toHaveLength(2)
      expect(result[0].dayOfWeek).toBe(1)
      expect(result[1].dayOfWeek).toBe(1)
    })
  })

  describe('Date Override Priority', () => {
    it('should prioritize date override over weekly schedule', async () => {
      const testDate = new Date('2024-01-15T00:00:00Z') // Monday
      const userId = 'user-123'

      // Mock user with UTC timezone
      ;(prisma.user.findUnique as any).mockResolvedValue({
        id: userId,
        timezone: 'UTC',
      })

      // Mock date override exists
      ;(prisma.dateOverride.findFirst as any).mockResolvedValue({
        id: 'override-1',
        userId,
        date: startOfDay(testDate),
        isAvailable: true,
        startTime: '10:00',
        endTime: '14:00',
      })

      // Mock no bookings
      ;(prisma.booking.findMany as any).mockResolvedValue([])

      const slots = await serverAvailabilityService.getAvailableSlots(
        userId,
        testDate,
        30,
        'UTC'
      )

      // Should use override times (10:00-14:00) not weekly schedule
      expect(slots.length).toBeGreaterThan(0)
      // Check that slots are within the override window
      slots.forEach((slot) => {
        const slotStart = new Date(slot.startTime)
        const hour = slotStart.getUTCHours()
        expect(hour).toBeGreaterThanOrEqual(10)
        expect(hour).toBeLessThan(14)
      })
    })

    it('should use weekly schedule when no override exists', async () => {
      const testDate = new Date('2024-01-15T00:00:00Z') // Monday
      const userId = 'user-123'

      ;(prisma.user.findUnique as any).mockResolvedValue({
        id: userId,
        timezone: 'UTC',
      })

      // No date override
      ;(prisma.dateOverride.findFirst as any).mockResolvedValue(null)

      // Mock weekly availability for Monday (day 1)
      ;(prisma.availability.findMany as any).mockResolvedValue([
        { id: '1', userId, dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
      ])

      ;(prisma.booking.findMany as any).mockResolvedValue([])

      const slots = await serverAvailabilityService.getAvailableSlots(
        userId,
        testDate,
        30,
        'UTC'
      )

      expect(slots.length).toBeGreaterThan(0)
      // Check that slots are within the weekly schedule window
      slots.forEach((slot) => {
        const slotStart = new Date(slot.startTime)
        const hour = slotStart.getUTCHours()
        expect(hour).toBeGreaterThanOrEqual(9)
        expect(hour).toBeLessThan(17)
      })
    })

    it('should return no slots when override marks day as unavailable', async () => {
      const testDate = new Date('2024-01-15T10:00:00Z')
      const userId = 'user-123'

      ;(prisma.user.findUnique as any).mockResolvedValue({
        id: userId,
        timezone: 'UTC',
      })

      // Override marks day as unavailable
      ;(prisma.dateOverride.findFirst as any).mockResolvedValue({
        id: 'override-1',
        userId,
        date: startOfDay(testDate),
        isAvailable: false,
        startTime: null,
        endTime: null,
      })

      const slots = await serverAvailabilityService.getAvailableSlots(
        userId,
        testDate,
        30,
        'UTC'
      )

      expect(slots).toEqual([])
    })

    it('should handle override with partial availability', async () => {
      const testDate = new Date('2024-01-15T00:00:00Z')
      const userId = 'user-123'

      ;(prisma.user.findUnique as any).mockResolvedValue({
        id: userId,
        timezone: 'UTC',
      })

      // Override with limited hours
      ;(prisma.dateOverride.findFirst as any).mockResolvedValue({
        id: 'override-1',
        userId,
        date: startOfDay(testDate),
        isAvailable: true,
        startTime: '11:00',
        endTime: '13:00',
      })

      ;(prisma.booking.findMany as any).mockResolvedValue([])

      const slots = await serverAvailabilityService.getAvailableSlots(
        userId,
        testDate,
        30,
        'UTC'
      )

      // Should only have slots between 11:00 and 13:00
      expect(slots.length).toBeGreaterThan(0)
      // Verify all slots fall within the override window
      const slotHours = slots.map((slot) => new Date(slot.startTime).getUTCHours())
      const allInRange = slotHours.every((hour) => hour >= 11 && hour < 13)
      expect(allInRange).toBe(true)
    })
  })

  describe('Timezone Conversion for Availability', () => {
    it('should convert availability to requested timezone', async () => {
      const testDate = new Date('2024-01-15T00:00:00Z')
      const userId = 'user-123'

      // User in New York timezone
      ;(prisma.user.findUnique as any).mockResolvedValue({
        id: userId,
        timezone: 'America/New_York',
      })

      ;(prisma.dateOverride.findFirst as any).mockResolvedValue(null)

      // Weekly schedule: 9 AM - 5 PM in user's timezone
      ;(prisma.availability.findMany as any).mockResolvedValue([
        { id: '1', userId, dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
      ])

      ;(prisma.booking.findMany as any).mockResolvedValue([])

      // Request slots in UTC
      const slots = await serverAvailabilityService.getAvailableSlots(
        userId,
        testDate,
        30,
        'UTC'
      )

      expect(slots.length).toBeGreaterThan(0)
      // Verify slots are returned in UTC
      slots.forEach((slot) => {
        expect(slot.startTime).toMatch(/Z$/)
        expect(slot.endTime).toMatch(/Z$/)
      })
    })

    it('should handle timezone conversion for different regions', async () => {
      const testDate = new Date('2024-01-15T00:00:00Z')
      const userId = 'user-123'

      // User in Tokyo timezone
      ;(prisma.user.findUnique as any).mockResolvedValue({
        id: userId,
        timezone: 'Asia/Tokyo',
      })

      ;(prisma.dateOverride.findFirst as any).mockResolvedValue(null)

      ;(prisma.availability.findMany as any).mockResolvedValue([
        { id: '1', userId, dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
      ])

      ;(prisma.booking.findMany as any).mockResolvedValue([])

      // Request in Los Angeles timezone
      const slots = await serverAvailabilityService.getAvailableSlots(
        userId,
        testDate,
        30,
        'America/Los_Angeles'
      )

      expect(slots.length).toBeGreaterThan(0)
    })

    it('should correctly check slot availability across timezones', async () => {
      const userId = 'user-123'
      
      // User in UTC
      ;(prisma.user.findUnique as any).mockResolvedValue({
        id: userId,
        timezone: 'UTC',
      })

      // Available Monday 9 AM - 5 PM UTC
      ;(prisma.availability.findMany as any).mockResolvedValue([
        { id: '1', userId, dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
      ])

      ;(prisma.dateOverride.findFirst as any).mockResolvedValue(null)
      ;(prisma.booking.findMany as any).mockResolvedValue([])

      // Check slot at 10 AM UTC on Monday
      const slotTime = new Date('2024-01-15T10:00:00Z')
      const isAvailable = await serverAvailabilityService.checkSlotAvailability(
        userId,
        slotTime,
        30
      )

      expect(isAvailable).toBe(true)
    })

    it('should handle DST transitions correctly', async () => {
      const userId = 'user-123'
      
      // User in timezone with DST
      ;(prisma.user.findUnique as any).mockResolvedValue({
        id: userId,
        timezone: 'America/New_York',
      })

      ;(prisma.availability.findMany as any).mockResolvedValue([
        { id: '1', userId, dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
      ])

      ;(prisma.dateOverride.findFirst as any).mockResolvedValue(null)
      ;(prisma.booking.findMany as any).mockResolvedValue([])

      // Date during DST
      const dstDate = new Date('2024-07-15T00:00:00Z')
      const slots = await serverAvailabilityService.getAvailableSlots(
        userId,
        dstDate,
        30,
        'UTC'
      )

      expect(slots.length).toBeGreaterThan(0)
    })
  })

  describe('Slot Generation Algorithm', () => {
    it('should generate slots at 15-minute intervals', async () => {
      const testDate = new Date('2024-01-15T00:00:00Z')
      const userId = 'user-123'

      ;(prisma.user.findUnique as any).mockResolvedValue({
        id: userId,
        timezone: 'UTC',
      })

      ;(prisma.dateOverride.findFirst as any).mockResolvedValue(null)

      // 2-hour availability window
      ;(prisma.availability.findMany as any).mockResolvedValue([
        { id: '1', userId, dayOfWeek: 1, startTime: '10:00', endTime: '12:00' },
      ])

      ;(prisma.booking.findMany as any).mockResolvedValue([])

      const slots = await serverAvailabilityService.getAvailableSlots(
        userId,
        testDate,
        30, // 30-minute duration
        'UTC'
      )

      // Should have slots at 10:00, 10:15, 10:30, 10:45, 11:00, 11:15, 11:30
      // (11:45 would end at 12:15, outside window)
      expect(slots.length).toBe(7)

      // Verify 15-minute intervals
      for (let i = 1; i < slots.length; i++) {
        const prevStart = new Date(slots[i - 1].startTime)
        const currStart = new Date(slots[i].startTime)
        const diff = (currStart.getTime() - prevStart.getTime()) / (1000 * 60)
        expect(diff).toBe(15)
      }
    })

    it('should not generate slots that extend beyond availability window', async () => {
      const testDate = new Date('2024-01-15T00:00:00Z')
      const userId = 'user-123'

      ;(prisma.user.findUnique as any).mockResolvedValue({
        id: userId,
        timezone: 'UTC',
      })

      ;(prisma.dateOverride.findFirst as any).mockResolvedValue(null)

      ;(prisma.availability.findMany as any).mockResolvedValue([
        { id: '1', userId, dayOfWeek: 1, startTime: '10:00', endTime: '11:00' },
      ])

      ;(prisma.booking.findMany as any).mockResolvedValue([])

      // 60-minute duration
      const slots = await serverAvailabilityService.getAvailableSlots(
        userId,
        testDate,
        60,
        'UTC'
      )

      // Only one slot: 10:00-11:00
      expect(slots.length).toBe(1)
      // Verify the slot is within the window
      const slotStart = new Date(slots[0].startTime)
      const slotEnd = new Date(slots[0].endTime)
      expect(slotStart.getUTCHours()).toBeGreaterThanOrEqual(10)
      expect(slotEnd.getUTCHours()).toBeLessThanOrEqual(11)
    })

    it('should exclude slots that conflict with existing bookings', async () => {
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

      // Existing booking from 10:00 to 11:00
      const bookingStart = new Date('2024-01-15T10:00:00Z')
      const bookingEnd = new Date('2024-01-15T11:00:00Z')

      ;(prisma.booking.findMany as any).mockResolvedValue([
        {
          id: 'booking-1',
          userId,
          startTime: bookingStart,
          endTime: bookingEnd,
          status: 'CONFIRMED',
          eventType: {
            bufferTimeBefore: 0,
            bufferTimeAfter: 0,
          },
        },
      ])

      const slots = await serverAvailabilityService.getAvailableSlots(
        userId,
        testDate,
        30,
        'UTC'
      )

      // Verify slots exist but don't overlap with booking
      expect(slots.length).toBeGreaterThan(0)
      
      // Check that no slot overlaps with the 10:00-11:00 booking window
      const hasConflict = slots.some((slot) => {
        const slotStart = new Date(slot.startTime).getTime()
        const slotEnd = new Date(slot.endTime).getTime()
        const bookingStartTime = bookingStart.getTime()
        const bookingEndTime = bookingEnd.getTime()
        
        return (
          (slotStart >= bookingStartTime && slotStart < bookingEndTime) ||
          (slotEnd > bookingStartTime && slotEnd <= bookingEndTime) ||
          (slotStart <= bookingStartTime && slotEnd >= bookingEndTime)
        )
      })
      
      expect(hasConflict).toBe(false)
    })

    it('should respect buffer times around bookings', async () => {
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

      // Booking from 12:00 to 13:00 with 15-minute buffers
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

      const slots = await serverAvailabilityService.getAvailableSlots(
        userId,
        testDate,
        30,
        'UTC'
      )

      // Verify no slots overlap with buffer zone (11:45-13:15)
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

    it('should handle multiple availability windows in same day', async () => {
      const testDate = new Date('2024-01-15T00:00:00Z')
      const userId = 'user-123'

      ;(prisma.user.findUnique as any).mockResolvedValue({
        id: userId,
        timezone: 'UTC',
      })

      ;(prisma.dateOverride.findFirst as any).mockResolvedValue(null)

      // Morning and afternoon sessions
      ;(prisma.availability.findMany as any).mockResolvedValue([
        { id: '1', userId, dayOfWeek: 1, startTime: '09:00', endTime: '12:00' },
        { id: '2', userId, dayOfWeek: 1, startTime: '14:00', endTime: '17:00' },
      ])

      ;(prisma.booking.findMany as any).mockResolvedValue([])

      const slots = await serverAvailabilityService.getAvailableSlots(
        userId,
        testDate,
        30,
        'UTC'
      )

      // Should have slots from both windows
      expect(slots.length).toBeGreaterThan(0)
      
      // Check that we have slots in both time ranges
      const slotHours = slots.map((slot) => new Date(slot.startTime).getUTCHours())
      const hasMorningSlots = slotHours.some((hour) => hour >= 9 && hour < 12)
      const hasAfternoonSlots = slotHours.some((hour) => hour >= 14 && hour < 17)
      
      expect(hasMorningSlots).toBe(true)
      expect(hasAfternoonSlots).toBe(true)
    })

    it('should only return available slots (filter out unavailable)', async () => {
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

      // Multiple bookings
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
          startTime: new Date('2024-01-15T11:00:00Z'),
          endTime: new Date('2024-01-15T12:00:00Z'),
          status: 'CONFIRMED',
          eventType: { bufferTimeBefore: 0, bufferTimeAfter: 0 },
        },
      ])

      const slots = await serverAvailabilityService.getAvailableSlots(
        userId,
        testDate,
        30,
        'UTC'
      )

      // All returned slots should be available
      slots.forEach((slot) => {
        expect(slot.available).toBe(true)
      })

      // Should only have slots from 10:00-11:00 window (between the two bookings)
      expect(slots.length).toBeGreaterThan(0)
      const slotHours = slots.map((slot) => new Date(slot.startTime).getUTCHours())
      const allInValidRange = slotHours.every((hour) => hour >= 10 && hour < 11)
      expect(allInValidRange).toBe(true)
    })
  })
})
