/**
 * @fileoverview Hook for managing streaming chat with the AI backend.
 *
 * Orchestrates the entire chat flow including:
 * - Quota validation
 * - SSE streaming
 * - Animation queue management
 * - Message persistence
 *
 * @module api/useStreamingChat
 */

import { useCallback, useRef, useState } from 'react';
import { useChatStore } from '../state/useChatStore';
import { useCalculatorStore } from '../state/useCalculatorStore';
import { quotaDB } from '../db/quotaDB';
import { streamChat } from './sseClient';
import type { KeyId } from '../types/calculator';
import { v4 as uuid } from 'uuid';

/**
 * Hook for sending chat messages with SSE streaming support.
 *
 * Provides the complete chat interaction flow:
 * 1. Validates daily quota (100 API calls/day)
 * 2. Adds user message to store and IndexedDB
 * 3. Streams response via SSE, showing tokens in real-time
 * 4. Queues calculator key animations when AI returns keys
 * 5. Adds result message after animation completes
 *
 * @returns Object containing:
 * - `sendChat`: Function to send a chat message
 * - `cancelStream`: Function to abort the current stream
 * - `isStreaming`: Boolean indicating if currently streaming
 *
 * @example
 * ```tsx
 * function ChatInput() {
 *   const { sendChat, isStreaming, cancelStream } = useStreamingChat();
 *
 *   const handleSubmit = async (text: string) => {
 *     await sendChat(text);
 *   };
 *
 *   return (
 *     <div>
 *       <input disabled={isStreaming} />
 *       {isStreaming && <button onClick={cancelStream}>Cancel</button>}
 *     </div>
 *   );
 * }
 * ```
 */
export const useStreamingChat = () => {
  const { messages, addMessage, updateStreamingMessage, setIsThinking } =
    useChatStore();
  const enqueueAnimation = useCalculatorStore((s) => s.enqueueAnimation);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Sends a chat message to the AI backend with streaming response.
   *
   * Flow:
   * 1. Validates input and checks quota
   * 2. Adds user message to chat
   * 3. Streams AI response, updating UI in real-time
   * 4. Queues button animations when AI returns key sequences
   * 5. Adds result message when animation completes
   *
   * @param text - The message text to send
   */
  const sendChat = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isStreaming) return;

      // Check daily quota
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

      // Add user message to store
      const userMsg = {
        id: uuid(),
        role: 'user' as const,
        text: trimmed,
        createdAt: new Date().toISOString(),
      };
      await addMessage(userMsg);

      // Record quota usage
      await quotaDB.recordCall();

      // Start streaming state
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
            // Send last 6 messages as context
            history: messages.slice(-6).map((m) => ({
              role: m.role,
              text: m.text,
            })),
          },
          {
            // Handle streaming tokens
            onToken: (token) => {
              streamedText += token;
              updateStreamingMessage(assistantMsgId, streamedText);
            },
            // Handle calculator key sequences from AI
            onKeys: (keys) => {
              const animationId = uuid();
              const pressedKeys = keys.map((k) => k as KeyId);
              enqueueAnimation(
                {
                  id: animationId,
                  commands: pressedKeys.map((k) => ({
                    type: 'pressKey' as const,
                    key: k,
                    delayMs: 180,
                  })),
                },
                // Callback when animation completes - add result message
                async (displayText) => {
                  await addMessage({
                    id: uuid(),
                    role: 'assistant',
                    text: displayText,
                    type: 'result',
                    keys: pressedKeys,
                    createdAt: new Date().toISOString(),
                  });
                }
              );
            },
            // Handle completion
            onDone: async (_messageId, fullText) => {
              await addMessage({
                id: assistantMsgId,
                role: 'assistant',
                text: fullText,
                createdAt: new Date().toISOString(),
              });
            },
            // Handle errors from backend
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
        // Only show error if not user-initiated abort
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
    },
    [
      messages,
      addMessage,
      updateStreamingMessage,
      setIsThinking,
      enqueueAnimation,
      isStreaming,
    ]
  );

  /**
   * Cancels the current streaming request.
   * Aborts the fetch request, stopping any ongoing response.
   */
  const cancelStream = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  return { sendChat, cancelStream, isStreaming };
};
