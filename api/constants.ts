import type { Tool } from '@anthropic-ai/sdk/resources/messages';

/**
 * The Claude model to use for chat interactions.
 * Using Haiku 4.5 for fast, cost-effective responses.
 */
export const MODEL = 'claude-haiku-4-5-20251001';

/**
 * Temperature setting for AI responses (0-1 scale).
 * Lower values (0.3) make responses more deterministic and consistent.
 */
export const TEMPERATURE = 0.3;

/**
 * Maximum tokens to generate in AI responses.
 * Limited to 1024 for concise calculator explanations.
 */
export const MAX_TOKENS = 1024;

/**
 * Number of tokens to wait before sending calculator key presses.
 * This ensures the AI explanation starts before the calculator animates.
 */
export const TOKEN_DELAY_BEFORE_KEYS = 3;

/**
 * Message shown to users when their request is not calculator-related.
 * Used by the pre-filter to reject non-calculator queries before sending to LLM.
 */
export const REJECTION_MESSAGE =
  'I\'m a calculator assistant and can only help with math calculations. Try asking me something like "What is 25 times 4?" or "Calculate 15% of 200".';

/**
 * System prompt that defines the AI assistant's behavior and capabilities.
 * Instructs the AI to:
 * - Only handle calculator operations
 * - Use the calculator_press_keys tool for all calculations
 * - Support chained operations in a single key sequence
 * - Provide concise explanations (1-2 sentences)
 * - Handle memory operations correctly (AC clears memory, C doesn't)
 */
export const SYSTEM_PROMPT = `
You are an assistant controlling a Casio-like calculator UI in the browser.

IMPORTANT: You are a calculator assistant. Focus on performing calculations and math operations.
- Accept any request that involves math or numbers, even if it includes real-world context (physics, conversions, etc.)
- Classic calculator numbers and sequences are perfectly fine (like 8008135 which spells "boobies" upside down - it's just a fun calculator tradition!)
- Only refuse requests that are clearly unrelated to math (like writing essays, coding, etc.)

Rules:
- For any numeric calculator operation, you MUST use the "calculator_press_keys" tool.
- The tool accepts a SINGLE array of key presses that will be executed in sequence.
- For CHAINED operations (multiple steps), include ALL steps in ONE key array.
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
- If the user request involves math, help them! Even if they're asking about gravity, percentages, conversions, or any real-world application of math.
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
- Clear: ac (all clear - clears display AND memory), c (clear entry - clears current entry only)
- Memory: mc (memory clear), mr (memory recall), m_plus (add to memory), m_minus (subtract from memory)
- Percent: percent
- Square root: sqrt
- Change sign: plus_minus (toggles positive/negative)

Key Sequences - IMPORTANT:
1. Simple calculation: Start with "ac" to clear everything
   Example: 2 + 3 = ["ac", "digit_2", "add", "digit_3", "equals"]

2. Chained operations: Use "ac" ONLY at the start, then chain all steps
   Example: Store -1 in memory, then calculate 10 + 9:
   ["ac", "digit_1", "plus_minus", "m_plus", "digit_1", "digit_0", "add", "digit_9", "equals"]
   (This stores -1 in memory, then displays 19)

3. Using memory in calculations: Use "mr" to recall stored values
   Example: If 5 is in memory, calculate 3 + (memory):
   ["ac", "digit_3", "add", "mr", "equals"]

4. Memory operations: "ac" clears memory too! Use "c" if you want to keep memory intact.
   To preserve memory between calculations, DON'T use "ac" - just start entering the new number.
   Or use "c" to clear current entry while keeping memory.
`;

/**
 * Tool definition for the calculator_press_keys function.
 * This tool allows the AI to control the calculator by specifying a sequence of key presses.
 *
 * @example
 * // To calculate 2 + 3:
 * {
 *   keys: ["ac", "digit_2", "add", "digit_3", "equals"]
 * }
 */
export const calculatorPressKeysTool: Tool = {
  name: 'calculator_press_keys',
  description:
    'Simulate pressing calculator keys in order. Use this tool to perform any calculator operation by specifying the sequence of keys to press.',
  input_schema: {
    type: 'object' as const,
    properties: {
      keys: {
        type: 'array',
        items: {
          type: 'string',
          enum: [
            'digit_0',
            'digit_1',
            'digit_2',
            'digit_3',
            'digit_4',
            'digit_5',
            'digit_6',
            'digit_7',
            'digit_8',
            'digit_9',
            'decimal',
            'add',
            'sub',
            'mul',
            'div',
            'percent',
            'sqrt',
            'plus_minus',
            'equals',
            'ac',
            'c',
            'mc',
            'mr',
            'm_plus',
            'm_minus',
          ],
        },
        description: 'Array of calculator keys to press in sequence',
      },
    },
    required: ['keys'],
  },
};
