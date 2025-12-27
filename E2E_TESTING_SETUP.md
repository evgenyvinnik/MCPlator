# E2E Testing Setup Guide

This guide explains how to set up end-to-end testing with Vercel deployment protection for MCPlator.

## Overview

The E2E testing workflow ensures that your app works correctly before deploying to production:

1. When you push code to GitHub, GitHub Actions runs E2E tests
2. Tests verify that the chat functionality works with real LLM calls
3. Vercel waits for these tests to pass before deploying to production
4. If tests fail, deployment is blocked

## Setup Steps

### 1. Add ANTHROPIC_API_KEY to GitHub Secrets

The E2E tests need to make real API calls to Anthropic, so you need to add your API key to GitHub:

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `ANTHROPIC_API_KEY`
5. Value: Your Anthropic API key (same one you have in Vercel)
6. Click **Add secret**

### 2. Configure Vercel Deployment Protection

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

### 3. Test the Setup

1. Create a new branch:
   ```bash
   git checkout -b test-e2e-setup
   ```

2. Make a small change (e.g., add a comment to a file)

3. Commit and push:
   ```bash
   git add .
   git commit -m "Test E2E workflow"
   git push origin test-e2e-setup
   ```

4. Create a Pull Request on GitHub

5. Watch the **Actions** tab to see the E2E tests run

6. Vercel will create a preview deployment but won't deploy to production until tests pass

## What Gets Tested

The E2E tests verify:

1. **Basic Chat Functionality**: Sending "2 plus 2" and receiving an AI response
2. **Multiple Messages**: Handling sequential chat messages correctly
3. **LLM Integration**: Real API calls to Anthropic (not mocked)
4. **Calculator Integration**: AI can trigger calculator operations

## Test Details

- **Location**: `apps/frontend/tests/chat-e2e.spec.ts`
- **Timeout**: 60 seconds per test (allows for LLM response time)
- **Browser**: Chromium only (in CI for speed)
- **Environment**: Uses production build with Vite preview server

## Troubleshooting

### Tests fail with "ANTHROPIC_API_KEY is not set"

- Make sure you added the secret to GitHub (Step 1)
- Check the secret name is exactly `ANTHROPIC_API_KEY` (case-sensitive)

### Tests timeout waiting for AI response

- Check your Anthropic API key is valid
- Ensure you have sufficient API credits
- LLM calls can be slow; 60 second timeout should be enough

### Vercel deploys without waiting for tests

- Make sure you enabled "Wait for checks to pass" in Vercel settings
- Check that your GitHub repository is properly connected to Vercel
- Vercel must have permission to read GitHub Actions status

### Tests pass locally but fail in CI

- Check that `ANTHROPIC_API_KEY` is set in GitHub secrets
- Look at the Playwright report artifact uploaded to the GitHub Actions run
- Ensure the API endpoint `/api/chat` is accessible in the preview build

## Running Tests Locally

```bash
# Run all tests with UI
cd apps/frontend
bun run test:ui

# Run tests headlessly
bun run test

# Run tests in headed mode (see browser)
bun run test:headed
```

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

1. Checks out your code
2. Sets up Bun
3. Installs dependencies
4. Builds packages and frontend
5. Installs Playwright browsers
6. Runs E2E tests with `ANTHROPIC_API_KEY` from secrets
7. Uploads test reports if tests fail

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
