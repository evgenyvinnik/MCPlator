import type {
  CalculatorEngine,
  CalculatorInternalState,
} from './types';
import type { CalculatorDisplay } from '@calculator/shared-types';

export * from './types';

/**
 * Parse display value as a number, handling edge cases
 */
function parseDisplayValue(displayValue: string): number {
  const parsed = parseFloat(displayValue);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Format a number for display (max 8 digits)
 */
function formatForDisplay(value: number): string {
  if (!isFinite(value)) {
    return 'E';
  }
  
  // Handle very large or very small numbers with scientific notation
  const absValue = Math.abs(value);
  if (absValue >= 99999999 || (absValue > 0 && absValue < 0.00000001)) {
    return value.toExponential(2);
  }
  
  // Convert to string and check length
  let str = value.toString();
  
  // If it's too long, truncate to 8 characters (including decimal point and minus sign)
  if (str.length > 8) {
    // Try to format with reduced precision
    const sign = value < 0 ? '-' : '';
    const absStr = Math.abs(value).toString();
    
    if (absStr.includes('.')) {
      // Has decimal point - reduce decimal places
      const parts = absStr.split('.');
      const integerPart = parts[0];
      const maxDecimals = 8 - sign.length - integerPart.length - 1; // -1 for decimal point
      
      if (maxDecimals > 0) {
        str = sign + parseFloat(absStr).toFixed(maxDecimals);
        // Remove trailing zeros after decimal point
        str = str.replace(/\.?0+$/, '');
      } else {
        // No room for decimals, just show integer part
        str = sign + integerPart;
      }
    } else {
      // No decimal point, number is too large
      str = value.toExponential(2);
    }
  }
  
  return str;
}

/**
 * Perform a binary operation
 */
function performOperation(
  left: number,
  operator: 'add' | 'sub' | 'mul' | 'div',
  right: number
): number {
  switch (operator) {
    case 'add':
      return left + right;
    case 'sub':
      return left - right;
    case 'mul':
      return left * right;
    case 'div':
      if (right === 0) {
        return NaN; // Will be displayed as 'E'
      }
      return left / right;
  }
}

/**
 * Main calculator engine implementation
 */
export const calculatorEngine: CalculatorEngine = {
  initialState: (): CalculatorInternalState => ({
    displayValue: '0',
    memoryValue: 0,
    hasMemory: false,
    constant: null,
    lastOperator: null,
    lastOperand: null,
    isError: false,
    euroRate: null,
    isEuroMode: false,
    isLocalMode: true,
    shouldStartNewNumber: false,
  }),

  pressKey: (state, key) => {
    // If in error state, only AC can clear it
    if (state.isError && key !== 'ac') {
      return state;
    }

    // Handle digit keys (0-9)
    if (key.startsWith('digit_')) {
      const digit = key.replace('digit_', '');
      
      // If we should start a new number, replace display
      if (state.shouldStartNewNumber || state.displayValue === '0') {
        return {
          ...state,
          displayValue: digit,
          shouldStartNewNumber: false,
          isError: false,
        };
      }
      
      // Append digit (max 8 characters)
      if (state.displayValue.length < 8) {
        return {
          ...state,
          displayValue: state.displayValue + digit,
        };
      }
      
      return state;
    }

    // Handle decimal point
    if (key === 'decimal') {
      // If starting fresh, start with "0."
      if (state.shouldStartNewNumber || state.displayValue === '0') {
        return {
          ...state,
          displayValue: '0.',
          shouldStartNewNumber: false,
        };
      }
      
      // Only add decimal if not already present
      if (!state.displayValue.includes('.') && state.displayValue.length < 7) {
        return {
          ...state,
          displayValue: state.displayValue + '.',
        };
      }
      
      return state;
    }

    // Handle AC (All Clear)
    if (key === 'ac') {
      return {
        ...state,
        displayValue: '0',
        lastOperator: null,
        lastOperand: null,
        constant: null,
        isError: false,
        shouldStartNewNumber: false,
      };
    }

    // Handle C (Clear entry)
    if (key === 'c') {
      return {
        ...state,
        displayValue: '0',
        isError: false,
      };
    }

    // Handle operation keys (+, -, *, /)
    if (key === 'add' || key === 'sub' || key === 'mul' || key === 'div') {
      const currentValue = parseDisplayValue(state.displayValue);
      
      // If there's a pending operation and we've entered a new number, complete it first
      if (state.lastOperator !== null && state.lastOperand !== null && !state.shouldStartNewNumber) {
        // Chain operations: execute the pending operation
        const result = performOperation(state.lastOperand, state.lastOperator, currentValue);
        
        if (!isFinite(result)) {
          return {
            ...state,
            displayValue: 'E',
            isError: true,
            lastOperator: null,
            lastOperand: null,
            shouldStartNewNumber: false,
          };
        }
        
        return {
          ...state,
          displayValue: formatForDisplay(result),
          lastOperator: key,
          lastOperand: result,
          shouldStartNewNumber: true,
        };
      }
      
      // Store the operation and mark that next digit should start a new number
      return {
        ...state,
        lastOperator: key,
        lastOperand: currentValue,
        shouldStartNewNumber: true,
      };
    }

    // Handle equals
    if (key === 'equals') {
      // If no operator, just return current state
      if (state.lastOperator === null) {
        return state;
      }
      
      const leftOperand = state.lastOperand !== null ? state.lastOperand : parseDisplayValue(state.displayValue);
      const rightOperand = parseDisplayValue(state.displayValue);
      
      const result = performOperation(leftOperand, state.lastOperator, rightOperand);
      
      if (!isFinite(result)) {
        return {
          ...state,
          displayValue: 'E',
          isError: true,
          lastOperator: null,
          lastOperand: null,
          shouldStartNewNumber: false,
        };
      }
      
      // Enable constant mode for repeated equals presses
      return {
        ...state,
        displayValue: formatForDisplay(result),
        constant: {
          operator: state.lastOperator,
          value: rightOperand,
        },
        lastOperator: null,
        lastOperand: result,
        shouldStartNewNumber: true,
      };
    }

    // Handle percentage
    if (key === 'percent') {
      const currentValue = parseDisplayValue(state.displayValue);
      const percentValue = currentValue / 100;
      
      // If there's a pending operation, apply percentage relative to it
      if (state.lastOperator !== null && state.lastOperand !== null) {
        let result: number;
        if (state.lastOperator === 'add' || state.lastOperator === 'sub') {
          // For add/sub: calculate percentage of the first operand
          result = (state.lastOperand * percentValue);
        } else {
          // For mul/div: just convert to percentage
          result = percentValue;
        }
        
        return {
          ...state,
          displayValue: formatForDisplay(result),
        };
      }
      
      // Otherwise, just divide by 100
      return {
        ...state,
        displayValue: formatForDisplay(percentValue),
      };
    }

    // Handle square root
    if (key === 'sqrt') {
      const currentValue = parseDisplayValue(state.displayValue);
      if (currentValue < 0) {
        return {
          ...state,
          displayValue: 'E',
          isError: true,
        };
      }
      const result = Math.sqrt(currentValue);
      return {
        ...state,
        displayValue: formatForDisplay(result),
        shouldStartNewNumber: true,
      };
    }

    // Handle sign change (plus/minus)
    if (key === 'plus_minus') {
      const currentValue = parseDisplayValue(state.displayValue);
      const result = -currentValue;
      return {
        ...state,
        displayValue: formatForDisplay(result),
      };
    }

    // Handle memory operations
    if (key === 'mc') {
      // Memory Clear
      return {
        ...state,
        memoryValue: 0,
        hasMemory: false,
      };
    }

    if (key === 'mr') {
      // Memory Recall
      return {
        ...state,
        displayValue: formatForDisplay(state.memoryValue),
        shouldStartNewNumber: true,
      };
    }

    if (key === 'm_plus') {
      // Memory Plus
      const currentValue = parseDisplayValue(state.displayValue);
      const newMemory = state.memoryValue + currentValue;
      return {
        ...state,
        memoryValue: newMemory,
        hasMemory: true,
        shouldStartNewNumber: true,
      };
    }

    if (key === 'm_minus') {
      // Memory Minus
      const currentValue = parseDisplayValue(state.displayValue);
      const newMemory = state.memoryValue - currentValue;
      return {
        ...state,
        memoryValue: newMemory,
        hasMemory: true,
        shouldStartNewNumber: true,
      };
    }

    // Handle currency conversion keys (rate, euro, local)
    if (key === 'rate') {
      // Set the current display value as the euro rate
      const rate = parseDisplayValue(state.displayValue);
      return {
        ...state,
        euroRate: rate,
      };
    }

    if (key === 'euro') {
      // Convert from local to euro
      if (state.euroRate !== null && state.euroRate !== 0) {
        const currentValue = parseDisplayValue(state.displayValue);
        const euroValue = currentValue / state.euroRate;
        return {
          ...state,
          displayValue: formatForDisplay(euroValue),
          isEuroMode: true,
          isLocalMode: false,
        };
      }
      return state;
    }

    if (key === 'local') {
      // Convert from euro to local
      if (state.euroRate !== null) {
        const currentValue = parseDisplayValue(state.displayValue);
        const localValue = currentValue * state.euroRate;
        return {
          ...state,
          displayValue: formatForDisplay(localValue),
          isEuroMode: false,
          isLocalMode: true,
        };
      }
      return state;
    }

    // Unknown key - return state unchanged
    return state;
  },

  toDisplay: (state): CalculatorDisplay => ({
    text: state.isError ? 'E' : state.displayValue,
    indicators: {
      error: state.isError,
      memory: state.hasMemory,
      constant: !!state.constant,
      euro: state.isEuroMode,
      local: state.isLocalMode,
      rate: state.euroRate !== null,
      op: state.lastOperator, // UI layer should map to symbols: add→'+', sub→'-', mul→'×', div→'÷'
    },
  }),
};
