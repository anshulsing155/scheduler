# Deployment Guide

This guide covers deploying the Calendly-like Scheduling System to production using Vercel and Supabase.

## Prerequisites

- GitHub account with repository access
- Vercel account (sign up at https://vercel.com)
- Supabase account (sign up at https://supabase.com)
- Domain name (optional, for custom domain)
- All third-party service accounts configured (Stripe, Resend, Twilio, etc.)

## 1. Supabase Production Setup

### 1.1 Create Production Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: calendly-scheduler-prod
   - **Database Password**: Generate a strong password (save it securely)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Select appropriate plan

### 1.2 Configure Database

1. Wait for project provisioning (2-3 minutes)
2. Go to **Project Settings > Database**
3. Copy the following connection strings:
   - **Connection pooling** (for app): `DATABASE_URL`
   - **Direct connection** (for migrations): `DIRECT_URL`

### 1.3 Run Database Migrations

```bash
# Set production database URLs temporarily
export DATABASE_URL="your-production-pooler-url"
export DIRECT_URL="your-production-direct-url"

# Run migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

### 1.4 Configure Authentication

1. Go to **Authentication > Providers**
2. Enable **Email** provider
3. Configure **OAuth Providers**:

**Google OAuth:**
- Enable Google provider
- Add Client ID and Client Secret from Google Cloud Console
- Add authorized redirect URL: `https://your-project.supabase.co/auth/v1/callback`

**Microsoft OAuth:**
- Enable Azure (Microsoft) provider
- Add Client ID and Client Secret from Azure Portal
- Add authorized redirect URL: `https://your-project.supabase.co/auth/v1/callback`

### 1.5 Configure Storage

1. Go to **Storage**
2. Create buckets:
   - `avatars` (public)
   - `logos` (public)
   - `documents` (private)

3. Set up storage policies for each bucket

### 1.6 Get API Keys

1. Go to **Project Settings > API**
2. Copy the following:
   - **Project URL**: `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key**: `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)

## 2. Vercel Deployment Setup

### 2.1 Import Project

1. Go to https://vercel.com/dashboard
2. Click "Add New..." > "Project"
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: ./
   - **Build Command**: `npm run build`
   - **Output Directory**: .next
   - **Install Command**: `npm install`

### 2.2 Configure Environment Variables

Go to **Project Settings > Environment Variables** and add all variables from `.env.example`:

#### Database & Supabase
```
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

#### Authentication
```
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
```

#### OAuth Providers
```
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
MICROSOFT_CLIENT_ID=xxx
MICROSOFT_CLIENT_SECRET=xxx
```

#### Calendar Integration
```
GOOGLE_CALENDAR_API_KEY=xxx
MICROSOFT_GRAPH_CLIENT_ID=xxx
MICROSOFT_GRAPH_CLIENT_SECRET=xxx
```

#### Video Conferencing
```
ZOOM_API_KEY=xxx
ZOOM_API_SECRET=xxx
MICROSOFT_TENANT_ID=xxx
```

#### Payment Processing
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

#### Email & SMS
```
RESEND_API_KEY=re_xxx
TWILIO_ACCOUNT_SID=xxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+1234567890
```

#### Caching & Security
```
REDIS_URL=redis://...
CRON_SECRET=generate-with-openssl-rand-base64-32
```

**Important**: Use production keys for all services, not test/development keys!

### 2.3 Deploy

1. Click "Deploy"
2. Wait for build to complete (3-5 minutes)
3. Vercel will provide a deployment URL: `https://your-project.vercel.app`

## 3. Custom Domain Setup

### 3.1 Add Domain to Vercel

1. Go to **Project Settings > Domains**
2. Click "Add Domain"
3. Enter your domain (e.g., `scheduler.yourdomain.com`)
4. Vercel will provide DNS configuration

### 3.2 Configure DNS

Add the following DNS records at your domain registrar:

**For subdomain (scheduler.yourdomain.com):**
```
Type: CNAME
Name: scheduler
Value: cname.vercel-dns.com
```

**For apex domain (yourdomain.com):**
```
Type: A
Name: @
Value: 76.76.21.21
```

### 3.3 SSL Certificate

- Vercel automatically provisions SSL certificates
- Wait 24-48 hours for DNS propagation
- Certificate will be issued automatically

### 3.4 Update Environment Variables

Update `NEXTAUTH_URL` in Vercel environment variables:
```
NEXTAUTH_URL=https://your-custom-domain.com
```

Redeploy the application for changes to take effect.

## 4. Third-Party Service Configuration

### 4.1 Stripe Webhooks

1. Go to Stripe Dashboard > Developers > Webhooks
2. Click "Add endpoint"
3. Enter URL: `https://your-domain.com/api/webhooks/stripe`
4. Select events to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
5. Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET`

### 4.2 OAuth Redirect URIs

Update authorized redirect URIs in all OAuth providers:

**Google Cloud Console:**
- Add: `https://your-domain.com/api/auth/callback/google`
- Add: `https://your-project.supabase.co/auth/v1/callback`

**Azure Portal (Microsoft):**
- Add: `https://your-domain.com/api/auth/callback/azure-ad`
- Add: `https://your-project.supabase.co/auth/v1/callback`

### 4.3 Calendar API Permissions

Ensure calendar APIs have proper scopes:

**Google Calendar API:**
- `https://www.googleapis.com/auth/calendar.readonly`
- `https://www.googleapis.com/auth/calendar.events`

**Microsoft Graph API:**
- `Calendars.Read`
- `Calendars.ReadWrite`

### 4.4 Email Domain Verification

**Resend:**
1. Go to Resend Dashboard > Domains
2. Add your domain
3. Add DNS records provided by Resend
4. Verify domain

## 5. Post-Deployment Verification

### 5.1 Health Checks

Test the following endpoints:
- `https://your-domain.com` - Homepage loads
- `https://your-domain.com/api/health` - API health check
- `https://your-domain.com/auth/signin` - Auth pages load

### 5.2 Database Connection

Verify database connectivity:
```bash
# Test from local machine with production URL
DATABASE_URL="your-production-url" npx prisma db pull
```

### 5.3 Feature Testing

Test critical user flows:
1. User registration and login
2. Create event type
3. Public booking page loads
4. Complete a test booking
5. Receive confirmation email
6. Calendar integration works
7. Payment processing (use Stripe test mode first)

### 5.4 Performance Testing

- Check page load times (target: < 2s)
- Test API response times (target: < 500ms)
- Verify caching is working
- Check database query performance

## 6. Monitoring Setup

### 6.1 Vercel Analytics

1. Go to **Project Settings > Analytics**
2. Enable Vercel Analytics
3. Monitor:
   - Page views
   - Unique visitors
   - Top pages
   - Performance metrics

### 6.2 Error Tracking (Sentry)

See `MONITORING.md` for detailed Sentry setup.

### 6.3 Uptime Monitoring

Set up external uptime monitoring:
- UptimeRobot (free tier available)
- Pingdom
- StatusCake

Monitor endpoints:
- Homepage: `https://your-domain.com`
- API health: `https://your-domain.com/api/health`

## 7. Backup and Recovery

### 7.1 Database Backups

Supabase provides automatic daily backups:
1. Go to **Database > Backups**
2. Configure backup retention
3. Test restore process

### 7.2 Manual Backup

```bash
# Export database
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Restore database
psql $DATABASE_URL < backup-20240101.sql
```

## 8. Scaling Considerations

### 8.1 Database Scaling

- Monitor connection pool usage
- Upgrade Supabase plan if needed
- Add read replicas for heavy read workloads

### 8.2 Caching

- Implement Redis for availability calculations
- Use Vercel Edge Caching for static content
- Cache public booking pages

### 8.3 CDN

- Vercel automatically uses CDN for static assets
- Optimize images with Next.js Image component
- Use edge functions for API routes

## 9. Security Checklist

- [ ] All environment variables are set correctly
- [ ] Production API keys are used (not test keys)
- [ ] NEXTAUTH_SECRET is strong and unique
- [ ] Database passwords are strong
- [ ] SSL certificates are active
- [ ] CORS is properly configured
- [ ] Rate limiting is enabled
- [ ] Supabase RLS policies are active
- [ ] Webhook endpoints are secured
- [ ] Sensitive data is encrypted

## 10. Rollback Procedure

If deployment fails or issues arise:

1. **Instant Rollback**: Go to Vercel Dashboard > Deployments > Previous deployment > "Promote to Production"
2. **Database Rollback**: Restore from Supabase backup
3. **Environment Variables**: Revert to previous values if needed

## Troubleshooting

### Build Failures

```bash
# Check build logs in Vercel dashboard
# Common issues:
# - Missing environment variables
# - TypeScript errors
# - Dependency issues

# Test build locally
npm run build
```

### Database Connection Issues

```bash
# Test connection
npx prisma db pull

# Check connection string format
# Ensure IP allowlist includes Vercel IPs (or use 0.0.0.0/0)
```

### OAuth Issues

- Verify redirect URIs match exactly
- Check client IDs and secrets
- Ensure OAuth consent screen is configured

## Support

For issues:
1. Check Vercel deployment logs
2. Check Supabase logs
3. Review error tracking in Sentry
4. Consult documentation: https://vercel.com/docs, https://supabase.com/docs
