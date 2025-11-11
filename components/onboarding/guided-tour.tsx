'use client'

import { useOnboarding } from './onboarding-provider'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { X, ArrowRight } from 'lucide-react'
import { useState, useEffect } from 'react'

interface TourStep {
  target: string
  title: string
  content: string
  position: 'top' | 'bottom' | 'left' | 'right'
}

const tourSteps: TourStep[] = [
  {
    target: '[data-tour="profile"]',
    title: 'Your Profile',
    content: 'Manage your personal information, timezone, and branding settings here.',
    position: 'bottom'
  },
  {
    target: '[data-tour="event-types"]',
    title: 'Event Types',
    content: 'Create different meeting types with custom durations and settings.',
    position: 'bottom'
  },
  {
    target: '[data-tour="bookings"]',
    title: 'Bookings',
    content: 'View and manage all your scheduled meetings in one place.',
    position: 'bottom'
  },
  {
    target: '[data-tour="availability"]',
    title: 'Availability',
    content: 'Set your weekly schedule and connect external calendars.',
    position: 'right'
  },
  {
    target: '[data-tour="analytics"]',
    title: 'Analytics',
    content: 'Track your booking metrics and see performance insights.',
    position: 'right'
  }
]

export function GuidedTour() {
  const { showTour, completeTour } = useOnboarding()
  const [currentStep, setCurrentStep] = useState(0)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (!showTour) return

    const updatePosition = () => {
      const step = tourSteps[currentStep]
      const element = document.querySelector(step.target)
      
      if (element) {
        const rect = element.getBoundingClientRect()
        let top = 0
        let left = 0

        switch (step.position) {
          case 'bottom':
            top = rect.bottom + 10
            left = rect.left + rect.width / 2
            break
          case 'top':
            top = rect.top - 10
            left = rect.left + rect.width / 2
            break
          case 'right':
            top = rect.top + rect.height / 2
            left = rect.right + 10
            break
          case 'left':
            top = rect.top + rect.height / 2
            left = rect.left - 10
            break
        }

        setPosition({ top, left })
        setIsVisible(true)

        // Highlight the target element
        element.classList.add('tour-highlight')
      }
    }

    // Wait for DOM to be ready
    setTimeout(updatePosition, 100)

    // Update on resize
    window.addEventListener('resize', updatePosition)
    return () => {
      window.removeEventListener('resize', updatePosition)
      // Remove highlight from all elements
      document.querySelectorAll('.tour-highlight').forEach(el => {
        el.classList.remove('tour-highlight')
      })
    }
  }, [currentStep, showTour])

  if (!showTour || !isVisible) return null

  const step = tourSteps[currentStep]
  const isLastStep = currentStep === tourSteps.length - 1

  const handleNext = () => {
    if (isLastStep) {
      completeTour()
    } else {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handleSkip = () => {
    completeTour()
  }

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/30 z-40 pointer-events-none" />
      
      {/* Tour tooltip */}
      <Card
        className="fixed z-50 p-4 max-w-sm shadow-lg"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
          transform: step.position === 'bottom' || step.position === 'top' 
            ? 'translateX(-50%)' 
            : step.position === 'right' 
            ? 'translateY(-50%)' 
            : 'translate(-100%, -50%)'
        }}
      >
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-lg">{step.title}</h3>
          <button
            onClick={handleSkip}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        
        <p className="text-sm text-gray-600 mb-4">{step.content}</p>
        
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">
            {currentStep + 1} of {tourSteps.length}
          </span>
          
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleSkip}>
              Skip Tour
            </Button>
            <Button size="sm" onClick={handleNext}>
              {isLastStep ? 'Finish' : 'Next'}
              {!isLastStep && <ArrowRight className="h-4 w-4 ml-1" />}
            </Button>
          </div>
        </div>
      </Card>
    </>
  )
}
