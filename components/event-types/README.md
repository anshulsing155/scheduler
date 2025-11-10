# Event Type Management Components

This directory contains all components related to event type management for the Calendly-like scheduling system.

## Components

### Core Components

- **EventTypeList** - Displays event types in grid or list view with actions (edit, duplicate, delete, toggle active)
- **EventTypeForm** - Comprehensive form for creating and editing event types
- **DeleteEventTypeDialog** - Confirmation dialog for deleting event types

### Feature Components

- **DurationSelector** - Select meeting duration with preset options (15, 30, 45, 60, 90, 120 min) or custom duration
- **LocationSettings** - Configure meeting location type (Zoom, Google Meet, Teams, Phone, In-Person, Custom)
- **CustomQuestions** - Build custom booking form questions with various input types
- **BufferTimeSettings** - Set buffer time before/after meetings to prevent back-to-back bookings
- **BookingWindowSettings** - Configure minimum notice and maximum booking window

## Service Layer

The `services/event-type-service.ts` file provides:

### Client-side Service (`eventTypeService`)
- `createEventType()` - Create new event type
- `getEventTypes()` - Get all event types for a user
- `getEventType()` - Get single event type by ID
- `getPublicEventType()` - Get public event type by username/slug
- `updateEventType()` - Update event type
- `deleteEventType()` - Delete event type
- `duplicateEventType()` - Duplicate existing event type
- `toggleActive()` - Toggle event type active status
- `checkSlugAvailability()` - Check if slug is available

### Server-side Service (`serverEventTypeService`)
- Same methods as client service but for server-side use
- Direct Prisma database access
- Used in API routes and server components

### Utilities
- `generateSlug()` - Generate URL-friendly slug from title
- `ensureUniqueSlug()` - Ensure slug is unique for user

## API Routes

- `POST /api/event-types` - Create event type
- `GET /api/event-types?userId={id}` - Get user's event types
- `GET /api/event-types/{id}` - Get single event type
- `PATCH /api/event-types/{id}` - Update event type
- `DELETE /api/event-types/{id}` - Delete event type
- `POST /api/event-types/{id}/duplicate` - Duplicate event type
- `GET /api/event-types/check-slug` - Check slug availability

## Pages

- `/dashboard/event-types` - List all event types
- `/dashboard/event-types/new` - Create new event type
- `/dashboard/event-types/{id}/edit` - Edit existing event type

## Usage Example

```tsx
import { EventTypeList, EventTypeForm } from '@/components/event-types'
import { eventTypeService } from '@/services/event-type-service'

// Display event types
<EventTypeList
  eventTypes={eventTypes}
  onEdit={(eventType) => router.push(`/edit/${eventType.id}`)}
  onDelete={handleDelete}
  onDuplicate={handleDuplicate}
  onToggleActive={handleToggleActive}
/>

// Create/edit event type
<EventTypeForm
  userId={userId}
  eventTypeId={eventTypeId} // Optional, for editing
  initialData={initialData} // Optional, for editing
  onSuccess={() => router.push('/dashboard/event-types')}
/>
```

## Features Implemented

### Task 5.1 - Event Type Data Layer ✓
- Complete CRUD operations for event types
- Validation schemas with Zod
- Slug generation and uniqueness checking
- Client and server-side services

### Task 5.2 - Event Type UI Components ✓
- EventTypeList with grid/list view toggle
- Comprehensive EventTypeForm with all configuration options
- DurationSelector with preset and custom options
- LocationSettings for all meeting types
- CustomQuestions builder with drag-and-drop ordering

### Task 5.3 - Advanced Features ✓
- BufferTimeSettings component
- BookingWindowSettings with minimum notice and max window
- Event type duplication functionality
- Active/inactive toggle with visual feedback
- Delete confirmation dialog with booking count warning

## Data Model

Event types include:
- Basic info (title, slug, description, color)
- Duration and location settings
- Buffer times (before/after)
- Booking window constraints (minimum notice, max advance booking)
- Custom questions for booking forms
- Payment settings (price, currency)
- Team settings (for team events)
- Active/inactive status

## Requirements Covered

- **Requirement 2.1**: Multiple event types with configurable duration
- **Requirement 2.2**: Name, description, duration, location type
- **Requirement 2.3**: Video conferencing integration support
- **Requirement 2.4**: Buffer time settings
- **Requirement 2.5**: Minimum notice and booking window
- **Requirement 2.6**: Custom booking questions
