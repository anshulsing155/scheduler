import { Resend } from 'resend'
import { format } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'
import { BookingWithRelations } from './booking-service'

const resend = new Resend(process.env.RESEND_API_KEY)

export type EmailTemplate = 
  | 'booking-confirmation'
  | 'booking-reminder'
  | 'booking-cancelled'
  | 'booking-rescheduled'

export interface EmailData {
  to: string
  subject: string
  template: EmailTemplate
  data: any
}

/**
 * Generate .ics calendar invite file content
 */
export function generateCalendarInvite(booking: BookingWithRelations): string {
  const startTime = booking.startTime.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  const endTime = booking.endTime.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

  let location = booking.location || ''
  if (booking.meetingLink) {
    location = booking.meetingLink
  }

  const description = [
    `Meeting with ${booking.eventType.user.name || 'Host'}`,
    booking.meetingLink ? `\nJoin: ${booking.meetingLink}` : '',
    booking.meetingPassword ? `Password: ${booking.meetingPassword}` : '',
  ].filter(Boolean).join('\n')

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Calendly Scheduler//EN
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VEVENT
DTSTART:${startTime}
DTEND:${endTime}
DTSTAMP:${now}
UID:${booking.id}@scheduler.app
SUMMARY:${booking.eventType.title}
DESCRIPTION:${description.replace(/\n/g, '\\n')}
LOCATION:${location}
STATUS:CONFIRMED
SEQUENCE:0
BEGIN:VALARM
TRIGGER:-PT15M
ACTION:DISPLAY
DESCRIPTION:Reminder
END:VALARM
END:VEVENT
END:VCALENDAR`
}

/**
 * Email service for sending notifications
 */
export const emailService = {
  /**
   * Send booking confirmation email
   */
  async sendBookingConfirmation(booking: BookingWithRelations): Promise<boolean> {
    try {
      const hostEmail = booking.eventType.user.email
      const guestEmail = booking.guestEmail
      const hostName = booking.eventType.user.name || 'Host'
      
      const startTimeFormatted = formatInTimeZone(
        booking.startTime,
        booking.guestTimezone,
        'EEEE, MMMM d, yyyy \'at\' h:mm a zzz'
      )

      const calendarInvite = generateCalendarInvite(booking)

      // Send to guest
      await resend.emails.send({
        from: 'Scheduler <noreply@scheduler.app>',
        to: guestEmail,
        subject: `Confirmed: ${booking.eventType.title} with ${hostName}`,
        html: this.renderBookingConfirmationTemplate({
          guestName: booking.guestName,
          hostName,
          eventTitle: booking.eventType.title,
          startTime: startTimeFormatted,
          duration: booking.eventType.duration,
          meetingLink: booking.meetingLink,
          meetingPassword: booking.meetingPassword,
          location: booking.location,
          rescheduleUrl: `${process.env.NEXTAUTH_URL}/booking/${booking.id}/reschedule?token=${booking.rescheduleToken}`,
          cancelUrl: `${process.env.NEXTAUTH_URL}/booking/${booking.id}/cancel?token=${booking.cancelToken}`,
        }),
        attachments: [
          {
            filename: 'invite.ics',
            content: Buffer.from(calendarInvite).toString('base64'),
          },
        ],
      })

      // Send to host
      await resend.emails.send({
        from: 'Scheduler <noreply@scheduler.app>',
        to: hostEmail,
        subject: `New Booking: ${booking.eventType.title} with ${booking.guestName}`,
        html: this.renderHostBookingNotificationTemplate({
          hostName,
          guestName: booking.guestName,
          guestEmail: booking.guestEmail,
          guestPhone: booking.guestPhone,
          eventTitle: booking.eventType.title,
          startTime: startTimeFormatted,
          duration: booking.eventType.duration,
          meetingLink: booking.meetingLink,
          location: booking.location,
          customResponses: booking.customResponses,
        }),
        attachments: [
          {
            filename: 'invite.ics',
            content: Buffer.from(calendarInvite).toString('base64'),
          },
        ],
      })

      return true
    } catch (error) {
      console.error('Error sending booking confirmation:', error)
      return false
    }
  },

  /**
   * Send booking reminder email
   */
  async sendBookingReminder(booking: BookingWithRelations, minutesBefore: number): Promise<boolean> {
    try {
      const startTimeFormatted = formatInTimeZone(
        booking.startTime,
        booking.guestTimezone,
        'EEEE, MMMM d, yyyy \'at\' h:mm a zzz'
      )

      await resend.emails.send({
        from: 'Scheduler <noreply@scheduler.app>',
        to: booking.guestEmail,
        subject: `Reminder: ${booking.eventType.title} in ${minutesBefore} minutes`,
        html: this.renderReminderTemplate({
          guestName: booking.guestName,
          hostName: booking.eventType.user.name || 'Host',
          eventTitle: booking.eventType.title,
          startTime: startTimeFormatted,
          minutesBefore,
          meetingLink: booking.meetingLink,
          meetingPassword: booking.meetingPassword,
          location: booking.location,
          rescheduleUrl: `${process.env.NEXTAUTH_URL}/booking/${booking.id}/reschedule?token=${booking.rescheduleToken}`,
          cancelUrl: `${process.env.NEXTAUTH_URL}/booking/${booking.id}/cancel?token=${booking.cancelToken}`,
        }),
      })

      return true
    } catch (error) {
      console.error('Error sending booking reminder:', error)
      return false
    }
  },

  /**
   * Send booking cancellation email
   */
  async sendCancellationNotice(booking: BookingWithRelations, cancelledBy: 'host' | 'guest'): Promise<boolean> {
    try {
      const hostEmail = booking.eventType.user.email
      const guestEmail = booking.guestEmail
      const hostName = booking.eventType.user.name || 'Host'
      
      const startTimeFormatted = formatInTimeZone(
        booking.startTime,
        booking.guestTimezone,
        'EEEE, MMMM d, yyyy \'at\' h:mm a zzz'
      )

      if (cancelledBy === 'host') {
        // Notify guest
        await resend.emails.send({
          from: 'Scheduler <noreply@scheduler.app>',
          to: guestEmail,
          subject: `Cancelled: ${booking.eventType.title} with ${hostName}`,
          html: this.renderCancellationTemplate({
            recipientName: booking.guestName,
            cancelledBy: hostName,
            eventTitle: booking.eventType.title,
            startTime: startTimeFormatted,
            reason: booking.cancellationReason,
          }),
        })
      } else {
        // Notify host
        await resend.emails.send({
          from: 'Scheduler <noreply@scheduler.app>',
          to: hostEmail,
          subject: `Cancelled: ${booking.eventType.title} with ${booking.guestName}`,
          html: this.renderCancellationTemplate({
            recipientName: hostName,
            cancelledBy: booking.guestName,
            eventTitle: booking.eventType.title,
            startTime: startTimeFormatted,
            reason: booking.cancellationReason,
          }),
        })
      }

      return true
    } catch (error) {
      console.error('Error sending cancellation notice:', error)
      return false
    }
  },

  /**
   * Send booking reschedule email
   */
  async sendRescheduleNotice(booking: BookingWithRelations, oldStartTime: Date): Promise<boolean> {
    try {
      const hostEmail = booking.eventType.user.email
      const guestEmail = booking.guestEmail
      const hostName = booking.eventType.user.name || 'Host'
      
      const oldTimeFormatted = formatInTimeZone(
        oldStartTime,
        booking.guestTimezone,
        'EEEE, MMMM d, yyyy \'at\' h:mm a zzz'
      )
      
      const newTimeFormatted = formatInTimeZone(
        booking.startTime,
        booking.guestTimezone,
        'EEEE, MMMM d, yyyy \'at\' h:mm a zzz'
      )

      const calendarInvite = generateCalendarInvite(booking)

      // Send to guest
      await resend.emails.send({
        from: 'Scheduler <noreply@scheduler.app>',
        to: guestEmail,
        subject: `Rescheduled: ${booking.eventType.title} with ${hostName}`,
        html: this.renderRescheduleTemplate({
          guestName: booking.guestName,
          hostName,
          eventTitle: booking.eventType.title,
          oldTime: oldTimeFormatted,
          newTime: newTimeFormatted,
          duration: booking.eventType.duration,
          meetingLink: booking.meetingLink,
          meetingPassword: booking.meetingPassword,
          location: booking.location,
          rescheduleUrl: `${process.env.NEXTAUTH_URL}/booking/${booking.id}/reschedule?token=${booking.rescheduleToken}`,
          cancelUrl: `${process.env.NEXTAUTH_URL}/booking/${booking.id}/cancel?token=${booking.cancelToken}`,
        }),
        attachments: [
          {
            filename: 'invite.ics',
            content: Buffer.from(calendarInvite).toString('base64'),
          },
        ],
      })

      // Send to host
      await resend.emails.send({
        from: 'Scheduler <noreply@scheduler.app>',
        to: hostEmail,
        subject: `Rescheduled: ${booking.eventType.title} with ${booking.guestName}`,
        html: this.renderRescheduleTemplate({
          guestName: hostName,
          hostName: booking.guestName,
          eventTitle: booking.eventType.title,
          oldTime: oldTimeFormatted,
          newTime: newTimeFormatted,
          duration: booking.eventType.duration,
          meetingLink: booking.meetingLink,
          location: booking.location,
        }),
        attachments: [
          {
            filename: 'invite.ics',
            content: Buffer.from(calendarInvite).toString('base64'),
          },
        ],
      })

      return true
    } catch (error) {
      console.error('Error sending reschedule notice:', error)
      return false
    }
  },

  /**
   * Render booking confirmation template
   */
  renderBookingConfirmationTemplate(data: {
    guestName: string
    hostName: string
    eventTitle: string
    startTime: string
    duration: number
    meetingLink?: string | null
    meetingPassword?: string | null
    location?: string | null
    rescheduleUrl: string
    cancelUrl: string
  }): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Confirmed</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h1 style="color: #2563eb; margin: 0 0 10px 0;">✓ Booking Confirmed</h1>
    <p style="margin: 0; color: #666;">Your meeting has been scheduled</p>
  </div>
  
  <div style="background-color: white; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="margin-top: 0; color: #1f2937;">${data.eventTitle}</h2>
    
    <div style="margin: 15px 0;">
      <strong>When:</strong><br>
      ${data.startTime}<br>
      <span style="color: #666;">${data.duration} minutes</span>
    </div>
    
    <div style="margin: 15px 0;">
      <strong>With:</strong><br>
      ${data.hostName}
    </div>
    
    ${data.meetingLink ? `
    <div style="margin: 15px 0;">
      <strong>Join Meeting:</strong><br>
      <a href="${data.meetingLink}" style="color: #2563eb; text-decoration: none;">${data.meetingLink}</a>
      ${data.meetingPassword ? `<br><span style="color: #666;">Password: ${data.meetingPassword}</span>` : ''}
    </div>
    ` : ''}
    
    ${data.location && !data.meetingLink ? `
    <div style="margin: 15px 0;">
      <strong>Location:</strong><br>
      ${data.location}
    </div>
    ` : ''}
  </div>
  
  <div style="margin: 20px 0;">
    <p style="margin: 10px 0;">
      <a href="${data.rescheduleUrl}" style="display: inline-block; padding: 10px 20px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin-right: 10px;">Reschedule</a>
      <a href="${data.cancelUrl}" style="display: inline-block; padding: 10px 20px; background-color: #dc2626; color: white; text-decoration: none; border-radius: 5px;">Cancel</a>
    </p>
  </div>
  
  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #666; font-size: 14px;">
    <p>A calendar invitation has been attached to this email.</p>
    <p>If you have any questions, please reply to this email.</p>
  </div>
</body>
</html>
    `.trim()
  },

  /**
   * Render host booking notification template
   */
  renderHostBookingNotificationTemplate(data: {
    hostName: string
    guestName: string
    guestEmail: string
    guestPhone?: string | null
    eventTitle: string
    startTime: string
    duration: number
    meetingLink?: string | null
    location?: string | null
    customResponses?: any
  }): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Booking</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h1 style="color: #2563eb; margin: 0 0 10px 0;">📅 New Booking</h1>
    <p style="margin: 0; color: #666;">You have a new meeting scheduled</p>
  </div>
  
  <div style="background-color: white; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="margin-top: 0; color: #1f2937;">${data.eventTitle}</h2>
    
    <div style="margin: 15px 0;">
      <strong>When:</strong><br>
      ${data.startTime}<br>
      <span style="color: #666;">${data.duration} minutes</span>
    </div>
    
    <div style="margin: 15px 0;">
      <strong>Guest:</strong><br>
      ${data.guestName}<br>
      <a href="mailto:${data.guestEmail}" style="color: #2563eb;">${data.guestEmail}</a>
      ${data.guestPhone ? `<br>${data.guestPhone}` : ''}
    </div>
    
    ${data.meetingLink ? `
    <div style="margin: 15px 0;">
      <strong>Join Meeting:</strong><br>
      <a href="${data.meetingLink}" style="color: #2563eb; text-decoration: none;">${data.meetingLink}</a>
    </div>
    ` : ''}
    
    ${data.location && !data.meetingLink ? `
    <div style="margin: 15px 0;">
      <strong>Location:</strong><br>
      ${data.location}
    </div>
    ` : ''}
    
    ${data.customResponses && Object.keys(data.customResponses).length > 0 ? `
    <div style="margin: 15px 0;">
      <strong>Additional Information:</strong><br>
      ${Object.entries(data.customResponses).map(([key, value]) => `
        <div style="margin: 5px 0;">
          <em>${key}:</em> ${value}
        </div>
      `).join('')}
    </div>
    ` : ''}
  </div>
  
  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #666; font-size: 14px;">
    <p>A calendar invitation has been attached to this email.</p>
  </div>
