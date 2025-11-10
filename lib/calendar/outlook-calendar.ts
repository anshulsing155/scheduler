import { Client } from '@microsoft/microsoft-graph-client';
import { ClientSecretCredential } from '@azure/identity';

export interface OutlookCalendarEvent {
  id: string;
  subject: string;
  start: Date;
  end: Date;
  status?: string;
}

export interface OutlookCalendarConfig {
  clientId: string;
  clientSecret: string;
  tenantId: string;
  redirectUri: string;
}

export class OutlookCalendarService {
  private config: OutlookCalendarConfig;
  private accessToken?: string;

  constructor(config: OutlookCalendarConfig) {
    this.config = config;
  }

  /**
   * Generate OAuth authorization URL
   */
  getAuthorizationUrl(state?: string): string {
    const scopes = [
      'Calendars.Read',
      'Calendars.ReadWrite',
      'offline_access',
    ].join(' ');

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      response_type: 'code',
      redirect_uri: this.config.redirectUri,
      response_mode: 'query',
      scope: scopes,
      state: state || '',
    });

    return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  async getTokensFromCode(code: string) {
    const tokenEndpoint = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
    
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      code,
      redirect_uri: this.config.redirectUri,
      grant_type: 'authorization_code',
    });

    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get tokens: ${error}`);
    }

    const data = await response.json();

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || null,
      expiresAt: data.expires_in 
        ? new Date(Date.now() + data.expires_in * 1000) 
        : null,
    };
  }

  /**
   * Set access token for authenticated requests
   */
  setAccessToken(accessToken: string) {
    this.accessToken = accessToken;
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string) {
    const tokenEndpoint = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
    
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    });

    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to refresh token: ${error}`);
    }

    const data = await response.json();

    return {
      accessToken: data.access_token,
      expiresAt: data.expires_in 
        ? new Date(Date.now() + data.expires_in * 1000) 
        : null,
    };
  }

  /**
   * Get Microsoft Graph client
   */
  private getClient(): Client {
    if (!this.accessToken) {
      throw new Error('Access token not set');
    }

    return Client.init({
      authProvider: (done) => {
        done(null, this.accessToken!);
      },
    });
  }

  /**
   * Get list of user's calendars
   */
  async listCalendars() {
    const client = this.getClient();
    
    const response = await client
      .api('/me/calendars')
      .get();

    return response.value.map((cal: { id: string; name: string; isDefaultCalendar?: boolean; canEdit?: boolean }) => ({
      id: cal.id,
      name: cal.name,
      primary: cal.isDefaultCalendar || false,
      canEdit: cal.canEdit,
    }));
  }

  /**
   * Get calendar events within a time range
   */
  async getEvents(
    calendarId: string,
    timeMin: Date,
    timeMax: Date
  ): Promise<OutlookCalendarEvent[]> {
    const client = this.getClient();
    
    const response = await client
      .api(`/me/calendars/${calendarId}/calendarView`)
      .query({
        startDateTime: timeMin.toISOString(),
        endDateTime: timeMax.toISOString(),
      })
      .orderby('start/dateTime')
      .get();

    return response.value.map((event: any) => ({
      id: event.id,
      subject: event.subject || 'Busy',
      start: new Date(event.start.dateTime + 'Z'), // Add Z for UTC
      end: new Date(event.end.dateTime + 'Z'),
      status: event.isCancelled ? 'cancelled' : 'confirmed',
    }));
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
      
      // Check for overlap
      return eventStart < slotEnd && eventEnd > slotStart;
    });
  }

  /**
   * Create a calendar event
   */
  async createEvent(
    calendarId: string,
    event: {
      subject: string;
      body?: string;
      start: Date;
      end: Date;
      attendees?: string[];
      location?: string;
      isOnlineMeeting?: boolean;
    }
  ) {
    const client = this.getClient();
    
    const eventData: any = {
      subject: event.subject,
      body: event.body ? {
        contentType: 'HTML',
        content: event.body,
      } : undefined,
      start: {
        dateTime: event.start.toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: event.end.toISOString(),
        timeZone: 'UTC',
      },
      attendees: event.attendees?.map(email => ({
        emailAddress: { address: email },
        type: 'required',
      })),
      location: event.location ? {
        displayName: event.location,
      } : undefined,
      isOnlineMeeting: event.isOnlineMeeting || false,
    };

    const response = await client
      .api(`/me/calendars/${calendarId}/events`)
      .post(eventData);

    return {
      id: response.id,
      webLink: response.webLink,
      onlineMeetingUrl: response.onlineMeeting?.joinUrl,
    };
  }

  /**
   * Get user's primary calendar
   */
  async getPrimaryCalendar() {
    const calendars = await this.listCalendars();
    return calendars.find((cal: { primary: boolean }) => cal.primary) || calendars[0];
  }
}
