import { ReactNode, useId } from 'react'
import { cn } from '@/lib/utils'
import { AlertCircle } from 'lucide-react'

interface FormFieldProps {
  label: string
  error?: string
  hint?: string
  required?: boolean
  children: ReactNode
  className?: string
  htmlFor?: string
}

export function FormField({ label, error, hint, required, children, className, htmlFor }: FormFieldProps) {
  const generatedId = useId()
  const id = htmlFor || generatedId
  const errorId = `${id}-error`
  const hintId = `${id}-hint`

  return (
    <div className={cn('space-y-2', className)}>
      <label 
        htmlFor={id} 
        className="block text-sm font-medium text-gray-700"
      >
        {label}
        {required && (
          <span className="text-red-500 ml-1" aria-label="required">
            *
          </span>
        )}
      </label>

      {hint && !error && (
        <p 
          id={hintId} 
          className="text-sm text-gray-500"
        >
          {hint}
        </p>
      )}

      <div className="relative">
        {children}
      </div>

      {error && (
        <div 
          id={errorId}
          className="flex items-start gap-2 text-sm text-red-600"
          role="alert"
          aria-live="polite"
        >
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}

interface FormGroupProps {
  title: string
  description?: string
  children: ReactNode
  className?: string
}

export function FormGroup({ title, description, children, className }: FormGroupProps) {
  return (
    <div className={cn('space-y-6', className)}>
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {description && (
          <p className="mt-1 text-sm text-gray-600">{description}</p>
        )}
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  )
}

interface FormActionsProps {
  children: ReactNode
  className?: string
}

export function FormActions({ children, className }: FormActionsProps) {
  return (
    <div className={cn('flex items-center gap-4 pt-6 border-t', className)}>
      {children}
    </div>
  )
}