</body>
</html>
    `.trim()
  },

  /**
   * Render reminder template
   */
  renderReminderTemplate(data: {
    guestName: string
    hostName: string
    eventTitle: string
    startTime: string
    minutesBefore: number
    meetingLink?: string | null
    meetingPassword?: string | null
    location?: string | null
    rescheduleUrl: string
    cancelUrl: string
  }): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Meeting Reminder</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h1 style="color: #d97706; margin: 0 0 10px 0;">⏰ Meeting Reminder</h1>
    <p style="margin: 0; color: #92400e;">Your meeting starts in ${data.minutesBefore} minutes</p>
  </div>
  
  <div style="background-color: white; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="margin-top: 0; color: #1f2937;">${data.eventTitle}</h2>
    
    <div style="margin: 15px 0;">
      <strong>When:</strong><br>
      ${data.startTime}
    </div>
    
    <div style="margin: 15px 0;">
      <strong>With:</strong><br>
      ${data.hostName}
    </div>
    
    ${data.meetingLink ? `
    <div style="margin: 15px 0; padding: 15px; background-color: #eff6ff; border-radius: 5px;">
      <strong style="color: #1e40af;">Join Meeting:</strong><br>
      <a href="${data.meetingLink}" style="color: #2563eb; text-decoration: none; font-size: 16px;">${data.meetingLink}</a>
      ${data.meetingPassword ? `<br><span style="color: #666;">Password: ${data.meetingPassword}</span>` : ''}
    </div>
    ` : ''}
    
    ${data.location && !data.meetingLink ? `
    <div style="margin: 15px 0;">
      <strong>Location:</strong><br>
      ${data.location}
    </div>
    ` : ''}
  </div>
  
  <div style="margin: 20px 0;">
    <p style="margin: 10px 0;">
      <a href="${data.rescheduleUrl}" style="display: inline-block; padding: 10px 20px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin-right: 10px;">Reschedule</a>
      <a href="${data.cancelUrl}" style="display: inline-block; padding: 10px 20px; background-color: #dc2626; color: white; text-decoration: none; border-radius: 5px;">Cancel</a>
    </p>
  </div>
</body>
</html>
    `.trim()
  },

  /**
   * Render cancellation template
   */
  renderCancellationTemplate(data: {
    recipientName: string
    cancelledBy: string
    eventTitle: string
    startTime: string
    reason?: string | null
  }): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Meeting Cancelled</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #fee2e2; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h1 style="color: #dc2626; margin: 0 0 10px 0;">✕ Meeting Cancelled</h1>
    <p style="margin: 0; color: #991b1b;">This meeting has been cancelled</p>
  </div>
  
  <div style="background-color: white; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 20px;">
    <p>Hi ${data.recipientName},</p>
    
    <p>${data.cancelledBy} has cancelled the following meeting:</p>
    
    <h2 style="color: #1f2937;">${data.eventTitle}</h2>
    
    <div style="margin: 15px 0;">
      <strong>Was scheduled for:</strong><br>
      ${data.startTime}
    </div>
    
    ${data.reason ? `
    <div style="margin: 15px 0; padding: 15px; background-color: #f9fafb; border-left: 3px solid #9ca3af; border-radius: 3px;">
      <strong>Reason:</strong><br>
      ${data.reason}
    </div>
    ` : ''}
  </div>
  
  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #666; font-size: 14px;">
    <p>If you have any questions, please reply to this email.</p>
  </div>
