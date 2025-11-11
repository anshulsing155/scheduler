# Monitoring and Error Tracking Guide

This guide covers setting up comprehensive monitoring and error tracking for the Calendly Scheduler application.

## Overview

The monitoring stack includes:
- **Sentry**: Error tracking and performance monitoring
- **Vercel Analytics**: Web analytics and performance metrics
- **Uptime Monitoring**: Service availability tracking
- **Custom Logging**: Application-specific logging

## 1. Sentry Setup

### 1.1 Create Sentry Account

1. Go to https://sentry.io
2. Sign up or log in
3. Create a new project:
   - Platform: **Next.js**
   - Project name: **calendly-scheduler**
   - Alert frequency: **On every new issue**

### 1.2 Install Sentry SDK

```bash
npm install @sentry/nextjs
```

### 1.3 Initialize Sentry

Run the Sentry wizard:

```bash
npx @sentry/wizard@latest -i nextjs
```

This will:
- Create `sentry.client.config.ts`
- Create `sentry.server.config.ts`
- Create `sentry.edge.config.ts`
- Update `next.config.js`
- Add Sentry to `.env.local`

### 1.4 Configure Sentry

Add to `.env.example`:

```bash
# Sentry
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_ORG=your-org
SENTRY_PROJECT=calendly-scheduler
SENTRY_AUTH_TOKEN=your-auth-token
```

### 1.5 Custom Error Boundary

Create `components/error-boundary.tsx`:

```typescript
'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to Sentry
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
        <p className="text-gray-600 mb-6">
          We've been notified and are working on a fix.
        </p>
        <button
          onClick={reset}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
```

### 1.6 Sentry Configuration Files

**sentry.client.config.ts**:
```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Performance Monitoring
  tracesSampleRate: 1.0,
  
  // Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  
  // Environment
  environment: process.env.NODE_ENV,
  
  // Release tracking
  release: process.env.VERCEL_GIT_COMMIT_SHA,
  
  // Ignore common errors
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',
  ],
  
  beforeSend(event, hint) {
    // Filter out sensitive data
    if (event.request) {
      delete event.request.cookies;
      delete event.request.headers;
    }
    return event;
  },
});
```

**sentry.server.config.ts**:
```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  tracesSampleRate: 1.0,
  
  environment: process.env.NODE_ENV,
  
  release: process.env.VERCEL_GIT_COMMIT_SHA,
  
  beforeSend(event, hint) {
    // Filter sensitive server data
    if (event.request) {
      delete event.request.cookies;
      delete event.request.headers;
    }
    
    // Don't send health check errors
    if (event.request?.url?.includes('/api/health')) {
      return null;
    }
    
    return event;
  },
});
```

### 1.7 Custom Error Tracking

Create `lib/error-tracking.ts`:

```typescript
import * as Sentry from '@sentry/nextjs';

export function trackError(
  error: Error,
  context?: Record<string, any>
) {
  console.error('Error:', error, context);
  
  Sentry.captureException(error, {
    extra: context,
  });
}

export function trackMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  context?: Record<string, any>
) {
  console.log(`[${level.toUpperCase()}]`, message, context);
  
  Sentry.captureMessage(message, {
    level,
    extra: context,
  });
}

export function setUserContext(user: {
  id: string;
  email?: string;
  username?: string;
}) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
  });
}

export function clearUserContext() {
  Sentry.setUser(null);
}

export function addBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, any>
) {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
  });
}
```

### 1.8 Performance Monitoring

Track custom transactions:

```typescript
import * as Sentry from '@sentry/nextjs';

export async function trackPerformance<T>(
  name: string,
  operation: string,
  callback: () => Promise<T>
): Promise<T> {
  const transaction = Sentry.startTransaction({
    name,
    op: operation,
  });

  try {
    const result = await callback();
    transaction.setStatus('ok');
    return result;
  } catch (error) {
    transaction.setStatus('internal_error');
    throw error;
  } finally {
    transaction.finish();
  }
}
```

## 2. Vercel Analytics

### 2.1 Enable Vercel Analytics

