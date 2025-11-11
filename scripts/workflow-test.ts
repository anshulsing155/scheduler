/**
 * Workflow Test Script
 * Tests complete user workflows to ensure all modules work together
 */

import { prisma } from '@/lib/prisma'

interface WorkflowResult {
  workflow: string
  status: 'pass' | 'fail'
  message: string
  steps: { step: string; status: 'pass' | 'fail'; message: string }[]
}

const results: WorkflowResult[] = []

async function testUserRegistrationWorkflow() {
  const workflow: WorkflowResult = {
    workflow: 'User Registration & Profile Setup',
    status: 'pass',
    message: '',
    steps: []
  }

  try {
    // Step 1: Check if users can be created
    const testEmail = `test-${Date.now()}@example.com`
    const testUsername = `testuser${Date.now()}`

    const user = await prisma.user.create({
      data: {
        email: testEmail,
        username: testUsername,
        name: 'Test User',
        timezone: 'America/New_York'
      }
    })

    workflow.steps.push({
      step: 'User Creation',
      status: 'pass',
      message: 'User created successfully'
    })

    // Step 2: Check if profile can be updated
    await prisma.user.update({
      where: { id: user.id },
      data: {
        bio: 'Test bio',
        brandColor: '#3B82F6'
      }
    })

    workflow.steps.push({
      step: 'Profile Update',
      status: 'pass',
      message: 'Profile updated successfully'
    })

    // Step 3: Check onboarding fields
    await prisma.user.update({
      where: { id: user.id },
      data: {
        onboardingCompleted: true,
        onboardingStep: 3
      }
    })

    workflow.steps.push({
      step: 'Onboarding Tracking',
      status: 'pass',
      message: 'Onboarding fields working'
    })

    // Cleanup
    await prisma.user.delete({ where: { id: user.id } })

    workflow.message = 'User registration workflow completed successfully'
  } catch (error) {
    workflow.status = 'fail'
    workflow.message = error instanceof Error ? error.message : String(error)
  }

  results.push(workflow)
}

async function testEventTypeCreationWorkflow() {
  const workflow: WorkflowResult = {
    workflow: 'Event Type Creation & Configuration',
    status: 'pass',
    message: '',
    steps: []
  }

  try {
    // Get or create a test user
    let user = await prisma.user.findFirst()
    let createdUser = false

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: `workflow-test-${Date.now()}@example.com`,
          username: `workflowtest${Date.now()}`,
          name: 'Workflow Test User'
        }
      })
      createdUser = true
    }

    // Step 1: Create event type
    const eventType = await prisma.eventType.create({
      data: {
        userId: user.id,
        title: '30 Minute Meeting',
        slug: `meeting-${Date.now()}`,
        description: 'A quick 30-minute meeting',
        duration: 30,
        locationType: 'VIDEO_ZOOM',
        minimumNotice: 60,
        bufferTimeBefore: 15,
        bufferTimeAfter: 15
      }
    })

    workflow.steps.push({
      step: 'Event Type Creation',
      status: 'pass',
      message: 'Event type created successfully'
    })

    // Step 2: Update event type with custom questions
    await prisma.eventType.update({
      where: { id: eventType.id },
      data: {
        customQuestions: [
          { id: '1', question: 'What would you like to discuss?', type: 'text', required: true }
        ]
      }
    })

    workflow.steps.push({
      step: 'Custom Questions',
      status: 'pass',
      message: 'Custom questions configured'
    })

    // Step 3: Add payment settings
    await prisma.eventType.update({
      where: { id: eventType.id },
      data: {
        price: 50.00,
        currency: 'USD'
      }
    })

    workflow.steps.push({
      step: 'Payment Configuration',
      status: 'pass',
      message: 'Payment settings configured'
    })

    // Cleanup
    await prisma.eventType.delete({ where: { id: eventType.id } })
    if (createdUser) {
      await prisma.user.delete({ where: { id: user.id } })
    }

    workflow.message = 'Event type workflow completed successfully'
  } catch (error) {
    workflow.status = 'fail'
    workflow.message = error instanceof Error ? error.message : String(error)
  }

  results.push(workflow)
}

