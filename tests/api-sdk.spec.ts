import { test, expect } from '@playwright/test';
import { MODEL, EFFORT, REJECTION_MESSAGE } from '../api/constants';

const streamEvent = (type: string, data: Record<string, unknown>) =>
  `event: ${type}\ndata: ${JSON.stringify({ type, ...data })}\n\n`;
const messageStart = (id: string) =>
  streamEvent('message_start', {
    message: {
      id,
      type: 'message',
      role: 'assistant',
      model: MODEL,
      content: [],
      stop_reason: null,
      stop_sequence: null,
      usage: { input_tokens: 10, output_tokens: 0 },
    },
  });
const messageEnd = (reason: string) =>
  streamEvent('message_delta', {
    delta: { stop_reason: reason, stop_sequence: null },
    usage: { output_tokens: 10 },
  }) + streamEvent('message_stop', {});
const thinkingBlock = (index: number, signature: string) =>
  streamEvent('content_block_start', {
    index,
    content_block: { type: 'thinking', thinking: '', signature: '' },
  }) +
  streamEvent('content_block_delta', {
    index,
    delta: { type: 'signature_delta', signature },
  }) +
  streamEvent('content_block_stop', { index });
const textBlock = (index: number, chunks: string[]) =>
  streamEvent('content_block_start', {
    index,
    content_block: { type: 'text', text: '' },
  }) +
  chunks
    .map((text) =>
      streamEvent('content_block_delta', {
        index,
        delta: { type: 'text_delta', text },
      })
    )
    .join('') +
  streamEvent('content_block_stop', { index });

/**
 * Runs the chat handler against a mocked Anthropic API that replies with
 * `responses` in order, and returns the parsed SSE events and request bodies.
 */
async function runChat(message: string, responses: string[]) {
  const originalFetch = globalThis.fetch;
  const originalApiKey = process.env.ANTHROPIC_API_KEY;
  const requests: Record<string, unknown>[] = [];

  process.env.ANTHROPIC_API_KEY = 'test-only-not-a-real-key';
  globalThis.fetch = async (input, init) => {
    const url = input instanceof Request ? input.url : String(input);
    expect(url).toBe('https://api.anthropic.com/v1/messages');
    const body = JSON.parse(String(init?.body));
    requests.push(body);
    expect(requests.length).toBeLessThanOrEqual(responses.length);
    expect(body.stream).toBe(true);
    return new Response(responses[requests.length - 1], {
      headers: { 'Content-Type': 'text/event-stream' },
    });
  };

  try {
    const { default: handler } = await import('../api/chat');
    const response = await handler(
      new Request('https://mcplator.com/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history: [] }),
      })
    );
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('text/event-stream');
    const events = (await response.text())
      .trim()
      .split('\n\n')
      .map((block) => {
        const [event, data] = block.split('\n');
        return { type: event.slice(7), data: JSON.parse(data.slice(6)) };
      });
    return { events, requests };
  } finally {
    globalThis.fetch = originalFetch;
    if (originalApiKey === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = originalApiKey;
  }
}

// Exercise the actual SDK and API handler without a live API key or paid calls.
test('streams a calculator tool call and its follow-up through the Anthropic SDK', async () => {
  const keys = ['ac', 'digit_2', 'add', 'digit_3', 'equals'];
  const { events, requests } = await runChat('What is 2 plus 3?', [
    // Haiku 5.5 thinks by default, so the reply can start with a thinking block
    messageStart('message-0') +
      thinkingBlock(0, 'signature-0') +
      streamEvent('content_block_start', {
        index: 1,
        content_block: {
          type: 'tool_use',
          id: 'calculator-tool',
          name: 'calculator_press_keys',
          input: {},
        },
      }) +
      streamEvent('content_block_delta', {
        index: 1,
        delta: {
          type: 'input_json_delta',
          partial_json: JSON.stringify({ keys }),
        },
      }) +
      streamEvent('content_block_stop', { index: 1 }) +
      messageEnd('tool_use'),
    messageStart('message-1') +
      textBlock(0, ['2', ' plus 3', ' equals 5.']) +
      messageEnd('end_turn'),
  ]);

  expect(events.filter((event) => event.type === 'error')).toEqual([]);
  expect(events.filter((event) => event.type === 'keys')).toEqual([
    { type: 'keys', data: { keys } },
  ]);
  expect(events.at(-1)).toMatchObject({
    type: 'done',
    data: { fullText: '2 plus 3 equals 5.' },
  });
  expect(requests).toHaveLength(2);
  for (const request of requests) {
    expect(request).toMatchObject({
      model: 'claude-haiku-5-5',
      thinking: { type: 'adaptive' },
      output_config: { effort: EFFORT },
    });
    // Haiku 5.5 returns a 400 for non-default sampling parameters
    expect(request).not.toHaveProperty('temperature');
    expect(request).not.toHaveProperty('top_p');
    expect(request).not.toHaveProperty('top_k');
  }
  expect(requests[1].messages).toEqual(
    expect.arrayContaining([
      {
        role: 'assistant',
        content: [
          // Thinking blocks must be passed back unmodified with the tool result
          { type: 'thinking', thinking: '', signature: 'signature-0' },
          expect.objectContaining({ type: 'tool_use', id: 'calculator-tool' }),
        ],
      },
      expect.objectContaining({
        role: 'user',
        content: [
          expect.objectContaining({
            type: 'tool_result',
            tool_use_id: 'calculator-tool',
          }),
        ],
      }),
    ])
  );
});

test('replies with the rejection message when the model declines a request', async () => {
  const { events, requests } = await runChat('What is 2 plus 3?', [
    messageStart('message-0') + messageEnd('refusal'),
  ]);

  expect(requests).toHaveLength(1);
  expect(events.filter((event) => event.type === 'error')).toEqual([]);
  expect(events.filter((event) => event.type === 'keys')).toEqual([]);
  expect(events.at(-1)).toMatchObject({
    type: 'done',
    data: { fullText: REJECTION_MESSAGE },
  });
});
