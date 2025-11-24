import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { calculatorEngine } from '@calculator/calculator-engine';
import type {
  CalculatorDisplay,
  AnimationSequence,
  KeyId,
} from '@calculator/shared-types';
import type { CalculatorInternalState } from '@calculator/calculator-engine';

type CalculatorStoreState = {
  internalState: CalculatorInternalState;
  display: CalculatorDisplay;
  pressedKey: KeyId | null;
  isAnimating: boolean;
  animationQueue: AnimationSequence[];
};

type CalculatorStoreActions = {
  pressKey: (key: KeyId) => void;
  enqueueAnimation: (sequence: AnimationSequence) => void;
  setPressedKey: (key: KeyId | null) => void;
  setIsAnimating: (val: boolean) => void;
};

const STORAGE_KEY = 'casio_calculator_state_v1';

export const useCalculatorStore = create<CalculatorStoreState & CalculatorStoreActions>()(
  persist(
    (set, get) => ({
      internalState: calculatorEngine.initialState(),
      display: calculatorEngine.toDisplay(calculatorEngine.initialState()),
      pressedKey: null,
      isAnimating: false,
      animationQueue: [],

      pressKey: (key) => {
        const current = get().internalState;
        const next = calculatorEngine.pressKey(current, key);
        const display = calculatorEngine.toDisplay(next);
        set({ internalState: next, display });
      },

      enqueueAnimation: (sequence) => {
        set((state) => ({
          animationQueue: [...state.animationQueue, sequence],
        }));
      },

      setPressedKey: (key) => set({ pressedKey: key }),
      setIsAnimating: (val) => set({ isAnimating: val }),
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({
        internalState: state.internalState,
        display: state.display,
      }),
    },
  ),
);
