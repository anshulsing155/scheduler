/**
 * Error Tracking Utilities
 * 
 * Provides centralized error tracking and logging functionality.
 * Integrates with Sentry when configured.
 */

interface ErrorContext {
  [key: string]: any;
}

interface User {
  id: string;
  email?: string;
  username?: string;
}

/**
 * Track an error with optional context
 */
export function trackError(
  error: Error,
  context?: ErrorContext
): void {
  console.error('Error:', error, context);

  // If Sentry is configured, send to Sentry
  if (typeof window !== 'undefined' && (window as any).Sentry) {
    (window as any).Sentry.captureException(error, {
      extra: context,
    });
  }
}

/**
 * Track a message with severity level
 */
export function trackMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  context?: ErrorContext
): void {
  const logMethod = level === 'error' ? 'error' : level === 'warning' ? 'warn' : 'log';
  console[logMethod](`[${level.toUpperCase()}]`, message, context);

  if (typeof window !== 'undefined' && (window as any).Sentry) {
    (window as any).Sentry.captureMessage(message, {
      level,
      extra: context,
    });
  }
}

/**
 * Set user context for error tracking
 */
export function setUserContext(user: User): void {
  if (typeof window !== 'undefined' && (window as any).Sentry) {
    (window as any).Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.username,
    });
  }
}

/**
 * Clear user context
 */
export function clearUserContext(): void {
  if (typeof window !== 'undefined' && (window as any).Sentry) {
    (window as any).Sentry.setUser(null);
  }
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(
  message: string,
  category: string,
  data?: ErrorContext
): void {
  if (typeof window !== 'undefined' && (window as any).Sentry) {
    (window as any).Sentry.addBreadcrumb({
      message,
      category,
      data,
      level: 'info',
    });
  }
}

/**
 * Track performance of async operations
 */
export async function trackPerformance<T>(
  name: string,
  operation: string,
  callback: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();

  try {
    const result = await callback();
    const duration = Date.now() - startTime;

    // Log slow operations
    if (duration > 1000) {
      trackMessage(
        `Slow operation: ${name}`,
        'warning',
        { operation, duration }
      );
    }

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    trackError(error as Error, { name, operation, duration });
    throw error;
  }
}
