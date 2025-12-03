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
 * Format a numeric result for display
 * Handles integers and decimals appropriately, removing trailing zeros
 */
function formatResult(result: number): string {
  if (Number.isInteger(result)) {
    return result.toString();
  }
  // Format with up to 2 decimal places, but remove trailing zeros
  const formatted = result.toFixed(2);
  return formatted.replace(/\.?0+$/, '');
}

/**
 * Calculate the result of a sequence of operations
 * Calculator processes operations left-to-right (not following PEMDAS)
 * Returns NaN if any division by zero is encountered or invalid input
 */
function calculateResult(numbers: number[], operations: { op: KeyId }[]): number {
  // Validate input
  if (numbers.length !== operations.length + 1) {
    return NaN;
  }
  
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
        description += ` The result is ${formatResult(result)}.`;
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
  
  // Extract digit numbers with their positions (including negative numbers)
  // Use a pattern that correctly handles negative numbers without word boundary issues
  const digitRegex = /(?:^|[^\w.])-?\d+(?:\.\d+)?(?![.\w])/g;
  let match;
  while ((match = digitRegex.exec(text)) !== null) {
    // Trim any non-digit prefix (space, punctuation) to get just the number
    const numStr = match[0].match(/-?\d+(?:\.\d+)?/)?.[0];
    if (numStr) {
      numberPositions.push({ value: Number(numStr), index: match.index + (match[0].length - numStr.length) });
    }
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

/**
 * Validate user input and return error message if invalid
 */
function validateInput(userMessage: string): string | null {
  if (!userMessage || userMessage.trim().length === 0) {
    return "Please provide a calculation request. For example, 'add 5 and 3' or 'square root of 16'.";
  }
  
  if (userMessage.trim().length > 500) {
    return "Your message is too long. Please keep it under 500 characters.";
  }
  
  return null; // Input is valid
}

export function getMockResponse(userMessage: string): MockResponse {
  // Validate input
  const validationError = validateInput(userMessage);
  if (validationError) {
    return {
      text: validationError,
    };
  }
  
  const lower = userMessage.toLowerCase().trim();

  // Check for compound operations (multiple operations in one request)
  const compoundResult = tryParseCompoundOperation(userMessage);
  if (compoundResult) {
    return compoundResult;
  }

  // Memory operations - check BEFORE general addition/subtraction patterns
  if (lower.match(/memory\s+(clear|delete|reset)|clear\s+memory|mc\b/)) {
    return {
      text: "I'll clear the calculator's memory.",
      keys: ['mc'],
    };
  }

  if (lower.match(/memory\s+(recall|retrieve|get)|recall\s+memory|mr\b/)) {
    return {
      text: "I'll recall the value from memory.",
      keys: ['mr'],
    };
  }

  if (lower.match(/memory\s+(add|plus|\+)|\b(add|store)\s+.*\s+(to|in)\s+memory|memory\s+add|m\+|m\s*plus/)) {
    const numbers = extractNumbers(userMessage);
    if (numbers.length >= 1) {
      return {
        text: `I'll add ${numbers[0]} to memory.`,
        keys: [...digitKeys(numbers[0]), 'm_plus'],
      };
    }
    return {
      text: "I'll add the current value to memory.",
      keys: ['m_plus'],
    };
  }

  if (lower.match(/memory\s+(subtract|minus|-)|\bsubtract\s+.*\s+from\s+memory|memory\s+subtract|m-|m\s*minus/)) {
    const numbers = extractNumbers(userMessage);
    if (numbers.length >= 1) {
      return {
        text: `I'll subtract ${numbers[0]} from memory.`,
        keys: [...digitKeys(numbers[0]), 'm_minus'],
      };
    }
    return {
      text: "I'll subtract the current value from memory.",
      keys: ['m_minus'],
    };
  }

  // Clear patterns - check BEFORE general patterns that might match "clear"
  if (lower.match(/clear\s+(all|everything)|reset|all\s+clear|ac\b/)) {
    return {
      text: "I'll clear the calculator completely for you.",
      keys: ['ac'],
    };
  }
  
  if (lower.match(/clear\s+(entry|display|current)?|^clear$/)) {
    return {
      text: "I'll clear the current entry.",
      keys: ['c'],
    };
  }

  // Square root patterns - check BEFORE subtraction (to handle negative numbers properly)
  if (lower.match(/square\s*root|sqrt|√/)) {
    const numbers = extractNumbers(userMessage);
    if (numbers.length >= 1) {
      const num = numbers[0];
      if (num < 0) {
        return {
          text: `I cannot calculate the square root of a negative number (${num}). That would result in an error.`,
        };
      }
      const result = Math.sqrt(num);
      return {
        text: `I'll calculate the square root of ${num}. The result is ${formatResult(result)}.`,
        keys: [...digitKeys(num), 'sqrt'],
      };
    }
  }

  // Sign change patterns - check BEFORE subtraction
  if (lower.match(/change\s+sign|negate|plus[\s-]*minus|negative|make.*negative|opposite\s+sign/)) {
    const numbers = extractNumbers(userMessage);
    if (numbers.length >= 1) {
      const num = numbers[0];
      const result = -num;
      return {
        text: `I'll change the sign of ${num} to ${result}.`,
        keys: [...digitKeys(num), 'plus_minus'],
      };
    }
  }

  // Addition patterns
  if (lower.match(/add|plus|\+|sum/)) {
    const numbers = extractNumbers(userMessage);
    if (numbers.length === 2) {
      const result = numbers[0] + numbers[1];
      // Check for overflow
      if (!isFinite(result)) {
        return {
          text: `The result of adding ${numbers[0]} and ${numbers[1]} would cause an overflow error.`,
        };
      }
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
    if (numbers.length < 2) {
      return {
        text: "I need two numbers to perform addition. For example, 'add 5 and 3'.",
      };
    }
  }

  // Subtraction patterns
  if (lower.match(/subtract|minus|-|difference/)) {
    const numbers = extractNumbers(userMessage);
    if (numbers.length === 2) {
      const result = numbers[0] - numbers[1];
      if (!isFinite(result)) {
        return {
          text: `The result of subtracting ${numbers[1]} from ${numbers[0]} would cause an overflow error.`,
        };
      }
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
    if (numbers.length < 2) {
      return {
        text: "I need two numbers to perform subtraction. For example, 'subtract 7 from 20'.",
      };
    }
  }

  // Multiplication patterns
  if (lower.match(/multiply|times|\*|×|product/)) {
    const numbers = extractNumbers(userMessage);
    if (numbers.length === 2) {
      const result = numbers[0] * numbers[1];
      if (!isFinite(result)) {
        return {
          text: `The result of multiplying ${numbers[0]} by ${numbers[1]} would cause an overflow error.`,
        };
      }
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
    if (numbers.length < 2) {
      return {
        text: "I need two numbers to perform multiplication. For example, 'multiply 12 by 4'.",
      };
    }
  }

  // Division patterns
  if (lower.match(/divide|divided by|\/|÷/)) {
    const numbers = extractNumbers(userMessage);
    if (numbers.length === 2) {
      if (numbers[1] === 0) {
        // Don't send keys for division by zero - just return error message
        return {
          text: `I cannot divide ${numbers[0]} by zero. That would cause an error.`,
        };
      }
      const result = numbers[0] / numbers[1];
      if (!isFinite(result)) {
        return {
          text: `The result of dividing ${numbers[0]} by ${numbers[1]} would cause an overflow error.`,
        };
      }
      return {
        text: `I'll divide ${numbers[0]} by ${numbers[1]}. The result is ${formatResult(result)}.`,
        keys: [
          ...digitKeys(numbers[0]),
          'div',
          ...digitKeys(numbers[1]),
          'equals',
        ],
      };
    }
    if (numbers.length < 2) {
      return {
        text: "I need two numbers to perform division. For example, 'divide 100 by 5'.",
      };
    }
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
    text: "I'm a mock calculator assistant. I can help you with operations like addition, subtraction, multiplication, division, square root, percentage, memory operations, and more. Try saying something like 'add 5 and 3', 'square root of 16', or 'store 42 in memory'.",
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
