# Casio LLM Calculator – System Design Spec

## 0. Project Summary

A web-based emulation of a Casio-style calculator with:

- **Pixel-ish accurate UI** (buttons, LCD, indicators).
- **Real calculator behavior** implemented in a **frontend engine** (JS/TS).
- **LLM-powered chat** that:
  - Understands natural language (“add 2 plus one hundred”).
  - Produces calculator key sequences.
  - The frontend replays those key sequences visually on the calculator.
- **State stored in the browser** (localStorage):
  - Calculator memory, rates, etc.
  - Chat history (for vibes, not correctness).
  - Soft usage quotas.

Backend is **minimal**:

- Runs on **Vercel** as serverless functions.
- Only responsibility: call OpenAI (with tools) and return `{ message, animation }`.

No MCP server, no Redis, no DB.

---

## 1. Tech Stack

### Frontend

- **Framework:** React + TypeScript
- **Build:** Vite
- **State management:** Zustand + `persist` middleware
- **Styling:** Tailwind (or StyleX; either is fine)
- **Storage:**
  - `localStorage` for:
    - Calculator engine state (including memory).
    - Chat history.
    - Simple per-browser LLM quota.

### Backend

- **Platform:** Vercel
- **Runtime:** Node.js (serverless functions)
- **HTTP:** Vercel API routes (no long-lived Express server)
- **OpenAI client:** `openai` Node SDK
- **Tools:** OpenAI tools/functions implemented directly in the backend
- **No:** DB, Redis, MCP server in v1

### Shared

- **Monorepo (pnpm/yarn workspace)** with shared packages:
  - `packages/shared-types`
  - `packages/calculator-engine`

---

## 2. Monorepo Structure

```text
calculator-casio-llm/
  package.json
  pnpm-workspace.yaml
  tsconfig.base.json

  packages/
    shared-types/
      src/
        calculator.ts
        chat.ts
        index.ts

    calculator-engine/
      src/
        types.ts
        index.ts

  apps/
    frontend/
      src/
        calculator/
          engine.ts
          engineTypes.ts
        state/
          useCalculatorStore.ts
          useChatStore.ts
        hooks/
          useAnimationRunner.ts
          useSendChat.ts
        components/
          CalculatorSurface.tsx
          LCDDisplay.tsx
          Keypad.tsx
          ChatPanel.tsx
        main.tsx
        App.tsx

    backend/
      api/
        chat.ts          # POST /api/chat (Vercel function)
      src/
        openaiClient.ts  # OpenAI SDK init if needed
        (optional) other helpers
```

---

## 3. Shared Types (`packages/shared-types`)

### 3.1 Calculator types

```ts
// packages/shared-types/src/calculator.ts

export type KeyId =
  | 'digit_0'
  | 'digit_1'
  | 'digit_2'
  | 'digit_3'
  | 'digit_4'
  | 'digit_5'
  | 'digit_6'
  | 'digit_7'
  | 'digit_8'
  | 'digit_9'
  | 'decimal'
  | 'add'
  | 'sub'
  | 'mul'
  | 'div'
  | 'percent'
  | 'equals'
  | 'ac'
  | 'c'
  | 'mc'
  | 'mr'
  | 'm_plus'
  | 'm_minus';

export type CalculatorIndicators = {
  error: boolean; // E
  memory: boolean; // M
  constant: boolean; // K
  op: null | 'add' | 'sub' | 'mul' | 'div';
};

export type CalculatorDisplay = {
  text: string; // e.g., "0.", "11.4", "E"
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

### 3.2 Chat types

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

export type ChatResponseBody = {
  message: ChatMessage;
  animation?: AnimationSequence;
};
```

---

## 4. Calculator Engine (`packages/calculator-engine`)

Goal: single canonical implementation of calculator behavior, shared by frontend and backend (backend uses it only for tool validation; frontend uses it as the real state holder).

### 4.1 Types

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
};

export type CalculatorEngine = {
  initialState: () => CalculatorInternalState;
  pressKey: (
    state: CalculatorInternalState,
    key: KeyId
  ) => CalculatorInternalState;
  toDisplay: (state: CalculatorInternalState) => CalculatorDisplay;
};
```

### 4.2 Skeleton implementation

```ts
// packages/calculator-engine/src/index.ts
import type { CalculatorEngine, CalculatorInternalState } from './types';
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
  }),

  pressKey: (state, key) => {
    // TODO: implement full Casio logic here (AC/C, %, memory keys, constants)
    return state;
  },

  toDisplay: (state): CalculatorDisplay => ({
    text: state.isError ? 'E' : state.displayValue,
    indicators: {
      error: state.isError,
      memory: state.hasMemory,
      constant: !!state.constant,
      op: state.lastOperator,
    },
  }),
};
```

---

## 5. Frontend State & Behavior (`apps/frontend`)

### 5.1 Calculator store (Zustand + localStorage)

Calculator state (including memory etc.) is **persistent** across reloads.

```ts
// apps/frontend/src/state/useCalculatorStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { calculatorEngine } from '@calculator/calculator-engine';
import type {
  CalculatorDisplay,
  AnimationSequence,
  KeyId,
} from '@calculator/shared-types';
import type { CalculatorInternalState } from '@calculator/calculator-engine';

