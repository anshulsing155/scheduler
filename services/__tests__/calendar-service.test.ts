import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CalendarService } from '../calendar-service'
import { prisma } from '@/lib/prisma'
import { CalendarProvider } from '@prisma/client'

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    connectedCalendar: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
    },
  },
}))

// Mock calendar services
const mockGoogleService = {
  getTokensFromCode: vi.fn(),
  setCredentials: vi.fn(),
  getPrimaryCalendar: vi.fn(),
  refreshAccessToken: vi.fn(),
  getEvents: vi.fn(),
}

const mockOutlookService = {
  getTokensFromCode: vi.fn(),
  setAccessToken: vi.fn(),
  getPrimaryCalendar: vi.fn(),
  refreshAccessToken: vi.fn(),
  getEvents: vi.fn(),
}

vi.mock('@/lib/calendar/google-calendar', () => ({
  GoogleCalendarService: vi.fn(() => mockGoogleService),
}))

vi.mock('@/lib/calendar/outlook-calendar', () => ({
  OutlookCalendarService: vi.fn(() => mockOutlookService),
}))

describe('CalendarService - OAuth Flows', () => {
  let calendarService: CalendarService

  beforeEach(() => {
    vi.clearAllMocks()
    calendarService = new CalendarService()
  })

  describe('Google Calendar OAuth', () => {
    it('should connect Google Calendar successfully', async () => {
      const userId = 'user-123'
      const authCode = 'auth-code'
      
      mockGoogleService.getTokensFromCode.mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresAt: new Date('2025-12-31'),
      })
      
      mockGoogleService.getPrimaryCalendar.mockResolvedValue({
        id: 'primary',
        name: 'Primary Calendar',
      })
      
      ;(prisma.connectedCalendar.create as any).mockResolvedValue({
        id: 'calendar-1',
        userId,
        provider: CalendarProvider.GOOGLE,
        calendarId: 'primary',
        calendarName: 'Primary Calendar',
      })

      const result = await calendarService.connectGoogleCalendar(userId, authCode)

      expect(mockGoogleService.getTokensFromCode).toHaveBeenCalledWith(authCode)
      expect(mockGoogleService.getPrimaryCalendar).toHaveBeenCalled()
      expect(result.provider).toBe(CalendarProvider.GOOGLE)
    })

    it('should throw error when no calendar found', async () => {
      mockGoogleService.getTokensFromCode.mockResolvedValue({
        accessToken: 'token',
        refreshToken: 'refresh',
        expiresAt: new Date(),
      })
      
      mockGoogleService.getPrimaryCalendar.mockResolvedValue(null)

      await expect(
        calendarService.connectGoogleCalendar('user-123', 'code')
      ).rejects.toThrow('No calendar found')
    })
  })

  describe('Outlook Calendar OAuth', () => {
    it('should connect Outlook Calendar successfully', async () => {
      const userId = 'user-456'
      const authCode = 'outlook-code'
      
      mockOutlookService.getTokensFromCode.mockResolvedValue({
        accessToken: 'outlook-token',
        refreshToken: 'outlook-refresh',
        expiresAt: new Date('2025-12-31'),
      })
      
      mockOutlookService.getPrimaryCalendar.mockResolvedValue({
        id: 'outlook-primary',
        name: 'Calendar',
      })
      
      ;(prisma.connectedCalendar.create as any).mockResolvedValue({
        id: 'calendar-2',
        userId,
        provider: CalendarProvider.OUTLOOK,
        calendarId: 'outlook-primary',
        calendarName: 'Calendar',
      })

      const result = await calendarService.connectOutlookCalendar(userId, authCode)

      expect(mockOutlookService.getTokensFromCode).toHaveBeenCalledWith(authCode)
      expect(result.provider).toBe(CalendarProvider.OUTLOOK)
    })
  })
})

