/**
 * @fileoverview LCD screen component for the retro calculator.
 *
 * Renders a realistic LCD display with:
 * - Individual digit rendering with retro font
 * - Thousand separators (')
 * - Decimal point placement
 * - Status indicators (Memory, Negative, Error)
 * - On/off visual states
 * - Flash animation for digit limit exceeded
 *
 * @module components/RetroScreen
 */

import React from 'react';
import styles from './RetroScreen.module.css';

/**
 * Props for the RetroScreen component.
 */
type RetroScreenProps = {
  /** The value to display (number or string) */
  value: string | number;
  /** Whether memory contains a value */
  memory: boolean;
  /** Whether an error occurred (e.g., division by zero) */
  error: boolean;
  /** Whether the displayed value is negative */
  negative: boolean;
  /** Whether the calculator is powered on */
  isOn: boolean;
  /** Triggers flash animation when digit limit is exceeded */
  shouldFlash: boolean;
};

/**
 * LCD screen component that displays the calculator value and indicators.
 *
 * Features:
 * - Parses numeric values into individual digit elements
 * - Adds thousand separators (') every 3 digits in integer part
 * - Handles decimal points correctly
 * - Shows indicators: M (memory), hexagon (negative), E (error)
 * - Dims display when calculator is off
 * - Flashes when digit limit is exceeded
 *
 * @param props - Component props
 * @returns The rendered LCD screen
 *
 * @example
 * ```tsx
 * <RetroScreen
 *   value="1234567"
 *   memory={false}
 *   error={false}
 *   negative={false}
 *   isOn={true}
 *   shouldFlash={false}
 * />
 * ```
 */
const RetroScreen: React.FC<RetroScreenProps> = ({
  value,
  memory,
  error,
  negative,
  isOn,
  shouldFlash,
}) => {
  return (
    <div className={styles.screenContainer}>
      <div
        className={`${styles.displayArea} ${shouldFlash ? styles.flash : ''}`}
      >
        <div
          className={`${styles.displayValue} ${isOn ? styles.on : styles.off}`}
        >
          {(() => {
            // Parse value into digits and decimal points
            // Remove minus sign as it's displayed via the hexagon indicator
            const str = String(value).replace('-', '');
            const [integerPart, fractionPart] = str.split('.');

            const digits: {
              char: string;
              hasDot: boolean;
              hasSeparator: boolean;
            }[] = [];

            // Process integer part
            const intChars = integerPart.split('');
            for (let i = 0; i < intChars.length; i++) {
              // Calculate if this digit needs a thousand separator
              // It needs one if:
              // 1. It's not the last digit of the integer part
              // 2. The number of digits following it in the integer part is a multiple of 3
              const digitsFollowing = intChars.length - 1 - i;
              const hasSeparator =
                digitsFollowing > 0 && digitsFollowing % 3 === 0;

              digits.push({ char: intChars[i], hasDot: false, hasSeparator });
            }

            // Handle decimal point at end of integer part (e.g. "123.")
            if (str.endsWith('.') || fractionPart !== undefined) {
              if (digits.length > 0) {
                digits[digits.length - 1].hasDot = true;
              } else {
                // Leading decimal
                digits.push({ char: '0', hasDot: true, hasSeparator: false });
              }
            }

            // Process fraction part
            if (fractionPart) {
              const fracChars = fractionPart.split('');
              for (let i = 0; i < fracChars.length; i++) {
                digits.push({
                  char: fracChars[i],
                  hasDot: false,
                  hasSeparator: false,
                });
              }
            }

            return digits.map((d, i) => (
              <div key={i} className={styles.digitContainer}>
                {/* Thousand Separator */}
                <div
                  className={`${styles.separator} ${d.hasSeparator ? styles.visible : styles.hidden}`}
                >
                  '
                </div>

                <span className={styles.digit}>{d.char}</span>

                {/* Decimal Point */}
                <div
                  className={`${styles.decimalPoint} ${d.hasDot ? styles.visible : styles.hidden}`}
                >
                  .
                </div>
              </div>
            ));
          })()}
        </div>
        {/* Indicators: M (memory), minus (negative), E (error) */}
        <div
          className={`${styles.indicatorsArea} ${isOn ? styles.on : styles.off}`}
        >
          {/* Memory Indicator */}
          <div
            className={`${styles.memoryIndicator} ${memory ? styles.active : styles.inactive}`}
          >
            M
          </div>

          {/* Negative Indicator - Hexagon */}
          <div
            className={`${styles.negativeIndicator} ${negative ? styles.active : styles.inactive}`}
          >
            <svg
              viewBox="0 0 100 86.6"
              width="100%"
              height="100%"
              className={styles.hexagon}
              preserveAspectRatio="none"
            >
              <polygon points="25,0 75,0 100,43.3 75,86.6 25,86.6 0,43.3" />
            </svg>
          </div>

          {/* Error Indicator */}
          <div
            className={`${styles.errorIndicator} ${error ? styles.active : styles.inactive}`}
          >
            E
          </div>
        </div>
      </div>
    </div>
  );
};

export default RetroScreen;
