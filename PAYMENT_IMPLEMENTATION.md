# Payment Processing Implementation

This document provides an overview of the Stripe payment processing implementation for the Calendly-like scheduling application.

## Overview

The payment system is fully integrated with Stripe to handle:
- Payment collection for paid bookings
- Secure payment processing with Stripe Elements
- Webhook handling for payment events
- Refund processing with cancellation policies
- Payment history and analytics
- Payment settings configuration

## Architecture

### Services Layer

**`services/payment-service.ts`**
- Client-side payment service for API calls
- Server-side payment service for Stripe operations
- Payment intent creation and management
- Refund processing
- Webhook event handling
- Cancellation policy calculations

### API Routes

**`app/api/payments/create-intent/route.ts`**
- Creates Stripe payment intents
- Associates payments with event types and users
- Returns client secret for Stripe Elements

**`app/api/payments/[paymentId]/route.ts`**
- Retrieves payment details by ID
- Includes authorization checks

**`app/api/payments/route.ts`**
- Lists payment history with filtering
- Supports status, date range filters

**`app/api/payments/refund/route.ts`**
- Processes refunds through Stripe
- Validates booking ownership
- Updates payment status

**`app/api/webhooks/stripe/route.ts`**
- Handles Stripe webhook events
- Verifies webhook signatures
- Updates payment status based on events

### UI Components

**`components/payment/PaymentForm.tsx`**
- Stripe Elements integration
- Secure payment collection
- Real-time payment processing
- Error handling and validation

**`components/payment/PaymentConfirmation.tsx`**
- Success message display
- Payment receipt information
- Download receipt option

**`components/payment/PaymentError.tsx`**
- Error message display
- Retry functionality
- User-friendly error explanations

**`components/payment/RefundModal.tsx`**
- Full and partial refund options
- Refund reason collection
- Cancellation policy display

**`components/payment/PaymentSettings.tsx`**
- Currency configuration
- Cancellation policy settings
- Refund window configuration
- Policy preview

**`components/payment/PaymentHistory.tsx`**
- Payment transaction list
- Revenue analytics
- Status filtering
- CSV export functionality

## Setup Instructions

### 1. Install Dependencies

```bash
npm install stripe @stripe/stripe-js @stripe/react-stripe-js
```

### 2. Configure Environment Variables

Add the following to your `.env` file:

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 3. Set Up Stripe Webhook

1. Go to Stripe Dashboard > Developers > Webhooks
2. Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
3. Select events to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
4. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

### 4. Test Webhook Locally

Use Stripe CLI for local testing:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

## Usage Examples

### Creating a Payment Form

```tsx
import { PaymentForm } from '@/components/payment/PaymentForm'

function BookingPage() {
  return (
    <PaymentForm
      amount={50.00}
      currency="USD"
      eventTypeId="evt_123"
      guestEmail="guest@example.com"
      guestName="John Doe"
      onSuccess={(paymentId) => {
        // Handle successful payment
        console.log('Payment successful:', paymentId)
      }}
      onError={(error) => {
        // Handle payment error
        console.error('Payment failed:', error)
      }}
    />
  )
}
```

### Processing a Refund

```tsx
import { RefundModal } from '@/components/payment/RefundModal'

function BookingManagement() {
  const [showRefundModal, setShowRefundModal] = useState(false)

  return (
    <>
      <Button onClick={() => setShowRefundModal(true)}>
        Issue Refund
      </Button>
      
      <RefundModal
        open={showRefundModal}
        onOpenChange={setShowRefundModal}
        bookingId="booking_123"
        paymentAmount={50.00}
        currency="USD"
        onSuccess={() => {
          // Handle successful refund
          console.log('Refund processed')
        }}
      />
    </>
  )
}
```

### Displaying Payment History

```tsx
import { PaymentHistory } from '@/components/payment/PaymentHistory'

function PaymentsPage({ userId }: { userId: string }) {
  return <PaymentHistory userId={userId} />
}
```

### Configuring Payment Settings

```tsx
import { PaymentSettings } from '@/components/payment/PaymentSettings'

function SettingsPage() {
  return (
    <PaymentSettings
      initialSettings={{
        fullRefundHours: 24,
        partialRefundHours: 12,
        partialRefundPercentage: 50,
        currency: 'USD',
      }}
      onSave={async (settings) => {
        // Save settings to database
        await savePaymentSettings(settings)
      }}
    />
  )
}
```

## Cancellation Policy

The system includes a flexible cancellation policy:

- **Full Refund**: Issued if cancelled X hours before booking (default: 24 hours)
- **Partial Refund**: Issued if cancelled between Y and X hours before (default: 12-24 hours, 50%)
- **No Refund**: If cancelled less than Y hours before (default: < 12 hours)

These values are configurable through the PaymentSettings component.

## Security Features

1. **Webhook Signature Verification**: All webhook events are verified using Stripe's signature
2. **Authorization Checks**: Payment operations require proper user authentication
3. **PCI Compliance**: Card details never touch our servers (handled by Stripe Elements)
4. **Secure API Keys**: Secret keys stored in environment variables
5. **HTTPS Only**: All payment operations require secure connections

## Database Schema

The Payment model in Prisma:

```prisma
model Payment {
  id                    String        @id @default(cuid())
  userId                String
  user                  User          @relation(fields: [userId], references: [id])
  amount                Decimal       @db.Decimal(10, 2)
  currency              String
  status                PaymentStatus @default(PENDING)
  stripePaymentIntentId String?       @unique
  stripeRefundId        String?
  booking               Booking?
  createdAt             DateTime      @default(now())
  updatedAt             DateTime      @updatedAt
}

enum PaymentStatus {
  PENDING
  SUCCEEDED
  FAILED
  REFUNDED
  PARTIALLY_REFUNDED
}
```

## Testing

### Test Cards

Use Stripe's test cards for development:

- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **Requires Authentication**: 4000 0025 0000 3155

### Testing Webhooks

```bash
# Listen to webhooks locally
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Trigger test events
stripe trigger payment_intent.succeeded
stripe trigger payment_intent.payment_failed
stripe trigger charge.refunded
```

## Error Handling

The system handles various error scenarios:

1. **Payment Declined**: User-friendly error message with retry option
2. **Network Errors**: Automatic retry with exponential backoff
3. **Webhook Failures**: Logged for manual review
4. **Invalid Refund Amounts**: Validation prevents over-refunding
5. **Missing Configuration**: Clear error messages for setup issues

## Monitoring

Monitor payment operations through:

1. **Stripe Dashboard**: Real-time payment tracking
2. **Application Logs**: Server-side payment events
3. **Payment History**: User-facing transaction list
4. **Analytics**: Revenue and refund metrics

## Future Enhancements

Potential improvements:

1. Support for additional payment methods (Apple Pay, Google Pay)
2. Subscription-based pricing models
3. Multi-currency support with automatic conversion
4. Payment plan options (installments)
5. Invoice generation and management
6. Tax calculation integration
7. Discount codes and promotions

## Support

For issues or questions:

1. Check Stripe Dashboard for payment details
2. Review application logs for errors
3. Verify webhook configuration
4. Test with Stripe CLI locally
5. Contact Stripe support for payment-specific issues

## References

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Elements](https://stripe.com/docs/stripe-js)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Stripe Testing](https://stripe.com/docs/testing)
