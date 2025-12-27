import type { KeyId, CalculatorDisplay } from '@calculator/shared-types';

export type CalculatorInternalState = {
  displayValue: string;
  memoryValue: number;
  hasMemory: boolean;
  lastOperator: 'add' | 'sub' | 'mul' | 'div' | null;
  lastOperand: number | null;
  isError: boolean;
  shouldStartNewNumber: boolean; // Flag to indicate next digit should start a new number
};

export type CalculatorEngine = {
  initialState: () => CalculatorInternalState;
  pressKey: (
    state: CalculatorInternalState,
    key: KeyId
  ) => CalculatorInternalState;
  toDisplay: (state: CalculatorInternalState) => CalculatorDisplay;
};
