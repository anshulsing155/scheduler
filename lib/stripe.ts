import { loadStripe, Stripe } from '@stripe/stripe-js'

let stripePromise: Promise<Stripe | null>

/**
 * Get Stripe instance for client-side usage
 */
export const getStripe = () => {
  if (!stripePromise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || process.env.STRIPE_PUBLIC_KEY

    if (!key) {
      console.error('Stripe publishable key not found')
      return Promise.resolve(null)
    }

    stripePromise = loadStripe(key)
  }
  return stripePromise
}
