import React from 'react';
import { useCalculatorStore } from '../state/useCalculatorStore';
import type { KeyId } from '@calculator/shared-types';

const keys: { id: KeyId; label: string; className?: string }[] = [
  { id: 'mc', label: 'MC' },
  { id: 'mr', label: 'MR' },
  { id: 'm_minus', label: 'M-' },
  { id: 'm_plus', label: 'M+' },
  { id: 'percent', label: '%' },
  { id: 'div', label: '÷' },
  { id: 'digit_7', label: '7' },
  { id: 'digit_8', label: '8' },
  { id: 'digit_9', label: '9' },
  { id: 'mul', label: '×' },
  { id: 'digit_4', label: '4' },
  { id: 'digit_5', label: '5' },
  { id: 'digit_6', label: '6' },
  { id: 'sub', label: '-' },
  { id: 'digit_1', label: '1' },
  { id: 'digit_2', label: '2' },
  { id: 'digit_3', label: '3' },
  { id: 'add', label: '+' },
  { id: 'ac', label: 'AC', className: 'bg-red-400 hover:bg-red-500' },
  { id: 'digit_0', label: '0' },
  { id: 'decimal', label: '.' },
  { id: 'equals', label: '=', className: 'col-span-1 bg-blue-400 hover:bg-blue-500' },
];

export const Keypad: React.FC = () => {
  const { pressKey, pressedKey } = useCalculatorStore();

  return (
    <div className="grid grid-cols-4 gap-3">
      {keys.map((k) => (
        <button
          key={k.id}
          className={`
            h-12 rounded shadow active:shadow-none active:translate-y-0.5 transition-all
            flex items-center justify-center font-bold text-lg
            ${k.className || 'bg-gray-200 hover:bg-gray-300 text-gray-800'}
            ${pressedKey === k.id ? 'bg-yellow-200 scale-95' : ''}
          `}
          onClick={() => pressKey(k.id)}
        >
          {k.label}
        </button>
      ))}
    </div>
  );
};