describe('CalendarService - Conflict Detection', () => {
  let calendarService: CalendarService

  beforeEach(() => {
    vi.clearAllMocks()
    calendarService = new CalendarService()
  })

  it('should detect conflict in Google Calendar', async () => {
    const userId = 'user-123'
    const startTime = new Date('2024-01-15T10:00:00Z')
    const endTime = new Date('2024-01-15T11:00:00Z')

    ;(prisma.connectedCalendar.findMany as any).mockResolvedValue([{
      id: 'calendar-1',
      userId,
      provider: CalendarProvider.GOOGLE,
      calendarId: 'primary',
      accessToken: 'token',
      refreshToken: 'refresh',
      expiresAt: new Date('2025-12-31'),
    }])

    mockGoogleService.getEvents.mockResolvedValue([{
      id: 'event-1',
      summary: 'Existing Meeting',
      start: new Date('2024-01-15T10:30:00Z'),
      end: new Date('2024-01-15T11:30:00Z'),
      status: 'confirmed',
    }])

    const result = await calendarService.checkAvailability(userId, startTime, endTime)

    expect(result.hasConflict).toBe(true)
    expect(result.conflictingEvents).toHaveLength(1)
  })

  it('should not detect conflict when no overlap', async () => {
    const userId = 'user-123'
    const startTime = new Date('2024-01-15T10:00:00Z')
    const endTime = new Date('2024-01-15T11:00:00Z')

    ;(prisma.connectedCalendar.findMany as any).mockResolvedValue([{
      id: 'calendar-1',
      userId,
      provider: CalendarProvider.GOOGLE,
      calendarId: 'primary',
      accessToken: 'token',
      refreshToken: 'refresh',
      expiresAt: new Date('2025-12-31'),
    }])

    mockGoogleService.getEvents.mockResolvedValue([{
      id: 'event-1',
      summary: 'Earlier Meeting',
      start: new Date('2024-01-15T08:00:00Z'),
      end: new Date('2024-01-15T09:00:00Z'),
      status: 'confirmed',
    }])

    const result = await calendarService.checkAvailability(userId, startTime, endTime)

    expect(result.hasConflict).toBe(false)
  })

  it('should ignore cancelled events', async () => {
    const userId = 'user-123'
    const startTime = new Date('2024-01-15T10:00:00Z')
    const endTime = new Date('2024-01-15T11:00:00Z')

    ;(prisma.connectedCalendar.findMany as any).mockResolvedValue([{
      id: 'calendar-1',
      userId,
      provider: CalendarProvider.GOOGLE,
      calendarId: 'primary',
      accessToken: 'token',
      refreshToken: 'refresh',
      expiresAt: new Date('2025-12-31'),
    }])

    mockGoogleService.getEvents.mockResolvedValue([{
      id: 'event-1',
      summary: 'Cancelled Meeting',
      start: new Date('2024-01-15T10:00:00Z'),
      end: new Date('2024-01-15T11:00:00Z'),
      status: 'cancelled',
    }])

    const result = await calendarService.checkAvailability(userId, startTime, endTime)

    expect(result.hasConflict).toBe(false)
  })

  it('should refresh expired tokens', async () => {
    const userId = 'user-123'
    const startTime = new Date('2024-01-15T10:00:00Z')
    const endTime = new Date('2024-01-15T11:00:00Z')

    ;(prisma.connectedCalendar.findMany as any).mockResolvedValue([{
      id: 'calendar-1',
      userId,
      provider: CalendarProvider.GOOGLE,
      calendarId: 'primary',
      accessToken: 'old-token',
      refreshToken: 'refresh-token',
      expiresAt: new Date('2023-01-01'), // Expired
    }])

    mockGoogleService.refreshAccessToken.mockResolvedValue({
      accessToken: 'new-token',
      expiresAt: new Date('2025-12-31'),
    })

    mockGoogleService.getEvents.mockResolvedValue([])
    ;(prisma.connectedCalendar.update as any).mockResolvedValue({})

    await calendarService.checkAvailability(userId, startTime, endTime)

    expect(mockGoogleService.refreshAccessToken).toHaveBeenCalledWith('refresh-token')
    expect(prisma.connectedCalendar.update).toHaveBeenCalled()
  })

  it('should check multiple calendars', async () => {
    const userId = 'user-123'
    const startTime = new Date('2024-01-15T10:00:00Z')
    const endTime = new Date('2024-01-15T11:00:00Z')

    ;(prisma.connectedCalendar.findMany as any).mockResolvedValue([
      {
        id: 'calendar-1',
        userId,
        provider: CalendarProvider.GOOGLE,
        calendarId: 'google-primary',
        accessToken: 'google-token',
        refreshToken: 'google-refresh',
        expiresAt: new Date('2025-12-31'),
      },
      {
        id: 'calendar-2',
        userId,
        provider: CalendarProvider.OUTLOOK,
        calendarId: 'outlook-primary',
        accessToken: 'outlook-token',
        refreshToken: 'outlook-refresh',
        expiresAt: new Date('2025-12-31'),
      },
    ])

    mockGoogleService.getEvents.mockResolvedValue([])
    mockOutlookService.getEvents.mockResolvedValue([{
      id: 'outlook-event',
      subject: 'Conflict Event',
      start: new Date('2024-01-15T10:15:00Z'),
      end: new Date('2024-01-15T10:45:00Z'),
      status: 'confirmed',
    }])

    const result = await calendarService.checkAvailability(userId, startTime, endTime)

    expect(result.hasConflict).toBe(true)
  })

  it('should return no conflict when no calendars connected', async () => {
    ;(prisma.connectedCalendar.findMany as any).mockResolvedValue([])

    const result = await calendarService.checkAvailability(
      'user-123',
      new Date(),
      new Date()
    )

    expect(result.hasConflict).toBe(false)
  })
})