async function testAvailabilityWorkflow() {
  const workflow: WorkflowResult = {
    workflow: 'Availability Management',
    status: 'pass',
    message: '',
    steps: []
  }

  try {
    // Get or create a test user
    let user = await prisma.user.findFirst()
    let createdUser = false

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: `availability-test-${Date.now()}@example.com`,
          username: `availtest${Date.now()}`,
          name: 'Availability Test User'
        }
      })
      createdUser = true
    }

    // Step 1: Set weekly availability
    const availabilities = await prisma.availability.createMany({
      data: [
        { userId: user.id, dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
        { userId: user.id, dayOfWeek: 2, startTime: '09:00', endTime: '17:00' },
        { userId: user.id, dayOfWeek: 3, startTime: '09:00', endTime: '17:00' }
      ]
    })

    workflow.steps.push({
      step: 'Weekly Schedule',
      status: 'pass',
      message: `Created ${availabilities.count} availability slots`
    })

    // Step 2: Add date override
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)

    await prisma.dateOverride.create({
      data: {
        userId: user.id,
        date: tomorrow,
        isAvailable: false
      }
    })

    workflow.steps.push({
      step: 'Date Override',
      status: 'pass',
      message: 'Date override created successfully'
    })

    // Cleanup
    await prisma.availability.deleteMany({ where: { userId: user.id } })
    await prisma.dateOverride.deleteMany({ where: { userId: user.id } })
    if (createdUser) {
      await prisma.user.delete({ where: { id: user.id } })
    }

    workflow.message = 'Availability workflow completed successfully'
  } catch (error) {
    workflow.status = 'fail'
    workflow.message = error instanceof Error ? error.message : String(error)
  }

  results.push(workflow)
}

async function testBookingWorkflow() {
  const workflow: WorkflowResult = {
    workflow: 'Booking Creation & Management',
    status: 'pass',
    message: '',
    steps: []
  }

  try {
    // Get or create test user and event type
    let user = await prisma.user.findFirst({ include: { eventTypes: { take: 1 } } })
    let createdUser = false
    let createdEventType = false

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: `booking-test-${Date.now()}@example.com`,
          username: `bookingtest${Date.now()}`,
          name: 'Booking Test User'
        },
        include: { eventTypes: true }
      })
      createdUser = true
    }

    let eventType = user.eventTypes[0]
    if (!eventType) {
      eventType = await prisma.eventType.create({
        data: {
          userId: user.id,
          title: 'Test Meeting',
          slug: `test-${Date.now()}`,
          duration: 30
        }
      })
      createdEventType = true
    }

    // Step 1: Create booking
    const startTime = new Date()
    startTime.setDate(startTime.getDate() + 7)
    startTime.setHours(14, 0, 0, 0)

    const endTime = new Date(startTime)
    endTime.setMinutes(endTime.getMinutes() + eventType.duration)

    const booking = await prisma.booking.create({
      data: {
        eventTypeId: eventType.id,
        userId: user.id,
        guestName: 'John Doe',
        guestEmail: 'john@example.com',
        guestTimezone: 'America/New_York',
        startTime,
        endTime,
        status: 'CONFIRMED'
      }
    })

    workflow.steps.push({
      step: 'Booking Creation',
      status: 'pass',
      message: 'Booking created successfully'
    })

    // Step 2: Update booking status
    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: 'COMPLETED' }
    })

    workflow.steps.push({
      step: 'Booking Update',
      status: 'pass',
      message: 'Booking status updated'
    })

    // Step 3: Create reminder
    const reminderTime = new Date(startTime)
    reminderTime.setHours(reminderTime.getHours() - 1)

    await prisma.reminder.create({
      data: {
        bookingId: booking.id,
        type: 'EMAIL',
        scheduledFor: reminderTime,
        status: 'PENDING'
      }
    })

    workflow.steps.push({
      step: 'Reminder Creation',
      status: 'pass',
      message: 'Reminder created successfully'
    })

    // Cleanup
    await prisma.reminder.deleteMany({ where: { bookingId: booking.id } })
    await prisma.booking.delete({ where: { id: booking.id } })
    if (createdEventType) {
      await prisma.eventType.delete({ where: { id: eventType.id } })
    }
    if (createdUser) {
      await prisma.user.delete({ where: { id: user.id } })
    }

    workflow.message = 'Booking workflow completed successfully'
  } catch (error) {
    workflow.status = 'fail'
    workflow.message = error instanceof Error ? error.message : String(error)
  }

  results.push(workflow)
}

