# Notification System Documentation

## Overview

The notification system provides automated email and SMS notifications for booking events, including confirmations, reminders, cancellations, and reschedules.

## Components

### 1. Email Service (`email-service.ts`)

Handles all email notifications using Resend:

- **Booking Confirmation**: Sent to both host and guest when a booking is created
- **Booking Reminder**: Sent before meetings based on user preferences
- **Cancellation Notice**: Sent when a booking is cancelled
- **Reschedule Notice**: Sent when a booking time is changed

Features:
- HTML email templates with responsive design
- Calendar invite (.ics) file attachments
- Meeting links and passwords included
- Reschedule and cancel action links

### 2. SMS Service (`sms-service.ts`)

Handles SMS notifications using Twilio:

- **Booking Reminder**: Text reminders before meetings
- **Cancellation Notice**: SMS when booking is cancelled
- **Reschedule Notice**: SMS when booking time changes

Features:
- Phone number validation and formatting
- E.164 format support
- Concise message templates optimized for SMS
- Test SMS functionality

### 3. Notification Service (`notification-service.ts`)

Manages reminder scheduling and processing:

- **Schedule Reminders**: Creates reminder records when bookings are made
- **Process Pending Reminders**: Sends due reminders (called by cron job)
- **Retry Failed Reminders**: Attempts to resend failed notifications
- **Cancel Reminders**: Removes pending reminders for cancelled bookings
- **Reschedule Reminders**: Updates reminder times for rescheduled bookings

## Configuration

### Environment Variables

```bash
# Email Service (Resend)
RESEND_API_KEY="re_your-resend-api-key"

# SMS Service (Twilio)
TWILIO_ACCOUNT_SID="your-twilio-account-sid"
TWILIO_AUTH_TOKEN="your-twilio-auth-token"
TWILIO_PHONE_NUMBER="+1234567890"

# Cron Job Security (Optional)
CRON_SECRET="your-cron-secret"
```

### Cron Job Setup

The system uses a cron job to process pending reminders every minute.

**For Vercel:**
The `vercel.json` file is already configured:
```json
{
  "crons": [{
    "path": "/api/cron/process-reminders",
    "schedule": "* * * * *"
  }]
}
```

**For Local Development:**
Use a service like cron-job.org or set up a local cron job:
```bash
* * * * * curl http://localhost:3000/api/cron/process-reminders
```

## User Settings

Users can configure their notification preferences at `/dashboard/notifications`:

- **Email Notifications**: Enable/disable email notifications
- **SMS Notifications**: Enable/disable SMS notifications
- **Phone Number**: Set phone number for SMS (E.164 format)
- **Reminder Timing**: Choose when to receive reminders (15 min, 1 hour, 1 day, etc.)

Default settings:
- Email: Enabled
- SMS: Disabled
- Reminder Timing: 24 hours and 1 hour before meetings

## API Endpoints

### Notification Settings

**GET /api/notifications/settings**
- Get user's notification settings
- Returns: `{ settings: NotificationSettings }`

**PUT /api/notifications/settings**
- Update user's notification settings
- Body: `{ emailEnabled, smsEnabled, phoneNumber, reminderTiming }`
- Returns: `{ settings: NotificationSettings }`

### Test SMS

**POST /api/notifications/test-sms**
- Send a test SMS to verify configuration
- Body: `{ phoneNumber: string }`
- Returns: `{ success: boolean, message?: string, error?: string }`

### Cron Job

**GET /api/cron/process-reminders**
- Process pending reminders (called by cron)
- Optional: Include `Authorization: Bearer <CRON_SECRET>` header
- Returns: `{ success: boolean, processedCount: number, retriedCount: number }`

## Integration Points

### Booking Creation
When a booking is created:
1. Email confirmation sent to guest and host
2. Reminders scheduled based on user preferences
3. Calendar invites attached to emails

### Booking Reschedule
When a booking is rescheduled:
1. Email notification sent to guest and host
2. Old reminders deleted
3. New reminders scheduled
4. Updated calendar invites sent

### Booking Cancellation
When a booking is cancelled:
1. Email notification sent to guest and host
2. Pending reminders cancelled
3. Cancellation reason included if provided

## Database Schema

### NotificationSetting
```prisma
model NotificationSetting {
  id              String   @id @default(cuid())
  userId          String   @unique
  emailEnabled    Boolean  @default(true)
  smsEnabled      Boolean  @default(false)
  phoneNumber     String?
  reminderTiming  Json     // Array of minutes before meeting
}
```

### Reminder
```prisma
model Reminder {
  id           String         @id @default(cuid())
  bookingId    String
  type         ReminderType   // EMAIL or SMS
  scheduledFor DateTime
  sentAt       DateTime?
  status       ReminderStatus // PENDING, SENT, FAILED
}
```

## Error Handling

- Email/SMS failures are logged but don't block booking operations
- Failed reminders are retried once within 5 minutes
- Reminders for cancelled bookings are automatically skipped
- Invalid phone numbers are validated before sending

## Testing

### Test Email Configuration
Create a test booking and verify emails are received.

### Test SMS Configuration
1. Go to `/dashboard/notifications`
2. Enter your phone number
3. Click "Test SMS"
4. Verify you receive the test message

### Test Reminders
1. Create a booking with a start time in the near future
2. Set reminder timing to a short interval (e.g., 15 minutes)
3. Wait for the cron job to process
4. Verify reminder is sent

## Monitoring

Check notification statistics:
```typescript
const stats = await notificationService.getNotificationStats(userId)
// Returns: { totalSent, totalFailed, totalPending }
```

## Troubleshooting

### Emails Not Sending
- Verify `RESEND_API_KEY` is set correctly
- Check Resend dashboard for delivery status
- Verify sender domain is configured in Resend

### SMS Not Sending
- Verify Twilio credentials are correct
- Check phone number is in E.164 format
- Verify Twilio account has sufficient balance
- Check Twilio console for error logs

### Reminders Not Processing
- Verify cron job is running (check Vercel logs)
- Check `/api/cron/process-reminders` endpoint manually
- Verify `CRON_SECRET` matches if configured
- Check database for pending reminders

## Future Enhancements

- Custom email templates per user
- Webhook notifications
- Push notifications
- Slack/Discord integrations
- Multi-language support
- A/B testing for notification timing
