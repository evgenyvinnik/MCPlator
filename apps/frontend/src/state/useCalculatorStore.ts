import { create } from 'zustand';
import { calculatorEngine } from '@calculator/calculator-engine';
import type {
  CalculatorDisplay,
  AnimationSequence,
  KeyId,
} from '@calculator/shared-types';
import type { CalculatorInternalState } from '@calculator/calculator-engine';
import { getDB } from '../db/indexedDB';

type CalculatorStoreState = {
  internalState: CalculatorInternalState;
  display: CalculatorDisplay;
  pressedKey: KeyId | null;
  isAnimating: boolean;
  animationQueue: AnimationSequence[];
  isHydrated: boolean;
  shouldFlash: boolean;
};

type CalculatorStoreActions = {
  pressKey: (key: KeyId) => void;
  enqueueAnimation: (sequence: AnimationSequence) => void;
  setPressedKey: (key: KeyId | null) => void;
  setIsAnimating: (val: boolean) => void;
  hydrate: () => Promise<void>;
};

export const useCalculatorStore = create<CalculatorStoreState & CalculatorStoreActions>()(
  (set, get) => ({
    internalState: calculatorEngine.initialState(),
    display: calculatorEngine.toDisplay(calculatorEngine.initialState()),
    pressedKey: null,
    isAnimating: false,
    animationQueue: [],
    isHydrated: false,
    shouldFlash: false,

    hydrate: async () => {
      const db = await getDB();
      const stored = await db.get('calculator-state', 'current');
      if (stored) {
        set({
          internalState: stored.state,
          display: stored.display,
          isHydrated: true,
        });
      } else {
        set({ isHydrated: true });
      }
    },

    pressKey: async (key) => {
      const current = get().internalState;
      const next = calculatorEngine.pressKey(current, key);
      const display = calculatorEngine.toDisplay(next);

      // Check if the key press was rejected (state didn't change for digit/decimal keys)
      // This happens when the digit limit is reached
      const wasRejected = (key.startsWith('digit_') || key === 'decimal') &&
                          current.displayValue === next.displayValue &&
                          current.shouldStartNewNumber === next.shouldStartNewNumber;

      if (wasRejected) {
        // Trigger flash effect
        set({ shouldFlash: true });
        setTimeout(() => set({ shouldFlash: false }), 200);
        return;
      }

      set({ internalState: next, display });

      // Persist to IndexedDB
      const db = await getDB();
      await db.put('calculator-state', {
        id: 'current',
        state: next,
        display,
        updatedAt: new Date().toISOString(),
      });
    },

    enqueueAnimation: (sequence) => {
      set((state) => ({
        animationQueue: [...state.animationQueue, sequence],
      }));
    },

    setPressedKey: (key) => set({ pressedKey: key }),
    setIsAnimating: (val) => set({ isAnimating: val }),
  }),
);
