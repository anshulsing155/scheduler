'use client'

import { useState, useMemo } from 'react'
import { Globe } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

interface TimezoneSelectorProps {
  value: string
  onChange: (timezone: string) => void
}

// Common timezones grouped by region
const TIMEZONES = [
  // North America
  { value: 'America/New_York', label: 'Eastern Time (ET)', region: 'North America' },
  { value: 'America/Chicago', label: 'Central Time (CT)', region: 'North America' },
  { value: 'America/Denver', label: 'Mountain Time (MT)', region: 'North America' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)', region: 'North America' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)', region: 'North America' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)', region: 'North America' },
  { value: 'America/Toronto', label: 'Toronto', region: 'North America' },
  { value: 'America/Vancouver', label: 'Vancouver', region: 'North America' },
  { value: 'America/Mexico_City', label: 'Mexico City', region: 'North America' },

  // Europe
  { value: 'Europe/London', label: 'London (GMT/BST)', region: 'Europe' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)', region: 'Europe' },
  { value: 'Europe/Berlin', label: 'Berlin (CET/CEST)', region: 'Europe' },
  { value: 'Europe/Rome', label: 'Rome (CET/CEST)', region: 'Europe' },
  { value: 'Europe/Madrid', label: 'Madrid (CET/CEST)', region: 'Europe' },
  { value: 'Europe/Amsterdam', label: 'Amsterdam (CET/CEST)', region: 'Europe' },
  { value: 'Europe/Brussels', label: 'Brussels (CET/CEST)', region: 'Europe' },
  { value: 'Europe/Vienna', label: 'Vienna (CET/CEST)', region: 'Europe' },
  { value: 'Europe/Zurich', label: 'Zurich (CET/CEST)', region: 'Europe' },
  { value: 'Europe/Stockholm', label: 'Stockholm (CET/CEST)', region: 'Europe' },
  { value: 'Europe/Athens', label: 'Athens (EET/EEST)', region: 'Europe' },
  { value: 'Europe/Istanbul', label: 'Istanbul (TRT)', region: 'Europe' },
  { value: 'Europe/Moscow', label: 'Moscow (MSK)', region: 'Europe' },

  // Asia
  { value: 'Asia/Dubai', label: 'Dubai (GST)', region: 'Asia' },
  { value: 'Asia/Kolkata', label: 'India (IST)', region: 'Asia' },
  { value: 'Asia/Bangkok', label: 'Bangkok (ICT)', region: 'Asia' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)', region: 'Asia' },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong (HKT)', region: 'Asia' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)', region: 'Asia' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)', region: 'Asia' },
  { value: 'Asia/Seoul', label: 'Seoul (KST)', region: 'Asia' },

  // Australia & Pacific
  { value: 'Australia/Sydney', label: 'Sydney (AEDT/AEST)', region: 'Australia & Pacific' },
  { value: 'Australia/Melbourne', label: 'Melbourne (AEDT/AEST)', region: 'Australia & Pacific' },
  { value: 'Australia/Brisbane', label: 'Brisbane (AEST)', region: 'Australia & Pacific' },
  { value: 'Australia/Perth', label: 'Perth (AWST)', region: 'Australia & Pacific' },
  { value: 'Pacific/Auckland', label: 'Auckland (NZDT/NZST)', region: 'Australia & Pacific' },

  // South America
  { value: 'America/Sao_Paulo', label: 'São Paulo (BRT)', region: 'South America' },
  { value: 'America/Buenos_Aires', label: 'Buenos Aires (ART)', region: 'South America' },
  { value: 'America/Santiago', label: 'Santiago (CLT)', region: 'South America' },
  { value: 'America/Bogota', label: 'Bogotá (COT)', region: 'South America' },

  // Africa
  { value: 'Africa/Cairo', label: 'Cairo (EET)', region: 'Africa' },
  { value: 'Africa/Johannesburg', label: 'Johannesburg (SAST)', region: 'Africa' },
  { value: 'Africa/Lagos', label: 'Lagos (WAT)', region: 'Africa' },
  { value: 'Africa/Nairobi', label: 'Nairobi (EAT)', region: 'Africa' },
]

export default function TimezoneSelector({ value, onChange }: TimezoneSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredTimezones = useMemo(() => {
    if (!searchTerm) return TIMEZONES

    const term = searchTerm.toLowerCase()
    return TIMEZONES.filter(
      (tz) => tz.label.toLowerCase().includes(term) || tz.value.toLowerCase().includes(term)
    )
  }, [searchTerm])

  const groupedTimezones = useMemo(() => {
    const groups: Record<string, typeof TIMEZONES> = {}

    filteredTimezones.forEach((tz) => {
      if (!groups[tz.region]) {
        groups[tz.region] = []
      }
      groups[tz.region].push(tz)
    })

    return groups
  }, [filteredTimezones])

  const getCurrentTimezoneLabel = () => {
    const tz = TIMEZONES.find((t) => t.value === value)
    return tz ? tz.label : value
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="timezone" className="flex items-center gap-2 text-sm font-medium">
        <Globe className="h-4 w-4" />
        Timezone
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="timezone" className="w-full">
          <SelectValue>{getCurrentTimezoneLabel()}</SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-80">
          {Object.entries(groupedTimezones).map(([region, timezones]) => (
            <div key={region}>
              <div className="px-2 py-1.5 text-xs font-semibold text-gray-500">{region}</div>
              {timezones.map((tz) => (
                <SelectItem key={tz.value} value={tz.value}>
                  {tz.label}
                </SelectItem>
              ))}
            </div>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
