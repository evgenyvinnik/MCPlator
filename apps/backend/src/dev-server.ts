import { anthropic, MODEL } from './anthropicClient';
import { calculatorPressKeysTool, handleCalculatorPressKeys } from './tools';
import type { ChatRequestBody, KeyId } from '@calculator/shared-types';
import { v4 as uuid } from 'uuid';
import { handleMockChat } from './mockChatHandler';

const DEFAULT_PORT = 3001;
const PORT = process.env.PORT || DEFAULT_PORT;
const USE_MOCK_LLM = process.env.USE_MOCK_LLM === 'true';

const SYSTEM_PROMPT = `
You are an assistant controlling a Casio-like calculator UI in the browser.

Rules:
- For any numeric calculator operation, you MUST use the "calculator_press_keys" tool.
- The browser holds the actual calculator state; this tool is for validating key sequences.
- After using the tool, provide a short natural language explanation of what you did.
- If the user request is not a calculator operation (like general chat), respond normally without using the tool.

Available keys:
- Digits: digit_0 through digit_9
- Decimal point: decimal
- Operations: add, sub, mul, div
- Equals: equals
- Clear: ac (all clear), c (clear entry)
- Memory: mc (clear), mr (recall), m_plus (add to memory), m_minus (subtract from memory)
- Percent: percent
- Currency: rate, euro, local
`;

function sseEvent(event: string, data: object): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

async function handleChat(req: Request): Promise<Response> {
  const body: ChatRequestBody = await req.json();
  const { message, history } = body;

  const messages = [
    ...(history ?? []).map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.text,
    })),
    { role: 'user' as const, content: message },
  ];

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  // Process in background
  (async () => {
    try {
      let fullText = '';
      let keys: KeyId[] = [];
      const messageId = uuid();

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
          const message = stream.currentMessage;
          const toolUse = message?.content.find((c) => c.type === 'tool_use');

          if (toolUse && toolUse.type === 'tool_use') {
            const toolInput = toolUse.input as { keys: KeyId[] };
            const toolResult = handleCalculatorPressKeys(toolInput.keys);
            keys = toolResult.keys;

            await writer.write(encoder.encode(sseEvent('keys', { keys })));

            const finalMessages = [
              ...messages,
              { role: 'assistant' as const, content: message!.content },
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
      'Access-Control-Allow-Origin': '*',
    },
  });
}

Bun.serve({
  port: PORT,
  async fetch(req: Request) {
    const url = new URL(req.url);

    // CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    // Chat endpoint
    if (url.pathname === '/api/chat' && req.method === 'POST') {
      return USE_MOCK_LLM ? handleMockChat(req) : handleChat(req);
    }

    // Health check
    if (url.pathname === '/health') {
      return new Response('OK', { status: 200 });
    }

    return new Response('Not Found', { status: 404 });
  },
});

console.log(`🚀 Dev server running on http://localhost:${PORT}`);
console.log(`📡 Mode: ${USE_MOCK_LLM ? 'MOCK LLM (no API key needed)' : 'Anthropic API'}`);
