# E2E Testing Setup Guide

This guide explains how to set up end-to-end testing for MCPlator deployments on Vercel.

## Overview

The E2E testing workflow ensures that your app works correctly after each deployment:

1. You push code to GitHub
2. Vercel automatically creates a deployment
3. When the deployment succeeds, GitHub Actions runs E2E tests against the live deployment URL
4. Tests verify that the chat functionality works with real LLM calls
5. You check the GitHub Actions tab to see if tests passed
6. If tests are green ✅ → Safe to use/promote
7. If tests are red ❌ → Check the logs to see what broke

This approach tests your **actual deployed code** on Vercel's infrastructure, not a local simulation.

## Important: Vercel Hobby Plan Limitation

**Automatic deployment blocking** (where Vercel waits for tests before deploying) requires a **Vercel Pro plan** ($20/month).

On the **Hobby (free) plan**, tests run automatically after each deployment, but you need to **manually check** the GitHub Actions tab to verify tests passed before promoting deployments to production.

This setup still provides excellent protection - you just need to check the test results yourself rather than having Vercel block deployments automatically.

## Setup Steps

### 1. Verify ANTHROPIC_API_KEY in Vercel

Since the tests run against the Vercel preview deployment, the API key needs to be in Vercel's environment variables (not GitHub):

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Verify `ANTHROPIC_API_KEY` exists and is set for **Preview** environments (not just Production)
4. If not present, add it:
   - Name: `ANTHROPIC_API_KEY`
   - Value: Your Anthropic API key
   - Environments: Check **Preview** and **Production**

**Note:** You already have this configured since your app is deployed, but make sure it's enabled for Preview environments!

### 2. Configure Vercel Protection Bypass for Automation

If your preview deployments have Vercel Authentication or Deployment Protection enabled, E2E tests will fail because they can't access the login-protected preview URLs. You need to configure the "Protection Bypass for Automation" feature.

1. Go to your Vercel project dashboard
2. Click **Settings** → **Deployment Protection**
3. Find **"Protection Bypass for Automation"**
4. **Enable** the toggle
5. **Copy the secret token** that appears (looks like: `x-vercel-protection-bypass: your-secret-here`)
6. Click **Save**

Now add this secret to GitHub:

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**
4. Name: `VERCEL_AUTOMATION_BYPASS_SECRET`
5. Value: Paste the token from Vercel (just the token value, not the header name)
6. Click **Add secret**

This allows GitHub Actions to bypass Vercel's authentication and run E2E tests against protected preview deployments.

### 3. Configure Vercel Deployment Protection (Optional)

Configure Vercel to wait for GitHub Actions checks before deploying:

#### Option A: Using Vercel Dashboard (Recommended)

1. Go to your Vercel project dashboard
2. Click **Settings** → **Git**
3. Scroll to **Deploy Hooks** section
4. Under **Deployment Protection**, enable:
   - ✅ **Wait for checks to pass before deploying**
5. Click **Save**

#### Option B: Using vercel.json (Alternative)

Add this to your `vercel.json`:

```json
{
  "buildCommand": "cd apps/frontend && bun run build",
  "outputDirectory": "apps/frontend/dist",
  "installCommand": "bun install",
  "framework": "vite",
  "github": {
    "enabled": true,
    "autoJobCancelation": true,
    "silent": false
  }
}
```

### 4. Test the Setup

1. Make sure `ANTHROPIC_API_KEY` is set in Vercel for Preview environments (check step 1)
2. Make sure `VERCEL_AUTOMATION_BYPASS_SECRET` is set in GitHub Actions secrets (check step 2)

3. Push your changes:
   ```bash
   git add .
   git commit -m "Add E2E testing for Vercel deployments"
   git push
   ```

4. Watch what happens:
   - Vercel creates a preview deployment
   - Once deployment succeeds, GitHub Actions automatically runs E2E tests
   - Check the **Actions** tab on GitHub to see test results

5. If tests pass, you're all set! If they fail, check the troubleshooting section below.

## What Gets Tested

The E2E tests verify:

1. **Basic Chat Functionality**: Sending "2 plus 2" and receiving an AI response
2. **Multiple Messages**: Handling sequential chat messages correctly
3. **LLM Integration**: Real API calls to Anthropic (not mocked)
4. **Calculator Integration**: AI can trigger calculator operations
5. **Full Deployment Stack**: Tests run against the actual Vercel deployment, including edge functions, routing, and environment variables

