import type { KeyId } from '@calculator/shared-types';

/**
 * Mock LLM responses for testing without Anthropic API
 * This simulates the behavior of the LLM by pattern matching user input
 */

interface MockResponse {
  text: string;
  keys?: KeyId[];
}

export function getMockResponse(userMessage: string): MockResponse {
  const lower = userMessage.toLowerCase().trim();

  // Addition patterns
  if (lower.match(/add|plus|\+|sum/)) {
    const numbers = extractNumbers(userMessage);
    if (numbers.length === 2) {
      return {
        text: `I'll add ${numbers[0]} and ${numbers[1]} for you.`,
        keys: [
          ...digitKeys(numbers[0]),
          'add',
          ...digitKeys(numbers[1]),
          'equals',
        ],
      };
    }
  }

  // Subtraction patterns
  if (lower.match(/subtract|minus|-|difference/)) {
    const numbers = extractNumbers(userMessage);
    if (numbers.length === 2) {
      return {
        text: `I'll subtract ${numbers[1]} from ${numbers[0]}.`,
        keys: [
          ...digitKeys(numbers[0]),
          'sub',
          ...digitKeys(numbers[1]),
          'equals',
        ],
      };
    }
  }

  // Multiplication patterns
  if (lower.match(/multiply|times|\*|×|product/)) {
    const numbers = extractNumbers(userMessage);
    if (numbers.length === 2) {
      return {
        text: `I'll multiply ${numbers[0]} by ${numbers[1]}.`,
        keys: [
          ...digitKeys(numbers[0]),
          'mul',
          ...digitKeys(numbers[1]),
          'equals',
        ],
      };
    }
  }

  // Division patterns
  if (lower.match(/divide|divided by|\/|÷/)) {
    const numbers = extractNumbers(userMessage);
    if (numbers.length === 2) {
      return {
        text: `I'll divide ${numbers[0]} by ${numbers[1]}.`,
        keys: [
          ...digitKeys(numbers[0]),
          'div',
          ...digitKeys(numbers[1]),
          'equals',
        ],
      };
    }
  }

  // Clear patterns
  if (lower.match(/clear|reset|ac/)) {
    return {
      text: "I'll clear the calculator for you.",
      keys: ['ac'],
    };
  }

  // Percentage patterns
  if (lower.match(/percent|%/)) {
    const numbers = extractNumbers(userMessage);
    if (numbers.length >= 1) {
      return {
        text: `I'll calculate ${numbers[0]}%.`,
        keys: [...digitKeys(numbers[0]), 'percent'],
      };
    }
  }

  // Default response for unrecognized patterns
  return {
    text: "I'm a mock calculator assistant. I can help you with basic operations like addition, subtraction, multiplication, and division. Try saying something like 'add 5 and 3' or 'multiply 12 by 4'.",
  };
}

/**
 * Extract numbers from a string
 */
function extractNumbers(text: string): number[] {
  const matches = text.match(/\b\d+(?:\.\d+)?\b/g);
  if (!matches) {
    // Try word numbers with word boundaries to avoid false matches
    // Note: This is a simple implementation and doesn't handle compound numbers
    // like "twenty five". It will extract them as separate numbers [20, 5].
    const wordMap: Record<string, number> = {
      zero: 0, one: 1, two: 2, three: 3, four: 4,
      five: 5, six: 6, seven: 7, eight: 8, nine: 9,
      ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14,
      fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
      twenty: 20, thirty: 30, forty: 40, fifty: 50,
      sixty: 60, seventy: 70, eighty: 80, ninety: 90,
      hundred: 100, thousand: 1000,
    };
    
    const lower = text.toLowerCase();
    const numbers: number[] = [];
    
    // Use word boundaries to match whole words only
    for (const [word, num] of Object.entries(wordMap)) {
      const regex = new RegExp(`\\b${word}\\b`, 'i');
      if (regex.test(lower)) {
        numbers.push(num);
        if (numbers.length >= 2) break;
      }
    }
    return numbers;
  }
  return matches.map(Number);
}

/**
 * Convert a number to an array of calculator key IDs
 */
function digitKeys(num: number): KeyId[] {
  const str = num.toString();
  const keys: KeyId[] = [];
  
  for (const char of str) {
    if (char === '.') {
      keys.push('decimal');
    } else if (char >= '0' && char <= '9') {
      keys.push(`digit_${char}` as KeyId);
    }
  }
  
  return keys;
}
