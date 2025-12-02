import type { ChatRequestBody } from '@calculator/shared-types';

// SSE prefix lengths
const SSE_EVENT_PREFIX_LENGTH = 7;  // "event: ".length
const SSE_DATA_PREFIX_LENGTH = 6;   // "data: ".length

export type SSECallbacks = {
  onToken: (token: string) => void;
  onKeys: (keys: string[]) => void;
  onDone: (messageId: string, fullText: string) => void;
  onError: (error: string) => void;
};

export async function streamChat(
  body: ChatRequestBody,
  callbacks: SSECallbacks,
  signal?: AbortSignal
): Promise<void> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
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
          // End of event, process it
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
          
          eventType = '';
          eventData = '';
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
