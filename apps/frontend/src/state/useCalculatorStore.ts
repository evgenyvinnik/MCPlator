import { create } from 'zustand';
import { calculatorEngine } from '@calculator/calculator-engine';
import type {
  CalculatorDisplay,
  AnimationSequence,
  KeyId,
} from '@calculator/shared-types';
import type { CalculatorInternalState } from '@calculator/calculator-engine';
import { getDB } from '../db/indexedDB';

type AnimationCompleteCallback = (displayText: string) => void;

type CalculatorStoreState = {
  internalState: CalculatorInternalState;
  display: CalculatorDisplay;
  pressedKey: KeyId | null;
  isAnimating: boolean;
  animationQueue: AnimationSequence[];
  animationCallbacks: Map<string, AnimationCompleteCallback>;
  isHydrated: boolean;
  shouldFlash: boolean;
};

type CalculatorStoreActions = {
  pressKey: (key: KeyId) => void;
  enqueueAnimation: (
    sequence: AnimationSequence,
    onComplete?: AnimationCompleteCallback
  ) => void;
  getAnimationCallback: (id: string) => AnimationCompleteCallback | undefined;
  removeAnimationCallback: (id: string) => void;
  setPressedKey: (key: KeyId | null) => void;
  setIsAnimating: (val: boolean) => void;
  hydrate: () => Promise<void>;
};

export const useCalculatorStore = create<
  CalculatorStoreState & CalculatorStoreActions
>()((set, get) => ({
  internalState: calculatorEngine.initialState(),
  display: calculatorEngine.toDisplay(calculatorEngine.initialState()),
  pressedKey: null,
  isAnimating: false,
  animationQueue: [],
  animationCallbacks: new Map(),
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
    const wasRejected =
      (key.startsWith('digit_') || key === 'decimal') &&
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

  enqueueAnimation: (sequence, onComplete) => {
    if (onComplete) {
      const callbacks = new Map(get().animationCallbacks);
      callbacks.set(sequence.id, onComplete);
      set((state) => ({
        animationQueue: [...state.animationQueue, sequence],
        animationCallbacks: callbacks,
      }));
    } else {
      set((state) => ({
        animationQueue: [...state.animationQueue, sequence],
      }));
    }
  },

  getAnimationCallback: (id) => {
    return get().animationCallbacks.get(id);
  },

  removeAnimationCallback: (id) => {
    const callbacks = new Map(get().animationCallbacks);
    callbacks.delete(id);
    set({ animationCallbacks: callbacks });
  },

  setPressedKey: (key) => set({ pressedKey: key }),
  setIsAnimating: (val) => set({ isAnimating: val }),
}));
