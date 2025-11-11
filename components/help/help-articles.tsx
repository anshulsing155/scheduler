export const helpArticlesContent = {
  'create-event-type': {
    title: 'Creating Your First Event Type',
    content: `
# Creating Your First Event Type

Event types are meeting templates that define the duration, location, and settings for bookings. Here's how to create one:

## Step 1: Navigate to Event Types

1. Go to your dashboard
2. Click on "Event Types" in the navigation
3. Click the "Create Event Type" button

## Step 2: Basic Information

Fill in the following details:

- **Title**: Give your event a clear name (e.g., "30-Minute Consultation")
- **Description**: Explain what the meeting is about
- **Duration**: Choose from preset durations or set a custom time
- **URL Slug**: This creates your booking link (e.g., /your-username/consultation)

## Step 3: Location Settings

Choose where the meeting will take place:

- **Video Conference**: Automatically generate Zoom, Google Meet, or Teams links
- **Phone Call**: Collect the guest's phone number
- **In-Person**: Specify a physical address
- **Custom**: Add any custom location details

## Step 4: Advanced Settings

### Buffer Times
Add padding before or after meetings to prevent back-to-back bookings.

### Minimum Notice
Set how far in advance guests must book (e.g., 24 hours).

### Booking Window
Define how far into the future guests can schedule (e.g., 60 days).

### Custom Questions
Add fields to collect additional information from guests.

## Step 5: Save and Share

Once you've configured your event type, click "Save" and share your booking link with clients!
`
  },
  'set-availability': {
    title: 'Setting Your Availability',
    content: `
# Setting Your Availability

Your availability determines when guests can book time with you. Here's how to configure it:

## Weekly Schedule

1. Navigate to Settings > Availability
2. Set your working hours for each day of the week
3. Add multiple time slots per day if needed
4. Toggle days on/off to mark unavailable days

## Date Overrides

Use date overrides to handle exceptions to your regular schedule:

- **Block specific dates**: Mark days when you're unavailable (vacation, holidays)
- **Add special hours**: Set different hours for specific dates
- **One-time availability**: Open up slots outside your normal schedule

## Timezone Handling

Your availability is stored in your timezone. When guests book, they'll see available times converted to their timezone automatically.

## Tips

- Set buffer times in your event types to add padding between meetings
- Use minimum notice to prevent last-minute bookings
- Review your availability regularly to ensure it's up to date
`
  },
  'connect-calendar': {
    title: 'Connecting External Calendars',
    content: `
# Connecting External Calendars

Connect your Google Calendar or Outlook to prevent double-bookings and keep everything in sync.

## Google Calendar

1. Go to Settings > Integrations
2. Click "Connect Google Calendar"
3. Sign in with your Google account
4. Select which calendars to check for conflicts
5. Grant the necessary permissions

## Microsoft Outlook

1. Go to Settings > Integrations
2. Click "Connect Outlook"
3. Sign in with your Microsoft account
4. Select which calendars to check for conflicts
5. Grant the necessary permissions

## How It Works

- The system checks your connected calendars for existing events
- Time slots with conflicts are automatically hidden from guests
- When a booking is confirmed, it's added to your connected calendar
- Calendar sync runs every few minutes to stay up to date

## Multiple Calendars

You can connect multiple calendars from different accounts. The system will check all of them to ensure no conflicts.

## Troubleshooting

If calendar sync isn't working:
- Check that you've granted all required permissions
- Disconnect and reconnect the calendar
- Verify the calendar is selected in your integration settings
`
  },
  'team-scheduling': {
    title: 'Setting Up Team Scheduling',
    content: `
# Setting Up Team Scheduling

Team scheduling allows multiple team members to share bookings. Perfect for support teams, sales teams, or any group that needs to distribute meetings.

## Creating a Team

1. Go to Dashboard > Teams
2. Click "Create Team"
3. Enter team name and description
4. Invite team members by email

## Team Event Types

Create event types that use your team:

### Round Robin
Bookings are distributed evenly among available team members. Great for:
- Sales calls
- Support sessions
- Consultations

### Collective
All team members must be available. Perfect for:
- Panel interviews
- Group consultations
- Team meetings

## Managing Team Members

- Assign roles (Admin, Member)
- Set individual availability for each member
- Remove members when needed
- Track booking distribution

## Tips

- Use round robin to balance workload across your team
- Set up collective events for important meetings requiring multiple people
- Review team analytics to ensure fair distribution
`
  },
  'payment-setup': {
    title: 'Accepting Payments',
    content: `
# Accepting Payments

Collect payment for your bookings using Stripe integration.

## Setting Up Stripe

1. Go to Settings > Payments
2. Click "Connect Stripe"
3. Create a Stripe account or sign in
4. Complete Stripe onboarding
5. Configure your payment settings

## Adding Payment to Event Types

1. Edit an event type
2. Enable "Require Payment"
3. Set your price
4. Choose currency
5. Configure cancellation policy

## Payment Flow

1. Guest selects a time slot
2. Fills out booking form
3. Enters payment information
4. Payment is processed
5. Booking is confirmed

## Refunds

Configure your refund policy:
- Full refund if cancelled X hours before
- Partial refund within certain timeframe
- No refund for late cancellations

Process refunds from the booking details page in your dashboard.

## Fees

Stripe charges processing fees (typically 2.9% + $0.30 per transaction). These fees are separate from our platform fees.
`
  },
  'notifications': {
    title: 'Managing Notifications',
    content: `
# Managing Notifications

Set up email and SMS notifications to keep everyone informed about bookings.

## Email Notifications

Configure email notifications for:
- Booking confirmations
- Booking cancellations
- Booking reschedules
- Reminders before meetings

### Customizing Email Templates

1. Go to Settings > Notifications
2. Select an email template
3. Customize the subject and body
4. Use variables like {guest_name}, {event_title}, {booking_time}
5. Preview and save

## SMS Notifications

Enable SMS reminders via Twilio:
1. Connect your Twilio account in Settings
2. Configure SMS templates
3. Set reminder timing (e.g., 1 hour before)

## Reminder Settings

Set up automatic reminders:
- 24 hours before meeting
- 1 hour before meeting
- Custom timing

## Calendar Invites

All confirmation emails include .ics calendar files that guests can add to their calendar with one click.

## Tips

- Test your email templates before going live
- Don't send too many reminders - one or two is usually enough
- Include all important details in confirmation emails
`
  },
  'customize-booking-page': {
    title: 'Customizing Your Booking Page',
    content: `
# Customizing Your Booking Page

Make your booking page match your brand with custom colors, logos, and layouts.

## Branding Settings

1. Go to Settings > Branding
2. Upload your logo
3. Choose brand colors (primary and accent)
4. Set custom fonts (if available)
5. Preview your changes

## Layout Options

Choose from different booking page layouts:
- **Classic**: Traditional calendar view
- **Modern**: Sleek, minimal design
- **Compact**: Space-efficient layout

## Custom Domain

Use your own domain for booking pages:
1. Go to Settings > Custom Domain
2. Enter your domain (e.g., book.yourcompany.com)
3. Follow DNS configuration instructions
4. Verify domain ownership
5. SSL certificate is automatically provisioned

## White Label Options

Premium users can:
- Remove platform branding
- Customize footer text
- Add custom CSS
- Use custom email domains

## SEO Settings

Optimize your booking page for search engines:
- Set page title and description
- Add meta tags
- Configure social media preview images

## Tips

- Keep your branding consistent with your website
- Test your booking page on mobile devices
- Use high-quality logo images (PNG with transparency)
- Choose colors with good contrast for accessibility
`
  }
}