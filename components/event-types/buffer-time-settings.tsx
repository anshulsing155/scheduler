'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface BufferTimeSettingsProps {
  bufferTimeBefore: number
  bufferTimeAfter: number
  onBufferTimeBeforeChange: (minutes: number) => void
  onBufferTimeAfterChange: (minutes: number) => void
}

export function BufferTimeSettings({
  bufferTimeBefore,
  bufferTimeAfter,
  onBufferTimeBeforeChange,
  onBufferTimeAfterChange,
}: BufferTimeSettingsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Buffer Time</CardTitle>
        <CardDescription>
          Add time before or after meetings to prevent back-to-back bookings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="bufferBefore">Buffer Before Meeting (minutes)</Label>
          <Input
            id="bufferBefore"
            type="number"
            min="0"
            max="120"
            value={bufferTimeBefore}
            onChange={(e) => onBufferTimeBeforeChange(parseInt(e.target.value) || 0)}
            placeholder="0"
          />
          <p className="text-xs text-muted-foreground">
            Time to block before the meeting starts
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bufferAfter">Buffer After Meeting (minutes)</Label>
          <Input
            id="bufferAfter"
            type="number"
            min="0"
            max="120"
            value={bufferTimeAfter}
            onChange={(e) => onBufferTimeAfterChange(parseInt(e.target.value) || 0)}
            placeholder="0"
          />
          <p className="text-xs text-muted-foreground">
            Time to block after the meeting ends
          </p>
        </div>

        {(bufferTimeBefore > 0 || bufferTimeAfter > 0) && (
          <div className="bg-muted p-3 rounded-md">
            <p className="text-sm">
              <strong>Example:</strong> For a 30-minute meeting with {bufferTimeBefore} min before and{' '}
              {bufferTimeAfter} min after, a total of{' '}
              {bufferTimeBefore + 30 + bufferTimeAfter} minutes will be blocked on your calendar.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
