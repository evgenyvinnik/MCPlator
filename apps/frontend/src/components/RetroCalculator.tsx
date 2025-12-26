import React, { useState } from 'react';
import RetroScreen from './RetroScreen';
import RetroKeypad from './RetroKeypad';
import { useCalculatorStore } from '../state/useCalculatorStore';
import logo from '../assets/casio_logo.svg';
import type { KeyId } from '@calculator/shared-types';

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

  const handleClick = (key: { value: string }) => {
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
    <div 
      style={{
        position: 'relative',
        background: `
          linear-gradient(135deg, transparent 0%, rgba(255, 255, 255, 0.15) 50%, transparent 100%),
          repeating-linear-gradient(
            90deg,
            #c8cad0 0px,
            #d0d2d8 0.5px,
            #c8cad0 1px
          ),
          repeating-linear-gradient(
            0deg,
            #c8cad0 0px,
            #cccdd3 0.5px,
            #c8cad0 1px
          )
        `,
        backgroundColor: '#cfd1d7',
        backgroundBlendMode: 'overlay, multiply, multiply',
        padding: '14px 6px',
        width: '320px',
        maxWidth: '100%',
        margin: '0 auto',
        borderTopLeftRadius: '20px',
        borderTopRightRadius: '20px',
        borderBottomLeftRadius: '20px',
        borderBottomRightRadius: '20px',
        boxShadow: `0 15px 30px -5px rgba(0, 0, 0, 0.5),
          0 0px 1px 2px rgba(0, 0, 0, 0.25), 
          0 2px 3px 1px rgba(0, 0, 0, 0.5),
          inset 0 2px 1px 0 rgba(255, 255, 255, 0.6),
          inset 0 2px 5px 0 rgba(255, 255, 255, 0.3),
          inset 0 2px 15px 0 rgba(255, 255, 255, 0.2),
          inset 0 0px 40px 10px rgba(0, 0, 0, 0.25),
          inset 0 -2px 1px 0 rgba(0, 0, 0, 0.5),
          inset 0 -15px 15px -15px rgba(0, 0, 0, 0.4)`
      }}>
      {/* Head - matches original layout exactly */}
      <header style={{ padding: '0px 24px', width: '100%', overflow: 'hidden' }}>
        <img src={logo} alt="Casio Logo" style={{ width: '80px', marginTop: '14px', float: 'left' }} />
        <div style={{ float: 'right', width: '140px' }}>
          <div style={{ 
            background: '#111', 
            border: '4px ridge #706F71', 
            boxShadow: 'inset 0px 5px 5px #000',
            borderRadius: '6px', 
            width: '100%', 
            overflow: 'hidden' 
          }}>
            <div style={{ display: 'flex', height: '32px' }}>
              <div style={{ flex: 1, borderRight: '1px solid rgba(255, 0, 0, 0.4)' }}></div>
              <div style={{ flex: 1, borderRight: '1px solid rgba(255, 0, 0, 0.4)' }}></div>
              <div style={{ flex: 1, borderRight: '1px solid rgba(255, 0, 0, 0.4)' }}></div>
              <div style={{ flex: 1, borderRight: '1px solid rgba(255, 0, 0, 0.4)' }}></div>
              <div style={{ flex: 1 }}></div>
            </div>
          </div>
          <div style={{ 
            fontFamily: 'Trebuchet MS, Lucida Sans Unicode, Lucida Grande, Lucida Sans, Arial, sans-serif',
            fontWeight: 'bold',
            lineHeight: 2,
            fontSize: '10px',
            textAlign: 'center',
            color: '#000'
          }}>
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
        <div style={{ position: 'relative' }}>
          <h2 style={{ 
            position: 'absolute', 
            fontSize: '10px', 
            top: '2px', 
            left: '24px',
            color: '#000'
          }}>
            SL-300SV
          </h2>
          <RetroKeypad onKeyClick={handleClick} />
        </div>
      </main>
    </div>
  );
};

export default RetroCalculator;
