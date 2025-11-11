/**
 * Integration Check Script
 * Verifies that all modules are properly integrated and working together
 */

import { prisma } from '@/lib/prisma'

interface IntegrationCheckResult {
  module: string
  status: 'pass' | 'fail' | 'warning'
  message: string
  details?: string
}

const results: IntegrationCheckResult[] = []

async function checkDatabaseConnection() {
  try {
    await prisma.$connect()
    await prisma.user.count()
    results.push({
      module: 'Database',
      status: 'pass',
      message: 'Database connection successful'
    })
  } catch (error) {
    results.push({
      module: 'Database',
      status: 'fail',
      message: 'Database connection failed',
      details: error instanceof Error ? error.message : String(error)
    })
  }
}

async function checkAuthModule() {
  try {
    // Check if auth tables exist
    const userCount = await prisma.user.count()
    results.push({
      module: 'Authentication',
      status: 'pass',
      message: `Auth module operational (${userCount} users)`
    })
  } catch (error) {
    results.push({
      module: 'Authentication',
      status: 'fail',
      message: 'Auth module check failed',
      details: error instanceof Error ? error.message : String(error)
    })
  }
}

async function checkEventTypeModule() {
  try {
    const eventTypeCount = await prisma.eventType.count()
    results.push({
      module: 'Event Types',
      status: 'pass',
      message: `Event type module operational (${eventTypeCount} event types)`
    })
  } catch (error) {
    results.push({
      module: 'Event Types',
      status: 'fail',
      message: 'Event type module check failed',
      details: error instanceof Error ? error.message : String(error)
    })
  }
}

async function checkBookingModule() {
  try {
    const bookingCount = await prisma.booking.count()
    const upcomingBookings = await prisma.booking.count({
      where: {
        startTime: { gte: new Date() },
        status: { in: ['PENDING', 'CONFIRMED'] }
      }
    })
    results.push({
      module: 'Bookings',
      status: 'pass',
      message: `Booking module operational (${bookingCount} total, ${upcomingBookings} upcoming)`
    })
  } catch (error) {
    results.push({
      module: 'Bookings',
      status: 'fail',
      message: 'Booking module check failed',
      details: error instanceof Error ? error.message : String(error)
    })
  }
}

async function checkAvailabilityModule() {
  try {
    const availabilityCount = await prisma.availability.count()
    const overrideCount = await prisma.dateOverride.count()
    results.push({
      module: 'Availability',
      status: 'pass',
      message: `Availability module operational (${availabilityCount} schedules, ${overrideCount} overrides)`
    })
  } catch (error) {
    results.push({
      module: 'Availability',
      status: 'fail',
      message: 'Availability module check failed',
      details: error instanceof Error ? error.message : String(error)
    })
  }
}

async function checkCalendarIntegration() {
  try {
    const calendarCount = await prisma.connectedCalendar.count()
    results.push({
      module: 'Calendar Integration',
      status: calendarCount > 0 ? 'pass' : 'warning',
      message: `Calendar integration operational (${calendarCount} connected calendars)`
    })
  } catch (error) {
    results.push({
      module: 'Calendar Integration',
      status: 'fail',
      message: 'Calendar integration check failed',
      details: error instanceof Error ? error.message : String(error)
    })
  }
}

async function checkTeamModule() {
  try {
    const teamCount = await prisma.team.count()
    const memberCount = await prisma.teamMember.count()
    results.push({
      module: 'Teams',
      status: 'pass',
      message: `Team module operational (${teamCount} teams, ${memberCount} members)`
    })
  } catch (error) {
    results.push({
      module: 'Teams',
      status: 'fail',
      message: 'Team module check failed',
      details: error instanceof Error ? error.message : String(error)
    })
  }
}

async function checkPaymentModule() {
  try {
    const paymentCount = await prisma.payment.count()
    const successfulPayments = await prisma.payment.count({
      where: { status: 'SUCCEEDED' }
    })
    results.push({
      module: 'Payments',
      status: 'pass',
      message: `Payment module operational (${paymentCount} total, ${successfulPayments} successful)`
    })
  } catch (error) {
    results.push({
      module: 'Payments',
      status: 'fail',
      message: 'Payment module check failed',
      details: error instanceof Error ? error.message : String(error)
    })
  }
}

async function checkNotificationModule() {
  try {
    const settingsCount = await prisma.notificationSetting.count()
    const reminderCount = await prisma.reminder.count()
    const pendingReminders = await prisma.reminder.count({
      where: { status: 'PENDING' }
    })
    results.push({
      module: 'Notifications',
      status: 'pass',
      message: `Notification module operational (${settingsCount} settings, ${reminderCount} reminders, ${pendingReminders} pending)`
    })
  } catch (error) {
    results.push({
      module: 'Notifications',
      status: 'fail',
      message: 'Notification module check failed',
      details: error instanceof Error ? error.message : String(error)
    })
  }
}

async function checkAuditModule() {
  try {
    const auditCount = await prisma.auditLog.count()
    const recentAudits = await prisma.auditLog.count({
      where: {
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }
    })
    results.push({
      module: 'Audit Logging',
      status: 'pass',
      message: `Audit module operational (${auditCount} total logs, ${recentAudits} in last 24h)`
    })
  } catch (error) {
    results.push({
      module: 'Audit Logging',
      status: 'fail',
      message: 'Audit module check failed',
      details: error instanceof Error ? error.message : String(error)
    })
  }
}

async function checkEnvironmentVariables() {
  const requiredVars = [
    'DATABASE_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ]

  const missingVars = requiredVars.filter(v => !process.env[v])

  if (missingVars.length === 0) {
    results.push({
      module: 'Environment',
      status: 'pass',
      message: 'All required environment variables are set'
    })
  } else {
    results.push({
      module: 'Environment',
      status: 'fail',
      message: 'Missing required environment variables',
      details: missingVars.join(', ')
    })
  }
}

async function runIntegrationChecks() {
  console.log('🔍 Running Integration Checks...\n')

  await checkEnvironmentVariables()
  await checkDatabaseConnection()
  await checkAuthModule()
  await checkEventTypeModule()
  await checkBookingModule()
  await checkAvailabilityModule()
  await checkCalendarIntegration()
  await checkTeamModule()
  await checkPaymentModule()
  await checkNotificationModule()
  await checkAuditModule()

  console.log('\n📊 Integration Check Results:\n')
  console.log('─'.repeat(80))

  let passCount = 0
  let failCount = 0
  let warningCount = 0

  results.forEach(result => {
    const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️'
    console.log(`${icon} ${result.module}: ${result.message}`)
    if (result.details) {
      console.log(`   Details: ${result.details}`)
    }

    if (result.status === 'pass') passCount++
    else if (result.status === 'fail') failCount++
    else warningCount++
  })

  console.log('─'.repeat(80))
  console.log(`\n📈 Summary: ${passCount} passed, ${failCount} failed, ${warningCount} warnings\n`)

  if (failCount > 0) {
    console.log('❌ Integration check failed. Please fix the issues above.')
    process.exit(1)
  } else if (warningCount > 0) {
    console.log('⚠️  Integration check passed with warnings.')
  } else {
    console.log('✅ All integration checks passed!')
  }

  await prisma.$disconnect()
}

runIntegrationChecks().catch(error => {
  console.error('Fatal error during integration check:', error)
  process.exit(1)
})
