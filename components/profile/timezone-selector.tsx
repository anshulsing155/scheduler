'use client'

import { useState, useMemo } from 'react'

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
  { value: 'Europe/London', label: 'London (GMT)', region: 'Europe' },
  { value: 'Europe/Paris', label: 'Paris (CET)', region: 'Europe' },
  { value: 'Europe/Berlin', label: 'Berlin (CET)', region: 'Europe' },
  { value: 'Europe/Rome', label: 'Rome (CET)', region: 'Europe' },
  { value: 'Europe/Madrid', label: 'Madrid (CET)', region: 'Europe' },
  { value: 'Europe/Amsterdam', label: 'Amsterdam (CET)', region: 'Europe' },
  { value: 'Europe/Brussels', label: 'Brussels (CET)', region: 'Europe' },
  { value: 'Europe/Vienna', label: 'Vienna (CET)', region: 'Europe' },
  { value: 'Europe/Stockholm', label: 'Stockholm (CET)', region: 'Europe' },
  { value: 'Europe/Athens', label: 'Athens (EET)', region: 'Europe' },
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
  { value: 'Asia/Jakarta', label: 'Jakarta (WIB)', region: 'Asia' },
  { value: 'Asia/Manila', label: 'Manila (PHT)', region: 'Asia' },
  
  // Australia & Pacific
  { value: 'Australia/Sydney', label: 'Sydney (AEDT)', region: 'Australia & Pacific' },
  { value: 'Australia/Melbourne', label: 'Melbourne (AEDT)', region: 'Australia & Pacific' },
  { value: 'Australia/Brisbane', label: 'Brisbane (AEST)', region: 'Australia & Pacific' },
  { value: 'Australia/Perth', label: 'Perth (AWST)', region: 'Australia & Pacific' },
  { value: 'Pacific/Auckland', label: 'Auckland (NZDT)', region: 'Australia & Pacific' },
  
  // South America
  { value: 'America/Sao_Paulo', label: 'São Paulo (BRT)', region: 'South America' },
  { value: 'America/Buenos_Aires', label: 'Buenos Aires (ART)', region: 'South America' },
  { value: 'America/Santiago', label: 'Santiago (CLT)', region: 'South America' },
  { value: 'America/Lima', label: 'Lima (PET)', region: 'South America' },
  { value: 'America/Bogota', label: 'Bogotá (COT)', region: 'South America' },
  
  // Africa
  { value: 'Africa/Cairo', label: 'Cairo (EET)', region: 'Africa' },
  { value: 'Africa/Johannesburg', label: 'Johannesburg (SAST)', region: 'Africa' },
  { value: 'Africa/Lagos', label: 'Lagos (WAT)', region: 'Africa' },
  { value: 'Africa/Nairobi', label: 'Nairobi (EAT)', region: 'Africa' },
  
  // UTC
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)', region: 'UTC' },
]

export function TimezoneSelector({ value, onChange }: TimezoneSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredTimezones = useMemo(() => {
    if (!searchQuery) return TIMEZONES

    const query = searchQuery.toLowerCase()
    return TIMEZONES.filter(
      (tz) =>
        tz.label.toLowerCase().includes(query) ||
        tz.value.toLowerCase().includes(query) ||
        tz.region.toLowerCase().includes(query)
    )
  }, [searchQuery])

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

  return (
    <div className="mt-1">
      <input
        type="text"
        placeholder="Search timezones..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
      />
      
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        size={8}
      >
        {Object.entries(groupedTimezones).map(([region, timezones]) => (
          <optgroup key={region} label={region}>
            {timezones.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      
      <p className="text-sm text-gray-500 mt-2">
        Current selection: {TIMEZONES.find((tz) => tz.value === value)?.label || value}
      </p>
    </div>
  )
}
