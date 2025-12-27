/**
 * @fileoverview Calculator state management using Zustand.
 *
 * This module provides global state management for the calculator application,
 * handling calculator state, display values, animations, and persistence to IndexedDB.
 *
 * @module state/useCalculatorStore
 */

import { create } from 'zustand';
import { calculatorEngine } from '@calculator/calculator-engine';
import type {
  CalculatorDisplay,
  AnimationSequence,
  KeyId,
} from '@calculator/shared-types';
import type { CalculatorInternalState } from '@calculator/calculator-engine';
import { getDB } from '../db/indexedDB';

/**
 * Callback function invoked when an animation sequence completes.
 * Receives the current display text to allow result messages to be shown in chat.
 */
type AnimationCompleteCallback = (displayText: string) => void;

/**
 * State shape for the calculator store.
 */
type CalculatorStoreState = {
  /** The calculator engine's internal computational state */
  internalState: CalculatorInternalState;
  /** Current display value and indicators (memory, error, negative) */
  display: CalculatorDisplay;
  /** Currently pressed key for visual feedback during animations */
  pressedKey: KeyId | null;
  /** Whether an animation sequence is currently running */
  isAnimating: boolean;
  /** Queue of pending animation sequences from AI responses */
  animationQueue: AnimationSequence[];
  /** Callbacks keyed by animation ID, called when animations complete */
  animationCallbacks: Map<string, AnimationCompleteCallback>;
  /** Whether state has been hydrated from IndexedDB */
  isHydrated: boolean;
  /** Triggers flash effect when digit limit is exceeded */
  shouldFlash: boolean;
};

/**
 * Actions available on the calculator store.
 */
type CalculatorStoreActions = {
  /** Process a key press, update state, and persist to IndexedDB */
  pressKey: (key: KeyId) => void;
  /** Add an animation sequence to the queue with optional completion callback */
  enqueueAnimation: (
    sequence: AnimationSequence,
    onComplete?: AnimationCompleteCallback
  ) => void;
  /** Retrieve a registered callback by animation ID */
  getAnimationCallback: (id: string) => AnimationCompleteCallback | undefined;
  /** Remove a callback after it has been executed */
  removeAnimationCallback: (id: string) => void;
  /** Set the currently pressed key for visual button feedback */
  setPressedKey: (key: KeyId | null) => void;
  /** Set whether an animation is currently running */
  setIsAnimating: (val: boolean) => void;
  /** Load persisted state from IndexedDB on app startup */
  hydrate: () => Promise<void>;
};

/**
 * Zustand store for calculator state management.
 *
 * Provides centralized state for:
 * - Calculator internal state and display values
 * - Animation queue for AI-triggered button sequences
 * - Persistence to IndexedDB for session recovery
 * - Visual feedback state for button presses
 *
 * @example
 * ```tsx
 * // In a component
 * const { display, pressKey } = useCalculatorStore();
 *
 * // Press a key
 * pressKey('digit_5');
 *
 * // Queue an animation from AI response
 * enqueueAnimation(sequence, (result) => {
 *   console.log('Animation complete, result:', result);
 * });
 * ```
 */
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

  /**
   * Hydrates the store state from IndexedDB.
   * Called on app mount to restore previous calculator state.
   */
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

  /**
   * Processes a key press on the calculator.
   *
   * - Delegates to calculator engine for state computation
   * - Detects rejected inputs (digit limit reached) and triggers flash
   * - Persists new state to IndexedDB
   *
   * @param key - The key identifier to process
   */
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

  /**
   * Adds an animation sequence to the queue.
   *
   * Animation sequences are processed by useAnimationRunner hook,
   * which visually presses buttons and executes calculator logic.
   *
   * @param sequence - The animation sequence containing key press commands
   * @param onComplete - Optional callback invoked with display result when animation finishes
   */
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

  /**
   * Retrieves the completion callback for an animation.
   * @param id - The animation sequence ID
   * @returns The callback function or undefined if not registered
   */
  getAnimationCallback: (id) => {
    return get().animationCallbacks.get(id);
  },

  /**
   * Removes a callback after it has been executed.
   * @param id - The animation sequence ID to remove
   */
  removeAnimationCallback: (id) => {
    const callbacks = new Map(get().animationCallbacks);
    callbacks.delete(id);
    set({ animationCallbacks: callbacks });
  },

  /**
   * Sets the currently pressed key for visual feedback.
   * @param key - The key being pressed, or null when released
   */
  setPressedKey: (key) => set({ pressedKey: key }),

  /**
   * Sets whether an animation is currently running.
   * @param val - True if animation is in progress
   */
  setIsAnimating: (val) => set({ isAnimating: val }),
}));
