/**
 * @fileoverview Animation runner hook for executing calculator button sequences.
 *
 * This hook bridges AI responses (which queue animations) with the visual UI,
 * processing queued animation sequences one at a time with visual button feedback.
 *
 * @module hooks/useAnimationRunner
 */

import { useEffect } from 'react';
import { useCalculatorStore } from '../state/useCalculatorStore';
import type { AnimationCommand } from '../types/calculator';

/**
 * Returns a promise that resolves after the specified milliseconds.
 * @param ms - Milliseconds to sleep
 * @returns Promise that resolves after the delay
 */
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Hook that processes the animation queue from the calculator store.
 *
 * When AI responses include key sequences, they are queued as animations.
 * This hook watches the queue and executes animations one at a time:
 *
 * 1. Takes the first animation from the queue
 * 2. For each command in the sequence:
 *    - `pressKey`: Shows visual button press, waits, then executes logic
 *    - `setDisplay`: (Reserved for future display override functionality)
 *    - `sleep`: Pauses between actions
 * 3. Calls the animation's completion callback with the final display value
 * 4. Removes the animation from the queue and processes the next one
 *
 * @example
 * ```tsx
 * // In App.tsx - just call the hook to enable animation processing
 * function App() {
 *   useAnimationRunner();
 *   return <Calculator />;
 * }
 * ```
 *
 * Animation flow:
 * ```
 * AI Response → enqueueAnimation() → animationQueue
 *                                          ↓
 *                              useAnimationRunner watches
 *                                          ↓
 *                              Process commands sequentially
 *                                          ↓
 *                              Visual button press (setPressedKey)
 *                                          ↓
 *                              Execute calculator logic (pressKey)
 *                                          ↓
 *                              Call completion callback
 *                                          ↓
 *                              Result message added to chat
 * ```
 */
export const useAnimationRunner = () => {
  const {
    animationQueue,
    isAnimating,
    setIsAnimating,
    setPressedKey,
    getAnimationCallback,
    removeAnimationCallback,
  } = useCalculatorStore();

  const pressKey = useCalculatorStore((s) => s.pressKey);

  useEffect(() => {
    // Skip if already animating or nothing in queue
    if (isAnimating || animationQueue.length === 0) return;

    // Take the first animation from the queue
    const [current, ...rest] = animationQueue;
    setIsAnimating(true);

    /**
     * Executes an array of animation commands sequentially.
     * @param commands - The animation commands to execute
     */
    const run = async (commands: AnimationCommand[]) => {
      for (const cmd of commands) {
        if (cmd.type === 'pressKey') {
          // Show visual button press
          setPressedKey(cmd.key);
          await sleep(cmd.delayMs ?? 350); // Hold the visual press
          setPressedKey(null);
          await sleep(100); // Pause between key release and next action
          // Execute the actual calculator logic
          pressKey(cmd.key);
        } else if (cmd.type === 'setDisplay') {
          // Reserved for future display override functionality
        } else if (cmd.type === 'sleep') {
          await sleep(cmd.durationMs);
        }
      }
    };

    // Run the animation and handle completion
    run(current.commands).finally(() => {
      // Get the final display value and call the callback if registered
      const callback = getAnimationCallback(current.id);
      if (callback) {
        const displayText = useCalculatorStore.getState().display.text;
        callback(displayText);
        removeAnimationCallback(current.id);
      }

      // Remove this animation and mark as not animating
      useCalculatorStore.setState({
        animationQueue: rest,
        isAnimating: false,
      });
    });
  }, [
    animationQueue,
    isAnimating,
    pressKey,
    setIsAnimating,
    setPressedKey,
    getAnimationCallback,
    removeAnimationCallback,
  ]);
};
