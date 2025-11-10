/**
 * Prisma query helpers for optimized database queries
 * Provides reusable select/include patterns to avoid over-fetching
 */

/**
 * User select patterns
 */
export const userSelect = {
  minimal: {
    id: true,
    username: true,
    name: true,
    email: true,
  },
  public: {
    id: true,
    username: true,
    name: true,
    avatarUrl: true,
    bio: true,
    timezone: true,
    brandColor: true,
    logoUrl: true,
  },
  profile: {
    id: true,
    username: true,
    name: true,
    email: true,
    avatarUrl: true,
    bio: true,
    timezone: true,
    brandColor: true,
    logoUrl: true,
    customDomain: true,
    weekStart: true,
    timeFormat: true,
    dateFormat: true,
    isPremium: true,
    hidePlatformBranding: true,
  },
}

/**
 * Event type select patterns
 */
export const eventTypeSelect = {
  minimal: {
    id: true,
    title: true,
    slug: true,
    duration: true,
    isActive: true,
  },
  list: {
    id: true,
    title: true,
    slug: true,
    description: true,
    duration: true,
    isActive: true,
    locationType: true,
    color: true,
    price: true,
    currency: true,
    createdAt: true,
    updatedAt: true,
  },
  detail: {
    id: true,
    userId: true,
    teamId: true,
    title: true,
    slug: true,
    description: true,
    duration: true,
    isActive: true,
    locationType: true,
    locationDetails: true,
    minimumNotice: true,
    bufferTimeBefore: true,
    bufferTimeAfter: true,
    maxBookingWindow: true,
    price: true,
    currency: true,
    color: true,
    customQuestions: true,
    schedulingType: true,
    createdAt: true,
    updatedAt: true,
  },
}

/**
 * Booking select patterns
 */
export const bookingSelect = {
  minimal: {
    id: true,
    startTime: true,
    endTime: true,
    status: true,
  },
  list: {
    id: true,
    guestName: true,
    guestEmail: true,
    startTime: true,
    endTime: true,
    status: true,
    meetingLink: true,
    location: true,
    createdAt: true,
  },
  detail: {
    id: true,
    eventTypeId: true,
    userId: true,
    guestName: true,
    guestEmail: true,
    guestPhone: true,
    guestTimezone: true,
    customResponses: true,
    startTime: true,
    endTime: true,
    status: true,
    cancellationReason: true,
    meetingLink: true,
    meetingPassword: true,
    location: true,
    rescheduleToken: true,
    cancelToken: true,
    createdAt: true,
    updatedAt: true,
  },
}

/**
 * Common include patterns
 */
export const bookingInclude = {
  withEventType: {
    eventType: {
      select: eventTypeSelect.minimal,
    },
  },
  withEventTypeAndUser: {
    eventType: {
      select: {
        ...eventTypeSelect.detail,
        user: {
          select: userSelect.public,
        },
      },
    },
  },
  full: {
    eventType: {
      include: {
        user: {
          select: userSelect.public,
        },
      },
    },
    payment: true,
  },
}

export const eventTypeInclude = {
  withUser: {
    user: {
      select: userSelect.public,
    },
  },
  withBookingCount: {
    _count: {
      select: { bookings: true },
    },
  },
  full: {
    user: {
      select: userSelect.public,
    },
    _count: {
      select: { bookings: true },
    },
  },
}

/**
 * Pagination helper
 */
export type PaginationParams = {
  page?: number
  pageSize?: number
}

export function getPaginationParams(params: PaginationParams) {
  const page = Math.max(1, params.page || 1)
  const pageSize = Math.min(100, Math.max(1, params.pageSize || 20))
  const skip = (page - 1) * pageSize

  return {
    skip,
    take: pageSize,
    page,
    pageSize,
  }
}

/**
 * Build pagination metadata
 */
export function buildPaginationMeta(
  total: number,
  page: number,
  pageSize: number
) {
  const totalPages = Math.ceil(total / pageSize)
  const hasNextPage = page < totalPages
  const hasPreviousPage = page > 1

  return {
    total,
    page,
    pageSize,
    totalPages,
    hasNextPage,
    hasPreviousPage,
  }
}

/**
 * Date range filter helper
 */
export function getDateRangeFilter(startDate?: Date, endDate?: Date) {
  if (!startDate && !endDate) {
    return undefined
  }

  const filter: any = {}
  if (startDate) filter.gte = startDate
  if (endDate) filter.lte = endDate

  return filter
}

/**
 * Search filter helper for text fields
 */
export function getSearchFilter(query: string, fields: string[]) {
  if (!query || fields.length === 0) {
    return undefined
  }

  return {
    OR: fields.map((field) => ({
      [field]: {
        contains: query,
        mode: 'insensitive' as const,
      },
    })),
  }
}
