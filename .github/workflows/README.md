# GitHub Actions Workflows

This directory contains CI/CD workflows for the Calendly Scheduler application.

## Workflows

### 1. CI Workflow (`ci.yml`)

**Trigger**: Push or Pull Request to `main` or `develop` branches

**Jobs**:
- **Lint**: Runs ESLint to check code quality
- **Type Check**: Runs TypeScript compiler to check types
- **Test**: Runs unit and integration tests with Vitest
- **Build**: Builds the Next.js application

**Purpose**: Ensures code quality and catches issues early in development.

### 2. Preview Deployment (`preview.yml`)

**Trigger**: Pull Request to `main` branch

**Jobs**:
- Runs all CI checks (lint, typecheck, test)
- Comments on PR with preview deployment information
- Vercel automatically deploys preview (configured in Vercel dashboard)

**Purpose**: Provides preview deployments for code review and testing.

### 3. Production Deployment (`deploy.yml`)

**Trigger**: 
- Push to `main` branch
- Manual workflow dispatch

**Jobs**:
- Runs all CI checks
- Builds the application
- Runs database migrations
- Deploys to Vercel production

**Purpose**: Automated production deployments with safety checks.

## Setup Instructions

### 1. GitHub Secrets

Add the following secrets to your GitHub repository:

**Settings > Secrets and variables > Actions > New repository secret**

#### Required Secrets:

```
# Database
DATABASE_URL=postgresql://...
TEST_DATABASE_URL=postgresql://...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Authentication
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=https://your-domain.com

# Vercel (for deployment workflow)
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-org-id
VERCEL_PROJECT_ID=your-project-id
```

#### Getting Vercel Credentials:

1. **VERCEL_TOKEN**: 
   - Go to https://vercel.com/account/tokens
   - Create new token with appropriate scope
   - Copy token value

2. **VERCEL_ORG_ID** and **VERCEL_PROJECT_ID**:
   - Run `npx vercel link` in your project
   - Check `.vercel/project.json` for IDs
   - Or find in Vercel dashboard URL

### 2. GitHub Environments

Create a production environment for deployment protection:

**Settings > Environments > New environment**

- Name: `production`
- Add protection rules:
  - Required reviewers (optional)
  - Wait timer (optional)
  - Deployment branches: `main` only

### 3. Branch Protection Rules

Protect your main branch:

**Settings > Branches > Add rule**

- Branch name pattern: `main`
- Require pull request reviews
- Require status checks to pass:
  - `Lint`
  - `Type Check`
  - `Test`
  - `Build`
- Require branches to be up to date

## Workflow Behavior

### Pull Request Flow

1. Developer creates PR to `main`
2. CI workflow runs automatically
3. Preview workflow deploys to Vercel preview URL
4. PR comment shows preview URL and CI status
5. Reviewers can test preview deployment
6. After approval and merge, production deployment runs

### Production Deployment Flow

1. Code merged to `main` branch
2. Deploy workflow triggers automatically
3. All CI checks run
4. Database migrations execute
5. Application deploys to Vercel production
6. Deployment status reported

### Manual Deployment

Trigger manual deployment:

1. Go to **Actions** tab
2. Select **Deploy to Production** workflow
3. Click **Run workflow**
4. Select branch (usually `main`)
5. Click **Run workflow** button

## Monitoring Workflows

### View Workflow Runs

- Go to **Actions** tab in GitHub
- Click on workflow name to see runs
- Click on specific run to see job details
- View logs for each step

### Troubleshooting Failed Workflows

#### Lint Failures
```bash
# Run locally to see issues
npm run lint

# Auto-fix issues
npm run lint -- --fix
```

#### Type Check Failures
```bash
# Run locally
npm run typecheck

# Check specific file
npx tsc --noEmit path/to/file.ts
```

#### Test Failures
```bash
# Run tests locally
npm run test

# Run specific test
npm run test path/to/test.spec.ts

# Run with UI
npm run test:ui
```

#### Build Failures
```bash
# Run build locally
npm run build

# Check for missing environment variables
# Ensure all required vars are in GitHub secrets
```

## Best Practices

### 1. Keep Workflows Fast

- Use caching for dependencies (`cache: 'npm'`)
- Run jobs in parallel when possible
- Only run necessary checks

### 2. Fail Fast

- Run quick checks (lint, typecheck) before slow ones (build, test)
- Use `needs` to create job dependencies

### 3. Secure Secrets

- Never log secrets
- Use GitHub secrets for sensitive data
- Rotate tokens regularly

### 4. Clear Feedback

- Use descriptive job names
- Add comments to PRs with status
- Provide actionable error messages

### 5. Test Locally First

- Run all checks locally before pushing
- Use pre-commit hooks (optional)
- Ensure tests pass before creating PR

## Adding New Workflows

To add a new workflow:

1. Create `.github/workflows/your-workflow.yml`
2. Define trigger events
3. Add jobs and steps
4. Test with a PR
5. Document in this README

## Useful Commands

```bash
# Validate workflow syntax
gh workflow view ci.yml

# List all workflows
gh workflow list

# Run workflow manually
gh workflow run deploy.yml

# View workflow runs
gh run list

# View specific run
gh run view <run-id>

# Download artifacts
gh run download <run-id>
```

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel GitHub Integration](https://vercel.com/docs/git/vercel-for-github)
- [Next.js CI/CD Guide](https://nextjs.org/docs/deployment)