## Test Details

- **Location**: `apps/frontend/tests/chat-e2e.spec.ts`
- **Timeout**: 60 seconds per test (allows for LLM response time)
- **Browser**: Chromium only (in CI for speed)
- **Environment**: Actual Vercel preview deployment (tests real production build)

## Troubleshooting

### Tests timeout waiting for AI response

- Check your Anthropic API key is valid in Vercel settings
- Ensure you have sufficient API credits
- LLM calls can be slow; 60 second timeout should be enough
- Verify the API key is enabled for Preview environments in Vercel

### Vercel deploys without waiting for tests

- Make sure you enabled "Wait for checks to pass" in Vercel settings
- Check that your GitHub repository is properly connected to Vercel
- Vercel must have permission to read GitHub Actions status

### Tests pass locally but fail in CI

- Verify the Vercel preview deployment succeeded before tests ran
- Check that the preview URL is accessible
- Look at the Playwright report artifact uploaded to the GitHub Actions run
- Ensure `ANTHROPIC_API_KEY` is set in Vercel for Preview environments

### Workflow doesn't trigger after deployment

- Verify that GitHub has permission to receive deployment events from Vercel
- Check that your repo is properly connected to Vercel
- Look for the `deployment_status` event in the GitHub Actions tab
- Ensure the workflow file is on the `main` branch

### Tests fail with API errors (401, 403, or LLM errors)

- **Primary cause:** `ANTHROPIC_API_KEY` not set correctly in Vercel
- Go to Vercel project → **Settings** → **Environment Variables**
- Verify `ANTHROPIC_API_KEY` is enabled for **Preview** environments (not just Production)
- After adding/updating, you need to redeploy for changes to take effect

## Running Tests Locally

You can run E2E tests locally for development and debugging:

1. Start the dev server (Terminal 1):
   ```bash
   npm run dev
   ```

2. Run tests (Terminal 2):
   ```bash
   npm run test:e2e
   ```

### Options

- **UI Mode** (interactive debugging): `npm run test:e2e:ui`
- **Against Live Deployment**: `PLAYWRIGHT_TEST_BASE_URL=https://your-preview.vercel.app npm run test:e2e`

**Note:** Local tests run against the dev server without API functions. For full API testing, run tests against an actual Vercel deployment URL.

## Cost Considerations

Each test run makes 1-2 real API calls to Anthropic. Estimated cost:

- ~$0.01 per test run (depends on your Anthropic pricing tier)
- Runs on: every push to `main` and every pull request
- Consider limiting to pull requests only if cost is a concern

To run only on pull requests, edit `.github/workflows/e2e-tests.yml`:

```yaml
on:
  pull_request:
    branches: [main]
  # Remove the 'push' section
```

## Workflow Configuration

The GitHub Actions workflow (`.github/workflows/e2e-tests.yml`) does:

1. **Triggers** when Vercel deployment succeeds (`deployment_status` event)
2. **Checks** that it's a preview deployment (not production)
3. **Checks out** your code
4. **Sets up** Bun runtime
5. **Installs** dependencies and Playwright browsers
6. **Runs E2E tests** against the Vercel preview URL (passed via `PLAYWRIGHT_TEST_BASE_URL`)
7. **Uploads** test reports if tests fail

The key difference from standard CI: Tests run **after** Vercel creates the preview deployment, testing the actual deployed code on Vercel's infrastructure.

**Important:** The tests make HTTP requests to the Vercel preview deployment, which uses Vercel's environment variables (including `ANTHROPIC_API_KEY`). No secrets need to be configured in GitHub for the API calls to work.

## Next Steps

After setup is complete:

1. ✅ All future PRs will automatically run E2E tests
2. ✅ Vercel will only deploy when tests pass
3. ✅ You'll get immediate feedback if changes break chat functionality
4. ✅ Production deploys are protected from broken builds

## Questions?

- Check GitHub Actions logs for detailed test output
- Review Playwright reports (uploaded as artifacts when tests fail)
- Test locally first before pushing to catch issues early

## References

This setup follows Vercel's official recommendations:
- [How can I run end-to-end tests after my Vercel Preview Deployment?](https://vercel.com/kb/guide/how-can-i-run-end-to-end-tests-after-my-vercel-preview-deployment)
