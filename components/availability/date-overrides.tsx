'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { DateOverride } from '@/services/availability-service'
import { format, parseISO, startOfDay } from 'date-fns'

interface DateOverridesProps {
  overrides: any[]
  onAdd: (override: DateOverride) => void
  onRemove: (date: Date) => void
}

export function DateOverrides({ overrides, onAdd, onRemove }: DateOverridesProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [newOverride, setNewOverride] = useState<{
    date: string
    isAvailable: boolean
    startTime: string
    endTime: string
  }>({
    date: format(new Date(), 'yyyy-MM-dd'),
    isAvailable: false,
    startTime: '09:00',
    endTime: '17:00',
  })

  const handleAdd = () => {
    const override: DateOverride = {
      date: startOfDay(parseISO(newOverride.date)),
      isAvailable: newOverride.isAvailable,
      startTime: newOverride.isAvailable ? newOverride.startTime : undefined,
      endTime: newOverride.isAvailable ? newOverride.endTime : undefined,
    }

    onAdd(override)
    setShowAddForm(false)
    setNewOverride({
      date: format(new Date(), 'yyyy-MM-dd'),
      isAvailable: false,
      startTime: '09:00',
      endTime: '17:00',
    })
  }

  const sortedOverrides = [...overrides].sort((a, b) => {
    const dateA = new Date(a.date)
    const dateB = new Date(b.date)
    return dateA.getTime() - dateB.getTime()
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Date Overrides</h3>
          <p className="text-sm text-muted-foreground">
            Set specific dates when you're unavailable or have different hours
          </p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? 'Cancel' : 'Add Date'}
        </Button>
      </div>

      {showAddForm && (
        <Card className="p-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="override-date">Date</Label>
              <Input
                id="override-date"
                type="date"
                value={newOverride.date}
                onChange={(e) => setNewOverride({ ...newOverride, date: e.target.value })}
                min={format(new Date(), 'yyyy-MM-dd')}
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={newOverride.isAvailable}
                onCheckedChange={(checked: boolean) =>
                  setNewOverride({ ...newOverride, isAvailable: checked })
                }
              />
              <Label>Available on this date</Label>
            </div>

            {newOverride.isAvailable && (
              <div className="space-y-2">
                <Label>Hours</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="time"
                    value={newOverride.startTime}
                    onChange={(e) =>
                      setNewOverride({ ...newOverride, startTime: e.target.value })
                    }
                    className="w-32"
                  />
                  <span className="text-muted-foreground">to</span>
                  <Input
                    type="time"
                    value={newOverride.endTime}
                    onChange={(e) => setNewOverride({ ...newOverride, endTime: e.target.value })}
                    className="w-32"
                  />
                </div>
              </div>
            )}

            <Button onClick={handleAdd} className="w-full">
              Add Override
            </Button>
          </div>
        </Card>
      )}

      {sortedOverrides.length > 0 ? (
        <div className="space-y-2">
          {sortedOverrides.map((override) => {
            const date = new Date(override.date)
            return (
              <Card key={override.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{format(date, 'EEEE, MMMM d, yyyy')}</div>
                    <div className="text-sm text-muted-foreground">
                      {override.isAvailable ? (
                        <>
                          Available: {override.startTime} - {override.endTime}
                        </>
                      ) : (
                        'Unavailable'
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemove(startOfDay(date))}
                  >
                    Remove
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="p-8">
          <div className="text-center text-muted-foreground">
            No date overrides set. Add dates when you have different availability or are unavailable.
          </div>
        </Card>
      )}
    </div>
  )
}
