import { LocationType } from '@prisma/client'
import { format } from 'date-fns'

/**
 * Helper functions for booking-related operations
 */

export interface BookingEmailData {
  bookingId: string
  eventTitle: string
  hostName: string
  hostEmail: string
  guestName: string
  guestEmail: string
  startTime: Date
  endTime: Date
  timezone: string
  duration: number
  locationType: LocationType
  meetingLink?: string | null
  meetingPassword?: string | null
  location?: string | null
  rescheduleToken: string
  cancelToken: string
}

/**
 * Get human-readable location type label
 */
export function getLocationTypeLabel(locationType: LocationType): string {
  switch (locationType) {
    case 'VIDEO_ZOOM':
      return 'Zoom Meeting'
    case 'VIDEO_GOOGLE_MEET':
      return 'Google Meet'
    case 'VIDEO_TEAMS':
      return 'Microsoft Teams'
    case 'PHONE':
      return 'Phone Call'
    case 'IN_PERSON':
      return 'In Person'
    case 'CUSTOM':
      return 'Custom Location'
    default:
      return 'Location TBD'
  }
}

/**
 * Check if location type is a video conference
 */
export function isVideoConference(locationType: LocationType): boolean {
  return ['VIDEO_ZOOM', 'VIDEO_GOOGLE_MEET', 'VIDEO_TEAMS'].includes(locationType)
}

/**
 * Format booking details for email
 */
export function formatBookingDetailsForEmail(data: BookingEmailData): string {
  const startDateTime = format(data.startTime, 'EEEE, MMMM d, yyyy \'at\' h:mm a')
  const endTime = format(data.endTime, 'h:mm a')
  const locationLabel = getLocationTypeLabel(data.locationType)

  let details = `
Event: ${data.eventTitle}
Date & Time: ${startDateTime} - ${endTime} (${data.timezone})
Duration: ${data.duration} minutes
Location: ${locationLabel}
`

  // Add video meeting details if available
  if (data.meetingLink) {
    details += `\nJoin Meeting: ${data.meetingLink}`
    
    if (data.meetingPassword) {
      details += `\nMeeting Password: ${data.meetingPassword}`
    }
  } else if (data.location) {
    details += `\nDetails: ${data.location}`
  }

  details += `\n\nHost: ${data.hostName} (${data.hostEmail})
Guest: ${data.guestName} (${data.guestEmail})
`

  return details
}

/**
 * Generate HTML email content for booking confirmation
 */
export function generateBookingConfirmationEmailHTML(data: BookingEmailData): string {
  const startDateTime = format(data.startTime, 'EEEE, MMMM d, yyyy \'at\' h:mm a')
  const endTime = format(data.endTime, 'h:mm a')
  const locationLabel = getLocationTypeLabel(data.locationType)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  let meetingDetailsHTML = ''
  if (data.meetingLink) {
    meetingDetailsHTML = `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
          <strong>Join Meeting:</strong>
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
          <a href="${data.meetingLink}" style="color: #2563eb; text-decoration: none;">
            ${data.meetingLink}
          </a>
        </td>
      </tr>
    `
    
    if (data.meetingPassword) {
      meetingDetailsHTML += `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
            <strong>Meeting Password:</strong>
          </td>
          <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
            <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-family: monospace;">
              ${data.meetingPassword}
            </code>
          </td>
        </tr>
      `
    }
  } else if (data.location) {
    meetingDetailsHTML = `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
          <strong>Location Details:</strong>
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
          ${data.location}
        </td>
      </tr>
    `
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Confirmed</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #374151; max-width: 600px; margin: 0 auto; padding: 20px;">
  
  <div style="background: #10b981; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0; font-size: 28px;">✓ Booking Confirmed</h1>
  </div>
  
  <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <p style="font-size: 16px; margin-bottom: 24px;">
      Hi ${data.guestName},
    </p>
    
    <p style="font-size: 16px; margin-bottom: 24px;">
      Your meeting with <strong>${data.hostName}</strong> has been confirmed.
    </p>
    
    <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
      <h2 style="margin: 0 0 16px 0; font-size: 20px; color: #111827;">${data.eventTitle}</h2>
      
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
            <strong>Date & Time:</strong>
          </td>
          <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
            ${startDateTime} - ${endTime}
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
            <strong>Timezone:</strong>
          </td>
          <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
            ${data.timezone}
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
            <strong>Duration:</strong>
          </td>
          <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
            ${data.duration} minutes
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
            <strong>Location:</strong>
          </td>
          <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
            ${locationLabel}
          </td>
        </tr>
        ${meetingDetailsHTML}
      </table>
    </div>
    
    <div style="margin-bottom: 24px;">
      <a href="${baseUrl}/booking/${data.bookingId}/reschedule?token=${data.rescheduleToken}" 
         style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-right: 12px; margin-bottom: 12px;">
        Reschedule
      </a>
      <a href="${baseUrl}/booking/${data.bookingId}/cancel?token=${data.cancelToken}" 
         style="display: inline-block; background: #6b7280; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-bottom: 12px;">
        Cancel
      </a>
    </div>
    
    <p style="font-size: 14px; color: #6b7280; margin-top: 24px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
      Booking Reference: ${data.bookingId}
    </p>
  </div>
  
  <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px;">
    <p>This is an automated message from Calendly Scheduler</p>
  </div>
  
</body>
</html>
  `
}

/**
 * Generate plain text email content for booking confirmation
 */
export function generateBookingConfirmationEmailText(data: BookingEmailData): string {
  const startDateTime = format(data.startTime, 'EEEE, MMMM d, yyyy \'at\' h:mm a')
  const endTime = format(data.endTime, 'h:mm a')
  const locationLabel = getLocationTypeLabel(data.locationType)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  let text = `
BOOKING CONFIRMED

Hi ${data.guestName},

Your meeting with ${data.hostName} has been confirmed.

EVENT DETAILS
-------------
Event: ${data.eventTitle}
Date & Time: ${startDateTime} - ${endTime}
Timezone: ${data.timezone}
Duration: ${data.duration} minutes
Location: ${locationLabel}
`

  if (data.meetingLink) {
    text += `\nJoin Meeting: ${data.meetingLink}`
    
    if (data.meetingPassword) {
      text += `\nMeeting Password: ${data.meetingPassword}`
    }
  } else if (data.location) {
    text += `\nLocation Details: ${data.location}`
  }

  text += `

MANAGE YOUR BOOKING
-------------------
Reschedule: ${baseUrl}/booking/${data.bookingId}/reschedule?token=${data.rescheduleToken}
Cancel: ${baseUrl}/booking/${data.bookingId}/cancel?token=${data.cancelToken}

Booking Reference: ${data.bookingId}

---
This is an automated message from Calendly Scheduler
`

  return text
}
