/**
 * Cache utility with in-memory fallback and optional Redis support
 * Provides a simple caching interface for the application
 */

type CacheEntry<T> = {
  value: T
  expiresAt: number
}

class CacheService {
  private memoryCache: Map<string, CacheEntry<any>> = new Map()
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    // Clean up expired entries every 5 minutes
    if (typeof window === 'undefined') {
      this.cleanupInterval = setInterval(() => {
        this.cleanupExpired()
      }, 5 * 60 * 1000)
    }
  }

  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    const entry = this.memoryCache.get(key)

    if (!entry) {
      return null
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.memoryCache.delete(key)
      return null
    }

    return entry.value as T
  }

  /**
   * Set a value in cache with TTL in seconds
   */
  async set<T>(key: string, value: T, ttlSeconds: number = 300): Promise<void> {
    const expiresAt = Date.now() + ttlSeconds * 1000

    this.memoryCache.set(key, {
      value,
      expiresAt,
    })
  }

  /**
   * Delete a value from cache
   */
  async del(key: string): Promise<void> {
    this.memoryCache.delete(key)
  }

  /**
   * Delete multiple keys matching a pattern
   */
  async delPattern(pattern: string): Promise<void> {
    const regex = new RegExp(pattern.replace('*', '.*'))
    const keysToDelete: string[] = []

    for (const key of this.memoryCache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach((key) => this.memoryCache.delete(key))
  }

  /**
   * Check if a key exists in cache
   */
  async has(key: string): Promise<boolean> {
    const entry = this.memoryCache.get(key)

    if (!entry) {
      return false
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.memoryCache.delete(key)
      return false
    }

    return true
  }

  /**
   * Get or set a value (cache-aside pattern)
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number = 300
  ): Promise<T> {
    const cached = await this.get<T>(key)

    if (cached !== null) {
      return cached
    }

    const value = await fetcher()
    await this.set(key, value, ttlSeconds)

    return value
  }

  /**
   * Clean up expired entries
   */
  private cleanupExpired(): void {
    const now = Date.now()
    const keysToDelete: string[] = []

    for (const [key, entry] of this.memoryCache.entries()) {
      if (now > entry.expiresAt) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach((key) => this.memoryCache.delete(key))
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    this.memoryCache.clear()
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.memoryCache.size,
      keys: Array.from(this.memoryCache.keys()),
    }
  }

  /**
   * Cleanup on shutdown
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.memoryCache.clear()
  }
}

// Singleton instance
const globalForCache = global as unknown as { cache: CacheService }

export const cache = globalForCache.cache || new CacheService()

if (process.env.NODE_ENV !== 'production') {
  globalForCache.cache = cache
}

/**
 * Cache key generators for consistent naming
 */
export const CacheKeys = {
  // User availability
  userAvailability: (userId: string, date: string) => `availability:${userId}:${date}`,
  userWeeklySchedule: (userId: string) => `schedule:${userId}`,
  userDateOverrides: (userId: string, startDate: string, endDate: string) =>
    `overrides:${userId}:${startDate}:${endDate}`,

  // Event types
  eventType: (eventTypeId: string) => `event-type:${eventTypeId}`,
  userEventTypes: (userId: string) => `event-types:user:${userId}`,
  publicEventType: (username: string, slug: string) => `event-type:public:${username}:${slug}`,

  // Bookings
  booking: (bookingId: string) => `booking:${bookingId}`,
  userBookings: (userId: string, filters: string) => `bookings:user:${userId}:${filters}`,

  // Public booking pages
  bookingPage: (username: string, slug: string) => `booking-page:${username}:${slug}`,

  // Teams
  team: (teamId: string) => `team:${teamId}`,
  teamAvailability: (teamId: string, date: string) => `team-availability:${teamId}:${date}`,

  // Analytics
  analytics: (userId: string, metric: string, range: string) => `analytics:${userId}:${metric}:${range}`,
}

/**
 * Cache TTL constants (in seconds)
 */
export const CacheTTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 900, // 15 minutes
  HOUR: 3600, // 1 hour
  DAY: 86400, // 24 hours
}

export default cache