type CalculatorStoreState = {
  internalState: CalculatorInternalState;
  display: CalculatorDisplay;
  pressedKey: KeyId | null;
  isAnimating: boolean;
  animationQueue: AnimationSequence[];
};

type CalculatorStoreActions = {
  pressKey: (key: KeyId) => void;
  enqueueAnimation: (sequence: AnimationSequence) => void;
  setPressedKey: (key: KeyId | null) => void;
  setIsAnimating: (val: boolean) => void;
};

const STORAGE_KEY = 'casio_calculator_state_v1';

export const useCalculatorStore = create<
  CalculatorStoreState & CalculatorStoreActions
>()(
  persist(
    (set, get) => ({
      internalState: calculatorEngine.initialState(),
      display: calculatorEngine.toDisplay(calculatorEngine.initialState()),
      pressedKey: null,
      isAnimating: false,
      animationQueue: [],

      pressKey: (key) => {
        const current = get().internalState;
        const next = calculatorEngine.pressKey(current, key);
        const display = calculatorEngine.toDisplay(next);
        set({ internalState: next, display });
      },

      enqueueAnimation: (sequence) => {
        set((state) => ({
          animationQueue: [...state.animationQueue, sequence],
        }));
      },

      setPressedKey: (key) => set({ pressedKey: key }),
      setIsAnimating: (val) => set({ isAnimating: val }),
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({
        internalState: state.internalState,
        display: state.display,
      }),
    }
  )
);
```

### 5.2 Chat store (with “thinking” state, in localStorage)

```ts
// apps/frontend/src/state/useChatStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChatMessage, ChatRole } from '@calculator/shared-types';

type ChatState = {
  messages: ChatMessage[];
  isThinking: boolean;
};

type ChatActions = {
  addMessage: (msg: ChatMessage) => void;
  setIsThinking: (val: boolean) => void;
  clear: () => void;
};

export const useChatStore = create<ChatState & ChatActions>()(
  persist(
    (set) => ({
      messages: [],
      isThinking: false,
      addMessage: (msg) =>
        set((state) => ({ messages: [...state.messages, msg] })),
      setIsThinking: (val) => set({ isThinking: val }),
      clear: () => set({ messages: [] }),
    }),
    {
      name: 'casio_chat_history_v1',
    }
  )
);
```

### 5.3 Animation runner hook

```ts
// apps/frontend/src/hooks/useAnimationRunner.ts
import { useEffect } from 'react';
import { useCalculatorStore } from '../state/useCalculatorStore';
import type { AnimationCommand } from '@calculator/shared-types';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const useAnimationRunner = () => {
  const { animationQueue, isAnimating, setIsAnimating, setPressedKey } =
    useCalculatorStore();

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
          // apply logic to calculator
          pressKey(cmd.key);
        } else if (cmd.type === 'setDisplay') {
          // optional: you could force a display override here
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

Mount `useAnimationRunner()` once at app root (`<App />`) to keep animations running.

### 5.4 Per-browser quota (soft limit, localStorage)

```ts
// apps/frontend/src/quota.ts
const STORAGE_KEY = 'casio_llm_quota_v1';
const DEFAULT_LIMIT = 100;

type QuotaState = {
  date: string; // YYYY-MM-DD
  callsUsed: number;
  dailyLimit: number;
};

const todayStr = () => new Date().toISOString().slice(0, 10);

const loadQuota = (): QuotaState => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { date: todayStr(), callsUsed: 0, dailyLimit: DEFAULT_LIMIT };
    }
    const parsed = JSON.parse(raw) as QuotaState;
    if (parsed.date !== todayStr()) {
      return { date: todayStr(), callsUsed: 0, dailyLimit: parsed.dailyLimit };
    }
    return parsed;
  } catch {
    return { date: todayStr(), callsUsed: 0, dailyLimit: DEFAULT_LIMIT };
  }
};

const saveQuota = (q: QuotaState) => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(q));
};

export const canMakeCall = () => {
  const q = loadQuota();
  return q.callsUsed < q.dailyLimit;
};

export const recordCall = () => {
  const q = loadQuota();
  const updated: QuotaState = {
    ...q,
    date: todayStr(),
    callsUsed: q.callsUsed + 1,
  };
  saveQuota(updated);
};
```

### 5.5 `useSendChat` hook (frontend → backend call)

```ts
// apps/frontend/src/hooks/useSendChat.ts
import { useChatStore } from '../state/useChatStore';
import { useCalculatorStore } from '../state/useCalculatorStore';
import type {
  ChatRequestBody,
  ChatResponseBody,
} from '@calculator/shared-types';
import { canMakeCall, recordCall } from '../quota';
import { v4 as uuid } from 'uuid';

export const useSendChat = () => {
  const { messages, addMessage, setIsThinking } = useChatStore();
  const enqueueAnimation = useCalculatorStore((s) => s.enqueueAnimation);

  return async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    if (!canMakeCall()) {
      addMessage({
        id: uuid(),
        role: 'assistant',
        text: "You've reached today's calculator brain quota. Try again tomorrow 🙂",
        createdAt: new Date().toISOString(),
      });
      return;
    }

    const now = new Date().toISOString();
    const userMsg = {
      id: uuid(),
      role: 'user' as const,
      text: trimmed,
      createdAt: now,
    };
    addMessage(userMsg);
    setIsThinking(true);

    recordCall();

    try {
      const body: ChatRequestBody = {
        message: trimmed,
        history: messages.slice(-6).map((m) => ({
          role: m.role,
          text: m.text,
        })),
      };

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data: ChatResponseBody = await res.json();

      addMessage(data.message);
      if (data.animation) {
        enqueueAnimation(data.animation);
      }
    } catch (err) {
      addMessage({
        id: uuid(),
        role: 'assistant',
        text: 'Sorry, something went wrong talking to the calculator brain.',
        createdAt: new Date().toISOString(),
      });
    } finally {
      setIsThinking(false);
    }
  };
};
```

---

## 6. Backend Vercel Function (`apps/backend/api/chat.ts`)

Single endpoint: `POST /api/chat`.

- Input: `ChatRequestBody`
- Output: `ChatResponseBody`
- Uses OpenAI **tools** (Level 2, no MCP server).

```ts
// apps/backend/api/chat.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { OpenAI } from 'openai';
import { calculatorEngine } from '@calculator/calculator-engine';
import type { KeyId } from '@calculator/calculator-engine';
import type {
  ChatRequestBody,
  ChatResponseBody,
} from '@calculator/shared-types';
import { v4 as uuid } from 'uuid';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const calculatorPressKeysTool = {
  name: 'calculator_press_keys',
  description: 'Simulate pressing calculator keys in order.',
  input_schema: {
    type: 'object',
    properties: {
      keys: {
        type: 'array',
        items: {
          type: 'string',
          enum: [
            'digit_0',
            'digit_1',
            'digit_2',
            'digit_3',
            'digit_4',
            'digit_5',
            'digit_6',
            'digit_7',
            'digit_8',
            'digit_9',
            'decimal',
            'add',
            'sub',
            'mul',
            'div',
            'percent',
            'equals',
            'ac',
            'c',
            'mc',
            'mr',
            'm_plus',
            'm_minus',
          ],
        },
      },
    },
    required: ['keys'],
  },
} as const;

const handleCalculatorPressKeys = (keys: KeyId[]) => {
  let state = calculatorEngine.initialState();
  for (const key of keys) {
    state = calculatorEngine.pressKey(state, key);
  }
  const display = calculatorEngine.toDisplay(state);
  return { display, keys };
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).end('Method not allowed');
    return;
  }

  const body = req.body as ChatRequestBody;
  const { message, history } = body;

  const systemPrompt = `
You are an assistant controlling a Casio-like calculator UI in the browser.

Rules:
- For any numeric calculator operation, you MUST use the "calculator_press_keys" tool.
- The browser holds the actual calculator state; this tool is for validating key sequences and seeing the resulting display.
- In your final answer to the user, do two things:
  1) Provide a short natural language explanation.
  2) Include at the very end a JSON block like: {"keys":["digit_1","digit_0","digit_0","add","digit_2","equals"]}

