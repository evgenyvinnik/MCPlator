import { create } from 'zustand';

type Operator = '+' | '-' | '×' | '÷';

interface CalculatorState {
  display: string;
  previous: number | null;
  operator: Operator | null;
  memory: number;
  poweredOff: boolean;
  justEvaluated: boolean;
  recallArmed: boolean;
  inputDigit: (digit: string) => void;
  inputDecimal: () => void;
  clearEntry: () => void;
  togglePower: () => void;
  setOperator: (operator: Operator) => void;
  evaluate: () => void;
  toggleSign: () => void;
  percent: () => void;
  memoryAdd: () => void;
  memorySubtract: () => void;
  memoryRecall: () => void;
  memoryClear: () => void;
  allClear: () => void;
  sqrt: () => void;
}

const MAX_LENGTH = 12;

const formatNumber = (value: number) => {
  if (Number.isNaN(value) || !Number.isFinite(value)) return 'Err';
  const absValue = Math.abs(value);
  if (absValue >= 1e12 || (absValue !== 0 && absValue < 1e-6)) {
    return value.toExponential(6);
  }
  const truncated = parseFloat(value.toFixed(10)).toString();
  return truncated.length > MAX_LENGTH ? truncated.slice(0, MAX_LENGTH) : truncated;
};

export const useCalculatorStore = create<CalculatorState>((set, get) => ({
  display: '0',
  previous: null,
  operator: null,
  memory: 0,
  poweredOff: false,
  justEvaluated: false,
  recallArmed: false,

  inputDigit: (digit) => {
    const { poweredOff, display, justEvaluated } = get();
    if (poweredOff) return;
    if (display === 'Err') {
      set({ display: digit, justEvaluated: false });
      return;
    }
    set(({ operator }) => {
      const shouldReset = display === '0' || justEvaluated;
      const next = shouldReset ? digit : `${display}${digit}`;
      const trimmed = next.length > MAX_LENGTH ? next.slice(0, MAX_LENGTH) : next;
      return { display: trimmed, justEvaluated: false, operator };
    });
  },

  inputDecimal: () => {
    const { poweredOff, display, justEvaluated } = get();
    if (poweredOff) return;
    if (display === 'Err') {
      set({ display: '0.', justEvaluated: false });
      return;
    }
    set(() => {
      if (justEvaluated) {
        return { display: '0.', justEvaluated: false };
      }
      if (display.includes('.')) return { display };
      return { display: `${display}.` };
    });
  },

  clearEntry: () => {
    const { poweredOff, display } = get();
    if (poweredOff) {
      set({ poweredOff: false, display: '0', previous: null, operator: null, justEvaluated: false });
      return;
    }
    if (display !== '0') {
      set({ display: '0', justEvaluated: false });
    } else {
      set({ display: '0', previous: null, operator: null, justEvaluated: false });
    }
  },

  allClear: () => {
    set({ display: '0', previous: null, operator: null, justEvaluated: false, poweredOff: false });
  },

  togglePower: () => {
    const { poweredOff } = get();
    if (poweredOff) {
      set({ poweredOff: false, display: '0', previous: null, operator: null, justEvaluated: false });
    } else {
      set({ poweredOff: true, display: '', previous: null, operator: null, justEvaluated: false });
    }
  },

  setOperator: (operator) => {
    const { poweredOff, display, previous, operator: currentOp, justEvaluated } = get();
    if (poweredOff || display === 'Err') return;

    const currentValue = parseFloat(display || '0');
    if (previous !== null && currentOp && !justEvaluated) {
      const result = evaluateOperation(previous, currentOp, currentValue);
      set({ previous: result === 'Err' ? null : result, operator, display: result === 'Err' ? 'Err' : display, justEvaluated: result === 'Err' });
      if (result !== 'Err') set({ display: formatNumber(result) });
      return;
    }

    set({ previous: currentValue, operator, justEvaluated: false, display });
  },

  evaluate: () => {
    const { poweredOff, display, previous, operator } = get();
    if (poweredOff || operator === null || previous === null || display === 'Err') return;
    const currentValue = parseFloat(display || '0');
    const result = evaluateOperation(previous, operator, currentValue);
    set({
      display: typeof result === 'number' ? formatNumber(result) : 'Err',
      previous: null,
      operator: null,
      justEvaluated: true,
    });
  },

  toggleSign: () => {
    const { poweredOff, display } = get();
    if (poweredOff || display === 'Err') return;
    if (display.startsWith('-')) {
      set({ display: display.slice(1) });
    } else if (display !== '0') {
      set({ display: `-${display}` });
    }
  },

  percent: () => {
    const { poweredOff, display } = get();
    if (poweredOff || display === 'Err') return;
    const value = parseFloat(display || '0') / 100;
    set({ display: formatNumber(value) });
  },

  sqrt: () => {
    const { poweredOff, display } = get();
    if (poweredOff || display === 'Err') return;
    const value = parseFloat(display || '0');
    if (value < 0) {
      set({ display: 'Err', justEvaluated: true });
      return;
    }
    set({ display: formatNumber(Math.sqrt(value)), justEvaluated: true });
  },

  memoryAdd: () => {
    const { poweredOff, display } = get();
    if (poweredOff || display === 'Err') return;
    const value = parseFloat(display || '0');
    set((state) => ({ memory: state.memory + value, recallArmed: false, justEvaluated: true }));
  },

  memorySubtract: () => {
    const { poweredOff, display } = get();
    if (poweredOff || display === 'Err') return;
    const value = parseFloat(display || '0');
    set((state) => ({ memory: state.memory - value, recallArmed: false, justEvaluated: true }));
  },

  memoryRecall: () => {
    const { poweredOff, memory } = get();
    if (poweredOff) return;
    set({ display: formatNumber(memory), justEvaluated: true });
  },

  memoryClear: () => {
    const { poweredOff } = get();
    if (poweredOff) return;
    set({ memory: 0 });
  },

  memoryRecallOrClear: () => {
     // Keeping for backward compatibility if needed, but we have specific actions now
    const { poweredOff, recallArmed, memory } = get();
    if (poweredOff) return;
    if (recallArmed) {
      set({ memory: 0, recallArmed: false });
      return;
    }
    set({ display: formatNumber(memory), justEvaluated: true, recallArmed: true });
  },
}));

const evaluateOperation = (a: number, operator: Operator, b: number): number | 'Err' => {
  switch (operator) {
    case '+':
      return a + b;
    case '-':
      return a - b;
    case '×':
      return a * b;
    case '÷':
      return b === 0 ? 'Err' : a / b;
    default:
      return b;
  }
};
