# Casio LLM Calculator – Updated System Design Spec (v2)

## 0. Project Summary

A web-based emulation of a Casio-style calculator with:

- **Pixel-ish accurate UI** (buttons, LCD, indicators).
- **Real calculator behavior** implemented in a **frontend engine** (TS).
- **LLM-powered chat** that:
  - Understands natural language ("add 2 plus one hundred").
  - Produces calculator key sequences.
  - The frontend replays those key sequences visually on the calculator.
- **State stored in the browser** (IndexedDB):
  - Calculator memory, rates, etc.
  - Chat history (for vibes, not correctness).
  - Soft usage quotas.

### Key Changes from v1:
- **LLM**: Claude Haiku (Anthropic) instead of OpenAI
- **Communication**: Server-Sent Events (SSE) for streaming responses
- **Runtime**: Bun instead of Node.js
- **Storage**: IndexedDB instead of localStorage
- **Deployment**: Vercel (SSE-compatible)

No MCP server, no Redis, no DB, no user registration.


---

## 1. Tech Stack

### Frontend

- **Framework:** React + TypeScript
- **Build:** Vite (or Bun's bundler)
- **State management:** Zustand (no persist middleware, manual IndexedDB sync)
- **Styling:** Tailwind CSS
- **Storage:**
  - `IndexedDB` (via `idb` library) for:
    - Calculator engine state (including memory, rate).
    - Chat history.
    - Simple per-browser LLM quota.
- **Streaming:** Native `EventSource` API for SSE

### Backend

- **Platform:** Vercel
- **Runtime:** Edge Functions (for SSE support) or Node.js Functions
- **LLM Client:** Anthropic SDK (`@anthropic-ai/sdk`)
- **Tools:** Claude tool use for calculator operations
- **Streaming:** SSE via `ReadableStream`
- **No:** DB, Redis, MCP server in v2

### Local Development

- **Runtime:** Bun (for fast local dev server)
- **Dev Server:** Bun.serve() with SSE support

### Shared

- **Monorepo (bun workspace)** with shared packages:
  - `packages/shared-types`
  - `packages/calculator-engine`


---

## 2. SSE Communication Flow

```text
Frontend                          Backend (Vercel Edge)
   │                                     │
   │──POST /api/chat─────────────────────▶│
   │                                     │──▶ Claude API (streaming)
   │◀─event: token {token: "I"}──────────│◀──
   │◀─event: token {token: "'ll"}────────│◀──
   │◀─event: keys {keys: ["digit_1"...]}─│    (tool use detected)
   │◀─event: token {token: "Done!"}──────│◀──
   │◀─event: done {fullText: "..."}──────│
   │                                     │
```

This diagram shows:
1. Frontend initiates a POST request to `/api/chat`
2. Backend streams responses from Claude API
3. `token` events stream text as it's generated
4. `keys` event is sent when a calculator tool use is detected (allowing animation to start early)
5. `done` event signals completion with the full response text


---

## 3. Monorepo Structure

```text
calculator-casio-llm/
  package.json
  bunfig.toml
  tsconfig.base.json
  vercel.json

  packages/
    shared-types/
      src/
        calculator.ts
        chat.ts
        sse.ts
        index.ts

    calculator-engine/
      src/
        types.ts
        index.ts

  apps/
    frontend/
      src/
        db/
          indexedDB.ts
          chatDB.ts
          calculatorDB.ts
          quotaDB.ts
        api/
          useStreamingChat.ts
          sseClient.ts
        calculator/
          engine.ts
          engineTypes.ts
        state/
          useCalculatorStore.ts
          useChatStore.ts
        hooks/
          useAnimationRunner.ts
        components/
          CalculatorSurface.tsx
          LCDDisplay.tsx
          Keypad.tsx
          ChatPanel.tsx
        main.tsx
        App.tsx

    backend/
      api/
        chat.ts           # Vercel Edge/Node function with SSE
      src/
        anthropicClient.ts
        tools.ts
        dev-server.ts     # Bun dev server for local development
``` 


---

## 4. Shared Types (`packages/shared-types`)

### 4.1 Calculator types

```ts
// packages/shared-types/src/calculator.ts

export type KeyId =
  | 'digit_0' | 'digit_1' | 'digit_2' | 'digit_3' | 'digit_4'
  | 'digit_5' | 'digit_6' | 'digit_7' | 'digit_8' | 'digit_9'
  | 'decimal'
  | 'add' | 'sub' | 'mul' | 'div'
  | 'percent'
  | 'equals'
  | 'ac' | 'c'
  | 'mc' | 'mr' | 'm_plus' | 'm_minus'
  | 'rate' | 'euro' | 'local';

export type CalculatorIndicators = {
  error: boolean;           // E
  memory: boolean;          // M
  constant: boolean;        // K
  euro: boolean;
  local: boolean;
  rate: boolean;
  op: null | 'add' | 'sub' | 'mul' | 'div';
};

export type CalculatorDisplay = {
  text: string;             // e.g., "0.", "11.4", "E"
  indicators: CalculatorIndicators;
};

export type AnimationCommand =
  | { type: 'pressKey'; key: KeyId; delayMs?: number }
  | { type: 'setDisplay'; display: CalculatorDisplay }
  | { type: 'sleep'; durationMs: number };

export type AnimationSequence = {
  id: string;
  commands: AnimationCommand[];
};
```

### 4.2 Chat types

```ts
// packages/shared-types/src/chat.ts

export type ChatRole = 'user' | 'assistant';

export type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
  createdAt: string; // ISO timestamp
};

export type ChatRequestBody = {
  message: string;
  history?: { role: ChatRole; text: string }[];
};
```

### 4.3 SSE Event types

```ts
// packages/shared-types/src/sse.ts

import type { KeyId } from './calculator';

// SSE event types sent from server to client
export type SSEEventType = 
  | 'token'      // Streaming text token
  | 'keys'       // Calculator keys to animate
  | 'done'       // Stream complete
  | 'error';     // Error occurred

export type SSETokenEvent = {
  type: 'token';
  data: {
    token: string;
  };
};

export type SSEKeysEvent = {
  type: 'keys';
  data: {
    keys: KeyId[];
  };
};

export type SSEDoneEvent = {
  type: 'done';
  data: {
    messageId: string;
    fullText: string;
  };
};

export type SSEErrorEvent = {
  type: 'error';
  data: {
    error: string;
  };
};

export type SSEEvent = 
  | SSETokenEvent 
  | SSEKeysEvent 
  | SSEDoneEvent 
  | SSEErrorEvent;
```


---

## 5. Calculator Engine (`packages/calculator-engine`)

Goal: single canonical implementation of calculator behavior, shared by frontend and backend (backend uses it only for tool validation; frontend uses it as the real state holder).

### 5.1 Types

```ts
// packages/calculator-engine/src/types.ts
import type { KeyId, CalculatorDisplay } from '@calculator/shared-types';

export type CalculatorInternalState = {
  displayValue: string;
  memoryValue: number;
  hasMemory: boolean;
  constant: null | {
    operator: 'add' | 'sub' | 'mul' | 'div';
    value: number;
  };
  lastOperator: 'add' | 'sub' | 'mul' | 'div' | null;
  lastOperand: number | null;
  isError: boolean;
  euroRate: number | null;
  isEuroMode: boolean;
  isLocalMode: boolean;
};

export type CalculatorEngine = {
  initialState: () => CalculatorInternalState;
  pressKey: (state: CalculatorInternalState, key: KeyId) => CalculatorInternalState;
  toDisplay: (state: CalculatorInternalState) => CalculatorDisplay;
};
```

### 5.2 Skeleton implementation

```ts
// packages/calculator-engine/src/index.ts
import type {
  CalculatorEngine,
  CalculatorInternalState,
} from './types';
import type { CalculatorDisplay, KeyId } from '@calculator/shared-types';

export const calculatorEngine: CalculatorEngine = {
  initialState: (): CalculatorInternalState => ({
    displayValue: '0',
    memoryValue: 0,
    hasMemory: false,
    constant: null,
    lastOperator: null,
    lastOperand: null,
    isError: false,
    euroRate: null,
    isEuroMode: false,
    isLocalMode: true,
  }),

  pressKey: (state, key) => {
    // TODO: implement full Casio logic here (AC/C, %, memory keys, constants, Euro/Local)
    return state;
  },

  toDisplay: (state): CalculatorDisplay => ({
    text: state.isError ? 'E' : state.displayValue,
    indicators: {
      error: state.isError,
      memory: state.hasMemory,
      constant: !!state.constant,
      euro: state.isEuroMode,
      local: state.isLocalMode,
      rate: state.euroRate != null,
      op: state.lastOperator,
    },
  }),
};
```


---

## 6. Frontend State & Behavior (`apps/frontend`)

### 6.1 IndexedDB Setup

```ts
// apps/frontend/src/db/indexedDB.ts
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface CasioDBSchema extends DBSchema {
  'calculator-state': {
    key: 'current';
    value: {
      id: 'current';
      state: import('@calculator/calculator-engine').CalculatorInternalState;
      display: import('@calculator/shared-types').CalculatorDisplay;
      updatedAt: string;
    };
  };
  'chat-messages': {
    key: string;
    value: import('@calculator/shared-types').ChatMessage;
    indexes: { 'by-created': string };
  };
  'quota': {
    key: 'daily';
    value: {
      id: 'daily';
      date: string;
      callsUsed: number;
      dailyLimit: number;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<CasioDBSchema>> | null = null;

export const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<CasioDBSchema>('casio-calculator-v2', 1, {
      upgrade(db) {
        // Calculator state store
        db.createObjectStore('calculator-state', { keyPath: 'id' });

        // Chat messages store
        const chatStore = db.createObjectStore('chat-messages', { keyPath: 'id' });
        chatStore.createIndex('by-created', 'createdAt');

        // Quota store
        db.createObjectStore('quota', { keyPath: 'id' });
      },
    });
  }
  return dbPromise;
};
```

### 6.2 Chat Database Operations

```ts
// apps/frontend/src/db/chatDB.ts
import { getDB } from './indexedDB';
import type { ChatMessage } from '@calculator/shared-types';

export const chatDB = {
  async getAllMessages(): Promise<ChatMessage[]> {
    const db = await getDB();
    return db.getAllFromIndex('chat-messages', 'by-created');
  },

  async addMessage(message: ChatMessage): Promise<void> {
    const db = await getDB();
    await db.put('chat-messages', message);
  },

  async clearMessages(): Promise<void> {
    const db = await getDB();
    await db.clear('chat-messages');
  },

  async getRecentMessages(limit: number): Promise<ChatMessage[]> {
    const all = await this.getAllMessages();
    return all.slice(-limit);
  },
};
```

### 6.3 Quota Database Operations

```ts
// apps/frontend/src/db/quotaDB.ts
import { getDB } from './indexedDB';

const DEFAULT_LIMIT = 100;

type QuotaState = {
  id: 'daily';
  date: string;
  callsUsed: number;
  dailyLimit: number;
};

const todayStr = () => new Date().toISOString().slice(0, 10);

export const quotaDB = {
  async getQuota(): Promise<QuotaState> {
    const db = await getDB();
    const stored = await db.get('quota', 'daily');

    if (!stored || stored.date !== todayStr()) {
      const fresh: QuotaState = {
        id: 'daily',
        date: todayStr(),
        callsUsed: 0,
        dailyLimit: stored?.dailyLimit ?? DEFAULT_LIMIT,
      };
      await db.put('quota', fresh);
      return fresh;
    }

    return stored;
  },

  async canMakeCall(): Promise<boolean> {
    const quota = await this.getQuota();
    return quota.callsUsed < quota.dailyLimit;
  },

  async recordCall(): Promise<void> {
    const db = await getDB();
    const quota = await this.getQuota();
    await db.put('quota', {
      ...quota,
      callsUsed: quota.callsUsed + 1,
    });
  },
};
```

### 6.4 SSE Client

```ts
// apps/frontend/src/api/sseClient.ts
import type { SSEEvent, ChatRequestBody } from '@calculator/shared-types';

export type SSECallbacks = {
  onToken: (token: string) => void;
  onKeys: (keys: string[]) => void;
  onDone: (messageId: string, fullText: string) => void;
  onError: (error: string) => void;
};

export async function streamChat(
  body: ChatRequestBody,
  callbacks: SSECallbacks,
  signal?: AbortSignal
): Promise<void> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No response body');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      
      // Parse SSE events from buffer
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer

      let eventType = '';
      let eventData = '';

      for (const line of lines) {
        if (line.startsWith('event: ')) {
          eventType = line.slice(7);
        } else if (line.startsWith('data: ')) {
          eventData = line.slice(6);
        } else if (line === '' && eventType && eventData) {
          // End of event, process it
          try {
            const parsed = JSON.parse(eventData);
            
            switch (eventType) {
              case 'token':
                callbacks.onToken(parsed.token);
                break;
              case 'keys':
                callbacks.onKeys(parsed.keys);
                break;
              case 'done':
                callbacks.onDone(parsed.messageId, parsed.fullText);
                break;
              case 'error':
                callbacks.onError(parsed.error);
                break;
            }
          } catch (e) {
            console.error('Failed to parse SSE data:', e);
          }
          
          eventType = '';
          eventData = '';
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
```

### 6.5 Streaming Chat Hook

```ts
// apps/frontend/src/api/useStreamingChat.ts
import { useCallback, useRef, useState } from 'react';
import { useChatStore } from '../state/useChatStore';
import { useCalculatorStore } from '../state/useCalculatorStore';
import { quotaDB } from '../db/quotaDB';
import { streamChat } from './sseClient';
import type { KeyId } from '@calculator/shared-types';
import { v4 as uuid } from 'uuid';

export const useStreamingChat = () => {
  const { messages, addMessage, updateStreamingMessage, setIsThinking } = useChatStore();
  const enqueueAnimation = useCalculatorStore((s) => s.enqueueAnimation);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendChat = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;

    const canCall = await quotaDB.canMakeCall();
    if (!canCall) {
      await addMessage({
        id: uuid(),
        role: 'assistant',
        text: "You've reached today's calculator brain quota. Try again tomorrow 🙂",
        createdAt: new Date().toISOString(),
      });
      return;
    }

    // Add user message
    const userMsg = {
      id: uuid(),
      role: 'user' as const,
      text: trimmed,
      createdAt: new Date().toISOString(),
    };
    await addMessage(userMsg);

    // Record the quota
    await quotaDB.recordCall();

    // Start streaming
    setIsStreaming(true);
    setIsThinking(true);

    // Create placeholder for assistant message
    const assistantMsgId = uuid();
    let streamedText = '';

    abortControllerRef.current = new AbortController();

    try {
      await streamChat(
        {
          message: trimmed,
          history: messages.slice(-6).map((m) => ({
            role: m.role,
            text: m.text,
          })),
        },
        {
          onToken: (token) => {
            streamedText += token;
            updateStreamingMessage(assistantMsgId, streamedText);
          },
          onKeys: (keys) => {
            enqueueAnimation({
              id: uuid(),
              commands: keys.map((k) => ({
                type: 'pressKey' as const,
                key: k as KeyId,
                delayMs: 180,
              })),
            });
          },
          onDone: async (messageId, fullText) => {
            await addMessage({
              id: assistantMsgId,
              role: 'assistant',
              text: fullText,
              createdAt: new Date().toISOString(),
            });
          },
          onError: async (error) => {
            await addMessage({
              id: assistantMsgId,
              role: 'assistant',
              text: `Error: ${error}`,
              createdAt: new Date().toISOString(),
            });
          },
        },
        abortControllerRef.current.signal
      );
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        await addMessage({
          id: assistantMsgId,
          role: 'assistant',
          text: 'Sorry, something went wrong talking to the calculator brain.',
          createdAt: new Date().toISOString(),
        });
      }
    } finally {
      setIsStreaming(false);
      setIsThinking(false);
      abortControllerRef.current = null;
    }
  }, [messages, addMessage, updateStreamingMessage, setIsThinking, enqueueAnimation, isStreaming]);

  const cancelStream = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  return { sendChat, cancelStream, isStreaming };
};
```

### 6.6 Calculator store (Zustand + IndexedDB sync)

```ts
// apps/frontend/src/state/useCalculatorStore.ts
import { create } from 'zustand';
import { calculatorEngine } from '@calculator/calculator-engine';
import type {
  CalculatorDisplay,
  AnimationSequence,
  KeyId,
} from '@calculator/shared-types';
import type { CalculatorInternalState } from '@calculator/calculator-engine';
import { getDB } from '../db/indexedDB';

type CalculatorStoreState = {
  internalState: CalculatorInternalState;
  display: CalculatorDisplay;
  pressedKey: KeyId | null;
  isAnimating: boolean;
  animationQueue: AnimationSequence[];
  isHydrated: boolean;
};

type CalculatorStoreActions = {
  pressKey: (key: KeyId) => void;
  enqueueAnimation: (sequence: AnimationSequence) => void;
  setPressedKey: (key: KeyId | null) => void;
  setIsAnimating: (val: boolean) => void;
  hydrate: () => Promise<void>;
};

export const useCalculatorStore = create<CalculatorStoreState & CalculatorStoreActions>()(
  (set, get) => ({
    internalState: calculatorEngine.initialState(),
    display: calculatorEngine.toDisplay(calculatorEngine.initialState()),
    pressedKey: null,
    isAnimating: false,
    animationQueue: [],
    isHydrated: false,

    hydrate: async () => {
      const db = await getDB();
      const stored = await db.get('calculator-state', 'current');
      if (stored) {
        set({
          internalState: stored.state,
          display: stored.display,
          isHydrated: true,
        });
      } else {
        set({ isHydrated: true });
      }
    },

    pressKey: async (key) => {
      const current = get().internalState;
      const next = calculatorEngine.pressKey(current, key);
      const display = calculatorEngine.toDisplay(next);
      set({ internalState: next, display });

      // Persist to IndexedDB
      const db = await getDB();
      await db.put('calculator-state', {
        id: 'current',
        state: next,
        display,
        updatedAt: new Date().toISOString(),
      });
    },

    enqueueAnimation: (sequence) => {
      set((state) => ({
        animationQueue: [...state.animationQueue, sequence],
      }));
    },

    setPressedKey: (key) => set({ pressedKey: key }),
    setIsAnimating: (val) => set({ isAnimating: val }),
  }),
);
```

### 6.7 Chat store (with streaming support)

```ts
// apps/frontend/src/state/useChatStore.ts
import { create } from 'zustand';
import type { ChatMessage } from '@calculator/shared-types';
import { chatDB } from '../db/chatDB';

type ChatState = {
  messages: ChatMessage[];
  streamingMessage: { id: string; text: string } | null;
  isThinking: boolean;
  isHydrated: boolean;
};

type ChatActions = {
  addMessage: (msg: ChatMessage) => Promise<void>;
  updateStreamingMessage: (id: string, text: string) => void;
  clearStreamingMessage: () => void;
  setIsThinking: (val: boolean) => void;
  clear: () => Promise<void>;
  hydrate: () => Promise<void>;
};

export const useChatStore = create<ChatState & ChatActions>()(
  (set, get) => ({
    messages: [],
    streamingMessage: null,
    isThinking: false,
    isHydrated: false,

    hydrate: async () => {
      const messages = await chatDB.getAllMessages();
      set({ messages, isHydrated: true });
    },

    addMessage: async (msg) => {
      await chatDB.addMessage(msg);
      set((state) => ({
        messages: [...state.messages, msg],
        streamingMessage: null,
      }));
    },

    updateStreamingMessage: (id, text) => {
      set({ streamingMessage: { id, text } });
    },

    clearStreamingMessage: () => {
      set({ streamingMessage: null });
    },

    setIsThinking: (val) => set({ isThinking: val }),

    clear: async () => {
      await chatDB.clearMessages();
      set({ messages: [], streamingMessage: null });
    },
  }),
);
```

### 6.8 Animation runner hook

```ts
// apps/frontend/src/hooks/useAnimationRunner.ts
import { useEffect } from 'react';
import { useCalculatorStore } from '../state/useCalculatorStore';
import type { AnimationCommand } from '@calculator/shared-types';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const useAnimationRunner = () => {
  const {
    animationQueue,
    isAnimating,
    setIsAnimating,
    setPressedKey,
  } = useCalculatorStore();

  const pressKey = useCalculatorStore((s) => s.pressKey);

  useEffect(() => {
    if (isAnimating || animationQueue.length === 0) return;

    const [current, ...rest] = animationQueue;
    setIsAnimating(true);

    const run = async (commands: AnimationCommand[]) => {
      for (const cmd of commands) {
        if (cmd.type === 'pressKey') {
          setPressedKey(cmd.key);
          await sleep(cmd.delayMs ?? 150);
          setPressedKey(null);
          pressKey(cmd.key);
        } else if (cmd.type === 'setDisplay') {
          // optional: force a display override here
        } else if (cmd.type === 'sleep') {
          await sleep(cmd.durationMs);
        }
      }
    };

    run(current.commands).finally(() => {
      useCalculatorStore.setState({
        animationQueue: rest,
        isAnimating: false,
      });
    });
  }, [animationQueue, isAnimating, pressKey, setIsAnimating, setPressedKey]);
};
```

## 7. Backend API (`apps/backend`)

### 7.1 Anthropic Client Setup

```ts
// apps/backend/src/anthropicClient.ts
import Anthropic from '@anthropic-ai/sdk';

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export const MODEL = 'claude-3-5-haiku-20241022';
```

### 7.2 Calculator Tool Definition

```ts
// apps/backend/src/tools.ts
import type { Tool } from '@anthropic-ai/sdk/resources/messages';
import type { KeyId } from '@calculator/shared-types';
import { calculatorEngine } from '@calculator/calculator-engine';

export const calculatorPressKeysTool: Tool = {
  name: 'calculator_press_keys',
  description: 'Simulate pressing calculator keys in order. Use this tool to perform any calculator operation by specifying the sequence of keys to press.',
  input_schema: {
    type: 'object' as const,
    properties: {
      keys: {
        type: 'array',
        items: {
          type: 'string',
          enum: [
            'digit_0', 'digit_1', 'digit_2', 'digit_3', 'digit_4',
            'digit_5', 'digit_6', 'digit_7', 'digit_8', 'digit_9',
            'decimal',
            'add', 'sub', 'mul', 'div',
            'percent',
            'equals',
            'ac', 'c',
            'mc', 'mr', 'm_plus', 'm_minus',
            'rate', 'euro', 'local',
          ],
        },
        description: 'Array of calculator keys to press in sequence',
      },
    },
    required: ['keys'],
  },
};

export const handleCalculatorPressKeys = (keys: KeyId[]) => {
  let state = calculatorEngine.initialState();
  for (const key of keys) {
    state = calculatorEngine.pressKey(state, key);
  }
  const display = calculatorEngine.toDisplay(state);
  return { display, keys };
};
```

### 7.3 Vercel API Route with SSE Streaming

```ts
// apps/backend/api/chat.ts
import { anthropic, MODEL } from '../src/anthropicClient';
import { calculatorPressKeysTool, handleCalculatorPressKeys } from '../src/tools';
import type { ChatRequestBody, KeyId } from '@calculator/shared-types';
import { v4 as uuid } from 'uuid';

export const config = {
  runtime: 'edge', // Use Edge runtime for streaming
};

const SYSTEM_PROMPT = `
You are an assistant controlling a Casio-like calculator UI in the browser.

Rules:
- For any numeric calculator operation, you MUST use the "calculator_press_keys" tool.
- The browser holds the actual calculator state; this tool is for validating key sequences.
- After using the tool, provide a short natural language explanation of what you did.
- If the user request is not a calculator operation (like general chat), respond normally without using the tool.

Available keys:
- Digits: digit_0 through digit_9
- Decimal point: decimal
- Operations: add, sub, mul, div
- Equals: equals
- Clear: ac (all clear), c (clear entry)
- Memory: mc (clear), mr (recall), m_plus (add to memory), m_minus (subtract from memory)
- Percent: percent
- Currency: rate, euro, local
`;

// Helper to format SSE events
function sseEvent(event: string, data: object): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const body: ChatRequestBody = await req.json();
  const { message, history } = body;

  const messages = [
    ...(history ?? []).map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.text,
    })),
    { role: 'user' as const, content: message },
  ];

  // Create a TransformStream for SSE
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  // Process in background
  (async () => {
    try {
      let fullText = '';
      let keys: KeyId[] = [];
      const messageId = uuid();

      // Initial request with streaming
      const stream = await anthropic.messages.stream({
        model: MODEL,
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        tools: [calculatorPressKeysTool],
        messages,
      });

      for await (const event of stream) {
        if (event.type === 'content_block_delta') {
          if (event.delta.type === 'text_delta') {
            const token = event.delta.text;
            fullText += token;
            await writer.write(encoder.encode(sseEvent('token', { token })));
          }
        } else if (event.type === 'content_block_stop') {
          // Check if we have a tool use
          const message = stream.currentMessage;
          const toolUse = message?.content.find((c) => c.type === 'tool_use');
          
          if (toolUse && toolUse.type === 'tool_use') {
            const toolInput = toolUse.input as { keys: KeyId[] };
            const toolResult = handleCalculatorPressKeys(toolInput.keys);
            keys = toolResult.keys;

            // Send keys event immediately
            await writer.write(encoder.encode(sseEvent('keys', { keys })));

            // Continue conversation with tool result for final response
            const finalMessages = [
              ...messages,
              {
                role: 'assistant' as const,
                content: message!.content,
              },
              {
                role: 'user' as const,
                content: [
                  {
                    type: 'tool_result' as const,
                    tool_use_id: toolUse.id,
                    content: JSON.stringify({
                      success: true,
                      display: toolResult.display.text,
                      keys_pressed: keys.length,
                    }),
                  },
                ],
              },
            ];

            // Get final response after tool use (also streamed)
            const finalStream = await anthropic.messages.stream({
              model: MODEL,
              max_tokens: 1024,
              system: SYSTEM_PROMPT,
              tools: [calculatorPressKeysTool],
              messages: finalMessages,
            });

            for await (const finalEvent of finalStream) {
              if (finalEvent.type === 'content_block_delta') {
                if (finalEvent.delta.type === 'text_delta') {
                  const token = finalEvent.delta.text;
                  fullText += token;
                  await writer.write(encoder.encode(sseEvent('token', { token })));
                }
              }
            }
          }
        }
      }

      // Send done event
      await writer.write(encoder.encode(sseEvent('done', { messageId, fullText })));
    } catch (error) {
      console.error('Stream error:', error);
      await writer.write(
        encoder.encode(sseEvent('error', { error: 'Failed to process request' }))
      );
    } finally {
      await writer.close();
    }
  })();

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

### 7.4 Bun Local Development Server

```ts
// apps/backend/src/dev-server.ts
import { anthropic, MODEL } from './anthropicClient';
import { calculatorPressKeysTool, handleCalculatorPressKeys } from './tools';
import type { ChatRequestBody, KeyId } from '@calculator/shared-types';
import { v4 as uuid } from 'uuid';

const PORT = process.env.PORT || 3001;

const SYSTEM_PROMPT = `
You are an assistant controlling a Casio-like calculator UI in the browser.

Rules:
- For any numeric calculator operation, you MUST use the "calculator_press_keys" tool.
- The browser holds the actual calculator state; this tool is for validating key sequences.
- After using the tool, provide a short natural language explanation of what you did.
- If the user request is not a calculator operation (like general chat), respond normally without using the tool.

Available keys:
- Digits: digit_0 through digit_9
- Decimal point: decimal
- Operations: add, sub, mul, div
- Equals: equals
- Clear: ac (all clear), c (clear entry)
- Memory: mc (clear), mr (recall), m_plus (add to memory), m_minus (subtract from memory)
- Percent: percent
- Currency: rate, euro, local
`;

function sseEvent(event: string, data: object): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

async function handleChat(req: Request): Promise<Response> {
  const body: ChatRequestBody = await req.json();
  const { message, history } = body;

  const messages = [
    ...(history ?? []).map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.text,
    })),
    { role: 'user' as const, content: message },
  ];

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  // Process in background
  (async () => {
    try {
      let fullText = '';
      let keys: KeyId[] = [];
      const messageId = uuid();

      const stream = await anthropic.messages.stream({
        model: MODEL,
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        tools: [calculatorPressKeysTool],
        messages,
      });

      for await (const event of stream) {
        if (event.type === 'content_block_delta') {
          if (event.delta.type === 'text_delta') {
            const token = event.delta.text;
            fullText += token;
            await writer.write(encoder.encode(sseEvent('token', { token })));
          }
        } else if (event.type === 'content_block_stop') {
          const message = stream.currentMessage;
          const toolUse = message?.content.find((c) => c.type === 'tool_use');

          if (toolUse && toolUse.type === 'tool_use') {
            const toolInput = toolUse.input as { keys: KeyId[] };
            const toolResult = handleCalculatorPressKeys(toolInput.keys);
            keys = toolResult.keys;

            await writer.write(encoder.encode(sseEvent('keys', { keys })));

            const finalMessages = [
              ...messages,
              { role: 'assistant' as const, content: message!.content },
              {
                role: 'user' as const,
                content: [
                  {
                    type: 'tool_result' as const,
                    tool_use_id: toolUse.id,
                    content: JSON.stringify({
                      success: true,
                      display: toolResult.display.text,
                      keys_pressed: keys.length,
                    }),
                  },
                ],
              },
            ];

            const finalStream = await anthropic.messages.stream({
              model: MODEL,
              max_tokens: 1024,
              system: SYSTEM_PROMPT,
              tools: [calculatorPressKeysTool],
              messages: finalMessages,
            });

            for await (const finalEvent of finalStream) {
              if (finalEvent.type === 'content_block_delta') {
                if (finalEvent.delta.type === 'text_delta') {
                  const token = finalEvent.delta.text;
                  fullText += token;
                  await writer.write(encoder.encode(sseEvent('token', { token })));
                }
              }
            }
          }
        }
      }

      await writer.write(encoder.encode(sseEvent('done', { messageId, fullText })));
    } catch (error) {
      console.error('Stream error:', error);
      await writer.write(
        encoder.encode(sseEvent('error', { error: 'Failed to process request' }))
      );
    } finally {
      await writer.close();
    }
  })();

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);

    // CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    // Chat endpoint
    if (url.pathname === '/api/chat' && req.method === 'POST') {
      return handleChat(req);
    }

    // Health check
    if (url.pathname === '/health') {
      return new Response('OK', { status: 200 });
    }

    return new Response('Not Found', { status: 404 });
  },
});

