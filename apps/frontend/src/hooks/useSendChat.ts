import { useChatStore } from '../state/useChatStore';
import { useCalculatorStore } from '../state/useCalculatorStore';
import type { ChatRequestBody, ChatResponseBody } from '@calculator/shared-types';
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
