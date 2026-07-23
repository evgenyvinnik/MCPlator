import Anthropic from '@anthropic-ai/sdk';
import { v4 as uuid } from 'uuid';
import type { KeyId } from '../src/types/calculator';
import {
  MODEL,
  TEMPERATURE,
  MAX_TOKENS,
  TOKEN_DELAY_BEFORE_KEYS,
  SYSTEM_PROMPT,
  calculatorPressKeysTool,
} from './constants';
import { sseEvent, isCalculatorRelated, streamRejectionMessage } from './utils';

/**
 * Request body structure for the chat API.
 * Contains the user's message and optional conversation history.
 */
interface ChatRequestBody {
  /** The current user message */
  message: string;
  /** Previous messages in the conversation (optional) */
  history?: { role: 'user' | 'assistant'; text: string }[];
}

/**
 * Anthropic API client instance.
 * Initialized with API key from environment variables.
 */
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

/**
 * Vercel Edge Runtime configuration.
 * Using Edge Runtime for optimal SSE (Server-Sent Events) support.
 */
export const config = {
  runtime: 'edge',
};

/**
 * Main chat API handler.
 *
 * This endpoint handles calculator chat requests with the following flow:
 * 1. Pre-filter: Check if message is calculator-related (saves API costs)
 * 2. Stream AI response with tool calls for calculator operations
 * 3. Handle tool execution and stream follow-up response
 * 4. Send calculator key presses after AI starts explaining (better UX)
 *
 * The response is streamed using Server-Sent Events (SSE) with these event types:
 * - 'token': Individual text tokens from the AI response
 * - 'keys': Calculator key sequence to execute
 * - 'done': Completion event with full text and message ID
 * - 'error': Error event if something goes wrong
 *
 * @param req - The incoming HTTP request
 * @returns Response with SSE stream of AI chat + calculator actions
 *
 * @example
 * // Client request:
 * POST /api/chat
 * {
 *   "message": "what is 2 + 3",
 *   "history": []
 * }
 *
 * // SSE stream response:
 * event: token
 * data: {"token":"I'll"}
 *
 * event: token
 * data: {"token":" calculate"}
 *
 * event: keys
 * data: {"keys":["ac","digit_2","add","digit_3","equals"]}
 *
 * event: token
 * data: {"token":" that"}
 *
 * event: done
 * data: {"messageId":"...", "fullText":"I'll calculate that for you. 2 + 3 = 5"}
 */
export default async function handler(req: Request): Promise<Response> {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const body = (await req.json()) as ChatRequestBody;
    const { message, history } = body;

    // Pre-filter: Reject non-calculator queries before sending to LLM
    // This saves API costs by filtering obvious non-calculator requests
    if (!isCalculatorRelated(message)) {
      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();
      const encoder = new TextEncoder();
      const messageId = uuid();

      // Stream rejection message in background
      streamRejectionMessage(writer, encoder, messageId);

      return new Response(readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    // Build conversation history including current message
    const messages = [
      ...(history ?? []).map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.text,
      })),
      { role: 'user' as const, content: message },
    ];

    // Create TransformStream for SSE responses
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    // Process AI request in background while streaming response
    (async () => {
      try {
        let fullText = '';
        let keys: KeyId[] = [];
        const messageId = uuid();

        // Initial AI request with streaming enabled
        // This may return tool calls (calculator key sequences)
        const stream = await anthropic.messages.stream({
          model: MODEL,
          max_tokens: MAX_TOKENS,
          temperature: TEMPERATURE,
          system: SYSTEM_PROMPT,
          tools: [calculatorPressKeysTool],
          messages,
        });

        // Process streaming events from initial AI response
        for await (const event of stream) {
          // Stream text tokens to client as they arrive
          if (event.type === 'content_block_delta') {
            if (event.delta.type === 'text_delta') {
              const token = event.delta.text;
              fullText += token;
              await writer.write(encoder.encode(sseEvent('token', { token })));
            }
          } else if (event.type === 'content_block_stop') {
            // Check if AI wants to use the calculator tool
            const message = stream.currentMessage;
            const toolUse = message?.content.find((c) => c.type === 'tool_use');

            if (toolUse && toolUse.type === 'tool_use') {
              // Extract calculator key sequence from tool call
              const toolInput = toolUse.input as { keys: KeyId[] };
              keys = toolInput.keys;

              // Build follow-up conversation with tool result
              // This tells the AI that the keys were pressed successfully
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
                        keys_pressed: keys.length,
                      }),
                    },
                  ],
                },
              ];

              // Get AI's follow-up response after tool execution
              // This is usually a brief explanation of the result
              const finalStream = await anthropic.messages.stream({
                model: MODEL,
                max_tokens: MAX_TOKENS,
                temperature: TEMPERATURE,
                system: SYSTEM_PROMPT,
                tools: [calculatorPressKeysTool],
                messages: finalMessages,
              });

              // Track when to send calculator keys for better UX timing
              let keysSent = false;
              let tokenCount = 0;

              // Stream the follow-up response
              for await (const finalEvent of finalStream) {
                if (finalEvent.type === 'content_block_delta') {
                  if (finalEvent.delta.type === 'text_delta') {
                    const token = finalEvent.delta.text;
                    fullText += token;
                    await writer.write(
                      encoder.encode(sseEvent('token', { token }))
                    );

                    // Send calculator keys after first few tokens
                    // This ensures the AI explanation starts before the calculator animates
                    // Creates better perceived performance and UX flow
                    tokenCount++;
                    if (!keysSent && tokenCount >= TOKEN_DELAY_BEFORE_KEYS) {
                      await writer.write(
                        encoder.encode(sseEvent('keys', { keys }))
                      );
                      keysSent = true;
                    }
                  }
                }
              }

              // Fallback: Send keys if response was very short
              if (!keysSent) {
                await writer.write(encoder.encode(sseEvent('keys', { keys })));
              }
            }
          }
        }

        // Send completion event with full message
        await writer.write(
          encoder.encode(sseEvent('done', { messageId, fullText }))
        );
      } catch (error) {
        console.error('Stream error:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to process request';
        await writer.write(
          encoder.encode(sseEvent('error', { error: errorMessage }))
        );
      } finally {
        await writer.close();
      }
    })();

    // Return SSE stream response
    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Handler error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
