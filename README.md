# MCPlator

MCP + Calculator

A modern React application built with cutting-edge web technologies.

## Tech Stack

- **React 19** - UI library
- **Vite** - Build tool and dev server
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **Zustand** - State management
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Playwright** - End-to-end testing
- **babel-plugin-react-compiler** - React compiler optimization
- **cross-env** - Cross-platform environment variables

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Run ESLint and fix issues
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm test` - Run Playwright tests
- `npm run test:ui` - Run Playwright tests in UI mode
- `npm run test:headed` - Run Playwright tests in headed mode

## Project Structure

```
├── src/
│   ├── App.tsx         # Main application component
│   ├── store.ts        # Zustand state management
│   ├── main.tsx        # Application entry point
│   └── index.css       # Global styles with Tailwind directives
├── tests/              # Playwright E2E tests
├── public/             # Static assets
└── dist/               # Production build output
```

## Features

- ⚡️ Lightning-fast development with Vite HMR
- 🎨 Modern UI with Tailwind CSS
- 🔧 Type-safe development with TypeScript
- 🧪 E2E testing with Playwright
- 📦 Optimized state management with Zustand
- 🚀 React Compiler for automatic optimizations
- 🎯 Comprehensive linting and formatting
- 🌐 Cross-platform compatibility with cross-env
