'use client'

import { LocationType } from '@prisma/client'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

interface LocationSettingsProps {
  locationType: LocationType
  locationDetails?: string | null
  onLocationTypeChange: (type: LocationType) => void
  onLocationDetailsChange: (details: string) => void
}

const LOCATION_OPTIONS = [
  { value: LocationType.VIDEO_ZOOM, label: 'Zoom', requiresDetails: false },
  { value: LocationType.VIDEO_GOOGLE_MEET, label: 'Google Meet', requiresDetails: false },
  { value: LocationType.VIDEO_TEAMS, label: 'Microsoft Teams', requiresDetails: false },
  { value: LocationType.PHONE, label: 'Phone Call', requiresDetails: true },
  { value: LocationType.IN_PERSON, label: 'In Person', requiresDetails: true },
  { value: LocationType.CUSTOM, label: 'Custom', requiresDetails: true },
]

export function LocationSettings({
  locationType,
  locationDetails,
  onLocationTypeChange,
  onLocationDetailsChange,
}: LocationSettingsProps) {
  const selectedOption = LOCATION_OPTIONS.find((opt) => opt.value === locationType)
  const requiresDetails = selectedOption?.requiresDetails || false

  const getDetailsPlaceholder = () => {
    switch (locationType) {
      case LocationType.PHONE:
        return 'Enter phone number or instructions'
      case LocationType.IN_PERSON:
        return 'Enter meeting address'
      case LocationType.CUSTOM:
        return 'Enter meeting location details'
      default:
        return 'Enter location details'
    }
  }

  const getDetailsLabel = () => {
    switch (locationType) {
      case LocationType.PHONE:
        return 'Phone Details'
      case LocationType.IN_PERSON:
        return 'Meeting Address'
      case LocationType.CUSTOM:
        return 'Location Details'
      default:
        return 'Details'
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Location Type</Label>
        <Select value={locationType} onValueChange={(value) => onLocationTypeChange(value as LocationType)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LOCATION_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {locationType.startsWith('VIDEO_') && (
          <p className="text-xs text-muted-foreground">
            Meeting link will be generated automatically when booking is confirmed
          </p>
        )}
      </div>

      {requiresDetails && (
        <div className="space-y-2">
          <Label>{getDetailsLabel()}</Label>
          <Textarea
            value={locationDetails || ''}
            onChange={(e) => onLocationDetailsChange(e.target.value)}
            placeholder={getDetailsPlaceholder()}
            rows={3}
          />
        </div>
      )}
    </div>
  )
}
