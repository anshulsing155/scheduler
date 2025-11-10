# Payment Components

This directory contains components for handling payment processing with Stripe.

## Components

### PaymentForm
Main payment form component that integrates with Stripe Elements for secure payment collection.

**Props:**
- `amount`: Payment amount (in dollars/euros, not cents)
- `currency`: Currency code (e.g., 'USD', 'EUR')
- `eventTypeId`: ID of the event type being booked
- `guestEmail`: Guest's email address
- `guestName`: Guest's name
- `onSuccess`: Callback when payment succeeds (receives paymentId)
- `onError`: Callback when payment fails (receives error message)

**Usage:**
```tsx
<PaymentForm
  amount={50.00}
  currency="USD"
  eventTypeId="evt_123"
  guestEmail="guest@example.com"
  guestName="John Doe"
  onSuccess={(paymentId) => console.log('Payment successful:', paymentId)}
  onError={(error) => console.error('Payment failed:', error)}
/>
```

### PaymentConfirmation
Displays a success message after payment is completed.

**Props:**
- `amount`: Payment amount
- `currency`: Currency code
- `paymentId`: Stripe payment intent ID
- `bookingId`: (Optional) Associated booking ID
- `onDownloadReceipt`: (Optional) Callback for downloading receipt

### PaymentError
Displays an error message when payment fails.

**Props:**
- `error`: Error message to display
- `onRetry`: (Optional) Callback to retry payment
- `onCancel`: (Optional) Callback to cancel payment flow

## Integration Example

```tsx
'use client'

import { useState } from 'react'
import { PaymentForm } from '@/components/payment/PaymentForm'
import { PaymentConfirmation } from '@/components/payment/PaymentConfirmation'
import { PaymentError } from '@/components/payment/PaymentError'

export function BookingWithPayment() {
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success' | 'error'>('pending')
  const [paymentId, setPaymentId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (paymentStatus === 'success' && paymentId) {
    return (
      <PaymentConfirmation
        amount={50.00}
        currency="USD"
        paymentId={paymentId}
      />
    )
  }

  if (paymentStatus === 'error' && error) {
    return (
      <PaymentError
        error={error}
        onRetry={() => {
          setPaymentStatus('pending')
          setError(null)
        }}
      />
    )
  }

  return (
    <PaymentForm
      amount={50.00}
      currency="USD"
      eventTypeId="evt_123"
      guestEmail="guest@example.com"
      guestName="John Doe"
      onSuccess={(id) => {
        setPaymentId(id)
        setPaymentStatus('success')
      }}
      onError={(err) => {
        setError(err)
        setPaymentStatus('error')
      }}
    />
  )
}
```

## Environment Variables

Make sure to set the following environment variables:

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Security Notes

- Payment processing is handled entirely by Stripe
- Card details never touch our servers
- All payment data is encrypted in transit
- Webhook signature verification ensures authenticity of Stripe events
