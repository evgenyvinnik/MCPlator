import React from 'react';
import RetroScreen from './RetroScreen';
import RetroKeypad from './RetroKeypad';
import { useRetroCalculator } from '../hooks/useRetroCalculator';
import logo from '../assets/casio_logo.svg';

const RetroCalculator: React.FC = () => {
  const { state, handleClick } = useRetroCalculator();

  return (
    <div 
      style={{
        position: 'relative',
        background: `
          repeating-linear-gradient(
            90deg,
            #d0d1d7 0px,
            #d4d5db 1px,
            #d0d1d7 2px
          ),
          repeating-linear-gradient(
            0deg,
            #d0d1d7 0px,
            #cdced4 1px,
            #d0d1d7 2px
          )
        `,
        backgroundColor: '#d0d1d7',
        backgroundBlendMode: 'multiply',
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
          inset 0 2px 1px 0 rgba(255, 255, 255, 0.5),
          inset 0 2px 5px 0 rgba(255, 255, 255, 0.25),
          inset 0 2px 15px 0 rgba(255, 255, 255, 0.25),
          inset 0 0px 40px 10px rgba(0, 0, 0, 0.35),
          inset 0 -2px 1px 0 rgba(0, 0, 0, 0.5),
          inset 0 -15px 15px -15px rgba(0, 0, 0, 0.5)`
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
          value={state.open ? (state.nextEntry !== null ? state.nextEntry : state.currentEntry) : ''} 
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
