'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Circle, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface OnboardingTask {
  id: string
  title: string
  description: string
  completed: boolean
  href: string
}

interface OnboardingProgressProps {
  tasks: OnboardingTask[]
  onDismiss?: () => void
}

export function OnboardingProgress({ tasks, onDismiss }: OnboardingProgressProps) {
  const completedCount = tasks.filter(t => t.completed).length
  const totalCount = tasks.length
  const progress = (completedCount / totalCount) * 100

  if (completedCount === totalCount && onDismiss) {
    return null
  }

  return (
    <Card className="p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold">Get Started</h3>
          <p className="text-sm text-gray-600">
            Complete these steps to get the most out of your scheduler
          </p>
        </div>
        {onDismiss && (
          <Button variant="ghost" size="sm" onClick={onDismiss}>
            Dismiss
          </Button>
        )}
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600">Progress</span>
          <span className="font-medium">{completedCount} of {totalCount} completed</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="space-y-3">
        {tasks.map((task) => (
          <Link
            key={task.id}
            href={task.href}
            className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
          >
            <div className="mt-0.5">
              {task.completed ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <Circle className="h-5 w-5 text-gray-300" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className={`text-sm font-medium ${task.completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                  {task.title}
                </h4>
                {!task.completed && (
                  <ArrowRight className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </div>
              <p className="text-xs text-gray-600 mt-0.5">{task.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </Card>
  )
}
