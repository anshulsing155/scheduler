'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface OnboardingContextType {
  isOnboarding: boolean
  currentStep: number
  totalSteps: number
  showTour: boolean
  setShowTour: (show: boolean) => void
  nextStep: () => void
  prevStep: () => void
  skipOnboarding: () => void
  completeTour: () => void
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

export function OnboardingProvider({ 
  children,
  initialOnboarding = false,
  initialStep = 0,
  hasSeenTour = false
}: { 
  children: ReactNode
  initialOnboarding?: boolean
  initialStep?: number
  hasSeenTour?: boolean
}) {
  const [isOnboarding, setIsOnboarding] = useState(initialOnboarding)
  const [currentStep, setCurrentStep] = useState(initialStep)
  const [showTour, setShowTour] = useState(!hasSeenTour && !initialOnboarding)
  const totalSteps = 4

  const nextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      completeOnboarding()
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const completeOnboarding = async () => {
    try {
      await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: true })
      })
      setIsOnboarding(false)
    } catch (error) {
      console.error('Failed to complete onboarding:', error)
    }
  }

  const skipOnboarding = async () => {
    await completeOnboarding()
  }

  const completeTour = async () => {
    try {
      await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hasSeenTour: true })
      })
      setShowTour(false)
    } catch (error) {
      console.error('Failed to complete tour:', error)
    }
  }

  return (
    <OnboardingContext.Provider
      value={{
        isOnboarding,
        currentStep,
        totalSteps,
        showTour,
        setShowTour,
        nextStep,
        prevStep,
        skipOnboarding,
        completeTour
      }}
    >
      {children}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding() {
  const context = useContext(OnboardingContext)
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider')
  }
  return context
}