console.log(`🚀 Dev server running on http://localhost:${PORT}`);
``` 


---

## 8. Configuration Files

### 8.1 Bun Workspace Configuration

```toml
# bunfig.toml
[install]
auto = true

[workspace]
packages = ["packages/*", "apps/*"]
```

### 8.2 Root package.json

```json
{
  "name": "calculator-casio-llm",
  "private": true,
  "workspaces": ["packages/*", "apps/*"],
  "scripts": {
    "dev": "bun run --parallel dev:frontend dev:backend",
    "dev:frontend": "cd apps/frontend && bun run dev",
    "dev:backend": "cd apps/backend && bun run dev",
    "build": "bun run build:packages && bun run build:apps",
    "build:packages": "cd packages/shared-types && bun run build && cd ../calculator-engine && bun run build",
    "build:apps": "cd apps/frontend && bun run build"
  }
}
```

### 8.3 Vercel Configuration

```json
// vercel.json
{
  "buildCommand": "bun run build",
  "outputDirectory": "apps/frontend/dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/api/:path*", "destination": "/api/:path*" }
  ],
  "functions": {
    "apps/backend/api/*.ts": {
      "runtime": "@vercel/node@3"
    }
  }
}
```

### 8.4 Backend package.json

```json
{
  "name": "@calculator/backend",
  "version": "1.0.0",
  "scripts": {
    "dev": "bun --watch src/dev-server.ts",
    "start": "bun src/dev-server.ts"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.24.0",
    "@calculator/calculator-engine": "workspace:*",
    "@calculator/shared-types": "workspace:*",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "@types/uuid": "^9.0.0"
  }
}
```

### 8.5 Frontend package.json

```json
{
  "name": "@calculator/frontend",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@calculator/calculator-engine": "workspace:*",
    "@calculator/shared-types": "workspace:*",
    "idb": "^8.0.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "uuid": "^9.0.0",
    "zustand": "^4.5.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@types/uuid": "^9.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.4.0",
    "vite": "^5.4.0"
  }
}
```

---

## 9. Environment Variables

```bash
# Backend (.env)
ANTHROPIC_API_KEY=sk-ant-xxx

