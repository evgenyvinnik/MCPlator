# Local Testing Guide

This guide explains how to test the MCPlator application locally on your machine, including options for testing without an Anthropic API key.

## Quick Start (Mock Mode - No API Key Required)

If you want to test the UI and basic functionality without setting up an Anthropic API account:

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Set Up Mock Mode

Create a `.env` file in the `apps/backend` directory:

```bash
cd apps/backend
cp .env.example .env
```

Edit the `.env` file and set:

```
USE_MOCK_LLM=true
PORT=3001
```

### Step 3: Start Both Frontend and Backend

From the project root:

```bash
npm run dev:all
```

Or start them separately in different terminals:

**Terminal 1 - Backend:**

```bash
npm run dev:backend
```

**Terminal 2 - Frontend:**

```bash
npm run dev
```

### Step 4: Test the Application

1. Open your browser to `http://localhost:5173`
2. Try the following test commands in the chat:
   - "add 5 and 3"
   - "multiply 12 by 4"
   - "subtract 7 from 20"
   - "divide 100 by 5"
   - "clear"

The mock mode recognizes these patterns and generates appropriate calculator key sequences.

## Full Mode (With Anthropic API)

To test with the real AI functionality:

### Step 1: Get an Anthropic API Key

Follow the instructions in [ANTHROPIC_API_GUIDE.md](./ANTHROPIC_API_GUIDE.md) to:

1. Create an Anthropic account
2. Add payment information
3. Generate an API key

### Step 2: Configure Your API Key

Create a `.env` file in the `apps/backend` directory:

```bash
cd apps/backend
cp .env.example .env
```

Edit the `.env` file:

```
ANTHROPIC_API_KEY=sk-ant-your-actual-key-here
USE_MOCK_LLM=false
PORT=3001
```

### Step 3: Start the Application

```bash
npm run dev:all
```

### Step 4: Test with Real AI

The AI can handle more complex requests like:

- "What is 15% of 200?"
- "Calculate the square of 12" (12 \* 12)
- "I need to add these numbers: 45, 23, and 17"
- Natural language math queries

## Mock Mode vs. Full Mode

### Mock Mode (USE_MOCK_LLM=true)

**Pros:**

- ✓ No API key required
- ✓ No costs
- ✓ Fast responses
- ✓ Works offline
- ✓ Perfect for UI testing

**Cons:**

- ✗ Limited pattern matching (only recognizes basic operations)
- ✗ Cannot handle complex queries
- ✗ No natural language understanding beyond simple patterns
- ✗ Cannot handle word numbers (though basic ones are supported)

**Supported Operations:**

- Addition: "add X and Y", "X plus Y", "sum of X and Y"
- Subtraction: "subtract Y from X", "X minus Y"
- Multiplication: "multiply X by Y", "X times Y"
- Division: "divide X by Y", "X divided by Y"
- Clear: "clear", "reset", "ac"
- Percentage: "X percent"

### Full Mode (USE_MOCK_LLM=false)

**Pros:**

- ✓ Full AI understanding
- ✓ Handles complex queries
- ✓ Natural language processing
- ✓ Can explain results
- ✓ Better error handling

**Cons:**

- ✗ Requires API key setup
- ✗ Costs money (pay per use)
- ✗ Requires internet connection
- ✗ Slower response times

## Troubleshooting

### Port Already in Use

If you see an error like "Port 3001 already in use":

```bash
# Find and kill the process using port 3001
lsof -ti:3001 | xargs kill -9

# Or use a different port
PORT=3002 npm run dev:backend
```

### Frontend Can't Connect to Backend

1. Verify the backend is running on `http://localhost:3001`
2. Check the Vite proxy configuration in `apps/frontend/vite.config.ts`
3. Make sure both servers are running

### Mock Mode Not Working

1. Verify the `.env` file exists in `apps/backend`
2. Check that `USE_MOCK_LLM=true` (not `"true"` or `True`)
3. Restart the backend server after changing `.env`
4. Check the backend console - it should say "Mode: MOCK LLM (no API key needed)"

### Real API Not Working

See [ANTHROPIC_API_GUIDE.md](./ANTHROPIC_API_GUIDE.md) for detailed troubleshooting of API issues.

## Development Workflow

### Recommended Setup for UI Development

1. Use mock mode (`USE_MOCK_LLM=true`)
2. Start both servers with `npm run dev:all`
3. Make changes to the frontend
4. Vite will hot-reload your changes
5. Test calculator operations with simple commands

### Recommended Setup for Backend Development

1. Use real API mode (`USE_MOCK_LLM=false`)
2. Start backend with `npm run dev:backend`
3. Start frontend with `npm run dev`
4. Make changes to backend code
5. Bun will auto-restart the server (if available)

### Testing Both Modes

Create two `.env` files:

**.env.mock**

```
USE_MOCK_LLM=true
PORT=3001
```

**.env.production**

```
ANTHROPIC_API_KEY=sk-ant-xxx
USE_MOCK_LLM=false
PORT=3001
```

Switch between them:

```bash
cd apps/backend
cp .env.mock .env    # Use mock mode
# or
cp .env.production .env  # Use real API
```

## Running Tests

```bash
# Run all tests
npm test

# Run frontend tests only
cd apps/frontend
npm test

# Run tests in UI mode
cd apps/frontend
npm run test:ui
```

## Building for Production

```bash
# Build all packages
npm run build

# Check for TypeScript errors
npm run build
```

## Need Help?

- For API issues: See [ANTHROPIC_API_GUIDE.md](./ANTHROPIC_API_GUIDE.md)
- For deployment: See [BUILD.md](./BUILD.md)
- For general issues: Check the [GitHub issues](https://github.com/evgenyvinnik/MCPlator/issues)
