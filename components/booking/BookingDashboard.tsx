'use client'

import { useState, useMemo } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isBefore, startOfDay } from 'date-fns'
import { Calendar as CalendarIcon, List, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BookingWithRelations } from '@/services/booking-service'
import BookingListItem from './BookingListItem'
import BookingDetailsModal from './BookingDetailsModal'

interface BookingDashboardProps {
  bookings: BookingWithRelations[]
  onRefresh?: () => void
}

type BookingFilter = 'all' | 'upcoming' | 'past' | 'cancelled'
type SortField = 'date' | 'guest' | 'event'
type SortOrder = 'asc' | 'desc'

export default function BookingDashboard({ bookings, onRefresh }: BookingDashboardProps) {
  const [view, setView] = useState<'list' | 'calendar'>('list')
  const [filter, setFilter] = useState<BookingFilter>('upcoming')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const [selectedBooking, setSelectedBooking] = useState<BookingWithRelations | null>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())

  // Filter bookings
  const filteredBookings = useMemo(() => {
    const now = new Date()
    let filtered = bookings

    // Apply status filter
    switch (filter) {
      case 'upcoming':
        filtered = filtered.filter(
          (b) => b.status !== 'CANCELLED' && new Date(b.startTime) >= now
        )
        break
      case 'past':
        filtered = filtered.filter(
          (b) => b.status !== 'CANCELLED' && new Date(b.startTime) < now
        )
        break
      case 'cancelled':
        filtered = filtered.filter((b) => b.status === 'CANCELLED')
        break
      // 'all' shows everything
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (b) =>
          b.guestName.toLowerCase().includes(query) ||
          b.guestEmail.toLowerCase().includes(query) ||
          b.eventType.title.toLowerCase().includes(query)
      )
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0

      switch (sortField) {
        case 'date':
          comparison = new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
          break
        case 'guest':
          comparison = a.guestName.localeCompare(b.guestName)
          break
        case 'event':
          comparison = a.eventType.title.localeCompare(b.eventType.title)
          break
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })

    return filtered
  }, [bookings, filter, searchQuery, sortField, sortOrder])

  // Get bookings for calendar view
  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    return eachDayOfInterval({ start, end })
  }, [currentMonth])

  const getBookingsForDay = (day: Date) => {
    return filteredBookings.filter((booking) =>
      isSameDay(new Date(booking.startTime), day)
    )
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Bookings</h1>
          <p className="text-gray-600 mt-1">Manage your scheduled meetings</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={view === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('list')}
          >
            <List className="h-4 w-4 mr-2" />
            List
          </Button>
          <Button
            variant={view === 'calendar' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('calendar')}
          >
            <CalendarIcon className="h-4 w-4 mr-2" />
            Calendar
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{bookings.length}</div>
            <p className="text-sm text-gray-600">Total Bookings</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {bookings.filter((b) => b.status !== 'CANCELLED' && new Date(b.startTime) >= new Date()).length}
            </div>
            <p className="text-sm text-gray-600">Upcoming</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {bookings.filter((b) => b.status !== 'CANCELLED' && new Date(b.startTime) < new Date()).length}
            </div>
            <p className="text-sm text-gray-600">Past</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {bookings.filter((b) => b.status === 'CANCELLED').length}
            </div>
            <p className="text-sm text-gray-600">Cancelled</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Filter Tabs */}
            <Tabs value={filter} onValueChange={(v: string) => setFilter(v as BookingFilter)} className="flex-1">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="past">Past</TabsTrigger>
                <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by guest or event..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {view === 'list' ? (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>
                {filteredBookings.length} {filteredBookings.length === 1 ? 'Booking' : 'Bookings'}
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('date')}
                  className="text-sm"
                >
                  Date {sortField === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('guest')}
                  className="text-sm"
                >
                  Guest {sortField === 'guest' && (sortOrder === 'asc' ? '↑' : '↓')}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('event')}
                  className="text-sm"
                >
                  Event {sortField === 'event' && (sortOrder === 'asc' ? '↑' : '↓')}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredBookings.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No bookings found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredBookings.map((booking) => (
                  <BookingListItem
                    key={booking.id}
                    booking={booking}
                    onClick={() => setSelectedBooking(booking)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>{format(currentMonth, 'MMMM yyyy')}</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={previousMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())}>
                  Today
                </Button>
                <Button variant="outline" size="sm" onClick={nextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {/* Day headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
                  {day}
                </div>
              ))}

              {/* Calendar days */}
              {calendarDays.map((day) => {
                const dayBookings = getBookingsForDay(day)
                const isPast = isBefore(day, startOfDay(new Date())) && !isToday(day)

                return (
                  <div
                    key={day.toISOString()}
                    className={`min-h-24 border rounded-lg p-2 ${
                      isToday(day) ? 'bg-blue-50 border-blue-300' : 'bg-white'
                    } ${isPast ? 'opacity-50' : ''}`}
                  >
                    <div className="text-sm font-medium mb-1">{format(day, 'd')}</div>
                    <div className="space-y-1">
                      {dayBookings.slice(0, 3).map((booking) => (
                        <button
                          key={booking.id}
                          onClick={() => setSelectedBooking(booking)}
                          className="w-full text-left text-xs p-1 rounded bg-blue-100 hover:bg-blue-200 truncate"
                        >
                          {format(new Date(booking.startTime), 'h:mm a')} - {booking.guestName}
                        </button>
                      ))}
                      {dayBookings.length > 3 && (
                        <div className="text-xs text-gray-500 pl-1">+{dayBookings.length - 3} more</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Booking Details Modal */}
      {selectedBooking && (
        <BookingDetailsModal
          booking={selectedBooking}
          open={!!selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onRefresh={onRefresh}
        />
      )}
    </div>
  )
}