# Frontend (.env for local dev)
VITE_API_URL=http://localhost:3001
```

---

## 10. Quotas & Claude Cost Notes

- **Per-browser soft limit** using IndexedDB and `quotaDB.canMakeCall()/recordCall()` (see §6.3).
- On Anthropic side:
  - Set **low monthly hard limit** in the console (e.g., $10).
  - Use Claude Haiku for cost efficiency.
- Rough math:
  - Claude 3.5 Haiku: ~$0.25/1M input, ~$1.25/1M output tokens
  - ~1k tokens per interaction (`prompt + response`).
  - Approximately **8k-10k calls** for $10.

---

## 11. Migration Notes from v1

| Aspect | v1 | v2 |
|--------|----|----|
| LLM | OpenAI (gpt-4.1-mini) | Anthropic Claude Haiku |
| Communication | REST API (fetch) | Server-Sent Events (SSE) |
| Runtime | Node.js (Vercel) | Bun (local) + Vercel Edge (prod) |
| Storage | localStorage | IndexedDB |
| State Persistence | Zustand persist middleware | Manual IndexedDB sync |
| Response Style | Wait for full response | Stream tokens in real-time |

### Benefits of v2 Stack:
1. **SSE Streaming**: Real-time token-by-token display, better UX
2. **Bun**: Faster local development, native TypeScript
3. **IndexedDB**: More storage capacity, better for structured data, async API
4. **Claude Haiku**: Competitive pricing, strong tool use support, fast responses
5. **Vercel Compatible**: Edge runtime supports SSE without timeouts
