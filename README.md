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

## Tech Stack

### Frontend (`apps/frontend`)
- **Framework:** React + TypeScript
- **Build:** Vite
- **State management:** Zustand + `persist` middleware
- **Styling:** Tailwind CSS

### Backend (`apps/backend`)
- **Platform:** Vercel Serverless Functions
- **Runtime:** Node.js
- **AI:** OpenAI API (using Tools)

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

Start the frontend development server:

```bash
npm run dev
```

This runs `npm run dev -w apps/frontend`.

### Environment Variables

For the backend to work (LLM features), you need to set up your OpenAI API key.

Create a `.env` file in `apps/backend` (or set in Vercel dashboard):

```
OPENAI_API_KEY=sk-...
```

## Scripts

- `npm run dev` - Start frontend dev server
- `npm run build` - Build all workspaces
- `npm run test` - Run tests across workspaces
