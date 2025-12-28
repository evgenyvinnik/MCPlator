export type ChatRole = 'user' | 'assistant';

export type ChatMessageType = 'message' | 'result';

import type { KeyId } from './calculator';

export type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
  createdAt: string; // ISO timestamp
  type?: ChatMessageType; // defaults to 'message'
  keys?: KeyId[]; // Keys pressed by LLM for result messages
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
