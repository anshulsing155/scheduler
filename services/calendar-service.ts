import { prisma } from '@/lib/prisma';
import { GoogleCalendarService } from '@/lib/calendar/google-calendar';
import { OutlookCalendarService } from '@/lib/calendar/outlook-calendar';
import { CalendarProvider } from '@prisma/client';

export interface ConnectCalendarResult {
  id: string;
  provider: CalendarProvider;
  calendarId: string;
  calendarName: string;
}

export interface CalendarConflict {
  hasConflict: boolean;
  conflictingEvents?: Array<{
    summary: string;
    start: Date;
    end: Date;
  }>;
}

/**
 * Calendar Service - Unified interface for calendar integrations
 */
export class CalendarService {
  /**
   * Connect Google Calendar
   */
  async connectGoogleCalendar(
    userId: string,
    authCode: string
  ): Promise<ConnectCalendarResult> {
    const googleService = new GoogleCalendarService({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      redirectUri: `${process.env.NEXTAUTH_URL}/api/calendar/google/callback`,
    });

    // Exchange code for tokens
    const tokens = await googleService.getTokensFromCode(authCode);
    
    // Set credentials and get calendar info
    googleService.setCredentials(tokens.accessToken, tokens.refreshToken);
    const primaryCalendar = await googleService.getPrimaryCalendar();

    if (!primaryCalendar) {
      throw new Error('No calendar found');
    }

    // Store in database
    const connectedCalendar = await prisma.connectedCalendar.create({
      data: {
        userId,
        provider: CalendarProvider.GOOGLE,
        providerAccountId: primaryCalendar.id,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt,
        calendarId: primaryCalendar.id,
        calendarName: primaryCalendar.name,
        isPrimary: true,
      },
    });

    return {
      id: connectedCalendar.id,
      provider: connectedCalendar.provider,
      calendarId: connectedCalendar.calendarId,
      calendarName: connectedCalendar.calendarName,
    };
  }

  /**
   * Connect Microsoft Outlook Calendar
   */
  async connectOutlookCalendar(
    userId: string,
    authCode: string
  ): Promise<ConnectCalendarResult> {
    const outlookService = new OutlookCalendarService({
      clientId: process.env.MICROSOFT_CLIENT_ID!,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
      tenantId: 'common',
      redirectUri: `${process.env.NEXTAUTH_URL}/api/calendar/outlook/callback`,
    });

    // Exchange code for tokens
    const tokens = await outlookService.getTokensFromCode(authCode);
    
    // Set access token and get calendar info
    outlookService.setAccessToken(tokens.accessToken);
    const primaryCalendar = await outlookService.getPrimaryCalendar();

    if (!primaryCalendar) {
      throw new Error('No calendar found');
    }

    // Store in database
    const connectedCalendar = await prisma.connectedCalendar.create({
      data: {
        userId,
        provider: CalendarProvider.OUTLOOK,
        providerAccountId: primaryCalendar.id,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt,
        calendarId: primaryCalendar.id,
        calendarName: primaryCalendar.name,
        isPrimary: true,
      },
    });

    return {
      id: connectedCalendar.id,
      provider: connectedCalendar.provider,
      calendarId: connectedCalendar.calendarId,
      calendarName: connectedCalendar.calendarName,
    };
  }

