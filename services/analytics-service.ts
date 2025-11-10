import { prisma } from '@/lib/prisma'
import { BookingStatus, PaymentStatus } from '@prisma/client'
import { startOfDay, endOfDay, subDays, eachDayOfInterval, format } from 'date-fns'

export interface DateRange {
  startDate: Date
  endDate: Date
}

export interface BookingMetrics {
  totalBookings: number
  confirmedBookings: number
  cancelledBookings: number
  completedBookings: number
  cancellationRate: number
  noShowRate: number
  upcomingBookings: number
}

export interface BookingTrend {
  date: string
  count: number
  confirmed: number
  cancelled: number
}

export interface EventTypeStats {
  eventTypeId: string
  eventTypeName: string
  totalBookings: number
  confirmedBookings: number
  cancelledBookings: number
  conversionRate: number
  averageLeadTime: number // in hours
  revenue?: number
}

export interface RevenueMetrics {
  totalRevenue: number
  successfulPayments: number
  failedPayments: number
  refundedAmount: number
  currency: string
  revenueByEventType: Array<{
    eventTypeId: string
    eventTypeName: string
    revenue: number
    bookingCount: number
  }>
}

export interface PopularTimeSlot {
  dayOfWeek: number
  hour: number
  count: number
}

/**
 * Client-side analytics service (uses API routes)
 */
export const analyticsService = {
  /**
   * Get comprehensive booking metrics for a user within a date range
   */
  async getBookingMetrics(
    userId: string,
    dateRange: DateRange
  ): Promise<BookingMetrics> {
    const params = new URLSearchParams({
      startDate: dateRange.startDate.toISOString(),
      endDate: dateRange.endDate.toISOString(),
    })

    const response = await fetch(`/api/analytics/metrics?${params}`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch booking metrics')
    }

    return response.json()
  },

  /**
   * Get booking trends over time (daily breakdown)
   */
  async getBookingTrends(
    userId: string,
    dateRange: DateRange
  ): Promise<BookingTrend[]> {
    const params = new URLSearchParams({
      startDate: dateRange.startDate.toISOString(),
      endDate: dateRange.endDate.toISOString(),
    })

    const response = await fetch(`/api/analytics/trends?${params}`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch booking trends')
    }

    return response.json()
  },

  /**
   * Get performance statistics for each event type
   */
  async getEventTypeStats(
    userId: string,
    dateRange: DateRange
  ): Promise<EventTypeStats[]> {
    const params = new URLSearchParams({
      startDate: dateRange.startDate.toISOString(),
      endDate: dateRange.endDate.toISOString(),
    })

    const response = await fetch(`/api/analytics/event-types?${params}`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch event type stats')
    }

    return response.json()
  },

  /**
   * Get revenue metrics and payment analytics
   */
  async getRevenueMetrics(
    userId: string,
    dateRange: DateRange
  ): Promise<RevenueMetrics> {
    const params = new URLSearchParams({
      startDate: dateRange.startDate.toISOString(),
      endDate: dateRange.endDate.toISOString(),
    })

    const response = await fetch(`/api/analytics/revenue?${params}`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch revenue metrics')
    }

    return response.json()
  },

  /**
   * Get popular time slots based on booking patterns
   */
  async getPopularTimeSlots(
    userId: string,
    dateRange: DateRange
  ): Promise<PopularTimeSlot[]> {
    // This would need a separate API route if needed
    // For now, keeping the direct implementation
    const { startDate, endDate } = dateRange

    const bookings = await prisma.booking.findMany({
      where: {
        userId,
        status: BookingStatus.CONFIRMED,
        startTime: {
          gte: startOfDay(startDate),
          lte: endOfDay(endDate),
        },
      },
      select: {
        startTime: true,
      },
    })

    // Group by day of week and hour
    const slotMap = new Map<string, number>()

    bookings.forEach((booking) => {
      const dayOfWeek = booking.startTime.getDay()
      const hour = booking.startTime.getHours()
      const key = `${dayOfWeek}-${hour}`

      slotMap.set(key, (slotMap.get(key) || 0) + 1)
    })

    // Convert to array and sort by count
    const popularSlots = Array.from(slotMap.entries())
      .map(([key, count]) => {
        const [dayOfWeek, hour] = key.split('-').map(Number)
        return { dayOfWeek, hour, count }
      })
      .sort((a, b) => b.count - a.count)

    return popularSlots
  },

  /**
   * Export booking data in a structured format
   */
  async exportBookingData(
    userId: string,
    dateRange: DateRange,
    format: 'json' | 'csv' = 'csv'
  ): Promise<Array<Record<string, any>>> {
    const params = new URLSearchParams({
      startDate: dateRange.startDate.toISOString(),
      endDate: dateRange.endDate.toISOString(),
      format,
    })

    const response = await fetch(`/api/analytics/export?${params}`)
    
    if (!response.ok) {
      throw new Error('Failed to export booking data')
    }

    if (format === 'csv') {
      // Return the CSV as a blob URL for download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'bookings-export.csv'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      return []
    }

    return response.json()
  },
}

