/**
 * @fileoverview Result card component for displaying calculator results.
 *
 * Shows the result of a calculation with optional debug panel
 * that reveals which keys the LLM pressed.
 *
 * @module components/chat/ResultCard
 */

import { useState } from 'react';
import { Bug } from 'lucide-react';
import { Card } from '../ui/Card';
import { DebugPanel } from './DebugPanel';
import type { KeyId } from '@calculator/shared-types';

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
            className={`${isMobile ? 'text-lg' : 'text-lg'} text-indigo-300 uppercase tracking-wider mb-1`}
          >
            Result
          </p>
          <p
            className={`${isMobile ? 'text-3xl' : 'text-2xl'} font-bold text-white font-mono break-words overflow-hidden`}
          >
            {text}
          </p>

          {isDebugOpen && hasKeys && (
            <DebugPanel
              keys={keys}
              onClose={() => setIsDebugOpen(false)}
              isMobile={isMobile}
            />
          )}
        </Card>
      </div>

      {/* Debug icon - appears on hover (desktop) or always visible (mobile), hidden when panel is open */}
      {hasKeys && !isDebugOpen && (
        <button
          onClick={() => setIsDebugOpen(true)}
          className={`mt-px p-1.5 rounded-full transition-all duration-200 flex-shrink-0 bg-indigo-500/30 hover:bg-indigo-500/50 ${
            isMobile || isHovered ? 'opacity-100' : 'opacity-0'
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
