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
          await sleep(cmd.delayMs ?? 150);
          setPressedKey(null);
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
      useCalculatorStore.setState({
        animationQueue: rest,
        isAnimating: false,
      });
    });
  }, [animationQueue, isAnimating, pressKey, setIsAnimating, setPressedKey]);
};
