import { prisma } from '@/lib/prisma'
import { emailService } from './email-service'
import { smsService } from './sms-service'
import { ReminderStatus, ReminderType } from '@prisma/client'
import { addMinutes, subMinutes, isBefore, isAfter } from 'date-fns'

/**
 * Notification service for managing reminders and notifications
 */
export const notificationService = {
  /**
   * Schedule reminders for a booking based on user's notification settings
   */
  async scheduleReminders(bookingId: string): Promise<boolean> {
    try {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          user: {
            include: {
              notifications: true,
            },
          },
        },
      })

      if (!booking) {
        console.error('Booking not found:', bookingId)
        return false
      }

      // Get user's notification settings
      const notificationSettings = booking.user.notifications[0]
      
      if (!notificationSettings) {
        // Create default notification settings if none exist
        await prisma.notificationSetting.create({
          data: {
            userId: booking.userId,
            emailEnabled: true,
            smsEnabled: false,
            reminderTiming: [1440, 60], // 24 hours and 1 hour before
          },
        })
      }

      const reminderTiming = (notificationSettings?.reminderTiming as number[]) || [1440, 60]
      const emailEnabled = notificationSettings?.emailEnabled ?? true
      const smsEnabled = notificationSettings?.smsEnabled ?? false

      // Schedule email reminders
      if (emailEnabled) {
        for (const minutesBefore of reminderTiming) {
          const scheduledFor = subMinutes(booking.startTime, minutesBefore)
          
          // Only schedule if the reminder time is in the future
          if (isAfter(scheduledFor, new Date())) {
            await prisma.reminder.create({
              data: {
                bookingId,
                type: 'EMAIL',
                scheduledFor,
                status: 'PENDING',
              },
            })
          }
        }
      }

      // Schedule SMS reminders
      if (smsEnabled && notificationSettings?.phoneNumber) {
        for (const minutesBefore of reminderTiming) {
          const scheduledFor = subMinutes(booking.startTime, minutesBefore)
          
          // Only schedule if the reminder time is in the future
          if (isAfter(scheduledFor, new Date())) {
            await prisma.reminder.create({
              data: {
                bookingId,
                type: 'SMS',
                scheduledFor,
                status: 'PENDING',
              },
            })
          }
        }
      }

      return true
    } catch (error) {
      console.error('Error scheduling reminders:', error)
      return false
    }
  },

  /**
   * Process pending reminders that are due to be sent
   */
  async processPendingReminders(): Promise<number> {
    try {
      const now = new Date()
      
      // Find all pending reminders that are due
      const dueReminders = await prisma.reminder.findMany({
        where: {
          status: 'PENDING',
          scheduledFor: {
            lte: now,
          },
        },
        include: {
          booking: {
            include: {
              eventType: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
        take: 100, // Process in batches
      })

      let processedCount = 0

      for (const reminder of dueReminders) {
        try {
          // Skip if booking is cancelled
          if (reminder.booking.status === 'CANCELLED') {
            await prisma.reminder.update({
              where: { id: reminder.id },
              data: { status: 'FAILED' },
            })
            continue
          }

          // Calculate minutes before meeting
          const minutesBefore = Math.round(
            (reminder.booking.startTime.getTime() - now.getTime()) / (1000 * 60)
          )

          if (reminder.type === 'EMAIL') {
            const success = await emailService.sendBookingReminder(
              reminder.booking as any,
              minutesBefore
            )

            await prisma.reminder.update({
              where: { id: reminder.id },
              data: {
                status: success ? 'SENT' : 'FAILED',
                sentAt: success ? now : null,
              },
            })

            if (success) processedCount++
          } else if (reminder.type === 'SMS') {
            // Get user's phone number from notification settings
            const notificationSettings = await prisma.notificationSetting.findUnique({
              where: { userId: reminder.booking.userId },
            })

            if (notificationSettings?.phoneNumber && notificationSettings.smsEnabled) {
              const success = await smsService.sendBookingReminder(
                reminder.booking as any,
                notificationSettings.phoneNumber,
                minutesBefore
              )

              await prisma.reminder.update({
                where: { id: reminder.id },
                data: {
                  status: success ? 'SENT' : 'FAILED',
                  sentAt: success ? now : null,
                },
              })

              if (success) processedCount++
            } else {
              // Mark as failed if no phone number or SMS disabled
              await prisma.reminder.update({
                where: { id: reminder.id },
                data: { status: 'FAILED' },
              })
            }
          }
        } catch (error) {
          console.error('Error processing reminder:', reminder.id, error)
          
          // Mark as failed
          await prisma.reminder.update({
            where: { id: reminder.id },
            data: { status: 'FAILED' },
          })
        }
      }

      return processedCount
    } catch (error) {
      console.error('Error processing pending reminders:', error)
      return 0
    }
  },

  /**
   * Retry failed reminders (up to 3 attempts)
   */
  async retryFailedReminders(): Promise<number> {
    try {
      const now = new Date()
      const fiveMinutesAgo = subMinutes(now, 5)
      
      // Find failed reminders from the last 5 minutes
      const failedReminders = await prisma.reminder.findMany({
        where: {
          status: 'FAILED',
          scheduledFor: {
            gte: fiveMinutesAgo,
            lte: now,
          },
        },
        include: {
          booking: {
            include: {
              eventType: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
        take: 50, // Process in batches
      })

      let retriedCount = 0

      for (const reminder of failedReminders) {
        try {
          // Skip if booking is cancelled
          if (reminder.booking.status === 'CANCELLED') {
            continue
          }

          // Calculate minutes before meeting
          const minutesBefore = Math.round(
            (reminder.booking.startTime.getTime() - now.getTime()) / (1000 * 60)
          )

          // Only retry if meeting hasn't started yet
          if (minutesBefore > 0) {
            if (reminder.type === 'EMAIL') {
              const success = await emailService.sendBookingReminder(
                reminder.booking as any,
                minutesBefore
              )

              if (success) {
                await prisma.reminder.update({
                  where: { id: reminder.id },
                  data: {
                    status: 'SENT',
                    sentAt: now,
                  },
                })
                retriedCount++
              }
            } else if (reminder.type === 'SMS') {
              const notificationSettings = await prisma.notificationSetting.findUnique({
                where: { userId: reminder.booking.userId },
              })

              if (notificationSettings?.phoneNumber && notificationSettings.smsEnabled) {
                const success = await smsService.sendBookingReminder(
                  reminder.booking as any,
                  notificationSettings.phoneNumber,
                  minutesBefore
                )

                if (success) {
                  await prisma.reminder.update({
                    where: { id: reminder.id },
                    data: {
                      status: 'SENT',
                      sentAt: now,
                    },
                  })
                  retriedCount++
                }
              }
            }
          }
        } catch (error) {
          console.error('Error retrying reminder:', reminder.id, error)
        }
      }

      return retriedCount
    } catch (error) {
      console.error('Error retrying failed reminders:', error)
      return 0
    }
  },

  /**
   * Cancel all reminders for a booking
   */
  async cancelReminders(bookingId: string): Promise<boolean> {
    try {
      await prisma.reminder.updateMany({
        where: {
          bookingId,
          status: 'PENDING',
        },
        data: {
          status: 'FAILED',
        },
      })

      return true
    } catch (error) {
      console.error('Error cancelling reminders:', error)
      return false
    }
  },

  /**
   * Reschedule reminders for a booking (delete old ones and create new ones)
   */
  async rescheduleReminders(bookingId: string): Promise<boolean> {
    try {
      // Delete existing pending reminders
      await prisma.reminder.deleteMany({
        where: {
          bookingId,
          status: 'PENDING',
        },
      })

      // Schedule new reminders
      return await this.scheduleReminders(bookingId)
    } catch (error) {
      console.error('Error rescheduling reminders:', error)
      return false
    }
  },

  /**
   * Get notification statistics for a user
   */
  async getNotificationStats(userId: string): Promise<{
    totalSent: number
    totalFailed: number
    totalPending: number
  }> {
    try {
      const bookings = await prisma.booking.findMany({
        where: { userId },
        select: { id: true },
      })

      const bookingIds = bookings.map((b) => b.id)

      const [sent, failed, pending] = await Promise.all([
        prisma.reminder.count({
          where: {
            bookingId: { in: bookingIds },
            status: 'SENT',
          },
        }),
        prisma.reminder.count({
          where: {
            bookingId: { in: bookingIds },
            status: 'FAILED',
          },
        }),
        prisma.reminder.count({
          where: {
            bookingId: { in: bookingIds },
            status: 'PENDING',
          },
        }),
      ])

      return {
        totalSent: sent,
        totalFailed: failed,
        totalPending: pending,
      }
    } catch (error) {
      console.error('Error getting notification stats:', error)
      return {
        totalSent: 0,
        totalFailed: 0,
        totalPending: 0,
      }
    }
  },
}
