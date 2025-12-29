/**
 * @fileoverview Debug panel component showing pressed calculator keys.
 *
 * Displays a list of keys that the LLM pressed to arrive at a result.
 * Handles wrapping for long sequences of keys.
 *
 * @module components/chat/DebugPanel
 */

import { X } from 'lucide-react';
import type { KeyId } from '../../types';

/**
 * Maps KeyId to a human-readable label.
 */
const keyIdToLabel: Record<KeyId, string> = {
  digit_0: '0',
  digit_1: '1',
  digit_2: '2',
  digit_3: '3',
  digit_4: '4',
  digit_5: '5',
  digit_6: '6',
  digit_7: '7',
  digit_8: '8',
  digit_9: '9',
  decimal: '.',
  add: '+',
  sub: '−',
  mul: '×',
  div: '÷',
  percent: '%',
  sqrt: '√',
  plus_minus: '±',
  equals: '=',
  ac: 'AC',
  c: 'C',
  mc: 'MC',
  mr: 'MR',
  m_plus: 'M+',
  m_minus: 'M−',
};

interface DebugPanelProps {
  /** Array of keys pressed by the LLM */
  keys: KeyId[];
  /** Callback to close the panel */
  onClose: () => void;
  /** Whether in mobile layout mode */
  isMobile?: boolean;
}

/**
 * Debug panel displaying the sequence of keys pressed.
 *
 * Features:
 * - Wraps keys when there are many
 * - Consistent font sizing for readability
 * - Close button with matching styling
 */
export function DebugPanel({ keys, onClose, isMobile = false }: DebugPanelProps) {
  return (
    <div className="mt-3 pt-3 border-t border-indigo-500/30 animate-in slide-in-from-top-2 duration-200">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-indigo-400 tracking-wider">Keys Pressed</p>
        <button
          onClick={onClose}
          className="p-0.5 rounded-full hover:bg-indigo-500/30 transition-colors"
          aria-label="Close debug panel"
        >
          <X className="w-3.5 h-3.5 text-indigo-400" />
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
        {keys.map((key, index) => (
          <span
            key={index}
            className={`${isMobile ? 'px-2.5 py-1 text-sm' : 'px-2 py-0.5 text-sm'} bg-indigo-500/20 border border-indigo-500/40 rounded-md text-indigo-200 font-mono whitespace-nowrap`}
          >
            {keyIdToLabel[key] || key}
          </span>
        ))}
      </div>
    </div>
  );
}
