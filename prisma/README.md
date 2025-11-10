# Prisma Database Schema

## Overview

This directory contains the Prisma schema and migrations for the Calendly-like scheduling application.

## Files

- **schema.prisma** - Complete database schema with all models, enums, and relationships
- **migrations/** - Database migration history (created after running `prisma migrate dev`)

## Models

### Core Models
1. **User** - User accounts with authentication and profile data
2. **EventType** - Meeting templates with customizable settings
3. **Booking** - Scheduled appointments between users and guests
4. **Availability** - Weekly recurring availability schedules
5. **DateOverride** - Date-specific availability exceptions

### Integration Models
6. **ConnectedCalendar** - External calendar connections (Google, Outlook)
7. **Team** - Team management for group scheduling
8. **TeamMember** - Team membership with roles
9. **Payment** - Stripe payment records
10. **NotificationSetting** - User notification preferences
11. **Reminder** - Scheduled email/SMS reminders

## Setup Instructions

### Prerequisites
- Node.js 18+ installed
- Supabase account and project created
- Database credentials in `.env` file

### Initial Setup

1. **Install dependencies** (already done):
   ```bash
   npm install prisma @prisma/client
   ```

2. **Configure environment variables**:
   ```bash
   # Copy example file
   cp .env.example .env
   
   # Edit .env and add your Supabase credentials
   ```

3. **Generate Prisma Client**:
   ```bash
   npx prisma generate
   ```

4. **Run migrations**:
   ```bash
   npx prisma migrate dev --name init
   ```

5. **Verify setup**:
   ```bash
   npx prisma studio
   ```

## Common Commands

### Development
```bash
# Generate Prisma Client after schema changes
npx prisma generate

# Create and apply a new migration
npx prisma migrate dev --name description_of_changes

# Open Prisma Studio (database GUI)
npx prisma studio

# Validate schema without database
npx prisma validate

# Format schema file
npx prisma format
```

### Production
```bash
# Apply migrations in production
npx prisma migrate deploy

# Generate Prisma Client for production
npx prisma generate
```

## Schema Highlights

### Relationships
- Users can have multiple event types, bookings, and availability schedules
- Event types can belong to individual users or teams
- Bookings link event types with guest information
- Teams have multiple members with different roles
- Payments are linked to bookings

### Enums
- **LocationType**: VIDEO_ZOOM, VIDEO_GOOGLE_MEET, VIDEO_TEAMS, PHONE, IN_PERSON, CUSTOM
- **SchedulingType**: COLLECTIVE, ROUND_ROBIN
- **BookingStatus**: PENDING, CONFIRMED, CANCELLED, COMPLETED, NO_SHOW
- **CalendarProvider**: GOOGLE, OUTLOOK
- **TeamRole**: OWNER, ADMIN, MEMBER
- **PaymentStatus**: PENDING, SUCCEEDED, FAILED, REFUNDED, PARTIALLY_REFUNDED
- **ReminderType**: EMAIL, SMS
- **ReminderStatus**: PENDING, SENT, FAILED

### Indexes
Optimized indexes for:
- User lookups (username, email)
- Event type queries (userId, teamId, slug)
- Booking queries (userId, eventTypeId, startTime, status)
- Team queries (teamId, userId)
- Payment queries (userId, status)
- Reminder scheduling (scheduledFor, status)

## Using Prisma Client

### Import
```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
```

### Example Queries

**Create a user:**
```typescript
const user = await prisma.user.create({
  data: {
    email: 'user@example.com',
    username: 'johndoe',
    name: 'John Doe',
    timezone: 'America/New_York'
  }
})
```

**Create an event type:**
```typescript
const eventType = await prisma.eventType.create({
  data: {
    userId: user.id,
    title: '30 Minute Meeting',
    slug: '30min',
    duration: 30,
    locationType: 'VIDEO_ZOOM'
  }
})
```

**Query bookings with relations:**
```typescript
const bookings = await prisma.booking.findMany({
  where: { userId: user.id },
  include: {
    eventType: true,
    payment: true,
    reminders: true
  },
  orderBy: { startTime: 'asc' }
})
```

## Migrations

### Creating Migrations
When you modify the schema:

1. Update `schema.prisma`
2. Run `npx prisma migrate dev --name description`
3. Prisma will:
   - Generate SQL migration file
   - Apply migration to database
   - Regenerate Prisma Client

### Migration Files
Located in `prisma/migrations/`, each migration includes:
- Timestamp and description
- SQL up migration
- Migration metadata

### Best Practices
- Use descriptive migration names
- Review generated SQL before applying
- Test migrations on development database first
- Never edit migration files manually
- Commit migrations to version control

## Troubleshooting

### "Cannot find module '@prisma/client'"
```bash
npx prisma generate
```

### "Environment variable not found: DATABASE_URL"
- Check `.env` file exists
- Verify `DATABASE_URL` is set
- Restart your development server

### Migration Conflicts
```bash
# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Or resolve conflicts manually
npx prisma migrate resolve
```

### Connection Issues
- Verify Supabase credentials
- Check database is accessible
- Ensure correct connection string format
- Use `DIRECT_URL` for migrations

## Security Notes

- Never commit `.env` file to version control
- Use connection pooling (`DATABASE_URL`) for app queries
- Use direct connection (`DIRECT_URL`) for migrations
- Apply Row Level Security policies in Supabase
- Keep `SUPABASE_SERVICE_ROLE_KEY` secret

## Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Prisma Client API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
