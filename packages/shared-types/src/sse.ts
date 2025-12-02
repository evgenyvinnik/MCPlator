import type { KeyId } from './calculator';

// SSE event types sent from server to client
export type SSEEventType = 
  | 'token'      // Streaming text token
  | 'keys'       // Calculator keys to animate
  | 'done'       // Stream complete
  | 'error';     // Error occurred

export type SSETokenEvent = {
  type: 'token';
  data: {
    token: string;
  };
};

export type SSEKeysEvent = {
  type: 'keys';
  data: {
    keys: KeyId[];
  };
};

export type SSEDoneEvent = {
  type: 'done';
  data: {
    messageId: string;
    fullText: string;
  };
};

export type SSEErrorEvent = {
  type: 'error';
  data: {
    error: string;
  };
};

export type SSEEvent = 
  | SSETokenEvent 
  | SSEKeysEvent 
  | SSEDoneEvent 
  | SSEErrorEvent;
