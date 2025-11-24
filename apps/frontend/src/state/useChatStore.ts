import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChatMessage } from '@calculator/shared-types';

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
    },
  ),
);
