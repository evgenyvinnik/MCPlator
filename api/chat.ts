import Anthropic from '@anthropic-ai/sdk';
import type { Tool } from '@anthropic-ai/sdk/resources/messages';
import { v4 as uuid } from 'uuid';

// Types
type KeyId =
  | 'digit_0' | 'digit_1' | 'digit_2' | 'digit_3' | 'digit_4'
  | 'digit_5' | 'digit_6' | 'digit_7' | 'digit_8' | 'digit_9'
  | 'decimal'
  | 'add' | 'sub' | 'mul' | 'div'
  | 'percent'
  | 'sqrt' | 'plus_minus'
  | 'equals'
  | 'ac' | 'c'
  | 'mc' | 'mr' | 'm_plus' | 'm_minus';

interface ChatRequestBody {
  message: string;
  history?: { role: 'user' | 'assistant'; text: string }[];
}

// Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const MODEL = 'claude-haiku-4-5-20250514';

export const config = {
  runtime: 'edge',
};

// Pre-filter to detect calculator-related queries
function isCalculatorRelated(message: string): boolean {
  const lowerMessage = message.toLowerCase();

  // Calculator-related keywords and patterns
  const calculatorPatterns = [
    // Math operations
    /\b(add|plus|sum|subtract|minus|multiply|times|divide|divided by)\b/,
    /\b(calculate|compute|what is|what's|how much|equals?)\b/,
    /\b(percent|percentage|%)\b/,
    /\b(square root|sqrt)\b/,
    /\b(memory|store|recall|clear)\b/,
    // Numbers with operators
    /\d+\s*[\+\-\*\/\%]\s*\d+/,
    /\d+\s*(plus|minus|times|divided|multiplied)\s*\d+/i,
    // Asking about calculator
    /\b(calculator|calc)\b/,
  ];

  // Check if message matches any calculator pattern
  const isCalculator = calculatorPatterns.some(pattern => pattern.test(lowerMessage));

  // Non-calculator keywords that should be rejected
  const nonCalculatorPatterns = [
    /\b(write|code|script|program|application|app)\b/,
    /\b(article|essay|story|poem|song|letter)\b/,
    /\b(explain|describe|tell me about|what is a)\b(?!.*\d)/,
    /\b(python|javascript|java|html|css|sql|rust|go|ruby|c\+\+)\b/,
    /\b(weather|news|recipe|joke|riddle)\b/,
    /\b(translate|summarize|rewrite)\b/,
    /\b(help me with|how to|how do i)\b(?!.*(calculate|add|subtract|multiply|divide))/,
    /\b(create|generate|make me|build)\b(?!.*(calculation|sum|total))/,
  ];

  const isNonCalculator = nonCalculatorPatterns.some(pattern => pattern.test(lowerMessage));

  // If it matches non-calculator patterns, reject it (even if it also matches calculator patterns)
  if (isNonCalculator && !isCalculator) {
    return false;
  }

  // If it clearly matches calculator patterns, allow it
  if (isCalculator) {
    return true;
  }

  // For ambiguous cases, check if the message contains numbers (likely a calculation)
  const hasNumbers = /\d/.test(message);
  const isShort = message.split(' ').length <= 10;

  return hasNumbers && isShort;
}

const REJECTION_MESSAGE = "I'm a calculator assistant and can only help with math calculations. Try asking me something like \"What is 25 times 4?\" or \"Calculate 15% of 200\".";

const SYSTEM_PROMPT = `
You are an assistant controlling a Casio-like calculator UI in the browser.

IMPORTANT: You are ONLY a calculator assistant. You must REFUSE any requests that are not related to calculator operations.

Rules:
- For any numeric calculator operation, you MUST use the "calculator_press_keys" tool.
- ALWAYS start key sequences with "ac" (all clear) to reset the calculator before entering new calculations.
- The browser holds the actual calculator state; this tool is for specifying key sequences.
- After using the tool, provide a SHORT natural language explanation (1-2 sentences max) of the calculation and result.
- When describing button presses in your explanation, use human-readable names:
  * digit_0-9 → just the number (e.g., "3" not "digit_3")
  * ac → "AC"
  * c → "C"
  * add → "+"
  * sub → "−"
  * mul → "×"
  * div → "÷"
  * equals → "="
  * decimal → "."
  * percent → "%"
  * sqrt → "√"
  * plus_minus → "±"
  * mc, mr, m_plus, m_minus → "MC", "MR", "M+", "M−"
- Keep explanations concise. Example: "I calculated 2 + 300 = 302" instead of listing every button press.
- If the user request is NOT a calculator operation, politely refuse.
- When parsing numbers expressed in words, interpret them literally and correctly:
  * "two million six" = 2,000,006 (two million plus six)
  * "one million two hundred thousand" = 1,200,000
  * "three hundred forty five" = 345
  * Be careful not to confuse "million" with "thousand" or years

Available keys for the tool:
- Digits: digit_0 through digit_9
- Decimal point: decimal
- Operations: add, sub, mul, div
- Equals: equals
- Clear: ac (all clear - USE THIS FIRST), c (clear entry)
- Memory: mc (clear), mr (recall), m_plus (add to memory), m_minus (subtract from memory)
- Percent: percent
- Square root: sqrt
- Change sign: plus_minus (toggles positive/negative)

Example: To calculate 2 + 3, use keys: ["ac", "digit_2", "add", "digit_3", "equals"]
`;

const calculatorPressKeysTool: Tool = {
  name: 'calculator_press_keys',
  description: 'Simulate pressing calculator keys in order. Use this tool to perform any calculator operation by specifying the sequence of keys to press.',
  input_schema: {
    type: 'object' as const,
    properties: {
      keys: {
        type: 'array',
        items: {
          type: 'string',
          enum: [
            'digit_0', 'digit_1', 'digit_2', 'digit_3', 'digit_4',
            'digit_5', 'digit_6', 'digit_7', 'digit_8', 'digit_9',
            'decimal',
            'add', 'sub', 'mul', 'div',
            'percent',
            'sqrt', 'plus_minus',
            'equals',
            'ac', 'c',
            'mc', 'mr', 'm_plus', 'm_minus',
          ],
        },
        description: 'Array of calculator keys to press in sequence',
      },
    },
    required: ['keys'],
  },
};

// Helper to format SSE events
function sseEvent(event: string, data: object): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const body: ChatRequestBody = await req.json();
    const { message, history } = body;

    // Pre-filter: Check if message is calculator-related before sending to LLM
    if (!isCalculatorRelated(message)) {
      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();
      const encoder = new TextEncoder();

      (async () => {
        const messageId = uuid();
        // Stream the rejection message token by token for consistent UX
        const words = REJECTION_MESSAGE.split(' ');
        for (const word of words) {
          await writer.write(encoder.encode(sseEvent('token', { token: word + ' ' })));
          await new Promise(resolve => setTimeout(resolve, 20));
        }
        await writer.write(encoder.encode(sseEvent('done', { messageId, fullText: REJECTION_MESSAGE })));
        await writer.close();
      })();

      return new Response(readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

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
          temperature: 0.3, // Lower temperature for more deterministic responses
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
              keys = toolInput.keys;

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
                temperature: 0.3, // Lower temperature for more deterministic responses
                system: SYSTEM_PROMPT,
                tools: [calculatorPressKeysTool],
                messages: finalMessages,
              });

              let keysSent = false;
              let tokenCount = 0;

              for await (const finalEvent of finalStream) {
                if (finalEvent.type === 'content_block_delta') {
                  if (finalEvent.delta.type === 'text_delta') {
                    const token = finalEvent.delta.text;
                    fullText += token;
                    await writer.write(encoder.encode(sseEvent('token', { token })));

                    // Send keys after first few tokens of explanation (creates better UX timing)
                    tokenCount++;
                    if (!keysSent && tokenCount >= 3) {
                      await writer.write(encoder.encode(sseEvent('keys', { keys })));
                      keysSent = true;
                    }
                  }
                }
              }

              // Fallback: if keys weren't sent (very short response), send them now
              if (!keysSent) {
                await writer.write(encoder.encode(sseEvent('keys', { keys })));
              }
            }
          }
        }

        // Send done event
        await writer.write(encoder.encode(sseEvent('done', { messageId, fullText })));
      } catch (error) {
        console.error('Stream error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to process request';
        await writer.write(
          encoder.encode(sseEvent('error', { error: errorMessage }))
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
  } catch (error) {
    console.error('Handler error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
