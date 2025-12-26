import React, { useState } from 'react';
import RetroScreen from './RetroScreen';
import RetroKeypad from './RetroKeypad';
import { useCalculatorStore } from '../state/useCalculatorStore';
import logo from '../assets/casio_logo.svg';
import type { KeyId } from '@calculator/shared-types';
import styles from './RetroCalculator.module.css';

// Map RetroKeypad key values to KeyId
const retroKeyToKeyId: Record<string, KeyId> = {
  // Numbers
  '0': 'digit_0', '1': 'digit_1', '2': 'digit_2', '3': 'digit_3', '4': 'digit_4',
  '5': 'digit_5', '6': 'digit_6', '7': 'digit_7', '8': 'digit_8', '9': 'digit_9',
  // Decimal
  'float': 'decimal',
  // Operations
  'plus': 'add', 'minus': 'sub', 'multiply': 'mul', 'divide': 'div',
  // Equals
  'perform': 'equals',
  // Clear
  'on': 'ac', 'clear': 'c',
  // Percent
  'percentage': 'percent',
  // Plus/Minus (change sign)
  'change_sign': 'plus_minus',
  // Square root
  'sqrt': 'sqrt',
};

const RetroCalculator: React.FC = () => {
  const { display, pressKey, shouldFlash } = useCalculatorStore();
  const [isOn, setIsOn] = useState(true);

  const handleClick = (key: { type?: string; value: string }) => {
    // Handle power buttons
    if (key.value === 'off') {
      setIsOn(false);
      return;
    }
    if (key.value === 'on') {
      setIsOn(true);
      // Also trigger AC when turning on
      pressKey('ac');
      return;
    }

    // Ignore other keys when calculator is off
    if (!isOn) {
      return;
    }

    // Handle memory operations separately (they have type === 'MEMORY')
    if (key.type === 'MEMORY') {
      const memoryKeyMap: Record<string, KeyId> = {
        'clear': 'mc',
        'recall': 'mr',
        'plus': 'm_plus',
        'minus': 'm_minus',
      };
      const keyId = memoryKeyMap[key.value];
      if (keyId) {
        pressKey(keyId);
      }
      return;
    }

    const keyId = retroKeyToKeyId[key.value];
    if (keyId) {
      pressKey(keyId);
    }
  };

  // Format display value to fit in 8 digits
  const formatDisplayValue = (val: string): string => {
    if (val === '') return '0';
    return val;
  };

  const displayValue = formatDisplayValue(display.text);
  const isNegative = display.text.startsWith('-');

  return (
    <div className={styles.calculator}>
      {/* Head - matches original layout exactly */}
      <header className={styles.header}>
        <img src={logo} alt="Casio Logo" className={styles.logo} />
        <div className={styles.powerIndicatorContainer}>
          <div className={styles.powerIndicatorPanel}>
            <div className={styles.powerIndicatorBars}>
              <div className={styles.powerIndicatorBar}></div>
              <div className={styles.powerIndicatorBar}></div>
              <div className={styles.powerIndicatorBar}></div>
              <div className={styles.powerIndicatorBar}></div>
              <div className={styles.powerIndicatorBar}></div>
            </div>
          </div>
          <div className={styles.powerIndicatorLabel}>
            TWO WAY POWER
          </div>
        </div>
      </header>

      <main>
        <RetroScreen
          value={displayValue}
          memory={display.indicators.memory}
          error={display.indicators.error}
          negative={isNegative}
          isOn={isOn}
          shouldFlash={shouldFlash}
        />
        <div className={styles.modelLabelContainer}>
          <h2 className={styles.modelLabel}>
            SL-300SV
          </h2>
          <RetroKeypad onKeyClick={handleClick} />
        </div>
      </main>
    </div>
  );
};

export default RetroCalculator;
