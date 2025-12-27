# Deployment Guide

This guide covers deploying the MCPlator calculator application to Vercel after implementing the v2 spec updates.

## Prerequisites

1. Vercel account
2. Anthropic API key (get one at https://console.anthropic.com)
3. Repository connected to Vercel

## Step 1: Configure Environment Variables

In your Vercel project settings, add the following environment variable:

```
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

This is required for the backend API to communicate with Claude.

## Step 2: Vercel Configuration

The repository already includes a `vercel.json` file with the correct configuration:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "apps/frontend/dist",
  "framework": "vite",
  "rewrites": [{ "source": "/api/:path*", "destination": "/api/:path*" }],
  "functions": {
    "apps/backend/api/*.ts": {
      "runtime": "@vercel/node@3"
    }
  }
}
```

This configuration:

- Builds the monorepo correctly
- Serves the frontend from the correct directory
- Routes API calls to the backend
- Uses Edge runtime for SSE support

## Step 3: Deploy

### Option A: Automatic Deployment (Recommended)

Push your changes to GitHub and Vercel will automatically deploy:

```bash
git push origin main
```

### Option B: Manual Deployment

Deploy using the Vercel CLI:

```bash
npm install -g vercel
vercel --prod
```

## Step 4: Verify Deployment

1. Visit your deployed URL
2. Open the chat panel
3. Send a message like "add 2 plus 3"
4. Verify:
   - The message appears immediately
   - The response streams in token-by-token
   - Calculator keys animate
   - The result displays on the calculator

## Local Development

### With Bun (Recommended)

If you have Bun installed:

```bash
# Terminal 1: Backend
npm run dev:backend

# Terminal 2: Frontend
npm run dev
```

### With Node.js

For local development, you can use Vercel CLI:

```bash
# Terminal 1: Backend
cd apps/backend && vercel dev

# Terminal 2: Frontend
npm run dev
```

## Environment Setup for Local Development

### Backend (`apps/backend/.env`)

```bash
ANTHROPIC_API_KEY=sk-ant-your-key-here
PORT=3001
```

### Frontend (`apps/frontend/.env`)

```bash
# Only needed if backend is running on a different port
VITE_API_URL=http://localhost:3001
```

## Monitoring

### API Usage

Monitor your Anthropic API usage at https://console.anthropic.com

The application uses:

- Model: `claude-3-5-haiku-20241022`
- Max tokens: 1024 per request
- Pricing: ~$0.25 per 1M input tokens, ~$1.25 per 1M output tokens

### Quota System

The app includes a client-side quota system (IndexedDB):

- Default limit: 100 calls per day per browser
- Resets daily at midnight (user's local time)
- Adjust in `apps/frontend/src/db/quotaDB.ts` if needed

## Troubleshooting

### SSE Not Working

**Symptoms**: No streaming, messages appear all at once

**Solutions**:

1. Verify Edge runtime is configured in `vercel.json`
2. Check browser console for errors
3. Verify `ANTHROPIC_API_KEY` is set in Vercel environment

### IndexedDB Issues

**Symptoms**: Settings/history not persisting

**Solutions**:

1. IndexedDB not available in private/incognito mode
2. Check browser console for quota exceeded errors
3. Clear browser data and try again

### Build Failures

**Symptoms**: Deployment fails during build

**Solutions**:

1. Verify all workspaces have build scripts
2. Check TypeScript compilation: `npm run build`
3. Review Vercel build logs for specific errors

### Rate Limiting

**Symptoms**: "Reached quota" message too frequently

**Solutions**:

1. Adjust `DEFAULT_LIMIT` in `apps/frontend/src/db/quotaDB.ts`
2. Implement server-side rate limiting
3. Add authentication for user-specific quotas

## Cost Management

### Anthropic Console

1. Set monthly spending limit at https://console.anthropic.com
2. Recommended initial limit: $10/month
3. Monitor usage regularly

### Estimated Costs

Based on typical usage:

- ~1,000 tokens per conversation (prompt + response)
- ~$0.001 per conversation
- 100 conversations per day = ~$3/month
- 1,000 conversations per day = ~$30/month

## Security Considerations

1. **API Key Security**: Never commit API keys to version control
2. **Rate Limiting**: Client-side quota is advisory only, implement server-side limits for production
3. **CORS**: API routes are same-origin, no CORS issues
4. **SSE Security**: Connections are HTTPS in production

## Production Checklist

- [ ] `ANTHROPIC_API_KEY` set in Vercel environment
- [ ] Spending limits configured in Anthropic console
- [ ] Custom domain configured (optional)
- [ ] Error tracking setup (Sentry, etc.)
- [ ] Analytics configured (optional)
- [ ] Monitor initial usage and adjust quotas
- [ ] Test SSE streaming in production
- [ ] Verify IndexedDB persistence works
- [ ] Test calculator animations
- [ ] Check mobile responsiveness

## Rollback Plan

If issues occur after deployment:

1. Revert to previous commit:

   ```bash
   git revert HEAD
   git push
   ```

2. Or redeploy previous version in Vercel dashboard

3. Previous version used:
   - OpenAI instead of Anthropic
   - REST API instead of SSE
   - localStorage instead of IndexedDB

## Support

For issues specific to this implementation:

1. Check `IMPLEMENTATION_SUMMARY.md`
2. Review Vercel deployment logs
3. Check browser console for client-side errors
4. Review Anthropic API logs

For general deployment issues:

- Vercel Documentation: https://vercel.com/docs
- Anthropic Documentation: https://docs.anthropic.com
