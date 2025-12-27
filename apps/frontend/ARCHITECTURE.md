# Frontend Architecture Documentation

This document describes the architecture of the MCPlator frontend application, including component interactions, data flow, and design patterns.

## Overview

MCPlator is an AI-powered calculator application styled after the Casio SL-300SV. The frontend is built with React 19, TypeScript, and uses Zustand for state management with IndexedDB for persistence.

## Directory Structure

```
src/
├── main.tsx                    # React app entry point
├── App.tsx                     # Root component with layout
├── components/
│   ├── RetroCalculator.tsx     # Main calculator wrapper
│   ├── RetroScreen.tsx         # LCD display with indicators
│   ├── RetroKeypad.tsx         # Button grid with animations
│   ├── AIChatPanel.tsx         # Chat UI for AI interaction
│   └── ui/                     # Reusable UI primitives
│       ├── button.tsx          # CVA-based Button component
│       ├── card.tsx            # Composable Card components
│       ├── input.tsx           # Styled Input component
│       └── utils.ts            # cn() utility function
├── state/
│   ├── useCalculatorStore.ts   # Calculator state (Zustand)
│   └── useChatStore.ts         # Chat state (Zustand)
├── hooks/
│   └── useAnimationRunner.ts   # Animation sequence executor
├── api/
│   ├── useStreamingChat.ts     # SSE streaming hook
│   └── sseClient.ts            # SSE parser
├── db/
│   ├── indexedDB.ts            # Database schema
│   ├── chatDB.ts               # Chat message persistence
│   └── quotaDB.ts              # API quota management
└── assets/                     # Images, fonts, icons
```

## Component Hierarchy

```
App
├── RetroCalculator
│   ├── RetroScreen
│   └── RetroKeypad
└── AIChatPanel
    ├── Card (messages)
    └── Button (send)
```

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            USER INTERACTION                              │
└─────────────────────────────────────────────────────────────────────────┘
                │                                    │
                ▼                                    ▼
┌───────────────────────────┐        ┌───────────────────────────────────┐
│     RetroKeypad           │        │        AIChatPanel                │
│  (Button Click)           │        │     (Message Input)               │
└───────────────┬───────────┘        └───────────────┬───────────────────┘
                │                                    │
                ▼                                    ▼
┌───────────────────────────┐        ┌───────────────────────────────────┐
│   RetroCalculator         │        │     useStreamingChat              │
│   handleClick()           │        │     sendChat()                    │
│   - Map key to KeyId      │        │     - Check quota                 │
│   - Handle power buttons  │        │     - Add user message            │
└───────────────┬───────────┘        │     - Start SSE stream            │
                │                    └───────────────┬───────────────────┘
                ▼                                    │
┌───────────────────────────┐                        │
│   useCalculatorStore      │                        │
│   pressKey(keyId)         │                        ▼
│   - Calculate new state   │        ┌───────────────────────────────────┐
│   - Persist to IndexedDB  │        │     sseClient.streamChat()        │
└───────────────┬───────────┘        │     - POST /api/chat              │
                │                    │     - Parse SSE events            │
                │                    └───────────────┬───────────────────┘
                │                                    │
                │              ┌─────────────────────┴───────────────────┐
                │              │                     │                   │
                │              ▼                     ▼                   ▼
                │      ┌─────────────┐      ┌─────────────┐     ┌─────────────┐
                │      │ onToken     │      │ onKeys      │     │ onDone      │
                │      │ (streaming) │      │ (animate)   │     │ (complete)  │
                │      └──────┬──────┘      └──────┬──────┘     └──────┬──────┘
                │             │                    │                   │
                │             ▼                    ▼                   ▼
                │      ┌─────────────────┐  ┌───────────────┐  ┌─────────────────┐
                │      │ useChatStore    │  │ enqueue      │  │ useChatStore    │
                │      │ updateStreaming │  │ Animation    │  │ addMessage      │
                │      └─────────────────┘  └───────┬───────┘  └─────────────────┘
                │                                   │
                │                                   ▼
                │                    ┌───────────────────────────────────┐
                │                    │     useAnimationRunner            │
                │                    │     - Process animation queue     │
                │                    │     - Visual button press         │
                │                    │     - Execute calculator logic    │
                │                    └───────────────┬───────────────────┘
                │                                    │
                │◄───────────────────────────────────┘
                │                    (calls pressKey for each animation command)
                │
                ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                         RetroScreen                                        │
