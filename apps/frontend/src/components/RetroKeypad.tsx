/**
 * @fileoverview Physical keypad component for the retro calculator.
 *
 * Renders a 6x5 grid of calculator buttons matching the Casio SL-300SV layout.
 * Features realistic 3D button effects with hover, press, and release animations.
 * Supports programmatic button presses for AI-driven animations.
 *
 * @module components/RetroKeypad
 */

import React, { useRef, useEffect } from 'react';
import sqrtIcon from '../assets/icons/sqrt.svg';
import changeSignIcon from '../assets/icons/change-sign.svg';
import { useCalculatorStore } from '../state/useCalculatorStore';
import type { KeyId } from '../types';
import styles from './RetroKeypad.module.css';

/**
 * Maps calculator engine KeyIds to RetroKeypad button identifiers.
 * Used to trigger visual button presses during AI-driven animations.
 */
const keyIdToRetroKey: Partial<Record<KeyId, string>> = {
  digit_0: '0',
  digit_1: '1',
  digit_2: '2',
  digit_3: '3',
  digit_4: '4',
  digit_5: '5',
  digit_6: '6',
  digit_7: '7',
  digit_8: '8',
  digit_9: '9',
  decimal: 'float',
  add: 'plus',
  sub: 'minus',
  mul: 'multiply',
  div: 'divide',
  percent: 'percentage',
  equals: 'perform',
  ac: 'on',
  c: 'clear',
  mc: 'mc',
  mr: 'mr',
  m_plus: 'm+',
  m_minus: 'm-',
  plus_minus: 'change_sign',
  // Note: 'sqrt' maps to itself
};

/**
 * Physical button layout matching Casio SL-300SV.
 * 6 rows x 5 columns grid. Empty strings create spacers.
 * null indicates where the tall '+' button extends.
 */
const layout = [
  ['', '', '', 'sqrt', 'off'],
  ['mc', 'mr', 'm-', 'm+', 'divide'],
  ['percentage', '7', '8', '9', 'multiply'],
  ['change_sign', '4', '5', '6', 'minus'],
  ['clear', '1', '2', '3', 'plus'],
  ['on', '0', 'float', 'perform', null], // null = plus continues here
];

/**
 * Definition for a calculator key button.
 */
type KeyDef = {
  /** Button category: MAIN, BASIC, MEMORY, MATH, NUMBER */
  type: string;
  /** Internal value used for key mapping */
  value: string;
  /** Display label shown on the button */
  label: string;
  /** Optional CSS modifier classes (-red, -small, -large, --acbutton) */
  extraClass?: string;
};

/**
 * Complete button definitions for all calculator keys.
 * Maps layout keys to their display and behavior properties.
 */
const keyDefinitions: Record<string, KeyDef> = {
  // Power/Clear buttons (red)
  off: { type: 'MAIN', value: 'off', label: 'OFF', extraClass: '-small' },
  clear: { type: 'MAIN', value: 'clear', label: 'C', extraClass: '-red' },
  on: { type: 'MAIN', value: 'on', label: 'AC', extraClass: '-red --acbutton' },
  // Operation buttons
  perform: { type: 'BASIC', value: 'perform', label: '=' },
  divide: { type: 'BASIC', value: 'divide', label: '÷' },
  percentage: { type: 'BASIC', value: 'percentage', label: '%' },
  multiply: { type: 'BASIC', value: 'multiply', label: '✕' },
  minus: { type: 'BASIC', value: 'minus', label: '−' },
  plus: { type: 'BASIC', value: 'plus', label: '+', extraClass: '-large' },
  // Memory buttons
  mc: { type: 'MEMORY', value: 'clear', label: 'MC' },
  mr: { type: 'MEMORY', value: 'recall', label: 'MR' },
  'm-': { type: 'MEMORY', value: 'minus', label: 'M-' },
  'm+': { type: 'MEMORY', value: 'plus', label: 'M+' },
  // Math function buttons
  float: { type: 'MATH', value: 'float', label: '⋅' },
  change_sign: { type: 'MATH', value: 'change_sign', label: '+/-' },
  sqrt: { type: 'MATH', value: 'sqrt', label: '√', extraClass: '-small' },
  // Number buttons
  '0': { type: 'NUMBER', value: '0', label: '0' },
  '1': { type: 'NUMBER', value: '1', label: '1' },
  '2': { type: 'NUMBER', value: '2', label: '2' },
  '3': { type: 'NUMBER', value: '3', label: '3' },
  '4': { type: 'NUMBER', value: '4', label: '4' },
  '5': { type: 'NUMBER', value: '5', label: '5' },
  '6': { type: 'NUMBER', value: '6', label: '6' },
  '7': { type: 'NUMBER', value: '7', label: '7' },
  '8': { type: 'NUMBER', value: '8', label: '8' },
  '9': { type: 'NUMBER', value: '9', label: '9' },
};

/**
 * Props for the RetroKeypad component.
 */
