/**
 * @fileoverview Debug panel component showing pressed calculator keys.
 *
 * Displays a list of keys that the LLM pressed to arrive at a result.
 * Handles wrapping for long sequences of keys.
 *
 * @module components/chat/DebugPanel
 */

import { X } from 'lucide-react';
import { KEY_LABELS } from '../../types/keyMetadata';
import type { KeyId } from '../../types/calculator';

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
export function DebugPanel({
  keys,
  onClose,
  isMobile = false,
}: DebugPanelProps) {
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
            {KEY_LABELS[key] || key}
          </span>
        ))}
      </div>
    </div>
  );
}
