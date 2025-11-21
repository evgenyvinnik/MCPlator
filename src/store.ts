import { create } from 'zustand';

interface CalculatorState {
  count: number;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
}

export const useCalculatorStore = create<CalculatorState>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  reset: () => set({ count: 0 }),
}));
