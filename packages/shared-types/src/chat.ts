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

import type { AnimationSequence } from './calculator';

export type ChatResponseBody = {
  message: ChatMessage;
  animation?: AnimationSequence;
};
