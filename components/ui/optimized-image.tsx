/**
 * Optimized image component with lazy loading and blur placeholder
 */

'use client'

import Image from 'next/image'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  fill?: boolean
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  fill = false,
  objectFit = 'cover',
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  if (hasError) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-gray-100 text-gray-400',
          className
        )}
        style={fill ? undefined : { width, height }}
      >
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    )
  }

  return (
    <div className={cn('relative overflow-hidden', className)}>
      <Image
        src={src}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        priority={priority}
        className={cn(
          'duration-700 ease-in-out',
          isLoading ? 'scale-110 blur-2xl grayscale' : 'scale-100 blur-0 grayscale-0',
          fill && `object-${objectFit}`
        )}
        style={fill ? undefined : { objectFit }}
        onLoadingComplete={() => setIsLoading(false)}
        onError={() => setHasError(true)}
        loading={priority ? 'eager' : 'lazy'}
        quality={85}
      />
    </div>
  )
}

/**
 * Avatar component with optimized loading
 */
export function OptimizedAvatar({
  src,
  alt,
  size = 40,
  className,
}: {
  src?: string | null
  alt: string
  size?: number
  className?: string
}) {
  if (!src) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-gray-200 text-gray-600 font-semibold rounded-full',
          className
        )}
        style={{ width: size, height: size }}
      >
        {alt.charAt(0).toUpperCase()}
      </div>
    )
  }

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={cn('rounded-full', className)}
      objectFit="cover"
    />
  )
}
