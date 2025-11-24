import React from 'react';

type RetroScreenProps = {
  value: string | number;
  memory: boolean;
  error: boolean;
  negative: boolean;
  isOn: boolean;
};

const RetroScreen: React.FC<RetroScreenProps> = ({ value, memory, error, negative, isOn }) => {
  return (
    <div 
      style={{
        background: 'linear-gradient(to bottom, #4f5053 50%, #6e727b 100%)',
        borderRadius: '6px 6px 12px 12px',
        padding: '18px 14px'
      }}
    >
      <div 
        style={{
          position: 'relative',
          overflow: 'hidden',
          height: '94px',
          padding: '16px 4px',
          borderRadius: '4px',
          boxShadow: '0px 2px 3px 3px rgba(255, 255, 255, 0.3), -1px -3px 1px 3px rgba(0, 0, 0, 0.55)',
          background: 'linear-gradient(to bottom, #c3ced0 30%, #dbe2ea 100%)',
          textAlign: 'right'
        }}
      >
        <div 
          style={{ 
            fontFamily: 'digit',
            fontSize: '60px', // Increased for larger digits
            position: 'absolute',
            right: '8px',
            top: '18px', // Adjusted for vertical centering
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'flex-end',
            width: 'calc(100% - 40px)', // Leave space for indicators
            height: '80px',
            color: '#111', // Enforce dark color
            opacity: isOn ? 1 : 0, // Hide when off
            transition: 'opacity 0.2s ease-in-out',
            gap: '1px', // Minimal gap between digits
            letterSpacing: '1px' // Compress digits together
          }}
        >
          {(() => {
            // Parse value into digits and decimal points
            const str = String(value).replace('-', ''); // Remove minus sign as it's handled by indicator
            const [integerPart, fractionPart] = str.split('.');
            
            const digits: { char: string; hasDot: boolean; hasSeparator: boolean }[] = [];
            
            // Process integer part
            const intChars = integerPart.split('');
            for (let i = 0; i < intChars.length; i++) {
              // Calculate if this digit needs a thousand separator
              // It needs one if:
              // 1. It's not the last digit of the integer part
              // 2. The number of digits following it in the integer part is a multiple of 3
              const digitsFollowing = intChars.length - 1 - i;
              const hasSeparator = digitsFollowing > 0 && digitsFollowing % 3 === 0;
              
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
                digits.push({ char: fracChars[i], hasDot: false, hasSeparator: false });
              }
            }

            return digits.map((d, i) => (
              <div key={i} style={{ position: 'relative', display: 'flex', alignItems: 'baseline' }}>
                {/* Thousand Separator */}
                <div style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-4px',
                  opacity: d.hasSeparator ? 1 : 0,
                  fontSize: '30px', // Maximum size thousands separator
                  fontWeight: 'bold',
                  color: '#111',
                  fontFamily: 'sans-serif',
                }}>
                  '
                </div>

                <span>{d.char}</span>
                
                {/* Decimal Point */}
                <div 
                  style={{ 
                    width: '6px', 
                    height: '6px', 
                    background: d.hasDot ? '#111' : 'transparent',
                    borderRadius: '50%',
                    opacity: d.hasDot ? 1 : 0,
                    position: 'absolute',
                    bottom: '4px',
                    right: '-3px'
                  }} 
                />
              </div>
            ));
          })()}
        </div>
        {/* Indicators: M (memory), minus (negative), E (error) */}
        <div 
          style={{
            position: 'absolute',
            top: '24px',
            left: '8px',
            width: '24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            pointerEvents: 'none',
            opacity: isOn ? 1 : 0, // Hide indicators when off
            transition: 'opacity 0.2s ease-in-out'
          }}
        >
          {/* Memory Indicator */}
          <div style={{ 
            opacity: memory ? 1 : 0.1, 
            fontSize: '12px', 
            fontWeight: 600,
            fontFamily: 'sans-serif',
            color: '#111'
          }}>M</div>

          {/* Negative Indicator - Hexagon */}
          <div style={{ 
            opacity: negative ? 1 : 0.1,
            width: '16px',
            height: '5px', // Squished height
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <svg viewBox="0 0 100 86.6" width="100%" height="100%" style={{ fill: '#111' }} preserveAspectRatio="none">
              <polygon points="25,0 75,0 100,43.3 75,86.6 25,86.6 0,43.3" />
            </svg>
          </div>

          {/* Error Indicator */}
          <div style={{ 
            opacity: error ? 1 : 0.1, 
            fontSize: '12px', 
            fontWeight: 600,
            fontFamily: 'sans-serif',
            color: '#111'
          }}>E</div>
        </div>
      </div>
    </div>
  );
};

export default RetroScreen;
