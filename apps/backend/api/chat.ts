import { anthropic, MODEL } from '../src/anthropicClient';
import { calculatorPressKeysTool, handleCalculatorPressKeys } from '../src/tools';
import type { ChatRequestBody, KeyId } from '@calculator/shared-types';
import { v4 as uuid } from 'uuid';

export const config = {
  runtime: 'edge', // Use Edge runtime for streaming
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
    /\b(explain|describe|tell me about|what is a)\b(?!.*\d)/,  // "what is a" without numbers
    /\b(python|javascript|java|html|css|sql|rust|go|ruby)\b/,
    /\b(weather|news|recipe|joke|riddle)\b/,
    /\b(translate|summarize|rewrite)\b/,
    /\b(help me with|how to|how do i)\b(?!.*(calculate|add|subtract|multiply|divide))/,
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
        await new Promise(resolve => setTimeout(resolve, 20)); // Small delay for streaming effect
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