</body>
</html>
    `.trim()
  },

  /**
   * Render reschedule template
   */
  renderRescheduleTemplate(data: {
    guestName: string
    hostName: string
    eventTitle: string
    oldTime: string
    newTime: string
    duration: number
    meetingLink?: string | null
    meetingPassword?: string | null
    location?: string | null
    rescheduleUrl?: string
    cancelUrl?: string
  }): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Meeting Rescheduled</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #dbeafe; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h1 style="color: #1e40af; margin: 0 0 10px 0;">🔄 Meeting Rescheduled</h1>
    <p style="margin: 0; color: #1e3a8a;">Your meeting time has been updated</p>
  </div>
  
  <div style="background-color: white; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="margin-top: 0; color: #1f2937;">${data.eventTitle}</h2>
    
    <div style="margin: 15px 0; padding: 15px; background-color: #fef2f2; border-radius: 5px;">
      <strong style="color: #991b1b;">Previous Time:</strong><br>
      <span style="text-decoration: line-through; color: #666;">${data.oldTime}</span>
    </div>
    
    <div style="margin: 15px 0; padding: 15px; background-color: #f0fdf4; border-radius: 5px;">
      <strong style="color: #166534;">New Time:</strong><br>
      <span style="color: #15803d; font-weight: bold;">${data.newTime}</span><br>
      <span style="color: #666;">${data.duration} minutes</span>
    </div>
    
    <div style="margin: 15px 0;">
      <strong>With:</strong><br>
      ${data.hostName}
    </div>
    
    ${data.meetingLink ? `
    <div style="margin: 15px 0;">
      <strong>Join Meeting:</strong><br>
      <a href="${data.meetingLink}" style="color: #2563eb; text-decoration: none;">${data.meetingLink}</a>
      ${data.meetingPassword ? `<br><span style="color: #666;">Password: ${data.meetingPassword}</span>` : ''}
    </div>
    ` : ''}
    
    ${data.location && !data.meetingLink ? `
    <div style="margin: 15px 0;">
      <strong>Location:</strong><br>
      ${data.location}
    </div>
    ` : ''}
  </div>
  
  ${data.rescheduleUrl && data.cancelUrl ? `
  <div style="margin: 20px 0;">
    <p style="margin: 10px 0;">
      <a href="${data.rescheduleUrl}" style="display: inline-block; padding: 10px 20px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin-right: 10px;">Reschedule Again</a>
      <a href="${data.cancelUrl}" style="display: inline-block; padding: 10px 20px; background-color: #dc2626; color: white; text-decoration: none; border-radius: 5px;">Cancel</a>
    </p>
  </div>
  ` : ''}
  
  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #666; font-size: 14px;">
    <p>An updated calendar invitation has been attached to this email.</p>
  </div>
</body>
</html>
    `.trim()
  },
}
