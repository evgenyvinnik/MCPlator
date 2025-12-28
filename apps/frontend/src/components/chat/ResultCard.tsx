/**
 * @fileoverview Result card component for displaying calculator results.
 *
 * Shows the result of a calculation with optional debug panel
 * that reveals which keys the LLM pressed.
 *
 * @module components/chat/ResultCard
 */

import { useState } from 'react';
import { Bug, X } from 'lucide-react';
import { Card } from '../ui/Card';
import type { KeyId } from '@calculator/shared-types';

/**
 * Maps KeyId to a human-readable label for the debug panel.
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

interface ResultCardProps {
  /** The result text to display */
  text: string;
  /** Array of keys pressed by the LLM */
  keys?: KeyId[];
  /** Whether in mobile layout mode */
  isMobile?: boolean;
}

/**
 * Displays a calculator result with optional debug panel.
 *
 * Features:
 * - Gradient border styling
 * - Debug icon that appears on hover (desktop) or always visible (mobile)
 * - Expandable panel showing pressed keys
 */
export function ResultCard({ text, keys, isMobile = false }: ResultCardProps) {
  const [isDebugOpen, setIsDebugOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const hasKeys = keys && keys.length > 0;

  return (
    <div
      className="max-w-[85%] flex items-start gap-2 group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        style={{
          padding: '2px',
          borderRadius: '1rem',
          background: 'linear-gradient(135deg, #222370ff, #391885ff, #066475ff)',
        }}
      >
        <Card
          className={`${isMobile ? 'p-4' : 'p-3'} backdrop-blur-lg border-0 shadow-xl bg-gradient-to-r from-indigo-950 via-purple-950 to-blue-950`}
          style={{ borderRadius: 'calc(1rem - 2px)' }}
        >
          <p
            className={`${isMobile ? 'text-lg' : 'text-sm'} text-indigo-300 uppercase tracking-wider mb-1`}
          >
            Result
          </p>
          <p
            className={`${isMobile ? 'text-3xl' : 'text-2xl'} font-bold text-white font-mono break-words overflow-hidden`}
          >
            {text}
          </p>

          {/* Debug panel - slides out when open */}
          {isDebugOpen && hasKeys && (
            <div className="mt-3 pt-3 border-t border-indigo-500/30 animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between mb-2">
                <p
                  className={`${isMobile ? 'text-base' : 'text-xs'} text-indigo-400 uppercase tracking-wider`}
                >
                  Keys Pressed
                </p>
                <button
                  onClick={() => setIsDebugOpen(false)}
                  className="p-1 rounded-full hover:bg-indigo-500/30 transition-colors"
                  aria-label="Close debug panel"
                >
                  <X
                    className={`${isMobile ? 'w-4 h-4' : 'w-3 h-3'} text-indigo-400`}
                  />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {keys.map((key, index) => (
                  <span
                    key={index}
                    className={`${isMobile ? 'px-3 py-1.5 text-base' : 'px-2 py-1 text-sm'} bg-indigo-500/20 border border-indigo-500/40 rounded-md text-indigo-200 font-mono`}
                  >
                    {keyIdToLabel[key] || key}
                  </span>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Debug icon - appears on hover (desktop) or always visible (mobile) */}
      {hasKeys && (
        <button
          onClick={() => setIsDebugOpen((prev) => !prev)}
          className={`p-1.5 rounded-full transition-all duration-200 flex-shrink-0 ${
            isDebugOpen
              ? 'bg-indigo-500/50 opacity-100'
              : 'bg-indigo-500/30 hover:bg-indigo-500/50'
          } ${
            isMobile || isHovered || isDebugOpen ? 'opacity-100' : 'opacity-0'
          }`}
          aria-label="Show debug info"
        >
          <Bug
            className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} text-indigo-200`}
          />
        </button>
      )}
    </div>
  );
}
