import React from 'react';
import RetroScreen from './RetroScreen';
import RetroKeypad from './RetroKeypad';
import { useRetroCalculator } from '../hooks/useRetroCalculator';
import logo from '../assets/casio_logo.svg';

const RetroCalculator: React.FC = () => {
  const { state, handleClick } = useRetroCalculator();

  // Format display value to fit in 8 digits
  const formatDisplayValue = (val: string | number): string => {
    if (val === '') return '';
    
    const strVal = String(val);
    
    // Remove leading minus for counting
    const absStr = strVal.replace('-', '');
    
    // Count digits (excluding decimal point)
    const digitCount = absStr.replace('.', '').length;
    
    // If within limit, return as-is
    if (digitCount <= 8) {
      return strVal;
    }
    
    // Try to format with scientific notation or truncate
    const numVal = Number(val);
    if (Math.abs(numVal) >= 99999999 || digitCount > 8) {
      // Show first 8 significant digits
      const formatted = numVal.toPrecision(8);
      // Make sure it still fits
      if (formatted.replace('-', '').replace('.', '').length <= 8) {
        return formatted;
      }
      // Otherwise return as much as we can fit
      return String(numVal).slice(0, 8);
    }
    
    return strVal;
  };

  const displayValue = formatDisplayValue(
    state.open ? (state.nextEntry !== null ? state.nextEntry : state.currentEntry) : ''
  );

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
            textAlign: 'center'
          }}>
            TWO WAY POWER
          </div>
        </div>
      </header>

      <main>
        <RetroScreen 
          value={displayValue} 
          memory={!!state.memory}
          error={state.error}
          negative={Number(state.nextEntry !== null ? state.nextEntry : state.currentEntry) < 0}
        />
        <div style={{ position: 'relative' }}>
          <h2 style={{ 
            position: 'absolute', 
            fontSize: '10px', 
            top: '2px', 
            left: '24px' 
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
