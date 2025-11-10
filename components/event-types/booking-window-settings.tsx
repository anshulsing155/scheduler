'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface BookingWindowSettingsProps {
  minimumNotice: number
  maxBookingWindow: number
  onMinimumNoticeChange: (minutes: number) => void
  onMaxBookingWindowChange: (days: number) => void
}

const MINIMUM_NOTICE_PRESETS = [
  { value: 0, label: 'No minimum' },
  { value: 60, label: '1 hour' },
  { value: 120, label: '2 hours' },
  { value: 240, label: '4 hours' },
  { value: 480, label: '8 hours' },
  { value: 1440, label: '1 day' },
  { value: 2880, label: '2 days' },
  { value: 10080, label: '1 week' },
]

const MAX_WINDOW_PRESETS = [
  { value: 7, label: '1 week' },
  { value: 14, label: '2 weeks' },
  { value: 30, label: '1 month' },
  { value: 60, label: '2 months' },
  { value: 90, label: '3 months' },
  { value: 180, label: '6 months' },
  { value: 365, label: '1 year' },
]

export function BookingWindowSettings({
  minimumNotice,
  maxBookingWindow,
  onMinimumNoticeChange,
  onMaxBookingWindowChange,
}: BookingWindowSettingsProps) {
  const isCustomMinimumNotice = !MINIMUM_NOTICE_PRESETS.some((p) => p.value === minimumNotice)
  const isCustomMaxWindow = !MAX_WINDOW_PRESETS.some((p) => p.value === maxBookingWindow)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Booking Window</CardTitle>
        <CardDescription>
          Control when guests can book this event type
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="minimumNotice">Minimum Notice</Label>
          <Select
            value={isCustomMinimumNotice ? 'custom' : minimumNotice.toString()}
            onValueChange={(value) => {
              if (value !== 'custom') {
                onMinimumNoticeChange(parseInt(value))
              }
            }}
          >
            <SelectTrigger id="minimumNotice">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MINIMUM_NOTICE_PRESETS.map((preset) => (
                <SelectItem key={preset.value} value={preset.value.toString()}>
                  {preset.label}
                </SelectItem>
              ))}
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
          {isCustomMinimumNotice && (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0"
                value={minimumNotice}
                onChange={(e) => onMinimumNoticeChange(parseInt(e.target.value) || 0)}
                placeholder="Enter minutes"
              />
              <span className="text-sm text-muted-foreground">minutes</span>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            How much advance notice do you need before a booking?
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxWindow">Maximum Booking Window</Label>
          <Select
            value={isCustomMaxWindow ? 'custom' : maxBookingWindow.toString()}
            onValueChange={(value) => {
              if (value !== 'custom') {
                onMaxBookingWindowChange(parseInt(value))
              }
            }}
          >
            <SelectTrigger id="maxWindow">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MAX_WINDOW_PRESETS.map((preset) => (
                <SelectItem key={preset.value} value={preset.value.toString()}>
                  {preset.label}
                </SelectItem>
              ))}
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
          {isCustomMaxWindow && (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="1"
                max="365"
                value={maxBookingWindow}
                onChange={(e) => onMaxBookingWindowChange(parseInt(e.target.value) || 60)}
                placeholder="Enter days"
              />
              <span className="text-sm text-muted-foreground">days</span>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            How far into the future can guests book?
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
