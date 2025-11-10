# Calendar Integration

This module provides integration with external calendar services (Google Calendar and Microsoft Outlook) to enable availability checking and conflict detection for the scheduling system.

## Features

- **Google Calendar Integration**: OAuth-based connection to Google Calendar
- **Microsoft Outlook Integration**: OAuth-based connection to Microsoft Outlook/Office 365
- **Conflict Detection**: Automatically check for scheduling conflicts across all connected calendars
- **Event Sync**: Sync calendar events to display busy times
- **Token Management**: Automatic token refresh for expired access tokens
- **Event Creation**: Create calendar events when bookings are confirmed

## Setup

### Environment Variables

Add the following environment variables to your `.env` file:

```env
# Google Calendar
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Microsoft Outlook
MICROSOFT_CLIENT_ID="your-microsoft-client-id"
MICROSOFT_CLIENT_SECRET="your-microsoft-client-secret"

# Base URL for OAuth callbacks
NEXTAUTH_URL="http://localhost:3000"
```

### Google Calendar Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Calendar API
4. Create OAuth 2.0 credentials (Web application)
5. Add authorized redirect URI: `http://localhost:3000/api/calendar/google/callback`
6. Copy the Client ID and Client Secret to your `.env` file

### Microsoft Outlook Setup

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to "App registrations"
3. Create a new registration
4. Add redirect URI: `http://localhost:3000/api/calendar/outlook/callback`
5. Under "API permissions", add:
   - `Calendars.Read`
   - `Calendars.ReadWrite`
   - `offline_access`
6. Create a client secret under "Certificates & secrets"
7. Copy the Application (client) ID and client secret to your `.env` file

## Usage

### Connecting a Calendar

Users can connect their calendars through the settings page at `/dashboard/settings/calendars`.

The OAuth flow:
1. User clicks "Connect" button
2. Redirected to provider's authorization page
3. User grants permissions
4. Redirected back to callback URL
5. Calendar is saved to database

### Checking Availability

```typescript
import { calendarService } from '@/services/calendar-service';

// Check if a time slot has conflicts
const result = await calendarService.checkAvailability(
  userId,
  new Date('2024-01-15T10:00:00Z'),
  new Date('2024-01-15T11:00:00Z')
);

if (result.hasConflict) {
  console.log('Time slot is busy');
  console.log('Conflicting events:', result.conflictingEvents);
}
```

### Creating Calendar Events

```typescript
import { calendarService } from '@/services/calendar-service';

// Create event in user's primary calendar
const event = await calendarService.createCalendarEvent(userId, {
  summary: 'Meeting with John',
  description: 'Discuss project requirements',
  start: new Date('2024-01-15T10:00:00Z'),
  end: new Date('2024-01-15T11:00:00Z'),
  attendees: ['john@example.com'],
  location: 'Zoom',
});
```

### Syncing Calendar Events

```typescript
import { calendarService } from '@/services/calendar-service';

// Sync events for the next 30 days
const events = await calendarService.syncCalendarEvents(userId, 30);
console.log(`Synced ${events.length} events`);
```

## API Routes

### Google Calendar

- `GET /api/calendar/google/connect` - Initiate OAuth flow
- `GET /api/calendar/google/callback` - Handle OAuth callback

### Microsoft Outlook

- `GET /api/calendar/outlook/connect` - Initiate OAuth flow
- `GET /api/calendar/outlook/callback` - Handle OAuth callback

### General

- `GET /api/calendar/list` - Get user's connected calendars
- `DELETE /api/calendar/disconnect` - Disconnect a calendar
- `POST /api/calendar/sync` - Sync calendar events

## Components

### CalendarCard

Displays a connected calendar with disconnect option.

```tsx
import { CalendarCard } from '@/components/calendar/calendar-card';

<CalendarCard
  calendar={calendar}
  onDisconnect={handleDisconnect}
  isDisconnecting={false}
/>
```

### CalendarSyncStatus

Shows calendar sync status with manual sync button.

```tsx
import { CalendarSyncStatus } from '@/components/calendar/calendar-sync-status';

<CalendarSyncStatus userId={userId} />
```

### CalendarSelector

Dropdown to select a connected calendar.

```tsx
import { CalendarSelector } from '@/components/calendar/calendar-selector';

<CalendarSelector
  value={selectedCalendarId}
  onChange={setSelectedCalendarId}
  placeholder="Select calendar"
/>
```

## Database Schema

The `ConnectedCalendar` model stores calendar connections:

```prisma
model ConnectedCalendar {
  id                String              @id @default(cuid())
  userId            String
  user              User                @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  provider          CalendarProvider    // GOOGLE or OUTLOOK
  providerAccountId String
  accessToken       String              @db.Text
  refreshToken      String?             @db.Text
  expiresAt         DateTime?
  
  calendarId        String
  calendarName      String
  isPrimary         Boolean             @default(false)
  
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt
  
  @@unique([userId, provider, calendarId])
  @@index([userId])
}
```

## Security Considerations

- Access tokens are stored encrypted in the database
- Refresh tokens are used to obtain new access tokens automatically
- OAuth state parameter includes user ID to prevent CSRF attacks
- All API routes require authentication
- Users can only access their own calendar connections

## Error Handling

The service handles common errors:
- Expired tokens (automatic refresh)
- Missing refresh tokens
- API rate limits
- Network failures
- Invalid OAuth states

## Testing

To test calendar integration:

1. Set up test OAuth credentials
2. Connect a test calendar
3. Create test events in the calendar
4. Verify conflict detection works
5. Test token refresh by expiring tokens
6. Test disconnection flow

## Troubleshooting

### "Token expired and no refresh token available"

This happens when the refresh token is missing. The user needs to reconnect their calendar.

### "Failed to connect calendar"

Check that:
- OAuth credentials are correct
- Redirect URIs match exactly
- Required API permissions are granted
- APIs are enabled in cloud console

### Conflicts not detected

Ensure:
- Calendar is properly connected
- Events exist in the time range
- Token hasn't expired
- Calendar sync is working
