import { test, expect } from '@playwright/test';

// Exercise the actual SDK and API handler without a live API key or paid calls.
test('streams a calculator tool call and its follow-up through the Anthropic SDK', async () => {
  const originalFetch = globalThis.fetch;
  const originalApiKey = process.env.ANTHROPIC_API_KEY;
  const keys = ['ac', 'digit_2', 'add', 'digit_3', 'equals'];
  const requests: Record<string, unknown>[] = [];
  const streamEvent = (type: string, data: Record<string, unknown>) =>
    `event: ${type}\ndata: ${JSON.stringify({ type, ...data })}\n\n`;
  const messageStart = () =>
    streamEvent('message_start', {
      message: {
        id: `message-${requests.length}`,
        type: 'message',
        role: 'assistant',
        model: 'claude-haiku-4-5',
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

  process.env.ANTHROPIC_API_KEY = 'test-only-not-a-real-key';
  globalThis.fetch = async (input, init) => {
    const url = input instanceof Request ? input.url : String(input);
    expect(url).toBe('https://api.anthropic.com/v1/messages');
    const body = JSON.parse(String(init?.body));
    requests.push(body);
    expect(requests.length).toBeLessThanOrEqual(2);
    expect(body.stream).toBe(true);

    const events =
      requests.length === 1
        ? messageStart() +
          streamEvent('content_block_start', {
            index: 0,
            content_block: {
              type: 'tool_use',
              id: 'calculator-tool',
              name: 'calculator_press_keys',
              input: {},
            },
          }) +
          streamEvent('content_block_delta', {
            index: 0,
            delta: {
              type: 'input_json_delta',
              partial_json: JSON.stringify({ keys }),
            },
          }) +
          streamEvent('content_block_stop', { index: 0 }) +
          messageEnd('tool_use')
        : messageStart() +
          streamEvent('content_block_start', {
            index: 0,
            content_block: { type: 'text', text: '' },
          }) +
          ['2', ' plus 3', ' equals 5.']
            .map((text) =>
              streamEvent('content_block_delta', {
                index: 0,
                delta: { type: 'text_delta', text },
              })
            )
            .join('') +
          streamEvent('content_block_stop', { index: 0 }) +
          messageEnd('end_turn');
    return new Response(events, {
      headers: { 'Content-Type': 'text/event-stream' },
    });
  };

  try {
    const { default: handler } = await import('../api/chat');
    const response = await handler(
      new Request('https://mcplator.com/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'What is 2 plus 3?', history: [] }),
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
    expect(events.filter((event) => event.type === 'error')).toEqual([]);
    expect(events.filter((event) => event.type === 'keys')).toEqual([
      { type: 'keys', data: { keys } },
    ]);
    expect(events.at(-1)).toMatchObject({
      type: 'done',
      data: { fullText: '2 plus 3 equals 5.' },
    });
    expect(requests).toHaveLength(2);
    expect(requests[1].messages).toEqual(
      expect.arrayContaining([
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
  } finally {
    globalThis.fetch = originalFetch;
    if (originalApiKey === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = originalApiKey;
  }
});
