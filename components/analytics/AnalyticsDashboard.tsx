'use client'

import { useState, useEffect } from 'react'
import { MetricsCard } from './MetricsCard'
import { BookingChart } from './BookingChart'
import { EventTypePerformance } from './EventTypePerformance'
import { RevenueChart } from './RevenueChart'
import { ExportDialog } from './ExportDialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import {
  analyticsService,
  BookingMetrics,
  BookingTrend,
  EventTypeStats,
  RevenueMetrics,
  DateRange,
} from '@/services/analytics-service'

interface AnalyticsDashboardProps {
  userId: string
}

type DateRangePreset = 'last7days' | 'last30days' | 'thisMonth' | 'lastMonth'

export function AnalyticsDashboard({ userId }: AnalyticsDashboardProps) {
  const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>('last30days')
  const [dateRange, setDateRange] = useState<DateRange>(() => ({
    startDate: subDays(new Date(), 30),
    endDate: new Date(),
  }))
  
  const [bookingMetrics, setBookingMetrics] = useState<BookingMetrics | null>(null)
  const [bookingTrends, setBookingTrends] = useState<BookingTrend[]>([])
  const [eventTypeStats, setEventTypeStats] = useState<EventTypeStats[]>([])
  const [revenueMetrics, setRevenueMetrics] = useState<RevenueMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const newDateRange = getDateRangeFromPreset(dateRangePreset)
    setDateRange(newDateRange)
  }, [dateRangePreset])

  useEffect(() => {
    loadAnalytics()
  }, [userId, dateRange])

  const getDateRangeFromPreset = (preset: DateRangePreset): DateRange => {
    const now = new Date()
    
    switch (preset) {
      case 'last7days':
        return { startDate: subDays(now, 7), endDate: now }
      case 'last30days':
        return { startDate: subDays(now, 30), endDate: now }
      case 'thisMonth':
        return { startDate: startOfMonth(now), endDate: endOfMonth(now) }
      case 'lastMonth':
        const lastMonth = subMonths(now, 1)
        return { startDate: startOfMonth(lastMonth), endDate: endOfMonth(lastMonth) }
      default:
        return { startDate: subDays(now, 30), endDate: now }
    }
  }

  const loadAnalytics = async () => {
    setIsLoading(true)
    try {
      const [metrics, trends, eventStats, revenue] = await Promise.all([
        analyticsService.getBookingMetrics(userId, dateRange),
        analyticsService.getBookingTrends(userId, dateRange),
        analyticsService.getEventTypeStats(userId, dateRange),
        analyticsService.getRevenueMetrics(userId, dateRange),
      ])

      setBookingMetrics(metrics)
      setBookingTrends(trends)
      setEventTypeStats(eventStats)
      setRevenueMetrics(revenue)
    } catch (error) {
      console.error('Failed to load analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading analytics...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Date Range Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
          <p className="text-muted-foreground">
            Track your booking performance and revenue
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={dateRangePreset}
            onValueChange={(value) => setDateRangePreset(value as DateRangePreset)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last7days">Last 7 days</SelectItem>
              <SelectItem value="last30days">Last 30 days</SelectItem>
              <SelectItem value="thisMonth">This month</SelectItem>
              <SelectItem value="lastMonth">Last month</SelectItem>
            </SelectContent>
          </Select>
          <ExportDialog userId={userId} />
          <Button variant="outline" onClick={loadAnalytics}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      {bookingMetrics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricsCard
            title="Total Bookings"
            value={bookingMetrics.totalBookings}
            description="All bookings in period"
          />
          <MetricsCard
            title="Confirmed"
            value={bookingMetrics.confirmedBookings}
            description={`${((bookingMetrics.confirmedBookings / (bookingMetrics.totalBookings || 1)) * 100).toFixed(1)}% of total`}
          />
          <MetricsCard
            title="Cancellation Rate"
            value={`${bookingMetrics.cancellationRate}%`}
            description={`${bookingMetrics.cancelledBookings} cancelled`}
          />
          <MetricsCard
            title="Upcoming"
            value={bookingMetrics.upcomingBookings}
            description="Future bookings"
          />
        </div>
      )}

      {/* Booking Trends Chart */}
      <BookingChart data={bookingTrends} />

      {/* Revenue Analytics */}
      {revenueMetrics && revenueMetrics.totalRevenue > 0 && (
        <RevenueChart data={revenueMetrics} />
      )}

      {/* Event Type Performance */}
      <EventTypePerformance data={eventTypeStats} />
    </div>
  )
}
