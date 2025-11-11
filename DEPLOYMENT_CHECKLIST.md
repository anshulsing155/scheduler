# Deployment Checklist

Use this checklist to ensure all deployment and CI/CD components are properly configured.

## Pre-Deployment

### 1. Environment Setup
- [ ] All environment variables configured in `.env`
- [ ] Production database created in Supabase
- [ ] Database migrations tested locally
- [ ] All third-party API keys obtained (Stripe, Resend, Twilio, etc.)
- [ ] OAuth providers configured with production URLs

### 2. Code Quality
- [ ] All tests passing (`npm run test`)
- [ ] No TypeScript errors (`npm run typecheck`)
- [ ] No linting errors (`npm run lint`)
- [ ] Build succeeds locally (`npm run build`)

### 3. Security
- [ ] All secrets stored in environment variables
- [ ] No sensitive data in code
- [ ] Security headers configured in `vercel.json`
- [ ] Rate limiting implemented
- [ ] CORS properly configured

## Vercel Setup

### 1. Project Configuration
- [ ] GitHub repository connected to Vercel
- [ ] Project imported in Vercel dashboard
- [ ] Build settings configured
- [ ] Environment variables added to Vercel

### 2. Domain Setup
- [ ] Custom domain added to Vercel
- [ ] DNS records configured
- [ ] SSL certificate provisioned
- [ ] Domain verified and active

### 3. Deployment Settings
- [ ] Production branch set to `main`
- [ ] Preview deployments enabled for PRs
- [ ] Build command: `npm run build`
- [ ] Output directory: `.next`
- [ ] Node.js version: 20.x

## Database Setup

### 1. Supabase Production
- [ ] Production project created
- [ ] Database connection strings obtained
- [ ] Connection pooling configured
- [ ] RLS policies applied
- [ ] Storage buckets created
- [ ] Authentication providers configured

### 2. Migrations
- [ ] All migrations run on production database
- [ ] Prisma client generated
- [ ] Database indexes created
- [ ] Sample data seeded (if needed)

## CI/CD Pipeline

### 1. GitHub Actions
- [ ] CI workflow configured (`.github/workflows/ci.yml`)
- [ ] Preview workflow configured (`.github/workflows/preview.yml`)
- [ ] Deploy workflow configured (`.github/workflows/deploy.yml`)
- [ ] GitHub secrets added
- [ ] Branch protection rules set

### 2. GitHub Secrets
- [ ] `DATABASE_URL`
- [ ] `TEST_DATABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `NEXTAUTH_SECRET`
- [ ] `NEXTAUTH_URL`
- [ ] `VERCEL_TOKEN`
- [ ] `VERCEL_ORG_ID`
- [ ] `VERCEL_PROJECT_ID`

### 3. Workflow Testing
- [ ] CI workflow runs on PR
- [ ] Preview deployment created for PR
- [ ] Production deployment runs on merge to main
- [ ] All workflow steps passing

## Monitoring Setup

### 1. Error Tracking (Sentry)
- [ ] Sentry project created
- [ ] Sentry SDK installed (optional)
- [ ] DSN configured in environment variables
- [ ] Error tracking tested
- [ ] Alerts configured

### 2. Analytics
- [ ] Vercel Analytics enabled
- [ ] Custom events implemented
- [ ] Analytics dashboard accessible
- [ ] Web vitals tracking active

### 3. Uptime Monitoring
- [ ] UptimeRobot account created
- [ ] Health check endpoint monitored
- [ ] Homepage monitored
- [ ] Alert contacts configured
- [ ] Status page created (optional)

### 4. Logging
- [ ] Structured logging implemented
- [ ] Error logs captured
- [ ] Performance logs tracked
- [ ] Log retention configured

## Third-Party Services

### 1. Stripe
- [ ] Production API keys configured
- [ ] Webhook endpoint created
- [ ] Webhook secret added to environment
- [ ] Test payment processed
- [ ] Refund flow tested

### 2. Email (Resend)
- [ ] Production API key configured
- [ ] Domain verified
- [ ] Email templates tested
- [ ] Calendar invites working

### 3. SMS (Twilio)
- [ ] Production credentials configured
- [ ] Phone number verified
- [ ] Test SMS sent
- [ ] SMS templates working

### 4. Calendar Integration
- [ ] Google Calendar API enabled
- [ ] Microsoft Graph API enabled
- [ ] OAuth redirect URIs updated
- [ ] Calendar sync tested

### 5. Video Conferencing
- [ ] Zoom API configured
- [ ] Google Meet integration tested
- [ ] Microsoft Teams integration tested
- [ ] Meeting links generating correctly

## Post-Deployment

### 1. Verification
- [ ] Homepage loads correctly
- [ ] Authentication works
- [ ] User can create event type
- [ ] Public booking page accessible
- [ ] Booking flow completes successfully
- [ ] Email notifications sent
- [ ] Payment processing works
- [ ] Calendar integration syncs

### 2. Performance
- [ ] Page load times < 2s
- [ ] API response times < 500ms
- [ ] Database queries optimized
- [ ] Caching working correctly
- [ ] Images optimized

### 3. Monitoring
- [ ] Health check endpoint responding
- [ ] Error tracking capturing errors
- [ ] Analytics tracking events
- [ ] Uptime monitoring active
- [ ] Alerts configured and tested

### 4. Documentation
- [ ] Deployment guide reviewed
- [ ] Monitoring guide reviewed
- [ ] Environment variables documented
- [ ] Runbook created for common issues

## Rollback Plan

### If Issues Occur
1. [ ] Rollback procedure documented
2. [ ] Previous deployment can be promoted
3. [ ] Database backup available
4. [ ] Rollback tested in staging

## Sign-Off

- [ ] Development team approval
- [ ] QA testing completed
- [ ] Security review completed
- [ ] Performance benchmarks met
- [ ] Documentation complete

---

**Deployment Date**: _______________

**Deployed By**: _______________

**Version/Commit**: _______________

**Notes**: 
_______________________________________________
_______________________________________________
_______________________________________________
