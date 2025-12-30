import React from 'react';
import { useCalculatorStore } from '../state/useCalculatorStore';
import { KEY_LABELS } from '../types/keyMetadata';
import type { KeyId } from '../types/calculator';

/**
 * Keypad layout configuration.
 * Uses KeyIds directly - labels are pulled from centralized KEY_LABELS.
 */
const keys: { id: KeyId; className?: string }[] = [
  { id: 'mc' },
  { id: 'mr' },
  { id: 'm_minus' },
  { id: 'm_plus' },
  { id: 'percent' },
  { id: 'div' },
  { id: 'digit_7' },
  { id: 'digit_8' },
  { id: 'digit_9' },
  { id: 'mul' },
  { id: 'digit_4' },
  { id: 'digit_5' },
  { id: 'digit_6' },
  { id: 'sub' },
  { id: 'digit_1' },
  { id: 'digit_2' },
  { id: 'digit_3' },
  { id: 'add' },
  { id: 'ac', className: 'bg-red-400 hover:bg-red-500' },
  { id: 'digit_0' },
  { id: 'decimal' },
  { id: 'equals', className: 'col-span-1 bg-blue-400 hover:bg-blue-500' },
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
          {KEY_LABELS[k.id]}
        </button>
      ))}
    </div>
  );
};
