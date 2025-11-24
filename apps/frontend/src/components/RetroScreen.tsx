import React from 'react';

type RetroScreenProps = {
  value: string | number;
  memory: boolean;
  error: boolean;
  negative: boolean;
};

const RetroScreen: React.FC<RetroScreenProps> = ({ value, memory }) => {
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
          padding: '16px 6px',
          borderRadius: '4px',
          boxShadow: '0px 2px 3px 3px rgba(255, 255, 255, 0.3), -1px -3px 1px 3px rgba(0, 0, 0, 0.55)',
          background: 'linear-gradient(to bottom, #c3ced0 30%, #dbe2ea 100%)',
          textAlign: 'right'
        }}
      >
        <span 
          style={{ 
            fontFamily: 'digit',
            fontSize: '70px'
          }}
        >
          {value}
        </span>
        {memory && (
          <span 
            style={{
              position: 'absolute',
              top: '24px',
              left: '0px',
              width: '24px',
              textAlign: 'center',
              fontSize: '13px',
              fontWeight: 600,
              fontStyle: 'italic',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              lineHeight: '0.8'
            }}
          >
            <div>M</div>
            <div>&#x029EB;</div>
            <div>E</div>
          </span>
        )}
      </div>
    </div>
  );
};

export default RetroScreen;
