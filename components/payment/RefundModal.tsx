'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { DollarSign, Loader2, AlertCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { paymentService } from '@/services/payment-service'

const refundSchema = z.object({
  amount: z.string().optional().refine(
    (val) => !val || (!isNaN(parseFloat(val)) && parseFloat(val) > 0),
    { message: 'Amount must be a positive number' }
  ),
  reason: z.string().max(500, 'Reason is too long').optional(),
})

type RefundFormData = z.infer<typeof refundSchema>

interface RefundModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bookingId: string
  paymentAmount: number
  currency: string
  onSuccess?: () => void
}

/**
 * Refund modal component
 * Allows users to process refunds for paid bookings
 */
export function RefundModal({
  open,
  onOpenChange,
  bookingId,
  paymentAmount,
  currency,
  onSuccess,
}: RefundModalProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isFullRefund, setIsFullRefund] = useState(true)

  const form = useForm<RefundFormData>({
    resolver: zodResolver(refundSchema),
    defaultValues: {
      amount: '',
      reason: '',
    },
  })

  const onSubmit = async (data: RefundFormData) => {
    try {
      setIsProcessing(true)
      setError(null)

      const refundAmount = data.amount ? parseFloat(data.amount) : paymentAmount

      // Validate refund amount
      if (refundAmount > paymentAmount) {
        setError('Refund amount cannot exceed the original payment amount')
        return
      }

      const result = await paymentService.processRefund({
        bookingId,
        amount: refundAmount,
        reason: data.reason,
      })

      if (result.success) {
        onOpenChange(false)
        form.reset()
        onSuccess?.()
      } else {
        setError(result.error || 'Failed to process refund')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCancel = () => {
    form.reset()
    setError(null)
    setIsFullRefund(true)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Process Refund
          </DialogTitle>
          <DialogDescription>
            Issue a refund for this booking. The refund will be processed through Stripe.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Original Payment</span>
                  <span className="text-lg font-bold">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: currency,
                    }).format(paymentAmount)}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="full-refund"
                    checked={isFullRefund}
                    onChange={() => {
                      setIsFullRefund(true)
                      form.setValue('amount', '')
                    }}
                    className="h-4 w-4"
                  />
                  <label htmlFor="full-refund" className="text-sm font-medium cursor-pointer">
                    Full Refund
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="partial-refund"
                    checked={!isFullRefund}
                    onChange={() => setIsFullRefund(false)}
                    className="h-4 w-4"
                  />
                  <label htmlFor="partial-refund" className="text-sm font-medium cursor-pointer">
                    Partial Refund
                  </label>
                </div>
              </div>

              {!isFullRefund && (
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Refund Amount</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            {currency === 'USD' ? '$' : currency}
                          </span>
                          <Input
                            {...field}
                            type="number"
                            step="0.01"
                            min="0.01"
                            max={paymentAmount}
                            placeholder="0.00"
                            className="pl-8"
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Maximum: {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: currency,
                        }).format(paymentAmount)}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Enter the reason for this refund..."
                        rows={3}
                      />
                    </FormControl>
                    <FormDescription>
                      This will be included in the refund record
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Refunds typically take 5-10 business days to appear on the customer's statement.
                  This action cannot be undone.
                </AlertDescription>
              </Alert>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isProcessing}
                variant="destructive"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Process Refund
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
