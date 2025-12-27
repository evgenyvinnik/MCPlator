import { REJECTION_MESSAGE } from './constants';

/**
 * Formats a Server-Sent Events (SSE) message.
 *
 * SSE messages follow a specific format:
 * - Each message starts with "event: {eventName}\n"
 * - Followed by "data: {jsonData}\n"
 * - Terminated with an extra newline
 *
 * @param event - The event name (e.g., 'token', 'keys', 'done', 'error')
 * @param data - The data object to send (will be JSON stringified)
 * @returns Formatted SSE message string
 *
 * @example
 * sseEvent('token', { token: 'Hello' })
 * // Returns: "event: token\ndata: {\"token\":\"Hello\"}\n\n"
 */
export function sseEvent(event: string, data: object): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

/**
 * Pre-filter to detect if a user message is calculator-related.
 *
 * This function runs BEFORE sending the message to the LLM, saving API costs
 * by rejecting obviously non-calculator queries early.
 *
 * The filter is intentionally permissive - it's better to let the LLM handle
 * edge cases than to block legitimate math questions.
 *
 * The filter uses:
 * 1. Calculator-related patterns (math operations, numbers, calc keywords)
 * 2. Non-calculator patterns (coding, writing, general questions)
 * 3. Heuristics (message length, number presence)
 *
 * @param message - The user's input message
 * @returns true if the message appears to be calculator-related, false otherwise
 *
 * @example
 * isCalculatorRelated("what is 2 + 3") // true
 * isCalculatorRelated("write me a poem") // false
 * isCalculatorRelated("calculate 15% of 80") // true
 * isCalculatorRelated("what is earth's gravity multiplied by 10") // true
 */
export function isCalculatorRelated(message: string): boolean {
  const lowerMessage = message.toLowerCase();

  // Patterns that indicate calculator usage
  const calculatorPatterns = [
    // Math operations (including variations)
    /\b(add|plus|sum|subtract|minus|multiply|multiplied|times|divide|divided)\b/,
    /\b(calculate|compute|what is|what's|how much|equals?)\b/,
    /\b(percent|percentage|%)\b/,
    /\b(square root|sqrt)\b/,
    // Numbers with operators (any format)
    /\d+\s*[\+\-\*×÷\/\%]\s*\d+/,
    /\d+\s*(plus|minus|times|divided|multiplied|by)\s*\d+/i,
    // Asking about calculator or entering numbers
    /\b(calculator|calc)\b/,
    /^\d+$/, // Just typing a number
  ];

  // Check if message matches any calculator pattern
  const isCalculator = calculatorPatterns.some((pattern) =>
    pattern.test(lowerMessage)
  );

  // Patterns that indicate NON-calculator usage
  // Only block obvious non-math requests to save API costs
  const nonCalculatorPatterns = [
    // Code/programming requests
    /\b(write|code|script|program|application|app)\b(?!.*(calculate|math))/,
    // Creative writing
    /\b(article|essay|story|poem|song|letter)\b/,
    // Programming languages
    /\b(python|javascript|java|html|css|sql|rust|go|ruby|c\+\+)\b(?!.*(calculate|math))/,
    // General non-math requests
    /\b(weather|news|recipe)\b(?!.*(\d|calculate|math))/,
    // Text manipulation
    /\b(translate|summarize|rewrite)\b(?!.*(\d|calculate|math))/,
  ];

  const isNonCalculator = nonCalculatorPatterns.some((pattern) =>
    pattern.test(lowerMessage)
  );

  // If it matches non-calculator patterns but not calculator patterns, reject
  if (isNonCalculator && !isCalculator) {
    return false;
  }

  // If it clearly matches calculator patterns, allow
  if (isCalculator) {
    return true;
  }

  // More lenient fallback: messages with numbers are probably calculations
  const hasNumbers = /\d/.test(message);
  const isShort = message.split(' ').length <= 15; // Increased from 10

  return hasNumbers && isShort;
}

/**
 * Streams a rejection message token-by-token to the client.
 *
 * This creates a more natural UX by streaming the rejection message
 * the same way we stream AI responses, rather than sending it all at once.
 *
 * @param writer - WritableStreamDefaultWriter to write SSE events to
 * @param encoder - TextEncoder for converting strings to Uint8Array
 * @param messageId - Unique identifier for this message
 *
 * @example
 * const { writable } = new TransformStream();
 * const writer = writable.getWriter();
 * const encoder = new TextEncoder();
 * await streamRejectionMessage(writer, encoder, 'msg-123');
 */
export async function streamRejectionMessage(
  writer: WritableStreamDefaultWriter<Uint8Array>,
  encoder: TextEncoder,
  messageId: string
): Promise<void> {
  // Split message into words for token-by-token streaming
  const words = REJECTION_MESSAGE.split(' ');

  for (const word of words) {
    await writer.write(
      encoder.encode(sseEvent('token', { token: word + ' ' }))
    );
    // Small delay creates natural typing effect
    await new Promise((resolve) => setTimeout(resolve, 20));
  }

  // Send completion event
  await writer.write(
    encoder.encode(sseEvent('done', { messageId, fullText: REJECTION_MESSAGE }))
  );
  await writer.close();
}
