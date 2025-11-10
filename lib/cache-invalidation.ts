/**
 * Cache invalidation utilities
 * Provides functions to invalidate related cache entries when data changes
 */

import { cache, CacheKeys } from './cache'

export const cacheInvalidation = {
  /**
   * Invalidate all cache entries for a user
   */
  async invalidateUser(userId: string): Promise<void> {
    await Promise.all([
      cache.delPattern(`availability:${userId}:*`),
      cache.delPattern(`schedule:${userId}*`),
      cache.delPattern(`overrides:${userId}:*`),
      cache.delPattern(`event-types:user:${userId}*`),
      cache.delPattern(`bookings:user:${userId}:*`),
      cache.delPattern(`analytics:${userId}:*`),
    ])
  },

  /**
   * Invalidate availability cache for a user
   */
  async invalidateAvailability(userId: string): Promise<void> {
    await Promise.all([
      cache.delPattern(`availability:${userId}:*`),
      cache.del(CacheKeys.userWeeklySchedule(userId)),
      cache.delPattern(`overrides:${userId}:*`),
    ])
  },

  /**
   * Invalidate event type cache
   */
  async invalidateEventType(eventTypeId: string, userId: string, username?: string, slug?: string): Promise<void> {
    await Promise.all([
      cache.del(CacheKeys.eventType(eventTypeId)),
      cache.del(CacheKeys.userEventTypes(userId)),
      ...(username && slug ? [cache.del(CacheKeys.publicEventType(username, slug))] : []),
      ...(username && slug ? [cache.del(CacheKeys.bookingPage(username, slug))] : []),
    ])
  },

  /**
   * Invalidate all event types for a user
   */
  async invalidateUserEventTypes(userId: string): Promise<void> {
    await cache.del(CacheKeys.userEventTypes(userId))
  },

  /**
   * Invalidate booking cache
   */
  async invalidateBooking(bookingId: string, userId: string): Promise<void> {
    await Promise.all([
      cache.del(CacheKeys.booking(bookingId)),
      cache.delPattern(`bookings:user:${userId}:*`),
      // Also invalidate availability since bookings affect available slots
      cache.delPattern(`availability:${userId}:*`),
    ])
  },

  /**
   * Invalidate public booking page cache
   */
  async invalidateBookingPage(username: string, slug: string): Promise<void> {
    await Promise.all([
      cache.del(CacheKeys.bookingPage(username, slug)),
      cache.del(CacheKeys.publicEventType(username, slug)),
    ])
  },

  /**
   * Invalidate team cache
   */
  async invalidateTeam(teamId: string): Promise<void> {
    await Promise.all([
      cache.del(CacheKeys.team(teamId)),
      cache.delPattern(`team-availability:${teamId}:*`),
    ])
  },

  /**
   * Invalidate analytics cache for a user
   */
  async invalidateAnalytics(userId: string): Promise<void> {
    await cache.delPattern(`analytics:${userId}:*`)
  },

  /**
   * Invalidate all caches (use sparingly)
   */
  async invalidateAll(): Promise<void> {
    await cache.clear()
  },
}

export default cacheInvalidation
