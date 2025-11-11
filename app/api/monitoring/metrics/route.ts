import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * Get system metrics for monitoring dashboard
 */
export async function GET() {
  try {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get booking metrics
    const [
      totalBookings,
      bookingsLast24h,
      bookingsLast7d,
      activeUsers,
      totalRevenue,
    ] = await Promise.all([
      // Total bookings
      prisma.booking.count(),

      // Bookings in last 24 hours
      prisma.booking.count({
        where: {
          createdAt: {
            gte: oneDayAgo,
          },
        },
      }),

      // Bookings in last 7 days
      prisma.booking.count({
        where: {
          createdAt: {
            gte: oneWeekAgo,
          },
        },
      }),

      // Active users (users with bookings in last 7 days)
      prisma.user.count({
        where: {
          bookings: {
            some: {
              createdAt: {
                gte: oneWeekAgo,
              },
            },
          },
        },
      }),

      // Total revenue
      prisma.payment.aggregate({
        where: {
          status: 'SUCCEEDED',
        },
        _sum: {
          amount: true,
        },
      }),
    ]);

    // Calculate error rate (simplified - would need error tracking table)
    const errorRate = 0.1; // Placeholder

    // Calculate average response time (simplified)
    const avgResponseTime = 245; // Placeholder

    return NextResponse.json({
      metrics: {
        totalBookings,
        bookingsLast24h,
        bookingsLast7d,
        activeUsers,
        totalRevenue: totalRevenue._sum.amount || 0,
        errorRate,
        avgResponseTime,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to fetch metrics:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch metrics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