│                    (Displays calculator value)                             │
└───────────────────────────────────────────────────────────────────────────┘
```

## State Management

### useCalculatorStore (Zustand)

Manages the calculator's computational state:

| State Field | Type | Description |
|-------------|------|-------------|
| `internalState` | `CalculatorInternalState` | Engine internal state |
| `display` | `CalculatorDisplay` | Current display value + indicators |
| `pressedKey` | `KeyId \| null` | Currently pressed key (for animations) |
| `isAnimating` | `boolean` | Whether animation is running |
| `animationQueue` | `AnimationSequence[]` | Pending AI animations |
| `animationCallbacks` | `Map` | Callbacks for animation completion |
| `isHydrated` | `boolean` | Whether state loaded from IndexedDB |
| `shouldFlash` | `boolean` | Trigger flash on digit limit |

Key Actions:
- `pressKey(keyId)`: Process key press, persist to DB
- `enqueueAnimation(sequence, callback)`: Add AI animation
- `hydrate()`: Load state from IndexedDB

### useChatStore (Zustand)

Manages chat conversation state:

| State Field | Type | Description |
|-------------|------|-------------|
| `messages` | `ChatMessage[]` | Complete message history |
| `streamingMessage` | `{id, text} \| null` | Currently streaming response |
| `isThinking` | `boolean` | AI processing indicator |
| `isHydrated` | `boolean` | Whether messages loaded from DB |

Key Actions:
- `addMessage(msg)`: Add and persist message
- `updateStreamingMessage(id, text)`: Update streaming content
- `hydrate()`: Load messages from IndexedDB

## Database Schema (IndexedDB)

Database: `casio-calculator-v2`

### Object Stores

```
┌─────────────────────────────────────────────────────────────┐
│ calculator-state                                             │
├─────────────────────────────────────────────────────────────┤
│ key: 'current'                                               │
│ value: { id, state, display, updatedAt }                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ chat-messages                                                │
├─────────────────────────────────────────────────────────────┤
│ key: string (message ID)                                     │
│ value: ChatMessage                                           │
│ index: 'by-created' → createdAt                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ quota                                                        │
├─────────────────────────────────────────────────────────────┤
│ key: 'daily'                                                 │
│ value: { id, date, callsUsed, dailyLimit }                  │
└─────────────────────────────────────────────────────────────┘
```

## API Communication

### SSE (Server-Sent Events) Flow

```
Frontend                            Backend
   │                                   │
   │  POST /api/chat                   │
   │  { message, history }             │
   │ ─────────────────────────────────►│
   │                                   │
   │  event: token                     │
   │  data: {"token": "I"}             │
   │ ◄─────────────────────────────────│
   │                                   │
   │  event: token                     │
   │  data: {"token": " will"}         │
   │ ◄─────────────────────────────────│
   │                                   │
   │  event: keys                      │
   │  data: {"keys": ["digit_5"...]}   │
   │ ◄─────────────────────────────────│
   │                                   │
   │  event: done                      │
   │  data: {"fullText": "..."}        │
   │ ◄─────────────────────────────────│
   │                                   │
```

### Event Types

| Event | Payload | Purpose |
|-------|---------|---------|
| `token` | `{token: string}` | Streaming text chunk |
| `keys` | `{keys: string[]}` | Calculator key sequence |
| `done` | `{messageId, fullText}` | Final complete message |
| `error` | `{error: string}` | Error message |

## Animation System

### Animation Flow

```
AI Response with keys
        │
        ▼
┌───────────────────┐
│ enqueueAnimation  │
│ (add to queue)    │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│useAnimationRunner │
│ (watch queue)     │
└─────────┬─────────┘
          │
          ▼
    ┌─────────────┐
    │ For each    │
    │ command:    │
    └──────┬──────┘
           │
     ┌─────┴─────┐
     │           │
     ▼           ▼
┌─────────┐  ┌─────────┐
│pressKey │  │ sleep   │
│command  │  │command  │
└────┬────┘  └─────────┘
     │
     ▼
┌──────────────────┐
│ setPressedKey()  │
│ (visual feedback)│
└─────────┬────────┘
          │
          ▼
┌──────────────────┐
│ RetroKeypad      │
│ animates button  │
└─────────┬────────┘
          │
          ▼
┌──────────────────┐
│ pressKey()       │
│ (execute logic)  │
└─────────┬────────┘
          │
          ▼
