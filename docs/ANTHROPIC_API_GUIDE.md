# Anthropic API Setup Guide

This guide will walk you through the process of signing up for an Anthropic API account and obtaining an API key for the MCPlator calculator application.

## Prerequisites

Before you begin, you'll need:
- A valid email address
- A payment method (credit card) for API usage

## Step 1: Create an Anthropic Account

1. Visit the [Anthropic Console](https://console.anthropic.com/)
2. Click the **Sign Up** button
3. You can sign up using:
   - **Email and password**, or
   - **Google account**
4. Complete the registration process
5. Verify your email address if prompted

## Step 2: Add Payment Information

Anthropic requires payment information to use the API:

1. Log in to your [Anthropic Console](https://console.anthropic.com/)
2. Navigate to **Settings** or **Billing** in the left sidebar
3. Click **Add Payment Method**
4. Enter your credit card information
5. Review and accept the pricing terms

**Note:** Anthropic offers pay-as-you-go pricing. You only pay for what you use. Check the [Anthropic Pricing page](https://www.anthropic.com/pricing) for current rates.

## Step 3: Generate an API Key

1. In the Anthropic Console, navigate to **API Keys** in the left sidebar
2. Click **Create Key** or **New API Key**
3. Give your key a descriptive name (e.g., "MCPlator Development" or "MCPlator Production")
4. Copy the generated API key immediately
   - **Important:** You won't be able to see the full key again after closing the dialog
   - Store it securely (e.g., in a password manager)

## Step 4: Configure Your API Key

### For Local Development

1. Navigate to your MCPlator project directory
2. Go to the backend directory:
   ```bash
   cd apps/backend
   ```
3. Create a `.env` file (if it doesn't exist):
   ```bash
   cp .env.example .env
   ```
4. Open the `.env` file and add your API key:
   ```
   ANTHROPIC_API_KEY=sk-ant-api03-your-actual-key-here
   ```
5. Save the file

**Security Note:** Never commit your `.env` file to version control. It should already be in `.gitignore`.

### For Vercel Deployment

1. Log in to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your MCPlator project
3. Go to **Settings** → **Environment Variables**
4. Add a new environment variable:
   - **Name:** `ANTHROPIC_API_KEY`
   - **Value:** Your API key (starting with `sk-ant-`)
   - **Environment:** Select all environments (Production, Preview, Development)
5. Click **Save**
6. Redeploy your application for the changes to take effect

## Step 5: Test Your Setup

### Local Testing

1. Make sure your backend is configured with the API key
2. Start the backend server:
   ```bash
   npm run dev:backend
   ```
3. Start the frontend:
   ```bash
   npm run dev
   ```
4. Open your browser to `http://localhost:5173`
5. Try sending a message in the chat interface (e.g., "add 5 and 3")
6. If everything is working, you should see the calculator perform the operation

### Vercel Testing

1. Visit your deployed application URL
2. Try the chat interface
3. Check the Vercel function logs if you encounter any issues

## Local Testing Without API Key (Mock Mode)

If you want to test the UI locally without setting up an Anthropic API key:

1. Create a `.env` file in `apps/backend`:
   ```bash
   cd apps/backend
   cp .env.example .env
   ```
2. Set the mock mode environment variable:
   ```
   USE_MOCK_LLM=true
   ```
3. Start both frontend and backend:
   ```bash
   npm run dev:all
   ```
4. The backend will now use simulated responses instead of calling the Anthropic API

**Note:** Mock mode provides basic pattern matching for simple operations (addition, subtraction, multiplication, division) but doesn't have the full intelligence of the Claude AI model.

## Troubleshooting

### Issue: "API key is invalid"

- Double-check that you copied the entire API key correctly
- Make sure there are no extra spaces or quotes around the key in your `.env` file
- Verify the key exists in your Anthropic Console and hasn't been deleted

### Issue: "Rate limit exceeded"

- You've hit your API usage limits
- Check your Anthropic Console for usage details
- Consider upgrading your plan or waiting for the rate limit to reset

### Issue: "Insufficient balance"

- Add more credits to your Anthropic account
- Check your payment method is valid and has sufficient funds

### Issue: "Backend returns 500 error"

- Check the backend server logs for detailed error messages
- Verify your `.env` file is in the correct location (`apps/backend/.env`)
- Make sure the environment variable is named exactly `ANTHROPIC_API_KEY`

## API Usage and Costs

- The MCPlator app uses the **Claude 3.5 Haiku** model, which is cost-effective for this use case
- Each calculator operation typically uses a small number of tokens
- Monitor your usage in the [Anthropic Console](https://console.anthropic.com/)
- Set up billing alerts to avoid unexpected charges

## Additional Resources

- [Anthropic Documentation](https://docs.anthropic.com/)
- [Anthropic API Reference](https://docs.anthropic.com/claude/reference)
- [Anthropic Pricing](https://www.anthropic.com/pricing)
- [Claude Model Comparison](https://docs.anthropic.com/claude/docs/models-overview)

## Security Best Practices

1. **Never commit API keys to Git**
   - Always use `.env` files for local development
   - Use environment variables for deployment
   
2. **Rotate keys regularly**
   - Consider rotating your API keys periodically
   - Delete old keys from the Anthropic Console
   
3. **Use different keys for different environments**
   - Use separate keys for development, staging, and production
   - This makes it easier to track usage and revoke access if needed
   
4. **Monitor usage**
   - Regularly check your API usage in the Anthropic Console
   - Set up billing alerts to catch unexpected usage spikes

## Need Help?

If you encounter issues not covered in this guide:
- Check the [project issues](https://github.com/evgenyvinnik/MCPlator/issues) on GitHub
- Create a new issue with details about your problem
- Contact Anthropic support for API-specific issues
