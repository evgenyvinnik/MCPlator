# Casio LLM Calculator

A web-based emulation of a Casio-style calculator with a pixel-ish accurate UI and an LLM-powered chat interface that can drive the calculator.

## Project Summary

- **Pixel-ish accurate UI** (buttons, LCD, indicators).
- **Real calculator behavior** implemented in a **frontend engine** (JS/TS).
- **LLM-powered chat** that:
  - Understands natural language ("add 2 plus one hundred").
  - Produces calculator key sequences.
  - The frontend replays those key sequences visually on the calculator.
- **State stored in the browser** (localStorage).

### Deployment

For detailed, step-by-step deployment instructions, please refer to [BUILD.md](./BUILD.md).

### Quick Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fevgenyvinnik%2FMCPlator&project-name=mcplator&repository-name=mcplator&root-directory=apps%2Ffrontend)

**Note:** When deploying, ensure you set the **Root Directory** to `apps/frontend`.

## Tech Stack

### Frontend (`apps/frontend`)
- **Framework:** React + TypeScript
- **Build:** Vite
- **State management:** Zustand + IndexedDB (manual persistence)
- **Styling:** Tailwind CSS
- **Storage:** IndexedDB (via `idb` library)
- **Streaming:** Native `fetch` API for SSE

### Backend (`apps/backend`)
- **Platform:** Vercel Edge Functions (for SSE support)
- **Runtime:** Edge Runtime / Bun (local dev)
- **AI:** Anthropic Claude API (Haiku model)
- **Streaming:** Server-Sent Events (SSE)

### Shared (`packages/`)
- **Monorepo:** npm workspaces
- **shared-types:** Common TypeScript definitions
- **calculator-engine:** Core calculator logic shared between frontend and backend

## Project Structure

```text
calculator-casio-llm/
  packages/
    shared-types/       # Shared TS types
    calculator-engine/  # Canonical calculator logic
  apps/
    frontend/           # React application
    backend/            # Vercel API routes
```

## Getting Started

### Prerequisites
- Node.js 18+
- npm

### Installation

```bash
npm install
```

### Development

**Quick Start - Test Locally Without API Key:**

For detailed local testing instructions including mock mode, see [LOCAL_TESTING.md](./LOCAL_TESTING.md).

**Frontend only:**
```bash
npm run dev
```

**Backend only:**
```bash
npm run dev:backend
```

**Both frontend and backend:**
```bash
npm run dev:all
```

The frontend runs on `http://localhost:5173` and the backend dev server on `http://localhost:3001`.

### Environment Variables

For the backend to work (LLM features), you need to set up your Anthropic API key.

**For detailed instructions on getting an Anthropic API key, see [ANTHROPIC_API_GUIDE.md](./ANTHROPIC_API_GUIDE.md).**

Create a `.env` file in `apps/backend` (or set in Vercel dashboard):

```
ANTHROPIC_API_KEY=sk-ant-...
```

#### Local Testing Without API Key

You can test the UI locally without an Anthropic API key by using mock mode:

```
USE_MOCK_LLM=true
```

This simulates LLM responses for basic calculator operations (addition, subtraction, multiplication, division) without calling the Anthropic API. See [ANTHROPIC_API_GUIDE.md](./ANTHROPIC_API_GUIDE.md) for more details.

See `.env.example` files in `apps/backend` and `apps/frontend` for more details.

## Scripts

- `npm run dev` - Start frontend dev server
- `npm run build` - Build all workspaces
- `npm run test` - Run tests across workspaces