/**
 * Server-side analytics service (direct database access)
 */
export const serverAnalyticsService = {
  /**
   * Get comprehensive booking metrics for a user within a date range
   */
  async getBookingMetrics(
    userId: string,
    dateRange: DateRange
  ): Promise<BookingMetrics> {
    const { startDate, endDate } = dateRange

    const bookings = await prisma.booking.findMany({
      where: {
        userId,
        createdAt: {
          gte: startOfDay(startDate),
          lte: endOfDay(endDate),
        },
      },
      select: {
        status: true,
        startTime: true,
      },
    })

    const totalBookings = bookings.length
    const confirmedBookings = bookings.filter(
      (b) => b.status === BookingStatus.CONFIRMED
    ).length
    const cancelledBookings = bookings.filter(
      (b) => b.status === BookingStatus.CANCELLED
    ).length
    const completedBookings = bookings.filter(
      (b) => b.status === BookingStatus.COMPLETED
    ).length
    const noShowBookings = bookings.filter(
      (b) => b.status === BookingStatus.NO_SHOW
    ).length

    const upcomingBookings = bookings.filter(
      (b) =>
        (b.status === BookingStatus.CONFIRMED ||
          b.status === BookingStatus.PENDING) &&
        b.startTime > new Date()
    ).length

    const cancellationRate =
      totalBookings > 0 ? (cancelledBookings / totalBookings) * 100 : 0
    const noShowRate =
      totalBookings > 0 ? (noShowBookings / totalBookings) * 100 : 0

    return {
      totalBookings,
      confirmedBookings,
      cancelledBookings,
      completedBookings,
      cancellationRate: Math.round(cancellationRate * 100) / 100,
      noShowRate: Math.round(noShowRate * 100) / 100,
      upcomingBookings,
    }
  },

  /**
   * Get booking trends over time (daily breakdown)
   */
  async getBookingTrends(
    userId: string,
    dateRange: DateRange
  ): Promise<BookingTrend[]> {
    const { startDate, endDate } = dateRange

    const bookings = await prisma.booking.findMany({
      where: {
        userId,
        createdAt: {
          gte: startOfDay(startDate),
          lte: endOfDay(endDate),
        },
      },
      select: {
        createdAt: true,
        status: true,
      },
    })

    // Create a map of all dates in the range
    const dateMap = new Map<string, BookingTrend>()
    const days = eachDayOfInterval({ start: startDate, end: endDate })

    days.forEach((day) => {
      const dateKey = format(day, 'yyyy-MM-dd')
      dateMap.set(dateKey, {
        date: dateKey,
        count: 0,
        confirmed: 0,
        cancelled: 0,
      })
    })

    // Populate with actual booking data
    bookings.forEach((booking) => {
      const dateKey = format(startOfDay(booking.createdAt), 'yyyy-MM-dd')
      const trend = dateMap.get(dateKey)

      if (trend) {
        trend.count++
        if (booking.status === BookingStatus.CONFIRMED) {
          trend.confirmed++
        } else if (booking.status === BookingStatus.CANCELLED) {
          trend.cancelled++
        }
      }
    })

    return Array.from(dateMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    )
  },

  /**
   * Get performance statistics for each event type
   */
  async getEventTypeStats(
    userId: string,
    dateRange: DateRange
  ): Promise<EventTypeStats[]> {
    const { startDate, endDate } = dateRange

    const eventTypes = await prisma.eventType.findMany({
      where: { userId },
      include: {
        bookings: {
          where: {
            createdAt: {
              gte: startOfDay(startDate),
              lte: endOfDay(endDate),
            },
          },
          include: {
            payment: true,
          },
        },
      },
    })

    return eventTypes.map((eventType) => {
      const totalBookings = eventType.bookings.length
      const confirmedBookings = eventType.bookings.filter(
        (b) => b.status === BookingStatus.CONFIRMED
      ).length
      const cancelledBookings = eventType.bookings.filter(
        (b) => b.status === BookingStatus.CANCELLED
      ).length

      // Calculate average lead time (time between booking creation and start time)
      const leadTimes = eventType.bookings
        .filter((b) => b.status === BookingStatus.CONFIRMED)
        .map((b) => {
          const diff = b.startTime.getTime() - b.createdAt.getTime()
          return diff / (1000 * 60 * 60) // Convert to hours
        })

      const averageLeadTime =
        leadTimes.length > 0
          ? leadTimes.reduce((sum, time) => sum + time, 0) / leadTimes.length
          : 0

      // Calculate conversion rate (confirmed / total)
      const conversionRate =
        totalBookings > 0 ? (confirmedBookings / totalBookings) * 100 : 0

      // Calculate revenue if payments exist
      const revenue = eventType.bookings
        .filter((b) => b.payment?.status === PaymentStatus.SUCCEEDED)
        .reduce((sum, b) => sum + Number(b.payment?.amount || 0), 0)

      return {
        eventTypeId: eventType.id,
        eventTypeName: eventType.title,
        totalBookings,
        confirmedBookings,
        cancelledBookings,
        conversionRate: Math.round(conversionRate * 100) / 100,
        averageLeadTime: Math.round(averageLeadTime * 100) / 100,
        revenue: revenue > 0 ? revenue : undefined,
      }
    })
  },

  /**
   * Get revenue metrics and payment analytics
   */
  async getRevenueMetrics(
    userId: string,
    dateRange: DateRange
  ): Promise<RevenueMetrics> {
    const { startDate, endDate } = dateRange

    const payments = await prisma.payment.findMany({
      where: {
        userId,
        createdAt: {
          gte: startOfDay(startDate),
          lte: endOfDay(endDate),
        },
      },
      include: {
        booking: {
          include: {
            eventType: true,
          },
        },
      },
    })

    const successfulPayments = payments.filter(
      (p) => p.status === PaymentStatus.SUCCEEDED
    )
    const failedPayments = payments.filter(
      (p) => p.status === PaymentStatus.FAILED
    )
    const refundedPayments = payments.filter(
      (p) =>
        p.status === PaymentStatus.REFUNDED ||
        p.status === PaymentStatus.PARTIALLY_REFUNDED
    )

    const totalRevenue = successfulPayments.reduce(
      (sum, p) => sum + Number(p.amount),
      0
    )
    const refundedAmount = refundedPayments.reduce(
      (sum, p) => sum + Number(p.amount),
      0
    )

    // Group revenue by event type
    const revenueByEventTypeMap = new Map<
      string,
      { eventTypeName: string; revenue: number; bookingCount: number }
    >()

    successfulPayments.forEach((payment) => {
      if (payment.booking?.eventType) {
        const eventTypeId = payment.booking.eventType.id
        const existing = revenueByEventTypeMap.get(eventTypeId)

        if (existing) {
          existing.revenue += Number(payment.amount)
          existing.bookingCount++
        } else {
          revenueByEventTypeMap.set(eventTypeId, {
            eventTypeName: payment.booking.eventType.title,
            revenue: Number(payment.amount),
            bookingCount: 1,
          })
        }
      }
    })

    const revenueByEventType = Array.from(
      revenueByEventTypeMap.entries()
    ).map(([eventTypeId, data]) => ({
      eventTypeId,
      ...data,
    }))

    // Get currency from first payment or default to USD
    const currency = payments[0]?.currency || 'USD'

    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      successfulPayments: successfulPayments.length,
      failedPayments: failedPayments.length,
      refundedAmount: Math.round(refundedAmount * 100) / 100,
      currency,
      revenueByEventType,
    }
  },

  /**
   * Export booking data in a structured format
   */
  async exportBookingData(
    userId: string,
    dateRange: DateRange
  ): Promise<Array<Record<string, any>>> {
    const { startDate, endDate } = dateRange

    const bookings = await prisma.booking.findMany({
      where: {
        userId,
        createdAt: {
          gte: startOfDay(startDate),
          lte: endOfDay(endDate),
        },
      },
      include: {
        eventType: true,
        payment: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return bookings.map((booking) => ({
      bookingId: booking.id,
      eventType: booking.eventType.title,
      guestName: booking.guestName,
      guestEmail: booking.guestEmail,
      guestPhone: booking.guestPhone || '',
      startTime: booking.startTime.toISOString(),
      endTime: booking.endTime.toISOString(),
      status: booking.status,
      createdAt: booking.createdAt.toISOString(),
      paymentAmount: booking.payment?.amount
        ? Number(booking.payment.amount)
        : 0,
      paymentStatus: booking.payment?.status || '',
      cancellationReason: booking.cancellationReason || '',
    }))
  },
}
