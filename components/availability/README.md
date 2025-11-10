# Availability Components

This directory contains components for managing user availability schedules.

## Components

### AvailabilitySchedule

A weekly schedule editor that allows users to set their available hours for each day of the week.

**Features:**
- Toggle availability for each day
- Add multiple time slots per day
- Copy schedule to all days
- Support for custom week start day

**Usage:**
```tsx
import { AvailabilitySchedule } from '@/components/availability'

<AvailabilitySchedule
  schedule={schedule}
  onChange={setSchedule}
  weekStart={0} // 0 = Sunday, 1 = Monday
/>
```

### DateOverrides

A calendar interface for setting date-specific availability overrides.

**Features:**
- Add unavailable dates (vacations, holidays)
- Add custom availability for specific dates
- View and manage all overrides
- Sorted chronologically

**Usage:**
```tsx
import { DateOverrides } from '@/components/availability'

<DateOverrides
  overrides={overrides}
  onAdd={handleAddOverride}
  onRemove={handleRemoveOverride}
/>
```

### AvailabilityPreview

A visual preview of the user's availability for the current week.

**Features:**
- Calendar view of the current week
- Shows available time slots
- Summary statistics (available days, total hours)

**Usage:**
```tsx
import { AvailabilityPreview } from '@/components/availability'

<AvailabilityPreview
  schedule={schedule}
  weekStart={0}
/>
```

### BulkAvailabilityActions

Quick actions for applying preset schedules or clearing all availability.

**Features:**
- Preset templates (Business Hours, Flexible Hours, Weekend Hours)
- Clear all availability
- Quick setup for common schedules

**Usage:**
```tsx
import { BulkAvailabilityActions } from '@/components/availability'

<BulkAvailabilityActions
  onApplyTemplate={(template) => {
    // Apply template schedule
  }}
  onClearAll={() => {
    // Clear all availability
  }}
/>
```

## Integration

These components work with the `availability-service` to manage user availability:

```tsx
import { availabilityService } from '@/services/availability-service'
import { AvailabilitySchedule, DateOverrides } from '@/components/availability'

// Fetch schedule
const { data: schedule } = await availabilityService.getWeeklySchedule(userId)

// Update schedule
await availabilityService.setWeeklySchedule(userId, newSchedule)

// Add date override
await availabilityService.setDateOverride(userId, override)
```
