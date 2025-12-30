/**
 * @fileoverview Main retro calculator component styled after Casio SL-300SV.
 *
 * This is the primary calculator UI component that combines:
 * - RetroScreen for LCD display
 * - RetroKeypad for button input
 * - Power on/off functionality
 *
 * @module components/RetroCalculator
 */

import React, { useState } from 'react';
import RetroScreen from './RetroScreen';
import RetroKeypad from './RetroKeypad';
import { useCalculatorStore } from '../state/useCalculatorStore';
import logo from '../assets/casio_logo.svg';
import { RETRO_KEY_TO_KEY_ID, MEMORY_KEY_MAP } from '../types/keyMetadata';
import styles from './RetroCalculator.module.css';

/**
 * Main calculator component that renders the complete Casio SL-300SV replica.
 *
 * Features:
 * - Retro LCD display with 7-segment-style digits
 * - Full keypad with number, operation, and memory buttons
 * - Power on/off toggle with AC reset on power-on
 * - Visual flash effect when digit limit is exceeded
 * - Casio logo and "TWO WAY POWER" indicator
 *
 * @returns The rendered calculator component
 *
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <div className="calculator-container">
 *       <RetroCalculator />
 *     </div>
 *   );
 * }
 * ```
 */
const RetroCalculator: React.FC = () => {
  const { display, pressKey, shouldFlash } = useCalculatorStore();
  const [isOn, setIsOn] = useState(true);

  /**
   * Handles key press events from the RetroKeypad.
   *
   * Routes key presses to appropriate handlers:
   * - Power buttons (on/off) control calculator state
   * - Memory buttons map to memory KeyIds
   * - Other buttons map via retroKeyToKeyId
   *
   * @param key - The key definition with type and value
   */
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
      const keyId = MEMORY_KEY_MAP[key.value];
      if (keyId) {
        pressKey(keyId);
      }
      return;
    }

    // Map standard keys
    const keyId = RETRO_KEY_TO_KEY_ID[key.value as keyof typeof RETRO_KEY_TO_KEY_ID];
    if (keyId) {
      pressKey(keyId);
    }
  };

  /**
   * Formats the display value, defaulting empty string to '0'.
   * @param val - The raw display value
   * @returns Formatted display string
   */
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
          <div className={styles.powerIndicatorLabel}>TWO WAY POWER</div>
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
          <h2 className={styles.modelLabel}>SL-300SV</h2>
          <RetroKeypad onKeyClick={handleClick} />
        </div>
      </main>
    </div>
  );
};

export default RetroCalculator;
