'use client'

import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface DurationSelectorProps {
  value: number
  onChange: (duration: number) => void
}

const PRESET_DURATIONS = [15, 30, 45, 60, 90, 120]

export function DurationSelector({ value, onChange }: DurationSelectorProps) {
  const [customMode, setCustomMode] = useState(!PRESET_DURATIONS.includes(value))

  const handlePresetClick = (duration: number) => {
    setCustomMode(false)
    onChange(duration)
  }

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const duration = parseInt(e.target.value) || 0
    onChange(duration)
  }

  return (
    <div className="space-y-3">
      <Label>Duration</Label>
      <div className="grid grid-cols-3 gap-2">
        {PRESET_DURATIONS.map((duration) => (
          <Button
            key={duration}
            type="button"
            variant={value === duration && !customMode ? 'default' : 'outline'}
            onClick={() => handlePresetClick(duration)}
          >
            {duration} min
          </Button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant={customMode ? 'default' : 'outline'}
          onClick={() => setCustomMode(true)}
          className="flex-shrink-0"
        >
          Custom
        </Button>
        {customMode && (
          <div className="flex items-center gap-2 flex-1">
            <Input
              type="number"
              min="5"
              max="480"
              value={value}
              onChange={handleCustomChange}
              placeholder="Enter duration"
            />
            <span className="text-sm text-muted-foreground">minutes</span>
          </div>
        )}
      </div>
    </div>
  )
}
