import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { LocationType, SchedulingType } from '@prisma/client'

/**
 * Validation Schemas
 */

export const customQuestionSchema = z.object({
  id: z.string(),
  question: z.string().min(1, 'Question is required'),
  type: z.enum(['text', 'textarea', 'select', 'radio', 'checkbox']),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(),
})

export const createEventTypeSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title is too long'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(50, 'Slug is too long')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  description: z.string().max(500, 'Description is too long').optional(),
  duration: z.number().min(5, 'Duration must be at least 5 minutes').max(480, 'Duration cannot exceed 8 hours'),
  locationType: z.nativeEnum(LocationType).default(LocationType.VIDEO_ZOOM),
  locationDetails: z.string().optional(),
  minimumNotice: z.number().min(0).default(0),
  bufferTimeBefore: z.number().min(0).default(0),
  bufferTimeAfter: z.number().min(0).default(0),
  maxBookingWindow: z.number().min(1).max(365).default(60),
  price: z.number().min(0).optional(),
  currency: z.string().length(3).default('USD').optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional(),
  customQuestions: z.array(customQuestionSchema).optional(),
  isActive: z.boolean().default(true),
  teamId: z.string().optional(),
  schedulingType: z.nativeEnum(SchedulingType).optional(),
})

export const updateEventTypeSchema = createEventTypeSchema.partial().omit({ slug: true })

export type CreateEventTypeData = z.infer<typeof createEventTypeSchema>
export type UpdateEventTypeData = z.infer<typeof updateEventTypeSchema>
export type CustomQuestion = z.infer<typeof customQuestionSchema>

export type EventTypeWithRelations = {
  id: string
  userId: string
  teamId: string | null
  title: string
  slug: string
  description: string | null
  duration: number
  isActive: boolean
  locationType: LocationType
  locationDetails: string | null
  minimumNotice: number
  bufferTimeBefore: number
  bufferTimeAfter: number
  maxBookingWindow: number
  price: any
  currency: string | null
  color: string | null
  customQuestions: any
  schedulingType: SchedulingType | null
  createdAt: Date
  updatedAt: Date
  _count?: {
    bookings: number
  }
}

export type ServiceResult<T = any> = {
  success: boolean
  data?: T
  error?: string
}

/**
 * Generate a unique slug from title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .substring(0, 50) // Limit length
}

/**
 * Ensure slug is unique for the user
 */
async function ensureUniqueSlug(userId: string, baseSlug: string, excludeEventTypeId?: string): Promise<string> {
  let slug = baseSlug
  let counter = 1

  while (true) {
    const existing = await prisma.eventType.findFirst({
      where: {
        userId,
        slug,
        ...(excludeEventTypeId && { id: { not: excludeEventTypeId } }),
      },
    })

    if (!existing) {
      return slug
    }

    slug = `${baseSlug}-${counter}`
    counter++
  }
}

/**
 * Client-side event type service
 */