1. Go to Vercel Dashboard
2. Select your project
3. Go to **Analytics** tab
4. Click **Enable Analytics**

### 2.2 Install Vercel Analytics

```bash
npm install @vercel/analytics
```

### 2.3 Add to Root Layout

Update `app/layout.tsx`:

```typescript
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
```

### 2.4 Track Custom Events

Create `lib/analytics.ts`:

```typescript
import { track } from '@vercel/analytics';

export const analytics = {
  // Booking events
  bookingCreated: (eventTypeId: string, duration: number) => {
    track('booking_created', { eventTypeId, duration });
  },
  
  bookingCancelled: (bookingId: string, reason?: string) => {
    track('booking_cancelled', { bookingId, reason });
  },
  
  bookingRescheduled: (bookingId: string) => {
    track('booking_rescheduled', { bookingId });
  },
  
  // Event type events
  eventTypeCreated: (eventTypeId: string) => {
    track('event_type_created', { eventTypeId });
  },
  
  // User events
  userSignedUp: (method: string) => {
    track('user_signed_up', { method });
  },
  
  userSignedIn: (method: string) => {
    track('user_signed_in', { method });
  },
  
  // Payment events
  paymentCompleted: (amount: number, currency: string) => {
    track('payment_completed', { amount, currency });
  },
  
  // Calendar events
  calendarConnected: (provider: string) => {
    track('calendar_connected', { provider });
  },
};
```

## 3. Uptime Monitoring

### 3.1 UptimeRobot Setup

1. Go to https://uptimerobot.com
2. Sign up for free account
3. Add new monitor:
   - **Monitor Type**: HTTP(s)
   - **Friendly Name**: Calendly Scheduler
   - **URL**: https://your-domain.com/api/health
   - **Monitoring Interval**: 5 minutes
   - **Alert Contacts**: Your email

### 3.2 Additional Monitors

Add monitors for critical endpoints:

- Homepage: `https://your-domain.com`
- API Health: `https://your-domain.com/api/health`
- Auth: `https://your-domain.com/auth/signin`

### 3.3 Status Page

Create public status page:

1. Go to UptimeRobot dashboard
2. Create **Public Status Page**
3. Add all monitors
4. Customize branding
5. Share URL: `https://status.your-domain.com`

## 4. Custom Logging

### 4.1 Logging Service

Create `lib/logger.ts`:

```typescript
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  userId?: string;
  requestId?: string;
  [key: string]: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private log(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      level,
      message,
      ...context,
    };

    // Console output
    if (this.isDevelopment) {
      console[level === 'debug' ? 'log' : level](
        `[${timestamp}] [${level.toUpperCase()}]`,
        message,
        context
      );
    } else {
      // Structured logging for production
      console.log(JSON.stringify(logData));
    }

    // Send to external logging service if needed
    if (level === 'error' && !this.isDevelopment) {
      // Could send to external service here
    }
  }

  debug(message: string, context?: LogContext) {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext) {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error, context?: LogContext) {
    this.log('error', message, {
      ...context,
      error: error?.message,
      stack: error?.stack,
    });
  }
}

export const logger = new Logger();
```

### 4.2 Request Logging Middleware

Create `middleware/logging.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export function withLogging(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    const start = Date.now();
    const requestId = crypto.randomUUID();

    logger.info('Request started', {
      requestId,
      method: req.method,
      url: req.url,
    });

    try {
      const response = await handler(req);
      const duration = Date.now() - start;

      logger.info('Request completed', {
        requestId,
        method: req.method,
        url: req.url,
        status: response.status,
        duration,
      });

      return response;
    } catch (error) {
      const duration = Date.now() - start;

      logger.error(
        'Request failed',
        error as Error,
        {
          requestId,
          method: req.method,
          url: req.url,
          duration,
        }
      );

      throw error;
    }
  };
}
```

## 5. Performance Monitoring

### 5.1 Web Vitals Tracking

Create `components/web-vitals.tsx`:

