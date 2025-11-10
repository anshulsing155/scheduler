'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { WeeklySchedule } from '@/services/availability-service'

interface BulkAvailabilityActionsProps {
  onApplyTemplate: (template: 'business' | 'flexible' | 'weekend') => void
  onClearAll: () => void
}

const TEMPLATES: Record<
  'business' | 'flexible' | 'weekend',
  { label: string; description: string; schedule: WeeklySchedule[] }
> = {
  business: {
    label: 'Business Hours',
    description: 'Monday-Friday, 9 AM - 5 PM',
    schedule: [
      { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 2, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 3, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 4, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 5, startTime: '09:00', endTime: '17:00' },
    ],
  },
  flexible: {
    label: 'Flexible Hours',
    description: 'Monday-Friday, 10 AM - 6 PM',
    schedule: [
      { dayOfWeek: 1, startTime: '10:00', endTime: '18:00' },
      { dayOfWeek: 2, startTime: '10:00', endTime: '18:00' },
      { dayOfWeek: 3, startTime: '10:00', endTime: '18:00' },
      { dayOfWeek: 4, startTime: '10:00', endTime: '18:00' },
      { dayOfWeek: 5, startTime: '10:00', endTime: '18:00' },
    ],
  },
  weekend: {
    label: 'Weekend Hours',
    description: 'Saturday-Sunday, 10 AM - 4 PM',
    schedule: [
      { dayOfWeek: 0, startTime: '10:00', endTime: '16:00' },
      { dayOfWeek: 6, startTime: '10:00', endTime: '16:00' },
    ],
  },
}

export function BulkAvailabilityActions({
  onApplyTemplate,
  onClearAll,
}: BulkAvailabilityActionsProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">Quick Templates</h3>
        <p className="text-sm text-muted-foreground">
          Apply a preset schedule to quickly set your availability
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(TEMPLATES).map(([key, template]) => (
          <Card key={key} className="p-4">
            <div className="space-y-3">
              <div>
                <h4 className="font-medium">{template.label}</h4>
                <p className="text-sm text-muted-foreground">{template.description}</p>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => onApplyTemplate(key as 'business' | 'flexible' | 'weekend')}
              >
                Apply Template
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-4 border-destructive/50 bg-destructive/5">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium">Clear All Availability</h4>
            <p className="text-sm text-muted-foreground">
              Remove all weekly hours and start from scratch
            </p>
          </div>
          <Button variant="destructive" onClick={onClearAll}>
            Clear All
          </Button>
        </div>
      </Card>
    </div>
  )
}

export { TEMPLATES }
