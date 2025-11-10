# Video Conferencing Integration

This document describes the video conferencing integration implementation for the Calendly Scheduler application.

## Overview

The video conferencing service provides a unified interface for creating and managing video meetings across multiple providers:
- Zoom
- Google Meet
- Microsoft Teams

## Architecture

### Service Structure

```
services/video-service.ts
├── IVideoService (interface)
├── ZoomService
├── GoogleMeetService
├── TeamsService
└── VideoService (factory)
```

### Key Components

1. **IVideoService Interface**: Defines the contract for all video service providers
   - `createMeeting()`: Creates a new video meeting
   - `getMeetingDetails()`: Retrieves meeting information
   - `deleteMeeting()`: Removes a scheduled meeting

2. **Provider Services**: Individual implementations for each video platform
   - Each service handles provider-specific API calls
   - Generates mock links when API credentials are not configured
   - Implements error handling and logging

3. **VideoService Factory**: Main service that routes requests to appropriate providers
   - `createMeetingForBooking()`: Creates meetings based on event location type
   - `getMeetingDetails()`: Retrieves meeting info by provider
   - `deleteMeeting()`: Deletes meetings by provider
   - Static helper methods for location type checking

## Integration Points

### 1. Booking Creation

When a booking is created (`services/booking-service.ts`):
1. Check if the event type requires video conferencing
2. Call `videoService.createMeetingForBooking()` with booking details
3. Store the meeting link and password in the booking record
4. Continue with booking creation even if video meeting creation fails

### 2. Booking Display

Video meeting details are displayed in:
- **BookingConfirmation Component**: Shows meeting link and password
- **Calendar Invites (.ics files)**: Includes meeting link in description and location
- **Email Notifications**: Uses `lib/booking-helpers.ts` to format meeting details

### 3. Email Helpers

The `lib/booking-helpers.ts` module provides:
- `formatBookingDetailsForEmail()`: Plain text formatting
- `generateBookingConfirmationEmailHTML()`: HTML email with meeting links
- `generateBookingConfirmationEmailText()`: Plain text email
- `getLocationTypeLabel()`: Human-readable location names
- `isVideoConference()`: Check if location is video-based

## Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# Zoom
ZOOM_API_KEY="your-zoom-api-key"
ZOOM_API_SECRET="your-zoom-api-secret"

# Google Meet (uses Google Calendar API)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Microsoft Teams
MICROSOFT_CLIENT_ID="your-microsoft-client-id"
MICROSOFT_CLIENT_SECRET="your-microsoft-client-secret"
MICROSOFT_TENANT_ID="your-microsoft-tenant-id"
```

### Provider Setup

#### Zoom
1. Go to [Zoom Marketplace](https://marketplace.zoom.us/)
2. Create a Server-to-Server OAuth app
3. Add required scopes: `meeting:write`, `meeting:read`
4. Copy API Key and Secret to `.env`

#### Google Meet
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Google Calendar API
3. Create OAuth 2.0 credentials
4. Add authorized redirect URIs
5. Copy Client ID and Secret to `.env`

#### Microsoft Teams
1. Go to [Azure Portal](https://portal.azure.com/)
2. Register a new application
3. Add API permissions: `OnlineMeetings.ReadWrite`
4. Create a client secret
5. Copy Client ID, Secret, and Tenant ID to `.env`

## Current Implementation Status

### ✅ Completed
- Video service abstraction layer
- Support for Zoom, Google Meet, and Teams
- Mock meeting link generation (for development)
- Integration with booking creation flow
- Meeting link display in confirmation page
- Meeting details in calendar invites
- Email helper functions with video link formatting

### 🚧 Pending (Future Enhancements)
- Actual API integration with Zoom SDK
- Actual API integration with Google Calendar API
- Actual API integration with Microsoft Graph API
- OAuth token management and refresh
- Meeting deletion on booking cancellation
- Meeting update on booking reschedule
- Webhook handling for meeting status updates

## Usage Example

```typescript
import { videoService } from '@/services/video-service'
import { LocationType } from '@prisma/client'

// Create a video meeting
const meeting = await videoService.createMeetingForBooking(
  'VIDEO_ZOOM' as LocationType,
  {
    title: '30 Minute Meeting',
    startTime: new Date('2024-01-15T10:00:00Z'),
    endTime: new Date('2024-01-15T10:30:00Z'),
    hostEmail: 'host@example.com',
    hostName: 'John Host',
    guestEmail: 'guest@example.com',
    guestName: 'Jane Guest',
    description: 'Discussion about project',
  }
)

if (meeting) {
  console.log('Meeting Link:', meeting.meetingLink)
  console.log('Meeting Password:', meeting.meetingPassword)
  console.log('Provider:', meeting.provider)
}
```

## Testing

The service includes mock implementations that generate placeholder meeting links when API credentials are not configured. This allows for:
- Development without requiring API keys
- Testing the booking flow end-to-end
- UI/UX validation

To test with real API integrations:
1. Configure environment variables
2. Implement the TODO sections in each provider service
3. Test with actual API calls

## Security Considerations

- API credentials are stored in environment variables
- Meeting passwords are stored securely in the database
- Access tokens should be encrypted at rest
- Implement token refresh logic for long-lived integrations
- Use HTTPS for all API communications
- Validate webhook signatures for incoming events

## Error Handling

The service implements graceful error handling:
- Logs errors to console for debugging
- Returns null on failure (booking continues without video link)
- Provides fallback to mock links in development
- Throws descriptive errors for critical failures

## Future Improvements

1. **Token Management**: Implement OAuth token storage and refresh
2. **Webhook Integration**: Handle meeting status updates from providers
3. **Meeting Lifecycle**: Update/delete meetings on booking changes
4. **Provider Selection**: Allow users to choose preferred video provider
5. **Custom Settings**: Per-user video conferencing preferences
6. **Recording Options**: Enable/disable recording per meeting
7. **Waiting Rooms**: Configure waiting room settings
8. **Co-hosts**: Support for multiple hosts in team events