```typescript
'use client';

import { useReportWebVitals } from 'next/web-vitals';
import { track } from '@vercel/analytics';

export function WebVitals() {
  useReportWebVitals((metric) => {
    // Send to analytics
    track('web_vitals', {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
    });

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Web Vital:', metric);
    }
  });

  return null;
}
```

Add to root layout:

```typescript
import { WebVitals } from '@/components/web-vitals';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <WebVitals />
      </body>
    </html>
  );
}
```

### 5.2 Database Query Monitoring

Create `lib/prisma-monitoring.ts`:

```typescript
import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

export const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'event',
      level: 'error',
    },
    {
      emit: 'event',
      level: 'warn',
    },
  ],
});

// Log slow queries
prisma.$on('query', (e) => {
  if (e.duration > 1000) {
    logger.warn('Slow query detected', {
      query: e.query,
      duration: e.duration,
      params: e.params,
    });
  }
});

// Log errors
prisma.$on('error', (e) => {
  logger.error('Database error', new Error(e.message), {
    target: e.target,
  });
});

// Log warnings
prisma.$on('warn', (e) => {
  logger.warn('Database warning', {
    message: e.message,
    target: e.target,
  });
});
```

## 6. Alerting

### 6.1 Sentry Alerts

Configure in Sentry dashboard:

1. Go to **Alerts** > **Create Alert**
2. Set conditions:
   - Error rate exceeds threshold
   - New issue created
   - Performance degradation
3. Configure notifications:
   - Email
   - Slack (optional)
   - PagerDuty (optional)

### 6.2 Custom Alerts

Create `lib/alerts.ts`:

```typescript
import { logger } from './logger';
import { trackError } from './error-tracking';

export async function sendAlert(
  severity: 'low' | 'medium' | 'high' | 'critical',
  title: string,
  message: string,
  context?: Record<string, any>
) {
  logger.error(`[ALERT] ${title}`, new Error(message), {
    severity,
    ...context,
  });

  trackError(new Error(`${title}: ${message}`), {
    severity,
    ...context,
  });

  // Could integrate with PagerDuty, Slack, etc.
  if (severity === 'critical') {
    // Send immediate notification
  }
}
```

## 7. Monitoring Dashboard

### 7.1 Create Monitoring Page

Create `app/admin/monitoring/page.tsx`:

```typescript
import { Suspense } from 'react';

export default function MonitoringPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">System Monitoring</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard title="Uptime" value="99.9%" />
        <MetricCard title="Response Time" value="245ms" />
        <MetricCard title="Error Rate" value="0.1%" />
        <MetricCard title="Active Users" value="1,234" />
      </div>
      
      <Suspense fallback={<div>Loading...</div>}>
        <RecentErrors />
      </Suspense>
    </div>
  );
}
```

## 8. Best Practices

### 8.1 Error Handling

- Always catch and log errors
- Provide user-friendly error messages
- Include context in error logs
- Don't expose sensitive information

### 8.2 Performance

- Monitor slow queries (> 1s)
- Track API response times
- Monitor memory usage
- Set up alerts for degradation

### 8.3 Security

- Don't log sensitive data (passwords, tokens)
- Sanitize error messages
- Use secure logging practices
- Rotate API keys regularly

### 8.4 Cost Management

- Use appropriate sample rates
- Filter out noise (health checks, etc.)
- Set up budget alerts
- Review usage monthly

## 9. Troubleshooting

### High Error Rate

1. Check Sentry dashboard for common errors
2. Review recent deployments
3. Check external service status
4. Review database performance

### Slow Performance

1. Check Vercel Analytics for slow pages
2. Review database query logs
3. Check external API response times
4. Review caching effectiveness

### Downtime

1. Check UptimeRobot alerts
2. Review Vercel deployment status
3. Check Supabase status
4. Review error logs in Sentry

## 10. Resources

- [Sentry Documentation](https://docs.sentry.io/)
- [Vercel Analytics](https://vercel.com/docs/analytics)
- [Next.js Monitoring](https://nextjs.org/docs/advanced-features/measuring-performance)
- [UptimeRobot Guide](https://uptimerobot.com/help/)
