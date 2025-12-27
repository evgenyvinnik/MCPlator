# Build and Deployment Guide

This document provides detailed, step-by-step instructions on how to deploy the MCPlator application to Vercel.

## Prerequisites

Before you begin, ensure you have the following:

1.  **GitHub Account**: You need a GitHub account to fork the repository. If you don't have one, sign up at [github.com](https://github.com).
2.  **Vercel Account**: You need a Vercel account to deploy the application. You can sign up at [vercel.com](https://vercel.com) using your GitHub account.

## Step 1: Fork the Repository

1.  Navigate to the [MCPlator GitHub repository](https://github.com/evgenyvinnik/MCPlator).
2.  Click the **Fork** button in the top-right corner of the page.
3.  Select your GitHub account as the owner.
4.  Click **Create fork**.

## Step 2: Deploy to Vercel

You can deploy the application using the Vercel Dashboard (recommended for beginners) or the Vercel CLI.

### Option A: Using the Vercel Dashboard (GUI)

1.  Log in to your [Vercel Dashboard](https://vercel.com/dashboard).
2.  Click the **Add New...** button and select **Project**.
3.  In the "Import Git Repository" section, you should see your forked `MCPlator` repository. Click **Import**.
4.  **Configure Project**:
    - **Project Name**: You can leave this as is or change it to something else (e.g., `my-mcplator`).
    - **Framework Preset**: Vercel should automatically detect **Vite**. If not, select **Vite** from the dropdown.
    - **Root Directory**: Click **Edit** next to Root Directory and select `apps/frontend`. This is crucial because the main application lives in this subdirectory.
5.  **Build and Output Settings**:
    - **Build Command**: `npm run build` (Default)
    - **Output Directory**: `dist` (Default)
    - **Install Command**: `npm install` (Default)
    - _Note: Since we selected the Root Directory as `apps/frontend`, these defaults should work correctly for that specific workspace._
6.  **Environment Variables**:
    - **Important:** To enable the AI-powered chat features, you need to add your Anthropic API key. See [ANTHROPIC_API_GUIDE.md](./ANTHROPIC_API_GUIDE.md) for detailed instructions on obtaining an API key.
    - Expand the **Environment Variables** section and add:
      - **Name:** `ANTHROPIC_API_KEY`
      - **Value:** Your Anthropic API key (starts with `sk-ant-`)
    - Without this API key, the calculator will work but the AI chat feature will not function.
7.  Click **Deploy**.

Vercel will now build and deploy your application. This process may take a minute or two. Once complete, you will see a "Congratulations!" screen with a screenshot of your app and a button to **Visit** your live site.

### Option B: Using the Vercel CLI

If you prefer using the command line:

1.  Install Vercel CLI globally:
    ```bash
    npm i -g vercel
    ```
2.  Open your terminal and navigate to the project directory:
    ```bash
    cd MCPlator
    ```
3.  Run the deploy command:
    ```bash
    vercel
    ```
4.  Follow the prompts:
    - Set up and deploy? **Y**
    - Which scope do you want to deploy to? (Select your account)
    - Link to existing project? **N**
    - What’s your project’s name? (Press Enter)
    - In which directory is your code located? **apps/frontend** (Important: Type `apps/frontend` instead of `./`)
    - Want to modify these settings? **N**
5.  Add your Anthropic API key:
    ```bash
    vercel env add ANTHROPIC_API_KEY
    ```

    - When prompted, enter your Anthropic API key
    - Select all environments (production, preview, development)
    - See [ANTHROPIC_API_GUIDE.md](./ANTHROPIC_API_GUIDE.md) for instructions on obtaining an API key
6.  Wait for the deployment to complete. You will get a Production URL.

## Troubleshooting

### Build Failures

If the build fails, check the logs in the Vercel Dashboard. Common issues include:

- **Incorrect Root Directory**: Ensure you set the Root Directory to `apps/frontend`.
- **Missing Dependencies**: Ensure `package.json` in `apps/frontend` lists all necessary dependencies.

### 404 Errors

If you see a 404 error after deployment:

- Verify that the **Output Directory** is set to `dist`.
- Ensure that your `vite.config.ts` does not have a `base` path set that conflicts with the root domain.

### AI Chat Not Working

If the calculator loads but the chat feature doesn't work:

- Verify you've added the `ANTHROPIC_API_KEY` environment variable in Vercel.
- Check the Vercel function logs for error messages.
- Ensure your API key is valid and has sufficient credits.
- See [ANTHROPIC_API_GUIDE.md](./ANTHROPIC_API_GUIDE.md) for detailed troubleshooting.
