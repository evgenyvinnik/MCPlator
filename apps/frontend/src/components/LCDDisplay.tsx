import React from 'react';
import { useCalculatorStore } from '../state/useCalculatorStore';

export const LCDDisplay: React.FC = () => {
  const { display } = useCalculatorStore();
  const { text, indicators } = display;

  return (
    <div className="bg-[#9ea792] p-4 rounded mb-4 font-mono border-4 border-gray-600 shadow-inner relative">
      <div className="h-16 flex items-end justify-end text-4xl tracking-widest text-black overflow-hidden">
        {text}
      </div>
      <div className="flex justify-between text-xs mt-1 text-black opacity-80">
        <span className={indicators.error ? 'font-bold' : 'opacity-20'}>E</span>
        <span className={indicators.memory ? 'font-bold' : 'opacity-20'}>
          M
        </span>
        <span className={indicators.constant ? 'font-bold' : 'opacity-20'}>
          K
        </span>
        <span className={indicators.op ? 'font-bold' : 'opacity-20'}>
          {indicators.op === 'add' && '+'}
          {indicators.op === 'sub' && '-'}
          {indicators.op === 'mul' && '×'}
          {indicators.op === 'div' && '÷'}
        </span>
      </div>
    </div>
  );
};