If the user request is not a calculator operation, do NOT call the tool and answer normally. In that case, the JSON block must have an empty "keys" array.
`;

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    ...(history ?? []).map((m) => ({
      role: m.role,
      content: m.text,
    })),
    { role: 'user' as const, content: message },
  ];

  const response = await openai.responses.create({
    model: 'gpt-4.1-mini', // or gpt-5-mini, depending on what you pick
    messages,
    tools: [calculatorPressKeysTool],
  });

  // Pseudo-code parsing; adjust to actual Responses API structure.
  let assistantText = '';
  let keys: KeyId[] = [];

  for (const item of response.output) {
    for (const part of item.content) {
      if (part.type === 'tool_call' && part.name === 'calculator_press_keys') {
        const args = part.arguments as { keys: KeyId[] };
        const toolResult = handleCalculatorPressKeys(args.keys);
        keys = toolResult.keys;
      } else if (part.type === 'output_text') {
        assistantText += part.text;
      }
    }
  }

  const now = new Date().toISOString();
  const payload: ChatResponseBody = {
    message: {
      id: uuid(),
      role: 'assistant',
      text: assistantText,
      createdAt: now,
    },
    animation: keys.length
      ? {
          id: uuid(),
          commands: keys.map((k) => ({
            type: 'pressKey' as const,
            key: k,
            delayMs: 180,
          })),
        }
      : undefined,
  };

  res.status(200).json(payload);
}
```

---

## 7. Quotas & OpenAI Cost Notes

- **Per-browser soft limit** using `localStorage` and `canMakeCall()/recordCall()` (see §5.4).
- On OpenAI side:
  - Set **low monthly hard limit** in the billing dashboard (e.g. $10).
  - Use a cheap model (e.g. `gpt-4.1-mini` / `gpt-5-mini`).
- Rough math:
  - ~1k tokens per interaction (`prompt + answer`).
  - Mini models: on the order of **10k–20k calls** for $10.
