import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { completed, hasSeenTour, step } = body

    const updateData: any = {}
    
    if (completed !== undefined) {
      updateData.onboardingCompleted = completed
    }
    
    if (hasSeenTour !== undefined) {
      updateData.hasSeenTour = hasSeenTour
    }
    
    if (step !== undefined) {
      updateData.onboardingStep = step
    }

    const user = await prisma.user.update({
      where: { email: authUser.email! },
      data: updateData,
      select: {
        id: true,
        onboardingCompleted: true,
        onboardingStep: true,
        hasSeenTour: true
      }
    })

    return NextResponse.json({ success: true, user })
  } catch (error) {
    console.error('Error updating onboarding:', error)
    return NextResponse.json(
      { error: 'Failed to update onboarding status' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: authUser.email! },
      select: {
        id: true,
        onboardingCompleted: true,
        onboardingStep: true,
        hasSeenTour: true,
        name: true,
        username: true,
        avatarUrl: true,
        timezone: true,
        eventTypes: {
          select: { id: true },
          take: 1
        },
        availability: {
          select: { id: true },
          take: 1
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Calculate onboarding tasks completion
    const tasks = {
      profileComplete: !!(user.name && user.avatarUrl && user.timezone),
      eventTypeCreated: user.eventTypes.length > 0,
      availabilitySet: user.availability.length > 0
    }

    return NextResponse.json({
      onboardingCompleted: user.onboardingCompleted,
      onboardingStep: user.onboardingStep,
      hasSeenTour: user.hasSeenTour,
      tasks
    })
  } catch (error) {
    console.error('Error fetching onboarding status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch onboarding status' },
      { status: 500 }
    )
  }
}
