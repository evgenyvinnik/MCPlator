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

export const useChatStore = create<ChatState & ChatActions>()((set) => ({
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
}));
