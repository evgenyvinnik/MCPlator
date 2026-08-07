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

/** Anthropic Messages API endpoint + version. */
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';

/** Shared SSE response headers. */
const SSE_HEADERS = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  Connection: 'keep-alive',
} as const;

/**
 * A message in the Anthropic conversation. `content` is a plain string for
 * user/assistant text turns, or an array of content blocks for the assistant
 * tool-call turn and the user tool_result turn.
 */
type ApiMessage = { role: 'user' | 'assistant'; content: string | unknown[] };

/** Reassembled assistant content blocks returned by {@link streamAnthropicMessage}. */
type TextBlock = { type: 'text'; text: string };
type ToolUseBlock = {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
};
type AssistantContentBlock = TextBlock | ToolUseBlock;

/** Minimal shape of the Anthropic streaming (SSE) events we care about. */
interface AnthropicStreamEvent {
  type: string;
  index?: number;
  content_block?: { type: string; id?: string; name?: string };
  delta?: {
    type?: string;
    text?: string;
    partial_json?: string;
    stop_reason?: string | null;
  };
  error?: { message?: string };
}

/**
 * Parse accumulated tool-input JSON, tolerating empty or invalid payloads.
 */
function parseToolInput(json: string): Record<string, unknown> {
  if (!json) return {};
  try {
    const parsed: unknown = JSON.parse(json);
    return parsed && typeof parsed === 'object'
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

/**
 * Vercel Edge Runtime configuration.
 * Using Edge Runtime for optimal SSE (Server-Sent Events) support.
 */
export const config = {
  runtime: 'edge',
};

/**
 * Calls the Anthropic Messages API with streaming enabled and processes the
 * returned Server-Sent Events.
 *
 * This talks to the HTTP API directly (via `fetch`) instead of the
 * `@anthropic-ai/sdk`, because the SDK statically imports `node:fs`/`node:path`
 * and therefore cannot be bundled for the Vercel Edge Runtime. `fetch` + SSE is
 * fully Edge-native.
 *
 * @param messages - Conversation history to send.
 * @param onToken - Invoked for each streamed text token (used to forward tokens
 *   to the client and to time the calculator key presses).
 * @returns The reassembled assistant content blocks (text + any tool_use) and
 *   the final `stop_reason`.
 */
async function streamAnthropicMessage(
  messages: ApiMessage[],
  onToken: (token: string) => Promise<void>
): Promise<{ content: AssistantContentBlock[]; stopReason: string | null }> {
  const res = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY ?? '',
      'anthropic-version': ANTHROPIC_VERSION,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      temperature: TEMPERATURE,
      system: SYSTEM_PROMPT,
      tools: [calculatorPressKeysTool],
      messages,
      stream: true,
    }),
  });

  if (!res.ok || !res.body) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Anthropic API ${res.status}: ${detail.slice(0, 300)}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  // Accumulate content blocks keyed by their stream index. Text blocks build up
  // their text; tool_use blocks build up their input JSON from partial deltas.
  const blocks = new Map<
    number,
    | { type: 'text'; text: string }
    | { type: 'tool_use'; id: string; name: string; json: string }
  >();
  let stopReason: string | null = null;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? ''; // keep the trailing partial line

      for (const rawLine of lines) {
        const line = rawLine.replace(/\r$/, '');
        if (!line.startsWith('data:')) continue; // ignore "event:" lines / blanks
        const data = line.slice(5).trim();
        if (!data) continue;

        let evt: AnthropicStreamEvent;
        try {
          evt = JSON.parse(data);
        } catch {
          continue; // skip anything unparseable
        }

        switch (evt.type) {
          case 'content_block_start': {
            if (typeof evt.index !== 'number' || !evt.content_block) break;
            const cb = evt.content_block;
            if (cb.type === 'text') {
              blocks.set(evt.index, { type: 'text', text: '' });
            } else if (cb.type === 'tool_use' && cb.id && cb.name) {
              blocks.set(evt.index, {
                type: 'tool_use',
                id: cb.id,
                name: cb.name,
                json: '',
              });
            }
            break;
          }
          case 'content_block_delta': {
            if (typeof evt.index !== 'number' || !evt.delta) break;
            const block = blocks.get(evt.index);
            if (!block) break;
            if (
              evt.delta.type === 'text_delta' &&
              typeof evt.delta.text === 'string' &&
              block.type === 'text'
            ) {
              block.text += evt.delta.text;
              await onToken(evt.delta.text);
            } else if (
              evt.delta.type === 'input_json_delta' &&
              typeof evt.delta.partial_json === 'string' &&
              block.type === 'tool_use'
            ) {
              block.json += evt.delta.partial_json;
            }
            break;
          }
          case 'message_delta': {
            if (evt.delta?.stop_reason) stopReason = evt.delta.stop_reason;
            break;
          }
          case 'error': {
            throw new Error(evt.error?.message ?? 'Anthropic stream error');
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  // Reassemble the assistant content array in index order, dropping empty text
  // blocks (the API rejects them when echoed back in the follow-up request).
  const content: AssistantContentBlock[] = [];
  for (const [, block] of [...blocks.entries()].sort(([a], [b]) => a - b)) {
    if (block.type === 'tool_use') {
      content.push({
        type: 'tool_use',
        id: block.id,
        name: block.name,
        input: parseToolInput(block.json),
      });
    } else if (block.text.length > 0) {
      content.push({ type: 'text', text: block.text });
    }
  }

  return { content, stopReason };
}

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
 * event: keys
 * data: {"keys":["ac","digit_2","add","digit_3","equals"]}
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

    // Pre-filter: Reject non-calculator queries before sending to LLM.
    // This saves API costs by filtering obvious non-calculator requests.
    if (!isCalculatorRelated(message)) {
      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();
      const encoder = new TextEncoder();

      // Stream rejection message in background
      streamRejectionMessage(writer, encoder, uuid());

      return new Response(readable, { headers: SSE_HEADERS });
    }

    // Build conversation history including current message
    const messages: ApiMessage[] = [
      ...(history ?? []).map((m) => ({
        role: m.role,
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
        const messageId = uuid();

        const emitToken = async (token: string) => {
          fullText += token;
          await writer.write(encoder.encode(sseEvent('token', { token })));
        };

        // Initial AI request — Claude typically responds with a calculator
        // tool call (a key sequence) and little or no text.
        const first = await streamAnthropicMessage(messages, emitToken);
        const toolUse = first.content.find(
          (b): b is ToolUseBlock => b.type === 'tool_use'
        );

        if (toolUse) {
          // Extract calculator key sequence from the tool call.
          const keys = (toolUse.input.keys as KeyId[] | undefined) ?? [];

          // Build follow-up conversation with the tool result, telling the AI
          // the keys were pressed successfully.
          const finalMessages: ApiMessage[] = [
            ...messages,
            { role: 'assistant', content: first.content },
            {
              role: 'user',
              content: [
                {
                  type: 'tool_result',
                  tool_use_id: toolUse.id,
                  content: JSON.stringify({
                    success: true,
                    keys_pressed: keys.length,
                  }),
                },
              ],
            },
          ];

          // Follow-up response — usually a brief explanation of the result.
          // Send the calculator keys a few tokens in so the AI explanation
          // starts before the calculator animates (better perceived UX).
          let keysSent = false;
          let tokenCount = 0;
          await streamAnthropicMessage(finalMessages, async (token) => {
            await emitToken(token);
            tokenCount++;
            if (!keysSent && tokenCount >= TOKEN_DELAY_BEFORE_KEYS) {
              await writer.write(encoder.encode(sseEvent('keys', { keys })));
              keysSent = true;
            }
          });

          // Fallback: send keys if the follow-up response was very short.
          if (!keysSent) {
            await writer.write(encoder.encode(sseEvent('keys', { keys })));
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
    return new Response(readable, { headers: SSE_HEADERS });
  } catch (error) {
    console.error('Handler error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