describe('CalendarService - Calendar Sync', () => {
  let calendarService: CalendarService

  beforeEach(() => {
    vi.clearAllMocks()
    calendarService = new CalendarService()
  })

  it('should sync events from Google Calendar', async () => {
    const userId = 'user-123'

    ;(prisma.connectedCalendar.findMany as any).mockResolvedValue([{
      id: 'calendar-1',
      userId,
      provider: CalendarProvider.GOOGLE,
      calendarId: 'primary',
      calendarName: 'Primary Calendar',
      accessToken: 'token',
      refreshToken: 'refresh',
    }])

    mockGoogleService.getEvents.mockResolvedValue([
      {
        id: 'event-1',
        summary: 'Meeting 1',
        start: new Date('2024-01-15T10:00:00Z'),
        end: new Date('2024-01-15T11:00:00Z'),
        status: 'confirmed',
      },
      {
        id: 'event-2',
        summary: 'Meeting 2',
        start: new Date('2024-01-16T14:00:00Z'),
        end: new Date('2024-01-16T15:00:00Z'),
        status: 'confirmed',
      },
    ])

    const result = await calendarService.syncCalendarEvents(userId, 30)

    expect(result).toHaveLength(2)
    expect(result[0].summary).toBe('Meeting 1')
    expect(result[0].provider).toBe(CalendarProvider.GOOGLE)
  })

  it('should sync events from Outlook Calendar', async () => {
    const userId = 'user-456'

    ;(prisma.connectedCalendar.findMany as any).mockResolvedValue([{
      id: 'calendar-2',
      userId,
      provider: CalendarProvider.OUTLOOK,
      calendarId: 'outlook-primary',
      calendarName: 'Work Calendar',
      accessToken: 'outlook-token',
      refreshToken: 'outlook-refresh',
    }])

    mockOutlookService.getEvents.mockResolvedValue([{
      id: 'outlook-event-1',
      subject: 'Team Meeting',
      start: new Date('2024-01-15T09:00:00Z'),
      end: new Date('2024-01-15T10:00:00Z'),
      status: 'confirmed',
    }])

    const result = await calendarService.syncCalendarEvents(userId, 30)

    expect(result).toHaveLength(1)
    expect(result[0].summary).toBe('Team Meeting')
    expect(result[0].provider).toBe(CalendarProvider.OUTLOOK)
  })

  it('should sync from multiple calendars', async () => {
    const userId = 'user-789'

    ;(prisma.connectedCalendar.findMany as any).mockResolvedValue([
      {
        id: 'calendar-1',
        userId,
        provider: CalendarProvider.GOOGLE,
        calendarId: 'google-primary',
        calendarName: 'Google Calendar',
        accessToken: 'google-token',
        refreshToken: 'google-refresh',
      },
      {
        id: 'calendar-2',
        userId,
        provider: CalendarProvider.OUTLOOK,
        calendarId: 'outlook-primary',
        calendarName: 'Outlook Calendar',
        accessToken: 'outlook-token',
        refreshToken: 'outlook-refresh',
      },
    ])

    mockGoogleService.getEvents.mockResolvedValue([{
      id: 'google-event-1',
      summary: 'Google Meeting',
      start: new Date('2024-01-15T10:00:00Z'),
      end: new Date('2024-01-15T11:00:00Z'),
      status: 'confirmed',
    }])

    mockOutlookService.getEvents.mockResolvedValue([{
      id: 'outlook-event-1',
      subject: 'Outlook Meeting',
      start: new Date('2024-01-15T14:00:00Z'),
      end: new Date('2024-01-15T15:00:00Z'),
      status: 'confirmed',
    }])

    const result = await calendarService.syncCalendarEvents(userId, 30)

    expect(result).toHaveLength(2)
    expect(result.some(e => e.provider === CalendarProvider.GOOGLE)).toBe(true)
    expect(result.some(e => e.provider === CalendarProvider.OUTLOOK)).toBe(true)
  })

  it('should handle sync errors gracefully', async () => {
    const userId = 'user-123'

    ;(prisma.connectedCalendar.findMany as any).mockResolvedValue([
      {
        id: 'calendar-1',
        userId,
        provider: CalendarProvider.GOOGLE,
        calendarId: 'google-primary',
        calendarName: 'Google Calendar',
        accessToken: 'google-token',
        refreshToken: 'google-refresh',
      },
      {
        id: 'calendar-2',
        userId,
        provider: CalendarProvider.OUTLOOK,
        calendarId: 'outlook-primary',
        calendarName: 'Outlook Calendar',
        accessToken: 'outlook-token',
        refreshToken: 'outlook-refresh',
      },
    ])

    mockGoogleService.getEvents.mockRejectedValue(new Error('API Error'))
    mockOutlookService.getEvents.mockResolvedValue([{
      id: 'outlook-event-1',
      subject: 'Outlook Meeting',
      start: new Date('2024-01-15T14:00:00Z'),
      end: new Date('2024-01-15T15:00:00Z'),
      status: 'confirmed',
    }])

    const result = await calendarService.syncCalendarEvents(userId, 30)

    // Should still return Outlook events despite Google error
    expect(result).toHaveLength(1)
    expect(result[0].provider).toBe(CalendarProvider.OUTLOOK)
  })

  it('should return empty array when no calendars connected', async () => {
    ;(prisma.connectedCalendar.findMany as any).mockResolvedValue([])

    const result = await calendarService.syncCalendarEvents('user-123', 30)

    expect(result).toEqual([])
  })
})

