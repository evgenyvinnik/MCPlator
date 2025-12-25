import { anthropic, MODEL } from '../src/anthropicClient';
import { calculatorPressKeysTool, handleCalculatorPressKeys } from '../src/tools';
import type { ChatRequestBody, KeyId } from '@calculator/shared-types';
import { v4 as uuid } from 'uuid';

export const config = {
  runtime: 'edge', // Use Edge runtime for streaming
};

const SYSTEM_PROMPT = `
You are an assistant controlling a Casio-like calculator UI in the browser.

Rules:
- For any numeric calculator operation, you MUST use the "calculator_press_keys" tool.
- ALWAYS start key sequences with "ac" (all clear) to reset the calculator before entering new calculations.
- The browser holds the actual calculator state; this tool is for specifying key sequences.
- After using the tool, provide a short natural language explanation of what you did.
- If the user request is not a calculator operation (like general chat), respond normally without using the tool.

Available keys:
- Digits: digit_0 through digit_9
- Decimal point: decimal
- Operations: add, sub, mul, div
- Equals: equals
- Clear: ac (all clear - USE THIS FIRST), c (clear entry)
- Memory: mc (clear), mr (recall), m_plus (add to memory), m_minus (subtract from memory)
- Percent: percent
- Currency: rate, euro, local

Example: To calculate 2 + 3, use keys: ["ac", "digit_2", "add", "digit_3", "equals"]
`;

// Helper to format SSE events
function sseEvent(event: string, data: object): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const body: ChatRequestBody = await req.json();
  const { message, history } = body;

  const messages = [
    ...(history ?? []).map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.text,
    })),
    { role: 'user' as const, content: message },
  ];

  // Create a TransformStream for SSE
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  // Process in background
  (async () => {
    try {
      let fullText = '';
      let keys: KeyId[] = [];
      const messageId = uuid();

      // Initial request with streaming
      const stream = await anthropic.messages.stream({
        model: MODEL,
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        tools: [calculatorPressKeysTool],
        messages,
      });

      for await (const event of stream) {
        if (event.type === 'content_block_delta') {
          if (event.delta.type === 'text_delta') {
            const token = event.delta.text;
            fullText += token;
            await writer.write(encoder.encode(sseEvent('token', { token })));
          }
        } else if (event.type === 'content_block_stop') {
          // Check if we have a tool use
          const message = stream.currentMessage;
          const toolUse = message?.content.find((c) => c.type === 'tool_use');
          
          if (toolUse && toolUse.type === 'tool_use') {
            const toolInput = toolUse.input as { keys: KeyId[] };
            const toolResult = handleCalculatorPressKeys(toolInput.keys);
            keys = toolResult.keys;

            // Send keys event immediately
            await writer.write(encoder.encode(sseEvent('keys', { keys })));

            // Continue conversation with tool result for final response
            const finalMessages = [
              ...messages,
              {
                role: 'assistant' as const,
                content: message!.content,
              },
              {
                role: 'user' as const,
                content: [
                  {
                    type: 'tool_result' as const,
                    tool_use_id: toolUse.id,
                    content: JSON.stringify({
                      success: true,
                      display: toolResult.display.text,
                      keys_pressed: keys.length,
                    }),
                  },
                ],
              },
            ];

            // Get final response after tool use (also streamed)
            const finalStream = await anthropic.messages.stream({
              model: MODEL,
              max_tokens: 1024,
              system: SYSTEM_PROMPT,
              tools: [calculatorPressKeysTool],
              messages: finalMessages,
            });

            for await (const finalEvent of finalStream) {
              if (finalEvent.type === 'content_block_delta') {
                if (finalEvent.delta.type === 'text_delta') {
                  const token = finalEvent.delta.text;
                  fullText += token;
                  await writer.write(encoder.encode(sseEvent('token', { token })));
                }
              }
            }
          }
        }
      }

      // Send done event
      await writer.write(encoder.encode(sseEvent('done', { messageId, fullText })));
    } catch (error) {
      console.error('Stream error:', error);
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
    },
  });
}
