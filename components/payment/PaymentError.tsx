'use client'

import { XCircle, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface PaymentErrorProps {
  error: string
  onRetry?: () => void
  onCancel?: () => void
}

/**
 * Payment error component
 * Displays error message when payment fails
 */
export function PaymentError({
  error,
  onRetry,
  onCancel,
}: PaymentErrorProps) {
  return (
    <Card className="border-red-200 bg-red-50/50">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <XCircle className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <CardTitle className="text-red-900">Payment Failed</CardTitle>
            <CardDescription className="text-red-700">
              We couldn't process your payment
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Common reasons for payment failure:
          </p>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
            <li>Insufficient funds</li>
            <li>Incorrect card details</li>
            <li>Card expired or blocked</li>
            <li>Network connection issues</li>
          </ul>
        </div>

        <div className="flex gap-2">
          {onRetry && (
            <Button
              onClick={onRetry}
              className="flex-1"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          )}
          {onCancel && (
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1"
            >
              Cancel
            </Button>
          )}
        </div>

        <p className="text-xs text-center text-muted-foreground">
          If the problem persists, please contact your bank or try a different payment method.
        </p>
      </CardContent>
    </Card>
  )
}