export const eventTypeService = {
  /**
   * Create a new event type
   */
  async createEventType(userId: string, data: CreateEventTypeData): Promise<ServiceResult<EventTypeWithRelations>> {
    try {
      // Validate data
      const validatedData = createEventTypeSchema.parse(data)

      const response = await fetch('/api/event-types', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...validatedData, userId }),
      })

      if (!response.ok) {
        const error = await response.json()
        return {
          success: false,
          error: error.error || 'Failed to create event type',
        }
      }

      const result = await response.json()

      return {
        success: true,
        data: result.eventType,
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: error.issues[0].message,
        }
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      }
    }
  },

  /**
   * Get all event types for a user
   */
  async getEventTypes(userId: string): Promise<ServiceResult<EventTypeWithRelations[]>> {
    try {
      const response = await fetch(`/api/event-types?userId=${userId}`)

      if (!response.ok) {
        const error = await response.json()
        return {
          success: false,
          error: error.error || 'Failed to fetch event types',
        }
      }

      const result = await response.json()

      return {
        success: true,
        data: result.eventTypes,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      }
    }
  },

  /**
   * Get a single event type by ID
   */
  async getEventType(eventTypeId: string): Promise<ServiceResult<EventTypeWithRelations>> {
    try {
      const response = await fetch(`/api/event-types/${eventTypeId}`)

      if (!response.ok) {
        const error = await response.json()
        return {
          success: false,
          error: error.error || 'Failed to fetch event type',
        }
      }

      const result = await response.json()

      return {
        success: true,
        data: result.eventType,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      }
    }
  },

  /**
   * Get public event type by username and slug
   */
  async getPublicEventType(username: string, slug: string): Promise<ServiceResult<EventTypeWithRelations>> {
    try {
      const response = await fetch(`/api/public/${username}/${slug}`)

      if (!response.ok) {
        const error = await response.json()
        return {
          success: false,
          error: error.error || 'Failed to fetch event type',
        }
      }

      const result = await response.json()

      return {
        success: true,
        data: result.eventType,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      }
    }
  },

  /**
   * Update an event type
   */
  async updateEventType(
    eventTypeId: string,
    data: UpdateEventTypeData
  ): Promise<ServiceResult<EventTypeWithRelations>> {
    try {
      // Validate data
      const validatedData = updateEventTypeSchema.parse(data)

      const response = await fetch(`/api/event-types/${eventTypeId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validatedData),
      })

      if (!response.ok) {
        const error = await response.json()
        return {
          success: false,
          error: error.error || 'Failed to update event type',
        }
      }

      const result = await response.json()

      return {
        success: true,
        data: result.eventType,
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: error.issues[0].message,
        }
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      }
    }
  },

  /**
   * Delete an event type
   */
  async deleteEventType(eventTypeId: string): Promise<ServiceResult<void>> {
    try {
      const response = await fetch(`/api/event-types/${eventTypeId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        return {
          success: false,
          error: error.error || 'Failed to delete event type',
        }
      }

      return {
        success: true,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      }
    }
  },

  /**
   * Duplicate an event type
   */
  async duplicateEventType(eventTypeId: string): Promise<ServiceResult<EventTypeWithRelations>> {
    try {
      const response = await fetch(`/api/event-types/${eventTypeId}/duplicate`, {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json()
        return {
          success: false,
          error: error.error || 'Failed to duplicate event type',
        }
      }

      const result = await response.json()

      return {
        success: true,
        data: result.eventType,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      }
    }
  },

  /**
   * Toggle event type active status
   */
  async toggleActive(eventTypeId: string, isActive: boolean): Promise<ServiceResult<EventTypeWithRelations>> {
    return this.updateEventType(eventTypeId, { isActive })
  },

  /**
   * Check if slug is available for user
   */
  async checkSlugAvailability(
    userId: string,
    slug: string,
    excludeEventTypeId?: string
  ): Promise<ServiceResult<{ available: boolean }>> {
    try {
      const params = new URLSearchParams({
        userId,
        slug,
        ...(excludeEventTypeId && { excludeEventTypeId }),
      })

      const response = await fetch(`/api/event-types/check-slug?${params}`)

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Failed to check slug availability',
        }
      }

      return {
        success: true,
        data: { available: data.available },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      }
    }
  },
}

/**
 * Server-side event type service
 */
