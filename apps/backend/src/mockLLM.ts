import type { KeyId } from '@calculator/shared-types';

/**
 * Mock LLM responses for testing without Anthropic API
 * This simulates the behavior of the LLM by pattern matching user input
 */

interface MockResponse {
  text: string;
  keys?: KeyId[];
}

/**
 * Map of word numbers to their numeric values
 */
const WORD_NUMBER_MAP: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4,
  five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14,
  fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
  twenty: 20, thirty: 30, forty: 40, fifty: 50,
  sixty: 60, seventy: 70, eighty: 80, ninety: 90,
  hundred: 100, thousand: 1000,
};

/**
 * Calculate the result of a sequence of operations
 * Calculator processes operations left-to-right (not following PEMDAS)
 */
function calculateResult(numbers: number[], operations: { op: KeyId }[]): number {
  let result = numbers[0];
  
  for (let i = 0; i < operations.length; i++) {
    const nextNum = numbers[i + 1];
    const op = operations[i].op;
    
    switch (op) {
      case 'add':
        result += nextNum;
        break;
      case 'sub':
        result -= nextNum;
        break;
      case 'mul':
        result *= nextNum;
        break;
      case 'div':
        if (nextNum === 0) {
          return NaN; // Division by zero
        }
        result /= nextNum;
        break;
    }
  }
  
  return result;
}

/**
 * Try to parse a compound operation (multiple operations in sequence)
 * e.g., "hundred plus 2 divide by 3" -> 100 + 2 / 3 =
 */
function tryParseCompoundOperation(text: string): MockResponse | null {
  const lower = text.toLowerCase().trim();
  
  // Check if there are multiple operations
  const operationPatterns = [
    { regex: /\b(add|plus|\+)\b/g, op: 'add' as const, name: 'plus' },
    { regex: /\b(subtract|minus|-)\b/g, op: 'sub' as const, name: 'minus' },
    { regex: /\b(multiply|times|\*|×)\b/g, op: 'mul' as const, name: 'times' },
    { regex: /\b(divide|divided\s+by|\/|÷)\b/g, op: 'div' as const, name: 'divided by' },
  ];
  
  // Find all operations in order of appearance
  const operations: { index: number; op: KeyId; name: string }[] = [];
  for (const pattern of operationPatterns) {
    const matches = [...lower.matchAll(pattern.regex)];
    for (const match of matches) {
      if (match.index !== undefined) {
        operations.push({ index: match.index, op: pattern.op, name: pattern.name });
      }
    }
  }
  
  // If we have 2 or more operations, treat as compound
  if (operations.length >= 2) {
    // Sort by position in the text
    operations.sort((a, b) => a.index - b.index);
    
    // Extract all numbers (not limited to 2)
    const numbers = extractAllNumbers(text);
    
    // We need at least as many numbers as operations + 1
    if (numbers.length >= operations.length + 1) {
      // Build the key sequence
      const keys: KeyId[] = [];
      let description = `I'll calculate `;
      
      // First number
      keys.push(...digitKeys(numbers[0]));
      description += `${numbers[0]}`;
      
      // Then alternate operations and numbers
      for (let i = 0; i < operations.length; i++) {
        keys.push(operations[i].op);
        keys.push(...digitKeys(numbers[i + 1]));
        description += ` ${operations[i].name} ${numbers[i + 1]}`;
      }
      
      // Finally, equals
      keys.push('equals');
      description += ' for you.';
      
      // Calculate the result
      const result = calculateResult(numbers, operations);
      if (!isNaN(result) && isFinite(result)) {
        // Format the result nicely
        const formattedResult = Number.isInteger(result) ? result : result.toFixed(2);
        description += ` The result is ${formattedResult}.`;
      }
      
      return {
        text: description,
        keys,
      };
    }
  }
  
  return null;
}

/**
 * Extract all numbers from text (including word numbers)
 * This function extracts both digit numbers and word numbers, preserving their order
 */
function extractAllNumbers(text: string): number[] {
  const numberPositions: { value: number; index: number }[] = [];
  
  // Extract digit numbers with their positions
  const digitRegex = /\b\d+(?:\.\d+)?\b/g;
  let match;
  while ((match = digitRegex.exec(text)) !== null) {
    numberPositions.push({ value: Number(match[0]), index: match.index });
  }
  
  // Extract word numbers with their positions
  const wordPattern = Object.keys(WORD_NUMBER_MAP).join('|');
  const wordRegex = new RegExp(`\\b(${wordPattern})\\b`, 'gi');
  
  const lower = text.toLowerCase();
  const matches = [...lower.matchAll(wordRegex)];
  for (const wordMatch of matches) {
    if (wordMatch.index !== undefined && wordMatch[1]) {
      const word = wordMatch[1].toLowerCase();
      const value = WORD_NUMBER_MAP[word];
      if (value !== undefined) {
        numberPositions.push({ value, index: wordMatch.index });
      }
    }
  }
  
  // Sort by position and extract values
  return numberPositions.sort((a, b) => a.index - b.index).map(n => n.value);
}

export function getMockResponse(userMessage: string): MockResponse {
  const lower = userMessage.toLowerCase().trim();

  // Check for compound operations (multiple operations in one request)
  const compoundResult = tryParseCompoundOperation(userMessage);
  if (compoundResult) {
    return compoundResult;
  }

  // Addition patterns
  if (lower.match(/add|plus|\+|sum/)) {
    const numbers = extractNumbers(userMessage);
    if (numbers.length === 2) {
      const result = numbers[0] + numbers[1];
      return {
        text: `I'll add ${numbers[0]} and ${numbers[1]} for you. The result is ${result}.`,
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
      const result = numbers[0] - numbers[1];
      return {
        text: `I'll subtract ${numbers[1]} from ${numbers[0]}. The result is ${result}.`,
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
      const result = numbers[0] * numbers[1];
      return {
        text: `I'll multiply ${numbers[0]} by ${numbers[1]}. The result is ${result}.`,
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
      if (numbers[1] === 0) {
        return {
          text: `I cannot divide ${numbers[0]} by zero. That would cause an error.`,
          keys: [
            ...digitKeys(numbers[0]),
            'div',
            ...digitKeys(numbers[1]),
            'equals',
          ],
        };
      }
      const result = numbers[0] / numbers[1];
      const formattedResult = Number.isInteger(result) ? result : result.toFixed(2);
      return {
        text: `I'll divide ${numbers[0]} by ${numbers[1]}. The result is ${formattedResult}.`,
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
 * Extract numbers from a string (limited to first 2 for simple operations)
 */
function extractNumbers(text: string): number[] {
  const allNumbers = extractAllNumbers(text);
  return allNumbers.slice(0, 2);
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