describe('CalendarService - Calendar Management', () => {
  let calendarService: CalendarService

  beforeEach(() => {
    vi.clearAllMocks()
    calendarService = new CalendarService()
  })

  it('should get connected calendars', async () => {
    const userId = 'user-123'
    const mockCalendars = [
      {
        id: 'calendar-1',
        userId,
        provider: CalendarProvider.GOOGLE,
        calendarId: 'google-primary',
        calendarName: 'Google Calendar',
      },
      {
        id: 'calendar-2',
        userId,
        provider: CalendarProvider.OUTLOOK,
        calendarId: 'outlook-primary',
        calendarName: 'Outlook Calendar',
      },
    ]

    ;(prisma.connectedCalendar.findMany as any).mockResolvedValue(mockCalendars)

    const result = await calendarService.getConnectedCalendars(userId)

    expect(result).toEqual(mockCalendars)
  })

  it('should disconnect calendar', async () => {
    const userId = 'user-123'
    const calendarId = 'calendar-1'

    ;(prisma.connectedCalendar.delete as any).mockResolvedValue({})

    await calendarService.disconnectCalendar(userId, calendarId)

    expect(prisma.connectedCalendar.delete).toHaveBeenCalledWith({
      where: {
        id: calendarId,
        userId,
      },
    })
  })
})
