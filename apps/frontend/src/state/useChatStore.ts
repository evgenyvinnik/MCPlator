/**
 * @fileoverview Chat state management using Zustand.
 *
 * This module manages the AI chat conversation state, including message history,
 * streaming responses, and persistence to IndexedDB.
 *
 * @module state/useChatStore
 */

import { create } from 'zustand';
import type { ChatMessage } from '@calculator/shared-types';
import { chatDB } from '../db/chatDB';

/**
 * State shape for the chat store.
 */
type ChatState = {
  /** Array of all chat messages (user and assistant) */
  messages: ChatMessage[];
  /** Currently streaming assistant message (partial response) */
  streamingMessage: { id: string; text: string } | null;
  /** Whether the AI is currently processing a request */
  isThinking: boolean;
  /** Whether messages have been loaded from IndexedDB */
  isHydrated: boolean;
};

/**
 * Actions available on the chat store.
 */
type ChatActions = {
  /** Add a complete message and persist to IndexedDB */
  addMessage: (msg: ChatMessage) => Promise<void>;
  /** Update the streaming message with new text chunks */
  updateStreamingMessage: (id: string, text: string) => void;
  /** Clear the streaming message after it completes */
  clearStreamingMessage: () => void;
  /** Set the thinking indicator state */
  setIsThinking: (val: boolean) => void;
  /** Clear all messages from state and IndexedDB */
  clear: () => Promise<void>;
  /** Load messages from IndexedDB on startup */
  hydrate: () => Promise<void>;
};

/**
 * Zustand store for chat state management.
 *
 * Manages the AI chat conversation including:
 * - Complete message history
 * - Real-time streaming message updates
 * - Thinking/loading states
 * - Persistence to IndexedDB
 *
 * @example
 * ```tsx
 * // In a component
 * const { messages, streamingMessage, isThinking, addMessage } = useChatStore();
 *
 * // Add a new message
 * await addMessage({
 *   id: 'msg-1',
 *   role: 'user',
 *   text: 'Calculate 5 + 3',
 *   createdAt: new Date().toISOString()
 * });
 *
 * // Update streaming message as tokens arrive
 * updateStreamingMessage('msg-2', 'I will calculate...');
 * ```
 */
export const useChatStore = create<ChatState & ChatActions>()((set) => ({
  messages: [],
  streamingMessage: null,
  isThinking: false,
  isHydrated: false,

  /**
   * Loads all messages from IndexedDB on app startup.
   * Sets isHydrated to true when complete.
   */
  hydrate: async () => {
    const messages = await chatDB.getAllMessages();
    set({ messages, isHydrated: true });
  },

  /**
   * Adds a complete message to the store and persists it to IndexedDB.
   * Also clears any streaming message since it's now complete.
   *
   * @param msg - The chat message to add
   */
  addMessage: async (msg) => {
    await chatDB.addMessage(msg);
    set((state) => ({
      messages: [...state.messages, msg],
      streamingMessage: null,
    }));
  },

  /**
   * Updates the streaming message with accumulated text.
   * Called as SSE tokens arrive from the backend.
   *
   * @param id - The message ID for the streaming response
   * @param text - The accumulated text so far
   */
  updateStreamingMessage: (id, text) => {
    set({ streamingMessage: { id, text } });
  },

  /**
   * Clears the streaming message state.
   * Called when streaming completes or is cancelled.
   */
  clearStreamingMessage: () => {
    set({ streamingMessage: null });
  },

  /**
   * Sets the thinking indicator state.
   * @param val - True when AI is processing, false otherwise
   */
  setIsThinking: (val) => set({ isThinking: val }),

  /**
   * Clears all messages from state and IndexedDB.
   * Used for resetting the conversation.
   */
  clear: async () => {
    await chatDB.clearMessages();
    set({ messages: [], streamingMessage: null });
  },
}));