type RetroKeypadProps = {
  /** Callback when a key is clicked */
  onKeyClick: (key: KeyDef) => void;
};

/**
 * Physical keypad component with realistic 3D button effects.
 *
 * Features:
 * - 6x5 grid layout matching Casio SL-300SV
 * - Realistic hover, press, and release animations
 * - Programmatic button press animations (for AI sequences)
 * - Red buttons for AC/C/OFF
 * - Tall '+' button spanning two rows
 * - SVG icons for sqrt and +/- buttons
 *
 * @param props - Component props
 * @returns The rendered keypad grid
 *
 * @example
 * ```tsx
 * <RetroKeypad onKeyClick={(key) => console.log('Pressed:', key.value)} />
 * ```
 */
const RetroKeypad: React.FC<RetroKeypadProps> = ({ onKeyClick }) => {
  const pressedKey = useCalculatorStore((state) => state.pressedKey);
  const buttonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  // Map animation system KeyId to our button identifier
  const activeRetroKey = pressedKey
    ? keyIdToRetroKey[pressedKey] || null
    : null;

  /**
   * Programmatically triggers a visual button press animation.
   * Used when the animation runner presses keys from AI sequences.
   *
   * @param button - The button element to animate
   */
  const triggerButtonPress = React.useCallback((button: HTMLButtonElement) => {
    const isRed = button.dataset.isRed === 'true';
    const originalBackground = button.style.background;
    const originalColor = button.style.color;
    const originalTransform = button.style.transform;
    const originalBoxShadow = button.style.boxShadow;
    const originalFilter = button.style.filter;

    // Apply pressed state - more pronounced effect
    button.style.color = '#aaa';
    if (isRed) {
      button.style.background =
        'linear-gradient(to bottom, #4a2430 0%, #3a1d26 50%, #2a1520 100%)';
    } else {
      button.style.background =
        'linear-gradient(to bottom, #1a1a1a 0%, #151515 50%, #101010 100%)';
    }
    button.style.transform = 'translateY(3px) scale(0.98)';
    button.style.filter = 'brightness(0.85)';
    button.style.boxShadow = `0px 0px 1px 1px rgba(0, 0, 0, 0.2),
      0px 0px 0px 1px rgba(0, 0, 0, 0.9),
      inset 2px 0px 2px 0px rgba(0, 0, 0, 0.5),
      inset -2px 0px 2px 0px rgba(0, 0, 0, 0.5),
      inset 0px 2px 2px 0px rgba(255, 255, 255, 0.2),
      inset 0px -2px 2px rgba(255, 255, 255, 0.05),
      0px 2px 4px 0px rgba(0, 0, 0, 0.4),
      inset 0px 6px 3px 2px rgba(0, 0, 0, 0.4)`;

    // Release after animation duration
    setTimeout(() => {
      button.style.color = originalColor;
      button.style.background = originalBackground;
      button.style.transform = originalTransform;
      button.style.boxShadow = originalBoxShadow;
      button.style.filter = originalFilter;
    }, 300);
  }, []);

  // Trigger visual animation when pressedKey changes
  useEffect(() => {
    if (activeRetroKey && buttonRefs.current.has(activeRetroKey)) {
      const button = buttonRefs.current.get(activeRetroKey);
      if (button) {
        // Programmatically trigger the pressed state
        triggerButtonPress(button);
      }
    }
  }, [activeRetroKey, triggerButtonPress]);

  const renderCell = (
    cellKey: string | null,
    rowIndex: number,
    cellIndex: number
  ) => {
    // Skip null cells (where large button extends)
    if (cellKey === null) {
      return null;
    }

    // Handle empty cells
    if (cellKey === '') {
      return <div key={`${rowIndex}-${cellIndex}`} className={styles.cell} />;
    }

    const keyDef = keyDefinitions[cellKey];
    if (!keyDef) return null;

    const isRed = keyDef.extraClass?.includes('-red');
    const isSmall = keyDef.extraClass?.includes('-small');
    const isLarge = keyDef.extraClass?.includes('-large');
    const isACButton = keyDef.extraClass?.includes('--acbutton');
    const isNumber = keyDef.type === 'NUMBER';
    const isFloat = keyDef.value === 'float';

    // Build button class names
    const buttonClasses = [styles.button];

    if (isRed) buttonClasses.push(styles.red);
    if (isSmall) buttonClasses.push(styles.small);
    if (isLarge) buttonClasses.push(styles.large);

    // Font size classes
    if (keyDef.value === 'divide' || (keyDef.value === 'plus' && isLarge)) {
      buttonClasses.push(
        keyDef.value === 'divide' ? styles.fontSizeDivide : styles.fontSizePlus
      );
    } else if (isNumber || isFloat) {
      buttonClasses.push(
        isNumber ? styles.fontSizeNumber : styles.fontSizeFloat
      );
    } else if (isRed) {
      buttonClasses.push(styles.fontSizeRed);
    } else if (isSmall) {
      buttonClasses.push(styles.fontSizeSmall);
    }

    // Get base backgrounds for restoring after hover/press
    const baseBackground = isRed
      ? 'linear-gradient(to bottom, #9d5565 0%, #7a3d4a 50%, #5d2f39 100%)'
      : 'linear-gradient(to bottom, #545454 0%, #3d3d3d 45%, #2a2a2a 100%)';

    const baseBoxShadow = `1px 1px 1px 1px rgba(0, 0, 0, 0.1),
      0px 0px 0px 1px rgba(0, 0, 0, 0.8),
      inset 1px 0px 1px 0px rgba(0, 0, 0, 0.3),
      inset -1px 0px 1px 0px rgba(0, 0, 0, 0.3),
      inset 0px 1px 1px 0px rgba(255, 255, 255, 0.5),
      inset 0px -3px 3px rgba(255, 255, 255, 0.15),
      0px 8px 10px 0px rgba(0, 0, 0, 0.3),
      inset 0px -3px 1px 1px rgba(0, 0, 0, 0.4),
      0px 0px 0px 3px rgba(0, 0, 0, 0.1)`;

    const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (isRed) {
        e.currentTarget.style.background =
          'linear-gradient(to bottom, #b66575 0%, #8d4a56 50%, #6d3b45 100%)';
      } else {
        e.currentTarget.style.background =
          'linear-gradient(to bottom, #646464 0%, #4a4a4a 50%, #353535 100%)';
      }
      e.currentTarget.style.boxShadow = `3px 3px 5px 0px rgba(0, 0, 0, 0.3),
        0px 0px 0px 1px rgba(0, 0, 0, 0.9),
        inset 1px 0px 1px 0px rgba(0, 0, 0, 0.3),
        inset -1px 0px 1px 0px rgba(0, 0, 0, 0.3),
        inset 0px 1px 1px 0px rgba(255, 255, 255, 0.9),
        inset 0px -3px 3px rgba(255, 255, 255, 0.1),
        0px 8px 10px 0px rgba(0, 0, 0, 0.3),
        inset 0px -3px 1px 1px rgba(0, 0, 0, 0.3),
        0px 0px 0px 3px rgba(0, 0, 0, 0.1)`;
    };

    const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.currentTarget.style.background = baseBackground;
      e.currentTarget.style.boxShadow = baseBoxShadow;
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.currentTarget.style.color = 'lightgray';
      if (isRed) {
        e.currentTarget.style.background =
          'linear-gradient(to bottom, #5d2f39 0%, #4a2430 50%, #3a1d26 100%)';
      } else {
        e.currentTarget.style.background =
          'linear-gradient(to bottom, #2a2a2a 0%, #252525 50%, #202020 100%)';
      }
      e.currentTarget.style.transform = 'translateY(1px)';
      e.currentTarget.style.boxShadow = `1px 1px 1px 1px rgba(0, 0, 0, 0.1),
        0px 0px 0px 1px rgba(0, 0, 0, 0.8),
        inset 1px 0px 1px 0px rgba(0, 0, 0, 0.3),
        inset -1px 0px 1px 0px rgba(0, 0, 0, 0.3),
        inset 0px 1px 1px 0px rgba(255, 255, 255, 0.4),
        inset 0px -3px 3px rgba(255, 255, 255, 0.1),
        0px 8px 10px 0px rgba(0, 0, 0, 0.3),
        inset 0px 4px 1px 1px rgba(0, 0, 0, 0.3)`;
    };

    const handleMouseUp = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.currentTarget.style.color = 'white';
      e.currentTarget.style.background = baseBackground;
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = baseBoxShadow;
    };

    return (
      <div key={`${rowIndex}-${cellIndex}`} className={styles.cell}>
        {isACButton && (
          <>
            <div className={styles.acDecorativeLeft} />
            <div className={styles.acDecorativeRight} />
          </>
        )}
        <button
          ref={(el) => {
            if (el) {
              buttonRefs.current.set(cellKey, el);
            } else {
              buttonRefs.current.delete(cellKey);
            }
          }}
          data-is-red={(isRed || false).toString()}
          className={buttonClasses.join(' ')}
          onClick={() => onKeyClick(keyDef)}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
        >
          {keyDef.value === 'sqrt' ? (
            <img
              src={sqrtIcon}
              alt="sqrt"
              className={`${styles.icon} ${styles.sqrtIcon}`}
            />
          ) : keyDef.value === 'change_sign' ? (
            <img
              src={changeSignIcon}
              alt="+/-"
              className={`${styles.icon} ${styles.changeSignIcon}`}
            />
          ) : (
            keyDef.label
          )}
        </button>
        {isACButton && <div className={styles.acOnLabel}>ON</div>}
      </div>
    );
  };

  return (
    <div className={styles.keypad}>
      {layout.map((row, rowIndex) => (
        <div key={rowIndex} className={styles.row}>
          {row.map((cell, cellIndex) => renderCell(cell, rowIndex, cellIndex))}
        </div>
      ))}
    </div>
  );
};

export default RetroKeypad;
