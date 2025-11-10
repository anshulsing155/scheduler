import twilio from 'twilio'
import { formatInTimeZone } from 'date-fns-tz'
import { BookingWithRelations } from './booking-service'

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER

let twilioClient: ReturnType<typeof twilio> | null = null

// Only initialize if credentials are available
if (accountSid && authToken) {
  twilioClient = twilio(accountSid, authToken)
}

/**
 * Validate phone number format
 * Accepts formats like: +1234567890, (123) 456-7890, 123-456-7890
 */
export function validatePhoneNumber(phoneNumber: string): boolean {
  // Remove all non-digit characters except +
  const cleaned = phoneNumber.replace(/[^\d+]/g, '')
  
  // Check if it starts with + and has 10-15 digits
  if (cleaned.startsWith('+')) {
    return cleaned.length >= 11 && cleaned.length <= 16
  }
  
  // Check if it has 10 digits (US format without country code)
  return cleaned.length === 10
}

/**
 * Format phone number to E.164 format (+1234567890)
 */
export function formatPhoneNumber(phoneNumber: string, defaultCountryCode: string = '+1'): string {
  // Remove all non-digit characters except +
  const cleaned = phoneNumber.replace(/[^\d+]/g, '')
  
  // If already has country code, return as is
  if (cleaned.startsWith('+')) {
    return cleaned
  }
  
  // Add default country code
  return `${defaultCountryCode}${cleaned}`
}

/**
 * SMS service for sending text notifications
 */
