import { useEffect } from 'react';
import { useCalculatorStore } from '../state/useCalculatorStore';
import type { AnimationCommand } from '@calculator/shared-types';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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
    if (isAnimating || animationQueue.length === 0) return;

    const [current, ...rest] = animationQueue;
    setIsAnimating(true);

    const run = async (commands: AnimationCommand[]) => {
      for (const cmd of commands) {
        if (cmd.type === 'pressKey') {
          setPressedKey(cmd.key);
          await sleep(cmd.delayMs ?? 350); // Slower key press animation
          setPressedKey(null);
          await sleep(100); // Pause between key release and next action
          // apply logic to calculator
          pressKey(cmd.key);
        } else if (cmd.type === 'setDisplay') {
          // optional: you could force a display override here
        } else if (cmd.type === 'sleep') {
          await sleep(cmd.durationMs);
        }
      }
    };

    run(current.commands).finally(() => {
      // Get the final display value and call the callback if registered
      const callback = getAnimationCallback(current.id);
      if (callback) {
        const displayText = useCalculatorStore.getState().display.text;
        callback(displayText);
        removeAnimationCallback(current.id);
      }

      useCalculatorStore.setState({
        animationQueue: rest,
        isAnimating: false,
      });
    });
  }, [animationQueue, isAnimating, pressKey, setIsAnimating, setPressedKey, getAnimationCallback, removeAnimationCallback]);
};
