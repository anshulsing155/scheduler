import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { addMinutes, format, parse, startOfDay, endOfDay, isWithinInterval, parseISO } from 'date-fns'
import { toZonedTime, fromZonedTime } from 'date-fns-tz'
import { cache, CacheKeys, CacheTTL } from '@/lib/cache'
import { cacheInvalidation } from '@/lib/cache-invalidation'

/**
 * Validation Schemas
 */

export const weeklyScheduleSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)'),
})

export const dateOverrideSchema = z.object({
  date: z.date(),
  isAvailable: z.boolean(),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)').optional(),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)').optional(),
})

export const bulkAvailabilitySchema = z.object({
  schedule: z.array(weeklyScheduleSchema),
})

export type WeeklySchedule = z.infer<typeof weeklyScheduleSchema>
export type DateOverride = z.infer<typeof dateOverrideSchema>
export type BulkAvailability = z.infer<typeof bulkAvailabilitySchema>

export type AvailabilitySlot = {
  start: Date
  end: Date
  available: boolean
}

export type TimeSlot = {
  startTime: string // ISO string
  endTime: string // ISO string
  available: boolean
}

export type ServiceResult<T = any> = {
  success: boolean
  data?: T
  error?: string
}

/**
 * Client-side availability service
 */
export const availabilityService = {
  /**
   * Get user's weekly availability schedule
   */
  async getWeeklySchedule(userId: string): Promise<ServiceResult<WeeklySchedule[]>> {
    try {
      const response = await fetch(`/api/availability/${userId}/schedule`)

      if (!response.ok) {
        const error = await response.json()
        return {
          success: false,
          error: error.error || 'Failed to fetch schedule',
        }
      }

      const data = await response.json()

      return {
        success: true,
        data: data.schedule,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      }
    }
  },

  /**
   * Set user's weekly availability schedule
   */
  async setWeeklySchedule(userId: string, schedule: WeeklySchedule[]): Promise<ServiceResult<WeeklySchedule[]>> {
    try {
      // Validate schedule
      const validatedSchedule = bulkAvailabilitySchema.parse({ schedule })

      const response = await fetch(`/api/availability/${userId}/schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validatedSchedule),
      })

      if (!response.ok) {
        const error = await response.json()
        return {
          success: false,
          error: error.error || 'Failed to update schedule',
        }
      }

      const data = await response.json()

      return {
        success: true,
        data: data.schedule,
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
   * Get user's date overrides
   */
  async getDateOverrides(userId: string, startDate?: Date, endDate?: Date): Promise<ServiceResult<DateOverride[]>> {
    try {
      const params = new URLSearchParams()
      if (startDate) params.append('startDate', startDate.toISOString())
      if (endDate) params.append('endDate', endDate.toISOString())

      const response = await fetch(`/api/availability/${userId}/overrides?${params.toString()}`)

      if (!response.ok) {
        const error = await response.json()
        return {
          success: false,
          error: error.error || 'Failed to fetch date overrides',
        }
      }

      const data = await response.json()

      return {
        success: true,
        data: data.overrides,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      }
    }
  },

  /**
   * Add or update a date override
   */
  async setDateOverride(userId: string, override: DateOverride): Promise<ServiceResult<DateOverride>> {
    try {
      // Validate override
      const validatedOverride = dateOverrideSchema.parse(override)

      const response = await fetch(`/api/availability/${userId}/overrides`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validatedOverride),
      })

      if (!response.ok) {
        const error = await response.json()
        return {
          success: false,
          error: error.error || 'Failed to set date override',
        }
      }

      const data = await response.json()

      return {
        success: true,
        data: data.override,
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
   * Delete a date override
   */
  async deleteDateOverride(userId: string, date: Date): Promise<ServiceResult<void>> {
    try {
      const response = await fetch(`/api/availability/${userId}/overrides`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ date: date.toISOString() }),
      })

      if (!response.ok) {
        const error = await response.json()
        return {
          success: false,
          error: error.error || 'Failed to delete date override',
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
   * Get available time slots for a specific date
   */
  async getAvailableSlots(
    userId: string,
    date: Date,
    duration: number,
    timezone: string
  ): Promise<ServiceResult<TimeSlot[]>> {
    try {
      const params = new URLSearchParams({
        date: date.toISOString(),
        duration: duration.toString(),
        timezone,
      })

      const response = await fetch(`/api/availability/${userId}/slots?${params.toString()}`)

      if (!response.ok) {
        const error = await response.json()
        return {
          success: false,
          error: error.error || 'Failed to fetch available slots',
        }
      }

      const data = await response.json()

      return {
        success: true,
        data: data.slots,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      }
    }
  },

  /**
   * Check if a specific time slot is available
   */
  async checkSlotAvailability(
    userId: string,
    startTime: Date,
    duration: number
  ): Promise<ServiceResult<{ available: boolean }>> {
    try {
      const response = await fetch(`/api/availability/${userId}/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startTime: startTime.toISOString(),
          duration,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        return {
          success: false,
          error: error.error || 'Failed to check availability',
        }
      }

      const data = await response.json()

      return {
        success: true,
        data: { available: data.available },
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
 * Server-side availability service
 */
export const serverAvailabilityService = {
  /**
   * Get user's weekly availability schedule
   */
  async getWeeklySchedule(userId: string): Promise<WeeklySchedule[]> {
    try {
      // Try to get from cache first
      return await cache.getOrSet(
        CacheKeys.userWeeklySchedule(userId),
        async () => {
          const availability = await prisma.availability.findMany({
            where: { userId },
            orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
          })

          return availability.map((a) => ({
            dayOfWeek: a.dayOfWeek,
            startTime: a.startTime,
            endTime: a.endTime,
          }))
        },
        CacheTTL.MEDIUM
      )
    } catch (error) {
      console.error('Error fetching weekly schedule:', error)
      return []
    }
  },

  /**
   * Set user's weekly availability schedule (replaces existing)
   */
  async setWeeklySchedule(userId: string, schedule: WeeklySchedule[]): Promise<WeeklySchedule[]> {
    try {
      // Validate all schedule items
      schedule.forEach((item) => weeklyScheduleSchema.parse(item))

      // Delete existing schedule
      await prisma.availability.deleteMany({
        where: { userId },
      })

      // Create new schedule
      await prisma.availability.createMany({
        data: schedule.map((item) => ({
          userId,
          dayOfWeek: item.dayOfWeek,
          startTime: item.startTime,
          endTime: item.endTime,
        })),
      })

      // Invalidate availability cache
      await cacheInvalidation.invalidateAvailability(userId)

      return schedule
    } catch (error) {
      console.error('Error setting weekly schedule:', error)
      throw error
    }
  },

  /**
   * Get user's date overrides within a date range
   */
  async getDateOverrides(userId: string, startDate?: Date, endDate?: Date): Promise<any[]> {
    try {
      const cacheKey = CacheKeys.userDateOverrides(
        userId,
        startDate?.toISOString() || 'all',
        endDate?.toISOString() || 'all'
      )

      return await cache.getOrSet(
        cacheKey,
        async () => {
          const where: any = { userId }

          if (startDate || endDate) {
            where.date = {}
            if (startDate) where.date.gte = startDate
            if (endDate) where.date.lte = endDate
          }

          const overrides = await prisma.dateOverride.findMany({
            where,
            orderBy: { date: 'asc' },
          })

          return overrides
        },
        CacheTTL.MEDIUM
      )
    } catch (error) {
      console.error('Error fetching date overrides:', error)
      return []
    }
  },

  /**
   * Add or update a date override
   */
  async setDateOverride(userId: string, override: DateOverride): Promise<any> {
    try {
      // Validate override
      dateOverrideSchema.parse(override)

      // Check if override exists
      const existing = await prisma.dateOverride.findFirst({
        where: {
          userId,
          date: override.date,
        },
      })

      let result
      if (existing) {
        // Update existing override
        result = await prisma.dateOverride.update({
          where: { id: existing.id },
          data: {
            isAvailable: override.isAvailable,
            startTime: override.startTime,
            endTime: override.endTime,
          },
        })
      } else {
        // Create new override
        result = await prisma.dateOverride.create({
          data: {
            userId,
            date: override.date,
            isAvailable: override.isAvailable,
            startTime: override.startTime,
            endTime: override.endTime,
          },
        })
      }

      // Invalidate availability cache
      await cacheInvalidation.invalidateAvailability(userId)

      return result
    } catch (error) {
      console.error('Error setting date override:', error)
      throw error
    }
  },

  /**
   * Delete a date override
   */
  async deleteDateOverride(userId: string, date: Date): Promise<boolean> {
    try {
      const existing = await prisma.dateOverride.findFirst({
        where: {
          userId,
          date,
        },
      })

      if (existing) {
        await prisma.dateOverride.delete({
          where: { id: existing.id },
        })
      }

      // Invalidate availability cache
      await cacheInvalidation.invalidateAvailability(userId)

      return true
    } catch (error) {
      console.error('Error deleting date override:', error)
      return false
    }
  },

  /**
   * Get available time slots for a specific date
   */
  async getAvailableSlots(
    userId: string,
    date: Date,
    duration: number,
    timezone: string,
    eventTypeId?: string
  ): Promise<TimeSlot[]> {
    try {
      // Create cache key
      const cacheKey = CacheKeys.userAvailability(
        userId,
        `${date.toISOString()}-${duration}-${timezone}-${eventTypeId || 'none'}`
      )

      return await cache.getOrSet(
        cacheKey,
        async () => this.calculateAvailableSlots(userId, date, duration, timezone, eventTypeId),
        CacheTTL.SHORT // Short TTL since availability can change frequently
      )
    } catch (error) {
      console.error('Error getting available slots:', error)
      return []
    }
  },

  /**
   * Calculate available time slots (extracted for caching)
   */
  async calculateAvailableSlots(
    userId: string,
    date: Date,
    duration: number,
    timezone: string,
    eventTypeId?: string
  ): Promise<TimeSlot[]> {
    try {
      // Get user's timezone
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { timezone: true },
      })

      if (!user) {
        return []
      }

      const userTimezone = user.timezone

      // Convert date to user's timezone
      const zonedDate = toZonedTime(date, timezone)
      const dayOfWeek = zonedDate.getDay()

      // Check for date override first
      const override = await prisma.dateOverride.findFirst({
        where: {
          userId,
          date: startOfDay(zonedDate),
        },
      })

      let availabilityWindows: { startTime: string; endTime: string }[] = []

      if (override) {
        // Use override availability
        if (override.isAvailable && override.startTime && override.endTime) {
          availabilityWindows = [
            {
              startTime: override.startTime,
              endTime: override.endTime,
            },
          ]
        }
        // If override exists but isAvailable is false, no slots available
      } else {
        // Use weekly schedule
        const weeklyAvailability = await prisma.availability.findMany({
          where: {
            userId,
            dayOfWeek,
          },
          orderBy: { startTime: 'asc' },
        })

        availabilityWindows = weeklyAvailability.map((a) => ({
          startTime: a.startTime,
          endTime: a.endTime,
        }))
      }

      // Get existing bookings for the date
      const startOfDayDate = startOfDay(zonedDate)
      const endOfDayDate = endOfDay(zonedDate)

      const bookings = await prisma.booking.findMany({
        where: {
          userId,
          status: {
            in: ['PENDING', 'CONFIRMED'],
          },
          startTime: {
            gte: fromZonedTime(startOfDayDate, userTimezone),
            lte: fromZonedTime(endOfDayDate, userTimezone),
          },
        },
        select: {
          startTime: true,
          endTime: true,
          eventType: {
            select: {
              bufferTimeBefore: true,
              bufferTimeAfter: true,
            },
          },
        },
      })

      // Get buffer times for the event type if provided
      let bufferBefore = 0
      let bufferAfter = 0

      if (eventTypeId) {
        const eventType = await prisma.eventType.findUnique({
          where: { id: eventTypeId },
          select: {
            bufferTimeBefore: true,
            bufferTimeAfter: true,
          },
        })

        if (eventType) {
          bufferBefore = eventType.bufferTimeBefore
          bufferAfter = eventType.bufferTimeAfter
        }
      }

      // Generate time slots
      const slots: TimeSlot[] = []
      const slotInterval = 15 // 15-minute intervals

      for (const window of availabilityWindows) {
        // Parse start and end times
        const [startHour, startMinute] = window.startTime.split(':').map(Number)
        const [endHour, endMinute] = window.endTime.split(':').map(Number)

        let currentSlot = new Date(zonedDate)
        currentSlot.setHours(startHour, startMinute, 0, 0)

        const windowEnd = new Date(zonedDate)
        windowEnd.setHours(endHour, endMinute, 0, 0)

        while (currentSlot < windowEnd) {
          const slotEnd = addMinutes(currentSlot, duration)

          // Check if slot end is within the availability window
          if (slotEnd <= windowEnd) {
            // Check if slot conflicts with any booking (including buffers)
            const hasConflict = bookings.some((booking) => {
              const bookingStart = addMinutes(
                toZonedTime(booking.startTime, userTimezone),
                -booking.eventType.bufferTimeBefore
              )
              const bookingEnd = addMinutes(
                toZonedTime(booking.endTime, userTimezone),
                booking.eventType.bufferTimeAfter
              )

              // Check if the slot overlaps with the booking (including buffers)
              return (
                (currentSlot >= bookingStart && currentSlot < bookingEnd) ||
                (slotEnd > bookingStart && slotEnd <= bookingEnd) ||
                (currentSlot <= bookingStart && slotEnd >= bookingEnd)
              )
            })

            // Convert slot times to requested timezone
            const slotStartInTimezone = fromZonedTime(currentSlot, userTimezone)
            const slotEndInTimezone = fromZonedTime(slotEnd, userTimezone)

            slots.push({
              startTime: toZonedTime(slotStartInTimezone, timezone).toISOString(),
              endTime: toZonedTime(slotEndInTimezone, timezone).toISOString(),
              available: !hasConflict,
            })
          }

          currentSlot = addMinutes(currentSlot, slotInterval)
        }
      }

      return slots.filter((slot) => slot.available)
    } catch (error) {
      console.error('Error getting available slots:', error)
      return []
    }
  },

  /**
   * Check if a specific time slot is available
   */
  async checkSlotAvailability(userId: string, startTime: Date, duration: number): Promise<boolean> {
    try {
      const endTime = addMinutes(startTime, duration)

      // Get user's timezone
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { timezone: true },
      })

      if (!user) {
        return false
      }

      const userTimezone = user.timezone
      const zonedStartTime = toZonedTime(startTime, userTimezone)
      const dayOfWeek = zonedStartTime.getDay()

      // Check for date override
      const override = await prisma.dateOverride.findFirst({
        where: {
          userId,
          date: startOfDay(zonedStartTime),
        },
      })

      let isWithinAvailability = false

      if (override) {
        // Check override availability
        if (override.isAvailable && override.startTime && override.endTime) {
          const [startHour, startMinute] = override.startTime.split(':').map(Number)
          const [endHour, endMinute] = override.endTime.split(':').map(Number)

          const availStart = new Date(zonedStartTime)
          availStart.setHours(startHour, startMinute, 0, 0)

          const availEnd = new Date(zonedStartTime)
          availEnd.setHours(endHour, endMinute, 0, 0)

          isWithinAvailability =
            zonedStartTime >= availStart && addMinutes(zonedStartTime, duration) <= availEnd
        }
      } else {
        // Check weekly schedule
        const weeklyAvailability = await prisma.availability.findMany({
          where: {
            userId,
            dayOfWeek,
          },
        })

        isWithinAvailability = weeklyAvailability.some((avail) => {
          const [startHour, startMinute] = avail.startTime.split(':').map(Number)
          const [endHour, endMinute] = avail.endTime.split(':').map(Number)

          const availStart = new Date(zonedStartTime)
          availStart.setHours(startHour, startMinute, 0, 0)

          const availEnd = new Date(zonedStartTime)
          availEnd.setHours(endHour, endMinute, 0, 0)

          return zonedStartTime >= availStart && addMinutes(zonedStartTime, duration) <= availEnd
        })
      }

      if (!isWithinAvailability) {
        return false
      }

      // Check for booking conflicts
      const bookings = await prisma.booking.findMany({
        where: {
          userId,
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

      return bookings.length === 0
    } catch (error) {
      console.error('Error checking slot availability:', error)
      return false
    }
  },

  /**
   * Get availability for a date range (for calendar view)
   */
  async getAvailability(userId: string, startDate: Date, endDate: Date): Promise<AvailabilitySlot[]> {
    try {
      const schedule = await this.getWeeklySchedule(userId)
      const overrides = await this.getDateOverrides(userId, startDate, endDate)

      const slots: AvailabilitySlot[] = []

      // Process each day in the range
      let currentDate = new Date(startDate)
      while (currentDate <= endDate) {
        const dayOfWeek = currentDate.getDay()

        // Check for override
        const override = overrides.find(
          (o) => startOfDay(o.date).getTime() === startOfDay(currentDate).getTime()
        )

        if (override) {
          if (override.isAvailable && override.startTime && override.endTime) {
            const [startHour, startMinute] = override.startTime.split(':').map(Number)
            const [endHour, endMinute] = override.endTime.split(':').map(Number)

            const start = new Date(currentDate)
            start.setHours(startHour, startMinute, 0, 0)

            const end = new Date(currentDate)
            end.setHours(endHour, endMinute, 0, 0)

            slots.push({ start, end, available: true })
          }
        } else {
          // Use weekly schedule
          const daySchedule = schedule.filter((s) => s.dayOfWeek === dayOfWeek)

          daySchedule.forEach((s) => {
            const [startHour, startMinute] = s.startTime.split(':').map(Number)
            const [endHour, endMinute] = s.endTime.split(':').map(Number)

            const start = new Date(currentDate)
            start.setHours(startHour, startMinute, 0, 0)

            const end = new Date(currentDate)
            end.setHours(endHour, endMinute, 0, 0)

            slots.push({ start, end, available: true })
          })
        }

        currentDate = addMinutes(currentDate, 24 * 60) // Next day
      }

      return slots
    } catch (error) {
      console.error('Error getting availability:', error)
      return []
    }
  },
}
