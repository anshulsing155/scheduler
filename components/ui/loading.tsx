import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  fullScreen?: boolean
  className?: string
}

export function Loading({ size = 'md', text, fullScreen = false, className }: LoadingProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  }

  const content = (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <Loader2 
        className={cn('animate-spin text-blue-600', sizeClasses[size])} 
        aria-hidden="true"
      />
      {text && (
        <p className="text-sm text-gray-600" role="status" aria-live="polite">
          {text}
        </p>
      )}
      <span className="sr-only">Loading...</span>
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-50">
        {content}
      </div>
    )
  }

  return content
}

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <Loader2 
      className={cn('h-4 w-4 animate-spin', className)} 
      aria-hidden="true"
    />
  )
}

export function LoadingSkeleton({ className }: { className?: string }) {
  return (
    <div 
      className={cn('animate-pulse bg-gray-200 rounded', className)}
      role="status"
      aria-label="Loading content"
    >
      <span className="sr-only">Loading...</span>
    </div>
  )
}

export function LoadingCard() {
  return (
    <div className="border rounded-lg p-6 space-y-4" role="status" aria-label="Loading card">
      <LoadingSkeleton className="h-6 w-3/4" />
      <LoadingSkeleton className="h-4 w-full" />
      <LoadingSkeleton className="h-4 w-5/6" />
      <LoadingSkeleton className="h-10 w-32 mt-4" />
      <span className="sr-only">Loading card content...</span>
    </div>
  )
}

export function LoadingTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3" role="status" aria-label="Loading table">
      <LoadingSkeleton className="h-10 w-full" />
      {Array.from({ length: rows }).map((_, i) => (
        <LoadingSkeleton key={i} className="h-16 w-full" />
      ))}
      <span className="sr-only">Loading table data...</span>
    </div>
  )
}
