import { describe, it, expect } from 'bun:test';
import { calculatorEngine } from '../src/index';
import type { CalculatorInternalState } from '../src/types';
import type { KeyId } from '@calculator/shared-types';

/**
 * Helper function to press a sequence of keys
 */
function pressKeys(state: CalculatorInternalState, keys: KeyId[]): CalculatorInternalState {
  let currentState = state;
  for (const key of keys) {
    currentState = calculatorEngine.pressKey(currentState, key);
  }
  return currentState;
}

describe('Calculator Engine', () => {
  describe('Initial State', () => {
    it('should initialize with display "0"', () => {
      const state = calculatorEngine.initialState();
      expect(state.displayValue).toBe('0');
      expect(state.isError).toBe(false);
    });

    it('should have no memory initially', () => {
      const state = calculatorEngine.initialState();
      expect(state.hasMemory).toBe(false);
      expect(state.memoryValue).toBe(0);
    });
  });

  describe('Digit Entry', () => {
    it('should enter single digit', () => {
      let state = calculatorEngine.initialState();
      state = calculatorEngine.pressKey(state, 'digit_5');
      expect(state.displayValue).toBe('5');
    });

    it('should enter multiple digits', () => {
      let state = calculatorEngine.initialState();
      state = pressKeys(state, ['digit_1', 'digit_2', 'digit_3']);
      expect(state.displayValue).toBe('123');
    });

    it('should replace "0" with first digit', () => {
      let state = calculatorEngine.initialState();
      state = calculatorEngine.pressKey(state, 'digit_7');
      expect(state.displayValue).toBe('7');
    });

    it('should limit entry to 8 digits', () => {
      let state = calculatorEngine.initialState();
      state = pressKeys(state, [
        'digit_1', 'digit_2', 'digit_3', 'digit_4',
        'digit_5', 'digit_6', 'digit_7', 'digit_8',
        'digit_9', // Should be ignored
      ]);
      expect(state.displayValue).toBe('12345678');
    });
  });

  describe('Decimal Point', () => {
    it('should add decimal point', () => {
      let state = calculatorEngine.initialState();
      state = pressKeys(state, ['digit_1', 'decimal', 'digit_5']);
      expect(state.displayValue).toBe('1.5');
    });

    it('should start with "0." when decimal pressed first', () => {
      let state = calculatorEngine.initialState();
      state = calculatorEngine.pressKey(state, 'decimal');
      expect(state.displayValue).toBe('0.');
    });

    it('should not add second decimal point', () => {
      let state = calculatorEngine.initialState();
      state = pressKeys(state, ['digit_1', 'decimal', 'digit_5', 'decimal']);
      expect(state.displayValue).toBe('1.5');
    });
  });

  describe('Addition', () => {
    it('should add two numbers', () => {
      let state = calculatorEngine.initialState();
      state = pressKeys(state, ['digit_5', 'add', 'digit_3', 'equals']);
      expect(state.displayValue).toBe('8');
    });

    it('should add decimals', () => {
      let state = calculatorEngine.initialState();
      state = pressKeys(state, ['digit_1', 'decimal', 'digit_5', 'add', 'digit_2', 'decimal', 'digit_5', 'equals']);
      expect(state.displayValue).toBe('4');
    });

    it('should chain additions', () => {
      let state = calculatorEngine.initialState();
      state = pressKeys(state, ['digit_5', 'add', 'digit_3', 'add', 'digit_2', 'equals']);
      expect(state.displayValue).toBe('10');
    });
  });

  describe('Subtraction', () => {
    it('should subtract two numbers', () => {
      let state = calculatorEngine.initialState();
      state = pressKeys(state, ['digit_1', 'digit_0', 'sub', 'digit_3', 'equals']);
      expect(state.displayValue).toBe('7');
    });

    it('should handle negative results', () => {
      let state = calculatorEngine.initialState();
      state = pressKeys(state, ['digit_3', 'sub', 'digit_1', 'digit_0', 'equals']);
      expect(state.displayValue).toBe('-7');
    });
  });

  describe('Multiplication', () => {
    it('should multiply two numbers', () => {
      let state = calculatorEngine.initialState();
      state = pressKeys(state, ['digit_6', 'mul', 'digit_7', 'equals']);
      expect(state.displayValue).toBe('42');
    });

    it('should multiply decimals', () => {
      let state = calculatorEngine.initialState();
      state = pressKeys(state, ['digit_2', 'decimal', 'digit_5', 'mul', 'digit_4', 'equals']);
      expect(state.displayValue).toBe('10');
    });
  });

  describe('Division', () => {
    it('should divide two numbers', () => {
      let state = calculatorEngine.initialState();
      state = pressKeys(state, ['digit_1', 'digit_0', 'div', 'digit_2', 'equals']);
      expect(state.displayValue).toBe('5');
    });

    it('should handle division by zero', () => {
      let state = calculatorEngine.initialState();
      state = pressKeys(state, ['digit_1', 'digit_0', 'div', 'digit_0', 'equals']);
      expect(state.displayValue).toBe('E');
      expect(state.isError).toBe(true);
    });

    it('should handle decimal division', () => {
      let state = calculatorEngine.initialState();
      state = pressKeys(state, ['digit_1', 'digit_0', 'div', 'digit_3', 'equals']);
      // 10 / 3 = 3.333...
      expect(state.displayValue).toContain('3.3');
    });
  });

  describe('Clear Operations', () => {
    it('should clear entry with C', () => {
      let state = calculatorEngine.initialState();
      state = pressKeys(state, ['digit_1', 'digit_2', 'digit_3', 'c']);
      expect(state.displayValue).toBe('0');
    });

    it('should clear all with AC', () => {
      let state = calculatorEngine.initialState();
      state = pressKeys(state, ['digit_5', 'add', 'digit_3', 'ac']);
      expect(state.displayValue).toBe('0');
      expect(state.lastOperator).toBe(null);
      expect(state.lastOperand).toBe(null);
    });

    it('should clear error state with AC', () => {
      let state = calculatorEngine.initialState();
      state = pressKeys(state, ['digit_1', 'div', 'digit_0', 'equals', 'ac']);
      expect(state.displayValue).toBe('0');
      expect(state.isError).toBe(false);
    });
  });

  describe('Percentage', () => {
    it('should convert to percentage', () => {
      let state = calculatorEngine.initialState();
      state = pressKeys(state, ['digit_5', 'digit_0', 'percent']);
      expect(state.displayValue).toBe('0.5');
    });

    it('should calculate percentage in addition', () => {
      let state = calculatorEngine.initialState();
      state = pressKeys(state, ['digit_1', 'digit_0', 'digit_0', 'add', 'digit_1', 'digit_0', 'percent']);
      // 10% of 100 = 10
      expect(state.displayValue).toBe('10');
    });

    it('should calculate percentage in subtraction', () => {
      let state = calculatorEngine.initialState();
      state = pressKeys(state, ['digit_1', 'digit_0', 'digit_0', 'sub', 'digit_2', 'digit_0', 'percent']);
      // 20% of 100 = 20
      expect(state.displayValue).toBe('20');
    });
  });

  describe('Memory Operations', () => {
    it('should store value in memory with M+', () => {
      let state = calculatorEngine.initialState();
      state = pressKeys(state, ['digit_5', 'm_plus']);
      expect(state.hasMemory).toBe(true);
      expect(state.memoryValue).toBe(5);
    });

    it('should recall memory with MR', () => {
      let state = calculatorEngine.initialState();
      state = pressKeys(state, ['digit_5', 'm_plus', 'digit_3', 'mr']);
      expect(state.displayValue).toBe('5');
    });

    it('should accumulate in memory with multiple M+', () => {
      let state = calculatorEngine.initialState();
      state = pressKeys(state, ['digit_5', 'm_plus', 'digit_3', 'm_plus', 'mr']);
      expect(state.displayValue).toBe('8');
    });

    it('should subtract from memory with M-', () => {
      let state = calculatorEngine.initialState();
      state = pressKeys(state, ['digit_1', 'digit_0', 'm_plus', 'digit_3', 'm_minus', 'mr']);
      expect(state.displayValue).toBe('7');
    });

    it('should clear memory with MC', () => {
      let state = calculatorEngine.initialState();
      state = pressKeys(state, ['digit_5', 'm_plus', 'mc']);
      expect(state.hasMemory).toBe(false);
      expect(state.memoryValue).toBe(0);
    });
  });

  describe('Complex Operations', () => {
    it('should handle compound expression (100 + 2 / 3)', () => {
      let state = calculatorEngine.initialState();
      state = pressKeys(state, ['digit_1', 'digit_0', 'digit_0', 'add', 'digit_2', 'div', 'digit_3', 'equals']);
      // Calculator processes left-to-right: (100 + 2) / 3 = 102 / 3 = 34
      expect(state.displayValue).toBe('34');
    });

    it('should handle multiple chained operations', () => {
      let state = calculatorEngine.initialState();
      state = pressKeys(state, ['digit_5', 'add', 'digit_3', 'mul', 'digit_2', 'equals']);
      // (5 + 3) * 2 = 16
      expect(state.displayValue).toBe('16');
    });
  });

  describe('Display Formatting', () => {
    it('should format display correctly', () => {
      const state = calculatorEngine.initialState();
      const display = calculatorEngine.toDisplay(state);
      expect(display.text).toBe('0');
      expect(display.indicators.error).toBe(false);
    });

    it('should show error indicator', () => {
      let state = calculatorEngine.initialState();
      state = pressKeys(state, ['digit_1', 'div', 'digit_0', 'equals']);
      const display = calculatorEngine.toDisplay(state);
      expect(display.text).toBe('E');
      expect(display.indicators.error).toBe(true);
    });

    it('should show memory indicator', () => {
      let state = calculatorEngine.initialState();
      state = pressKeys(state, ['digit_5', 'm_plus']);
      const display = calculatorEngine.toDisplay(state);
      expect(display.indicators.memory).toBe(true);
    });

    it('should show operator indicator', () => {
      let state = calculatorEngine.initialState();
      state = pressKeys(state, ['digit_5', 'add']);
      const display = calculatorEngine.toDisplay(state);
      expect(display.indicators.op).toBe('add');
    });
  });

  describe('Edge Cases', () => {
    it('should handle equals without operator', () => {
      let state = calculatorEngine.initialState();
      state = pressKeys(state, ['digit_5', 'equals']);
      expect(state.displayValue).toBe('5');
    });

    it('should not accept digits in error state', () => {
      let state = calculatorEngine.initialState();
      state = pressKeys(state, ['digit_1', 'div', 'digit_0', 'equals', 'digit_5']);
      expect(state.displayValue).toBe('E');
    });

    it('should start new number after equals', () => {
      let state = calculatorEngine.initialState();
      state = pressKeys(state, ['digit_5', 'add', 'digit_3', 'equals', 'digit_7']);
      expect(state.displayValue).toBe('7');
    });
  });
});
