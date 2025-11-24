import React from 'react';
import { LCDDisplay } from './LCDDisplay';
import { Keypad } from './Keypad';

export const CalculatorSurface: React.FC = () => {
  return (
    <div className="bg-gray-800 p-6 rounded-xl shadow-2xl max-w-sm mx-auto border-b-8 border-r-8 border-gray-900">
      <div className="flex justify-between items-center mb-4 text-gray-400 text-xs uppercase tracking-widest">
        <span>Casio-LLM</span>
        <span>12 Digits</span>
      </div>
      <LCDDisplay />
      <Keypad />
    </div>
  );
};
