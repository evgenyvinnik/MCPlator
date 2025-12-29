/**
 * @fileoverview Streaming message component with thinking indicator.
 *
 * Displays the currently streaming AI response with
 * animated thinking dots.
 *
 * @module components/chat/StreamingMessage
 */

import { Card } from '../ui/Card';

interface StreamingMessageProps {
  /** The streaming text content */
  text: string;
  /** Whether the AI is currently thinking */
  isThinking?: boolean;
  /** Whether in mobile layout mode */
  isMobile?: boolean;
}

/**
 * Displays a streaming message with optional thinking indicator.
 *
 * Features:
 * - Real-time text display
 * - Pulsing dots animation when thinking
 */
export function StreamingMessage({
  text,
  isThinking = false,
  isMobile = false,
}: StreamingMessageProps) {
  return (
    <div className="flex justify-start">
      <Card
        className={`max-w-[85%] ${isMobile ? 'p-4' : 'p-3'} backdrop-blur-lg border-0 shadow-xl bg-white/10 text-white border border-white/20`}
      >
        <p
          className={`${isMobile ? 'text-lg' : 'text-base'} break-words overflow-hidden`}
        >
          {text}
        </p>
        {isThinking && (
          <div className="flex items-center gap-1 mt-2">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse [animation-delay:0.2s]"></div>
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse [animation-delay:0.4s]"></div>
          </div>
        )}
      </Card>
    </div>
  );
}
