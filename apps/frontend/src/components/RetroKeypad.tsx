import React, { useRef, useEffect } from 'react';
import sqrtIcon from '../assets/icons/sqrt.svg';
import changeSignIcon from '../assets/icons/change-sign.svg';
import { useCalculatorStore } from '../state/useCalculatorStore';
import type { KeyId } from '@calculator/shared-types';

// Mapping from KeyId (animation system) to RetroKeypad button identifier
const keyIdToRetroKey: Record<KeyId, string> = {
  'digit_0': '0',
  'digit_1': '1',
  'digit_2': '2',
  'digit_3': '3',
  'digit_4': '4',
  'digit_5': '5',
  'digit_6': '6',
  'digit_7': '7',
  'digit_8': '8',
  'digit_9': '9',
  'decimal': 'float',
  'add': 'plus',
  'sub': 'minus',
  'mul': 'multiply',
  'div': 'divide',
  'percent': 'percentage',
  'equals': 'perform',
  'ac': 'on',
  'c': 'clear',
  'mc': 'mc',
  'mr': 'mr',
  'm_plus': 'm+',
  'm_minus': 'm-',
  'rate': '', // Not available in RetroKeypad
  'euro': '', // Not available in RetroKeypad
  'local': '', // Not available in RetroKeypad
};

// Define the layout matching original - 6 rows x 5 columns
const layout = [
  ['', '', '', 'sqrt', 'off'],
  ['mc', 'mr', 'm-', 'm+', 'divide'],
  ['percentage', '7', '8', '9', 'multiply'],
  ['change_sign', '4', '5', '6', 'minus'],
  ['clear', '1', '2', '3', 'plus'],
  ['on', '0', 'float', 'perform', null], // null = plus continues here
];

type KeyDef = {
  type: string;
  value: string;
  label: string;
  extraClass?: string;
};