  /**
   * Get user's connected calendars
   */
  async getConnectedCalendars(userId: string) {
    return prisma.connectedCalendar.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Disconnect a calendar
   */
  async disconnectCalendar(userId: string, calendarId: string) {
    await prisma.connectedCalendar.delete({
      where: {
        id: calendarId,
        userId, // Ensure user owns this calendar
      },
    });
  }

  /**
   * Check for conflicts across all connected calendars
   */
  async checkAvailability(
    userId: string,
    startTime: Date,
    endTime: Date
  ): Promise<CalendarConflict> {
    const connectedCalendars = await prisma.connectedCalendar.findMany({
      where: { userId },
    });

    if (connectedCalendars.length === 0) {
      return { hasConflict: false };
    }

    const conflictingEvents: Array<{
      summary: string;
      start: Date;
      end: Date;
    }> = [];

    for (const calendar of connectedCalendars) {
      try {
        let hasConflict = false;

        if (calendar.provider === CalendarProvider.GOOGLE) {
          const result = await this.checkGoogleCalendarConflict(
            calendar,
            startTime,
            endTime
          );
          hasConflict = result.hasConflict;
          if (result.events) {
            conflictingEvents.push(...result.events);
          }
        } else if (calendar.provider === CalendarProvider.OUTLOOK) {
          const result = await this.checkOutlookCalendarConflict(
            calendar,
            startTime,
            endTime
          );
          hasConflict = result.hasConflict;
          if (result.events) {
            conflictingEvents.push(...result.events);
          }
        }

        if (hasConflict) {
          return {
            hasConflict: true,
            conflictingEvents,
          };
        }
      } catch (error) {
        console.error(`Error checking calendar ${calendar.id}:`, error);
        // Continue checking other calendars even if one fails
      }
    }

    return {
      hasConflict: conflictingEvents.length > 0,
      conflictingEvents: conflictingEvents.length > 0 ? conflictingEvents : undefined,
    };
  }

  /**
   * Check Google Calendar for conflicts
   */
  private async checkGoogleCalendarConflict(
    calendar: any,
    startTime: Date,
    endTime: Date
  ) {
    const googleService = new GoogleCalendarService({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      redirectUri: `${process.env.NEXTAUTH_URL}/api/calendar/google/callback`,
    });

    // Check if token needs refresh
    if (calendar.expiresAt && new Date(calendar.expiresAt) < new Date()) {
      if (!calendar.refreshToken) {
        throw new Error('Token expired and no refresh token available');
      }

      const newTokens = await googleService.refreshAccessToken(calendar.refreshToken);
      
      // Update tokens in database
      await prisma.connectedCalendar.update({
        where: { id: calendar.id },
        data: {
          accessToken: newTokens.accessToken,
          expiresAt: newTokens.expiresAt,
        },
      });

      googleService.setCredentials(newTokens.accessToken, calendar.refreshToken);
    } else {
      googleService.setCredentials(calendar.accessToken, calendar.refreshToken);
    }

    const events = await googleService.getEvents(
      calendar.calendarId,
      startTime,
      endTime
    );

    const activeEvents = events.filter(event => event.status !== 'cancelled');
    
    const conflicts = activeEvents.filter(event => {
      const eventStart = event.start.getTime();
      const eventEnd = event.end.getTime();
      const slotStart = startTime.getTime();
      const slotEnd = endTime.getTime();
      
      return eventStart < slotEnd && eventEnd > slotStart;
    });

    return {
      hasConflict: conflicts.length > 0,
      events: conflicts.map(e => ({
        summary: e.summary,
        start: e.start,
        end: e.end,
      })),
    };
  }

  /**
   * Check Outlook Calendar for conflicts
   */
  private async checkOutlookCalendarConflict(
    calendar: any,
    startTime: Date,
    endTime: Date
  ) {
    const outlookService = new OutlookCalendarService({
      clientId: process.env.MICROSOFT_CLIENT_ID!,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
      tenantId: 'common',
      redirectUri: `${process.env.NEXTAUTH_URL}/api/calendar/outlook/callback`,
    });

    // Check if token needs refresh
    if (calendar.expiresAt && new Date(calendar.expiresAt) < new Date()) {
      if (!calendar.refreshToken) {
        throw new Error('Token expired and no refresh token available');
      }

      const newTokens = await outlookService.refreshAccessToken(calendar.refreshToken);
      
      // Update tokens in database
      await prisma.connectedCalendar.update({
        where: { id: calendar.id },
        data: {
          accessToken: newTokens.accessToken,
          expiresAt: newTokens.expiresAt,
        },
      });

      outlookService.setAccessToken(newTokens.accessToken);
    } else {
      outlookService.setAccessToken(calendar.accessToken);
    }

    const events = await outlookService.getEvents(
      calendar.calendarId,
      startTime,
      endTime
    );

    const activeEvents = events.filter(event => event.status !== 'cancelled');
    
    const conflicts = activeEvents.filter(event => {
      const eventStart = event.start.getTime();
      const eventEnd = event.end.getTime();
      const slotStart = startTime.getTime();
      const slotEnd = endTime.getTime();
      
      return eventStart < slotEnd && eventEnd > slotStart;
    });

    return {
      hasConflict: conflicts.length > 0,
      events: conflicts.map(e => ({
        summary: e.subject,
        start: e.start,
        end: e.end,
      })),
    };
  }

  /**
   * Create event in connected calendar
   */
  async createCalendarEvent(
    userId: string,
    eventData: {
      summary: string;
      description?: string;
      start: Date;
      end: Date;
      attendees?: string[];
      location?: string;
    }
  ) {
    // Get primary calendar
    const primaryCalendar = await prisma.connectedCalendar.findFirst({
      where: {
        userId,
        isPrimary: true,
      },
    });

    if (!primaryCalendar) {
      throw new Error('No primary calendar connected');
    }

    if (primaryCalendar.provider === CalendarProvider.GOOGLE) {
      return this.createGoogleCalendarEvent(primaryCalendar, eventData);
    } else if (primaryCalendar.provider === CalendarProvider.OUTLOOK) {
      return this.createOutlookCalendarEvent(primaryCalendar, eventData);
    }

    throw new Error('Unsupported calendar provider');
  }

  /**
   * Create event in Google Calendar
   */
  private async createGoogleCalendarEvent(
    calendar: any,
    eventData: {
      summary: string;
      description?: string;
      start: Date;
      end: Date;
      attendees?: string[];
      location?: string;
    }
  ) {
    const googleService = new GoogleCalendarService({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      redirectUri: `${process.env.NEXTAUTH_URL}/api/calendar/google/callback`,
    });

    // Refresh token if needed
    if (calendar.expiresAt && new Date(calendar.expiresAt) < new Date()) {
      if (!calendar.refreshToken) {
        throw new Error('Token expired and no refresh token available');
      }

      const newTokens = await googleService.refreshAccessToken(calendar.refreshToken);
      
      await prisma.connectedCalendar.update({
        where: { id: calendar.id },
        data: {
          accessToken: newTokens.accessToken,
          expiresAt: newTokens.expiresAt,
        },
      });

      googleService.setCredentials(newTokens.accessToken, calendar.refreshToken);
    } else {
      googleService.setCredentials(calendar.accessToken, calendar.refreshToken);
    }

    return googleService.createEvent(calendar.calendarId, eventData);
  }

  /**
   * Create event in Outlook Calendar
   */
  private async createOutlookCalendarEvent(
    calendar: any,
    eventData: {
      summary: string;
      description?: string;
      start: Date;
      end: Date;
      attendees?: string[];
      location?: string;
    }
  ) {
    const outlookService = new OutlookCalendarService({
      clientId: process.env.MICROSOFT_CLIENT_ID!,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
      tenantId: 'common',
      redirectUri: `${process.env.NEXTAUTH_URL}/api/calendar/outlook/callback`,
    });

    // Refresh token if needed
    if (calendar.expiresAt && new Date(calendar.expiresAt) < new Date()) {
      if (!calendar.refreshToken) {
        throw new Error('Token expired and no refresh token available');
      }

      const newTokens = await outlookService.refreshAccessToken(calendar.refreshToken);
      
      await prisma.connectedCalendar.update({
        where: { id: calendar.id },
        data: {
          accessToken: newTokens.accessToken,
          expiresAt: newTokens.expiresAt,
        },
      });

      outlookService.setAccessToken(newTokens.accessToken);
    } else {
      outlookService.setAccessToken(calendar.accessToken);
    }

    return outlookService.createEvent(calendar.calendarId, {
      subject: eventData.summary,
      body: eventData.description,
      start: eventData.start,
      end: eventData.end,
      attendees: eventData.attendees,
      location: eventData.location,
    });
  }

  /**
   * Sync calendar events for a user
   */
  async syncCalendarEvents(userId: string, days: number = 30) {
    const connectedCalendars = await prisma.connectedCalendar.findMany({
      where: { userId },
    });

    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const allEvents = [];

    for (const calendar of connectedCalendars) {
      try {
        if (calendar.provider === CalendarProvider.GOOGLE) {
          const googleService = new GoogleCalendarService({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            redirectUri: `${process.env.NEXTAUTH_URL}/api/calendar/google/callback`,
          });

          googleService.setCredentials(calendar.accessToken, calendar.refreshToken);
          const events = await googleService.getEvents(
            calendar.calendarId,
            now,
            futureDate
          );

          allEvents.push(...events.map(e => ({
            ...e,
            provider: calendar.provider,
            calendarName: calendar.calendarName,
          })));
        } else if (calendar.provider === CalendarProvider.OUTLOOK) {
          const outlookService = new OutlookCalendarService({
            clientId: process.env.MICROSOFT_CLIENT_ID!,
            clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
            tenantId: 'common',
            redirectUri: `${process.env.NEXTAUTH_URL}/api/calendar/outlook/callback`,
          });

          outlookService.setAccessToken(calendar.accessToken);
          const events = await outlookService.getEvents(
            calendar.calendarId,
            now,
            futureDate
          );

          allEvents.push(...events.map(e => ({
            id: e.id,
            summary: e.subject,
            start: e.start,
            end: e.end,
            status: e.status,
            provider: calendar.provider,
            calendarName: calendar.calendarName,
          })));
        }
      } catch (error) {
        console.error(`Error syncing calendar ${calendar.id}:`, error);
      }
    }

    return allEvents;
  }
}

// Export singleton instance
export const calendarService = new CalendarService();