export const smsService = {
  /**
   * Check if SMS service is configured
   */
  isConfigured(): boolean {
    return !!(twilioClient && twilioPhoneNumber)
  },

  /**
   * Send booking confirmation SMS
   */
  async sendBookingConfirmation(booking: BookingWithRelations, phoneNumber: string): Promise<boolean> {
    if (!this.isConfigured()) {
      console.warn('Twilio is not configured. Skipping SMS.')
      return false
    }

    try {
      const formattedPhone = formatPhoneNumber(phoneNumber)
      
      if (!validatePhoneNumber(formattedPhone)) {
        console.error('Invalid phone number format:', phoneNumber)
        return false
      }

      const startTimeFormatted = formatInTimeZone(
        booking.startTime,
        booking.guestTimezone,
        'MMM d, yyyy \'at\' h:mm a zzz'
      )

      const hostName = booking.eventType.user.name || 'Host'
      
      let message = `✓ Booking Confirmed\n\n`
      message += `${booking.eventType.title}\n`
      message += `with ${hostName}\n\n`
      message += `When: ${startTimeFormatted}\n`
      
      if (booking.meetingLink) {
        message += `\nJoin: ${booking.meetingLink}`
      } else if (booking.location) {
        message += `\nLocation: ${booking.location}`
      }
      
      message += `\n\nManage: ${process.env.NEXTAUTH_URL}/booking/${booking.id}/reschedule?token=${booking.rescheduleToken}`

      await twilioClient!.messages.create({
        body: message,
        from: twilioPhoneNumber,
        to: formattedPhone,
      })

      return true
    } catch (error) {
      console.error('Error sending booking confirmation SMS:', error)
      return false
    }
  },

  /**
   * Send booking reminder SMS
   */
  async sendBookingReminder(
    booking: BookingWithRelations,
    phoneNumber: string,
    minutesBefore: number
  ): Promise<boolean> {
    if (!this.isConfigured()) {
      console.warn('Twilio is not configured. Skipping SMS.')
      return false
    }

    try {
      const formattedPhone = formatPhoneNumber(phoneNumber)
      
      if (!validatePhoneNumber(formattedPhone)) {
        console.error('Invalid phone number format:', phoneNumber)
        return false
      }

      const startTimeFormatted = formatInTimeZone(
        booking.startTime,
        booking.guestTimezone,
        'MMM d, yyyy \'at\' h:mm a zzz'
      )

      const hostName = booking.eventType.user.name || 'Host'
      
      const timeText = minutesBefore >= 60 
        ? `${Math.round(minutesBefore / 60)} hour${minutesBefore >= 120 ? 's' : ''}`
        : `${minutesBefore} minute${minutesBefore !== 1 ? 's' : ''}`
      
      let message = `⏰ Meeting Reminder\n\n`
      message += `Your meeting starts in ${timeText}\n\n`
      message += `${booking.eventType.title}\n`
      message += `with ${hostName}\n\n`
      message += `When: ${startTimeFormatted}\n`
      
      if (booking.meetingLink) {
        message += `\nJoin: ${booking.meetingLink}`
        if (booking.meetingPassword) {
          message += `\nPassword: ${booking.meetingPassword}`
        }
      } else if (booking.location) {
        message += `\nLocation: ${booking.location}`
      }

      await twilioClient!.messages.create({
        body: message,
        from: twilioPhoneNumber,
        to: formattedPhone,
      })

      return true
    } catch (error) {
      console.error('Error sending booking reminder SMS:', error)
      return false
    }
  },

  /**
   * Send booking cancellation SMS
   */
  async sendCancellationNotice(
    booking: BookingWithRelations,
    phoneNumber: string,
    cancelledBy: string
  ): Promise<boolean> {
    if (!this.isConfigured()) {
      console.warn('Twilio is not configured. Skipping SMS.')
      return false
    }

    try {
      const formattedPhone = formatPhoneNumber(phoneNumber)
      
      if (!validatePhoneNumber(formattedPhone)) {
        console.error('Invalid phone number format:', phoneNumber)
        return false
      }

      const startTimeFormatted = formatInTimeZone(
        booking.startTime,
        booking.guestTimezone,
        'MMM d, yyyy \'at\' h:mm a zzz'
      )
      
      let message = `✕ Meeting Cancelled\n\n`
      message += `${cancelledBy} has cancelled:\n\n`
      message += `${booking.eventType.title}\n`
      message += `Was scheduled for: ${startTimeFormatted}\n`
      
      if (booking.cancellationReason) {
        message += `\nReason: ${booking.cancellationReason}`
      }

      await twilioClient!.messages.create({
        body: message,
        from: twilioPhoneNumber,
        to: formattedPhone,
      })

      return true
    } catch (error) {
      console.error('Error sending cancellation SMS:', error)
      return false
    }
  },

  /**
   * Send booking reschedule SMS
   */
  async sendRescheduleNotice(
    booking: BookingWithRelations,
    phoneNumber: string,
    oldStartTime: Date
  ): Promise<boolean> {
    if (!this.isConfigured()) {
      console.warn('Twilio is not configured. Skipping SMS.')
      return false
    }

    try {
      const formattedPhone = formatPhoneNumber(phoneNumber)
      
      if (!validatePhoneNumber(formattedPhone)) {
        console.error('Invalid phone number format:', phoneNumber)
        return false
      }

      const oldTimeFormatted = formatInTimeZone(
        oldStartTime,
        booking.guestTimezone,
        'MMM d, yyyy \'at\' h:mm a zzz'
      )
      
      const newTimeFormatted = formatInTimeZone(
        booking.startTime,
        booking.guestTimezone,
        'MMM d, yyyy \'at\' h:mm a zzz'
      )

      const hostName = booking.eventType.user.name || 'Host'
      
      let message = `🔄 Meeting Rescheduled\n\n`
      message += `${booking.eventType.title}\n`
      message += `with ${hostName}\n\n`
      message += `Previous: ${oldTimeFormatted}\n`
      message += `New Time: ${newTimeFormatted}\n`
      
      if (booking.meetingLink) {
        message += `\nJoin: ${booking.meetingLink}`
      } else if (booking.location) {
        message += `\nLocation: ${booking.location}`
      }

      await twilioClient!.messages.create({
        body: message,
        from: twilioPhoneNumber,
        to: formattedPhone,
      })

      return true
    } catch (error) {
      console.error('Error sending reschedule SMS:', error)
      return false
    }
  },

  /**
   * Send a test SMS to verify configuration
   */
  async sendTestSMS(phoneNumber: string): Promise<{ success: boolean; error?: string }> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'Twilio is not configured. Please check your environment variables.',
      }
    }

    try {
      const formattedPhone = formatPhoneNumber(phoneNumber)
      
      if (!validatePhoneNumber(formattedPhone)) {
        return {
          success: false,
          error: 'Invalid phone number format. Please use E.164 format (+1234567890).',
        }
      }

      await twilioClient!.messages.create({
        body: 'Test message from Calendly Scheduler. Your SMS notifications are working correctly!',
        from: twilioPhoneNumber,
        to: formattedPhone,
      })

      return { success: true }
    } catch (error) {
      console.error('Error sending test SMS:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  },
}
