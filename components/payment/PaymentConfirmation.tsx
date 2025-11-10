'use client'

import { CheckCircle2, CreditCard, Download } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface PaymentConfirmationProps {
  amount: number
  currency: string
  paymentId: string
  bookingId?: string
  onDownloadReceipt?: () => void
}

/**
 * Payment confirmation component
 * Displays success message after payment is completed
 */
export function PaymentConfirmation({
  amount,
  currency,
  paymentId,
  bookingId,
  onDownloadReceipt,
}: PaymentConfirmationProps) {
  return (
    <Card className="border-green-200 bg-green-50/50">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <CardTitle className="text-green-900">Payment Successful</CardTitle>
            <CardDescription className="text-green-700">
              Your payment has been processed successfully
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 rounded-lg border border-green-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Amount Paid</span>
            <span className="text-lg font-bold text-green-900">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: currency,
              }).format(amount)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Payment ID</span>
            <span className="text-sm font-mono text-muted-foreground">
              {paymentId.slice(0, 20)}...
            </span>
          </div>
          {bookingId && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Booking ID</span>
              <span className="text-sm font-mono text-muted-foreground">
                {bookingId.slice(0, 20)}...
              </span>
            </div>
          )}
        </div>

        {onDownloadReceipt && (
          <Button
            variant="outline"
            className="w-full"
            onClick={onDownloadReceipt}
          >
            <Download className="mr-2 h-4 w-4" />
            Download Receipt
          </Button>
        )}

        <p className="text-xs text-center text-muted-foreground">
          A confirmation email with your receipt has been sent to your email address.
        </p>
      </CardContent>
    </Card>
  )
}
