import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

export interface CalendarEvent {
  id: string;
  summary: string;
  start: Date;
  end: Date;
  status?: string;
}

export interface GoogleCalendarConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export class GoogleCalendarService {
  private oauth2Client: OAuth2Client;

  constructor(config: GoogleCalendarConfig) {
    this.oauth2Client = new google.auth.OAuth2(
      config.clientId,
      config.clientSecret,
      config.redirectUri
    );
  }

  /**
   * Generate OAuth authorization URL
   */
  getAuthorizationUrl(state?: string): string {
    const scopes = [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events',
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
      state,
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async getTokensFromCode(code: string) {
    const { tokens } = await this.oauth2Client.getToken(code);
    return {
      accessToken: tokens.access_token!,
      refreshToken: tokens.refresh_token || null,
      expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
    };
  }

  /**
   * Set credentials for authenticated requests
   */
  setCredentials(accessToken: string, refreshToken?: string | null) {
    this.oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken || undefined,
    });
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string) {
    this.oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    const { credentials } = await this.oauth2Client.refreshAccessToken();
    
    return {
      accessToken: credentials.access_token!,
      expiresAt: credentials.expiry_date ? new Date(credentials.expiry_date) : null,
    };
  }

  /**
   * Get list of user's calendars
   */
  async listCalendars() {
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
    
    const response = await calendar.calendarList.list();
    
    return response.data.items?.map(cal => ({
      id: cal.id!,
      name: cal.summary!,
      primary: cal.primary || false,
      accessRole: cal.accessRole,
    })) || [];
  }

  /**
   * Get calendar events within a time range
   */
  async getEvents(
    calendarId: string,
    timeMin: Date,
    timeMax: Date
  ): Promise<CalendarEvent[]> {
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
    
    const response = await calendar.events.list({
      calendarId,
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    return response.data.items?.map(event => ({
      id: event.id!,
      summary: event.summary || 'Busy',
      start: new Date(event.start?.dateTime || event.start?.date!),
      end: new Date(event.end?.dateTime || event.end?.date!),
      status: event.status || undefined,
    })) || [];
  }

  /**
   * Check if a time slot conflicts with existing events
   */
  async hasConflict(
    calendarId: string,
    startTime: Date,
    endTime: Date
  ): Promise<boolean> {
    const events = await this.getEvents(calendarId, startTime, endTime);
    
    // Filter out cancelled events
    const activeEvents = events.filter(event => event.status !== 'cancelled');
    
    // Check if any event overlaps with the requested time slot
    return activeEvents.some(event => {
      const eventStart = event.start.getTime();
      const eventEnd = event.end.getTime();
      const slotStart = startTime.getTime();
      const slotEnd = endTime.getTime();
      
      // Check for overlap: event starts before slot ends AND event ends after slot starts
      return eventStart < slotEnd && eventEnd > slotStart;
    });
  }

  /**
   * Create a calendar event
   */
  async createEvent(
    calendarId: string,
    event: {
      summary: string;
      description?: string;
      start: Date;
      end: Date;
      attendees?: string[];
      location?: string;
      conferenceData?: any;
    }
  ) {
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
    
    const response = await calendar.events.insert({
      calendarId,
      conferenceDataVersion: event.conferenceData ? 1 : undefined,
      requestBody: {
        summary: event.summary,
        description: event.description,
        start: {
          dateTime: event.start.toISOString(),
          timeZone: 'UTC',
        },
        end: {
          dateTime: event.end.toISOString(),
          timeZone: 'UTC',
        },
        attendees: event.attendees?.map(email => ({ email })),
        location: event.location,
        conferenceData: event.conferenceData,
      },
    });

    return {
      id: response.data.id!,
      htmlLink: response.data.htmlLink,
      hangoutLink: response.data.hangoutLink,
    };
  }

  /**
   * Get user's primary calendar info
   */
  async getPrimaryCalendar() {
    const calendars = await this.listCalendars();
    return calendars.find(cal => cal.primary) || calendars[0];
  }
}
