import { useState, useCallback } from 'react';

export type KeyInput = {
  type?: string;
  value: string;
};

export type CalculatorState = {
  open: boolean;
  currentEntry: number | string;
  nextEntry: number | string | null;
  operation: string | null;
  float: boolean;
  memory: number | null;
  error: boolean;
  lastAction: string | null;
  lastCalculation: {
    operation?: string | null;
    nextEntry?: number | string | null;
  };
};

const initialState: CalculatorState = {
  open: true, // Default to open for now
  currentEntry: 0,
  nextEntry: null,
  operation: null,
  float: false,
  memory: null,
  error: false,
  lastAction: null,
  lastCalculation: {},
};

const MAX_DIGITS = 8;

export const useRetroCalculator = () => {
  const [state, setState] = useState<CalculatorState>(initialState);

  const process = useCallback(
    (currentState: CalculatorState, key: KeyInput): CalculatorState => {
      if (currentState.error && key.value !== 'clear' && key.value !== 'on') {
        return currentState;
      }

      if (key.value === 'on') {
        return { ...initialState, open: true, memory: currentState.memory };
      }

      if (key.value === 'off') {
        return { ...initialState, open: false, memory: currentState.memory };
      }

      if (!currentState.open) return currentState;

      const { type, value } = key;

      // Number Input
      if (!isNaN(Number(value))) {
        const entryKey =
          currentState.nextEntry !== null || currentState.operation !== null
            ? 'nextEntry'
            : 'currentEntry';
        const currentVal = currentState[entryKey];

        // Fix: 8-digit limit (count digits excluding decimal point and minus sign)
        const stringVal = currentVal === null ? '' : String(currentVal);
        const digitCount = stringVal.replace('.', '').replace('-', '').length;
        if (digitCount >= MAX_DIGITS) {
          return currentState;
        }

        let newVal;
        if (currentState.float) {
          newVal = currentVal === null ? value : String(currentVal) + value;
        } else {
          newVal =
            currentVal === 0 || currentVal === null
              ? value
              : String(currentVal) + value;
        }

        return {
          ...currentState,
          float: false,
          [entryKey]: newVal,
        };
      }

      // Math Operations
      if (type === 'MATH') {
        const entryKey =
          currentState.nextEntry !== null ? 'nextEntry' : 'currentEntry';

        if (value === 'float') {
          if (String(currentState[entryKey] || 0).includes('.'))
            return currentState;
          return {
            ...currentState,
            [entryKey]: (currentState[entryKey] || 0) + '.',
            float: true,
          };
        }

        if (value === 'change_sign') {
          return {
            ...currentState,
            [entryKey]: Number(currentState[entryKey] || 0) * -1,
          };
        }

        if (value === 'sqrt') {
          const val = Number(currentState[entryKey] || 0);
          if (val < 0) return { ...currentState, error: true };
          const result = Math.sqrt(val);
          // Format to fit in 8 digits
          const formatted = formatResult(result);
          return {
            ...currentState,
            [entryKey]:
              formatted === 'ERROR'
                ? ((currentState.error = true), currentState[entryKey])
                : formatted,
            error: formatted === 'ERROR',
          };
        }
      }

      // Basic Operations
      if (type === 'BASIC') {
        if (value === 'perform') {
          if (!currentState.operation) return currentState;

          let nextVal = currentState.nextEntry;
          let op = currentState.operation;

          if (currentState.lastAction === 'perform') {
            op = currentState.lastCalculation.operation || op;
            nextVal = currentState.lastCalculation.nextEntry || nextVal;
          }

          const result = calculate(
            Number(currentState.currentEntry),
            Number(nextVal),
            op
          );

          if (result === 'ERROR') return { ...currentState, error: true };

          const formatted = formatResult(result);
          if (formatted === 'ERROR') return { ...currentState, error: true };

          return {
            ...currentState,
            currentEntry: formatted,
            nextEntry: null,
            operation: null,
            lastAction: 'perform',
            lastCalculation: {
              operation: op,
              nextEntry: nextVal,
            },
          };
        }

        // Operation keys (+, -, *, /)
        if (currentState.nextEntry === null) {
          return { ...currentState, operation: value };
        }

        // Chain calculation
        const result = calculate(
          Number(currentState.currentEntry),
          Number(currentState.nextEntry),
          currentState.operation!
        );
        if (result === 'ERROR') return { ...currentState, error: true };

        const formatted = formatResult(result);
        if (formatted === 'ERROR') return { ...currentState, error: true };

        return {
          ...currentState,
          currentEntry: formatted,
          nextEntry: null,
          operation: value,
        };
      }

      // Memory Operations
      if (type === 'MEMORY') {
        const entryKey =
          currentState.nextEntry !== null ? 'nextEntry' : 'currentEntry';
        const currentVal = Number(currentState[entryKey] || 0);

        if (value === 'clear') return { ...currentState, memory: null };
        if (value === 'recall')
          return { ...currentState, [entryKey]: currentState.memory || 0 };

        let newMemory = currentState.memory || 0;
        if (value === 'plus') newMemory += currentVal;
        if (value === 'minus') newMemory -= currentVal;

        // Check memory overflow if needed, but JS numbers are large.
        // Retro calculators might error on memory overflow, but let's keep it simple.

        return { ...currentState, memory: newMemory };
      }

      // Clear
      if (value === 'clear') {
        // C
        const entryKey =
          currentState.nextEntry !== null ? 'nextEntry' : 'currentEntry';
        return {
          ...currentState,
          [entryKey]: 0,
          float: false,
          error: false,
        };
      }

      return currentState;
    },
    []
  );

  const handleClick = (key: KeyInput) => {
    setState((prev) => process(prev, key));
  };

  return { state, handleClick };
};

function calculate(a: number, b: number, op: string): number | 'ERROR' {
  let res = 0;
  switch (op) {
    case 'plus':
      res = a + b;
      break;
    case 'minus':
      res = a - b;
      break;
    case 'multiply':
      res = a * b;
      break;
    case 'divide':
      if (b === 0) return 'ERROR';
      res = a / b;
      break;
    case 'percentage':
      res = (a / 100) * b;
      break; // Standard calc % logic often varies, this is one interpretation
    default:
      return b;
  }

  return res;
}

function formatResult(num: number): number | string | 'ERROR' {
  // Check if number is too large
  if (!isFinite(num) || Math.abs(num) >= 100000000) return 'ERROR';

  // Convert to string to count digits
  const strNum = String(num);

  // Count actual digits (excluding sign, decimal point)
  const digitCount = strNum.replace('-', '').replace('.', '').length;

  // If fits in 8 digits, return as-is
  if (digitCount <= 8) {
    return num;
  }

  // Try to fit by reducing precision
  // For numbers with many decimal places, limit decimal places
  if (strNum.includes('.')) {
    const parts = strNum.split('.');
    const intPart = parts[0].replace('-', '');
    const maxDecimals = 8 - intPart.length;

    if (maxDecimals > 0) {
      return parseFloat(num.toFixed(maxDecimals));
    } else if (maxDecimals === 0) {
      return Math.round(num);
    }
  }

  // If still too large, use toPrecision
  const result = parseFloat(num.toPrecision(8));
  const resultStr = String(result).replace('-', '').replace('.', '');

  if (resultStr.length <= 8) {
    return result;
  }

  return 'ERROR';
}
