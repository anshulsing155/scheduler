import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { eventTypeService, generateSlug } from '../event-type-service'
import { LocationType, SchedulingType } from '@prisma/client'

describe('eventTypeService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('CRUD Operations', () => {
    describe('createEventType', () => {
      it('should successfully create an event type', async () => {
        const mockEventType = {
          id: 'event-123',
          userId: 'user-123',
          teamId: null,
          title: '30 Minute Meeting',
          slug: '30-minute-meeting',
          description: 'A quick 30 minute meeting',
          duration: 30,
          isActive: true,
          locationType: LocationType.VIDEO_ZOOM,
          locationDetails: null,
          minimumNotice: 0,
          bufferTimeBefore: 0,
          bufferTimeAfter: 0,
          maxBookingWindow: 60,
          price: null,
          currency: 'USD',
          color: '#4F46E5',
          customQuestions: [],
          schedulingType: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: { bookings: 0 },
        }

        ;(global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ eventType: mockEventType }),
        })

        const result = await eventTypeService.createEventType('user-123', {
          title: '30 Minute Meeting',
          slug: '30-minute-meeting',
          description: 'A quick 30 minute meeting',
          duration: 30,
          locationType: LocationType.VIDEO_ZOOM,
          minimumNotice: 0,
          bufferTimeBefore: 0,
          bufferTimeAfter: 0,
          maxBookingWindow: 60,
          color: '#4F46E5',
          isActive: true,
        })

        expect(result.success).toBe(true)
        expect(result.data).toEqual(mockEventType)
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/event-types',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          })
        )
      })

      it('should validate required fields', async () => {
        const result = await eventTypeService.createEventType('user-123', {
          title: '',
          slug: 'test',
          duration: 30,
        } as any)

        expect(result.success).toBe(false)
        expect(result.error).toContain('Title is required')
      })

      it('should validate duration constraints', async () => {
        const result = await eventTypeService.createEventType('user-123', {
          title: 'Test Meeting',
          slug: 'test-meeting',
          duration: 2, // Too short
        } as any)

        expect(result.success).toBe(false)
        expect(result.error).toContain('Duration must be at least 5 minutes')
      })

      it('should validate slug format', async () => {
        const result = await eventTypeService.createEventType('user-123', {
          title: 'Test Meeting',
          slug: 'Invalid Slug!', // Contains uppercase and special characters
          duration: 30,
        } as any)

        expect(result.success).toBe(false)
        expect(result.error).toContain('Slug can only contain lowercase letters')
      })

      it('should return error when API call fails', async () => {
        ;(global.fetch as any).mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: 'Slug already exists' }),
        })

        const result = await eventTypeService.createEventType('user-123', {
          title: 'Test Meeting',
          slug: 'test-meeting',
          duration: 30,
        } as any)

        expect(result.success).toBe(false)
        expect(result.error).toBe('Slug already exists')
      })
    })

    describe('getEventTypes', () => {
      it('should fetch all event types for a user', async () => {
        const mockEventTypes = [
          {
            id: 'event-1',
            userId: 'user-123',
            title: '15 Minute Meeting',
            slug: '15-minute-meeting',
            duration: 15,
            isActive: true,
          },
          {
            id: 'event-2',
            userId: 'user-123',
            title: '30 Minute Meeting',
            slug: '30-minute-meeting',
            duration: 30,
            isActive: true,
          },
        ]

        ;(global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ eventTypes: mockEventTypes }),
        })

        const result = await eventTypeService.getEventTypes('user-123')

        expect(result.success).toBe(true)
        expect(result.data).toEqual(mockEventTypes)
        expect(result.data).toHaveLength(2)
        expect(global.fetch).toHaveBeenCalledWith('/api/event-types?userId=user-123')
      })

      it('should return error when fetch fails', async () => {
        ;(global.fetch as any).mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: 'Failed to fetch event types' }),
        })

        const result = await eventTypeService.getEventTypes('user-123')

        expect(result.success).toBe(false)
        expect(result.error).toBe('Failed to fetch event types')
      })
    })

    describe('getEventType', () => {
      it('should fetch a single event type by ID', async () => {
        const mockEventType = {
          id: 'event-123',
          userId: 'user-123',
          title: '30 Minute Meeting',
          slug: '30-minute-meeting',
          duration: 30,
          isActive: true,
        }

        ;(global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ eventType: mockEventType }),
        })

        const result = await eventTypeService.getEventType('event-123')

        expect(result.success).toBe(true)
        expect(result.data).toEqual(mockEventType)
        expect(global.fetch).toHaveBeenCalledWith('/api/event-types/event-123')
      })

      it('should return error when event type not found', async () => {
        ;(global.fetch as any).mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: 'Event type not found' }),
        })

        const result = await eventTypeService.getEventType('nonexistent')

        expect(result.success).toBe(false)
        expect(result.error).toBe('Event type not found')
      })
    })

    describe('updateEventType', () => {
      it('should successfully update an event type', async () => {
        const mockUpdatedEventType = {
          id: 'event-123',
          userId: 'user-123',
          title: 'Updated Meeting',
          duration: 45,
          bufferTimeBefore: 10,
          bufferTimeAfter: 5,
        }

        ;(global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ eventType: mockUpdatedEventType }),
        })

        const result = await eventTypeService.updateEventType('event-123', {
          title: 'Updated Meeting',
          duration: 45,
          bufferTimeBefore: 10,
          bufferTimeAfter: 5,
        })

        expect(result.success).toBe(true)
        expect(result.data?.title).toBe('Updated Meeting')
        expect(result.data?.duration).toBe(45)
        expect(result.data?.bufferTimeBefore).toBe(10)
        expect(result.data?.bufferTimeAfter).toBe(5)
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/event-types/event-123',
          expect.objectContaining({
            method: 'PATCH',
          })
        )
      })

      it('should validate update data', async () => {
        const result = await eventTypeService.updateEventType('event-123', {
          duration: 1000, // Exceeds maximum
        })

        expect(result.success).toBe(false)
        expect(result.error).toContain('Duration cannot exceed 8 hours')
      })

      it('should return error when update fails', async () => {
        ;(global.fetch as any).mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: 'Update failed' }),
        })

        const result = await eventTypeService.updateEventType('event-123', {
          title: 'Updated Title',
        })

        expect(result.success).toBe(false)
        expect(result.error).toBe('Update failed')
      })
    })

    describe('deleteEventType', () => {
      it('should successfully delete an event type', async () => {
        ;(global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        })

        const result = await eventTypeService.deleteEventType('event-123')

        expect(result.success).toBe(true)
        expect(global.fetch).toHaveBeenCalledWith('/api/event-types/event-123', {
          method: 'DELETE',
        })
      })

      it('should return error when deletion fails', async () => {
        ;(global.fetch as any).mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: 'Cannot delete event type with bookings' }),
        })

        const result = await eventTypeService.deleteEventType('event-123')

        expect(result.success).toBe(false)
        expect(result.error).toBe('Cannot delete event type with bookings')
      })
    })
  })

  describe('Slug Uniqueness Validation', () => {
    describe('checkSlugAvailability', () => {
      it('should return true for available slug', async () => {
        ;(global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ available: true }),
        })

        const result = await eventTypeService.checkSlugAvailability('user-123', 'new-meeting')

        expect(result.success).toBe(true)
        expect(result.data?.available).toBe(true)
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/event-types/check-slug')
        )
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('userId=user-123')
        )
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('slug=new-meeting')
        )
      })

      it('should return false for taken slug', async () => {
        ;(global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ available: false }),
        })

        const result = await eventTypeService.checkSlugAvailability('user-123', 'existing-meeting')

        expect(result.success).toBe(true)
        expect(result.data?.available).toBe(false)
      })

      it('should exclude specific event type when checking', async () => {
        ;(global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ available: true }),
        })

        const result = await eventTypeService.checkSlugAvailability(
          'user-123',
          'meeting',
          'event-123'
        )

        expect(result.success).toBe(true)
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('excludeEventTypeId=event-123')
        )
      })

      it('should handle API errors', async () => {
        ;(global.fetch as any).mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: 'Failed to check slug' }),
        })

        const result = await eventTypeService.checkSlugAvailability('user-123', 'test')

        expect(result.success).toBe(false)
        expect(result.error).toBe('Failed to check slug')
      })
    })

    describe('generateSlug', () => {
      it('should generate slug from title', () => {
        expect(generateSlug('30 Minute Meeting')).toBe('30-minute-meeting')
      })

      it('should handle special characters', () => {
        expect(generateSlug('Meeting @ Office!')).toBe('meeting-office')
      })

      it('should handle multiple spaces', () => {
        expect(generateSlug('Quick   Call   Session')).toBe('quick-call-session')
      })

      it('should convert to lowercase', () => {
        expect(generateSlug('IMPORTANT MEETING')).toBe('important-meeting')
      })

      it('should handle leading and trailing spaces', () => {
        expect(generateSlug('  Meeting Title  ')).toBe('meeting-title')
      })

      it('should limit length to 50 characters', () => {
        const longTitle = 'This is a very long meeting title that exceeds fifty characters'
        const slug = generateSlug(longTitle)
        expect(slug.length).toBeLessThanOrEqual(50)
      })

      it('should replace multiple hyphens with single hyphen', () => {
        expect(generateSlug('Meeting---Title')).toBe('meeting-title')
      })
    })
  })

  describe('Buffer Time Calculations', () => {
    it('should create event type with buffer times', async () => {
      const mockEventType = {
        id: 'event-123',
        userId: 'user-123',
        title: 'Meeting with Buffers',
        slug: 'meeting-with-buffers',
        duration: 30,
        bufferTimeBefore: 15,
        bufferTimeAfter: 10,
        minimumNotice: 60,
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ eventType: mockEventType }),
      })

      const result = await eventTypeService.createEventType('user-123', {
        title: 'Meeting with Buffers',
        slug: 'meeting-with-buffers',
        duration: 30,
        bufferTimeBefore: 15,
        bufferTimeAfter: 10,
        minimumNotice: 60,
      } as any)

      expect(result.success).toBe(true)
      expect(result.data?.bufferTimeBefore).toBe(15)
      expect(result.data?.bufferTimeAfter).toBe(10)
    })

    it('should validate buffer time is non-negative', async () => {
      const result = await eventTypeService.createEventType('user-123', {
        title: 'Test Meeting',
        slug: 'test-meeting',
        duration: 30,
        bufferTimeBefore: -5, // Invalid
      } as any)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should allow zero buffer times', async () => {
      const mockEventType = {
        id: 'event-123',
        userId: 'user-123',
        title: 'No Buffer Meeting',
        slug: 'no-buffer-meeting',
        duration: 30,
        bufferTimeBefore: 0,
        bufferTimeAfter: 0,
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ eventType: mockEventType }),
      })

      const result = await eventTypeService.createEventType('user-123', {
        title: 'No Buffer Meeting',
        slug: 'no-buffer-meeting',
        duration: 30,
        bufferTimeBefore: 0,
        bufferTimeAfter: 0,
      } as any)

      expect(result.success).toBe(true)
      expect(result.data?.bufferTimeBefore).toBe(0)
      expect(result.data?.bufferTimeAfter).toBe(0)
    })

    it('should update buffer times independently', async () => {
      const mockUpdatedEventType = {
        id: 'event-123',
        bufferTimeBefore: 20,
        bufferTimeAfter: 15,
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ eventType: mockUpdatedEventType }),
      })

      const result = await eventTypeService.updateEventType('event-123', {
        bufferTimeBefore: 20,
        bufferTimeAfter: 15,
      })

      expect(result.success).toBe(true)
      expect(result.data?.bufferTimeBefore).toBe(20)
      expect(result.data?.bufferTimeAfter).toBe(15)
    })

    it('should handle large buffer times', async () => {
      const mockEventType = {
        id: 'event-123',
        userId: 'user-123',
        title: 'Meeting with Large Buffers',
        slug: 'meeting-large-buffers',
        duration: 60,
        bufferTimeBefore: 120, // 2 hours
        bufferTimeAfter: 60, // 1 hour
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ eventType: mockEventType }),
      })

      const result = await eventTypeService.createEventType('user-123', {
        title: 'Meeting with Large Buffers',
        slug: 'meeting-large-buffers',
        duration: 60,
        bufferTimeBefore: 120,
        bufferTimeAfter: 60,
      } as any)

      expect(result.success).toBe(true)
      expect(result.data?.bufferTimeBefore).toBe(120)
      expect(result.data?.bufferTimeAfter).toBe(60)
    })

    it('should calculate total time including buffers', async () => {
      const mockEventType = {
        id: 'event-123',
        duration: 30,
        bufferTimeBefore: 10,
        bufferTimeAfter: 5,
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ eventType: mockEventType }),
      })

      const result = await eventTypeService.createEventType('user-123', {
        title: 'Test Meeting',
        slug: 'test-meeting',
        duration: 30,
        bufferTimeBefore: 10,
        bufferTimeAfter: 5,
      } as any)

      expect(result.success).toBe(true)
      // Total time = 10 (before) + 30 (meeting) + 5 (after) = 45 minutes
      const totalTime =
        result.data!.bufferTimeBefore + result.data!.duration + result.data!.bufferTimeAfter
      expect(totalTime).toBe(45)
    })
  })

  describe('Additional Features', () => {
    describe('duplicateEventType', () => {
      it('should successfully duplicate an event type', async () => {
        const mockDuplicate = {
          id: 'event-456',
          userId: 'user-123',
          title: '30 Minute Meeting (Copy)',
          slug: '30-minute-meeting-copy',
          duration: 30,
          isActive: false,
        }

        ;(global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ eventType: mockDuplicate }),
        })

        const result = await eventTypeService.duplicateEventType('event-123')

        expect(result.success).toBe(true)
        expect(result.data?.title).toContain('(Copy)')
        expect(result.data?.isActive).toBe(false)
        expect(global.fetch).toHaveBeenCalledWith('/api/event-types/event-123/duplicate', {
          method: 'POST',
        })
      })

      it('should return error when duplication fails', async () => {
        ;(global.fetch as any).mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: 'Event type not found' }),
        })

        const result = await eventTypeService.duplicateEventType('nonexistent')

        expect(result.success).toBe(false)
        expect(result.error).toBe('Event type not found')
      })
    })

    describe('toggleActive', () => {
      it('should toggle event type to active', async () => {
        const mockEventType = {
          id: 'event-123',
          isActive: true,
        }

        ;(global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ eventType: mockEventType }),
        })

        const result = await eventTypeService.toggleActive('event-123', true)

        expect(result.success).toBe(true)
        expect(result.data?.isActive).toBe(true)
      })

      it('should toggle event type to inactive', async () => {
        const mockEventType = {
          id: 'event-123',
          isActive: false,
        }

        ;(global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ eventType: mockEventType }),
        })

        const result = await eventTypeService.toggleActive('event-123', false)

        expect(result.success).toBe(true)
        expect(result.data?.isActive).toBe(false)
      })
    })

    describe('getPublicEventType', () => {
      it('should fetch public event type by username and slug', async () => {
        const mockEventType = {
          id: 'event-123',
          userId: 'user-123',
          title: '30 Minute Meeting',
          slug: '30-minute-meeting',
          isActive: true,
        }

        ;(global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ eventType: mockEventType }),
        })

        const result = await eventTypeService.getPublicEventType('testuser', '30-minute-meeting')

        expect(result.success).toBe(true)
        expect(result.data).toEqual(mockEventType)
        expect(global.fetch).toHaveBeenCalledWith('/api/public/testuser/30-minute-meeting')
      })

      it('should return error when public event type not found', async () => {
        ;(global.fetch as any).mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: 'Event type not found' }),
        })

        const result = await eventTypeService.getPublicEventType('testuser', 'nonexistent')

        expect(result.success).toBe(false)
        expect(result.error).toBe('Event type not found')
      })
    })
  })
})
