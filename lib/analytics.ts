/**
 * Analytics Tracking
 * 
 * Provides custom event tracking for business metrics.
 * Integrates with Vercel Analytics when available.
 */

interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
}

/**
 * Track a custom event
 */
function trackEvent(event: AnalyticsEvent): void {
  // Log in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics]', event.name, event.properties);
  }

  // Send to Vercel Analytics if available
  if (typeof window !== 'undefined' && (window as any).va) {
    (window as any).va('track', event.name, event.properties);
  }
}

/**
 * Analytics tracking functions
 */
export const analytics = {
  // Booking events
  bookingCreated: (eventTypeId: string, duration: number) => {
    trackEvent({
      name: 'booking_created',
      properties: { eventTypeId, duration },
    });
  },

  bookingCancelled: (bookingId: string, reason?: string) => {
    trackEvent({
      name: 'booking_cancelled',
      properties: { bookingId, reason },
    });
  },

  bookingRescheduled: (bookingId: string) => {
    trackEvent({
      name: 'booking_rescheduled',
      properties: { bookingId },
    });
  },

  // Event type events
  eventTypeCreated: (eventTypeId: string) => {
    trackEvent({
      name: 'event_type_created',
      properties: { eventTypeId },
    });
  },

  eventTypeUpdated: (eventTypeId: string) => {
    trackEvent({
      name: 'event_type_updated',
      properties: { eventTypeId },
    });
  },

  eventTypeDeleted: (eventTypeId: string) => {
    trackEvent({
      name: 'event_type_deleted',
      properties: { eventTypeId },
    });
  },

  // User events
  userSignedUp: (method: string) => {
    trackEvent({
      name: 'user_signed_up',
      properties: { method },
    });
  },

  userSignedIn: (method: string) => {
    trackEvent({
      name: 'user_signed_in',
      properties: { method },
    });
  },

  userSignedOut: () => {
    trackEvent({
      name: 'user_signed_out',
    });
  },

  // Payment events
  paymentCompleted: (amount: number, currency: string) => {
    trackEvent({
      name: 'payment_completed',
      properties: { amount, currency },
    });
  },

  paymentFailed: (amount: number, currency: string, reason?: string) => {
    trackEvent({
      name: 'payment_failed',
      properties: { amount, currency, reason },
    });
  },

  refundProcessed: (amount: number, currency: string) => {
    trackEvent({
      name: 'refund_processed',
      properties: { amount, currency },
    });
  },

  // Calendar events
  calendarConnected: (provider: string) => {
    trackEvent({
      name: 'calendar_connected',
      properties: { provider },
    });
  },

  calendarDisconnected: (provider: string) => {
    trackEvent({
      name: 'calendar_disconnected',
      properties: { provider },
    });
  },

  // Team events
  teamCreated: (teamId: string) => {
    trackEvent({
      name: 'team_created',
      properties: { teamId },
    });
  },

  teamMemberInvited: (teamId: string, role: string) => {
    trackEvent({
      name: 'team_member_invited',
      properties: { teamId, role },
    });
  },

  teamMemberAccepted: (teamId: string) => {
    trackEvent({
      name: 'team_member_accepted',
      properties: { teamId },
    });
  },

  // Availability events
  availabilityUpdated: (userId: string) => {
    trackEvent({
      name: 'availability_updated',
      properties: { userId },
    });
  },

  // Page views
  pageView: (path: string) => {
    trackEvent({
      name: 'page_view',
      properties: { path },
    });
  },

  // Errors
  errorOccurred: (errorType: string, message: string) => {
    trackEvent({
      name: 'error_occurred',
      properties: { errorType, message },
    });
  },
};
