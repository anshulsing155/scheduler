# User Guide

Welcome to your scheduling platform! This guide will help you get started and make the most of all available features.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Event Types](#event-types)
3. [Availability Management](#availability-management)
4. [Calendar Integration](#calendar-integration)
5. [Booking Management](#booking-management)
6. [Team Scheduling](#team-scheduling)
7. [Payments](#payments)
8. [Notifications](#notifications)
9. [Customization](#customization)
10. [Analytics](#analytics)

## Getting Started

### Creating Your Account

1. Sign up with email or use Google/Microsoft OAuth
2. Complete your profile with name, timezone, and avatar
3. Set your username (this becomes part of your booking URL)
4. Configure your initial availability

### Your Booking Link

Your personal booking link is: `yourdomain.com/your-username`

Share this link with anyone who needs to book time with you.

## Event Types

Event types are templates for different types of meetings you offer.

### Creating an Event Type

1. Navigate to **Dashboard > Event Types**
2. Click **Create Event Type**
3. Fill in:
   - **Title**: Name of the meeting (e.g., "30-Minute Consultation")
   - **Description**: What the meeting is about
   - **Duration**: How long the meeting lasts
   - **Location**: Video call, phone, in-person, or custom
4. Configure advanced settings:
   - Buffer times (padding before/after meetings)
   - Minimum notice (how far in advance bookings must be made)
   - Booking window (how far into the future guests can book)
   - Custom questions for guests

### Event Type Settings

- **Active/Inactive**: Toggle to enable or disable bookings
- **Require Payment**: Collect payment before confirming
- **Custom Questions**: Gather additional information from guests
- **Confirmation Message**: Custom message shown after booking

## Availability Management

### Setting Weekly Schedule

1. Go to **Settings > Availability**
2. For each day:
   - Toggle the day on/off
   - Add time slots (you can have multiple per day)
   - Set start and end times
3. Click **Save**

### Date Overrides

Handle exceptions to your regular schedule:

1. Click **Add Date Override**
2. Select the date
3. Choose:
   - **Unavailable**: Block the entire day
   - **Custom Hours**: Set different hours for that day
4. Save your override

### Tips

- Your availability is stored in your timezone
- Guests see available times in their timezone
- Use buffer times to add padding between meetings
- Set minimum notice to prevent last-minute bookings

## Calendar Integration

### Connecting Google Calendar

1. Go to **Settings > Integrations**
2. Click **Connect Google Calendar**
3. Sign in and grant permissions
4. Select which calendars to check for conflicts

### Connecting Outlook

1. Go to **Settings > Integrations**
2. Click **Connect Outlook**
3. Sign in with Microsoft account
4. Select calendars to sync

### How It Works

- System checks connected calendars for existing events
- Conflicting time slots are hidden from guests
- New bookings are added to your calendar automatically
- Sync runs every few minutes

## Booking Management

### Viewing Bookings

Access your bookings from **Dashboard > Bookings**

View options:
- **List View**: See all bookings in a list
- **Calendar View**: Visual calendar display
- **Filters**: Upcoming, past, cancelled

### Rescheduling a Booking

1. Open the booking details
2. Click **Reschedule**
3. Select a new time slot
4. Confirm - guest receives automatic notification

### Cancelling a Booking

1. Open the booking details
2. Click **Cancel**
3. Optionally add a reason
4. Confirm - guest receives cancellation email

### Guest Self-Service

Guests can reschedule or cancel using unique links in their confirmation email.

## Team Scheduling

### Creating a Team

1. Go to **Dashboard > Teams**
2. Click **Create Team**
3. Enter team name and description
4. Invite members by email

### Team Event Types

**Round Robin**: Distributes bookings evenly among available members
- Great for: Sales calls, support sessions, consultations

**Collective**: Requires all members to be available
- Great for: Panel interviews, group meetings

### Managing Team Members

- Assign roles (Admin or Member)
- View booking distribution
- Set individual availability
- Remove members when needed

## Payments

### Setting Up Stripe

1. Go to **Settings > Payments**
2. Click **Connect Stripe**
3. Complete Stripe onboarding
4. Configure payment settings

### Adding Payment to Events

1. Edit an event type
2. Enable **Require Payment**
3. Set price and currency
4. Configure cancellation/refund policy

### Processing Refunds

1. Open booking details
2. Click **Issue Refund**
3. Choose full or partial refund
4. Confirm

## Notifications

### Email Notifications

Automatic emails for:
- Booking confirmations (includes calendar invite)
- Cancellations
- Reschedules
- Reminders

### Customizing Email Templates

1. Go to **Settings > Notifications**
2. Select a template
3. Edit subject and body
4. Use variables: `{guest_name}`, `{event_title}`, `{booking_time}`
5. Preview and save

### SMS Reminders

1. Connect Twilio in **Settings > Integrations**
2. Configure SMS templates
3. Set reminder timing

### Reminder Settings

Configure automatic reminders:
- 24 hours before
- 1 hour before
- Custom timing

## Customization

### Branding Your Booking Page

1. Go to **Settings > Branding**
2. Upload your logo
3. Choose brand colors
4. Select layout style
5. Preview changes

### Custom Domain

1. Go to **Settings > Custom Domain**
2. Enter your domain (e.g., `book.yourcompany.com`)
3. Follow DNS configuration instructions
4. Verify ownership
5. SSL certificate is auto-provisioned

### White Label (Premium)

- Remove platform branding
- Custom footer text
- Custom CSS
- Custom email domain

## Analytics

### Viewing Analytics

Access analytics from **Dashboard > Analytics**

Available metrics:
- Total bookings
- Booking trends over time
- Event type performance
- Revenue (if using payments)
- Cancellation rates

### Exporting Data

1. Click **Export Data**
2. Select date range
3. Choose format (CSV)
4. Download

## Tips and Best Practices

### Optimize Your Booking Rate

- Use clear, descriptive event type names
- Add detailed descriptions
- Set reasonable minimum notice
- Offer multiple duration options
- Customize your booking page with branding

### Prevent No-Shows

- Enable email reminders
- Send SMS reminders for important meetings
- Require payment for high-value sessions
- Set minimum notice requirements

### Manage Your Time

- Use buffer times between meetings
- Set realistic availability
- Block time for breaks and admin work
- Use date overrides for vacations

### Team Efficiency

- Use round-robin for fair distribution
- Monitor team analytics
- Set individual availability preferences
- Regular team coordination

## Troubleshooting

### Calendar Not Syncing

- Check granted permissions
- Disconnect and reconnect
- Verify calendar selection in settings

### Guests Can't See Available Times

- Check your availability settings
- Verify event type is active
- Check minimum notice settings
- Ensure no date overrides are blocking

### Payment Issues

- Verify Stripe connection
- Check Stripe account status
- Review payment settings in event type

### Email Notifications Not Sending

- Check email settings
- Verify email templates are configured
- Check spam folder
- Contact support if issues persist

## Getting Help

### Help Center

Visit the in-app Help Center for:
- Detailed articles
- Video tutorials
- FAQ section

### Contact Support

Can't find what you need? Contact our support team:
- Email: support@yourplatform.com
- In-app chat (click the help icon)
- Response time: Within 24 hours

## Keyboard Shortcuts

Speed up your workflow with keyboard shortcuts:

- `Ctrl/Cmd + K`: Quick search
- `Ctrl/Cmd + N`: New event type
- `Ctrl/Cmd + B`: View bookings
- `Ctrl/Cmd + ,`: Settings
- `?`: Show all shortcuts

## Mobile App

Access your scheduler on the go:
- View and manage bookings
- Update availability
- Respond to booking requests
- Receive push notifications

Download from:
- iOS App Store
- Google Play Store

## API Access

Developers can integrate with our API:
- RESTful API
- Webhooks for events
- OAuth 2.0 authentication
- Comprehensive documentation at `api.yourplatform.com/docs`

## Privacy and Security

Your data is protected:
- End-to-end encryption
- GDPR compliant
- SOC 2 certified
- Regular security audits

### Data Export

Export all your data anytime:
1. Go to **Settings > Privacy**
2. Click **Export My Data**
3. Receive download link via email

### Account Deletion

Delete your account and all data:
1. Go to **Settings > Privacy**
2. Click **Delete Account**
3. Confirm deletion
4. All data is permanently removed within 30 days

---

**Last Updated**: November 2025
**Version**: 1.0

For the latest updates and features, visit our [changelog](https://yourplatform.com/changelog).
