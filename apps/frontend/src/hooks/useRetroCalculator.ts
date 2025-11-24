import { useState, useCallback } from 'react';

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

  const process = useCallback((currentState: CalculatorState, key: any): CalculatorState => {
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
      const entryKey = currentState.nextEntry !== null || currentState.operation !== null ? 'nextEntry' : 'currentEntry';
      const currentVal = currentState[entryKey];
      
      // Fix: 8-digit limit
      const stringVal = currentVal === null ? '' : String(currentVal);
      if (stringVal.replace('.', '').length >= MAX_DIGITS) {
        return currentState;
      }

      let newVal;
      if (currentState.float) {
        newVal = currentVal === null ? value : String(currentVal) + value;
      } else {
        newVal = currentVal === 0 || currentVal === null ? value : String(currentVal) + value;
      }

      return {
        ...currentState,
        float: false,
        [entryKey]: newVal,
      };
    }

    // Math Operations
    if (type === 'MATH') {
      const entryKey = currentState.nextEntry !== null ? 'nextEntry' : 'currentEntry';
      
      if (value === 'float') {
        if (String(currentState[entryKey] || 0).includes('.')) return currentState;
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
        return {
          ...currentState,
          [entryKey]: Math.sqrt(val),
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

        const result = calculate(Number(currentState.currentEntry), Number(nextVal), op);
        
        if (result === 'ERROR') return { ...currentState, error: true };

        return {
          ...currentState,
          currentEntry: result,
          nextEntry: null,
          operation: null,
          lastAction: 'perform',
          lastCalculation: {
            operation: op,
            nextEntry: nextVal,
          }
        };
      }

      // Operation keys (+, -, *, /)
      if (currentState.nextEntry === null) {
        return { ...currentState, operation: value };
      }

      // Chain calculation
      const result = calculate(Number(currentState.currentEntry), Number(currentState.nextEntry), currentState.operation!);
      if (result === 'ERROR') return { ...currentState, error: true };

      return {
        ...currentState,
        currentEntry: result,
        nextEntry: null,
        operation: value,
      };
    }

    // Memory Operations
    if (type === 'MEMORY') {
       const entryKey = currentState.nextEntry !== null ? 'nextEntry' : 'currentEntry';
       const currentVal = Number(currentState[entryKey] || 0);

       if (value === 'clear') return { ...currentState, memory: null };
       if (value === 'recall') return { ...currentState, [entryKey]: currentState.memory || 0 };
       
       let newMemory = currentState.memory || 0;
       if (value === 'plus') newMemory += currentVal;
       if (value === 'minus') newMemory -= currentVal;

       // Check memory overflow if needed, but JS numbers are large. 
       // Retro calculators might error on memory overflow, but let's keep it simple.
       
       return { ...currentState, memory: newMemory };
    }

    // Clear
    if (value === 'clear') { // C
      const entryKey = currentState.nextEntry !== null ? 'nextEntry' : 'currentEntry';
      return {
        ...currentState,
        [entryKey]: 0,
        float: false,
        error: false,
      };
    }

    return currentState;
  }, []);

  const handleClick = (key: any) => {
    setState(prev => process(prev, key));
  };

  return { state, handleClick };
};

function calculate(a: number, b: number, op: string): number | 'ERROR' {
  let res = 0;
  switch (op) {
    case 'plus': res = a + b; break;
    case 'minus': res = a - b; break;
    case 'multiply': res = a * b; break;
    case 'divide': 
      if (b === 0) return 'ERROR';
      res = a / b; 
      break;
    case 'percentage': res = (a / 100) * b; break; // Standard calc % logic often varies, this is one interpretation
    default: return b;
  }
  
  // Check 8 digit limit for result? Or just display limit?
  // Usually calculators display E if result > 99999999
  if (Math.abs(res) > 99999999) return 'ERROR';
  
  // Round to avoid float precision issues fitting in 8 digits
  // This is a simple implementation
  return parseFloat(res.toPrecision(8));
}
