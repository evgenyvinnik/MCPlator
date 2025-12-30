export type KeyId =
  | 'digit_0'
  | 'digit_1'
  | 'digit_2'
  | 'digit_3'
  | 'digit_4'
  | 'digit_5'
  | 'digit_6'
  | 'digit_7'
  | 'digit_8'
  | 'digit_9'
  | 'decimal'
  | 'add'
  | 'sub'
  | 'mul'
  | 'div'
  | 'percent'
  | 'sqrt'
  | 'plus_minus'
  | 'equals'
  | 'ac'
  | 'c'
  | 'mc'
  | 'mr'
  | 'm_plus'
  | 'm_minus';

export type CalculatorIndicators = {
  error: boolean; // E
  memory: boolean; // M
  negative: boolean; // -
};

export type CalculatorDisplay = {
  text: string; // e.g., "0.", "11.4", "E"
  indicators: CalculatorIndicators;
};

export type AnimationCommand =
  | { type: 'pressKey'; key: KeyId; delayMs?: number }
  | { type: 'setDisplay'; display: CalculatorDisplay }
  | { type: 'sleep'; durationMs: number };

export type AnimationSequence = {
  id: string;
  commands: AnimationCommand[];
};
