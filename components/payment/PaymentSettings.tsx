'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Settings, Loader2, Save, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'

const paymentSettingsSchema = z.object({
  fullRefundHours: z.string().refine(
    (val) => !isNaN(parseInt(val)) && parseInt(val) >= 0,
    { message: 'Must be a valid number' }
  ),
  partialRefundHours: z.string().refine(
    (val) => !isNaN(parseInt(val)) && parseInt(val) >= 0,
    { message: 'Must be a valid number' }
  ),
  partialRefundPercentage: z.string().refine(
    (val) => !isNaN(parseInt(val)) && parseInt(val) >= 0 && parseInt(val) <= 100,
    { message: 'Must be between 0 and 100' }
  ),
  currency: z.string().min(3).max(3),
})

type PaymentSettingsFormData = z.infer<typeof paymentSettingsSchema>

interface PaymentSettingsProps {
  initialSettings?: {
    fullRefundHours?: number
    partialRefundHours?: number
    partialRefundPercentage?: number
    currency?: string
  }
  onSave?: (settings: PaymentSettingsFormData) => Promise<void>
}

/**
 * Payment settings component
 * Allows users to configure payment and refund policies
 */
export function PaymentSettings({
  initialSettings,
  onSave,
}: PaymentSettingsProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const form = useForm<PaymentSettingsFormData>({
    resolver: zodResolver(paymentSettingsSchema),
    defaultValues: {
      fullRefundHours: String(initialSettings?.fullRefundHours ?? 24),
      partialRefundHours: String(initialSettings?.partialRefundHours ?? 12),
      partialRefundPercentage: String(initialSettings?.partialRefundPercentage ?? 50),
      currency: initialSettings?.currency ?? 'USD',
    },
  })

  const onSubmit = async (data: PaymentSettingsFormData) => {
    try {
      setIsSaving(true)
      setError(null)
      setSuccess(false)

      // Validate that fullRefundHours >= partialRefundHours
      const fullHours = parseInt(data.fullRefundHours)
      const partialHours = parseInt(data.partialRefundHours)

      if (fullHours < partialHours) {
        setError('Full refund hours must be greater than or equal to partial refund hours')
        return
      }

      if (onSave) {
        await onSave(data)
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Payment Settings
        </CardTitle>
        <CardDescription>
          Configure your payment processing and refund policies
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-3">Currency</h3>
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Currency</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="USD">USD - US Dollar</SelectItem>
                          <SelectItem value="EUR">EUR - Euro</SelectItem>
                          <SelectItem value="GBP">GBP - British Pound</SelectItem>
                          <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                          <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                          <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                          <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Currency used for all payment transactions
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="border-t pt-4">
                <h3 className="text-sm font-medium mb-3">Cancellation & Refund Policy</h3>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="fullRefundHours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Refund Window (hours)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            min="0"
                            placeholder="24"
                          />
                        </FormControl>
                        <FormDescription>
                          Customers get a full refund if they cancel this many hours before the booking
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="partialRefundHours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Partial Refund Window (hours)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            min="0"
                            placeholder="12"
                          />
                        </FormControl>
                        <FormDescription>
                          Customers get a partial refund if they cancel between this and the full refund window
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="partialRefundPercentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Partial Refund Percentage</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              {...field}
                              type="number"
                              min="0"
                              max="100"
                              placeholder="50"
                              className="pr-8"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                              %
                            </span>
                          </div>
                        </FormControl>
                        <FormDescription>
                          Percentage of the payment to refund during the partial refund window
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Policy Preview:</strong> Full refund if cancelled{' '}
                  {form.watch('fullRefundHours')}+ hours before. {form.watch('partialRefundPercentage')}% refund if
                  cancelled {form.watch('partialRefundHours')}-{form.watch('fullRefundHours')} hours before. No refund
                  if cancelled less than {form.watch('partialRefundHours')} hours before.
                </AlertDescription>
              </Alert>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-200 bg-green-50">
                  <AlertDescription className="text-green-900">
                    Settings saved successfully!
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Settings
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
