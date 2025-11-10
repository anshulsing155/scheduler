/**
 * Optimized data fetching hook with caching and deduplication
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface FetchOptions {
  revalidateOnFocus?: boolean
  revalidateOnReconnect?: boolean
  dedupingInterval?: number
  cacheTime?: number
}

interface FetchState<T> {
  data: T | null
  error: Error | null
  isLoading: boolean
  isValidating: boolean
}

// Simple in-memory cache
const cache = new Map<string, { data: any; timestamp: number }>()
const pendingRequests = new Map<string, Promise<any>>()

export function useOptimizedFetch<T>(
  key: string | null,
  fetcher: () => Promise<T>,
  options: FetchOptions = {}
) {
  const {
    revalidateOnFocus = true,
    revalidateOnReconnect = true,
    dedupingInterval = 2000,
    cacheTime = 300000, // 5 minutes
  } = options

  const [state, setState] = useState<FetchState<T>>({
    data: null,
    error: null,
    isLoading: true,
    isValidating: false,
  })

  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  const fetchData = useCallback(
    async (isRevalidating = false) => {
      if (!key) return

      // Check cache first
      const cached = cache.get(key)
      if (cached && Date.now() - cached.timestamp < cacheTime) {
        setState({
          data: cached.data,
          error: null,
          isLoading: false,
          isValidating: isRevalidating,
        })

        if (!isRevalidating) return
      }

      // Check for pending request (deduplication)
      const pending = pendingRequests.get(key)
      if (pending && Date.now() - cached?.timestamp! < dedupingInterval) {
        try {
          const data = await pending
          setState({
            data,
            error: null,
            isLoading: false,
            isValidating: false,
          })
          return
        } catch (error) {
          // Continue to make a new request
        }
      }

      setState((prev) => ({
        ...prev,
        isLoading: !isRevalidating,
        isValidating: isRevalidating,
      }))

      try {
        const promise = fetcherRef.current()
        pendingRequests.set(key, promise)

        const data = await promise

        // Update cache
        cache.set(key, { data, timestamp: Date.now() })

        setState({
          data,
          error: null,
          isLoading: false,
          isValidating: false,
        })
      } catch (error) {
        setState({
          data: null,
          error: error as Error,
          isLoading: false,
          isValidating: false,
        })
      } finally {
        pendingRequests.delete(key)
      }
    },
    [key, cacheTime, dedupingInterval]
  )

  const mutate = useCallback(
    async (data?: T | Promise<T> | ((current: T | null) => T)) => {
      if (!key) return

      // Optimistic update
      if (data !== undefined) {
        if (typeof data === 'function') {
          setState((prev) => ({
            ...prev,
            data: (data as (current: T | null) => T)(prev.data),
          }))
        } else if (data instanceof Promise) {
          const resolvedData = await data
          setState((prev) => ({
            ...prev,
            data: resolvedData,
          }))
          cache.set(key, { data: resolvedData, timestamp: Date.now() })
        } else {
          setState((prev) => ({
            ...prev,
            data,
          }))
          cache.set(key, { data, timestamp: Date.now() })
        }
      }

      // Revalidate
      await fetchData(true)
    },
    [key, fetchData]
  )

  // Initial fetch
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Revalidate on focus
  useEffect(() => {
    if (!revalidateOnFocus) return

    const handleFocus = () => {
      fetchData(true)
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [fetchData, revalidateOnFocus])

  // Revalidate on reconnect
  useEffect(() => {
    if (!revalidateOnReconnect) return

    const handleOnline = () => {
      fetchData(true)
    }

    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [fetchData, revalidateOnReconnect])

  return {
    ...state,
    mutate,
    revalidate: () => fetchData(true),
  }
}

/**
 * Clear cache for a specific key or all keys
 */
export function clearCache(key?: string) {
  if (key) {
    cache.delete(key)
  } else {
    cache.clear()
  }
}

/**
 * Preload data into cache
 */
export async function preload<T>(key: string, fetcher: () => Promise<T>) {
  try {
    const data = await fetcher()
    cache.set(key, { data, timestamp: Date.now() })
  } catch (error) {
    console.error('Preload failed:', error)
  }
}
