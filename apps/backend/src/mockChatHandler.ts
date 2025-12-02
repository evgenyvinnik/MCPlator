import type { ChatRequestBody } from '@calculator/shared-types';
import { getMockResponse } from './mockLLM';
import { v4 as uuid } from 'uuid';

function sseEvent(event: string, data: object): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

/**
 * Mock chat handler that simulates LLM responses without calling Anthropic API
 * This is useful for local development and testing the UI
 */
export async function handleMockChat(req: Request): Promise<Response> {
  const body: ChatRequestBody = await req.json();
  const { message } = body;

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  // Process in background
  (async () => {
    try {
      const messageId = uuid();
      const mockResponse = getMockResponse(message);

      // Simulate streaming by sending the response word by word
      const words = mockResponse.text.split(' ');
      let fullText = '';

      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const token = i === 0 ? word : ' ' + word;
        fullText += token;
        
        await writer.write(encoder.encode(sseEvent('token', { token })));
        
        // Add a small delay to simulate streaming
        await new Promise((resolve) => setTimeout(resolve, 30));
      }

      // If we have keys, send them
      if (mockResponse.keys && mockResponse.keys.length > 0) {
        await writer.write(encoder.encode(sseEvent('keys', { keys: mockResponse.keys })));
      }

      // Send done event
      await writer.write(encoder.encode(sseEvent('done', { messageId, fullText })));
    } catch (error) {
      console.error('Mock stream error:', error);
      await writer.write(
        encoder.encode(sseEvent('error', { error: 'Failed to process request' }))
      );
    } finally {
      await writer.close();
    }
  })();

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