const keyDefinitions: Record<string, KeyDef> = {
  'off': { type: 'MAIN', value: 'off', label: 'OFF', extraClass: '-small' },
  'clear': { type: 'MAIN', value: 'clear', label: 'C', extraClass: '-red' },
  'on': { type: 'MAIN', value: 'on', label: 'AC', extraClass: '-red --acbutton' },
  'perform': { type: 'BASIC', value: 'perform', label: '=' },
  'divide': { type: 'BASIC', value: 'divide', label: '÷' },
  'percentage': { type: 'BASIC', value: 'percentage', label: '%' },
  'multiply': { type: 'BASIC', value: 'multiply', label: '✕' },
  'minus': { type: 'BASIC', value: 'minus', label: '−' },
  'plus': { type: 'BASIC', value: 'plus', label: '+', extraClass: '-large' },
  'mc': { type: 'MEMORY', value: 'clear', label: 'MC' },
  'mr': { type: 'MEMORY', value: 'recall', label: 'MR' },
  'm-': { type: 'MEMORY', value: 'minus', label: 'M-' },
  'm+': { type: 'MEMORY', value: 'plus', label: 'M+' },
  'float': { type: 'MATH', value: 'float', label: '⋅' },
  'change_sign': { type: 'MATH', value: 'change_sign', label: '+/-' },
  'sqrt': { type: 'MATH', value: 'sqrt', label: '√', extraClass: '-small' },
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

type RetroKeypadProps = {
  onKeyClick: (key: KeyDef) => void;
};

// Base button styles matching original exactly
const buttonBaseStyle: React.CSSProperties = {
  position: 'relative',
  zIndex: 5,
  display: 'block',
  width: '100%',
  height: '40px',
  fontWeight: 500,
  fontSize: '20px',
  color: 'white',
  background: 'linear-gradient(to bottom, #545454 0%, #3d3d3d 45%, #2a2a2a 100%)',
  boxShadow: `1px 1px 1px 1px rgba(0, 0, 0, 0.1),
    0px 0px 0px 1px rgba(0, 0, 0, 0.8), 
    inset 1px 0px 1px 0px rgba(0, 0, 0, 0.3),
    inset -1px 0px 1px 0px rgba(0, 0, 0, 0.3),
    inset 0px 1px 1px 0px rgba(255, 255, 255, 0.5),
    inset 0px -3px 3px rgba(255, 255, 255, 0.15),
    0px 8px 10px 0px rgba(0, 0, 0, 0.3),
    inset 0px -3px 1px 1px rgba(0, 0, 0, 0.4),
    0px 0px 0px 3px rgba(0, 0, 0, 0.1)`,
  border: '1px solid #0b0c10',
  borderRadius: '6px 6px 12px 12px',
  transition: 'all 0.1s ease-out',
  cursor: 'pointer',
  outline: 'none',
  textShadow: '1px 2px 2px rgba(0, 0, 0, 0.5)',
};

const RetroKeypad: React.FC<RetroKeypadProps> = ({ onKeyClick }) => {
  const pressedKey = useCalculatorStore((state) => state.pressedKey);
  const buttonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  
  // Get the RetroKeypad key identifier from the current pressedKey (KeyId)
  const activeRetroKey = pressedKey ? keyIdToRetroKey[pressedKey] : null;
  
  // Helper function to simulate button press visually
  const triggerButtonPress = React.useCallback((button: HTMLButtonElement) => {
    const isRed = button.dataset.isRed === 'true';
    const originalBackground = button.style.background;
    const originalColor = button.style.color;
    const originalTransform = button.style.transform;
    const originalBoxShadow = button.style.boxShadow;
    
    // Apply pressed state
    button.style.color = 'lightgray';
    if (isRed) {
      button.style.background = 'linear-gradient(to bottom, #5d2f39 0%, #4a2430 50%, #3a1d26 100%)';
    } else {
      button.style.background = 'linear-gradient(to bottom, #2a2a2a 0%, #252525 50%, #202020 100%)';
    }
    button.style.transform = 'translateY(1px)';
    button.style.boxShadow = `1px 1px 1px 1px rgba(0, 0, 0, 0.1),
      0px 0px 0px 1px rgba(0, 0, 0, 0.8), 
      inset 1px 0px 1px 0px rgba(0, 0, 0, 0.3),
      inset -1px 0px 1px 0px rgba(0, 0, 0, 0.3),
      inset 0px 1px 1px 0px rgba(255, 255, 255, 0.4),
      inset 0px -3px 3px rgba(255, 255, 255, 0.1),
      0px 8px 10px 0px rgba(0, 0, 0, 0.3),
      inset 0px 4px 1px 1px rgba(0, 0, 0, 0.3)`;
    
    // Release after a short delay
    setTimeout(() => {
      button.style.color = originalColor;
      button.style.background = originalBackground;
      button.style.transform = originalTransform;
      button.style.boxShadow = originalBoxShadow;
    }, 100);
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
  
  const renderCell = (cellKey: string | null, rowIndex: number, cellIndex: number) => {
    // Skip null cells (where large button extends)
    if (cellKey === null) {
      return null;
    }

    // Handle empty cells
    if (cellKey === '') {
      return (
        <div 
          key={`${rowIndex}-${cellIndex}`} 
          style={{ 
            display: 'inline-block', 
            position: 'relative', 
            width: '20%', 
            padding: '6px 4px' 
          }}
        />
      );
    }

    const keyDef = keyDefinitions[cellKey];
    if (!keyDef) return null;

    const isRed = keyDef.extraClass?.includes('-red');
    const isSmall = keyDef.extraClass?.includes('-small');
    const isLarge = keyDef.extraClass?.includes('-large');
    const isACButton = keyDef.extraClass?.includes('--acbutton');
    const isNumber = keyDef.type === 'NUMBER';
    const isFloat = keyDef.value === 'float';

    // Cell classes
    const cellClasses = [
      keyDef.extraClass || '',
      `${keyDef.type}_FUNC${keyDef.value}`
    ].join(' ');

    // Determine font size based on button type - matching original CSS exactly
    let fontSize = '20px';
    if (keyDef.value === 'divide' || (keyDef.value === 'plus' && isLarge)) {
      fontSize = '28px';
    } else if (isNumber || isFloat) {
      fontSize = '24px';
    } else if (isRed) {
      fontSize = '22px';
    } else if (isSmall) {
      fontSize = '18px';
    }

    // Build button style
    // eslint-disable-next-line prefer-const
    let buttonStyle: React.CSSProperties = { ...buttonBaseStyle, fontSize };

    if (isRed) {
      buttonStyle.background = 'linear-gradient(to bottom, #9d5565 0%, #7a3d4a 50%, #5d2f39 100%)';
    }

    if (isSmall) {
      buttonStyle.height = '30px';
    }

    if (isLarge) {
      buttonStyle.height = '92px';
      buttonStyle.zIndex = 100;
      buttonStyle.position = 'absolute';
      buttonStyle.top = '-13px';
      buttonStyle.width = 'calc(100% - 8px)';
    }

    const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (isRed) {
        e.currentTarget.style.background = 'linear-gradient(to bottom, #b66575 0%, #8d4a56 50%, #6d3b45 100%)';
      } else {
        e.currentTarget.style.background = 'linear-gradient(to bottom, #646464 0%, #4a4a4a 50%, #353535 100%)';
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
      e.currentTarget.style.background = buttonStyle.background as string;
      e.currentTarget.style.boxShadow = buttonBaseStyle.boxShadow as string;
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.currentTarget.style.color = 'lightgray';
      if (isRed) {
        e.currentTarget.style.background = 'linear-gradient(to bottom, #5d2f39 0%, #4a2430 50%, #3a1d26 100%)';
      } else {
        e.currentTarget.style.background = 'linear-gradient(to bottom, #2a2a2a 0%, #252525 50%, #202020 100%)';
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
      e.currentTarget.style.background = buttonStyle.background as string;
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = buttonBaseStyle.boxShadow as string;
    };

    return (
      <div 
        key={`${rowIndex}-${cellIndex}`}
        className={cellClasses}
        style={{ 
          display: 'inline-block', 
          position: 'relative', 
          width: '20%', 
          padding: '6px 4px' 
        }}
      >
        {isACButton && (
          <>
            <div 
              style={{
                zIndex: 1,
                position: 'absolute',
                content: '""',
                display: 'block',
                height: '28px',
                width: '6px',
                top: '10px',
                left: '-2px',
                transform: 'skewX(3deg)',
                borderRadius: '6px 0px 6px 9px',
                border: '2px solid #0b0c10',
                background: 'linear-gradient(to bottom, #404040 60%, #5e6474 100%)',
                boxShadow: 'inset 1px 1px 1px rgba(255, 255, 255, 0.3)'
              }}
            />
            <div 
              style={{
                zIndex: 1,
                position: 'absolute',
                content: '""',
                display: 'block',
                height: '28px',
                width: '6px',
                top: '10px',
                left: 'auto',
                right: '-1px',
                transform: 'skewX(-3deg)',
                borderRadius: '0px 6px 6px 9px',
                border: '2px solid #0b0c10',
                background: 'linear-gradient(to bottom, #404040 60%, #5e6474 100%)',
                boxShadow: 'inset 1px 1px 1px rgba(255, 255, 255, 0.3)'
              }}
            />
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
          style={buttonStyle}
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
              style={{
                width: '22px',
                height: '22px',
                display: 'inline-block',
                verticalAlign: 'middle',
                marginTop: '-1px',
              }}
            />
          ) : keyDef.value === 'change_sign' ? (
            <img
              src={changeSignIcon}
              alt="+/-"
              style={{
                width: '26px',
                height: '26px',
                display: 'inline-block',
                verticalAlign: 'middle',
                marginTop: '-1px',
              }}
            />
          ) : (
            keyDef.label
          )}
        </button>
        {isACButton && (
          <div 
            style={{
              position: 'absolute',
              bottom: '-14px',
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: '10px',
              textAlign: 'center',
              color: '#404040',
              textShadow: 'none',
              whiteSpace: 'nowrap'
            }}
          >
            ON
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ padding: '4px 10px 14px' }}>
      {layout.map((row, rowIndex) => (
        <div 
          key={rowIndex} 
          style={{ 
            width: '100%', 
            position: 'relative', 
            display: 'flex', 
            alignItems: 'center' 
          }}
        >
          {row.map((cell, cellIndex) => renderCell(cell, rowIndex, cellIndex))}
        </div>
      ))}
    </div>
  );
};

export default RetroKeypad;
