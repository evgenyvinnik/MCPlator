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
          onDone: async (_messageId, fullText) => {
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
