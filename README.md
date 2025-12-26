# MCPlator - Retro Calculator with AI Co-Pilot

A fully functional retro Casio-style calculator with an LLM-powered AI assistant. Features a polished retro UI with authentic animations and natural language calculator control.

## Project Summary

- **Authentic Casio calculator** with complete functionality (memory, percentage, square root, sign change, etc.)
- **Polished retro UI** built with CSS Modules featuring authentic 3D button effects and LCD display
- **LLM-powered AI chat** that:
  - Understands natural language ("add 2 plus one hundred", "what's 15% of 80", "square root of 144")
  - Translates requests into calculator key sequences
  - Animates key presses on the calculator display in real-time
- **Persistent state** stored in IndexedDB (calculator memory, chat history, daily quota)

### Deployment

For detailed, step-by-step deployment instructions, please refer to [BUILD.md](./BUILD.md).

### Quick Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fevgenyvinnik%2FMCPlator&project-name=mcplator&repository-name=mcplator&root-directory=apps%2Ffrontend)

**Note:** When deploying, ensure you set the **Root Directory** to `apps/frontend`.

## Tech Stack

### Frontend (`apps/frontend`)
- **Framework:** React 19 + TypeScript 5.9
- **Build:** Vite 7.2
- **State management:** Zustand + IndexedDB (manual persistence)
- **Styling:** CSS Modules + Tailwind CSS 4.1 (hybrid approach)
- **Storage:** IndexedDB (via `idb` library)
- **Streaming:** Native `fetch` API for SSE

### Backend (`apps/backend`)
- **Platform:** Vercel Edge Functions (for SSE support)
- **Runtime:** Edge Runtime (production) / Bun (local dev)
- **AI:** Anthropic Claude API (Claude 3.5 Haiku model)
- **Streaming:** Server-Sent Events (SSE) for real-time token streaming

### Shared (`packages/`)
- **Monorepo:** Bun workspaces
- **shared-types:** Common TypeScript definitions (KeyId, ChatMessage, SSE types)
- **calculator-engine:** Complete Casio-style calculator logic (86 tests, 100% passing)

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
