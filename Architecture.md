# MCPlator Architecture Guide

This document provides a comprehensive architectural overview of MCPlator, designed to serve as a reference for building similar AI-integrated applications. The patterns, decisions, and trade-offs documented here are applicable to more complex projects.

## Table of Contents

1. [System Overview](#system-overview)
2. [Core Architectural Patterns](#core-architectural-patterns)
3. [Frontend Architecture](#frontend-architecture)
4. [State Management](#state-management)
5. [Calculator Engine](#calculator-engine)
6. [API Layer & Streaming](#api-layer--streaming)
7. [LMCIFY Share Feature](#lmcify-share-feature)
8. [Animation System](#animation-system)
9. [Persistence Layer](#persistence-layer)
10. [Data Flow Diagrams](#data-flow-diagrams)
11. [Design Decisions & Trade-offs](#design-decisions--trade-offs)
12. [Scaling Considerations](#scaling-considerations)
13. [Testing Strategy](#testing-strategy)

---

## System Overview

MCPlator is a browser-based calculator with an AI co-pilot that translates natural language into calculator operations. The system consists of:

- **Frontend**: React 19 SPA with Zustand state management
- **Backend**: Vercel Edge Functions for AI API proxy
- **AI Integration**: Claude API with tool calling for calculator control
- **Persistence**: IndexedDB for client-side state

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          BROWSER                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    React Application                         │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐    │   │
│  │  │ Calculator  │  │  AI Chat    │  │  LMCIFY Share    │    │   │
│  │  │ Component   │  │  Panel      │  │  System          │    │   │
│  │  └──────┬──────┘  └──────┬──────┘  └────────┬─────────┘    │   │
│  │         │                │                   │              │   │
│  │  ┌──────┴────────────────┴───────────────────┴──────────┐  │   │
│  │  │              Zustand State Stores                     │  │   │
│  │  │  useCalculatorStore    useChatStore                   │  │   │
│  │  └──────────────────────────┬────────────────────────────┘  │   │
│  │                             │                                │   │
│  │  ┌──────────────────────────┴────────────────────────────┐  │   │
│  │  │                    IndexedDB                           │  │   │
│  │  │  calculator-state | chat-messages | quota              │  │   │
│  │  └───────────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────┬────────────────────────────────┘
                                     │ HTTPS/SSE
                                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     VERCEL EDGE RUNTIME                              │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    /api/chat Endpoint                        │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐    │   │
│  │  │ Pre-filter  │→ │ Claude API  │→ │ SSE Response     │    │   │
│  │  │ Validation  │  │ Tool Call   │  │ Formatter        │    │   │
│  │  └─────────────┘  └─────────────┘  └──────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Core Architectural Patterns

### Pattern 1: Immutable State Updates

All state transformations return new objects rather than mutating existing state.

```typescript
// Calculator engine example
function pressKey(state: InternalState, key: KeyId): InternalState {
  // Never mutate - always return new object
  return {
    ...state,
    displayValue: newValue,
    shouldStartNewNumber: true,
  };
}
```

**Benefits**:
- Predictable state changes
- Easy debugging (compare before/after)
- Compatible with React's reconciliation
- Enables time-travel debugging

**When to Apply**: Any stateful system where you need predictability and debugging capabilities.

### Pattern 2: Reactive Persistence

State changes automatically trigger persistence without explicit save calls.

```typescript
// Store automatically persists on state change
const useCalculatorStore = create<CalculatorStore>((set, get) => ({
  pressKey: (keyId: KeyId) => {
    const newState = calculatorEngine.pressKey(get().internalState, keyId);
    set({ internalState: newState, display: toDisplay(newState) });
    // Persistence happens here automatically
    persistToIndexedDB('calculator-state', newState);
  },
}));
```

**Benefits**:
- No forgotten save calls
- State always in sync with storage
- Simplified component logic

**Trade-offs**:
- More write operations (mitigate with debouncing for frequent updates)
- Need to handle async errors gracefully

### Pattern 3: Animation Queue with Completion Callbacks

Decouple animation triggering from execution using a queue system.

```typescript
interface AnimationSequence {
  id: string;
  commands: AnimationCommand[];
}

// Store holds queue and callbacks separately
{
  animationQueue: AnimationSequence[];
  animationCallbacks: Map<string, (result: string) => void>;

  enqueueAnimation: (sequence, onComplete?) => {
    const id = crypto.randomUUID();
    if (onComplete) callbacks.set(id, onComplete);
    queue.push({ id, commands: sequence });
  };
}
```

**Benefits**:
- Producer (AI response) doesn't wait for consumer (animation)
- Multiple animations can queue while one plays
- Callbacks enable follow-up actions after animation

**When to Apply**: Any system where async operations trigger visual feedback that takes time.

### Pattern 4: Server-Sent Events for Streaming

Use SSE for real-time AI response streaming instead of WebSockets.

```typescript
// Backend sends typed events
writer.write(`event: token\ndata: ${JSON.stringify({ token })}\n\n`);
writer.write(`event: keys\ndata: ${JSON.stringify({ keys })}\n\n`);
writer.write(`event: done\ndata: ${JSON.stringify({ messageId, fullText })}\n\n`);

// Frontend parses events
const reader = response.body.getReader();
// Parse SSE format and dispatch to callbacks
```

**Benefits**:
- Simpler than WebSockets (HTTP-based, auto-reconnect)
- Native browser support
- Works through proxies and load balancers
- Unidirectional (perfect for AI responses)

**Trade-offs**:
- One-way only (use POST for requests)
- Limited to text data (use JSON encoding)

### Pattern 5: Pre-filtering for Cost Optimization

Validate requests before expensive API calls.

```typescript
function isCalculatorRelated(message: string): boolean {
  const patterns = [
    /\d+\s*[\+\-\*\/\%]\s*\d+/,  // Math expressions
    /calculate|compute|what('s| is)/i,
    /add|subtract|multiply|divide/i,
    // ... more patterns
  ];
  return patterns.some(p => p.test(message));
}

// In API handler
if (!isCalculatorRelated(userMessage)) {
  return earlyRejectResponse("I can only help with calculations");
}
// Only call Claude if relevant
```

**Benefits**:
- 20-30% API cost savings on off-topic requests
- Faster response for filtered requests
- Reduces load on AI service

**Trade-offs**:
- May incorrectly filter edge cases
- Needs tuning for your domain

---

## Frontend Architecture

### Component Hierarchy

```
App.tsx
├── RetroCalculator.tsx (main calculator wrapper)
│   ├── CalculatorSurface.tsx (physical styling)
│   │   ├── RetroScreen.tsx (LCD display)
│   │   │   └── DigitDisplay + Indicators
│   │   └── RetroKeypad.tsx (button grid)
│   │       └── CalculatorButton.tsx (individual keys)
│   └── useAnimationRunner.ts (processes animation queue)
│
└── AIChatPanel.tsx (chat interface)
    ├── ChatHeader.tsx (minimize/close controls)
    ├── ChatMessageList (scrollable history)
    │   ├── ChatMessageBubble.tsx (user/AI messages)
    │   ├── ResultCard.tsx (calculation results)
    │   └── StreamingMessage.tsx (partial AI response)
    ├── ChatInput.tsx (text input + send button)
    │   └── LmcifyShareButton.tsx (share functionality)
    └── useLmcifyAutoPlay.ts (URL-based auto-play)
```

### Component Responsibilities

| Component | Responsibility | State Dependencies |
|-----------|---------------|-------------------|
| `RetroCalculator` | Layout, animation coordination | `useCalculatorStore` |
| `RetroScreen` | Display rendering | `display`, `shouldFlash` |
| `RetroKeypad` | Key event handling | `pressedKey`, `isAnimating` |
| `AIChatPanel` | Chat UI orchestration | `useChatStore`, streaming |
| `ChatInput` | User input, share button | Local + LMCIFY utils |
| `StreamingMessage` | Real-time response display | `streamingMessage` |

### Styling Approach

Hybrid CSS Modules + Tailwind:

```tsx
// CSS Modules for component-specific styles with complex selectors
import styles from './RetroKeypad.module.css';

// Tailwind for utility classes and responsive design
<div className={`${styles.keypad} flex flex-wrap gap-2`}>
```

**Rationale**:
- CSS Modules: Scoped styles, complex animations, pseudo-elements
- Tailwind: Rapid prototyping, responsive utilities, consistency

---

## State Management

### Store Design

Two separate Zustand stores with distinct responsibilities:

#### Calculator Store

```typescript
interface CalculatorStore {
  // Core state
  internalState: CalculatorInternalState;
  display: CalculatorDisplay;

  // Animation state
  pressedKey: KeyId | null;
  isAnimating: boolean;
  animationQueue: AnimationSequence[];
  animationCallbacks: Map<string, (result: string) => void>;

  // Persistence state
  isHydrated: boolean;

  // UI state
  shouldFlash: boolean;

  // Actions
  pressKey: (keyId: KeyId) => void;
  enqueueAnimation: (commands: AnimationCommand[], onComplete?: Callback) => void;
  hydrate: () => Promise<void>;
  // ... more actions
}
```

#### Chat Store

```typescript
interface ChatStore {
  // Core state
  messages: ChatMessage[];
  streamingMessage: { id: string; text: string } | null;
  isThinking: boolean;

  // Persistence state
  isHydrated: boolean;

  // Actions
  addMessage: (message: ChatMessage) => void;
  updateStreamingMessage: (id: string, text: string) => void;
  clearStreamingMessage: () => void;
  hydrate: () => Promise<void>;
  clear: () => void;
}
```

### Why Two Stores?

1. **Separation of Concerns**: Calculator logic vs. chat logic
2. **Independent Hydration**: Can load calculator state without chat history
3. **Different Update Frequencies**: Calculator updates on every key; chat updates on messages
4. **Easier Testing**: Mock one store without affecting the other

### Hydration Pattern

```typescript
// In App.tsx - hydrate stores on mount
useEffect(() => {
  Promise.all([
    useCalculatorStore.getState().hydrate(),
    useChatStore.getState().hydrate(),
  ]);
}, []);

// Components wait for hydration
function RetroCalculator() {
  const isHydrated = useCalculatorStore(state => state.isHydrated);
  if (!isHydrated) return <LoadingSkeleton />;
  // ... render calculator
}
```

---

## Calculator Engine

### State Machine Design

The calculator is modeled as a pure state machine:

```typescript
interface CalculatorInternalState {
  displayValue: string;        // Current display (e.g., "123.45")
  memoryValue: number;         // M register
  hasMemory: boolean;          // M indicator
  lastOperator: Operator | null;
  lastOperand: number | null;  // First operand for pending op
  isError: boolean;            // E indicator
  shouldStartNewNumber: boolean;
}

// Pure function - no side effects
function pressKey(state: InternalState, key: KeyId): InternalState {
  switch (key) {
    case 'digit_0': case 'digit_1': // ...
      return handleDigit(state, key);
    case 'add': case 'sub': case 'mul': case 'div':
      return handleOperator(state, key);
    case 'equals':
      return handleEquals(state);
    // ... other cases
  }
}
```

### Key Behaviors

#### Chained Operations

```
Input: 5 + 3 - 2 =
Flow:
1. "5" → displayValue: "5"
2. "+" → lastOperand: 5, lastOperator: add
3. "3" → displayValue: "3"
4. "-" → Execute 5+3=8, lastOperand: 8, lastOperator: sub
5. "2" → displayValue: "2"
6. "=" → Execute 8-2=6, displayValue: "6"
```

#### Error Handling

```typescript
function handleDivision(state: InternalState): InternalState {
  const result = state.lastOperand / parseFloat(state.displayValue);

  if (!isFinite(result) || isNaN(result)) {
    return { ...state, displayValue: 'E', isError: true };
  }

  return { ...state, displayValue: formatNumber(result) };
}
```

### Display Adapter

Converts internal state to UI-friendly format:

```typescript
function toDisplay(state: InternalState): CalculatorDisplay {
  return {
    text: state.displayValue,
    indicators: {
      error: state.isError,
      memory: state.hasMemory,
      op: state.lastOperator,
    },
  };
}
```

---

## API Layer & Streaming

### Request Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ useStreaming │────▶│  sseClient   │────▶│  /api/chat   │
│    Chat      │     │  streamChat  │     │   Endpoint   │
└──────────────┘     └──────────────┘     └──────────────┘
       │                    │                    │
       │                    │                    ▼
       │                    │           ┌──────────────┐
       │                    │           │ Pre-filter   │
       │                    │           │ Validation   │
       │                    │           └──────┬───────┘
       │                    │                  │
       │                    │                  ▼
       │                    │           ┌──────────────┐
       │                    │           │ Claude API   │
       │                    │           │ (streaming)  │
       │                    │           └──────┬───────┘
       │                    │                  │
       │                    │◀─────────────────┘
       │                    │         SSE Events
       │◀───────────────────┘
       │    Callbacks
       ▼
┌──────────────┐
│ Update Store │
│ & Enqueue    │
│ Animations   │
└──────────────┘
```

### SSE Event Types

```typescript
// Token event - partial text response
{ event: 'token', data: { token: 'I\'ll ' } }

// Keys event - calculator commands from tool call
{ event: 'keys', data: { keys: ['ac', 'digit_2', 'add', 'digit_3', 'equals'] } }

// Done event - completion with full message
{ event: 'done', data: { messageId: 'uuid', fullText: 'I\'ll add 2+3...' } }

// Error event - error notification
{ event: 'error', data: { error: 'Rate limit exceeded' } }
```

### Tool Calling Integration

The AI uses a structured tool to control the calculator:

```typescript
const calculatorTool = {
  name: 'calculator_press_keys',
  description: 'Press keys on the calculator in sequence',
  input_schema: {
    type: 'object',
    properties: {
      keys: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['digit_0', 'digit_1', ..., 'add', 'sub', 'mul', 'div', 'equals', 'ac', ...],
        },
      },
    },
    required: ['keys'],
  },
};
```

### Two-Turn Conversation Flow

```
Turn 1: User message → AI responds with text + tool call
        "Add 2 plus 3" → "I'll add..." + calculator_press_keys(['digit_2', 'add', ...])

Turn 2: Tool result → AI explains outcome
        { result: "5" } → "The result is 5."
```

---

## LMCIFY Share Feature

"Let Me Calculate It For You" - share calculations via URL.

### URL Encoding

```typescript
// Uses lz-string for compression
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';

function encodeLmcify(message: string): string {
  return compressToEncodedURIComponent(message);
}

function decodeLmcify(encoded: string): string | null {
  try {
    return decompressFromEncodedURIComponent(encoded);
  } catch {
    return null;
  }
}

function generateLmcifyLink(message: string): string {
  const encoded = encodeLmcify(message);
  return `${window.location.origin}/?lmcify=${encoded}`;
}
```

### Auto-Play Hook

```typescript
function useLmcifyAutoPlay(options: {
  onType: (char: string) => void;
  onSend: (message: string) => void;
  baseTypingSpeed: number;
}) {
  const [playedMessages] = useState(() => new Set<string>());

  useEffect(() => {
    const message = getLmcifyFromUrl();
    if (!message || playedMessages.has(message)) return;

    playedMessages.add(message);

    // Calculate dynamic typing speed
    const typingSpeed = message.length > 50
      ? Math.max(10, 3000 / message.length)
      : baseTypingSpeed;

    // Type each character
    let index = 0;
    const typeInterval = setInterval(() => {
      if (index < message.length) {
        onType(message[index]);
        index++;
      } else {
        clearInterval(typeInterval);
        setTimeout(() => onSend(message), 1000);
        cleanUrlParam();
      }
    }, typingSpeed);

    return () => clearInterval(typeInterval);
  }, []);
}
```

### Dynamic Typing Speed

```
Message Length | Typing Speed | Total Time
---------------|--------------|------------
≤50 chars      | 100ms/char   | ≤5 seconds
100 chars      | 30ms/char    | ~3 seconds
200 chars      | 15ms/char    | ~3 seconds
500 chars      | 10ms/char    | ~5 seconds (minimum)
```

---

## Animation System

### Animation Runner Hook

```typescript
function useAnimationRunner() {
  const { animationQueue, animationCallbacks, isAnimating } = useCalculatorStore();

  useEffect(() => {
    if (isAnimating || animationQueue.length === 0) return;

    const sequence = animationQueue[0];
    setIsAnimating(true);

    async function runSequence() {
      for (const command of sequence.commands) {
        // Visual feedback
        setPressedKey(command.key);
        await delay(180); // Hold time

        // Execute logic
        pressKey(command.key);
        setPressedKey(null);
        await delay(50); // Gap between keys
      }

      // Get result and call callback
      const result = getDisplay().text;
      const callback = animationCallbacks.get(sequence.id);
      if (callback) callback(result);

      // Remove from queue
      dequeueAnimation(sequence.id);
      setIsAnimating(false);
    }

    runSequence();
  }, [animationQueue, isAnimating]);
}
```

### Timing Configuration

```typescript
const ANIMATION_TIMING = {
  KEY_HOLD_MS: 180,      // How long key appears pressed
  KEY_GAP_MS: 50,        // Gap between key presses
  PRE_PLAY_DELAY_MS: 300, // Delay before auto-play starts
  POST_TYPE_DELAY_MS: 1000, // Delay after typing before send
};
```

---

## Persistence Layer

### IndexedDB Schema

```typescript
const DB_NAME = 'mcplator';
const DB_VERSION = 1;

const STORES = {
  CALCULATOR_STATE: 'calculator-state',
  CHAT_MESSAGES: 'chat-messages',
  QUOTA: 'quota',
};

// Schema
{
  'calculator-state': {
    keyPath: 'id',  // Single record with id='current'
    value: CalculatorInternalState,
  },
  'chat-messages': {
    keyPath: 'id',
    indexes: ['timestamp'],
    value: ChatMessage[],
  },
  'quota': {
    keyPath: 'date',  // YYYY-MM-DD format
    value: { count: number, date: string },
  },
}
```

### Persistence Utilities

```typescript
// Using idb library for Promise-based IndexedDB
import { openDB } from 'idb';

async function persistCalculatorState(state: InternalState): Promise<void> {
  const db = await openDB(DB_NAME, DB_VERSION);
  await db.put(STORES.CALCULATOR_STATE, { id: 'current', ...state });
}

async function loadCalculatorState(): Promise<InternalState | null> {
  const db = await openDB(DB_NAME, DB_VERSION);
  const record = await db.get(STORES.CALCULATOR_STATE, 'current');
  return record ? record : null;
}

async function appendChatMessage(message: ChatMessage): Promise<void> {
  const db = await openDB(DB_NAME, DB_VERSION);
  await db.add(STORES.CHAT_MESSAGES, message);
}
```

### Quota Management

```typescript
async function canMakeApiCall(dailyLimit: number = 100): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0];
  const db = await openDB(DB_NAME, DB_VERSION);
  const record = await db.get(STORES.QUOTA, today);
  return !record || record.count < dailyLimit;
}

async function recordApiCall(): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const db = await openDB(DB_NAME, DB_VERSION);
  const record = await db.get(STORES.QUOTA, today) || { date: today, count: 0 };
  await db.put(STORES.QUOTA, { ...record, count: record.count + 1 });
}
```

---

## Data Flow Diagrams

### User Chat Input Flow

```
User types message
        │
        ▼
┌─────────────────┐
│   ChatInput     │
│   Component     │
└────────┬────────┘
         │ onSubmit
         ▼
┌─────────────────┐
│ useStreamingChat│
│     Hook        │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌───────┐ ┌───────┐
│Validate│ │ Check │
│ Input │ │ Quota │
└───┬───┘ └───┬───┘
    │         │
    └────┬────┘
         │
         ▼
┌─────────────────┐
│ Add User Message│
│ to ChatStore    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   sseClient     │
│  streamChat()   │
└────────┬────────┘
         │
         ▼
    /api/chat
         │
         ▼
┌─────────────────┐
│ Receive SSE     │
│ Events          │
└────────┬────────┘
         │
    ┌────┼────┬────────┐
    ▼    ▼    ▼        ▼
  token keys done    error
    │    │    │        │
    ▼    ▼    ▼        ▼
Update  Enqueue Add   Show
Stream  Animation Message Error
```

### Calculator Animation Flow

```
Keys received from AI
        │
        ▼
┌─────────────────┐
│ enqueueAnimation│
│ (with callback) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ animationQueue  │
│ [..., newSeq]   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│useAnimationRunner│
│ (watches queue) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ For each key:   │
│ 1. setPressedKey│
│ 2. Wait 180ms   │
│ 3. pressKey()   │
│ 4. Clear press  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Call completion │
│ callback with   │
│ display result  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Add result to   │
│ chat as message │
└─────────────────┘
```

---

## Design Decisions & Trade-offs

### Decision 1: Client-Side Persistence vs. Backend Database

**Chose**: IndexedDB (client-side)

**Rationale**:
- No user accounts needed
- Calculator state is inherently per-device
- Reduces backend complexity
- Works offline
- No GDPR concerns with user data storage

**Trade-offs**:
- No cross-device sync
- Lost on browser data clear
- Limited debugging visibility

**When to Choose Backend**: Multi-device sync needed, or state has value beyond single session.

### Decision 2: SSE vs. WebSockets for Streaming

**Chose**: Server-Sent Events

**Rationale**:
- Simpler server implementation
- Works with serverless (Vercel Edge)
- Auto-reconnect built-in
- Sufficient for unidirectional AI responses

**Trade-offs**:
- One-way only (fine for this use case)
- Maximum 6 concurrent connections per domain

**When to Choose WebSockets**: Bidirectional real-time communication, or high-frequency updates.

### Decision 3: Two Stores vs. Single Store

**Chose**: Separate Calculator and Chat stores

**Rationale**:
- Different update frequencies
- Independent persistence needs
- Easier to reason about
- Better for testing

**Trade-offs**:
- Cross-store communication slightly more complex
- Need to coordinate hydration

**When to Choose Single Store**: Tightly coupled state, or very simple application.

### Decision 4: Pre-filtering Before AI Call

**Chose**: Regex-based pre-filter

**Rationale**:
- Significant cost savings (20-30%)
- Faster rejection of off-topic requests
- Simple to implement and tune

**Trade-offs**:
- May incorrectly filter valid requests
- Needs ongoing tuning
- Doesn't catch sophisticated off-topic

**When to Skip**: AI calls are cheap, or domain is too complex to filter.

### Decision 5: lz-string vs. Base64 for URL Encoding

**Chose**: lz-string compression

**Rationale**:
- Much shorter URLs for longer messages
- URL-safe encoding built-in
- Better for social sharing (URL length limits)

**Trade-offs**:
- Additional dependency
- Slightly more CPU for encode/decode
- Not human-readable (debugging harder)

---

## Scaling Considerations

### For More Complex AI Interactions

1. **Multiple Tools**: Define additional tools in the API
   ```typescript
   const tools = [calculatorTool, graphingTool, unitConverterTool];
   ```

2. **Conversation Memory**: Increase context window
   ```typescript
   const contextMessages = messages.slice(-20); // More history
   ```

3. **Tool Chaining**: Handle multiple tool calls in sequence
   ```typescript
   while (response.stop_reason === 'tool_use') {
     // Execute tool, add result, continue conversation
   }
   ```

### For More Complex State

1. **State Slices**: Split stores further by domain
   ```typescript
   useCalculatorStore, useChatStore, useGraphStore, useSettingsStore
   ```

2. **Middleware**: Add logging, persistence, or devtools
   ```typescript
   create(devtools(persist(subscribeWithSelector((set) => ...))));
   ```

3. **Computed State**: Use selectors for derived values
   ```typescript
   const total = useStore(state => state.items.reduce((a, b) => a + b.price, 0));
   ```

### For More Complex UI

1. **Component Library**: Extract reusable components
2. **Lazy Loading**: Code-split large features
   ```typescript
   const GraphPanel = lazy(() => import('./GraphPanel'));
   ```

3. **Virtual Lists**: For long lists of items
   ```typescript
   import { VirtualList } from 'react-window';
   ```

### For Production Scale

1. **Rate Limiting**: Per-user limits on backend
2. **Caching**: Redis for common queries
3. **Analytics**: Track usage patterns
4. **Error Monitoring**: Sentry or similar
5. **A/B Testing**: Feature flags for experiments

---

## Testing Strategy

### Unit Tests

- **Calculator Engine**: Pure function, easy to test all cases
  ```typescript
  test('division by zero shows error', () => {
    let state = pressKey(initial, 'digit_5');
    state = pressKey(state, 'div');
    state = pressKey(state, 'digit_0');
    state = pressKey(state, 'equals');
    expect(state.isError).toBe(true);
  });
  ```

- **LMCIFY Utils**: Encode/decode round-trip
  ```typescript
  test('encode/decode roundtrip', () => {
    const message = 'Calculate 2+2';
    const encoded = encodeLmcify(message);
    const decoded = decodeLmcify(encoded);
    expect(decoded).toBe(message);
  });
  ```

### Integration Tests

- **Store + Persistence**: Verify hydration works
- **API + Streaming**: Mock SSE responses

### E2E Tests (Playwright)

- **Full User Flow**: Type message, see animation, get result
- **LMCIFY Flow**: Open shared URL, watch auto-play
- **Error Cases**: Network failure, quota exceeded

---

## Summary

MCPlator demonstrates a clean architecture for AI-integrated applications:

| Concern | Solution |
|---------|----------|
| State Management | Zustand with separate stores per domain |
| Persistence | IndexedDB with reactive auto-save |
| AI Integration | SSE streaming + tool calling |
| Animation | Queue-based with completion callbacks |
| Sharing | URL encoding with lz-string compression |
| Cost Control | Pre-filtering + daily quotas |

The patterns and trade-offs documented here should transfer well to more complex applications while maintaining code clarity and developer experience.
