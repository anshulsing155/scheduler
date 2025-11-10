# Performance Optimization Guide

This document outlines the performance optimizations implemented in the Calendly Scheduler application.

## Caching Strategy

### In-Memory Cache
- **Location**: `lib/cache.ts`
- **TTL Configuration**: `lib/cache.ts` (CacheTTL constants)
- **Cache Keys**: Standardized in `CacheKeys` object

### Cached Resources
1. **User Availability** (60s TTL)
   - Weekly schedules
   - Date overrides
   - Available time slots

2. **Event Types** (5min TTL)
   - User event types list
   - Individual event type details
   - Public booking pages

3. **Bookings** (Invalidated on change)
   - User bookings list
   - Individual booking details

### Cache Invalidation
- **Automatic**: On data mutations (create, update, delete)
- **Manual**: Using `cacheInvalidation` utilities
- **Pattern-based**: Wildcard invalidation for related keys

## Database Optimizations

### Indexes Added
```prisma
// Booking indexes
@@index([userId, startTime])
@@index([userId, status])
@@index([guestEmail])
@@index([endTime])

// EventType indexes
@@index([userId, isActive])
@@index([slug])

// Availability indexes
@@index([userId, dayOfWeek])

// Payment indexes
@@index([userId, status])
@@index([createdAt])
```

### Query Optimization
- **Select Patterns**: Defined in `lib/prisma-helpers.ts`
- **Include Patterns**: Reusable patterns for relations
- **Pagination**: Helper functions for efficient pagination
- **Connection Pooling**: Configured in `lib/prisma.ts`

### Best Practices
1. Always use `select` to fetch only needed fields
2. Use `include` patterns from `prisma-helpers.ts`
3. Implement pagination for large datasets
4. Avoid N+1 queries with proper includes

## Frontend Optimizations

### Code Splitting
- **Dynamic Imports**: Heavy components lazy-loaded
- **Route-based**: Automatic with Next.js App Router
- **Component-based**: Using `lib/lazy-components.ts`

### Lazy-Loaded Components
- Analytics Dashboard (charts)
- Calendar components (date libraries)
- Payment forms (Stripe Elements)
- Team management
- Profile components

### Image Optimization
- **Next.js Image**: Automatic optimization
- **Formats**: AVIF, WebP with fallbacks
- **Lazy Loading**: Below-the-fold images
- **Blur Placeholder**: Smooth loading experience
- **Component**: `components/ui/optimized-image.tsx`

### Loading States
- **Skeleton Loaders**: `components/ui/loading-skeletons.tsx`
- **Suspense Boundaries**: For async components
- **Progressive Enhancement**: Content loads incrementally

### Bundle Optimization
- **Tree Shaking**: Automatic with Next.js
- **Package Optimization**: Configured in `next.config.js`
- **Console Removal**: Production builds
- **SWC Minification**: Enabled

## Performance Monitoring

### Metrics to Track
1. **Core Web Vitals**
   - LCP (Largest Contentful Paint): < 2.5s
   - FID (First Input Delay): < 100ms
   - CLS (Cumulative Layout Shift): < 0.1

2. **Custom Metrics**
   - Time to Interactive (TTI)
   - API Response Times
   - Cache Hit Rate

### Tools
- **Next.js Analytics**: Built-in performance tracking
- **Browser DevTools**: Performance profiling
- **Lighthouse**: Automated audits

## Best Practices

### Data Fetching
```typescript
// Use optimized fetch hook
import { useOptimizedFetch } from '@/lib/hooks/use-optimized-fetch'

const { data, isLoading, mutate } = useOptimizedFetch(
  'cache-key',
  fetchFunction,
  { cacheTime: 300000 }
)
```

### Component Optimization
```typescript
// Use lazy loading for heavy components
import { AnalyticsDashboard } from '@/lib/lazy-components'

// Use skeleton loaders
import { DashboardSkeleton } from '@/components/ui/loading-skeletons'

<Suspense fallback={<DashboardSkeleton />}>
  <AnalyticsDashboard />
</Suspense>
```

### Image Usage
```typescript
// Use optimized image component
import { OptimizedImage } from '@/components/ui/optimized-image'

<OptimizedImage
  src="/path/to/image.jpg"
  alt="Description"
  width={800}
  height={600}
  priority={false} // Only true for above-the-fold images
/>
```

### Performance Utilities
```typescript
import { debounce, throttle, memoize } from '@/lib/performance'

// Debounce search input
const debouncedSearch = debounce(handleSearch, 300)

// Throttle scroll handler
const throttledScroll = throttle(handleScroll, 100)

// Memoize expensive calculations
const memoizedCalculation = memoize(expensiveFunction)
```

## Deployment Optimizations

### Vercel Configuration
- **Edge Functions**: For API routes
- **ISR**: Incremental Static Regeneration for public pages
- **CDN**: Automatic global distribution
- **Compression**: Brotli/Gzip enabled

### Environment Variables
```env
# Production optimizations
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

## Monitoring & Debugging

### Development
```bash
# Analyze bundle size
npm run build
# Check build output for bundle sizes

# Profile performance
# Use React DevTools Profiler
# Use Chrome DevTools Performance tab
```

### Production
- Monitor cache hit rates
- Track API response times
- Review error logs
- Analyze user metrics

## Future Optimizations

### Planned Improvements
1. **Redis Integration**: For distributed caching
2. **Service Worker**: For offline support
3. **Prefetching**: Intelligent route prefetching
4. **Virtual Scrolling**: For large lists
5. **Web Workers**: For heavy computations

### Experimental Features
- React Server Components optimization
- Streaming SSR
- Partial Prerendering
- Edge Runtime for more routes

## Performance Checklist

- [ ] Images optimized and lazy-loaded
- [ ] Heavy components code-split
- [ ] Skeleton loaders implemented
- [ ] Database queries optimized with indexes
- [ ] Caching strategy implemented
- [ ] Bundle size analyzed and optimized
- [ ] Core Web Vitals measured
- [ ] API response times monitored
- [ ] Error boundaries in place
- [ ] Loading states for all async operations

## Resources

- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Web Vitals](https://web.dev/vitals/)
- [Prisma Performance](https://www.prisma.io/docs/guides/performance-and-optimization)
- [React Performance](https://react.dev/learn/render-and-commit)