┌──────────────────┐
│ Animation done   │
│ → callback with  │
│   display value  │
└──────────────────┘
```

## Component Responsibilities

### RetroCalculator
- Main wrapper component
- Maps keypad values to calculator KeyIds
- Handles power on/off state
- Passes display state to RetroScreen

### RetroScreen
- Renders LCD display with retro styling
- Parses numbers into individual digits
- Adds thousand separators
- Shows M/E indicators and negative hexagon

### RetroKeypad
- Renders 6x5 button grid
- Handles user button clicks
- Animates buttons during AI sequences
- Uses refs to trigger programmatic animations

### AIChatPanel
- Displays message history
- Shows streaming responses with thinking indicator
- Auto-resizing textarea input
- Responsive desktop/mobile layouts

## Key Patterns

### Singleton Database Connection
```typescript
let dbPromise: Promise<IDBPDatabase> | null = null;
export const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB('casio-calculator-v2', 1, { ... });
  }
  return dbPromise;
};
```

### Animation Callbacks
```typescript
enqueueAnimation(sequence, (displayText) => {
  // Called when animation completes
  addMessage({ text: displayText, type: 'result' });
});
```

### Streaming State Updates
```typescript
onToken: (token) => {
  streamedText += token;
  updateStreamingMessage(assistantMsgId, streamedText);
}
```

## Technology Stack

| Category | Technology |
|----------|------------|
| Framework | React 19.2.0 |
| Language | TypeScript (strict) |
| State | Zustand 5.0.8 |
| Styling | Tailwind CSS 4.1.17 |
| UI Variants | class-variance-authority |
| Database | IndexedDB via `idb` |
| Icons | Lucide React |
| Build | Vite with React Compiler |

## Responsive Design

| Breakpoint | Layout |
|------------|--------|
| Desktop (≥1024px) | Two columns: Calculator + Chat sidebar |
| Mobile (<1024px) | Single column with bottom sheet chat |

Mobile behavior:
- Chat opens as 75vh bottom sheet
- FAB button to toggle chat
- Sheet closes during AI processing, reopens on response

## Optimization Opportunities

Based on analysis of the codebase, the following optimizations could improve performance and maintainability.

### React Compiler (Already Enabled)

This project uses **React 19.2.0** with the **React Compiler** (`babel-plugin-react-compiler`), which automatically handles memoization. This means:

- No need for manual `useMemo`, `useCallback`, or `React.memo`
- The compiler automatically optimizes re-renders
- Inline arrow functions are fine - the compiler handles them

The compiler is configured in `vite.config.ts`:
```typescript
react({
  babel: {
    plugins: [['babel-plugin-react-compiler', {}]],
  },
})
```

### 1. Component Code Splitting

**Lazy load AIChatPanel (Medium Impact)**

The chat panel could be code-split for faster initial load:
```typescript
const AIChatPanel = lazy(() => import('./components/AIChatPanel'));

// Wrap in Suspense
<Suspense fallback={<ChatSkeleton />}>
  <AIChatPanel />
</Suspense>
```

### 2. Animation Performance

**Use CSS animations instead of inline styles (Medium Impact)**

The `triggerButtonPress` function in RetroKeypad manipulates inline styles directly. CSS classes would be more maintainable:
```css
.button.programmatic-press {
  transform: translateY(3px) scale(0.98);
  filter: brightness(0.85);
  transition: all 150ms ease-out;
}
```

### 3. Bundle Size Reduction

**Replace `uuid` with native API (Low Impact)**

`uuid` adds ~3KB. For simple IDs, use `crypto.randomUUID()` (browser native):
```typescript
// Current
import { v4 as uuid } from 'uuid';
const id = uuid();

// Optimized: Native API (supported in all modern browsers)
const id = crypto.randomUUID();
```

### 4. Remove Unused Code

**Legacy components (Cleanup)**

The following files appear unused and could be removed:
- `useRetroCalculator.ts` - Standalone calculator logic (superseded by calculator-engine)
- `LCDDisplay.tsx` - Old display component (replaced by RetroScreen)
- `Keypad.tsx` - Old keypad component (replaced by RetroKeypad)
- `CalculatorSurface.tsx` - Container for old components

### 5. Accessibility Improvements

**Add keyboard support to chat (UX)**

The chat textarea could benefit from:
- Escape to clear input
- Up arrow to edit last message
- Focus management after send

**Add ARIA labels (Accessibility)**

Calculator buttons lack ARIA labels for screen readers:
```tsx
<button aria-label="Add 5" onClick={() => pressKey('digit_5')}>
  5
</button>
```

### Priority Matrix

| Optimization | Impact | Effort | Priority |
|-------------|--------|--------|----------|
| CSS animations for buttons | Medium | Medium | P2 |
| Code splitting | Medium | Low | P2 |
| Remove unused code | Low | Low | P2 |
| Replace uuid with native | Low | Low | P3 |
| Keyboard accessibility | Medium | Medium | P3 |
