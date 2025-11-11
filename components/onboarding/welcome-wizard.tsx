'use client'

import { useOnboarding } from './onboarding-provider'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { CheckCircle2, User, Calendar, Clock, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'

const steps = [
  {
    title: 'Welcome to Your Scheduler!',
    description: 'Let\'s get you set up in just a few steps. This will only take a minute.',
    icon: Sparkles,
    content: (
      <div className="space-y-4">
        <p className="text-gray-600">
          Your scheduling platform is ready to help you:
        </p>
        <ul className="space-y-2">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
            <span>Create customizable booking pages</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
            <span>Manage your availability effortlessly</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
            <span>Accept bookings 24/7 automatically</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
            <span>Sync with your existing calendars</span>
          </li>
        </ul>
      </div>
    )
  },
  {
    title: 'Complete Your Profile',
    description: 'Add your details to personalize your booking page.',
    icon: User,
    content: (
      <div className="space-y-4">
        <p className="text-gray-600">
          Your profile helps guests know who they're meeting with:
        </p>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
            <span><strong>Name & Bio:</strong> Tell guests about yourself</span>
          </li>
          <li className="flex items-start gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
            <span><strong>Profile Photo:</strong> Add a professional image</span>
          </li>
          <li className="flex items-start gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
            <span><strong>Timezone:</strong> Ensure accurate scheduling</span>
          </li>
        </ul>
      </div>
    ),
    action: {
      label: 'Set Up Profile',
      href: '/dashboard/settings/profile'
    }
  },
  {
    title: 'Create Your First Event Type',
    description: 'Event types are meeting templates that guests can book.',
    icon: Calendar,
    content: (
      <div className="space-y-4">
        <p className="text-gray-600">
          Create different event types for various meeting scenarios:
        </p>
        <div className="grid grid-cols-1 gap-3 text-sm">
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="font-medium text-blue-900">15-min Quick Chat</div>
            <div className="text-blue-700 text-xs">Perfect for brief consultations</div>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg">
            <div className="font-medium text-purple-900">30-min Meeting</div>
            <div className="text-purple-700 text-xs">Standard meeting duration</div>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="font-medium text-green-900">60-min Deep Dive</div>
            <div className="text-green-700 text-xs">For detailed discussions</div>
          </div>
        </div>
      </div>
    ),
    action: {
      label: 'Create Event Type',
      href: '/dashboard/event-types/new'
    }
  },
  {
    title: 'Set Your Availability',
    description: 'Define when you\'re available for bookings.',
    icon: Clock,
    content: (
      <div className="space-y-4">
        <p className="text-gray-600">
          Control your schedule by setting:
        </p>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
            <span><strong>Weekly Hours:</strong> Your regular availability</span>
          </li>
          <li className="flex items-start gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
            <span><strong>Date Overrides:</strong> Block out vacation days</span>
          </li>
          <li className="flex items-start gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
            <span><strong>Buffer Times:</strong> Add breaks between meetings</span>
          </li>
          <li className="flex items-start gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
            <span><strong>Calendar Sync:</strong> Prevent double-bookings</span>
          </li>
        </ul>
      </div>
    ),
    action: {
      label: 'Set Availability',
      href: '/dashboard/availability'
    }
  }
]

export function WelcomeWizard() {
  const { currentStep, totalSteps, nextStep, prevStep, skipOnboarding } = useOnboarding()
  const router = useRouter()
  const step = steps[currentStep]
  const Icon = step.icon
  const progress = ((currentStep + 1) / totalSteps) * 100

  const handleAction = () => {
    if (step.action) {
      router.push(step.action.href)
    } else {
      nextStep()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-2xl w-full p-8 relative">
        <button
          onClick={skipOnboarding}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-sm"
        >
          Skip
        </button>

        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Icon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{step.title}</h2>
              <p className="text-gray-600 text-sm">{step.description}</p>
            </div>
          </div>
          
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-gray-500 mt-2">
            Step {currentStep + 1} of {totalSteps}
          </p>
        </div>

        <div className="mb-8">
          {step.content}
        </div>

        <div className="flex justify-between items-center">
          <Button
            variant="ghost"
            onClick={prevStep}
            disabled={currentStep === 0}
          >
            Back
          </Button>
          
          <div className="flex gap-2">
            {currentStep < totalSteps - 1 && (
              <Button variant="outline" onClick={skipOnboarding}>
                Skip for Now
              </Button>
            )}
            <Button onClick={handleAction}>
              {step.action ? step.action.label : currentStep === totalSteps - 1 ? 'Get Started' : 'Next'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
