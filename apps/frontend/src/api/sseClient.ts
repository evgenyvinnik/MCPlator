/**
 * @fileoverview Server-Sent Events (SSE) client for chat streaming.
 *
 * Handles real-time streaming of AI responses using the SSE protocol.
 * Parses the text/event-stream format and dispatches events to callbacks.
 *
 * @module api/sseClient
 */

import type { ChatRequestBody } from '../types';

/** Length of "event: " prefix in SSE format */
const SSE_EVENT_PREFIX_LENGTH = 7;

/** Length of "data: " prefix in SSE format */
const SSE_DATA_PREFIX_LENGTH = 6;

/**
 * Callbacks for handling different SSE event types.
 */
export type SSECallbacks = {
  /** Called for each text token as it streams in */
  onToken: (token: string) => void;
  /** Called when the AI returns calculator key sequences to execute */
  onKeys: (keys: string[]) => void;
  /** Called when the response is complete with final message */
  onDone: (messageId: string, fullText: string) => void;
  /** Called when an error occurs */
  onError: (error: string) => void;
};

/**
 * Streams a chat message to the backend and processes SSE responses.
 *
 * Makes a POST request to /api/chat with the message and history,
 * then processes the streaming response using the SSE protocol.
 *
 * SSE Event Format:
 * ```
 * event: <event-type>
 * data: <json-payload>
 *
 * ```
 *
 * Supported event types:
 * - `token`: Partial text chunk `{ token: string }`
 * - `keys`: Calculator key sequence `{ keys: string[] }`
 * - `done`: Final message `{ messageId: string, fullText: string }`
 * - `error`: Error message `{ error: string }`
 *
 * @param body - The chat request body with message and history
 * @param callbacks - Event handlers for different SSE event types
 * @param signal - Optional AbortSignal for cancellation
 * @throws Error if the HTTP response is not OK or no response body
 *
 * @example
 * ```ts
 * await streamChat(
 *   { message: "Calculate 5 + 3", history: [] },
 *   {
 *     onToken: (token) => console.log('Token:', token),
 *     onKeys: (keys) => console.log('Keys to press:', keys),
 *     onDone: (id, text) => console.log('Complete:', text),
 *     onError: (err) => console.error('Error:', err),
 *   },
 *   abortController.signal
 * );
 * ```
 */
export async function streamChat(
  body: ChatRequestBody,
  callbacks: SSECallbacks,
  signal?: AbortSignal
): Promise<void> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
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

      // Append decoded chunk to buffer (stream: true handles partial UTF-8)
      buffer += decoder.decode(value, { stream: true });

      // Parse SSE events from buffer
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer

      let eventType = '';
      let eventData = '';

      for (const line of lines) {
        if (line.startsWith('event: ')) {
          eventType = line.slice(SSE_EVENT_PREFIX_LENGTH);
        } else if (line.startsWith('data: ')) {
          eventData = line.slice(SSE_DATA_PREFIX_LENGTH);
        } else if (line === '' && eventType && eventData) {
          // End of event (blank line), process it
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
            callbacks.onError('Failed to parse server response');
          }

          // Reset for next event
          eventType = '';
          eventData = '';
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
