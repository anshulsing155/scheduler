'use client'

import { ReactNode, useState } from 'react'
import { OnboardingProvider, WelcomeWizard, GuidedTour, OnboardingProgress } from '@/components/onboarding'
import { HelpWidget } from '@/components/help/help-widget'

interface OnboardingData {
  onboardingCompleted: boolean
  onboardingStep: number
  hasSeenTour: boolean
  tasks: {
    profileComplete: boolean
    eventTypeCreated: boolean
    availabilitySet: boolean
  }
}

interface DashboardClientProps {
  user: any
  onboardingData: OnboardingData
  children: ReactNode
}

export function DashboardClient({ user, onboardingData, children }: DashboardClientProps) {
  const [showProgress, setShowProgress] = useState(!onboardingData.onboardingCompleted)

  const tasks = [
    {
      id: 'profile',
      title: 'Complete your profile',
      description: 'Add your name, photo, and timezone',
      completed: onboardingData.tasks.profileComplete,
      href: '/dashboard/settings/profile'
    },
    {
      id: 'event-type',
      title: 'Create your first event type',
      description: 'Set up a meeting template for bookings',
      completed: onboardingData.tasks.eventTypeCreated,
      href: '/dashboard/event-types/new'
    },
    {
      id: 'availability',
      title: 'Set your availability',
      description: 'Define when you\'re available for meetings',
      completed: onboardingData.tasks.availabilitySet,
      href: '/dashboard/availability'
    }
  ]

  return (
    <OnboardingProvider
      initialOnboarding={!onboardingData.onboardingCompleted}
      initialStep={onboardingData.onboardingStep}
      hasSeenTour={onboardingData.hasSeenTour}
    >
      {!onboardingData.onboardingCompleted && <WelcomeWizard />}
      {onboardingData.onboardingCompleted && !onboardingData.hasSeenTour && <GuidedTour />}
      
      <div className="space-y-6">
        {showProgress && !onboardingData.onboardingCompleted && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
            <OnboardingProgress 
              tasks={tasks} 
              onDismiss={() => setShowProgress(false)}
            />
          </div>
        )}
        {children}
      </div>

      <HelpWidget />
    </OnboardingProvider>
  )
}
