import type { KeyId } from './calculator';

/**
 * SSE event types sent from server to client during streaming responses
 */
export type SSEEventType = 
  | 'token'      // Streaming text token
  | 'keys'       // Calculator keys to animate
  | 'done'       // Stream complete
  | 'error';     // Error occurred

/**
 * Event sent for each token streamed from the LLM
 */
export type SSETokenEvent = {
  type: 'token';
  data: {
    token: string;
  };
};

/**
 * Event sent when calculator tool use is detected, containing keys to animate
 */
export type SSEKeysEvent = {
  type: 'keys';
  data: {
    keys: KeyId[];
  };
};

/**
 * Event sent when streaming is complete, containing the full response text
 */
export type SSEDoneEvent = {
  type: 'done';
  data: {
    messageId: string;
    fullText: string;
  };
};

/**
 * Event sent when an error occurs during streaming
 */
export type SSEErrorEvent = {
  type: 'error';
  data: {
    error: string;
  };
};

/**
 * Union of all possible SSE event types
 */
export type SSEEvent = 
  | SSETokenEvent 
  | SSEKeysEvent 
  | SSEDoneEvent 
  | SSEErrorEvent;
