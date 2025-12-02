import type { KeyId, CalculatorDisplay } from '@calculator/shared-types';

export type CalculatorInternalState = {
  displayValue: string;
  memoryValue: number;
  hasMemory: boolean;
  constant: null | {
    operator: 'add' | 'sub' | 'mul' | 'div';
    value: number;
  };
  lastOperator: 'add' | 'sub' | 'mul' | 'div' | null;
  lastOperand: number | null;
  isError: boolean;
};

export type CalculatorEngine = {
  initialState: () => CalculatorInternalState;
  pressKey: (state: CalculatorInternalState, key: KeyId) => CalculatorInternalState;
  toDisplay: (state: CalculatorInternalState) => CalculatorDisplay;
};