export const serverEventTypeService = {
  /**
   * Create a new event type
   */
  async createEventType(userId: string, data: CreateEventTypeData): Promise<EventTypeWithRelations | null> {
    try {
      // Validate data
      const validatedData = createEventTypeSchema.parse(data)

      // Ensure slug is unique
      const uniqueSlug = await ensureUniqueSlug(userId, validatedData.slug)

      const eventType = await prisma.eventType.create({
        data: {
          ...validatedData,
          slug: uniqueSlug,
          userId,
          customQuestions: validatedData.customQuestions || [],
        },
        include: {
          _count: {
            select: { bookings: true },
          },
        },
      })

      return eventType
    } catch (error) {
      console.error('Error creating event type:', error)
      return null
    }
  },

  /**
   * Get all event types for a user
   */
  async getEventTypes(userId: string, includeInactive = false): Promise<EventTypeWithRelations[]> {
    try {
      const eventTypes = await prisma.eventType.findMany({
        where: {
          userId,
          ...(includeInactive ? {} : { isActive: true }),
        },
        include: {
          _count: {
            select: { bookings: true },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      return eventTypes
    } catch (error) {
      console.error('Error fetching event types:', error)
      return []
    }
  },

  /**
   * Get a single event type by ID
   */
  async getEventType(eventTypeId: string): Promise<EventTypeWithRelations | null> {
    try {
      const eventType = await prisma.eventType.findUnique({
        where: { id: eventTypeId },
        include: {
          _count: {
            select: { bookings: true },
          },
        },
      })

      return eventType
    } catch (error) {
      console.error('Error fetching event type:', error)
      return null
    }
  },

  /**
   * Get public event type by username and slug
   */
  async getPublicEventType(username: string, slug: string): Promise<EventTypeWithRelations | null> {
    try {
      const eventType = await prisma.eventType.findFirst({
        where: {
          slug,
          isActive: true,
          user: {
            username,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              avatarUrl: true,
              timezone: true,
              brandColor: true,
              logoUrl: true,
            },
          },
          _count: {
            select: { bookings: true },
          },
        },
      })

      return eventType
    } catch (error) {
      console.error('Error fetching public event type:', error)
      return null
    }
  },

  /**
   * Update an event type
   */
  async updateEventType(eventTypeId: string, data: UpdateEventTypeData): Promise<EventTypeWithRelations | null> {
    try {
      // Validate data
      const validatedData = updateEventTypeSchema.parse(data)

      const eventType = await prisma.eventType.update({
        where: { id: eventTypeId },
        data: validatedData,
        include: {
          _count: {
            select: { bookings: true },
          },
        },
      })

      return eventType
    } catch (error) {
      console.error('Error updating event type:', error)
      return null
    }
  },

  /**
   * Delete an event type
   */
  async deleteEventType(eventTypeId: string): Promise<boolean> {
    try {
      await prisma.eventType.delete({
        where: { id: eventTypeId },
      })

      return true
    } catch (error) {
      console.error('Error deleting event type:', error)
      return false
    }
  },

  /**
   * Duplicate an event type
   */
  async duplicateEventType(eventTypeId: string): Promise<EventTypeWithRelations | null> {
    try {
      const original = await prisma.eventType.findUnique({
        where: { id: eventTypeId },
      })

      if (!original) {
        return null
      }

      // Generate unique slug for the duplicate
      const baseSlug = `${original.slug}-copy`
      const uniqueSlug = await ensureUniqueSlug(original.userId, baseSlug)

      const duplicate = await prisma.eventType.create({
        data: {
          userId: original.userId,
          teamId: original.teamId,
          title: `${original.title} (Copy)`,
          slug: uniqueSlug,
          description: original.description,
          duration: original.duration,
          isActive: false, // Start as inactive
          locationType: original.locationType,
          locationDetails: original.locationDetails,
          minimumNotice: original.minimumNotice,
          bufferTimeBefore: original.bufferTimeBefore,
          bufferTimeAfter: original.bufferTimeAfter,
          maxBookingWindow: original.maxBookingWindow,
          price: original.price,
          currency: original.currency,
          color: original.color,
          customQuestions: original.customQuestions,
          schedulingType: original.schedulingType,
        },
        include: {
          _count: {
            select: { bookings: true },
          },
        },
      })

      return duplicate
    } catch (error) {
      console.error('Error duplicating event type:', error)
      return null
    }
  },

  /**
   * Check if slug is available for user
   */
  async isSlugAvailable(userId: string, slug: string, excludeEventTypeId?: string): Promise<boolean> {
    try {
      const eventType = await prisma.eventType.findFirst({
        where: {
          userId,
          slug,
          ...(excludeEventTypeId && { id: { not: excludeEventTypeId } }),
        },
      })

      return !eventType
    } catch (error) {
      console.error('Error checking slug availability:', error)
      return false
    }
  },

  /**
   * Get event types by team ID
   */
  async getTeamEventTypes(teamId: string): Promise<EventTypeWithRelations[]> {
    try {
      const eventTypes = await prisma.eventType.findMany({
        where: {
          teamId,
          isActive: true,
        },
        include: {
          _count: {
            select: { bookings: true },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      return eventTypes
    } catch (error) {
      console.error('Error fetching team event types:', error)
      return []
    }
  },
}