async function testTeamWorkflow() {
  const workflow: WorkflowResult = {
    workflow: 'Team Scheduling',
    status: 'pass',
    message: '',
    steps: []
  }

  try {
    // Create test users
    const owner = await prisma.user.create({
      data: {
        email: `team-owner-${Date.now()}@example.com`,
        username: `teamowner${Date.now()}`,
        name: 'Team Owner'
      }
    })

    const member = await prisma.user.create({
      data: {
        email: `team-member-${Date.now()}@example.com`,
        username: `teammember${Date.now()}`,
        name: 'Team Member'
      }
    })

    // Step 1: Create team
    const team = await prisma.team.create({
      data: {
        name: 'Test Team',
        slug: `test-team-${Date.now()}`
      }
    })

    workflow.steps.push({
      step: 'Team Creation',
      status: 'pass',
      message: 'Team created successfully'
    })

    // Step 2: Add team members
    await prisma.teamMember.createMany({
      data: [
        { teamId: team.id, userId: owner.id, role: 'OWNER', isAccepted: true },
        { teamId: team.id, userId: member.id, role: 'MEMBER', isAccepted: false }
      ]
    })

    workflow.steps.push({
      step: 'Team Members',
      status: 'pass',
      message: 'Team members added successfully'
    })

    // Step 3: Create team event type
    const teamEventType = await prisma.eventType.create({
      data: {
        userId: owner.id,
        teamId: team.id,
        title: 'Team Meeting',
        slug: `team-meeting-${Date.now()}`,
        duration: 30,
        schedulingType: 'ROUND_ROBIN'
      }
    })

    workflow.steps.push({
      step: 'Team Event Type',
      status: 'pass',
      message: 'Team event type created successfully'
    })

    // Cleanup
    await prisma.eventType.delete({ where: { id: teamEventType.id } })
    await prisma.teamMember.deleteMany({ where: { teamId: team.id } })
    await prisma.team.delete({ where: { id: team.id } })
    await prisma.user.delete({ where: { id: owner.id } })
    await prisma.user.delete({ where: { id: member.id } })

    workflow.message = 'Team workflow completed successfully'
  } catch (error) {
    workflow.status = 'fail'
    workflow.message = error instanceof Error ? error.message : String(error)
  }

  results.push(workflow)
}

async function runWorkflowTests() {
  console.log('🔄 Running Workflow Tests...\n')

  await testUserRegistrationWorkflow()
  await testEventTypeCreationWorkflow()
  await testAvailabilityWorkflow()
  await testBookingWorkflow()
  await testTeamWorkflow()

  console.log('\n📊 Workflow Test Results:\n')
  console.log('═'.repeat(80))

  let passCount = 0
  let failCount = 0

  results.forEach(result => {
    const icon = result.status === 'pass' ? '✅' : '❌'
    console.log(`\n${icon} ${result.workflow}`)
    console.log(`   ${result.message}`)

    if (result.steps.length > 0) {
      console.log('   Steps:')
      result.steps.forEach(step => {
        const stepIcon = step.status === 'pass' ? '  ✓' : '  ✗'
        console.log(`   ${stepIcon} ${step.step}: ${step.message}`)
      })
    }

    if (result.status === 'pass') passCount++
    else failCount++
  })

  console.log('\n' + '═'.repeat(80))
  console.log(`\n📈 Summary: ${passCount} workflows passed, ${failCount} workflows failed\n`)

  if (failCount > 0) {
    console.log('❌ Workflow tests failed. Please fix the issues above.')
    process.exit(1)
  } else {
    console.log('✅ All workflow tests passed!')
  }

  await prisma.$disconnect()
}

runWorkflowTests().catch(error => {
  console.error('Fatal error during workflow tests:', error)
  process.exit(1)
})
