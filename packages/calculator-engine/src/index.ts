import type {
  CalculatorEngine,
  CalculatorInternalState,
} from './types';
import type { CalculatorDisplay } from '@calculator/shared-types';

export * from './types';

export const calculatorEngine: CalculatorEngine = {
  initialState: (): CalculatorInternalState => ({
    displayValue: '0',
    memoryValue: 0,
    hasMemory: false,
    constant: null,
    lastOperator: null,
    lastOperand: null,
    isError: false,
  }),

  pressKey: (state, _key) => {
    // TODO: implement full Casio logic here (AC/C, %, memory keys, constants)
    // For now, just a dummy implementation to satisfy the interface
    return state;
  },

  toDisplay: (state): CalculatorDisplay => ({
    text: state.isError ? 'E' : state.displayValue,
    indicators: {
      error: state.isError,
      memory: state.hasMemory,
      constant: !!state.constant,
      op: state.lastOperator,
    },
  }),
};
