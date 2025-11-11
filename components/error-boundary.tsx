'use client';

import { useEffect } from 'react';
import { trackError } from '@/lib/error-tracking';

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Error Boundary Component
 * 
 * Catches and displays errors in the application.
 * Automatically reports errors to error tracking service.
 */
export default function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  useEffect(() => {
    // Log error to console
    console.error('Error boundary caught:', error);

    // Track error
    trackError(error, {
      digest: error.digest,
      boundary: 'root',
    });
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-6">
          <svg
            className="mx-auto h-16 w-16 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h2 className="mb-2 text-2xl font-bold text-gray-900">
          Something went wrong!
        </h2>

        <p className="mb-6 text-gray-600">
          We've been notified about this issue and are working on a fix.
        </p>

        {process.env.NODE_ENV === 'development' && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-left">
            <p className="mb-2 font-mono text-sm text-red-800">
              {error.message}
            </p>
            {error.digest && (
              <p className="font-mono text-xs text-red-600">
                Error ID: {error.digest}
              </p>
            )}
          </div>
        )}

        <div className="flex gap-4 justify-center">
          <button
            onClick={reset}
            className="rounded-lg bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700 transition-colors"
          >
            Try again
          </button>

          <a
            href="/"
            className="rounded-lg bg-gray-200 px-6 py-3 text-gray-900 font-medium hover:bg-gray-300 transition-colors"
          >
            Go home
          </a>
        </div>

        {error.digest && (
          <p className="mt-6 text-sm text-gray-500">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
