import type { Tool } from '@anthropic-ai/sdk/resources/messages';
import type { KeyId } from '@calculator/shared-types';
import { calculatorEngine } from '@calculator/calculator-engine';

export const calculatorPressKeysTool: Tool = {
  name: 'calculator_press_keys',
  description: 'Simulate pressing calculator keys in order. Use this tool to perform any calculator operation by specifying the sequence of keys to press.',
  input_schema: {
    type: 'object' as const,
    properties: {
      keys: {
        type: 'array',
        items: {
          type: 'string',
          enum: [
            'digit_0', 'digit_1', 'digit_2', 'digit_3', 'digit_4',
            'digit_5', 'digit_6', 'digit_7', 'digit_8', 'digit_9',
            'decimal',
            'add', 'sub', 'mul', 'div',
            'percent',
            'equals',
            'ac', 'c',
            'mc', 'mr', 'm_plus', 'm_minus',
            'rate', 'euro', 'local',
          ],
        },
        description: 'Array of calculator keys to press in sequence',
      },
    },
    required: ['keys'],
  },
};

export const handleCalculatorPressKeys = (keys: KeyId[]) => {
  let state = calculatorEngine.initialState();
  for (const key of keys) {
    state = calculatorEngine.pressKey(state, key);
  }
  const display = calculatorEngine.toDisplay(state);
  return { display, keys };
};
